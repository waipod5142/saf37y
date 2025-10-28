"use client";

import { useState, useEffect } from "react";
import { useForm, FieldValues, SubmitHandler } from "react-hook-form";
import { getMachineQuestions } from "@/lib/actions/forms";
import { getVocabulary } from "@/lib/actions/vocabulary";
import { getMachineByIdAction } from "@/lib/actions/machines";
import { Vocabulary } from "@/types/vocabulary";
import { Button } from "./ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import MultiMediaUploader, {
  MediaUpload,
} from "@/components/multi-media-uploader";
import { auth, storage } from "@/firebase/client";
import { signInAnonymously } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { submitMachineForm } from "@/lib/actions/machines";
import { useGeolocation } from "@/hooks/useGeolocation";
import { getSafetyStatByPlantId } from "@/lib/actions/safetystat";

interface MachineFormProps {
  bu: string;
  type: string;
  id: string;
  isInDialog?: boolean;
}

interface FormData extends FieldValues {
  lastAccident: string;
  operatedDays: number;
  target: number;
  bestRecord: number;
  remark?: string;
  latitude?: number;
  longitude?: number;
  locationTimestamp?: Date;
  locationAccuracy?: number;
  [key: string]: any;
}

// Campaign configuration
const CAMPAIGN_START_DATE = "2024-01-01";
const CAMPAIGN_END_DATE = "2026-12-31";
const CAMPAIGN_TITLE = "Safety First Campaign";
const CAMPAIGN_DESCRIPTION = "3-Year Safety Culture Promotion Campaign";
const CAMPAIGN_DURATION_YEARS = 3;

