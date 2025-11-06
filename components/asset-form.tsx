"use client";

import { useState, useEffect } from "react";
import { useForm, FieldValues, SubmitHandler } from "react-hook-form";
import { getMachineByIdAction } from "@/lib/actions/assets";
import RadioButtonGroup from "@/components/ui/radio-button-group";
import { Button } from "./ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import MultiImageUploader, {
  ImageUpload,
} from "@/components/multi-image-uploader";
import { auth, storage } from "@/firebase/client";
import { signInAnonymously } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { submitMachineForm } from "@/lib/actions/assets";
import { useGeolocation } from "@/hooks/useGeolocation";
import {
  statusQuestion,
  statusChoices,
  quantityQuestion,
  quantityChoices,
  placeOptions,
} from "@/data/asset-questions";

interface AssetFormProps {
  bu: string;
  type: string;
  asset: string;
  sub: string;
  isInDialog?: boolean;
}

interface FormData extends FieldValues {
  inspector: string;
  status: string;
  qty: number | string;
  qtyR?: string;
  place: string;
  transferTo?: string;
  remark?: string;
  latitude?: number;
  longitude?: number;
  locationTimestamp?: Date;
  locationAccuracy?: number;
  [key: string]: any;
}

export default function AssetForm({
  bu,
  type,
  asset,
  sub,
  isInDialog = false,
}: AssetFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<FormData>();

  const [assetData, setAssetData] = useState<any>(null);
  const [isLoadingAsset, setIsLoadingAsset] = useState<boolean>(true);
  const [selectedValues, setSelectedValues] = useState<{
    [key: string]: string | null;
  }>({});
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showQty, setShowQty] = useState(false);

  // Combine asset and sub into an id for the actions
  const id = sub ? `${asset}-${sub}` : asset;

  // Use geolocation hook for automatic location capture
  const {
    latitude,
    longitude,
    accuracy,
    error: locationError,
    loading: locationLoading,
    getCurrentLocation,
    hasLocation,
  } = useGeolocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingAsset(true);

        // Fetch asset data
        const assetResult = await getMachineByIdAction(bu, type, id);

        // Handle asset data
        if (assetResult.success && assetResult.machine) {
          setAssetData(assetResult.machine);
        } else {
          console.warn("No asset found:", { bu, type, id });
          setAssetData(null);
        }
      } catch (error) {
        console.error("Error loading asset data:", error);
        toast.error("Failed to load asset data");
        setAssetData(null);
      } finally {
        setIsLoadingAsset(false);
      }
    };

    fetchData();
  }, [bu, type, id]);

  // Automatically request location when component mounts (only once)
  useEffect(() => {
    getCurrentLocation();
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleRadioChange = (questionName: string, value: string) => {
    setSelectedValues((prev) => ({ ...prev, [questionName]: value }));
  };

  const onSubmit: SubmitHandler<FormData> = async (formData) => {
    try {
      // Authenticate anonymously if not already authenticated (for Storage upload)
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (authError: any) {
          console.error("Authentication error:", authError);
          if (authError?.code === "auth/api-key-expired") {
            toast.error(
              "Firebase API key has expired. Please contact administrator to renew the key."
            );
          } else {
            toast.error("Authentication failed. Please try again.");
          }
          return;
        }
      }

      const updatedData: FormData = {
        ...formData,
        ...selectedValues,
        bu,
        type: type.toLowerCase(),
        site: assetData?.site || "", // Include site from asset data
        id,
        // Include location data
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        locationTimestamp: hasLocation ? new Date() : undefined,
        locationAccuracy: accuracy || undefined,
      };

      // Upload images to Firebase Storage
      const imageUrls: string[] = [];

      // Upload general images
      for (let index = 0; index < images.length; index++) {
        const image = images[index];
        if (image.file) {
          try {
            const path = `Asset/${bu}/${type}/${id}/${Date.now()}-${index}-${image.file.name}`;
            const storageRef = ref(storage, path);

            // Upload file and wait for completion
            const uploadTask = uploadBytesResumable(storageRef, image.file);
            await uploadTask;

            // Get download URL after upload completes
            const downloadURL = await getDownloadURL(storageRef);
            imageUrls.push(downloadURL);
          } catch (uploadError) {
            console.error(`Upload error for image ${index}:`, uploadError);
            toast.error(
              `Failed to upload image ${index + 1}. Please try again.`
            );
            return;
          }
        }
      }

      // Save to Firestore using server action
      try {
        const result = await submitMachineForm({
          ...updatedData,
          images: imageUrls,
        });

        if (result.success) {
          toast.success("Form submitted successfully!");
          reset();
          setSelectedValues({});
          setImages([]);

          // Scroll to top and reload the page to show updated data in machine-detail
          window.scrollTo(0, 0);
          window.location.reload();
        } else {
          toast.error(result.error || "Failed to submit form");
        }
      } catch (serverError) {
        console.error("Server action error:", serverError);
        toast.error("Failed to save form data. Please try again.");
      }
    } catch (error) {
      console.error("General error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  // Add loading state while data is being fetched
  if (isLoadingAsset) {
    return (
      <div className={isInDialog ? "" : "max-w-4xl mx-auto p-2"}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              📦 Asset Tracking
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p>Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            📦 Asset Tracking
          </CardTitle>
          {/* Display asset information if available */}
          {assetData && (
            <div className="text-sm text-gray-600 text-center mt-2">
              <p>
                <strong>Asset:</strong> {assetData.asset}-{assetData.sub}
              </p>
              <p>
                <strong>Description:</strong> {assetData.description}
              </p>
              <p>
                <strong>Location:</strong> {assetData.plantLocation}
              </p>
            </div>
          )}
          {/* Location status alert */}
          <div className="text-center text-sm mt-2">
            {locationLoading && (
              <div className="text-blue-600 flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                Getting location...
              </div>
            )}
            {hasLocation && (
              <div className="text-green-700 bg-green-50 px-3 py-1 rounded-md inline-block">
                📍 Location: {latitude!.toFixed(6)}, {longitude!.toFixed(6)}
                {accuracy && (
                  <span className="block text-xs mt-1">
                    Accuracy: ±{Math.round(accuracy)}m
                  </span>
                )}
              </div>
            )}
            {locationError && !locationLoading && (
              <div className="text-red-600 bg-red-50 px-3 py-2 rounded-md">
                <div className="flex items-center justify-between">
                  <div>❌ Location sharing is required for asset tracking</div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    className="ml-3 text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    Try Again
                  </Button>
                </div>
                <p className="text-xs text-red-500 mt-1">
                  Please enable location services in your browser and click "Try
                  Again"
                </p>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Show form only when location is available */}
      {hasLocation ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Inspector Name */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="inspector" className="text-lg font-semibold">
                  ผู้ตรวจสอบ Inspector
                </Label>
                <Input
                  {...register("inspector", {
                    required: "Inspector name is required",
                  })}
                  type="text"
                  placeholder="ผู้ตรวจสอบ Inspector"
                  className="w-full"
                />
                {errors.inspector && (
                  <p className="text-red-500 text-sm">
                    {errors.inspector.message as string}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Question 1: Asset Status */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="text-xl font-semibold">
                  {statusQuestion.id}. {statusQuestion.question}
                </div>
                {statusQuestion.howto && (
                  <p className="text-sm text-gray-500">
                    วิธีการตรวจสอบ: {statusQuestion.howto}
                  </p>
                )}
                {statusQuestion.accept && (
                  <p className="text-sm text-gray-500">
                    เกณฑ์การยอมรับ: {statusQuestion.accept}
                  </p>
                )}
                <RadioButtonGroup
                  register={register}
                  questionName="status"
                  handleRadioChange={(name, value) => {
                    handleRadioChange(name, value);
                    setShowTransfer(value === "Exist-Waiting Transfer");
                  }}
                  choices={statusChoices}
                />
              </div>
            </CardContent>
          </Card>

          {/* Conditional Transfer To field */}
          {showTransfer && (
            <Card className="bg-yellow-50 border-yellow-300">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label htmlFor="transferTo" className="text-lg font-semibold">
                    Transfer to:
                  </Label>
                  <Select
                    onValueChange={(value) => {
                      setValue("transferTo", value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="กรุณาเลือกสถานที่โอนย้าย" />
                    </SelectTrigger>
                    <SelectContent>
                      {placeOptions.map((place) => (
                        <SelectItem key={place} value={place}>
                          {place}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.transferTo && (
                    <p className="text-red-500 text-sm">
                      {errors.transferTo.message as string}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Question 2: Quantity */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="text-xl font-semibold">
                  {quantityQuestion.id}. {quantityQuestion.question}
                </div>
                {quantityQuestion.howto && (
                  <p className="text-sm text-gray-500">
                    วิธีการตรวจสอบ: {quantityQuestion.howto}
                  </p>
                )}
                {quantityQuestion.accept && (
                  <p className="text-sm text-gray-500">
                    เกณฑ์การยอมรับ: {quantityQuestion.accept}
                  </p>
                )}
                <RadioButtonGroup
                  register={register}
                  questionName="qty"
                  handleRadioChange={(name, value) => {
                    handleRadioChange(name, value);
                    setShowQty(value === "3up");
                  }}
                  choices={quantityChoices}
                />
              </div>
            </CardContent>
          </Card>

          {/* Conditional Quantity input */}
          {showQty && (
            <Card className="bg-rose-50 border-rose-300">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label htmlFor="qtyR" className="text-lg font-semibold">
                    จำนวนที่มากกว่า 3 ให้คีย์ด้านล่าง
                  </Label>
                  <Input
                    {...register("qtyR", {
                      required: showQty ? "กรุณาระบุจำนวน" : false,
                    })}
                    type="number"
                    min="4"
                    placeholder="จำนวนที่มากกว่า 3"
                    className="w-full"
                  />
                  {errors.qtyR && (
                    <p className="text-red-500 text-sm">
                      {errors.qtyR.message as string}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Question 3: Place/Location */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="place" className="text-lg font-semibold">
                  3. ชื่อหน่วยผลิต/หรือสำนักงาน ที่ทรัพย์สินตั้งอยู่
                </Label>
                <Select
                  onValueChange={(value) => {
                    setValue("place", value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="กรุณาเลือกสถานที่" />
                  </SelectTrigger>
                  <SelectContent>
                    {placeOptions.map((place) => (
                      <SelectItem key={place} value={place}>
                        {place}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.place && (
                  <p className="text-red-500 text-sm">
                    {errors.place.message as string}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Label className="text-lg font-semibold">
                  4. แนบรูปภาพ Attach Image
                </Label>
                <MultiImageUploader
                  images={images}
                  onImagesChange={setImages}
                  urlFormatter={(image) => {
                    if (!image.file) {
                      return `https://firebasestorage.googleapis.com/v0/b/sccc-inseesafety-prod.firebasestorage.app/o/${encodeURIComponent(
                        image.url
                      )}?alt=media`;
                    }
                    return image.url;
                  }}
                  compressionType="general"
                />
              </div>
            </CardContent>
          </Card>

          {/* Optional Remark */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="remark" className="text-lg font-semibold">
                  หมายเหตุ Remark
                </Label>
                <Input
                  {...register("remark")}
                  type="text"
                  placeholder="หมายเหตุ Remark"
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg"
          >
            {isSubmitting ? "กำลังส่ง Submitting..." : "กดปุ่ม Submit"}
          </Button>
        </form>
      ) : (
        /* Show location requirement when form is hidden */
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📍</div>
              <h3 className="text-xl font-semibold text-red-800 mb-2">
                Location Required for Asset Tracking
              </h3>
              <p className="text-red-700 mb-6 max-w-md mx-auto">
                Asset tracking requires your current location for accurate
                record keeping. Please enable location sharing to continue with
                the tracking form.
              </p>
              <div className="space-y-3">
                <Button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-full"
                >
                  {locationLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Getting Location...
                    </>
                  ) : (
                    <>📍 Enable Location Sharing</>
                  )}
                </Button>
                <p className="text-sm text-red-600">
                  Make sure location services are enabled in your browser
                  settings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
