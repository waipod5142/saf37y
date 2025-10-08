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
import MultiImageUploader, { ImageUpload } from "@/components/multi-image-uploader";
import { auth, storage } from "@/firebase/client";
import { signInAnonymously } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { submitManForm, getEmployeeByIdAction } from "@/lib/actions/man";
import QRCodeComponent from "@/components/qr-code";

interface ManFormAlertProps {
  bu: string;
  type: string;
  id: string;
  isInDialog?: boolean;
}

type Language = 'th' | 'vn' | 'lk' | 'bd' | 'cmic';

const translations = {
  th: {
    title: "ยืนยันการเข้าใจ Safety Alert",
    alertNo: "Alert No:",
    staffId: "รหัสพนักงาน Staff ID",
    staffIdPlaceholder: "Staff ID",
    staffIdRequired: "กรุณากรอกรหัสพนักงาน",
    typeOfAccident: "1. ประเภทของอุบัติเหตุ Type of accident",
    selectAccidentType: "กรุณาเลือกประเภทอุบัติเหตุ",
    fatality: "อุบัติเหตุขั้นเสียชีวิต Fatality Incident",
    disability: "อุบัติเหตุขั้นทุพลภาพ/พิการถาวร Permanent Disability",
    lostTime: "อุบัติเหตุบาดเจ็บถึงขั้นหยุดงาน Lost Time Injury Incident",
    critical: "อุบัติเหตุขั้นวิกฤต Critical Incident",
    medical: "อุบัติเหตุถึงขั้นรักษาพยาบาล Medical Treatment Incident",
    other: "อื่นๆ________(โปรดระบุ) Other________(Please specify)",
    lessonLearn: "2. บทเรียนที่ได้รับ Lesson learn ?",
    lessonLearnPlaceholder: "Lesson learn",
    lessonLearnRequired: "กรุณากรอกบทเรียนที่ได้รับ",
    acknowledge: "3. ฉันเข้าใจและรับทราบคำเตือนนี้ I understand and acknowledge this accident",
    acknowledgeRequired: "กรุณาเลือกการยืนยัน",
    understand: "เข้าใจ",
    notUnderstand: "ไม่เข้าใจ",
    attachImage: "รูปภาพประกอบ (Attach Image) (Optional)",
    remark: "หมายเหตุ (Remark) (Optional)",
    remarkPlaceholder: "กรอกหมายเหตุ...",
    submit: "ส่ง / Submit",
    submitting: "กำลังส่ง...",
    success: "ส่งแบบฟอร์มสำเร็จ!",
    error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
  },
  vn: {
    title: "Xác nhận hiểu Cảnh báo An toàn",
    alertNo: "Số Cảnh báo:",
    staffId: "Mã nhân viên Staff ID",
    staffIdPlaceholder: "Mã nhân viên",
    staffIdRequired: "Vui lòng nhập mã nhân viên",
    typeOfAccident: "1. Loại tai nạn Type of accident",
    selectAccidentType: "Vui lòng chọn loại tai nạn",
    fatality: "Tai nạn tử vong Fatality Incident",
    disability: "Tai nạn tàn tật vĩnh viễn Permanent Disability",
    lostTime: "Tai nạn nghỉ việc Lost Time Injury Incident",
    critical: "Tai nạn nghiêm trọng Critical Incident",
    medical: "Tai nạn cần điều trị y tế Medical Treatment Incident",
    other: "Khác________(Vui lòng ghi rõ) Other________(Please specify)",
    lessonLearn: "2. Bài học kinh nghiệm Lesson learn ?",
    lessonLearnPlaceholder: "Bài học kinh nghiệm",
    lessonLearnRequired: "Vui lòng nhập bài học kinh nghiệm",
    acknowledge: "3. Tôi hiểu và xác nhận cảnh báo này I understand and acknowledge this accident",
    acknowledgeRequired: "Vui lòng chọn xác nhận",
    understand: "Hiểu",
    notUnderstand: "Không hiểu",
    attachImage: "Hình ảnh đính kèm (Attach Image) (Tùy chọn)",
    remark: "Ghi chú (Remark) (Tùy chọn)",
    remarkPlaceholder: "Nhập ghi chú...",
    submit: "Gửi / Submit",
    submitting: "Đang gửi...",
    success: "Gửi biểu mẫu thành công!",
    error: "Đã xảy ra lỗi. Vui lòng thử lại",
  },
  lk: {
    title: "ආරක්ෂණ අනතුරු ඇඟවීම තේරුම් ගැනීම තහවුරු කරන්න",
    alertNo: "අනතුරු ඇඟවීම අංකය:",
    staffId: "කාර්ය මණ්ඩල හැඳුනුම්පත Staff ID",
    staffIdPlaceholder: "කාර්ය මණ්ඩල හැඳුනුම්පත",
    staffIdRequired: "කරුණාකර කාර්ය මණ්ඩල හැඳුනුම්පත ඇතුළත් කරන්න",
    typeOfAccident: "1. අනතුරේ වර්ගය Type of accident",
    selectAccidentType: "කරුණාකර අනතුරේ වර්ගයක් තෝරන්න",
    fatality: "මාරාන්තික අනතුර Fatality Incident",
    disability: "ස්ථිර ආබාධිත අනතුර Permanent Disability",
    lostTime: "වැඩ නැවතුම් තුවාල අනතුර Lost Time Injury Incident",
    critical: "තීව්‍ර අනතුර Critical Incident",
    medical: "වෛද්‍ය ප්‍රතිකාර අනතුර Medical Treatment Incident",
    other: "වෙනත්________(කරුණාකර සඳහන් කරන්න) Other________(Please specify)",
    lessonLearn: "2. ලැබුණු පාඩම Lesson learn ?",
    lessonLearnPlaceholder: "ලැබුණු පාඩම",
    lessonLearnRequired: "කරුණාකර ලැබුණු පාඩම ඇතුළත් කරන්න",
    acknowledge: "3. මම මෙම අනතුරු ඇඟවීම තේරුම් ගෙන පිළිගනිමි I understand and acknowledge this accident",
    acknowledgeRequired: "කරුණාකර තහවුරු කිරීම තෝරන්න",
    understand: "තේරෙනවා",
    notUnderstand: "තේරෙන්නේ නැහැ",
    attachImage: "ඡායාරූප ඇමිණීම (Attach Image) (විකල්ප)",
    remark: "සටහන (Remark) (විකල්ප)",
    remarkPlaceholder: "සටහන ඇතුළත් කරන්න...",
    submit: "ඉදිරිපත් කරන්න / Submit",
    submitting: "ඉදිරිපත් කරමින්...",
    success: "පෝරමය සාර්ථකව ඉදිරිපත් කරන ලදී!",
    error: "දෝෂයක් ඇති විය. කරුණාකර නැවත උත්සාහ කරන්න",
  },
  bd: {
    title: "নিরাপত্তা সতর্কতা বুঝতে নিশ্চিত করুন",
    alertNo: "সতর্কতা নং:",
    staffId: "কর্মচারী আইডি Staff ID",
    staffIdPlaceholder: "কর্মচারী আইডি",
    staffIdRequired: "অনুগ্রহ করে কর্মচারী আইডি লিখুন",
    typeOfAccident: "1. দুর্ঘটনার ধরন Type of accident",
    selectAccidentType: "অনুগ্রহ করে দুর্ঘটনার ধরন নির্বাচন করুন",
    fatality: "মারাত্মক দুর্ঘটনা Fatality Incident",
    disability: "স্থায়ী পঙ্গুত্ব দুর্ঘটনা Permanent Disability",
    lostTime: "কাজ বন্ধের আঘাত দুর্ঘটনা Lost Time Injury Incident",
    critical: "গুরুতর দুর্ঘটনা Critical Incident",
    medical: "চিকিৎসা প্রয়োজন দুর্ঘটনা Medical Treatment Incident",
    other: "অন্যান্য________(অনুগ্রহ করে উল্লেখ করুন) Other________(Please specify)",
    lessonLearn: "2. শিক্ষা গ্রহণ Lesson learn ?",
    lessonLearnPlaceholder: "শিক্ষা গ্রহণ",
    lessonLearnRequired: "অনুগ্রহ করে শিক্ষা গ্রহণ লিখুন",
    acknowledge: "3. আমি এই সতর্কতা বুঝি এবং স্বীকার করি I understand and acknowledge this accident",
    acknowledgeRequired: "অনুগ্রহ করে নিশ্চিতকরণ নির্বাচন করুন",
    understand: "বুঝি",
    notUnderstand: "বুঝি না",
    attachImage: "ছবি সংযুক্ত করুন (Attach Image) (ঐচ্ছিক)",
    remark: "মন্তব্য (Remark) (ঐচ্ছিক)",
    remarkPlaceholder: "মন্তব্য লিখুন...",
    submit: "জমা দিন / Submit",
    submitting: "জমা দেওয়া হচ্ছে...",
    success: "ফর্ম সফলভাবে জমা হয়েছে!",
    error: "একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন",
  },
  cmic: {
    title: "បញ្ជាក់ការយល់ដឹងអំពីការព្រមានសុវត្ថិភាព",
    alertNo: "លេខការព្រមាន:",
    staffId: "លេខសម្គាល់បុគ្គលិក Staff ID",
    staffIdPlaceholder: "លេខសម្គាល់បុគ្គលិក",
    staffIdRequired: "សូមបញ្ចូលលេខសម្គាល់បុគ្គលិក",
    typeOfAccident: "1. ប្រភេទនៃគ្រោះថ្នាក់ Type of accident",
    selectAccidentType: "សូមជ្រើសរើសប្រភេទនៃគ្រោះថ្នាក់",
    fatality: "គ្រោះថ្នាក់ស្លាប់ Fatality Incident",
    disability: "គ្រោះថ្នាក់ពិការអចិន្ត្រៃយ៍ Permanent Disability",
    lostTime: "គ្រោះថ្នាក់រងរបួសបញ្ឈប់ការងារ Lost Time Injury Incident",
    critical: "គ្រោះថ្នាក់ធ្ងន់ធ្ងរ Critical Incident",
    medical: "គ្រោះថ្នាក់ត្រូវការព្យាបាល Medical Treatment Incident",
    other: "ផ្សេងទៀត________(សូមបញ្ជាក់) Other________(Please specify)",
    lessonLearn: "2. មេរៀនដែលបានទទួល Lesson learn ?",
    lessonLearnPlaceholder: "មេរៀនដែលបានទទួល",
    lessonLearnRequired: "សូមបញ្ចូលមេរៀនដែលបានទទួល",
    acknowledge: "3. ខ្ញុំយល់ និងទទួលស្គាល់ការព្រមាននេះ I understand and acknowledge this accident",
    acknowledgeRequired: "សូមជ្រើសរើសការបញ្ជាក់",
    understand: "យល់",
    notUnderstand: "មិនយល់",
    attachImage: "ភ្ជាប់រូបភាព (Attach Image) (ជម្រើស)",
    remark: "សម្គាល់ (Remark) (ជម្រើស)",
    remarkPlaceholder: "បញ្ចូលសម្គាល់...",
    submit: "ដាក់ស្នើ / Submit",
    submitting: "កំពុងដាក់ស្នើ...",
    success: "ដាក់ស្នើទម្រង់បានជោគជ័យ!",
    error: "មានកំហុសកើតឡើង។ សូមព្យាយាមម្តងទៀត",
  },
};

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

  // Determine language based on bu (business unit/country)
  const getLanguageFromBu = (bu: string): Language => {
    const buLower = bu.toLowerCase();
    if (buLower === 'vn' || buLower === 'vietnam') return 'vn';
    if (buLower === 'lk' || buLower === 'srilanka') return 'lk';
    if (buLower === 'bd' || buLower === 'bangladesh') return 'bd';
    if (buLower === 'cmic' || buLower === 'cambodia') return 'cmic';
    return 'th'; // Default to Thai
  };

  const language = getLanguageFromBu(bu);
  const t = translations[language];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<AlertFormData>();

  const [images, setImages] = useState<ImageUpload[]>([]);
  const [employeeSite, setEmployeeSite] = useState<string | undefined>(undefined);

  // Watch form values
  const typeAccident = watch('typeAccident');
  const acknowledge = watch('acknowledge');
  const staffId = watch('id');

  // Fetch employee data when staff ID changes
  useEffect(() => {
    if (staffId && staffId.trim() !== '') {
      getEmployeeByIdAction(bu, staffId).then((result) => {
        if (result.success && result.employee) {
          setEmployeeSite(result.employee.site);
        }
      });
    }
  }, [staffId, bu]);

  // Generate QR code URL
  const qrUrl = `https://www.saf37y.com/ManForm/${bu}/${type}/${id}`;

  // Alert topics with colors matching the form image
  const alertTopics = [
    { id: 'fatality', label: t.fatality, color: 'bg-red-500' },
    { id: 'disability', label: t.disability, color: 'bg-pink-500' },
    { id: 'lostTime', label: t.lostTime, color: 'bg-orange-500' },
    { id: 'critical', label: t.critical, color: 'bg-yellow-500' },
    { id: 'medical', label: t.medical, color: 'bg-yellow-400' },
    { id: 'other', label: t.other, color: 'bg-green-500' },
  ];


  const onSubmit: SubmitHandler<AlertFormData> = async (formData) => {
    try {
      // Validate required fields
      if (!formData.id) {
        toast.error(t.staffIdRequired);
        return;
      }

      if (!formData.typeAccident) {
        toast.error(t.selectAccidentType);
        return;
      }

      if (!formData.learn) {
        toast.error(t.lessonLearnRequired);
        return;
      }

      if (!formData.acknowledge) {
        toast.error(t.acknowledgeRequired);
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

      const alertData = {
        ...formData, // This includes user-input id as Staff ID
        alertNo: id, // URL parameter as alertNo
        bu,
        type: "alertform",
        site: employeeSite || undefined,
        images: imageUrls,
        timestamp: new Date().toISOString(),
      };

      // Save to Firestore using server action
      try {
        const result = await submitManForm(alertData);

        if (result.success) {
          toast.success(t.success);

          // Capture the ID before resetting the form
          const submittedId = formData.id;

          reset();
          setImages([]);

          // Navigate to the Man detail page
          router.push(`/Man/${bu}/Alert/${submittedId}`);
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
              <p className="text-center sm:text-left text-xl font-extrabold text-red-600 mt-1">
                {t.alertNo} {id}
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
                {t.staffId}
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

        {/* Type of accident */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-800">
                {t.typeOfAccident}
              </Label>
              <div className="grid grid-cols-1 gap-3">
                {alertTopics.map((topic) => (
                  <label key={topic.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      value={topic.id}
                      {...register('typeAccident', { required: t.selectAccidentType })}
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
                {t.lessonLearn}
              </Label>
              <Textarea
                {...register("learn", { required: t.lessonLearnRequired })}
                placeholder={t.lessonLearnPlaceholder}
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
                {t.acknowledge}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value="yes"
                    {...register('acknowledge', { required: t.acknowledgeRequired })}
                    className="sr-only"
                  />
                  <div className={`px-4 py-2 rounded-md text-white text-sm font-medium transition-all ${
                    acknowledge === "yes"
                      ? "bg-green-500 opacity-100 ring-2 ring-offset-2 ring-gray-400"
                      : "bg-green-500 opacity-70 hover:opacity-90"
                  }`}>
                    {t.understand}
                  </div>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value="no"
                    {...register('acknowledge', { required: t.acknowledgeRequired })}
                    className="sr-only"
                  />
                  <div className={`px-4 py-2 rounded-md text-white text-sm font-medium transition-all ${
                    acknowledge === "no"
                      ? "bg-red-500 opacity-100 ring-2 ring-offset-2 ring-gray-400"
                      : "bg-red-500 opacity-70 hover:opacity-90"
                  }`}>
                    {t.notUnderstand}
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
                {t.attachImage}
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
                {t.remark}
              </Label>
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