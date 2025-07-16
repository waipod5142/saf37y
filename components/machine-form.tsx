"use client";

import { useState, useEffect } from "react";
import { useForm, FieldValues, SubmitHandler } from "react-hook-form";
import { Camera } from "lucide-react";
import { loadQuestions } from "@/lib/load-questions";
import { MachineItem, machineTitles, quarterlyEquipment } from "@/lib/machine-types";
import {
  vn,
  lk,
  bd,
  cmic,
  th,
  inspector,
  howto,
  accept,
  remarkr,
  remark,
  picture,
  submit,
} from "@/lib/translations";
import RadioButtonGroup from "@/components/ui/radio-button-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import MultiImageUploader, { ImageUpload } from "@/components/multi-image-uploader";
import { auth, storage, db } from "@/firebase/client";
import { signInAnonymously } from "firebase/auth";
import { ref, uploadBytesResumable, UploadTask } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";

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
  const [selectedValues, setSelectedValues] = useState<{
    [key: string]: string | null;
  }>({});
  const [fileUrls, setFileUrls] = useState<{ [key: string]: string | null }>({});
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({});
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [images, setImages] = useState<ImageUpload[]>([]);

  // Determine BU (business unit) and machine type
  const businessUnit = bu === "thailand" ? "th" : bu === "vietnam" ? "vn" : 
                      bu === "bangladesh" ? "bd" : bu === "srilanka" ? "lk" : 
                      bu === "cambodia" ? "cmic" : bu;
  const machine = type.charAt(0).toUpperCase() + type.slice(1);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const adjustedBu = ["srb", "mkt", "office", "lbm", "rmx", "iagg", "ieco"].includes(businessUnit)
          ? "th"
          : businessUnit;
        const adjustedMachine = businessUnit !== "srb" && machine === "Truck" ? "Truckall" : machine;
        
        const { questions } = await loadQuestions(adjustedBu, adjustedMachine);
        setQuestions(questions);
      } catch (error) {
        console.error("Error loading questions:", error);
        toast.error("Failed to load questions");
      }
    };

    fetchQuestions();
  }, [businessUnit, machine]);

  const handleRadioChange = (questionName: string, value: string) => {
    setSelectedValues((prev) => ({ ...prev, [questionName]: value }));
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
      // Authenticate anonymously if not already authenticated
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      const updatedData: FormData = {
        ...formData,
        ...selectedValues,
        bu: businessUnit,
        type: machine.toLowerCase(),
        id,
        timestamp: new Date(),
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
      
      images.forEach((image, index) => {
        if (image.file) {
          const path = `machines/${bu}/${type}/${id}/${Date.now()}-${index}-${image.file.name}`;
          imagePaths.push(path);
          const storageRef = ref(storage, path);
          uploadTasks.push(uploadBytesResumable(storageRef, image.file));
        }
      });

      // Wait for all uploads to complete
      await Promise.all(uploadTasks);

      // Save to Firestore
      await addDoc(collection(db, "machinetr"), {
        ...updatedData,
        images: imagePaths,
        createdAt: new Date(),
      });

      toast.success("Form submitted successfully!");
      reset();
      setSelectedValues({});
      setFileUrls({});
      setImages([]);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to submit form");
    }
  };

  // Get the title for the current machine type
  const getTitle = () => {
    const adjustedBu = ["srb", "mkt", "office", "lbm", "rmx", "iagg", "ieco"].includes(businessUnit) ? "th" : businessUnit;
    const adjustedMachine = machine === "Truck" && businessUnit !== "srb" ? "Truckall" : machine;
    return machineTitles[adjustedBu + adjustedMachine] || `${machine} Inspection`;
  };

  // Get choices for radio buttons based on business unit
  const getChoices = () => {
    switch (businessUnit) {
      case "vn": return vn;
      case "bd": return bd;
      case "lk": return lk;
      case "cmic": return cmic;
      default: return th;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
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
                {inspector[businessUnit] || "Inspector"}
              </Label>
              {businessUnit === "rmx" && machine === "Mixertsm" ? (
                <select
                  {...register("inspector", { required: "Inspector is required" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                  {question.id}. {question.question}
                </div>
                
                <div className="text-sm text-gray-600">
                  <p><strong>{howto[businessUnit] || "How to check"}:</strong> {question.howto}</p>
                  {question.accept && (
                    <p><strong>{accept[businessUnit] || "Acceptance criteria"}:</strong> {question.accept}</p>
                  )}
                </div>

                <RadioButtonGroup
                  register={register}
                  questionName={question.name}
                  handleRadioChange={handleRadioChange}
                  choices={getChoices()}
                />

                {/* Remark and Picture upload for NotPass */}
                {(selectedValues[question.name] === "NotPass" ||
                  (question.name &&
                    selectedValues[question.name] !== "N/A" &&
                    question.name.includes("LogoAndColor"))) && (
                  <div className="space-y-4 mt-4">
                    <Input
                      {...register(question.name + "R", { required: true })}
                      type="text"
                      placeholder={remarkr[businessUnit] || "Please provide a remark"}
                      className="w-full"
                    />
                    
                    <div className="flex items-center space-x-2">
                      <Label
                        className={`flex items-center ${
                          fileUrls[question.name + "P"] ? "bg-rose-500" : "bg-gray-500"
                        } text-white px-3 py-2 rounded-md cursor-pointer hover:opacity-90`}
                      >
                        <Camera className="mr-2" size={20} />
                        Upload Image
                        <input
                          {...register(question.name + "P", { required: true })}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, question.name)}
                          className="hidden"
                        />
                      </Label>
                      
                      {isUploading[question.name] && (
                        <div className="flex-1 max-w-xs">
                          <div className="bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-rose-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">{uploadProgress}%</span>
                        </div>
                      )}
                    </div>

                    {errors[question.name + "R"] && (
                      <p className="text-red-500 text-sm">Please write a comment</p>
                    )}
                    {errors[question.name + "P"] && (
                      <p className="text-red-500 text-sm">Please attach a picture</p>
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
                {picture[businessUnit] || "Attach Images"} (Optional)
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
              />
            </div>
          </CardContent>
        </Card>

        {/* Optional Remark */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="remark" className="text-lg font-semibold">
                {remark[businessUnit] || "Remark"} (Optional)
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
          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 px-6 rounded-full shadow-lg"
        >
          {isSubmitting ? "Submitting..." : (submit[businessUnit] || "Submit")}
        </Button>
      </form>
    </div>
  );
}