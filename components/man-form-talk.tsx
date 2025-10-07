"use client";

import { useState, useEffect } from "react";
import { useForm, FieldValues, SubmitHandler } from "react-hook-form";
import { Button } from "./ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import MultiImageUploader, { ImageUpload } from "@/components/multi-image-uploader";
import { auth, storage } from "@/firebase/client";
import { signInAnonymously } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { submitManForm, getEmployeeByIdAction } from "@/lib/actions/man";

interface ManFormTalkProps {
  bu: string;
  type: string;
  id: string;
  isInDialog?: boolean;
}

interface TalkFormData extends FieldValues {
  selectedTopic: string;
  talkdetail: string;
  place: string;
  participate: number;
  remark?: string;
  [key: string]: any;
}

export default function ManFormTalk({ bu, type, id, isInDialog = false }: ManFormTalkProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<TalkFormData>();

  const [images, setImages] = useState<ImageUpload[]>([]);
  const [employeeSite, setEmployeeSite] = useState<string | undefined>(undefined);

  // Watch form values
  const selectedTopic = watch('selectedTopic');

  // Fetch employee data on component mount
  useEffect(() => {
    const fetchEmployeeData = async () => {
      const employeeResult = await getEmployeeByIdAction(bu, id);
      if (employeeResult.success && employeeResult.employee) {
        setEmployeeSite(employeeResult.employee.site);
      }
    };
    fetchEmployeeData();
  }, [bu, id]);

  // Talk topics with colors matching the form image
  const talkTopics = [
    { id: 'communicate', label: 'สื่อสารกฎหกความปลอดภัย เช่มายฯ ข้อบังคับ หรือขจรรยาบรรณในการทำงาน (Communicate to the Policies, Rules, Regulations)', color: 'bg-red-500' },
    { id: 'risk', label: 'การชี้บ่งและจัดการความเสี่ยง (Risk Identification and management)', color: 'bg-pink-500' },
    { id: 'permit', label: 'การขออนุญาตและใบอนุญาตทำงาน (Work Permit)', color: 'bg-orange-500' },
    { id: 'isolation', label: 'คิอมขอแหล่งพลังงานและล็อคเอาท์แท็กเอาท์ (Isolation lockout and tagout)', color: 'bg-yellow-500' },
    { id: 'ppe', label: 'การใช้อุปกรณ์คุ้มครองความปลอดภัยส่วนบุคคล (PPE)', color: 'bg-yellow-400' },
    { id: 'wi', label: 'การใช้เครื่องมือและอุปกรณ์ และขั้นตอนการปฏิบัติงาน (Procedure, Work Instruction)', color: 'bg-green-500' },
    { id: 'health', label: 'สุขภาพ ความปลอดภัย และโรคจากการทำงาน (Occupational Health and Safety)', color: 'bg-teal-500' },
    { id: 'other', label: 'อื่นๆ', color: 'bg-teal-500' },
  ];


  const onSubmit: SubmitHandler<TalkFormData> = async (formData) => {
    try {
      // Validate required fields
      if (!formData.selectedTopic) {
        toast.error("Please select a topic to talk about");
        return;
      }

      if (!formData.talkdetail || !formData.place) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (!formData.participate || formData.participate < 1) {
        toast.error("Please enter number of participate (minimum 1)");
        return;
      }

      // Authenticate anonymously if not already authenticated (for Storage upload)
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (authError: any) {
          console.error("Authentication error:", authError);
          toast.error("Authentication failed. Please try again.");
          return;
        }
      }

      // Upload images to Firebase Storage and get download URLs
      const imageUrls: string[] = [];

      for (let index = 0; index < images.length; index++) {
        const image = images[index];
        if (image.file) {
          try {
            const path = `Man/${bu}/${type}/${id}/${Date.now()}-${index}-${image.file.name}`;
            const storageRef = ref(storage, path);

            // Upload file and wait for completion
            const uploadTask = uploadBytesResumable(storageRef, image.file);
            await uploadTask;

            // Get download URL after upload completes
            const downloadURL = await getDownloadURL(storageRef);
            imageUrls.push(downloadURL);
          } catch (uploadError) {
            console.error(`Upload error for image ${index}:`, uploadError);
            toast.error(`Failed to upload image ${index + 1}. Please try again.`);
            return;
          }
        }
      }

      const talkData = {
        ...formData,
        bu,
        type: "talk",
        id,
        site: employeeSite || undefined,
        images: imageUrls,
        timestamp: new Date().toISOString(),
      };

      // Save to Firestore using server action
      try {
        const result = await submitManForm(talkData);

        if (result.success) {
          toast.success("Talk report submitted successfully!");
          reset();
          setImages([]);

          // Scroll to top and optionally reload
          window.scrollTo(0, 0);
          window.location.reload();
        } else {
          toast.error(result.error || "Failed to submit Talk report");
        }
      } catch (serverError) {
        console.error("Server action error:", serverError);
        toast.error("Failed to save Talk report. Please try again.");
      }
    } catch (error) {
      console.error("General error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold text-gray-800">
            การสื่อสารกับผู้ใต้บังคับบัญชา / Talk
          </CardTitle>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Topics to talk about */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-800">
                1. เรื่องที่ท่านได้พูดคุยในครั้งนี้ /Topics to talk about
              </Label>
              <div className="grid grid-cols-1 gap-3">
                {talkTopics.map((topic) => (
                  <label key={topic.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      value={topic.id}
                      {...register('selectedTopic', { required: 'Please select a topic' })}
                      className="sr-only"
                    />
                    <div className={`px-3 py-2 rounded-md text-white text-sm font-medium transition-all ${
                      selectedTopic === topic.id
                        ? `${topic.color} opacity-100 ring-2 ring-offset-2 ring-gray-400`
                        : `${topic.color} opacity-70 hover:opacity-90`
                    }`}>
                      {topic.label}
                    </div>
                  </label>
                ))}
              </div>
              {errors.selectedTopic && (
                <p className="text-red-500 text-sm">{errors.selectedTopic?.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Briefly discussed topic */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="talkdetail" className="text-lg font-semibold">
                2. เนื้อหาที่พูดคุยโดยสังเขป /Briefly discussed topic
              </Label>
              <Textarea
                {...register("talkdetail", { required: "Discussed topic is required" })}
                placeholder="เนื้อหาที่พูดคุยโดยสังเขป/Briefly discussed topic"
                className="w-full min-h-[80px]"
              />
              {errors.talkdetail && (
                <p className="text-red-500 text-sm">{errors.talkdetail?.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Place or location to talks */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="place" className="text-lg font-semibold">
                3. สถานที่ หรือพื้นที่ที่ทำการบรรยาย /place or location to talks
              </Label>
              <Input
                {...register("place", { required: "place is required" })}
                placeholder="สถานที่ หรือพื้นที่ที่ทำการอบรม"
                className="w-full"
              />
              {errors.place && (
                <p className="text-red-500 text-sm">{errors.place?.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Number of participate */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="participate" className="text-lg font-semibold">
                4. จำนวนคนที่เข้าร่วมรับฟัง /Number of participate
              </Label>
              <Input
                type="number"
                min="1"
                {...register("participate", {
                  required: "Number of participate is required",
                  valueAsNumber: true,
                  min: { value: 1, message: "Must have at least 1 participant" }
                })}
                placeholder="จำนวนคนที่เข้าร่วมรับฟัง / Number of participate"
                className="w-full"
              />
              {errors.participate && (
                <p className="text-red-500 text-sm">{errors.participate?.message}</p>
              )}
            </div>
          </CardContent>
        </Card>


        {/* Image Upload */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">
                รูปภาพประกอบ (Attach Image) (Optional)
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

        {/* Remark */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label className="text-lg font-semibold">
                หมายเหตุ (Remark) (Optional)
              </Label>
              <Textarea
                {...register("remark")}
                placeholder="กรอกหมายเหตุ..."
                className="w-full min-h-[60px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-md shadow-lg text-lg"
        >
          {isSubmitting ? "Submitting..." : "ส่ง / Submit"}
        </Button>
      </form>
    </div>
  );
}