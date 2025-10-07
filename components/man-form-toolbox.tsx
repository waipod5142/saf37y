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
import { useManFormTranslation } from "@/lib/i18n/man-forms";

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
  const { t } = useManFormTranslation(bu);

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
        toast.error(t.toolbox.errors.presenterRequired);
        return;
      }

      if (!formData.subject) {
        toast.error(t.toolbox.errors.subjectRequired);
        return;
      }

      if (!formData.learn) {
        toast.error(t.toolbox.errors.learnRequired);
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
        type: "toolbox",
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
            {t.toolbox.title}
          </CardTitle>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Presenter */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="presenter" className="text-lg font-semibold">
                {t.toolbox.presenter}
              </Label>
              <Input
                {...register("presenter", { required: "Presenter is required" })}
                placeholder={t.toolbox.presenterPlaceholder}
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
                {t.toolbox.subject}
              </Label>
              <Input
                {...register("subject", { required: "Subject is required" })}
                placeholder={t.toolbox.subjectPlaceholder}
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
                {t.toolbox.learn}
              </Label>
              <Textarea
                {...register("learn", { required: "Lesson learn is required" })}
                placeholder={t.toolbox.learnPlaceholder}
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
                {t.common.attachImage} {t.common.optional}
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
                {t.common.remark} {t.common.optional}
              </Label>
              <Textarea
                {...register("remark")}
                placeholder={t.common.remarkPlaceholder}
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
          {isSubmitting ? t.common.submitting : t.common.submit}
        </Button>
      </form>
    </div>
  );
}