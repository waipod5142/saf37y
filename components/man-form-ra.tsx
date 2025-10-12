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

const translations = {
  th: {
    title: "Mã nhân viên Staff ID ?",
    titleQuestion: "Mã nhân viên Staff ID ?",
    staffIdPlaceholder: "Mã nhân viên Staff ID ?",
    staffIdRequired: "กรุณากรอกรหัสพนักงาน",

    question1Title: "1. Tên Người được quan sát / Name of observed people",
    question1Subtitle:
      "Cách kiểm tra: Ghi nhận tên đầy đủ của người được quan sát. / Record the full name of the observed person.\nTiêu chuẩn chấp nhận: Tên của người được quan sát đã được ghi nhận chính xác. / The name of the observed person has been accurately recorded.",
    question1Placeholder: "Tên Người được quan sát / Name of observed people",
    question1Required: "กรุณากรอกชื่อผู้ถูกสังเกต",

    question2Title: "2. Bộ phận/Nhà thầu / Department/Contractor",
    question2Subtitle:
      "Cách kiểm tra: Xác nhận bộ phận hoặc nhà thầu liên quan. / Confirm the department or contractor involved.\nTiêu chuẩn chấp nhận: Thông tin bộ phận/nhà thầu đã được ghi nhận. / The department/contractor information has been recorded.",
    question2Placeholder: "Bộ phận/Nhà thầu / Department/Contractor",
    question2Required: "กรุณากรอกแผนก/ผู้รับเหมา",

    question3Title: "3. Công việc được quan sát / Task observed",
    question3Subtitle:
      "Cách kiểm tra: Ghi nhận công việc đang được quan sát. / Record the task being observed.\nTiêu chuẩn chấp nhận: Công việc được quan sát đã được ghi nhận. / The observed task has been recorded.",
    question3Placeholder: "Công việc được quan sát / Task observed",
    question3Required: "กรุณากรอกงานที่สังเกต",

    question4Title:
      "4. Mã số công việc, thủ tục đang thực hiện / Code of current WI procedure",
    question4Subtitle:
      "Cách kiểm tra: Xác nhận và ghi nhận mã số công việc hoặc thủ tục đang thực hiện. / Confirm and record the code of the current work instruction or procedure.\nTiêu chuẩn chấp nhận: Mã số công việc/thủ tục đã được ghi nhận. / The code of the work instruction/procedure has been recorded.",
    question4Placeholder: "Mã số công việc / Code of current WI procedure",
    question4Required: "กรุณากรอกรหัสขั้นตอนการทำงาน",

    question5Title:
      "5. Các công việc có thể dẫn đến gây thiệt hại về tài sản hoặc gây thương tích không? / Could any of the practices observed result in property damage or injury?",
    question5Subtitle:
      "Cách kiểm tra: Đánh giá và ghi nhận các khả năng gây thiệt hại về tài sản hoặc thương tích. / Assess and record the potential for property damage or injury.\nTiêu chuẩn chấp nhận: Khả năng gây thiệt hại/thương tích đã được ghi nhận. / The potential for damage or injury has been recorded.",
    question5Placeholder:
      "Khả năng gây thiệt hại/thương tích / Potential damage or injury",
    question5Required: "กรุณากรอกความเป็นไปได้ของความเสียหายหรือการบาดเจ็บ",

    question6Title:
      "6. Công nhân có làm theo các bước và yêu cầu của hướng dẫn công việc (PPE; Giấy phép; Cách ly…)? Có Không (Nếu Không, mô tả sự sai lệch và lý do đằng sau sự sai lệch đó) / Did the worker(s) follow all WI steps and task requirements (PPE; Permits; Isolations etc.)? Yes No (If No, describe deviations and the reason behind them)",
    question6Subtitle:
      "Cách kiểm tra: Xác nhận xem công nhân có tuân thủ đầy đủ hướng dẫn công việc hay không. / Confirm whether the worker followed all WI steps and requirements.\nTiêu chuẩn chấp nhận: Tuân thủ hướng dẫn công việc đã được xác nhận. / Compliance with work instructions has been confirmed.",
    question6Placeholder: "Tuân thủ hướng dẫn công việc / Compliance with WI",
    question6Required: "กรุณากรอกการปฏิบัติตามคำแนะนำในการทำงาน",

    question7Title:
      "7. Liệt kê các hành động, thiết bị, điều kiện hoặc cách làm, sự thực hành không an toàn hoặc tiềm ẩn sự không an toàn mà có thể ảnh hưởng đến an toàn, chất lượng, năng suất / List any unsafe / potentially unsafe acts; equipment/conditions or practices that could affect safety, quality, or efficiency",
    question7Subtitle:
      "Cách kiểm tra: Ghi nhận tất cả các hành vi hoặc điều kiện không an toàn tiềm ẩn. / Record all unsafe or potentially unsafe acts or conditions.\nTiêu chuẩn chấp nhận: Các hành động/điều kiện không an toàn đã được ghi nhận. / Unsafe acts/conditions have been recorded.",
    question7Placeholder:
      "Hành động/điều kiện không an toàn / Unsafe acts or conditions",
    question7Required: "กรุณากรอกการกระทำหรือสภาพที่ไม่ปลอดภัย",

    question8Title:
      "8. Liệt kê các hành vi tốt mà bạn quan sát được / List any good behaviours observed",
    question8Subtitle:
      "Cách kiểm tra: Ghi nhận các hành vi tốt được quan sát. / Record the good behaviours observed.\nTiêu chuẩn chấp nhận: Các hành vi tốt đã được ghi nhận. / Good behaviours have been recorded.",
    question8Placeholder: "Các hành vi tốt / Good behaviours",
    question8Required: "กรุณากรอกพฤติกรรมที่ดี",

    question9Title:
      "9. Thảo luận điều bạn quan sát được với công nhân. Ghi nhận lại các điểm chính vào các dòng phía dưới đây / Discuss your observations with the workers. Record any key points below",
    question9Subtitle:
      "Cách kiểm tra: Thảo luận các quan sát với công nhân và ghi lại các điểm chính. / Discuss observations with workers and record key points.\nTiêu chuẩn chấp nhận: Các điểm chính từ cuộc thảo luận đã được ghi nhận. / Key points from the discussion have been recorded.",
    question9Placeholder:
      "Các điểm chính từ cuộc thảo luận / Key points from discussion",
    question9Required: "กรุณากรอกประเด็นสำคัญจากการอภิปราย",

    question10Title:
      "10. Hành động khắc phục được kiến nghị / Suggested Corrective Actions",
    question10Subtitle:
      "Cách kiểm tra: Đề xuất các hành động khắc phục dựa trên quan sát. / Suggest corrective actions based on observations.\nTiêu chuẩn chấp nhận: Các hành động khắc phục đã được ghi nhận. / Corrective actions have been recorded.",
    question10Placeholder: "Hành động khắc phục / Corrective actions",
    question10Required: "กรุณากรอกการดำเนินการแก้ไข",

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

    question1Title: "1. Tên Người được quan sát / Name of observed people",
    question1Subtitle:
      "Cách kiểm tra: Ghi nhận tên đầy đủ của người được quan sát. / Record the full name of the observed person.\nTiêu chuẩn chấp nhận: Tên của người được quan sát đã được ghi nhận chính xác. / The name of the observed person has been accurately recorded.",
    question1Placeholder: "Tên Người được quan sát / Name of observed people",
    question1Required: "Vui lòng nhập tên người được quan sát",

    question2Title: "2. Bộ phận/Nhà thầu / Department/Contractor",
    question2Subtitle:
      "Cách kiểm tra: Xác nhận bộ phận hoặc nhà thầu liên quan. / Confirm the department or contractor involved.\nTiêu chuẩn chấp nhận: Thông tin bộ phận/nhà thầu đã được ghi nhận. / The department/contractor information has been recorded.",
    question2Placeholder: "Bộ phận/Nhà thầu / Department/Contractor",
    question2Required: "Vui lòng nhập bộ phận/nhà thầu",

    question3Title: "3. Công việc được quan sát / Task observed",
    question3Subtitle:
      "Cách kiểm tra: Ghi nhận công việc đang được quan sát. / Record the task being observed.\nTiêu chuẩn chấp nhận: Công việc được quan sát đã được ghi nhận. / The observed task has been recorded.",
    question3Placeholder: "Công việc được quan sát / Task observed",
    question3Required: "Vui lòng nhập công việc được quan sát",

    question4Title:
      "4. Mã số công việc, thủ tục đang thực hiện / Code of current WI procedure",
    question4Subtitle:
      "Cách kiểm tra: Xác nhận và ghi nhận mã số công việc hoặc thủ tục đang thực hiện. / Confirm and record the code of the current work instruction or procedure.\nTiêu chuẩn chấp nhận: Mã số công việc/thủ tục đã được ghi nhận. / The code of the work instruction/procedure has been recorded.",
    question4Placeholder: "Mã số công việc / Code of current WI procedure",
    question4Required: "Vui lòng nhập mã số công việc",

    question5Title:
      "5. Các công việc có thể dẫn đến gây thiệt hại về tài sản hoặc gây thương tích không? / Could any of the practices observed result in property damage or injury?",
    question5Subtitle:
      "Cách kiểm tra: Đánh giá và ghi nhận các khả năng gây thiệt hại về tài sản hoặc thương tích. / Assess and record the potential for property damage or injury.\nTiêu chuẩn chấp nhận: Khả năng gây thiệt hại/thương tích đã được ghi nhận. / The potential for damage or injury has been recorded.",
    question5Placeholder:
      "Khả năng gây thiệt hại/thương tích / Potential damage or injury",
    question5Required: "Vui lòng nhập khả năng gây thiệt hại/thương tích",

    question6Title:
      "6. Công nhân có làm theo các bước và yêu cầu của hướng dẫn công việc (PPE; Giấy phép; Cách ly…)? Có Không (Nếu Không, mô tả sự sai lệch và lý do đằng sau sự sai lệch đó) / Did the worker(s) follow all WI steps and task requirements (PPE; Permits; Isolations etc.)? Yes No (If No, describe deviations and the reason behind them)",
    question6Subtitle:
      "Cách kiểm tra: Xác nhận xem công nhân có tuân thủ đầy đủ hướng dẫn công việc hay không. / Confirm whether the worker followed all WI steps and requirements.\nTiêu chuẩn chấp nhận: Tuân thủ hướng dẫn công việc đã được xác nhận. / Compliance with work instructions has been confirmed.",
    question6Placeholder: "Tuân thủ hướng dẫn công việc / Compliance with WI",
    question6Required: "Vui lòng nhập tuân thủ hướng dẫn công việc",

    question7Title:
      "7. Liệt kê các hành động, thiết bị, điều kiện hoặc cách làm, sự thực hành không an toàn hoặc tiềm ẩn sự không an toàn mà có thể ảnh hưởng đến an toàn, chất lượng, năng suất / List any unsafe / potentially unsafe acts; equipment/conditions or practices that could affect safety, quality, or efficiency",
    question7Subtitle:
      "Cách kiểm tra: Ghi nhận tất cả các hành vi hoặc điều kiện không an toàn tiềm ẩn. / Record all unsafe or potentially unsafe acts or conditions.\nTiêu chuẩn chấp nhận: Các hành động/điều kiện không an toàn đã được ghi nhận. / Unsafe acts/conditions have been recorded.",
    question7Placeholder:
      "Hành động/điều kiện không an toàn / Unsafe acts or conditions",
    question7Required: "Vui lòng nhập hành động/điều kiện không an toàn",

    question8Title:
      "8. Liệt kê các hành vi tốt mà bạn quan sát được / List any good behaviours observed",
    question8Subtitle:
      "Cách kiểm tra: Ghi nhận các hành vi tốt được quan sát. / Record the good behaviours observed.\nTiêu chuẩn chấp nhận: Các hành vi tốt đã được ghi nhận. / Good behaviours have been recorded.",
    question8Placeholder: "Các hành vi tốt / Good behaviours",
    question8Required: "Vui lòng nhập các hành vi tốt",

    question9Title:
      "9. Thảo luận điều bạn quan sát được với công nhân. Ghi nhận lại các điểm chính vào các dòng phía dưới đây / Discuss your observations with the workers. Record any key points below",
    question9Subtitle:
      "Cách kiểm tra: Thảo luận các quan sát với công nhân và ghi lại các điểm chính. / Discuss observations with workers and record key points.\nTiêu chuẩn chấp nhận: Các điểm chính từ cuộc thảo luận đã được ghi nhận. / Key points from the discussion have been recorded.",
    question9Placeholder:
      "Các điểm chính từ cuộc thảo luận / Key points from discussion",
    question9Required: "Vui lòng nhập các điểm chính từ cuộc thảo luận",

    question10Title:
      "10. Hành động khắc phục được kiến nghị / Suggested Corrective Actions",
    question10Subtitle:
      "Cách kiểm tra: Đề xuất các hành động khắc phục dựa trên quan sát. / Suggest corrective actions based on observations.\nTiêu chuẩn chấp nhận: Các hành động khắc phục đã được ghi nhận. / Corrective actions have been recorded.",
    question10Placeholder: "Hành động khắc phục / Corrective actions",
    question10Required: "Vui lòng nhập hành động khắc phục",

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
  observedName: string;
  department: string;
  taskObserved: string;
  procedureCode: string;
  potentialDamageOrInjury: string;
  complianceWI: string;
  unsafeActs: string;
  goodBehaviours: string;
  discussion: string;
  correctiveActions: string;
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

      if (!formData.observedName) {
        toast.error(t.question1Required);
        return;
      }

      if (!formData.department) {
        toast.error(t.question2Required);
        return;
      }

      if (!formData.taskObserved) {
        toast.error(t.question3Required);
        return;
      }

      if (!formData.procedureCode) {
        toast.error(t.question4Required);
        return;
      }

      if (!formData.potentialDamageOrInjury) {
        toast.error(t.question5Required);
        return;
      }
      if (!formData.complianceWI) {
        toast.error(t.question6Required);
        return;
      }
      if (!formData.unsafeActs) {
        toast.error(t.question7Required);
        return;
      }
      if (!formData.goodBehaviours) {
        toast.error(t.question8Required);
        return;
      }
      if (!formData.discussion) {
        toast.error(t.question9Required);
        return;
      }
      if (!formData.correctiveActions) {
        toast.error(t.question10Required);
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

      const raData = {
        ...formData,
        area: id, // URL parameter as area
        bu,
        type: "raform",
        site: employeeSite || undefined,
        images: imageUrls,
        timestamp: new Date().toISOString(),
      };

      // Save to Firestore using server action
      try {
        const result = await submitManForm(raData);

        if (result.success) {
          toast.success(t.success);

          // Capture the ID before resetting the form
          const submittedId = formData.id;

          reset();
          setImages([]);

          // Navigate to the Man detail page
          router.push(`/Man/${bu}/Ra/${submittedId}`);
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
                Danh sách kiểm tra đánh giá / Risk Assessment Checklist
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
                <p className="text-red-500 text-sm">{errors.id?.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question 1: Contact Person */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="observedName" className="text-lg font-semibold">
                {t.question1Title}
              </Label>
              <p className="text-xs text-gray-600 whitespace-pre-line">
                {t.question1Subtitle}
              </p>
              <Textarea
                {...register("observedName", {
                  required: t.question1Required,
                })}
                placeholder={t.question1Placeholder}
                className="w-full min-h-[80px]"
              />
              {errors.observedName && (
                <p className="text-red-500 text-sm">
                  {errors.observedName?.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question 2: Safe Behavior */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="department" className="text-lg font-semibold">
                {t.question2Title}
              </Label>
              <p className="text-xs text-gray-600 whitespace-pre-line">
                {t.question2Subtitle}
              </p>
              <Textarea
                {...register("department", {
                  required: t.question2Required,
                })}
                placeholder={t.question2Placeholder}
                className="w-full min-h-[80px]"
              />
              {errors.department && (
                <p className="text-red-500 text-sm">
                  {errors.department?.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question 3: Unsafe Condition */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="taskObserved" className="text-lg font-semibold">
                {t.question3Title}
              </Label>
              <p className="text-xs text-gray-600 whitespace-pre-line">
                {t.question3Subtitle}
              </p>
              <Textarea
                {...register("taskObserved", {
                  required: t.question3Required,
                })}
                placeholder={t.question3Placeholder}
                className="w-full min-h-[80px]"
              />
              {errors.taskObserved && (
                <p className="text-red-500 text-sm">
                  {errors.taskObserved?.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question 4: Other Issues */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="procedureCode" className="text-lg font-semibold">
                {t.question4Title}
              </Label>
              <p className="text-xs text-gray-600 whitespace-pre-line">
                {t.question4Subtitle}
              </p>
              <Textarea
                {...register("procedureCode", {
                  required: t.question4Required,
                })}
                placeholder={t.question4Placeholder}
                className="w-full min-h-[80px]"
              />
              {errors.procedureCode && (
                <p className="text-red-500 text-sm">
                  {errors.procedureCode?.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question 5: Potential Damage or Injury */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label
                htmlFor="potentialDamageOrInjury"
                className="text-lg font-semibold"
              >
                {t.question5Title}
              </Label>
              <p className="text-xs text-gray-600 whitespace-pre-line">
                {t.question5Subtitle}
              </p>
              <Textarea
                {...register("potentialDamageOrInjury", {
                  required: t.question5Required,
                })}
                placeholder={t.question5Placeholder}
                className="w-full min-h-[80px]"
              />
              {errors.potentialDamageOrInjury && (
                <p className="text-red-500 text-sm">
                  {errors.potentialDamageOrInjury?.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question 6: Compliance with WI */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="complianceWI" className="text-lg font-semibold">
                {t.question6Title}
              </Label>
              <p className="text-xs text-gray-600 whitespace-pre-line">
                {t.question6Subtitle}
              </p>
              <Textarea
                {...register("complianceWI", {
                  required: t.question6Required,
                })}
                placeholder={t.question6Placeholder}
                className="w-full min-h-[80px]"
              />
              {errors.complianceWI && (
                <p className="text-red-500 text-sm">
                  {errors.complianceWI?.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question 7: Unsafe Acts */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="unsafeActs" className="text-lg font-semibold">
                {t.question7Title}
              </Label>
              <p className="text-xs text-gray-600 whitespace-pre-line">
                {t.question7Subtitle}
              </p>
              <Textarea
                {...register("unsafeActs", {
                  required: t.question7Required,
                })}
                placeholder={t.question7Placeholder}
                className="w-full min-h-[80px]"
              />
              {errors.unsafeActs && (
                <p className="text-red-500 text-sm">
                  {errors.unsafeActs?.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question 8: Good Behaviours */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="goodBehaviours" className="text-lg font-semibold">
                {t.question8Title}
              </Label>
              <p className="text-xs text-gray-600 whitespace-pre-line">
                {t.question8Subtitle}
              </p>
              <Textarea
                {...register("goodBehaviours", {
                  required: t.question8Required,
                })}
                placeholder={t.question8Placeholder}
                className="w-full min-h-[80px]"
              />
              {errors.goodBehaviours && (
                <p className="text-red-500 text-sm">
                  {errors.goodBehaviours?.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question 9: Discussion */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="discussion" className="text-lg font-semibold">
                {t.question9Title}
              </Label>
              <p className="text-xs text-gray-600 whitespace-pre-line">
                {t.question9Subtitle}
              </p>
              <Textarea
                {...register("discussion", {
                  required: t.question9Required,
                })}
                placeholder={t.question9Placeholder}
                className="w-full min-h-[80px]"
              />
              {errors.discussion && (
                <p className="text-red-500 text-sm">
                  {errors.discussion?.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question 10: Corrective Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label
                htmlFor="correctiveActions"
                className="text-lg font-semibold"
              >
                {t.question10Title}
              </Label>
              <p className="text-xs text-gray-600 whitespace-pre-line">
                {t.question10Subtitle}
              </p>
              <Textarea
                {...register("correctiveActions", {
                  required: t.question10Required,
                })}
                placeholder={t.question10Placeholder}
                className="w-full min-h-[80px]"
              />
              {errors.correctiveActions && (
                <p className="text-red-500 text-sm">
                  {errors.correctiveActions?.message}
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
