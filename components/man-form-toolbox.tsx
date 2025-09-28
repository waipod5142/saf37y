"use client";

import { useState } from "react";
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
import { submitManForm } from "@/lib/actions/man";

interface ManFormToolboxProps {
  bu: string;
  type: string;
  id: string;
  isInDialog?: boolean;
}

interface ToolboxTalkFormData extends FieldValues {
  presenter: string;
  subject: string;
  learn: string;
  remark?: string;
  [key: string]: any;
}

export default function ManFormToolbox({ bu, type, id, isInDialog = false }: ManFormToolboxProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ToolboxTalkFormData>();

  const [images, setImages] = useState<ImageUpload[]>([]);


  const onSubmit: SubmitHandler<ToolboxTalkFormData> = async (formData) => {
    try {
      // Validate required fields
      if (!formData.presenter) {
        toast.error("Please enter presenter name");
        return;
      }

      if (!formData.subject) {
        toast.error("Please enter subject");
        return;
      }

      if (!formData.learn) {
        toast.error("Please enter lesson learned");
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

      const toolboxTalkData = {
        ...formData,
        bu,
        type: type.toLowerCase(),
        id,
        images: imageUrls,
        timestamp: new Date().toISOString(),
      };

      // Save to Firestore using server action
      try {
        const result = await submitManForm(toolboxTalkData);

        if (result.success) {
          toast.success("Toolbox Talk report submitted successfully!");
          reset();
          setImages([]);

          // Scroll to top and optionally reload
          window.scrollTo(0, 0);
          window.location.reload();
        } else {
          toast.error(result.error || "Failed to submit Toolbox Talk report");
        }
      } catch (serverError) {
        console.error("Server action error:", serverError);
        toast.error("Failed to save Toolbox Talk report. Please try again.");
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
            การพูดคุยด้านความปลอดภัย Safety / Toolbox Talk
          </CardTitle>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Presenter */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="presenter" className="text-lg font-semibold">
                ผู้นำเสนอ: Presenter
              </Label>
              <Input
                {...register("presenter", { required: "Presenter is required" })}
                placeholder="Presenter"
                className="w-full"
              />
              {errors.presenter && (
                <p className="text-red-500 text-sm">{errors.presenter?.message as string}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Subject */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-lg font-semibold">
                หัวข้อของการพูดคุยด้านความปลอดภัย: Subject
              </Label>
              <Input
                {...register("subject", { required: "Subject is required" })}
                placeholder="Subject of Toolbox Talk"
                className="w-full"
              />
              {errors.subject && (
                <p className="text-red-500 text-sm">{errors.subject?.message as string}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lesson Learn */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="learn" className="text-lg font-semibold">
                บทเรียนที่ได้รับจากการพูดคุยด้านความปลอดภัย: Lesson Learn
              </Label>
              <Textarea
                {...register("learn", { required: "Lesson learn is required" })}
                placeholder="Lesson learn"
                className="w-full min-h-[80px]"
              />
              {errors.learn && (
                <p className="text-red-500 text-sm">{errors.learn?.message as string}</p>
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