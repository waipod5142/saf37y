"use client";

import { useState, useEffect } from "react";
import { useForm, FieldValues, SubmitHandler } from "react-hook-form";
import { getMachineQuestions } from "@/lib/actions/forms";
import { getVocabulary } from "@/lib/actions/vocabulary";
import { getMachineByIdAction } from "@/lib/actions/machines";
import { Vocabulary, Choice } from "@/types/vocabulary";
import RadioButtonGroup from "@/components/ui/radio-button-group";
import { Button } from "./ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

interface MachineFormProps {
  bu: string;
  type: string;
  id: string;
  isInDialog?: boolean;
}

interface Question {
  name: string;
  question: string;
  howto?: string;
}

interface FormData extends FieldValues {
  speaker: string;
  subject: string;
  participation: string;
  satisfaction: string;
  remark?: string;
  latitude?: number;
  longitude?: number;
  locationTimestamp?: Date;
  locationAccuracy?: number;
  [key: string]: any;
}

const QUESTIONS: Question[] = [
  { name: "observer", question: "ผู้สังเกต Observer" },
  { name: "observee", question: "ผู้ขับรถ Observee" },
  {
    name: "aim",
    question:
      "1. มีการใช้สายตามองไกลไปข้างหน้าอย่างน้อย 15 วินาที (Aim high in steering)",
    howto:
      "เพื่อคาดการณ์ล่วงหน้า / แยกแยะส่วนที่เกี่ยวข้อง / ปรับสายตาตามสภาพถนนและความเร็ว",
  },
  {
    name: "picture",
    question: "2. มีการมองภาพโดยรอบ (Get the Big picture)",
    howto:
      "การกะระยะคันข้างหน้าอย่างน้อย 4 วินาที / การมองกระจกทุกบานทุก 5-8 วินาที",
  },
  {
    name: "moving",
    question: "3. มีการเคลื่อนไหวสายตาทุก 2-3 วินาที (Keep your eyes moving)",
    howto:
      "เหลือบมองกระจกส่องข้างบ่อยๆ / มองกระจกซ้าย-ขวา ก่อนชลอหรือหยุดรถไม่เพ่งมองจุดใดจุดหนึ่งมากกว่า 2 วินาที",
  },
  {
    name: "anout",
    question: "4. มีการหาทางออกให้กับตัวเอง (Leave yourself an out)",
    howto:
      "ไม่ขับรถเกาะกลุ่ม / รักษาระยะห่างรอบๆตัวรถ / เมื่อหยุดรถให้เว้นระยะห่างจากคันหน้าพอสมควร / ปรับระยะห่างตลอดเวลาตามสภาพจราจร",
  },
  {
    name: "see",
    question: "5. แน่ใจว่าเขาเห็นเรา (Make sure They see you)",
    howto: "ส่งสัญญาณเสียงและแสงเตือน / อยู่ห่างจากจุดบอดของรถคันอื่นๆ",
  },
  {
    name: "fatigue",
    question:
      "6. มีสภาพร่างกายพร้อมก่อนและขณะขับขี่ (Health & Readiness for Driving)",
    howto: "ไม่ง่วงนอน, ไม่แอลกอฮอล์, ไม่กินยา",
  },
  {
    name: "distraction",
    question: "7. ไม่ทำพฤติกรรมที่เสียสมาธิในการขับรถ (Distraction)",
    howto: "การใช้โทรศัพท์, การประชุม, การก้มหรือหาสิ่งของ และอื่นๆ",
  },
  {
    name: "admire",
    question: "ข้อดีของพนักงานที่พบ",
  },
  {
    name: "adjust",
    question: "ข้อแนะนำในการปรับปรุง",
  },
];

export default function MachineFormDriving({
  bu,
  type,
  id,
  isInDialog = false,
}: MachineFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>();

  const [formTitle, setFormTitle] = useState<string | null>(null);
  const [formEmoji, setFormEmoji] = useState<string | null>(null);
  const [vocabulary, setVocabulary] = useState<Vocabulary | null>(null);
  const [isLoadingVocabulary, setIsLoadingVocabulary] = useState<boolean>(true);
  const [machineSite, setMachineSite] = useState<string | undefined>(undefined);
  const [selectedValues, setSelectedValues] = useState<{
    [key: string]: string | null;
  }>({});
  const [images, setImages] = useState<MediaUpload[]>([]);

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

  // Get choices for radio buttons - driving evaluation scoring system
  const getChoices = (): Choice[] => {
    return [
      { value: "4", text: "4", colorClass: "bg-green-600" },
      { value: "3", text: "3", colorClass: "bg-green-400" },
      { value: "2", text: "2", colorClass: "bg-yellow-500" },
      { value: "1", text: "1", colorClass: "bg-orange-500" },
      { value: "0", text: "0", colorClass: "bg-red-500" },
      { value: "N/A", text: "N/A", colorClass: "bg-purple-500" },
    ];
  };

  // Get the title for the current machine type
  const getTitle = () => {
    if (formTitle) {
      return formTitle;
    }
    // Fallback if no dynamic title is available
    return "Defensive Driving";
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
          {/* Questions */}
          {QUESTIONS.map((question, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="text-xl font-semibold">
                    {question.question}
                  </div>

                  {/* Display evaluation criteria (howto) if available */}
                  {question.howto && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-200">
                      <span className="font-semibold">เกณฑ์การประเมิน: </span>
                      {question.howto}
                    </div>
                  )}

                  {/* Text input for observer/observee (first 2 questions) */}
                  {index < 2 ? (
                    <div className="space-y-2">
                      <Input
                        {...register(question.name, {
                          required: "This field is required",
                        })}
                        type="text"
                        placeholder={`Enter ${question.question}`}
                        className="w-full"
                      />
                      {errors[question.name] && (
                        <p className="text-red-500 text-sm">
                          {errors[question.name]?.message as string}
                        </p>
                      )}
                    </div>
                  ) : question.name === "admire" ||
                    question.name === "adjust" ? (
                    /* Textarea for admire/adjust questions */
                    <div className="space-y-2">
                      <Textarea
                        {...register(question.name, {
                          required: "This field is required",
                        })}
                        placeholder={`Enter ${question.question}`}
                        className="w-full min-h-[100px]"
                        rows={4}
                      />
                      {errors[question.name] && (
                        <p className="text-red-500 text-sm">
                          {errors[question.name]?.message as string}
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Radio buttons for driving safety evaluation questions */
                    <RadioButtonGroup
                      register={register}
                      questionName={question.name}
                      handleRadioChange={handleRadioChange}
                      choices={getChoices()}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

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
