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

interface ManFormBootProps {
  bu: string;
  type: string;
  id: string;
  isInDialog?: boolean;
}

type Language = "th" | "vn" | "lk" | "bd" | "kh";

const translations = {
  th: {
    title: "Mã nhân viên Staff ID ?",
    titleQuestion: "Mã nhân viên Staff ID ?",
    staffIdPlaceholder: "Mã nhân viên Staff ID ?",
    staffIdRequired: "กรุณากรอกรหัสพนักงาน",

    question1Title:
      "1. Tên người bạn đã thảo luận với / Name of contact person you have discussed with",
    question1Subtitle:
      "Cách kiểm tra: Ghi nhận tên người bạn đã thảo luận về an toàn. / Record the name of the person you discussed safety with.\nTiêu chuẩn chấp nhận: Tên người đã được thảo luận đã được ghi nhận. / The name of the contact person has been recorded.",
    question1Placeholder: "Tên người bạn đã thảo luận với / Name",
    question1Required: "กรุณากรอกชื่อผู้ที่พูดคุยด้วย",

    question2Title:
      "2. Bình luận về hành vi an toàn / Comment on safe behavior",
    question2Subtitle:
      "Cách kiểm tra: Ghi nhận và bình luận về hành vi an toàn được quan sát. / Record and comment on the safe behavior observed.\nTiêu chuẩn chấp nhận: Bình luận về hành vi an toàn đã được ghi nhận. / Comments on safe behavior have been recorded.",
    question2Placeholder: "Bình luận về hành vi an toàn / Comment...",
    question2Required: "กรุณากรอกความคิดเห็นเกี่ยวกับพฤติกรรมที่ปลอดภัย",

    question3Title:
      "3. Bình luận về điều kiện không an toàn / Comment on unsafe condition",
    question3Subtitle:
      "Cách kiểm tra: Xác định và ghi nhận các điều kiện không an toàn. / Identify and record unsafe conditions.\nTiêu chuẩn chấp nhận: Bình luận về điều kiện không an toàn đã được ghi nhận. / Comments on unsafe conditions have been recorded.",
    question3Placeholder: "Bình luận về điều kiện không an toàn /",
    question3Required: "กรุณากรอกความคิดเห็นเกี่ยวกับสภาพที่ไม่ปลอดภัย",

    question4Title: "4. Thảo luận các vấn đề khác / Discuss other issues",
    question4Subtitle:
      "Cách kiểm tra: Ghi nhận các vấn đề khác được thảo luận. / Record other issues discussed.\nTiêu chuẩn chấp nhận: Các vấn đề khác đã được ghi nhận. / Other issues have been recorded.",
    question4Placeholder: "Thảo luận các vấn đề khác / Discuss o",
    question4Required: "กรุณากรอกประเด็นอื่นๆ ที่พูดคุย",

    question5Title:
      "5. Nhận được sự đồng ý để làm việc an toàn / Get agreement to work safely",
    question5Subtitle:
      "Cách kiểm tra: Xác nhận sự đồng ý làm việc an toàn từ tất cả các bên liên quan. / Confirm the agreement to work safely from all parties involved.\nTiêu chuẩn chấp nhận: Sự đồng ý làm việc an toàn đã được xác nhận. / The agreement to work safely has been confirmed.",
    question5Placeholder: "Nhận được sự đồng ý để làm việc an to",
    question5Required: "กรุณากรอกการยืนยันความตกลงในการทำงานอย่างปลอดภัย",

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

    question1Title:
      "1. Tên người bạn đã thảo luận với / Name of contact person you have discussed with",
    question1Subtitle:
      "Cách kiểm tra: Ghi nhận tên người bạn đã thảo luận về an toàn. / Record the name of the person you discussed safety with.\nTiêu chuẩn chấp nhận: Tên người đã được thảo luận đã được ghi nhận. / The name of the contact person has been recorded.",
    question1Placeholder: "Tên người bạn đã thảo luận với / Name",
    question1Required: "Vui lòng nhập tên người đã thảo luận",

    question2Title:
      "2. Bình luận về hành vi an toàn / Comment on safe behavior",
    question2Subtitle:
      "Cách kiểm tra: Ghi nhận và bình luận về hành vi an toàn được quan sát. / Record and comment on the safe behavior observed.\nTiêu chuẩn chấp nhận: Bình luận về hành vi an toàn đã được ghi nhận. / Comments on safe behavior have been recorded.",
    question2Placeholder: "Bình luận về hành vi an toàn / Comment...",
    question2Required: "Vui lòng nhập nhận xét về hành vi an toàn",

    question3Title:
      "3. Bình luận về điều kiện không an toàn / Comment on unsafe condition",
    question3Subtitle:
      "Cách kiểm tra: Xác định và ghi nhận các điều kiện không an toàn. / Identify and record unsafe conditions.\nTiêu chuẩn chấp nhận: Bình luận về điều kiện không an toàn đã được ghi nhận. / Comments on unsafe conditions have been recorded.",
    question3Placeholder: "Bình luận về điều kiện không an toàn /",
    question3Required: "Vui lòng nhập nhận xét về điều kiện không an toàn",

    question4Title: "4. Thảo luận các vấn đề khác / Discuss other issues",
    question4Subtitle:
      "Cách kiểm tra: Ghi nhận các vấn đề khác được thảo luận. / Record other issues discussed.\nTiêu chuẩn chấp nhận: Các vấn đề khác đã được ghi nhận. / Other issues have been recorded.",
    question4Placeholder: "Thảo luận các vấn đề khác / Discuss o",
    question4Required: "Vui lòng nhập các vấn đề khác đã thảo luận",

    question5Title:
      "5. Nhận được sự đồng ý để làm việc an toàn / Get agreement to work safely",
    question5Subtitle:
      "Cách kiểm tra: Xác nhận sự đồng ý làm việc an toàn từ tất cả các bên liên quan. / Confirm the agreement to work safely from all parties involved.\nTiêu chuẩn chấp nhận: Sự đồng ý làm việc an toàn đã được xác nhận. / The agreement to work safely has been confirmed.",
    question5Placeholder: "Nhận được sự đồng ý để làm việc an to",
    question5Required: "Vui lòng nhập xác nhận thỏa thuận làm việc an toàn",

    attachImage: "Hình ảnh đính kèm (Attach Image) (Tùy chọn)",
    remark: "Ghi chú (Remark) (Tùy chọn)",
    remarkPlaceholder: "Nhập ghi chú...",
    submit: "Gửi / Submit",
    submitting: "Đang gửi...",
    success: "Gửi biểu mẫu thành công!",
    error: "Đã xảy ra lỗi. Vui lòng thử lại",
  },
  lk: {
    title: "කාර්ය මණ්ඩල හැඳුනුම්පත Staff ID ?",
    titleQuestion: "කාර්ය මණ්ඩල හැඳුනුම්පත Staff ID ?",
    staffIdPlaceholder: "කාර්ය මණ්ඩල හැඳුනුම්පත Staff ID ?",
    staffIdRequired: "කරුණාකර කාර්ය මණ්ඩල හැඳුනුම්පත ඇතුළත් කරන්න",

    question1Title:
      "1. ඔබ සාකච්ඡා කළ සම්බන්ධතා පුද්ගලයාගේ නම / Name of contact person you have discussed with",
    question1Subtitle:
      "පරීක්ෂා කිරීමේ ක්‍රමය: ඔබ ආරක්ෂාව ගැන සාකච්ඡා කළ පුද්ගලයාගේ නම සටහන් කරන්න.\nසම්මත මිණුම: සම්බන්ධතා පුද්ගලයාගේ නම සටහන් කර ඇත.",
    question1Placeholder: "සම්බන්ධතා පුද්ගලයාගේ නම / Name",
    question1Required: "කරුණාකර සාකච්ඡා කළ පුද්ගලයාගේ නම ඇතුළත් කරන්න",

    question2Title:
      "2. ආරක්ෂිත හැසිරීම පිළිබඳ අදහස් / Comment on safe behavior",
    question2Subtitle:
      "පරීක්ෂා කිරීමේ ක්‍රමය: නිරීක්ෂණය කළ ආරක්ෂිත හැසිරීම සටහන් කර අදහස් දක්වන්න.\nසම්මත මිණුම: ආරක්ෂිත හැසිරීම පිළිබඳ අදහස් සටහන් කර ඇත.",
    question2Placeholder: "ආරක්ෂිත හැසිරීම පිළිබඳ අදහස් / Comment...",
    question2Required: "කරුණාකර ආරක්ෂිත හැසිරීම පිළිබඳ අදහස් ඇතුළත් කරන්න",

    question3Title:
      "3. අනාරක්ෂිත තත්ත්වය පිළිබඳ අදහස් / Comment on unsafe condition",
    question3Subtitle:
      "පරීක්ෂා කිරීමේ ක්‍රමය: අනාරක්ෂිත තත්ත්වයන් හඳුනාගෙන සටහන් කරන්න.\nසම්මත මිණුම: අනාරක්ෂිත තත්ත්වය පිළිබඳ අදහස් සටහන් කර ඇත.",
    question3Placeholder: "අනාරක්ෂිත තත්ත්වය පිළිබඳ අදහස් /",
    question3Required: "කරුණාකර අනාරක්ෂිත තත්ත්වය පිළිබඳ අදහස් ඇතුළත් කරන්න",

    question4Title: "4. වෙනත් ගැටළු සාකච්ඡා කරන්න / Discuss other issues",
    question4Subtitle:
      "පරීක්ෂා කිරීමේ ක්‍රමය: සාකච්ඡා කළ වෙනත් ගැටළු සටහන් කරන්න.\nසම්මත මිණුම: වෙනත් ගැටළු සටහන් කර ඇත.",
    question4Placeholder: "වෙනත් ගැටළු සාකච්ඡා කරන්න / Discuss",
    question4Required: "කරුණාකර සාකච්ඡා කළ වෙනත් ගැටළු ඇතුළත් කරන්න",

    question5Title:
      "5. ආරක්ෂිතව වැඩ කිරීමට එකඟතාව ලබා ගන්න / Get agreement to work safely",
    question5Subtitle:
      "පරීක්ෂා කිරීමේ ක්‍රමය: සියලුම පාර්ශ්වයන්ගෙන් ආරක්ෂිතව වැඩ කිරීමට එකඟතාව තහවුරු කරන්න.\nසම්මත මිණුම: ආරක්ෂිතව වැඩ කිරීමට එකඟතාව තහවුරු කර ඇත.",
    question5Placeholder: "ආරක්ෂිතව වැඩ කිරීමට එකඟතාව",
    question5Required: "කරුණාකර ආරක්ෂිතව වැඩ කිරීමට එකඟතාව ඇතුළත් කරන්න",

    attachImage: "ඡායාරූප ඇමිණීම (Attach Image) (විකල්ප)",
    remark: "සටහන (Remark) (විකල්ප)",
    remarkPlaceholder: "සටහන ඇතුළත් කරන්න...",
    submit: "ඉදිරිපත් කරන්න / Submit",
    submitting: "ඉදිරිපත් කරමින්...",
    success: "පෝරමය සාර්ථකව ඉදිරිපත් කරන ලදී!",
    error: "දෝෂයක් ඇති විය. කරුණාකර නැවත උත්සාහ කරන්න",
  },
  bd: {
    title: "কর্মচারী আইডি Staff ID ?",
    titleQuestion: "কর্মচারী আইডি Staff ID ?",
    staffIdPlaceholder: "কর্মচারী আইডি Staff ID ?",
    staffIdRequired: "অনুগ্রহ করে কর্মচারী আইডি লিখুন",

    question1Title:
      "1. আপনি যার সাথে আলোচনা করেছেন তার নাম / Name of contact person you have discussed with",
    question1Subtitle:
      "পরীক্ষার পদ্ধতি: যে ব্যক্তির সাথে নিরাপত্তা নিয়ে আলোচনা করেছেন তার নাম লিখুন।\nগ্রহণযোগ্য মান: যোগাযোগ ব্যক্তির নাম লিপিবদ্ধ করা হয়েছে।",
    question1Placeholder: "যোগাযোগ ব্যক্তির নাম / Name",
    question1Required: "অনুগ্রহ করে আলোচিত ব্যক্তির নাম লিখুন",

    question2Title:
      "2. নিরাপদ আচরণ সম্পর্কে মন্তব্য / Comment on safe behavior",
    question2Subtitle:
      "পরীক্ষার পদ্ধতি: পর্যবেক্ষণ করা নিরাপদ আচরণ লিপিবদ্ধ করুন এবং মন্তব্য করুন।\nগ্রহণযোগ্য মান: নিরাপদ আচরণের মন্তব্য লিপিবদ্ধ করা হয়েছে।",
    question2Placeholder: "নিরাপদ আচরণ সম্পর্কে মন্তব্য / Comment...",
    question2Required: "অনুগ্রহ করে নিরাপদ আচরণ সম্পর্কে মন্তব্য লিখুন",

    question3Title:
      "3. অনিরাপদ অবস্থা সম্পর্কে মন্তব্য / Comment on unsafe condition",
    question3Subtitle:
      "পরীক্ষার পদ্ধতি: অনিরাপদ অবস্থা চিহ্নিত করুন এবং লিপিবদ্ধ করুন।\nগ্রহণযোগ্য মান: অনিরাপদ অবস্থার মন্তব্য লিপিবদ্ধ করা হয়েছে।",
    question3Placeholder: "অনিরাপদ অবস্থা সম্পর্কে মন্তব্য /",
    question3Required: "অনুগ্রহ করে অনিরাপদ অবস্থা সম্পর্কে মন্তব্য লিখুন",

    question4Title: "4. অন্যান্য বিষয় আলোচনা করুন / Discuss other issues",
    question4Subtitle:
      "পরীক্ষার পদ্ধতি: আলোচিত অন্যান্য বিষয় লিপিবদ্ধ করুন।\nগ্রহণযোগ্য মান: অন্যান্য বিষয় লিপিবদ্ধ করা হয়েছে।",
    question4Placeholder: "অন্যান্য বিষয় আলোচনা করুন / Discuss",
    question4Required: "অনুগ্রহ করে আলোচিত অন্যান্য বিষয় লিখুন",

    question5Title:
      "5. নিরাপদে কাজ করার সম্মতি পান / Get agreement to work safely",
    question5Subtitle:
      "পরীক্ষার পদ্ধতি: সকল পক্ষের থেকে নিরাপদে কাজ করার সম্মতি নিশ্চিত করুন।\nগ্রহণযোগ্য মান: নিরাপদে কাজ করার সম্মতি নিশ্চিত করা হয়েছে।",
    question5Placeholder: "নিরাপদে কাজ করার সম্মতি",
    question5Required: "অনুগ্রহ করে নিরাপদে কাজ করার সম্মতি লিখুন",

    attachImage: "ছবি সংযুক্ত করুন (Attach Image) (ঐচ্ছিক)",
    remark: "মন্তব্য (Remark) (ঐচ্ছিক)",
    remarkPlaceholder: "মন্তব্য লিখুন...",
    submit: "জমা দিন / Submit",
    submitting: "জমা দেওয়া হচ্ছে...",
    success: "ফর্ম সফলভাবে জমা হয়েছে!",
    error: "একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন",
  },
  kh: {
    title: "លេខសម្គាល់បុគ្គលិក Staff ID ?",
    titleQuestion: "លេខសម្គាល់បុគ្គលិក Staff ID ?",
    staffIdPlaceholder: "លេខសម្គាល់បុគ្គលិក Staff ID ?",
    staffIdRequired: "សូមបញ្ចូលលេខសម្គាល់បុគ្គលិក",

    question1Title:
      "1. ឈ្មោះអ្នកទំនាក់ទំនងដែលអ្នកបានពិភាក្សាជាមួយ / Name of contact person you have discussed with",
    question1Subtitle:
      "វិធីពិនិត្យ: កត់ត្រាឈ្មោះអ្នកដែលអ្នកបានពិភាក្សាអំពីសុវត្ថិភាព។\nស្តង់ដារទទួលយក: ឈ្មោះអ្នកទំនាក់ទំនងត្រូវបានកត់ត្រា។",
    question1Placeholder: "ឈ្មោះអ្នកទំនាក់ទំនង / Name",
    question1Required: "សូមបញ្ចូលឈ្មោះអ្នកដែលបានពិភាក្សា",

    question2Title:
      "2. យោបល់អំពីអាកប្បកិរិយាសុវត្ថិភាព / Comment on safe behavior",
    question2Subtitle:
      "វិធីពិនិត្យ: កត់ត្រានិងផ្តល់យោបល់អំពីអាកប្បកិរិយាសុវត្ថិភាពដែលបានសង្កេត។\nស្តង់ដារទទួលយក: យោបល់អំពីអាកប្បកិរិយាសុវត្ថិភាពត្រូវបានកត់ត្រា។",
    question2Placeholder: "យោបល់អំពីអាកប្បកិរិយាសុវត្ថិភាព / Comment...",
    question2Required: "សូមបញ្ចូលយោបល់អំពីអាកប្បកិរិយាសុវត្ថិភាព",

    question3Title:
      "3. យោបល់អំពីស្ថានភាពមិនសុវត្ថិភាព / Comment on unsafe condition",
    question3Subtitle:
      "វិធីពិនិត្យ: កំណត់និងកត់ត្រាស្ថានភាពមិនសុវត្ថិភាព។\nស្តង់ដារទទួលយក: យោបល់អំពីស្ថានភាពមិនសុវត្ថិភាពត្រូវបានកត់ត្រា។",
    question3Placeholder: "យោបល់អំពីស្ថានភាពមិនសុវត្ថិភាព /",
    question3Required: "សូមបញ្ចូលយោបល់អំពីស្ថានភាពមិនសុវត្ថិភាព",

    question4Title: "4. ពិភាក្សាបញ្ហាផ្សេងទៀត / Discuss other issues",
    question4Subtitle:
      "វិធីពិនិត្យ: កត់ត្រាបញ្ហាផ្សេងទៀតដែលបានពិភាក្សា។\nស្តង់ដារទទួលយក: បញ្ហាផ្សេងទៀតត្រូវបានកត់ត្រា។",
    question4Placeholder: "ពិភាក្សាបញ្ហាផ្សេងទៀត / Discuss",
    question4Required: "សូមបញ្ចូលបញ្ហាផ្សេងទៀតដែលបានពិភាក្សា",

    question5Title:
      "5. ទទួលបានការយល់ព្រមធ្វើការប្រកបដោយសុវត្ថិភាព / Get agreement to work safely",
    question5Subtitle:
      "វិធីពិនិត្យ: បញ្ជាក់ការយល់ព្រមធ្វើការប្រកបដោយសុវត្ថិភាពពីគ្រប់ភាគីពាក់ព័ន្ធ។\nស្តង់ដារទទួលយក: ការយល់ព្រមធ្វើការប្រកបដោយសុវត្ថិភាពត្រូវបានបញ្ជាក់។",
    question5Placeholder: "ទទួលបានការយល់ព្រមធ្វើការប្រកបដោយសុវត្ថិភាព",
    question5Required: "សូមបញ្ចូលការយល់ព្រមធ្វើការប្រកបដោយសុវត្ថិភាព",

    attachImage: "ភ្ជាប់រូបភាព (Attach Image) (ជម្រើស)",
    remark: "សម្គាល់ (Remark) (ជម្រើស)",
    remarkPlaceholder: "បញ្ចូលសម្គាល់...",
    submit: "ដាក់ស្នើ / Submit",
    submitting: "កំពុងដាក់ស្នើ...",
    success: "ដាក់ស្នើទម្រង់បានជោគជ័យ!",
    error: "មានកំហុសកើតឡើង។ សូមព្យាយាមម្តងទៀត",
  },
};

