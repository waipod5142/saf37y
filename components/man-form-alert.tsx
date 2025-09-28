"use client";

import { useState } from "react";
import { useForm, FieldValues, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
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
import QRCodeComponent from "@/components/qr-code";

interface ManFormAlertProps {
  bu: string;
  type: string;
  id: string;
  isInDialog?: boolean;
}

interface AlertFormData extends FieldValues {
  id: string;
  alertNo: string;
  typeAccident: string;
  learn: string;
  acknowledge: string;
  remark?: string;
  [key: string]: any;
}

export default function ManFormAlert({ bu, type, id, isInDialog = false }: ManFormAlertProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<AlertFormData>();

  const [images, setImages] = useState<ImageUpload[]>([]);

  // Watch form values
  const typeAccident = watch('typeAccident');
  const acknowledge = watch('acknowledge');

  // Generate QR code URL
  const qrUrl = `https://www.saf37y.com/ManForm/${bu}/${type}/${id}`;

  // Alert topics with colors matching the form image
  const alertTopics = [
    { id: 'fatality', label: 'อุบัติเหตุขั้นเสียชีวิต Fatality Incident', color: 'bg-red-500' },
    { id: 'disability', label: 'อุบัติเหตุขั้นทุพลภาพ/พิการถาวร Permanent Disability', color: 'bg-pink-500' },
    { id: 'lostTime', label: 'อุบัติเหตุบาดเจ็บถึงขั้นหยุดงาน Lost Time Injury Incident', color: 'bg-orange-500' },
    { id: 'critical', label: 'อุบัติเหตุขั้นวิกฤต Critical Incident', color: 'bg-yellow-500' },
    { id: 'medical', label: 'อุบัติเหตุถึงขั้นรักษาพยาบาล Medical Treatment Incident', color: 'bg-yellow-400' },
    { id: 'other', label: 'อื่นๆ________(โปรดระบุ) Other________(Please specify)', color: 'bg-green-500' },
  ];


  const onSubmit: SubmitHandler<AlertFormData> = async (formData) => {
    try {
      // Validate required fields
      if (!formData.id) {
        toast.error("Please enter Staff ID");
        return;
      }

      if (!formData.typeAccident) {
        toast.error("Please select an accident type");
        return;
      }

      if (!formData.learn) {
        toast.error("Please enter lesson learn");
        return;
      }

      if (!formData.acknowledge) {
        toast.error("Please select acknowledge status");
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

      const alertData = {
        ...formData, // This includes user-input id as Staff ID
        alertNo: id, // URL parameter as alertNo
        bu,
        type: type.toLowerCase(),
        images: imageUrls,
        timestamp: new Date().toISOString(),
      };

      // Save to Firestore using server action
      try {
        const result = await submitManForm(alertData);

        if (result.success) {
          toast.success("Safety Alert submitted successfully!");

          // Capture the ID before resetting the form
          const submittedId = formData.id;

          reset();
          setImages([]);

          // Navigate to the Man detail page
          router.push(`/Man/${bu}/Alert/${submittedId}`);
        } else {
          toast.error(result.error || "Failed to submit Safety Alert");
        }
      } catch (serverError) {
        console.error("Server action error:", serverError);
        toast.error("Failed to save Safety Alert. Please try again.");
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-center sm:text-left text-xl font-bold text-gray-800">
                ยืนยันการเข้าใจ Safety Alert
              </CardTitle>
              <p className="text-center sm:text-left text-xl font-extrabold text-red-600 mt-1">
                Alert No: {id}
              </p>
            </div>
            <div className="flex justify-center sm:justify-end flex-shrink-0">
              <QRCodeComponent value={qrUrl} size={100} />
            </div>
          </div>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Staff ID */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="id" className="text-lg font-semibold">
                รหัสพนักงาน Staff ID
              </Label>
              <Input
                {...register("id", { required: "Staff ID is required" })}
                placeholder="Staff ID"
                className="w-full"
              />
              {errors.id && (
                <p className="text-red-500 text-sm">{errors.id?.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Type of accident */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-800">
                1. ประเภทของอุบัติเหตุ Type of accident
              </Label>
              <div className="grid grid-cols-1 gap-3">
                {alertTopics.map((topic) => (
                  <label key={topic.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      value={topic.id}
                      {...register('typeAccident', { required: 'Please select a topic' })}
                      className="sr-only"
                    />
                    <div className={`px-3 py-2 rounded-md text-white text-sm font-medium transition-all ${
                      typeAccident === topic.id
                        ? `${topic.color} opacity-100 ring-2 ring-offset-2 ring-gray-400`
                        : `${topic.color} opacity-70 hover:opacity-90`
                    }`}>
                      {topic.label}
                    </div>
                  </label>
                ))}
              </div>
              {errors.typeAccident && (
                <p className="text-red-500 text-sm">{errors.typeAccident?.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lesson Learn */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="learn" className="text-lg font-semibold">
                2. บทเรียนที่ได้รับ Lesson learn ?
              </Label>
              <Textarea
                {...register("learn", { required: "Lesson learn is required" })}
                placeholder="Lesson learn"
                className="w-full min-h-[80px]"
              />
              {errors.learn && (
                <p className="text-red-500 text-sm">{errors.learn?.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Acknowledgement */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-800">
                3. ฉันเข้าใจและรับทราบคำเตือนนี้ I understand and acknowledge this accident
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value="yes"
                    {...register('acknowledge', { required: 'Please select acknowledge status' })}
                    className="sr-only"
                  />
                  <div className={`px-4 py-2 rounded-md text-white text-sm font-medium transition-all ${
                    acknowledge === "yes"
                      ? "bg-green-500 opacity-100 ring-2 ring-offset-2 ring-gray-400"
                      : "bg-green-500 opacity-70 hover:opacity-90"
                  }`}>
                    เข้าใจ
                  </div>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value="no"
                    {...register('acknowledge', { required: 'Please select acknowledge status' })}
                    className="sr-only"
                  />
                  <div className={`px-4 py-2 rounded-md text-white text-sm font-medium transition-all ${
                    acknowledge === "no"
                      ? "bg-red-500 opacity-100 ring-2 ring-offset-2 ring-gray-400"
                      : "bg-red-500 opacity-70 hover:opacity-90"
                  }`}>
                    ไม่เข้าใจ
                  </div>
                </label>
              </div>
              {errors.acknowledge && (
                <p className="text-red-500 text-sm">{errors.acknowledge?.message}</p>
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