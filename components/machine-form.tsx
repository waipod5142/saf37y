"use client";

import { useState, useEffect } from "react";
import { useForm, FieldValues, SubmitHandler } from "react-hook-form";
import { Camera } from "lucide-react";
import { getMachineQuestions } from "@/lib/actions/forms";
import { getVocabulary } from "@/lib/actions/vocabulary";
import { MachineItem, machineTitles, quarterlyEquipment } from "@/lib/machine-types";
import { Vocabulary, Choice } from "@/types/vocabulary";
import RadioButtonGroup from "@/components/ui/radio-button-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import MultiImageUploader, { ImageUpload } from "@/components/multi-image-uploader";
import { auth, storage } from "@/firebase/client";
import { signInAnonymously } from "firebase/auth";
import { ref, uploadBytesResumable, UploadTask } from "firebase/storage";
import { submitMachineForm } from "@/lib/actions/machines";

interface MachineFormProps {
  bu: string;
  type: string;
  id: string;
}

interface FormData extends FieldValues {
  inspector: string;
  mileage?: string;
  tag?: string;
  certificate?: string;
  remark?: string;
  [key: string]: any;
}

export default function MachineForm({ bu, type, id }: MachineFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>();

  const [questions, setQuestions] = useState<MachineItem[]>([]);
  const [formTitle, setFormTitle] = useState<string | null>(null);
  const [vocabulary, setVocabulary] = useState<Vocabulary | null>(null);
  const [isLoadingVocabulary, setIsLoadingVocabulary] = useState<boolean>(true);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(true);
  const [selectedValues, setSelectedValues] = useState<{
    [key: string]: string | null;
  }>({});
  const [fileUrls, setFileUrls] = useState<{ [key: string]: string | null }>({});
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({});
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [questionImages, setQuestionImages] = useState<{ [questionName: string]: ImageUpload[] }>({});

  // Determine BU (business unit) and machine type
  const businessUnit = bu === "thailand" ? "th" : bu === "vietnam" ? "vn" : 
                      bu === "bangladesh" ? "bd" : bu === "srilanka" ? "lk" : 
                      bu === "cambodia" ? "cmic" : bu;
  const machine = type.charAt(0).toUpperCase() + type.slice(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingQuestions(true);
        setIsLoadingVocabulary(true);
        
        // Fetch questions and vocabulary in parallel
        const [questionsResult, vocabularyResult] = await Promise.all([
          getMachineQuestions(bu, type),
          getVocabulary(businessUnit)
        ]);
        
        // Handle questions
        if (questionsResult.success && questionsResult.questions) {
          setQuestions(questionsResult.questions);
          setFormTitle(questionsResult.title || null);
        } else {
          console.warn("No questions found for machine:", { bu, type, id });
          setQuestions([]);
          setFormTitle(null);
          if (questionsResult.error) {
            toast.error(questionsResult.error);
          }
        }
        
        // Handle vocabulary
        if (vocabularyResult.success && vocabularyResult.vocabulary) {
          setVocabulary(vocabularyResult.vocabulary);
        } else {
          console.warn("No vocabulary found for business unit:", businessUnit);
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
  }, [bu, type, id, businessUnit]);

  const handleRadioChange = (questionName: string, value: string) => {
    setSelectedValues((prev) => ({ ...prev, [questionName]: value }));
  };

  const handleQuestionImagesChange = (questionName: string, images: ImageUpload[]) => {
    setQuestionImages((prev) => ({ ...prev, [questionName]: images }));
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    questionName: string
  ) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      try {
        setIsUploading((prev) => ({ ...prev, [questionName]: true }));
        setUploadProgress(0);
        
        // Simulate file upload progress
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 100);

        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create a mock URL for the uploaded file
        const mockUrl = URL.createObjectURL(selectedFile);
        
        setFileUrls((prev) => {
          const newKey = questionName === "url" ? questionName : questionName + "P";
          return { ...prev, [newKey]: mockUrl };
        });

        setIsUploading((prev) => ({ ...prev, [questionName]: false }));
        setUploadProgress(0);
        
        toast.success("File uploaded successfully");
      } catch (error) {
        console.error("Upload error:", error);
        setIsUploading((prev) => ({ ...prev, [questionName]: false }));
        setUploadProgress(0);
        toast.error("Failed to upload file");
      }
    }
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
        } catch (authError) {
          console.error("Authentication error:", authError);
          toast.error("Authentication failed. Please try again.");
          return;
        }
      }

      const updatedData: FormData = {
        ...formData,
        ...selectedValues,
        bu: businessUnit,
        type: machine.toLowerCase(),
        id,
      };

      // Add file URLs to the data (for questions with images)
      Object.keys(fileUrls).forEach((key) => {
        if (fileUrls[key]) {
          updatedData[key] = fileUrls[key];
        }
      });

      // Upload images to Firebase Storage
      const uploadTasks: UploadTask[] = [];
      const imagePaths: string[] = [];
      const questionImagePaths: { [questionName: string]: string[] } = {};
      
      // Upload general images
      images.forEach((image, index) => {
        if (image.file) {
          const path = `machines/${bu}/${type}/${id}/${Date.now()}-${index}-${image.file.name}`;
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
            const path = `machines/${bu}/${type}/${id}/${questionName}/${Date.now()}-${index}-${image.file.name}`;
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
          setFileUrls({});
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
    // Fallback to hardcoded titles if no dynamic title is available
    const adjustedBu = ["srb", "mkt", "office", "lbm", "rmx", "iagg", "ieco"].includes(businessUnit) ? "th" : businessUnit;
    const adjustedMachine = machine === "Truck" && businessUnit !== "srb" ? "Truckall" : machine;
    return machineTitles[adjustedBu + adjustedMachine] || `${machine} Inspection`;
  };

  // Get choices for radio buttons from vocabulary or fallback
  const getChoices = (): Choice[] => {
    if (vocabulary?.choices) {
      return vocabulary.choices;
    }
    // Fallback to default choices if vocabulary not loaded
    return [
      { value: 'pass', text: 'Pass', colorClass: 'bg-green-500' },
      { value: 'fail', text: 'Fail', colorClass: 'bg-red-500' },
      { value: 'na', text: 'N/A', colorClass: 'bg-yellow-500' },
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
      <div className="max-w-4xl mx-auto p-2">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
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
      <div className="max-w-4xl mx-auto p-2">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              {getTitle()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p>No questions available for this machine type.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-2">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            {getTitle()}
          </CardTitle>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Inspector Field */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="inspector" className="text-lg font-semibold">
                {getTranslation('inspector', 'Inspector')}
              </Label>
              {businessUnit === "rmx" && machine === "Mixertsm" ? (
                <select
                  {...register("inspector", { required: "Inspector is required" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select Inspector</option>
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
        {["srb", "mkt", "office", "lbm", "rmx", "iagg", "ieco"].includes(businessUnit) && machine === "Car" && (
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
        {quarterlyEquipment.some((item) => item.id === machine) && businessUnit === "vn" && (
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
        {["Lifting", "Vehicle", "Mobile"].includes(machine) && businessUnit === "vn" && (
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
                
                <div className="text-sm text-gray-600">
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
          disabled={isSubmitting || Object.values(isUploading).some((uploading) => uploading)}
          className="w-full h-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full shadow-lg"
        >
          {isSubmitting ? "Submitting..." : getTranslation('submit', 'Submit')}
        </Button>
      </form>
    </div>
  );
}