export default function MachineFormStat({
  bu,
  type,
  id,
  isInDialog = false,
}: MachineFormProps) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<FormData>();

  const [formTitle, setFormTitle] = useState<string | null>(null);
  const [formEmoji, setFormEmoji] = useState<string | null>(null);
  const [vocabulary, setVocabulary] = useState<Vocabulary | null>(null);
  const [isLoadingVocabulary, setIsLoadingVocabulary] = useState<boolean>(true);
  const [machineSite, setMachineSite] = useState<string | undefined>(undefined);
  const [images, setImages] = useState<MediaUpload[]>([]);
  const [calculatedDays, setCalculatedDays] = useState<number>(0);
  const [plantData, setPlantData] = useState<any>(null);
  const [isPlantFound, setIsPlantFound] = useState<boolean>(false);

  const lastAccidentDate = watch("lastAccident");

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
        setIsLoadingVocabulary(true);

        // Fetch title, vocabulary, and machine data in parallel
        const [questionsResult, vocabularyResult, machineResult] =
          await Promise.all([
            getMachineQuestions(bu, type),
            getVocabulary(bu),
            getMachineByIdAction(bu, type, id),
          ]);

        // Handle title and emoji
        if (questionsResult.success) {
          setFormTitle(questionsResult.title || null);
          setFormEmoji(questionsResult.emoji || null);
        } else {
          console.warn("No form data found for machine:", { bu, type });
          setFormTitle(null);
          setFormEmoji(null);
        }

        // Handle vocabulary
        if (vocabularyResult.success && vocabularyResult.vocabulary) {
          setVocabulary(vocabularyResult.vocabulary);
        } else {
          console.warn("No vocabulary found for business unit:", bu);
          setVocabulary(null);
        }

        // Handle machine data (for site field)
        if (machineResult.success && machineResult.machine) {
          setMachineSite(machineResult.machine.site);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load form data");
        setFormTitle(null);
        setFormEmoji(null);
        setVocabulary(null);
      } finally {
        setIsLoadingVocabulary(false);
      }
    };

    fetchData();
  }, [bu, type, id]);

  // Automatically request location when component mounts
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Load plant data and auto-populate fields
  useEffect(() => {
    const loadPlantData = async () => {
      const campaignStart = new Date(CAMPAIGN_START_DATE);
      const campaignEnd = new Date(CAMPAIGN_END_DATE);
      const today = new Date();

      // Calculate days from campaign start
      const diffTime = Math.abs(today.getTime() - campaignStart.getTime());
      const campaignDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Calculate target days (from today to campaign end)
      const targetTime = Math.abs(campaignEnd.getTime() - today.getTime());
      const targetDays = Math.ceil(targetTime / (1000 * 60 * 60 * 24));

      // Fetch plant safety statistics from Firestore
      const result = await getSafetyStatByPlantId(id);
      const plantInfo = result.success ? result.data : undefined;

      if (plantInfo) {
      // Plant found in data
      setIsPlantFound(true);
      setPlantData(plantInfo);

      // Auto-populate fields
      const lastAccident = plantInfo.lastAccidentDate
        ? new Date(plantInfo.lastAccidentDate)
        : new Date(CAMPAIGN_START_DATE);

      const lastAccidentStr = lastAccident.toISOString().split("T")[0];
      setValue("lastAccident", lastAccidentStr);

      // Calculate operated days
      const opDays = Math.ceil(
        (today.getTime() - lastAccident.getTime()) / (1000 * 60 * 60 * 24)
      );
      setCalculatedDays(opDays);
      setValue("operatedDays", opDays);

      // Set target (calculated from today to campaign end)
      setValue("target", targetDays);

      // Calculate best record
      const calculatedBestRecord = Math.max(campaignDays, opDays);
      let bestRec = 0;

      if (plantInfo.bestRecord !== null && plantInfo.bestRecord !== undefined) {
        // Use the higher value between manual best record and calculated value
        // This ensures we never show a lower value than current reality
        bestRec = Math.max(plantInfo.bestRecord, calculatedBestRecord);
      } else {
        // Auto-calculate: max of campaign days or operated days
        bestRec = calculatedBestRecord;
      }
      setValue("bestRecord", bestRec);
      } else {
        // Plant not found - use campaign start date
        setIsPlantFound(false);
        const campaignStartStr = new Date(CAMPAIGN_START_DATE)
          .toISOString()
          .split("T")[0];
        setValue("lastAccident", campaignStartStr);
        setValue("operatedDays", campaignDays);
        setValue("target", targetDays);
        setValue("bestRecord", campaignDays);
        setCalculatedDays(campaignDays);
      }
    };

    loadPlantData();
  }, [id, setValue]);

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
        bu,
        type: type.toLowerCase(),
        id,
        site: machineSite || undefined,
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
            const path = `Machine/${bu}/${type}/${id}/${Date.now()}-${index}-${image.file.name}`;
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
          setImages([]);
          setCalculatedDays(0);

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

  // Get the title for the current machine type
  const getTitle = () => {
    if (formTitle) {
      return formTitle;
    }
    // Fallback if no dynamic title is available
    return "สถิติความปลอดภัย Safety Statistics";
  };

  // Get translation text with fallback
  const getTranslation = (key: string, fallback: string): string => {
    if (vocabulary && vocabulary[key as keyof Vocabulary]) {
      return vocabulary[key as keyof Vocabulary] as string;
    }
    return fallback;
  };

  // Add loading state while data is being fetched
  if (isLoadingVocabulary) {
    return (
      <div className={isInDialog ? "" : "max-w-4xl mx-auto p-2"}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              {formEmoji && <span className="mr-2">{formEmoji}</span>}
              {getTitle()}
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
            {formEmoji && <span className="mr-2">{formEmoji}</span>}
            {getTitle()}
          </CardTitle>
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
                  <div>
                    ❌ Location sharing is required for machine inspections
                  </div>
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
          {/* Campaign Information Banner */}
          <Card className="bg-gradient-to-r from-green-100 to-blue-100 border-2 border-green-600">
            <CardContent className="pt-4 pb-4">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-xl font-bold text-green-800">
                  <span>🛡️</span>
                  <span>{CAMPAIGN_TITLE}</span>
                  <span>🛡️</span>
                </div>
                <p className="text-sm text-gray-700">
                  {CAMPAIGN_DESCRIPTION}
                </p>
                <p className="text-sm font-semibold text-green-700">
                  📅 Campaign Period: {CAMPAIGN_START_DATE} to{" "}
                  {CAMPAIGN_END_DATE} ({CAMPAIGN_DURATION_YEARS} years)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Board Display */}
          <Card className="bg-white border-4 border-green-600">
            <CardContent className="pt-6">
              {/* Header with logos */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-green-600">
                <div className="w-20 h-20 flex items-center justify-center">
                  <img
                    src="/SCCC.BK.svg"
                    alt="SCCC Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 text-center">
                  <h2 className="text-2xl font-bold text-green-700">
                    สถิติความปลอดภัย
                  </h2>
                  <h3 className="text-xl font-bold text-green-700">
                    SAFETY FIRST
                  </h3>
                </div>
                <div className="w-20 h-20 text-5xl flex items-center justify-center">
                  🛡️
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="space-y-4">
                {/* Row 1: Last Accident Date */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6">
                    <p className="text-sm font-semibold text-red-600">
                      เกิดอุบัติเหตุครั้งสุดท้ายเมื่อ
                    </p>
                    <p className="text-xs font-semibold text-red-600">
                      LAST ACCIDENT OCCURRED
                    </p>
                  </div>
                  <div className="col-span-6 flex items-center justify-end gap-1">
                    {(() => {
                      // Check if plant was found and has no accident date in JSON
                      // This includes: lastAccidentDate: null, missing field, OR plant not in JSON
                      const hasNoAccidentInJson =
                        !isPlantFound || // Plant ID not found in JSON at all
                        (plantData &&
                          (plantData.lastAccidentDate === null ||
                            plantData.lastAccidentDate === undefined ||
                            !plantData.lastAccidentDate));

                      if (hasNoAccidentInJson) {
                        // Show "-" in all boxes when no accident date in JSON
                        return (
                          <>
                            <div className="flex gap-1">
                              {Array(2)
                                .fill(0)
                                .map((_, idx) => (
                                  <div
                                    key={`d-${idx}`}
                                    className="w-10 h-10 border-2 border-gray-800 flex items-center justify-center text-2xl font-bold bg-white"
                                  >
                                    -
                                  </div>
                                ))}
                            </div>
                            <span className="text-2xl font-bold">/</span>
                            <div className="flex gap-1">
                              {Array(2)
                                .fill(0)
                                .map((_, idx) => (
                                  <div
                                    key={`m-${idx}`}
                                    className="w-10 h-10 border-2 border-gray-800 flex items-center justify-center text-2xl font-bold bg-white"
                                  >
                                    -
                                  </div>
                                ))}
                            </div>
                            <span className="text-2xl font-bold">/</span>
                            <div className="flex gap-1">
                              {Array(2)
                                .fill(0)
                                .map((_, idx) => (
                                  <div
                                    key={`y-${idx}`}
                                    className="w-10 h-10 border-2 border-gray-800 flex items-center justify-center text-2xl font-bold bg-white"
                                  >
                                    -
                                  </div>
                                ))}
                            </div>
                          </>
                        );
                      }

                      if (!lastAccidentDate) {
                        return (
                          <>
                            <div className="flex gap-1">
                              {Array(2)
                                .fill(0)
                                .map((_, idx) => (
                                  <div
                                    key={`d-${idx}`}
                                    className="w-10 h-10 border-2 border-gray-800 flex items-center justify-center text-2xl font-bold bg-white"
                                  />
                                ))}
                            </div>
                            <span className="text-2xl font-bold">/</span>
                            <div className="flex gap-1">
                              {Array(2)
                                .fill(0)
                                .map((_, idx) => (
                                  <div
                                    key={`m-${idx}`}
                                    className="w-10 h-10 border-2 border-gray-800 flex items-center justify-center text-2xl font-bold bg-white"
                                  />
                                ))}
                            </div>
                            <span className="text-2xl font-bold">/</span>
                            <div className="flex gap-1">
                              {Array(2)
                                .fill(0)
                                .map((_, idx) => (
                                  <div
                                    key={`y-${idx}`}
                                    className="w-10 h-10 border-2 border-gray-800 flex items-center justify-center text-2xl font-bold bg-white"
                                  />
                                ))}
                            </div>
                          </>
                        );
                      }

                      // Convert YYYY-MM-DD to DD/MM/YY format
                      const [year, month, day] = lastAccidentDate.split("-");
                      const yy = year.slice(-2); // Get last 2 digits of year

                      return (
                        <>
                          {/* Day */}
                          <div className="flex gap-1">
                            {day.split("").map((digit, idx) => (
                              <div
                                key={`d-${idx}`}
                                className="w-10 h-10 border-2 border-gray-800 flex items-center justify-center text-2xl font-bold bg-white"
                              >
                                {digit}
                              </div>
                            ))}
                          </div>
                          <span className="text-2xl font-bold">/</span>
                          {/* Month */}
                          <div className="flex gap-1">
                            {month.split("").map((digit, idx) => (
                              <div
                                key={`m-${idx}`}
                                className="w-10 h-10 border-2 border-gray-800 flex items-center justify-center text-2xl font-bold bg-white"
                              >
                                {digit}
                              </div>
                            ))}
                          </div>
                          <span className="text-2xl font-bold">/</span>
                          {/* Year */}
                          <div className="flex gap-1">
                            {yy.split("").map((digit, idx) => (
                              <div
                                key={`y-${idx}`}
                                className="w-10 h-10 border-2 border-gray-800 flex items-center justify-center text-2xl font-bold bg-white"
                              >
                                {digit}
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Row 2: Operated Days */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6">
                    <p className="text-sm font-semibold">
                      เรามีการปฏิบัติงานมา
                    </p>
                    <p className="text-xs font-semibold">WE HAVE OPERATED</p>
                  </div>
                  <div className="col-span-4 grid grid-cols-4 gap-1">
                    {calculatedDays
                      .toString()
                      .padStart(4, " ")
                      .split("")
                      .map((digit, idx) => (
                        <div
                          key={idx}
                          className="aspect-square border-2 border-gray-800 flex items-center justify-center text-2xl font-bold bg-white"
                        >
                          {digit !== " " ? digit : ""}
                        </div>
                      ))}
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <span className="text-sm font-semibold">
                      วัน
                      <br />
                      DAYS
                    </span>
                  </div>
                </div>

                {/* Row 3: Target */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6">
                    <p className="text-sm font-semibold">เป้าหมาย</p>
                    <p className="text-xs font-semibold">TARGET</p>
                  </div>
                  <div className="col-span-4 grid grid-cols-4 gap-1">
                    {watch("target")
                      ?.toString()
                      .padStart(4, " ")
                      .split("")
                      .map((digit, idx) => (
                        <div
                          key={idx}
                          className="aspect-square border-2 border-gray-800 flex items-center justify-center text-2xl font-bold bg-white"
                        >
                          {digit !== " " ? digit : ""}
                        </div>
                      ))}
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <span className="text-sm font-semibold">
                      วัน
                      <br />
                      DAYS
                    </span>
                  </div>
                </div>

                {/* Row 4: Best Record */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6">
                    <p className="text-sm font-semibold">
                      บันทึกที่ดีที่สุดของเราคือปฏิบัติงานปลอดภัยมาแล้ว
                    </p>
                    <p className="text-xs font-semibold">THE BEST RECORD</p>
                  </div>
                  <div className="col-span-4 grid grid-cols-4 gap-1">
                    {watch("bestRecord")
                      ?.toString()
                      .padStart(4, " ")
                      .split("")
                      .map((digit, idx) => (
                        <div
                          key={idx}
                          className="aspect-square border-2 border-gray-800 flex items-center justify-center text-2xl font-bold bg-white"
                        >
                          {digit !== " " ? digit : ""}
                        </div>
                      ))}
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <span className="text-sm font-semibold">
                      วัน
                      <br />
                      DAYS
                    </span>
                  </div>
                </div>
              </div>

              {/* Plant Status Info */}
              <div className="mt-4 pt-4 border-t-2 border-gray-300">
                {isPlantFound ? (
                  <div className="bg-green-50 p-3 rounded-md">
                    <p className="text-sm font-semibold text-green-700">
                      ✓ Plant ID: {id} - Data loaded from safety records
                    </p>
                    {plantData?.notes && (
                      <p className="text-xs text-green-600 mt-1">
                        Note: {plantData.notes}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm font-semibold text-blue-700">
                      ℹ️ Plant ID: {id} - Not found in safety data records
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Last accident date shows "--/--/--" (no accident history). Using campaign start date ({CAMPAIGN_START_DATE}) as baseline for calculations.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Hidden fields for form submission */}
          <input type="hidden" {...register("lastAccident")} />
          <input type="hidden" {...register("operatedDays")} />
          <input type="hidden" {...register("target")} />
          <input type="hidden" {...register("bestRecord")} />

          {/* Images Upload */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Label className="text-lg font-semibold">
                  แนบรูปภาพ (ไม่บังคับ) / Upload Images/Videos (Optional)
                </Label>

                <MultiMediaUploader
                  media={images}
                  onMediaChange={setImages}
                  urlFormatter={(media) => {
                    if (!media.file) {
                      return `https://firebasestorage.googleapis.com/v0/b/sccc-inseesafety-prod.firebasestorage.app/o/${encodeURIComponent(
                        media.url
                      )}?alt=media`;
                    }
                    return media.url;
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
                  หมายเหตุ (Optional) / Remark (Optional)
                </Label>
                <Input
                  {...register("remark")}
                  type="text"
                  placeholder="Remark (Optional)"
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full shadow-lg"
          >
            {isSubmitting
              ? "Submitting..."
              : getTranslation("submit", "Submit")}
          </Button>
        </form>
      ) : (
        /* Show location requirement when form is hidden */
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📍</div>
              <h3 className="text-xl font-semibold text-red-800 mb-2">
                Location Required for Machine Inspection
              </h3>
              <p className="text-red-700 mb-6 max-w-md mx-auto">
                Machine inspection requires your current location for accurate
                record keeping. Please enable location sharing to continue with
                the inspection form.
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
