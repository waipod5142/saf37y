"use client";

import { useState, useEffect } from "react";
import { useForm, FieldValues, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import MultiImageUploader, {
  ImageUpload,
} from "@/components/multi-image-uploader";
import { auth, storage } from "@/firebase/client";
import { signInAnonymously } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getEmployeeByIdAction } from "@/lib/actions/man";
import { submitMethodForm } from "@/lib/actions/method";
import QRCodeComponent from "@/components/qr-code";

interface MethodFormGreaseProps {
  bu: string;
  type: string;
  id: string;
  isInDialog?: boolean;
}

type Language = "th" | "vn" | "lk" | "bd" | "kh";

const translations = {
  th: {
    title: "วิธีการอัดจารบี / Greasing Method",
    staffId: "รหัสพนักงาน Staff ID",
    staffIdPlaceholder: "Staff ID",
    staffIdRequired: "กรุณากรอกรหัสพนักงาน",
    beforeGreasing: "รูปภาพก่อนอัดจารบี (Before Greasing)",
    beforeGreasingRequired: "กรุณาอัปโหลดรูปภาพก่อนอัดจารบี",
    remark: "หมายเหตุ (Remark) (Optional)",
    remarkPlaceholder: "กรอกหมายเหตุ...",
    submit: "ส่ง / Submit",
    submitting: "กำลังส่ง...",
    success: "ส่งแบบฟอร์มสำเร็จ!",
    error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
  },
  vn: {
    title: "Phương pháp bơm mỡ / Greasing Method",
    staffId: "Mã nhân viên Staff ID",
    staffIdPlaceholder: "Mã nhân viên",
    staffIdRequired: "Vui lòng nhập mã nhân viên",
    beforeGreasing: "Hình ảnh trước khi bơm mỡ (Before Greasing)",
    beforeGreasingRequired: "Vui lòng tải lên hình ảnh trước khi bơm mỡ",
    remark: "Ghi chú (Remark) (Tùy chọn)",
    remarkPlaceholder: "Nhập ghi chú...",
    submit: "Gửi / Submit",
    submitting: "Đang gửi...",
    success: "Gửi biểu mẫu thành công!",
    error: "Đã xảy ra lỗi. Vui lòng thử lại",
  },
  lk: {
    title: "Greasing Method",
    staffId: "කාර්ය මණ්ඩල හැඳුනුම්පත Staff ID",
    staffIdPlaceholder: "කාර්ය මණ්ඩල හැඳුනුම්පත",
    staffIdRequired: "කරුණාකර කාර්ය මණ්ඩල හැඳුනුම්පත ඇතුළත් කරන්න",
    beforeGreasing: "Before Greasing",
    beforeGreasingRequired: "කරුණාකර greasing කිරීමට පෙර රූප උඩුගත කරන්න",
    remark: "සටහන (Remark) (විකල්ප)",
    remarkPlaceholder: "සටහන ඇතුළත් කරන්න...",
    submit: "ඉදිරිපත් කරන්න / Submit",
    submitting: "ඉදිරිපත් කරමින්...",
    success: "පෝරමය සාර්ථකව ඉදිරිපත් කරන ලදී!",
    error: "දෝෂයක් ඇති විය. කරුණාකර නැවත උත්සාහ කරන්න",
  },
  bd: {
    title: "Greasing Method",
    staffId: "কর্মচারী আইডি Staff ID",
    staffIdPlaceholder: "কর্মচারী আইডি",
    staffIdRequired: "অনুগ্রহ করে কর্মচারী আইডি লিখুন",
    beforeGreasing: "Before Greasing",
    beforeGreasingRequired: "অনুগ্রহ করে greasing করার আগে ছবি আপলোড করুন",
    remark: "মন্তব্য (Remark) (ঐচ্ছিক)",
    remarkPlaceholder: "মন্তব্য লিখুন...",
    submit: "জমা দিন / Submit",
    submitting: "জমা দেওয়া হচ্ছে...",
    success: "ফর্ম সফলভাবে জমা হয়েছে!",
    error: "একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন",
  },
  // ──────────────────────────────────────────────────────────────────────────
  kh: {
    title: "Greasing Method",
    staffId: "លេខសម្គាល់បុគ្គលិក Staff ID",
    staffIdPlaceholder: "លេខសម្គាល់បុគ្គលិក",
    staffIdRequired: "សូមបញ្ចូលលេខសម្គាល់បុគ្គលិក",
    beforeGreasing: "Before Greasing",
    beforeGreasingRequired: "សូមផ្ទុករូបភាពមុនពេលបូម",
    remark: "សម្គាល់ (Remark) (ជម្រើស)",
    remarkPlaceholder: "បញ្ចូលសម្គាល់...",
    submit: "ដាក់ស្នើ / Submit",
    submitting: "កំពុងដាក់ស្នើ...",
    success: "ដាក់ស្នើទម្រង់បានជោគជ័យ!",
    error: "មានកំហុសកើតឡើង។ សូមព្យាយាមម្តងទៀត",
  },
};

