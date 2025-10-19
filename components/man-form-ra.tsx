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
import { submitManForm, getEmployeeByIdAction } from "@/lib/actions/man";
import QRCodeComponent from "@/components/qr-code";

interface ManFormRaProps {
  bu: string;
  type: string;
  id: string;
  isInDialog?: boolean;
}

type Language = "th" | "vn";

// FPE categories with colors
const fpeCategories = [
  { id: 'ppe', label: 'Thiết bị bảo hộ cá nhân (PPE)', color: 'bg-blue-500' },
  { id: 'workingAtHeight', label: 'Làm việc trên cao (Working at Height)', color: 'bg-red-500' },
  { id: 'isolation', label: 'Cách ly nguồn điện (Isolation of plant and equipment)', color: 'bg-orange-500' },
  { id: 'vehicles', label: 'Phương tiện và An toàn giao thông (Vehicles and Traffic Safety)', color: 'bg-yellow-500' },
  { id: 'electrical', label: 'An toàn điện (Electrical Safety)', color: 'bg-yellow-400' },
  { id: 'guarding', label: 'Bảo vệ máy móc (Machine Guarding)', color: 'bg-green-500' },
  { id: 'hotwork', label: 'Công việc nóng và Giấy phép (Hot Work and Permits)', color: 'bg-teal-500' },
  { id: 'lifting', label: 'Thiết bị nâng (Lifting Equipment)', color: 'bg-blue-600' },
  { id: 'quarries', label: 'Công việc mỏ đá (Quarries)', color: 'bg-indigo-500' },
  { id: 'hotMaterials', label: 'Vật liệu nóng (Hot Materials)', color: 'bg-purple-500' },
  { id: 'csm', label: 'Quản lý nhà thầu (Contractor Management)', color: 'bg-pink-500' },
  { id: 'equipment', label: 'Thiết bị di động (Portable Equipment)', color: 'bg-purple-400' },
  { id: 'generalWork', label: 'Giấy phép làm việc chung (General Work Permits)', color: 'bg-gray-500' },
];

