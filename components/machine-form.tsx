"use client";

import { useState, useEffect } from "react";
import { useForm, FieldValues, SubmitHandler } from "react-hook-form";
import { getMachineQuestions } from "@/lib/actions/forms";
import { getVocabulary } from "@/lib/actions/vocabulary";
import { getMachineByIdAction } from "@/lib/actions/machines";
import { MachineItem, quarterlyEquipment } from "@/lib/machine-types";
import { Vocabulary, Choice } from "@/types/vocabulary";
import RadioButtonGroup from "@/components/ui/radio-button-group";
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

interface MachineFormProps {
  bu: string;
  type: string;
  id: string;
  isInDialog?: boolean;
}

interface FormData extends FieldValues {
  inspector: string;
  admix1?: string;
  admixR1?: string;
  admix2?: string;
  admixR2?: string;
  admix3?: string;
  admixR3?: string;
  admix4?: string;
  admixR4?: string;
  admix5?: string;
  admixR5?: string;
  admix6?: string;
  admixR6?: string;
  tag?: string;
  mileage?: string;
  certificate?: string;
  remark?: string;
  latitude?: number;
  longitude?: number;
  locationTimestamp?: Date;
  locationAccuracy?: number;
  [key: string]: any;
}

export default function MachineForm({
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

  const [questions, setQuestions] = useState<MachineItem[]>([]);
  const [formTitle, setFormTitle] = useState<string | null>(null);
  const [formEmoji, setFormEmoji] = useState<string | null>(null);
  const [vocabulary, setVocabulary] = useState<Vocabulary | null>(null);
  const [isLoadingVocabulary, setIsLoadingVocabulary] = useState<boolean>(true);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(true);
  const [machineSite, setMachineSite] = useState<string | undefined>(undefined);
  const [selectedValues, setSelectedValues] = useState<{
    [key: string]: string | null;
  }>({});
  const [images, setImages] = useState<MediaUpload[]>([]);
  const [questionImages, setQuestionImages] = useState<{
    [questionName: string]: MediaUpload[];
  }>({});

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
        setIsLoadingQuestions(true);
        setIsLoadingVocabulary(true);

        // Fetch questions, vocabulary, and machine data in parallel
        const [questionsResult, vocabularyResult, machineResult] =
          await Promise.all([
            getMachineQuestions(bu, type),
            getVocabulary(bu),
            getMachineByIdAction(bu, type, id),
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
          // Don't show error toast for missing questions, just log
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

  const handleQuestionImagesChange = (
    questionName: string,
    images: MediaUpload[]
  ) => {
    setQuestionImages((prev) => ({ ...prev, [questionName]: images }));
  };

  const onSubmit: SubmitHandler<FormData> = async (formData) => {
    try {
      // Validate that all failed questions have at least one image
      const failedQuestions = Object.keys(selectedValues).filter(
        (questionName) => selectedValues[questionName] === "fail"
      );

      for (const questionName of failedQuestions) {
        if (
          !questionImages[questionName] ||
          questionImages[questionName].length === 0
        ) {
          toast.error(
            `Please attach at least one image for the failed question: ${questionName}`
          );
          return;
        }
      }

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
      const questionImageUrls: { [questionName: string]: string[] } = {};

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

      // Upload question-specific images
      for (const questionName of Object.keys(questionImages)) {
        const images = questionImages[questionName];
        questionImageUrls[questionName] = [];

        for (let index = 0; index < images.length; index++) {
          const image = images[index];
          if (image.file) {
            try {
              const path = `Machine/${bu}/${type}/${id}/${questionName}/${Date.now()}-${index}-${image.file.name}`;
              const storageRef = ref(storage, path);

              // Upload file and wait for completion
              const uploadTask = uploadBytesResumable(storageRef, image.file);
              await uploadTask;

              // Get download URL after upload completes
              const downloadURL = await getDownloadURL(storageRef);
              questionImageUrls[questionName].push(downloadURL);
            } catch (uploadError) {
              console.error(
                `Upload error for ${questionName} image ${index}:`,
                uploadError
              );
              toast.error(
                `Failed to upload image for ${questionName}. Please try again.`
              );
              return;
            }
          }
        }
      }

      // Add question-specific image URLs to form data
      Object.keys(questionImageUrls).forEach((questionName) => {
        if (questionImageUrls[questionName].length > 0) {
          updatedData[questionName + "P"] = questionImageUrls[questionName];
        }
      });

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
      { value: "pass", text: "Pass", colorClass: "bg-green-400" },
      { value: "fail", text: "Fail", colorClass: "bg-red-400" },
      { value: "na", text: "N/A", colorClass: "bg-yellow-400" },
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
          {/* Inspector Field */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="inspector" className="text-lg font-semibold">
                  {getTranslation("inspector", "Inspector")}
                </Label>
                {type.toLowerCase() === "mixertrainer" ? (
                  <select
                    {...register("inspector", {
                      required: "Inspector is required",
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">กรอกชื่อ Trainer</option>
                    <option value="CW">Chamnan Wichit (Driver Trainer)</option>
                    <option value="KN">
                      Kasemsak Nuengkhamin (Driver Trainer)
                    </option>
                    <option value="SN">
                      Samansuk Ngeonjun (Driver Trainer)
                    </option>
                    <option value="TW">
                      Theerawud Wattanaruangchai (Driver Trainer)
                    </option>
                    <option value="KS">
                      Kriangkrai Sangsook (Driver Trainer)
                    </option>
                    <option value="NK">Nakorn Kamthong (Driver Trainer)</option>
                    <option value="TS">
                      Teerawath Saengsilawuthikul (Driver Trainer)
                    </option>
                  </select>
                ) : type.toLowerCase() === "mixertsm" ? (
                  <select
                    {...register("inspector", {
                      required: "Inspector is required",
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">กรอกชื่อ Trainer / TSM</option>
                    <option value="CAEC">CAEC MACHINERY CO.,LTD</option>
                    <option value="CC">
                      Chatchaiphuket Transport (2006) Co.,Ltd.
                    </option>
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
                    <option value="SH">
                      Sahathanaseth Engineering Co.,Ltd.
                    </option>
                    <option value="SS">Sermsinpaiboon Co.,Ltd.</option>
                    <option value="TR">TR.9 Ltd.,Part</option>
                    <option value="TP">
                      บริษัท ไทยภักดี การโยธา จำกัด (THAIPHAKDEE KAN YOTHA)
                    </option>
                  </select>
                ) : (
                  <Input
                    {...register("inspector", {
                      required: "Inspector is required",
                    })}
                    placeholder="Inspector"
                    className="w-full"
                  />
                )}
                {errors.inspector && (
                  <p className="text-red-500 text-sm">
                    {errors.inspector.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Mileage Field for Thai cars */}
          {["th"].includes(bu) && type.toLowerCase() === "car" && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label htmlFor="mileage" className="text-lg font-semibold">
                    เลขไมล์ Mileage
                  </Label>
                  <Input
                    {...register("mileage", {
                      required: "Mileage is required",
                    })}
                    type="text"
                    placeholder="Mileage"
                    className="w-full"
                  />
                  {errors.mileage && (
                    <p className="text-red-500 text-sm">
                      {errors.mileage.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tag Number for Vietnam quarterly equipment */}
          {quarterlyEquipment.some((item) => item.id === type.toLowerCase()) &&
            bu === "vn" && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="tag" className="text-lg font-semibold">
                      Tag number
                    </Label>
                    <Input
                      {...register("tag", {
                        required: "Tag number is required",
                      })}
                      type="text"
                      placeholder="Tag number"
                      className="w-full"
                    />
                    {errors.tag && (
                      <p className="text-red-500 text-sm">
                        {errors.tag.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Certificate Field for Vietnam */}
          {["lifting", "vehicle", "mobile"].includes(type.toLowerCase()) &&
            bu === "vn" && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="certificate"
                      className="text-lg font-semibold"
                    >
                      Chứng nhận kiểm định/đăng kiểm còn hiệu lực đến ngày
                    </Label>
                    <Input
                      {...register("certificate", {
                        required: "Certificate is required",
                      })}
                      type="text"
                      placeholder="Certificate valid to"
                      className="w-full"
                    />
                    {errors.certificate && (
                      <p className="text-red-500 text-sm">
                        {errors.certificate.message}
                      </p>
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
                      <p>
                        <strong>
                          {getTranslation("howto", "How to check")}:
                        </strong>{" "}
                        {question.howto}
                      </p>
                    )}
                    {question.accept && (
                      <p>
                        <strong>
                          {getTranslation("accept", "Acceptance criteria")}:
                        </strong>{" "}
                        {question.accept}
                      </p>
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
                        placeholder={getTranslation(
                          "remarkr",
                          "Please provide a remark"
                        )}
                        className="w-full"
                      />

                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Upload Images/Videos for {question.question}
                        </Label>
                        <MultiMediaUploader
                          media={questionImages[question.name] || []}
                          onMediaChange={(media) =>
                            handleQuestionImagesChange(question.name, media)
                          }
                          urlFormatter={(media) => media.url}
                          compressionType="defect"
                        />
                      </div>

                      {errors[question.name + "R"] && (
                        <p className="text-red-500 text-sm">
                          Please write a comment
                        </p>
                      )}
                      {(questionImages[question.name] || []).length === 0 && (
                        <p className="text-red-500 text-sm">
                          Please attach at least one picture/video
                        </p>
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
                  {getTranslation("picture", "Attach Images/Videos")} (Optional)
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

          {/* Admix and SG Fields for Thai plantweek and plantmonth */}
          {["th"].includes(bu) &&
            (type.toLowerCase() === "plantweek" ||
              type.toLowerCase() === "plantmonth") && (
              <>
                {/* Admix 1 and AdmixR 1 */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="admix1"
                          className="text-lg font-semibold"
                        >
                          น้ำยา 1
                        </Label>
                        <Input
                          {...register("admix1")}
                          type="text"
                          placeholder="น้ำยา 1..."
                          className="w-full"
                        />
                        {errors.admix1 && (
                          <p className="text-red-500 text-sm">
                            {errors.admix1.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="admixR1"
                          className="text-lg font-semibold"
                        >
                          ค่าความถ่วงจำเพาะ
                        </Label>
                        <Input
                          {...register("admixR1")}
                          type="text"
                          placeholder="ค่าความถ่วงจำเพาะ"
                          className="w-full"
                        />
                        {errors.admixR1 && (
                          <p className="text-red-500 text-sm">
                            {errors.admixR1.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Admix 2 and AdmixR 2 */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="admix2"
                          className="text-lg font-semibold"
                        >
                          น้ำยา 2
                        </Label>
                        <Input
                          {...register("admix2")}
                          type="text"
                          placeholder="น้ำยา 2..."
                          className="w-full"
                        />
                        {errors.admix2 && (
                          <p className="text-red-500 text-sm">
                            {errors.admix2.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="admixR2"
                          className="text-lg font-semibold"
                        >
                          ค่าความถ่วงจำเพาะ
                        </Label>
                        <Input
                          {...register("admixR2")}
                          type="text"
                          placeholder="ค่าความถ่วงจำเพาะ"
                          className="w-full"
                        />
                        {errors.admixR2 && (
                          <p className="text-red-500 text-sm">
                            {errors.admixR2.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Admix 3 and AdmixR 3 */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="admix3"
                          className="text-lg font-semibold"
                        >
                          น้ำยา 3
                        </Label>
                        <Input
                          {...register("admix3")}
                          type="text"
                          placeholder="น้ำยา 3..."
                          className="w-full"
                        />
                        {errors.admix3 && (
                          <p className="text-red-500 text-sm">
                            {errors.admix3.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="admixR3"
                          className="text-lg font-semibold"
                        >
                          ค่าความถ่วงจำเพาะ
                        </Label>
                        <Input
                          {...register("admixR3")}
                          type="text"
                          placeholder="ค่าความถ่วงจำเพาะ"
                          className="w-full"
                        />
                        {errors.admixR3 && (
                          <p className="text-red-500 text-sm">
                            {errors.admixR3.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Admix 4 and AdmixR 4 */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="admix4"
                          className="text-lg font-semibold"
                        >
                          น้ำยา 4
                        </Label>
                        <Input
                          {...register("admix4")}
                          type="text"
                          placeholder="น้ำยา 4..."
                          className="w-full"
                        />
                        {errors.admix4 && (
                          <p className="text-red-500 text-sm">
                            {errors.admix4.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="admixR4"
                          className="text-lg font-semibold"
                        >
                          ค่าความถ่วงจำเพาะ
                        </Label>
                        <Input
                          {...register("admixR4")}
                          type="text"
                          placeholder="ค่าความถ่วงจำเพาะ"
                          className="w-full"
                        />
                        {errors.admixR4 && (
                          <p className="text-red-500 text-sm">
                            {errors.admixR4.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Admix 5 and AdmixR 5 */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="admix5"
                          className="text-lg font-semibold"
                        >
                          น้ำยา 5
                        </Label>
                        <Input
                          {...register("admix5")}
                          type="text"
                          placeholder="น้ำยา 5..."
                          className="w-full"
                        />
                        {errors.admix5 && (
                          <p className="text-red-500 text-sm">
                            {errors.admix5.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="admixR5"
                          className="text-lg font-semibold"
                        >
                          ค่าความถ่วงจำเพาะ
                        </Label>
                        <Input
                          {...register("admixR5")}
                          type="text"
                          placeholder="ค่าความถ่วงจำเพาะ"
                          className="w-full"
                        />
                        {errors.admixR5 && (
                          <p className="text-red-500 text-sm">
                            {errors.admixR5.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Admix 6 and AdmixR 6 */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="admix6"
                          className="text-lg font-semibold"
                        >
                          น้ำยา 6
                        </Label>
                        <Input
                          {...register("admix6")}
                          type="text"
                          placeholder="น้ำยา 6..."
                          className="w-full"
                        />
                        {errors.admix6 && (
                          <p className="text-red-500 text-sm">
                            {errors.admix6.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="admixR6"
                          className="text-lg font-semibold"
                        >
                          ค่าความถ่วงจำเพาะ
                        </Label>
                        <Input
                          {...register("admixR6")}
                          type="text"
                          placeholder="ค่าความถ่วงจำเพาะ"
                          className="w-full"
                        />
                        {errors.admixR6 && (
                          <p className="text-red-500 text-sm">
                            {errors.admixR6.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

          {/* Optional Remark */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="remark" className="text-lg font-semibold">
                  {getTranslation("remark", "Remark")} (Optional)
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
