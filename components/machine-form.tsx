"use client";

import { useState, useEffect } from "react";
import { useForm, FieldValues, SubmitHandler } from "react-hook-form";
import { getMachineQuestions } from "@/lib/actions/forms";
import { getVocabulary } from "@/lib/actions/vocabulary";
import { MachineItem, quarterlyEquipment } from "@/lib/machine-types";
import { Vocabulary, Choice } from "@/types/vocabulary";
import RadioButtonGroup from "@/components/ui/radio-button-group";
import { Button } from "./ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import MultiImageUploader, { ImageUpload } from "@/components/multi-image-uploader";
import { auth, storage } from "@/firebase/client";
import { signInAnonymously } from "firebase/auth";
import { ref, uploadBytesResumable, UploadTask } from "firebase/storage";
import { submitMachineForm } from "@/lib/actions/machines";
import { useGeolocation } from "@/hooks/useGeolocation";

interface MachineFormProps {
  bu: string;
  type: string;
  id: string;
  isInDialog?: boolean;
}

interface FormData extends FieldValues {
  inspector: string;
  mileage?: string;
  tag?: string;
  certificate?: string;
  remark?: string;
  latitude?: number;
  longitude?: number;
  locationTimestamp?: Date;
  locationAccuracy?: number;
  [key: string]: any;
}