const translations = {
  th: {
    title: "Mã nhân viên Staff ID ?",
    titleQuestion: "Mã nhân viên Staff ID ?",
    staffIdPlaceholder: "Mã nhân viên Staff ID ?",
    staffIdRequired: "กรุณากรอกรหัสพนักงาน",

    question1Title: "1. Tên của người giám sát (Người phỏng vấn nắm giữ KPI RA) / Name of the supervisor (Interviewer who hold the RA KPI)",
    question1Subtitle:
      "Ghi rõ tên của người giám sát thực hiện phỏng vấn. / Record the name of the supervisor conducting the interview.",
    question1Placeholder: "Tên của người giám sát / Name of the supervisor",
    question1Required: "กรุณากรอกชื่อผู้บังคับบัญชา",

    question2Title: "2. Tên của người được phỏng vấn (Hình ảnh của Người lao động liên quan đến RA) hàng ngày thực hiện việc này với mọi người / Name of the interviewee (Picture of Workers related to RA) daily do this with people inturn",
    question2Subtitle:
      "Ghi rõ tên của người được phỏng vấn và chụp ảnh người lao động. / Record the name of the interviewee and take pictures of workers.",
    question2Placeholder: "Tên của người được phỏng vấn / Name of the interviewee",
    question2Required: "กรุณากรอกชื่อผู้ถูกสัมภาษณ์",

    question3Title: "3. Những FPE nào sẽ được áp dụng cho nhiệm vụ (liệt kê câu trả lời) / Which FPEs shall be applied to the task (list out the answer)",
    question3Subtitle:
      "Liệt kê các thiết bị bảo hộ cá nhân cần thiết cho nhiệm vụ. / List the personal protective equipment required for the task.",
    question3Placeholder: "Liệt kê các FPE / List FPEs",
    question3Required: "กรุณาระบุอุปกรณ์ป้องกันส่วนบุคคล",

    question4Title:
      "4. Những rủi ro tiềm ẩn tại nơi làm việc cụ thể này là gì (liệt kê câu trả lời) / What is potential risks at this specific working place (list out the answer)",
    question4Subtitle:
      "Xác định và liệt kê các rủi ro tiềm ẩn tại nơi làm việc. / Identify and list potential risks at the workplace.",
    question4Placeholder: "Liệt kê các rủi ro tiềm ẩn / List potential risks",
    question4Required: "กรุณาระบุความเสี่ยงที่อาจเกิดขึ้น",

    question5Title:
      "5. Chúng ta kiểm soát những rủi ro tiềm ẩn này tại nơi làm việc cụ thể này như thế nào (liệt kê câu trả lời) / How we control these potential risk at this specific working place (list out the answer)",
    question5Subtitle:
      "Mô tả các biện pháp kiểm soát rủi ro được áp dụng. / Describe the risk control measures applied.",
    question5Placeholder: "Liệt kê các biện pháp kiểm soát / List control measures",
    question5Required: "กรุณาระบุมาตรการควบคุมความเสี่ยง",

    question6Title:
      "6. Họ có hiểu RA không (xác nhận của người giám sát) / Do they understand the RA (confrim by supervisor)",
    question6Subtitle:
      "Xác nhận xem người lao động có hiểu rõ về RA hay không. / Confirm whether the worker understands the RA.",
    question6Placeholder: "Xác nhận hiểu biết về RA / Confirm RA understanding",
    question6Required: "กรุณายืนยันความเข้าใจเกี่ยวกับ RA",

    attachImage: "รูปภาพประกอบ (Attach Image) (Optional)",
    remark: "หมายเหตุ (Remark) (Optional)",
    remarkPlaceholder: "กรอกหมายเหตุ...",
    submit: "ส่ง / Submit",
    submitting: "กำลังส่ง...",
    success: "ส่งแบบฟอร์มสำเร็จ!",
    error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
  },
  vn: {
    title: "Mã nhân viên Staff ID ?",
    titleQuestion: "Mã nhân viên Staff ID ?",
    staffIdPlaceholder: "Mã nhân viên Staff ID ?",
    staffIdRequired: "Vui lòng nhập mã nhân viên",

    question1Title: "1. Tên của người giám sát (Người phỏng vấn nắm giữ KPI RA) / Name of the supervisor (Interviewer who hold the RA KPI)",
    question1Subtitle:
      "Ghi rõ tên của người giám sát thực hiện phỏng vấn. / Record the name of the supervisor conducting the interview.",
    question1Placeholder: "Tên của người giám sát / Name of the supervisor",
    question1Required: "Vui lòng nhập tên người giám sát",

    question2Title: "2. Tên của người được phỏng vấn (Hình ảnh của Người lao động liên quan đến RA) hàng ngày thực hiện việc này với mọi người / Name of the interviewee (Picture of Workers related to RA) daily do this with people inturn",
    question2Subtitle:
      "Ghi rõ tên của người được phỏng vấn và chụp ảnh người lao động. / Record the name of the interviewee and take pictures of workers.",
    question2Placeholder: "Tên của người được phỏng vấn / Name of the interviewee",
    question2Required: "Vui lòng nhập tên người được phỏng vấn",

    question3Title: "3. Những FPE nào sẽ được áp dụng cho nhiệm vụ (liệt kê câu trả lời) / Which FPEs shall be applied to the task (list out the answer)",
    question3Subtitle:
      "Liệt kê các thiết bị bảo hộ cá nhân cần thiết cho nhiệm vụ. / List the personal protective equipment required for the task.",
    question3Placeholder: "Liệt kê các FPE / List FPEs",
    question3Required: "Vui lòng liệt kê các FPE",

    question4Title:
      "4. Những rủi ro tiềm ẩn tại nơi làm việc cụ thể này là gì (liệt kê câu trả lời) / What is potential risks at this specific working place (list out the answer)",
    question4Subtitle:
      "Xác định và liệt kê các rủi ro tiềm ẩn tại nơi làm việc. / Identify and list potential risks at the workplace.",
    question4Placeholder: "Liệt kê các rủi ro tiềm ẩn / List potential risks",
    question4Required: "Vui lòng liệt kê các rủi ro tiềm ẩn",

    question5Title:
      "5. Chúng ta kiểm soát những rủi ro tiềm ẩn này tại nơi làm việc cụ thể này như thế nào (liệt kê câu trả lời) / How we control these potential risk at this specific working place (list out the answer)",
    question5Subtitle:
      "Mô tả các biện pháp kiểm soát rủi ro được áp dụng. / Describe the risk control measures applied.",
    question5Placeholder: "Liệt kê các biện pháp kiểm soát / List control measures",
    question5Required: "Vui lòng liệt kê các biện pháp kiểm soát",

    question6Title:
      "6. Họ có hiểu RA không (xác nhận của người giám sát) / Do they understand the RA (confrim by supervisor)",
    question6Subtitle:
      "Xác nhận xem người lao động có hiểu rõ về RA hay không. / Confirm whether the worker understands the RA.",
    question6Placeholder: "Xác nhận hiểu biết về RA / Confirm RA understanding",
    question6Required: "Vui lòng xác nhận hiểu biết về RA",

    attachImage: "Hình ảnh đính kèm (Attach Image) (Tùy chọn)",
    remark: "Ghi chú (Remark) (Tùy chọn)",
    remarkPlaceholder: "Nhập ghi chú...",
    submit: "Gửi / Submit",
    submitting: "Đang gửi...",
    success: "Gửi biểu mẫu thành công!",
    error: "Đã xảy ra lỗi. Vui lòng thử lại",
  },
};

