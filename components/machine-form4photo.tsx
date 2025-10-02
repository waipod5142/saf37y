"use client";

import { useState, useEffect } from "react";
import { useForm, FieldValues, SubmitHandler } from "react-hook-form";
import { getMachineQuestions } from "@/lib/actions/forms";
import { getVocabulary } from "@/lib/actions/vocabulary";
import { getMachineByIdAction } from "@/lib/actions/machines";
import { Vocabulary, Choice } from "@/types/vocabulary";
import { Button } from "./ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import MultiImageUploader, { ImageUpload } from "@/components/multi-image-uploader";
import { auth, storage } from "@/firebase/client";
import { signInAnonymously } from "firebase/auth";
import { ref, uploadBytesResumable, UploadTask, getDownloadURL } from "firebase/storage";
import { submitMachineForm } from "@/lib/actions/machines";
import { useGeolocation } from "@/hooks/useGeolocation";

interface MachineForm4photoProps {
  bu: string;
  type: string;
  id: string;
}

interface FormData extends FieldValues {
  inspector: string;
  latitude?: number;
  longitude?: number;
  locationTimestamp?: Date;
  locationAccuracy?: number;
  [key: string]: any;
}

export default function MachineForm4photo({ bu, type, id }: MachineForm4photoProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>();

  const [formTitle, setFormTitle] = useState<string | null>(null);
  const [formEmoji, setFormEmoji] = useState<string | null>(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(true);
  const [vocabulary, setVocabulary] = useState<Vocabulary | null>(null);
  const [isLoadingVocabulary, setIsLoadingVocabulary] = useState<boolean>(true);
  const [machineSite, setMachineSite] = useState<string | undefined>(undefined);

  // Multi-image states for each direction
  const [frontImages, setFrontImages] = useState<ImageUpload[]>([]);
  const [rightImages, setRightImages] = useState<ImageUpload[]>([]);
  const [backImages, setBackImages] = useState<ImageUpload[]>([]);
  const [leftImages, setLeftImages] = useState<ImageUpload[]>([]);

  // Use geolocation hook for automatic location capture
  const {
    latitude,
    longitude,
    accuracy,
    error: locationError,
    loading: locationLoading,
    getCurrentLocation,
    hasLocation
  } = useGeolocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingQuestions(true);
        setIsLoadingVocabulary(true);

        // Fetch title from forms collection, vocabulary, and machine data in parallel
        const [questionsResult, vocabularyResult, machineResult] = await Promise.all([
          getMachineQuestions(bu, type),
          getVocabulary(bu),
          getMachineByIdAction(bu, type, id)
        ]);

        if (questionsResult.success) {
          if (questionsResult.title) {
            setFormTitle(questionsResult.title);
          }
          if (questionsResult.emoji) {
            setFormEmoji(questionsResult.emoji);
          }
        } else {
          console.warn("No form data found for machine:", { bu, type });
          setFormTitle("Mixerphoto Inspection - ถ่ายรูปรถโม่ 4 ด้าน");
        }

        if (vocabularyResult.success && vocabularyResult.vocabulary) {
          setVocabulary(vocabularyResult.vocabulary);
        }

        // Handle machine data (for site field)
        if (machineResult.success && machineResult.machine) {
          setMachineSite(machineResult.machine.site);
        }
      } catch (error) {
        console.error("Error loading form data:", error);
        setFormTitle("Mixerphoto Inspection - ถ่ายรูปรถโม่ 4 ด้าน");
      } finally {
        setIsLoadingQuestions(false);
        setIsLoadingVocabulary(false);
      }
    };

    fetchData();
  }, [bu, type, id]);

  // Automatically request location when component mounts
  useEffect(() => {
    getCurrentLocation();
  }, []);

    // Get translation text with fallback
  const getTranslation = (key: string, fallback: string): string => {
    if (vocabulary && vocabulary[key as keyof Vocabulary]) {
      return vocabulary[key as keyof Vocabulary] as string;
    }
    return fallback;
  };

  // Helper function to get images for a direction
  const getImagesForDirection = (side: string) => {
    switch (side) {
      case 'front': return frontImages;
      case 'right': return rightImages;
      case 'back': return backImages;
      case 'left': return leftImages;
      default: return [];
    }
  };

  // Helper function to set images for a direction
  const setImagesForDirection = (side: string, images: ImageUpload[]) => {
    switch (side) {
      case 'front': setFrontImages(images); break;
      case 'right': setRightImages(images); break;
      case 'back': setBackImages(images); break;
      case 'left': setLeftImages(images); break;
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (formData) => {
    try {
      // Validate that all 4 directions have photos
      const imageArrays = [
        { name: 'front', images: frontImages },
        { name: 'right', images: rightImages },
        { name: 'back', images: backImages },
        { name: 'left', images: leftImages }
      ];

      const missingSides = imageArrays.filter(item => item.images.length === 0).map(item => item.name);

      if (missingSides.length > 0) {
        toast.error(`Please upload photos for: ${missingSides.join(', ')}`);
        return;
      }

      // Authenticate anonymously if not already authenticated (for Storage upload)
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (authError) {
          console.error("Authentication error:", authError);
          alert("Authentication failed. Please try again.");
          return;
        }
      }

      const updatedData = {
        ...formData,
        bu,
        type: type.toLowerCase(),
        id,
        site: machineSite || undefined,
        timestamp: new Date(),
        createdAt: new Date(),
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        locationTimestamp: hasLocation ? new Date() : undefined,
        locationAccuracy: accuracy || undefined,
      };

      // Upload images to Firebase Storage for each direction
      const directionalData: { [key: string]: string[] } = {};

      // Process each direction's images sequentially to get download URLs
      for (const { name, images } of imageArrays) {
        const fieldName = name + 'P'; // frontP, rightP, backP, leftP
        directionalData[fieldName] = [];

        for (let index = 0; index < images.length; index++) {
          const image = images[index];

          if (image.file) {
            try {
              // Create path for Firebase Storage
              const path = `Machine/${bu}/${type.toLowerCase()}/${id}/${name}-${Date.now()}-${index}-${image.file.name}`;
              const storageRef = ref(storage, path);

              // Upload file and wait for completion
              const uploadTask = uploadBytesResumable(storageRef, image.file);
              await uploadTask;

              // Get download URL after upload completes
              const downloadURL = await getDownloadURL(storageRef);
              directionalData[fieldName].push(downloadURL);

            } catch (uploadError) {
              console.error(`Upload error for ${name} image ${index}:`, uploadError);
              toast.error(`Failed to upload ${name} image ${index + 1}. Please try again.`);
              return;
            }
          } else if (image.url && !image.url.startsWith('blob:')) {
            // Keep existing Firebase Storage URLs
            directionalData[fieldName].push(image.url);
          }
        }
      }

      // Show success message if uploads completed
      const totalUploads = Object.values(directionalData).flat().length;
      if (totalUploads > 0) {
        toast.success(`Successfully uploaded ${totalUploads} images!`);
      }

      // Save to Firestore using server action
      try {
        const result = await submitMachineForm({
          ...updatedData,
          ...directionalData, // Add frontP, rightP, backP, leftP fields
          images: [], // Keep images empty for this form type
        });

        if (result.success) {
          toast.success("4-direction photos submitted successfully!");
          reset();
          setFrontImages([]);
          setRightImages([]);
          setBackImages([]);
          setLeftImages([]);

          // Scroll to top and reload
          window.scrollTo(0, 0);
          window.location.reload();
        } else {
          toast.error(result.error || "Failed to submit photos");
        }
      } catch (serverError) {
        console.error("Server action error:", serverError);
        toast.error("Failed to submit photos. Please try again.");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  // Get the title for display
  const getTitle = () => {
    if (formTitle) {
      return formTitle;
    }
    return "Mixerphoto Inspection - ถ่ายรูปรถโม่ 4 ด้าน";
  };

  // Add loading state while title is being fetched
  if (isLoadingQuestions) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 text-center">
            Loading...
          </h1>
        </div>
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
          <div className="flex justify-center items-center">
            {locationLoading && (
              <div className="text-blue-600 bg-blue-50 px-3 py-1 rounded-md inline-block">
                🔄 Getting location...
              </div>
            )}
            {hasLocation && (
              <div className="text-green-700 bg-green-50 px-3 py-1 rounded-md inline-block">
                📍 Location: {latitude!.toFixed(6)}, {longitude!.toFixed(6)}
                {accuracy && (
                  <span className="block text-xs mt-1">Accuracy: ±{Math.round(accuracy)}m</span>
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
                  Please enable location services in your browser and click "Try Again"
                </p>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Show form only when location is available */}
      {hasLocation ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Inspector Field */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="inspector" className="text-lg font-semibold">
                  {getTranslation('inspector', 'Inspector')}
                </Label>
                {type.toLowerCase() === "mixerphoto" ? (
                  <select
                    {...register("inspector", { required: "Inspector is required" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">กรอกชื่อ Trainer / TSM</option>
                    <option value="CAEC">CAEC MACHINERY CO.,LTD</option>
                    <option value="CC">Chatchaiphuket Transport (2006) Co.,Ltd.</option>
                    <option value="DO">D.O.K Co.,Ltd.</option>
                    <option value="FT">F Transport Co.,Ltd.</option>
                    <option value="IS">Insee logistic Co.,Ltd.</option>
                    <option value="KC">Kijcharoen Transport Ltd.,Part</option>
                    <option value="KJ">KJJ Development Co. ltd.</option>
                    <option value="KM">Khemarat Transport Co.,Ltd.</option>
                    <option value="MN">Mena Transport Public Co.,Ltd.</option>
                    <option value="PI">Pechinsee Transport Co.,Ltd.</option>
                    <option value="PT">Patarachatra Transport Co.,Ltd.</option>
                    <option value="PU">Phupattanar Transport Co.,Ltd.</option>
                    <option value="QC">QCarrier Co.,Ltd.</option>
                    <option value="SH">Sahathanaseth Engineering Co.,Ltd.</option>
                    <option value="SS">Sermsinpaiboon Co.,Ltd.</option>
                    <option value="TR">TR.9 Ltd.,Part</option>
                    <option value="TP">บริษัท ไทยภักดี การโยธา จำกัด (THAIPHAKDEE KAN YOTHA)</option>
                  </select>
                ) : (
                  <Input
                    {...register("inspector", { required: "Inspector is required" })}
                    placeholder="Inspector"
                    className="w-full"
                  />
                )}
                {errors.inspector && (
                  <p className="text-red-500 text-sm">{errors.inspector.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 4-Direction Photo Interface */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-center text-gray-800 mb-6">
                  ถ่ายรูปรถโม่ 4 ด้าน - Take Photos from 4 Sides
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['front', 'right', 'back', 'left'].map((side, idx) => {
                    const images = getImagesForDirection(side);
                    const setImages = (newImages: ImageUpload[]) => setImagesForDirection(side, newImages);

                    return (
                      <div
                        key={idx}
                        className="py-4 rounded-lg bg-purple-100 w-full"
                      >
                        {/* Direction Header */}
                        <div
                          className="flex items-center justify-center mb-4 mx-2 bg-purple-200 font-bold py-3 px-4 rounded shadow-lg"
                        >
                          <span
                            className="mx-2 text-4xl"
                            style={{ width: '40px', height: '40px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            {side === 'front' ? '⬆️' : side === 'right' ? '➡️' : side === 'back' ? '⬇️' : side === 'left' ? '⬅️' : ''}
                          </span>
                          <strong className="text-lg">
                            {side === 'front'
                              ? 'หน้า'
                              : side === 'right'
                              ? 'ขวา'
                              : side === 'back'
                              ? 'หลัง'
                              : side === 'left'
                              ? 'ซ้าย'
                              : ''}
                          </strong>
                          <Camera className="mx-2" size={24} />
                        </div>

                        {/* Multi Image Uploader */}
                        <div className="px-2">
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
                            compressionType="defect"
                          />
                        </div>

                        {/* Validation Message */}
                        {images.length === 0 && (
                          <p className="text-center text-rose-500 text-sm mt-2 px-2">
                            กรุณาอัพโลดรูปรถโม่ด้าน {
                              side === 'front' ? 'หน้า' :
                              side === 'right' ? 'ขวา' :
                              side === 'back' ? 'หลัง' :
                              side === 'left' ? 'ซ้าย' : side
                            }
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full shadow-lg"
          >
            {isSubmitting ? "Submitting..." : getTranslation('submit', 'Submit')}
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
                Machine inspection requires your current location for accurate record keeping.
                Please enable location sharing to continue with the photo capture.
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
                  Make sure location services are enabled in your browser settings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}