export default function MachineForm({ bu, type, id, isInDialog = false }: MachineFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>();

  const [questions, setQuestions] = useState<MachineItem[]>([]);
  const [formTitle, setFormTitle] = useState<string | null>(null);
  const [formEmoji, setFormEmoji] = useState<string | null>(null);
  const [vocabulary, setVocabulary] = useState<Vocabulary | null>(null);
  const [isLoadingVocabulary, setIsLoadingVocabulary] = useState<boolean>(true);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(true);
  const [selectedValues, setSelectedValues] = useState<{
    [key: string]: string | null;
  }>({});
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [questionImages, setQuestionImages] = useState<{ [questionName: string]: ImageUpload[] }>({});
  
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
        
        // Fetch questions and vocabulary in parallel
        const [questionsResult, vocabularyResult] = await Promise.all([
          getMachineQuestions(bu, type),
          getVocabulary(bu)
        ]);
        
        // Handle questions
        if (questionsResult.success && questionsResult.questions) {
          setQuestions(questionsResult.questions);
          setFormTitle(questionsResult.title || null);
          setFormEmoji(questionsResult.emoji || null);
        } else {
          console.warn("No questions found for machine:", { bu, type, id });
          setQuestions([]);
          setFormTitle(null);
          setFormEmoji(null);
          if (questionsResult.error) {
            toast.error(questionsResult.error);
          }
        }
        
        // Handle vocabulary
        if (vocabularyResult.success && vocabularyResult.vocabulary) {
          setVocabulary(vocabularyResult.vocabulary);
        } else {
          console.warn("No vocabulary found for business unit:", bu);
          setVocabulary(null);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load form data");
        setQuestions([]);
        setVocabulary(null);
      } finally {
        setIsLoadingQuestions(false);
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

  const handleQuestionImagesChange = (questionName: string, images: ImageUpload[]) => {
    setQuestionImages((prev) => ({ ...prev, [questionName]: images }));
  };


  const onSubmit: SubmitHandler<FormData> = async (formData) => {
    try {
      // Validate that all failed questions have at least one image
      const failedQuestions = Object.keys(selectedValues).filter(
        questionName => selectedValues[questionName] === "fail"
      );
      
      for (const questionName of failedQuestions) {
        if (!questionImages[questionName] || questionImages[questionName].length === 0) {
          toast.error(`Please attach at least one image for the failed question: ${questionName}`);
          return;
        }
      }

      // Authenticate anonymously if not already authenticated (for Storage upload)
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (authError: any) {
          console.error("Authentication error:", authError);
          if (authError?.code === 'auth/api-key-expired') {
            toast.error("Firebase API key has expired. Please contact administrator to renew the key.");
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
        // Include location data
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        locationTimestamp: hasLocation ? new Date() : undefined,
        locationAccuracy: accuracy || undefined,
      };


      // Upload images to Firebase Storage
      const uploadTasks: UploadTask[] = [];
      const imagePaths: string[] = [];
      const questionImagePaths: { [questionName: string]: string[] } = {};
      
      // Upload general images
      images.forEach((image, index) => {
        if (image.file) {
          const path = `Machine/${bu}/${type}/${id}/${Date.now()}-${index}-${image.file.name}`;
          imagePaths.push(path);
          const storageRef = ref(storage, path);
          uploadTasks.push(uploadBytesResumable(storageRef, image.file));
        }
      });

      // Upload question-specific images
      Object.keys(questionImages).forEach(questionName => {
        const images = questionImages[questionName];
        questionImagePaths[questionName] = [];
        
        images.forEach((image, index) => {
          if (image.file) {
            const path = `Machine/${bu}/${type}/${id}/${questionName}/${Date.now()}-${index}-${image.file.name}`;
            questionImagePaths[questionName].push(path);
            const storageRef = ref(storage, path);
            uploadTasks.push(uploadBytesResumable(storageRef, image.file));
          }
        });
      });

      // Wait for all uploads to complete
      try {
        await Promise.all(uploadTasks);
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        toast.error("Failed to upload images. Please try again.");
        return;
      }

      // Add question-specific image paths to form data
      Object.keys(questionImagePaths).forEach(questionName => {
        if (questionImagePaths[questionName].length > 0) {
          updatedData[questionName + "P"] = questionImagePaths[questionName];
        }
      });

      // Save to Firestore using server action
      try {
        const result = await submitMachineForm({
          ...updatedData,
          images: imagePaths,
        });

        if (result.success) {
          toast.success("Form submitted successfully!");
          reset();
          setSelectedValues({});
          setImages([]);
          setQuestionImages({});
          
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
    // Simple fallback if no dynamic title is available
    return `${type} Inspection`;
  };

  // Get choices for radio buttons from vocabulary or fallback
  const getChoices = (): Choice[] => {
    if (vocabulary?.choices) {
      return vocabulary.choices;
    }
    // Fallback to default choices if vocabulary not loaded
    return [
      { value: 'pass', text: 'Pass', colorClass: 'bg-green-400' },
      { value: 'fail', text: 'Fail', colorClass: 'bg-red-400' },
      { value: 'na', text: 'N/A', colorClass: 'bg-yellow-400' },
    ];
  };
  
  // Get translation text with fallback
  const getTranslation = (key: string, fallback: string): string => {
    if (vocabulary && vocabulary[key as keyof Vocabulary]) {
      return vocabulary[key as keyof Vocabulary] as string;
    }
    return fallback;
  };

  // Add loading state while data is being fetched
  if (isLoadingQuestions || isLoadingVocabulary) {
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
              <p>Loading questions...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show message if no questions are available
  if (questions.length === 0) {
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
              <p>No questions available for this type.</p>
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
              {type.toLowerCase() === "mixertsm" ? (
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

        {/* Mileage Field for Thai cars */}
        {(["th"].includes(bu)) && type.toLowerCase() === "car" && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="mileage" className="text-lg font-semibold">
                  เลขไมล์ Mileage
                </Label>
                <Input
                  {...register("mileage", { required: "Mileage is required" })}
                  type="text"
                  placeholder="Mileage"
                  className="w-full"
                />
                {errors.mileage && (
                  <p className="text-red-500 text-sm">{errors.mileage.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tag Number for Vietnam quarterly equipment */}
        {quarterlyEquipment.some((item) => item.id === type.toLowerCase()) && bu === "vn" && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="tag" className="text-lg font-semibold">
                  Tag number
                </Label>
                <Input
                  {...register("tag", { required: "Tag number is required" })}
                  type="text"
                  placeholder="Tag number"
                  className="w-full"
                />
                {errors.tag && (
                  <p className="text-red-500 text-sm">{errors.tag.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certificate Field for Vietnam */}
        {["lifting", "vehicle", "mobile"].includes(type.toLowerCase()) && bu === "vn" && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="certificate" className="text-lg font-semibold">
                  Chứng nhận kiểm định/đăng kiểm còn hiệu lực đến ngày
                </Label>
                <Input
                  {...register("certificate", { required: "Certificate is required" })}
                  type="text"
                  placeholder="Certificate valid to"
                  className="w-full"
                />
                {errors.certificate && (
                  <p className="text-red-500 text-sm">{errors.certificate.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions */}
        {questions.map((question, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="text-xl font-semibold">
                  {index + 1}. {question.question}
                </div>
                
                <div className="text-sm text-gray-400 drop-shadow-sm opacity-75">
                  {question.howto && (
                  <p><strong>{getTranslation('howto', 'How to check')}:</strong> {question.howto}</p>
                  )}
                  {question.accept && (
                    <p><strong>{getTranslation('accept', 'Acceptance criteria')}:</strong> {question.accept}</p>
                  )}
                </div>
                
                <RadioButtonGroup
                  register={register}
                  questionName={question.name}
                  handleRadioChange={handleRadioChange}
                  choices={getChoices()}
                />

                {/* Remark and Picture upload for fail */}
                {(selectedValues[question.name] === "fail" ||
                  (question.name &&
                    selectedValues[question.name] !== "na" &&
                    question.name.includes("LogoAndColor"))) && (
                  <div className="space-y-4 mt-4">
                    <Input
                      {...register(question.name + "R", { required: true })}
                      type="text"
                      placeholder={getTranslation('remarkr', 'Please provide a remark')}
                      className="w-full"
                    />
                    
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Upload Images for {question.question}
                      </Label>
                      <MultiImageUploader
                        images={questionImages[question.name] || []}
                        onImagesChange={(images) => handleQuestionImagesChange(question.name, images)}
                        urlFormatter={(image) => image.url}
                        compressionType="defect"
                      />
                    </div>

                    {errors[question.name + "R"] && (
                      <p className="text-red-500 text-sm">Please write a comment</p>
                    )}
                    {(questionImages[question.name] || []).length === 0 && (
                      <p className="text-red-500 text-sm">Please attach at least one picture</p>
                    )}
                  </div>
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
                {getTranslation('picture', 'Attach Images')} (Optional)
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
                {getTranslation('remark', 'Remark')} (Optional)
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
                Please enable location sharing to continue with the inspection form.
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