interface RaFormData extends FieldValues {
  id: string;
  area: string;
  supervisorName: string;
  intervieweeName: string;
  fpeList: string;
  potentialRisks: string;
  riskControls: string;
  understandRA: string;
  remark?: string;
  [key: string]: any;
}

export default function ManFormRa({
  bu,
  type,
  id,
  isInDialog = false,
}: ManFormRaProps) {
  const router = useRouter();

  // Determine language based on bu (business unit/country)
  const getLanguageFromBu = (bu: string): Language => {
    const buLower = bu.toLowerCase();
    if (buLower === "vn" || buLower === "vietnam") return "vn";
    if (buLower === "cmic" || buLower === "cambodia" || buLower === "kh")
      return "th";
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
  } = useForm<RaFormData>();

  const [images, setImages] = useState<ImageUpload[]>([]);
  const [employeeSite, setEmployeeSite] = useState<string | undefined>(
    undefined
  );
  const [selectedFpes, setSelectedFpes] = useState<string[]>([]);

  // Handle FPE selection toggle
  const handleFpeToggle = (fpeId: string) => {
    setSelectedFpes((prev) =>
      prev.includes(fpeId)
        ? prev.filter((id) => id !== fpeId)
        : [...prev, fpeId]
    );
  };

  // Watch staff ID field
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
  const qrUrl = `https://www.saf37y.com/ManForm/${bu}/${type}/${id}`;

  const onSubmit: SubmitHandler<RaFormData> = async (formData) => {
    try {
      // Validate required fields
      if (!formData.id) {
        toast.error(t.staffIdRequired);
        return;
      }

      if (!formData.supervisorName) {
        toast.error(t.question1Required);
        return;
      }

      if (!formData.intervieweeName) {
        toast.error(t.question2Required);
        return;
      }

      if (selectedFpes.length === 0) {
        toast.error(t.question3Required);
        return;
      }

      if (!formData.potentialRisks) {
        toast.error(t.question4Required);
        return;
      }

      if (!formData.riskControls) {
        toast.error(t.question5Required);
        return;
      }

      if (!formData.understandRA) {
        toast.error(t.question6Required);
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
            toast.error(t.error);
            return;
          }
        }
      }

      // Get selected FPE labels
      const selectedFpeLabels = selectedFpes
        .map((fpeId) => fpeCategories.find((cat) => cat.id === fpeId)?.label)
        .filter(Boolean)
        .join(", ");

      const raData = {
        id: formData.id,
        area: id, // URL parameter as area
        bu,
        type: "raform",
        site: employeeSite || undefined,
        supervisorName: formData.supervisorName,
        intervieweeName: formData.intervieweeName,
        fpeList: selectedFpeLabels, // Store as comma-separated string
        potentialRisks: formData.potentialRisks,
        riskControls: formData.riskControls,
        understandRA: formData.understandRA,
        remark: formData.remark,
        images: imageUrls,
        timestamp: new Date().toISOString(),
      };

      // Save to Firestore using server action
      try {
        console.log("Submitting RA data:", raData);
        const result = await submitManForm(raData);
        console.log("Submit result:", result);

        if (result.success) {
          toast.success(t.success);

          // Capture the ID before resetting the form
          const submittedId = formData.id;

          reset();
          setImages([]);
          setSelectedFpes([]);

          // Navigate to the Man detail page
          router.push(`/Man/${bu}/Ra/${submittedId}`);
        } else {
          console.error("Submit failed:", result.error);
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
                Danh sách kiểm tra đánh giá / Risk Assessment Review Checklist
              </CardTitle>
              <p className="text-center sm:text-left text-xl font-extrabold text-purple-600 mt-1">
                Area: {id}
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
                {t.titleQuestion}
              </Label>
              <Input
                {...register("id", { required: t.staffIdRequired })}
                placeholder={t.staffIdPlaceholder}
                className="w-full"
              />
              {errors.id && (
                <p className="text-red-500 text-sm">{errors.id?.message as string}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question 1: Supervisor Name */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="supervisorName" className="text-lg font-semibold">
                {t.question1Title}
              </Label>
              <p className="text-xs text-gray-600 whitespace-pre-line">
                {t.question1Subtitle}
              </p>
              <Textarea
                {...register("supervisorName", {
                  required: t.question1Required,
                })}
                placeholder={t.question1Placeholder}
                className="w-full min-h-[80px]"
              />
              {errors.supervisorName && (
                <p className="text-red-500 text-sm">
                  {errors.supervisorName?.message as string}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question 2: Interviewee Name */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="intervieweeName" className="text-lg font-semibold">
                {t.question2Title}
              </Label>
              <p className="text-xs text-gray-600 whitespace-pre-line">
                {t.question2Subtitle}
              </p>
              <Textarea
                {...register("intervieweeName", {
                  required: t.question2Required,
                })}
                placeholder={t.question2Placeholder}
                className="w-full min-h-[80px]"
              />
              {errors.intervieweeName && (
                <p className="text-red-500 text-sm">
                  {errors.intervieweeName?.message as string}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question 3: FPE List (Multi-selection) */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-800">
                {t.question3Title}
              </Label>
              <p className="text-xs text-gray-600 whitespace-pre-line">
                {t.question3Subtitle}
              </p>
              <div className="grid grid-cols-1 gap-3">
                {fpeCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleFpeToggle(category.id)}
                    className={`px-3 py-2 rounded-md text-white text-sm font-medium transition-all ${
                      selectedFpes.includes(category.id)
                        ? `${category.color} opacity-100 ring-2 ring-offset-2 ring-gray-400`
                        : `${category.color} opacity-50 hover:opacity-90`
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
              {selectedFpes.length === 0 && (
                <p className="text-red-500 text-sm">
                  Vui lòng chọn ít nhất một danh mục FPE / Please select at least one FPE category
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question 4: Potential Risks */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="potentialRisks" className="text-lg font-semibold">
                {t.question4Title}
              </Label>
              <p className="text-xs text-gray-600 whitespace-pre-line">
                {t.question4Subtitle}
              </p>
              <Textarea
                {...register("potentialRisks", {
                  required: t.question4Required,
                })}
                placeholder={t.question4Placeholder}
                className="w-full min-h-[80px]"
              />
              {errors.potentialRisks && (
                <p className="text-red-500 text-sm">
                  {errors.potentialRisks?.message as string}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question 5: Risk Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label
                htmlFor="riskControls"
                className="text-lg font-semibold"
              >
                {t.question5Title}
              </Label>
              <p className="text-xs text-gray-600 whitespace-pre-line">
                {t.question5Subtitle}
              </p>
              <Textarea
                {...register("riskControls", {
                  required: t.question5Required,
                })}
                placeholder={t.question5Placeholder}
                className="w-full min-h-[80px]"
              />
              {errors.riskControls && (
                <p className="text-red-500 text-sm">
                  {errors.riskControls?.message as string}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question 6: Understand RA */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="understandRA" className="text-lg font-semibold">
                {t.question6Title}
              </Label>
              <p className="text-xs text-gray-600 whitespace-pre-line">
                {t.question6Subtitle}
              </p>
              <Textarea
                {...register("understandRA", {
                  required: t.question6Required,
                })}
                placeholder={t.question6Placeholder}
                className="w-full min-h-[80px]"
              />
              {errors.understandRA && (
                <p className="text-red-500 text-sm">
                  {errors.understandRA?.message as string}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Image Upload */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">{t.attachImage}</Label>
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