interface BootFormData extends FieldValues {
  id: string;
  area: string;
  observeContact: string;
  commentSafeBehavior: string;
  discussUnsafeBehavior: string;
  otherSafetyIssues: string;
  agreementWorkSafely: string;
  remark?: string;
  [key: string]: any;
}

export default function ManFormBoot({
  bu,
  type,
  id,
  isInDialog = false,
}: ManFormBootProps) {
  const router = useRouter();

  // Determine language based on bu (business unit/country)
  const getLanguageFromBu = (bu: string): Language => {
    const buLower = bu.toLowerCase();
    if (buLower === "vn" || buLower === "vietnam") return "vn";
    if (buLower === "lk" || buLower === "srilanka") return "lk";
    if (buLower === "bd" || buLower === "bangladesh") return "bd";
    if (buLower === "cmic" || buLower === "cambodia" || buLower === "kh")
      return "kh";
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
  } = useForm<BootFormData>();

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
  const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
  const formattedType = capitalizedType.endsWith("Form") ? capitalizedType : `${capitalizedType}Form`;
  const qrUrl = `https://www.saf37y.com/ManForm/${bu}/${formattedType}/${id}`;

  const onSubmit: SubmitHandler<BootFormData> = async (formData) => {
    try {
      // Validate required fields
      if (!formData.id) {
        toast.error(t.staffIdRequired);
        return;
      }

      if (!formData.observeContact) {
        toast.error(t.question1Required);
        return;
      }

      if (!formData.commentSafeBehavior) {
        toast.error(t.question2Required);
        return;
      }

      if (!formData.discussUnsafeBehavior) {
        toast.error(t.question3Required);
        return;
      }

      if (!formData.otherSafetyIssues) {
        toast.error(t.question4Required);
        return;
      }

      if (!formData.agreementWorkSafely) {
        toast.error(t.question5Required);
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

      const bootData = {
        ...formData,
        area: id, // URL parameter as area
        bu,
        type: "bootform",
        site: employeeSite || undefined,
        images: imageUrls,
        timestamp: new Date().toISOString(),
      };

      // Save to Firestore using server action
      try {
        const result = await submitManForm(bootData);

        if (result.success) {
          toast.success(t.success);

          // Capture the ID before resetting the form
          const submittedId = formData.id;

          reset();
          setImages([]);

          // Navigate to the Man detail page
          router.push(`/Man/${bu}/Boot/${submittedId}`);
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
                Danh sách kiểm tra hạng mục An toàn / BOOT ON THE GROUND CHECK
                LIST
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
              <Label htmlFor="observeContact" className="text-lg font-semibold">
                {t.question1Title}
              </Label>
              <p className="text-xs text-gray-600 whitespace-pre-line">
                {t.question1Subtitle}
              </p>
              <Textarea
                {...register("observeContact", {
                  required: t.question1Required,
                })}
                placeholder={t.question1Placeholder}
                className="w-full min-h-[80px]"
              />
              {errors.observeContact && (
                <p className="text-red-500 text-sm">
                  {errors.observeContact?.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question 2: Safe Behavior */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label
                htmlFor="commentSafeBehavior"
                className="text-lg font-semibold"
              >
                {t.question2Title}
              </Label>
              <p className="text-xs text-gray-600 whitespace-pre-line">
                {t.question2Subtitle}
              </p>
              <Textarea
                {...register("commentSafeBehavior", {
                  required: t.question2Required,
                })}
                placeholder={t.question2Placeholder}
                className="w-full min-h-[80px]"
              />
              {errors.commentSafeBehavior && (
                <p className="text-red-500 text-sm">
                  {errors.commentSafeBehavior?.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question 3: Unsafe Condition */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label
                htmlFor="discussUnsafeBehavior"
                className="text-lg font-semibold"
              >
                {t.question3Title}
              </Label>
              <p className="text-xs text-gray-600 whitespace-pre-line">
                {t.question3Subtitle}
              </p>
              <Textarea
                {...register("discussUnsafeBehavior", {
                  required: t.question3Required,
                })}
                placeholder={t.question3Placeholder}
                className="w-full min-h-[80px]"
              />
              {errors.discussUnsafeBehavior && (
                <p className="text-red-500 text-sm">
                  {errors.discussUnsafeBehavior?.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question 4: Other Issues */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label
                htmlFor="otherSafetyIssues"
                className="text-lg font-semibold"
              >
                {t.question4Title}
              </Label>
              <p className="text-xs text-gray-600 whitespace-pre-line">
                {t.question4Subtitle}
              </p>
              <Textarea
                {...register("otherSafetyIssues", {
                  required: t.question4Required,
                })}
                placeholder={t.question4Placeholder}
                className="w-full min-h-[80px]"
              />
              {errors.otherSafetyIssues && (
                <p className="text-red-500 text-sm">
                  {errors.otherSafetyIssues?.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question 5: Agreement */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label
                htmlFor="agreementWorkSafely"
                className="text-lg font-semibold"
              >
                {t.question5Title}
              </Label>
              <p className="text-xs text-gray-600 whitespace-pre-line">
                {t.question5Subtitle}
              </p>
              <Textarea
                {...register("agreementWorkSafely", {
                  required: t.question5Required,
                })}
                placeholder={t.question5Placeholder}
                className="w-full min-h-[80px]"
              />
              {errors.agreementWorkSafely && (
                <p className="text-red-500 text-sm">
                  {errors.agreementWorkSafely?.message}
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