interface GreaseFormData extends FieldValues {
  id: string;
  remark?: string;
  [key: string]: any;
}

export default function MethodFormGrease({
  bu,
  type,
  id,
  isInDialog = false,
}: MethodFormGreaseProps) {
  const router = useRouter();

  // Determine language based on bu (business unit/country)
  const getLanguageFromBu = (bu: string): Language => {
    const buLower = bu.toLowerCase();
    if (buLower === "vn" || buLower === "vietnam") return "vn";
    if (buLower === "lk" || buLower === "srilanka") return "lk";
    if (buLower === "bd" || buLower === "bangladesh") return "bd";
    if (buLower === "kh" || buLower === "cambodia") return "kh";
    return "th"; // Default to Thai
  };

  const language = getLanguageFromBu(bu);
  const t = translations[language];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<GreaseFormData>();

  const [images, setImages] = useState<ImageUpload[]>([]);
  const [employeeSite, setEmployeeSite] = useState<string | undefined>(
    undefined
  );

  // Watch form values
  const staffId = watch("id");

  // Fetch employee data when staff ID changes
  useEffect(() => {
    if (staffId && staffId.trim() !== "") {
      getEmployeeByIdAction(bu, staffId).then((result) => {
        if (result.success && result.employee) {
          setEmployeeSite(result.employee.site);
        }
      });
    }
  }, [staffId, bu]);

  // Generate QR code URL
  const qrUrl = `https://www.saf37y.com/MethodForm/${bu}/${type}/${id}`;

  const onSubmit: SubmitHandler<GreaseFormData> = async (formData) => {
    try {
      // Validate required fields
      if (!formData.id) {
        toast.error(t.staffIdRequired);
        return;
      }

      // Validate at least one image is uploaded
      if (images.length === 0) {
        toast.error(t.beforeGreasingRequired);
        return;
      }

      // Authenticate anonymously if not already authenticated (for Storage upload)
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (authError: any) {
          console.error("Authentication error:", authError);
          toast.error(t.error);
          return;
        }
      }

      // Upload images to Firebase Storage and get download URLs
      const imageUrls: string[] = [];

      for (let index = 0; index < images.length; index++) {
        const image = images[index];
        if (image.file) {
          try {
            const path = `Method/${bu}/${type}/${id}/${Date.now()}-${index}-${image.file.name}`;
            const storageRef = ref(storage, path);

            // Upload file and wait for completion
            const uploadTask = uploadBytesResumable(storageRef, image.file);
            await uploadTask;

            // Get download URL after upload completes
            const downloadURL = await getDownloadURL(storageRef);
            imageUrls.push(downloadURL);
          } catch (uploadError) {
            console.error(`Upload error for image ${index}:`, uploadError);
            toast.error(t.error);
            return;
          }
        }
      }

      const methodData = {
        ...formData, // This includes user-input id as Staff ID
        bu,
        type: type.toLowerCase(),
        site: employeeSite || undefined,
        images: imageUrls,
        timestamp: new Date().toISOString(),
      };

      // Save to Firestore using server action
      try {
        const result = await submitMethodForm(methodData);

        if (result.success) {
          toast.success(t.success);

          // Capture the ID before resetting the form
          const submittedId = formData.id;

          reset();
          setImages([]);

          // Navigate to the Method detail page
          router.push(`/Man/${bu}/Grease/${submittedId}`);
        } else {
          toast.error(result.error || t.error);
        }
      } catch (serverError) {
        console.error("Server action error:", serverError);
        toast.error(t.error);
      }
    } catch (error) {
      console.error("General error:", error);
      toast.error(t.error);
    }
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-center sm:text-left text-xl font-bold text-gray-800">
                {t.title}
              </CardTitle>
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
                {t.staffId}
              </Label>
              <Input
                {...register("id", { required: t.staffIdRequired })}
                placeholder={t.staffIdPlaceholder}
                className="w-full"
              />
              {errors.id && (
                <p className="text-red-500 text-sm">
                  {String(errors.id?.message)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Image Upload - Before Greasing */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">
                {t.beforeGreasing}
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
              <Label className="text-lg font-semibold">{t.remark}</Label>
              <Textarea
                {...register("remark")}
                placeholder={t.remarkPlaceholder}
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
          {isSubmitting ? t.submitting : t.submit}
        </Button>
      </form>
    </div>
  );
}
