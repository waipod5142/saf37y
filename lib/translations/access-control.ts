// Language translations for Plant Access Control system
// Supports: Thailand (th), Vietnam (vn), Cambodia (kh), Sri Lanka (lk), Bangladesh (bd)

export type LanguageCode = "en" | "th" | "vn" | "kh" | "si" | "bn";

export interface AccessControlTranslations {
  // Header
  pageTitle: string;
  telephoneLabel: string;
  loadSavedButton: string;
  submitButton: string;
  checkInButton: string;
  checkOutButton: string;

  // Visitor info
  nameLabel: string;
  companyLabel: string;

  // Status messages
  welcomeBack: string;
  currentVisit: string;
  lastVisit: string;
  checkInLabel: string;
  checkOutLabel: string;
  durationLabel: string;
  timeInPlantLabel: string;
  submitAgainToCheckout: string;

  // Registration dialog
  registrationTitle: string;
  registrationDescription: string;
  registerButton: string;
  registering: string;
  cancelButton: string;

  // Safety Rules dialog
  safetyTitle: string;
  safetyDescription: string;
  safetyRulesHeader: string;
  safetyRule1: string;
  safetyRule2: string;
  safetyRule3: string;
  safetyRule4: string;
  safetyRule5: string;
  safetyRule6: string;
  safetyRule7: string;
  safetyConfirmHeader: string;
  safetyConfirm1: string;
  safetyConfirm2: string;
  safetyConfirm3: string;
  acceptButton: string;

  // Visitor Pass/QR Code dialog
  visitorPassTitle: string;
  visitorPassDescription: string;
  visitorPassNote: string;
  closeButton: string;

  // Goodbye dialog
  goodbyeTitle: string;
  goodbyeDescription: string;
  goodbyeMessage: string;

  // Placeholders and validation
  telephonePlaceholder: string;
  namePlaceholder: string;
  companyPlaceholder: string;
}

export const translations: Record<LanguageCode, AccessControlTranslations> = {
  en: {
    pageTitle: "Visitor Plant Access Control",
    telephoneLabel: "Telephone Number",
    loadSavedButton: "Load Saved",
    submitButton: "Submit",
    checkInButton: "Click to Check-In",
    checkOutButton: "Click to Check-Out",

    nameLabel: "Name",
    companyLabel: "Company",

    welcomeBack: "Welcome back",
    currentVisit: "🔵 Current Visit (Not Checked Out)",
    lastVisit: "📋 Last Visit",
    checkInLabel: "Check-in",
    checkOutLabel: "Check-out",
    durationLabel: "Duration",
    timeInPlantLabel: "Time in plant",
    submitAgainToCheckout: "ℹ️ Submit again to check out",

    registrationTitle: "Visitor Registration",
    registrationDescription:
      "We don't have your information on record. Please register to continue.",
    registerButton: "Register",
    registering: "Registering...",
    cancelButton: "Cancel",

    safetyTitle: "Safety Rules & Regulations",
    safetyDescription:
      "Please read and accept the safety rules before entering the plant.",
    safetyRulesHeader: "Plant Safety Rules:",
    safetyRule1:
      "All visitors must wear appropriate PPE (Personal Protective Equipment)",
    safetyRule2: "Follow all safety signage and instructions",
    safetyRule3: "Stay within designated visitor areas",
    safetyRule4: "No unauthorized photography or video recording",
    safetyRule5: "Report any safety hazards immediately to plant personnel",
    safetyRule6: "Follow emergency evacuation procedures if alarms sound",
    safetyRule7: "Do not operate any machinery without authorization",
    safetyConfirmHeader: 'By clicking "I Accept", you confirm that you:',
    safetyConfirm1: "Have read and understood the safety rules",
    safetyConfirm2: "Will comply with all safety regulations",
    safetyConfirm3: "Accept responsibility for following safety procedures",
    acceptButton: "I Accept",

    visitorPassTitle: "Your Visitor Pass",
    visitorPassDescription: "Your check-in is complete",
    visitorPassNote:
      "This QR code contains your visit transaction data. To check out, simply scan the plant QR code again with your phone number.",
    closeButton: "Close",

    goodbyeTitle: "Thank You for Visiting!",
    goodbyeDescription: "Have a safe trip back",
    goodbyeMessage:
      "Your check-out has been recorded successfully.\nWe hope to see you again soon!",

    telephonePlaceholder: "0814998528",
    namePlaceholder: "Name",
    companyPlaceholder: "Company name",
  },

  th: {
    pageTitle: "ระบบควบคุมการเข้าออกโรงงานสำหรับผู้เยี่ยมชม",
    telephoneLabel: "หมายเลขโทรศัพท์",
    loadSavedButton: "โหลดข้อมูลที่บันทึก",
    submitButton: "ยืนยัน",
    checkInButton: "คลิกเพื่อเช็คอิน",
    checkOutButton: "คลิกเพื่อเช็คเอาท์",

    nameLabel: "ชื่อ",
    companyLabel: "บริษัท",

    welcomeBack: "ยินดีต้อนรับกลับมา",
    currentVisit: "🔵 การเข้าชมปัจจุบัน (ยังไม่ได้เช็คเอาท์)",
    lastVisit: "📋 การเข้าชมล่าสุด",
    checkInLabel: "เช็คอิน",
    checkOutLabel: "เช็คเอาท์",
    durationLabel: "ระยะเวลา",
    timeInPlantLabel: "เวลาในโรงงาน",
    submitAgainToCheckout: "ℹ️ กดยืนยันอีกครั้งเพื่อเช็คเอาท์",

    registrationTitle: "ลงทะเบียนผู้เยี่ยมชม",
    registrationDescription:
      "เราไม่มีข้อมูลของคุณในระบบ กรุณาลงทะเบียนเพื่อดำเนินการต่อ",
    registerButton: "ลงทะเบียน",
    registering: "กำลังลงทะเบียน...",
    cancelButton: "ยกเลิก",

    safetyTitle: "กฎระเบียบด้านความปลอดภัย",
    safetyDescription: "กรุณาอ่านและยอมรับกฎความปลอดภัยก่อนเข้าโรงงาน",
    safetyRulesHeader: "กฎความปลอดภัยในโรงงาน:",
    safetyRule1:
      "ผู้เยี่ยมชมทุกคนต้องสวมอุปกรณ์ป้องกันส่วนบุคคล (PPE) ที่เหมาะสม",
    safetyRule2: "ปฏิบัติตามป้ายและคำแนะนำด้านความปลอดภัยทั้งหมด",
    safetyRule3: "อยู่ในพื้นที่ที่กำหนดสำหรับผู้เยี่ยมชมเท่านั้น",
    safetyRule4: "ห้ามถ่ายภาพหรือบันทึกวิดีโอโดยไม่ได้รับอนุญาต",
    safetyRule5: "แจ้งอันตรายด้านความปลอดภัยทันทีต่อเจ้าหน้าที่โรงงาน",
    safetyRule6: "ปฏิบัติตามขั้นตอนการอพยพฉุกเฉินเมื่อมีสัญญาณเตือน",
    safetyRule7: "ห้ามใช้งานเครื่องจักรใดๆ โดยไม่ได้รับอนุญาต",
    safetyConfirmHeader: 'เมื่อคลิก "ฉันยอมรับ" คุณยืนยันว่าคุณ:',
    safetyConfirm1: "ได้อ่านและเข้าใจกฎความปลอดภัย",
    safetyConfirm2: "จะปฏิบัติตามกฎระเบียบด้านความปลอดภัยทั้งหมด",
    safetyConfirm3: "ยอมรับความรับผิดชอบในการปฏิบัติตามขั้นตอนความปลอดภัย",
    acceptButton: "ฉันยอมรับ",

    visitorPassTitle: "บัตรผู้เยี่ยมชมของคุณ",
    visitorPassDescription: "การเช็คอินเสร็จสมบูรณ์",
    visitorPassNote:
      "QR Code นี้มีข้อมูลการเข้าชมของคุณ หากต้องการเช็คเอาท์ กรุณาสแกน QR Code ของโรงงานอีกครั้งพร้อมหมายเลขโทรศัพท์ของคุณ",
    closeButton: "ปิด",

    goodbyeTitle: "ขอบคุณที่มาเยี่ยมชม!",
    goodbyeDescription: "เดินทางกลับโดยปลอดภัย",
    goodbyeMessage:
      "การเช็คเอาท์ของคุณได้รับการบันทึกเรียบร้อยแล้ว\nหวังว่าจะได้พบคุณอีกเร็วๆ นี้!",

    telephonePlaceholder: "0814998528",
    namePlaceholder: "ชื่อ",
    companyPlaceholder: "ชื่อบริษัท",
  },

  vn: {
    pageTitle: "Hệ Thống Kiểm Soát Ra Vào Nhà Máy Cho Khách Thăm",
    telephoneLabel: "Số Điện Thoại",
    loadSavedButton: "Tải Dữ Liệu Đã Lưu",
    submitButton: "Xác Nhận",
    checkInButton: "Nhấp để Check-In",
    checkOutButton: "Nhấp để Check-Out",

    nameLabel: "Tên",
    companyLabel: "Công Ty",

    welcomeBack: "Chào mừng quay lại",
    currentVisit: "🔵 Lượt Thăm Hiện Tại (Chưa Check-out)",
    lastVisit: "📋 Lượt Thăm Gần Nhất",
    checkInLabel: "Check-in",
    checkOutLabel: "Check-out",
    durationLabel: "Thời Gian",
    timeInPlantLabel: "Thời gian trong nhà máy",
    submitAgainToCheckout: "ℹ️ Nhấn xác nhận lại để check-out",

    registrationTitle: "Đăng Ký Khách Thăm",
    registrationDescription:
      "Chúng tôi không có thông tin của bạn trong hệ thống. Vui lòng đăng ký để tiếp tục.",
    registerButton: "Đăng Ký",
    registering: "Đang đăng ký...",
    cancelButton: "Hủy",

    safetyTitle: "Quy Định An Toàn",
    safetyDescription:
      "Vui lòng đọc và chấp nhận các quy định an toàn trước khi vào nhà máy.",
    safetyRulesHeader: "Quy Định An Toàn Nhà Máy:",
    safetyRule1:
      "Tất cả khách thăm phải đeo đầy đủ thiết bị bảo hộ cá nhân (PPE)",
    safetyRule2: "Tuân thủ tất cả biển báo và hướng dẫn an toàn",
    safetyRule3: "Ở trong khu vực dành cho khách thăm",
    safetyRule4: "Không chụp ảnh hoặc quay video khi chưa được phép",
    safetyRule5:
      "Báo cáo ngay lập tức mọi nguy hiểm về an toàn cho nhân viên nhà máy",
    safetyRule6: "Tuân theo quy trình sơ tán khẩn cấp khi có chuông báo động",
    safetyRule7: "Không vận hành bất kỳ máy móc nào khi chưa được phép",
    safetyConfirmHeader:
      'Bằng cách nhấn "Tôi Chấp Nhận", bạn xác nhận rằng bạn:',
    safetyConfirm1: "Đã đọc và hiểu các quy định an toàn",
    safetyConfirm2: "Sẽ tuân thủ tất cả các quy định an toàn",
    safetyConfirm3: "Chấp nhận trách nhiệm tuân theo các quy trình an toàn",
    acceptButton: "Tôi Chấp Nhận",

    visitorPassTitle: "Thẻ Khách Thăm Của Bạn",
    visitorPassDescription: "Check-in hoàn tất",
    visitorPassNote:
      "Mã QR này chứa dữ liệu lượt thăm của bạn. Để check-out, chỉ cần quét mã QR nhà máy một lần nữa với số điện thoại của bạn.",
    closeButton: "Đóng",

    goodbyeTitle: "Cảm Ơn Bạn Đã Ghé Thăm!",
    goodbyeDescription: "Chúc bạn về an toàn",
    goodbyeMessage:
      "Check-out của bạn đã được ghi nhận thành công.\nHy vọng sớm gặp lại bạn!",

    telephonePlaceholder: "0814998528",
    namePlaceholder: "Tên",
    companyPlaceholder: "Tên công ty",
  },

  kh: {
    pageTitle: "ប្រព័ន្ធត្រួតពិនិត្យការចូលចេញរោងចក្រសម្រាប់អ្នកទស្សនា",
    telephoneLabel: "លេខទូរស័ព្ទ",
    loadSavedButton: "ផ្ទុកទិន្នន័យដែលបានរក្សាទុក",
    submitButton: "យល់ព្រម",
    checkInButton: "ចុចដើម្បី Check-In",
    checkOutButton: "ចុចដើម្បី Check-Out",

    nameLabel: "ឈ្មោះ",
    companyLabel: "ក្រុមហ៊ុន",

    welcomeBack: "សូមស្វាគមន៍ការត្រឡប់មកវិញ",
    currentVisit: "🔵 ការទស្សនាបច្ចុប្បន្ន (មិនទាន់ Check-out)",
    lastVisit: "📋 ការទស្សនាចុងក្រោយ",
    checkInLabel: "Check-in",
    checkOutLabel: "Check-out",
    durationLabel: "រយៈពេល",
    timeInPlantLabel: "ពេលវេលានៅក្នុងរោងចក្រ",
    submitAgainToCheckout: "ℹ️ ចុចយល់ព្រមម្តងទៀតដើម្បី check-out",

    registrationTitle: "ការចុះឈ្មោះអ្នកទស្សនា",
    registrationDescription:
      "យើងមិនមានព័ត៌មានរបស់អ្នកនៅក្នុងប្រព័ន្ធទេ។ សូមចុះឈ្មោះដើម្បីបន្ត។",
    registerButton: "ចុះឈ្មោះ",
    registering: "កំពុងចុះឈ្មោះ...",
    cancelButton: "បោះបង់",

    safetyTitle: "បទប្បញ្ញត្តិសុវត្ថិភាព",
    safetyDescription:
      "សូមអាន និងទទួលយកបទប្បញ្ញត្តិសុវត្ថិភាពមុនពេលចូលរោងចក្រ។",
    safetyRulesHeader: "បទប្បញ្ញត្តិសុវត្ថិភាពរោងចក្រ:",
    safetyRule1:
      "អ្នកទស្សនាទាំងអស់ត្រូវពាក់ឧបករណ៍ការពារផ្ទាល់ខ្លួន (PPE) ឱ្យបានត្រឹមត្រូវ",
    safetyRule2: "អនុវត្តតាមសញ្ញា និងការណែនាំសុវត្ថិភាពទាំងអស់",
    safetyRule3: "នៅក្នុងតំបន់កំណត់សម្រាប់អ្នកទស្សនាប៉ុណ្ណោះ",
    safetyRule4: "កុំថតរូប ឬថតវីដេអូដោយគ្មានការអនុញ្ញាត",
    safetyRule5:
      "រាយការណ៍ភ្លាមៗអំពីគ្រោះថ្នាក់សុវត្ថិភាពណាមួយទៅកាន់បុគ្គលិករោងចក្រ",
    safetyRule6: "អនុវត្តតាមនីតិវិធីជម្លៀសគ្រាអាសន្ន នៅពេលសំឡេងសម្រែក",
    safetyRule7: "កុំប្រតិបត្តិម៉ាស៊ីនណាមួយដោយគ្មានការអនុញ្ញាត",
    safetyConfirmHeader: 'តាមរយៈការចុច "ខ្ញុំទទួលយក" អ្នកបញ្ជាក់ថាអ្នក:',
    safetyConfirm1: "បានអាន និងយល់អំពីបទប្បញ្ញត្តិសុវត្ថិភាព",
    safetyConfirm2: "នឹងអនុវត្តតាមបទប្បញ្ញត្តិសុវត្ថិភាពទាំងអស់",
    safetyConfirm3: "ទទួលយកការទទួលខុសត្រូវក្នុងការអនុវត្តតាមនីតិវិធីសុវត្ថិភាព",
    acceptButton: "ខ្ញុំទទួលយក",

    visitorPassTitle: "កាតអ្នកទស្សនារបស់អ្នក",
    visitorPassDescription: "ការ Check-in បានបញ្ចប់",
    visitorPassNote:
      "លេខកូដ QR នេះមានទិន្នន័យការទស្សនារបស់អ្នក។ ដើម្បី check-out គ្រាន់តែស្កេនលេខកូដ QR របស់រោងចក្រម្តងទៀតជាមួយលេខទូរស័ព្ទរបស់អ្នក។",
    closeButton: "បិទ",

    goodbyeTitle: "សូមអរគុណសម្រាប់ការមកទស្សនា!",
    goodbyeDescription: "សូមធ្វើដំណើរត្រឡប់ដោយសុវត្ថិភាព",
    goodbyeMessage:
      "ការ Check-out របស់អ្នកត្រូវបានកត់ត្រាដោយជោគជ័យ។\nយើងសង្ឃឹមថានឹងជួបអ្នកម្តងទៀតឆាប់ៗនេះ!",

    telephonePlaceholder: "0814998528",
    namePlaceholder: "ឈ្មោះ",
    companyPlaceholder: "ឈ្មោះក្រុមហ៊ុន",
  },

  si: {
    pageTitle: "අමුත්තන් සඳහා කම්හල් ප්‍රවේශ පාලන පද්ධතිය",
    telephoneLabel: "දුරකථන අංකය",
    loadSavedButton: "සුරකින ලද දත්ත පූරණය කරන්න",
    submitButton: "ඉදිරිපත් කරන්න",
    checkInButton: "Check-In කිරීමට ක්ලික් කරන්න",
    checkOutButton: "Check-Out කිරීමට ක්ලික් කරන්න",

    nameLabel: "නම",
    companyLabel: "සමාගම",

    welcomeBack: "ආයුබෝවන්",
    currentVisit: "🔵 වත්මන් සංචාරය (පිටව යාම් නොමැත)",
    lastVisit: "📋 අවසාන සංචාරය",
    checkInLabel: "පැමිණීම",
    checkOutLabel: "පිටවීම",
    durationLabel: "කාලසීමාව",
    timeInPlantLabel: "කම්හලේ කාලය",
    submitAgainToCheckout: "ℹ️ පිටව යාමට නැවත ඉදිරිපත් කරන්න",

    registrationTitle: "අමුත්තන් ලියාපදිංචිය",
    registrationDescription:
      "අපට ඔබේ තොරතුරු පද්ධතියේ නැත. ඉදිරියට යාමට කරුණාකර ලියාපදිංචි වන්න.",
    registerButton: "ලියාපදිංචි වන්න",
    registering: "ලියාපදිංචි වෙමින්...",
    cancelButton: "අවලංගු කරන්න",

    safetyTitle: "ආරක්ෂක රීති සහ රෙගුලාසි",
    safetyDescription:
      "කරුණාකර කම්හලට ඇතුළු වීමට පෙර ආරක්ෂක නීති කියවා පිළිගන්න.",
    safetyRulesHeader: "කම්හල් ආරක්ෂක නීති:",
    safetyRule1:
      "සියලුම අමුත්තන් සුදුසු පුද්ගලික ආරක්ෂක උපකරණ (PPE) පැළඳිය යුතුය",
    safetyRule2: "සියලුම ආරක්ෂක සං‍ඥා සහ උපදෙස් අනුගමනය කරන්න",
    safetyRule3: "අමුත්තන් සඳහා නියම කළ ප්‍රදේශවල පමණක් සිටින්න",
    safetyRule4: "අවසර නොමැතිව ඡායාරූප හෝ වීඩියෝ පටිගත කිරීම තහනම්",
    safetyRule5: "ඕනෑම ආරක්ෂක අනතුරක් කම්හල් කාර්ය මණ්ඩලයට වහාම වාර්තා කරන්න",
    safetyRule6:
      "අනතුරු ඇඟවීම් නාද වන විට හදිසි ඉවත් කිරීමේ ක්‍රියා පටිපාටිය අනුගමනය කරන්න",
    safetyRule7: "අවසර නොමැතිව යන්ත්‍ර ක්‍රියාත්මක නොකරන්න",
    safetyConfirmHeader: '"මම පිළිගන්නවා" මත ක්ලික් කිරීමෙන් ඔබ තහවුරු කරන්නේ:',
    safetyConfirm1: "ආරක්ෂක නීති කියවා තේරුම් ගත්තා",
    safetyConfirm2: "සියලුම ආරක්ෂක රෙගුලාසි වලට අනුකූල වන්නෙමි",
    safetyConfirm3: "ආරක්ෂක ක්‍රියා පටිපාටිය අනුගමනය කිරීමේ වගකීම පිළිගන්නවා",
    acceptButton: "මම පිළිගන්නවා",

    visitorPassTitle: "ඔබේ අමුත්තන් පාස්",
    visitorPassDescription: "ඔබේ පැමිණීම සම්පූර්ණයි",
    visitorPassNote:
      "මෙම QR කේතයේ ඔබේ සංචාර දත්ත අඩංගුය. පිටව යාමට, ඔබේ දුරකථන අංකය සමඟ කම්හල් QR කේතය නැවත ස්කෑන් කරන්න.",
    closeButton: "වසන්න",

    goodbyeTitle: "සංචාරයට ස්තූතියි!",
    goodbyeDescription: "ආරක්ෂිතව ආපසු යන්න",
    goodbyeMessage:
      "ඔබේ පිටවීම සාර්ථකව වාර්තා වී ඇත.\nඉක්මනින් ඔබව නැවත හමුවීමට බලාපොරොත්තු වෙමු!",

    telephonePlaceholder: "0814998528",
    namePlaceholder: "නම",
    companyPlaceholder: "සමාගම් නාමය",
  },

  bn: {
    pageTitle: "দর্শনার্থীদের জন্য প্ল্যান্ট প্রবেশ নিয়ন্ত্রণ ব্যবস্থা",
    telephoneLabel: "টেলিফোন নম্বর",
    loadSavedButton: "সংরক্ষিত ডেটা লোড করুন",
    submitButton: "জমা দিন",
    checkInButton: "চেক-ইন করতে ক্লিক করুন",
    checkOutButton: "চেক-আউট করতে ক্লিক করুন",

    nameLabel: "নাম",
    companyLabel: "কোম্পানি",

    welcomeBack: "ফিরে আসার জন্য স্বাগতম",
    currentVisit: "🔵 বর্তমান সফর (চেক-আউট করা হয়নি)",
    lastVisit: "📋 শেষ সফর",
    checkInLabel: "চেক-ইন",
    checkOutLabel: "চেক-আউট",
    durationLabel: "সময়কাল",
    timeInPlantLabel: "প্ল্যান্টে সময়",
    submitAgainToCheckout: "ℹ️ চেক-আউট করতে আবার জমা দিন",

    registrationTitle: "দর্শনার্থী নিবন্ধন",
    registrationDescription:
      "আমাদের সিস্টেমে আপনার তথ্য নেই। অনুগ্রহ করে চালিয়ে যেতে নিবন্ধন করুন।",
    registerButton: "নিবন্ধন করুন",
    registering: "নিবন্ধন করা হচ্ছে...",
    cancelButton: "বাতিল করুন",

    safetyTitle: "নিরাপত্তা বিধি ও প্রবিধান",
    safetyDescription:
      "প্ল্যান্টে প্রবেশের আগে অনুগ্রহ করে নিরাপত্তা বিধি পড়ুন এবং গ্রহণ করুন।",
    safetyRulesHeader: "প্ল্যান্ট নিরাপত্তা বিধি:",
    safetyRule1:
      "সকল দর্শনার্থীকে উপযুক্ত ব্যক্তিগত সুরক্ষা সরঞ্জাম (PPE) পরতে হবে",
    safetyRule2: "সমস্ত নিরাপত্তা চিহ্ন এবং নির্দেশাবলী অনুসরণ করুন",
    safetyRule3: "নির্ধারিত দর্শনার্থী এলাকার মধ্যে থাকুন",
    safetyRule4: "অনুমতি ছাড়া ছবি তোলা বা ভিডিও রেকর্ডিং নিষিদ্ধ",
    safetyRule5:
      "যেকোনো নিরাপত্তা ঝুঁকি অবিলম্বে প্ল্যান্ট কর্মীদের কাছে রিপোর্ট করুন",
    safetyRule6: "অ্যালার্ম বাজলে জরুরি সরিয়ে নেওয়ার পদ্ধতি অনুসরণ করুন",
    safetyRule7: "অনুমতি ছাড়া কোনো যন্ত্রপাতি পরিচালনা করবেন না",
    safetyConfirmHeader:
      '"আমি গ্রহণ করি" ক্লিক করে, আপনি নিশ্চিত করছেন যে আপনি:',
    safetyConfirm1: "নিরাপত্তা বিধি পড়েছেন এবং বুঝেছেন",
    safetyConfirm2: "সমস্ত নিরাপত্তা বিধি মেনে চলবেন",
    safetyConfirm3: "নিরাপত্তা পদ্ধতি অনুসরণের দায়িত্ব গ্রহণ করছেন",
    acceptButton: "আমি গ্রহণ করি",

    visitorPassTitle: "আপনার দর্শনার্থী পাস",
    visitorPassDescription: "আপনার চেক-ইন সম্পূর্ণ",
    visitorPassNote:
      "এই QR কোডে আপনার সফরের তথ্য রয়েছে। চেক-আউট করতে, আপনার ফোন নম্বর সহ প্ল্যান্ট QR কোড আবার স্ক্যান করুন।",
    closeButton: "বন্ধ করুন",

    goodbyeTitle: "সফরের জন্য আপনাকে ধন্যবাদ!",
    goodbyeDescription: "নিরাপদে ফিরে যান",
    goodbyeMessage:
      "আপনার চেক-আউট সফলভাবে রেকর্ড করা হয়েছে।\nআশা করি শীঘ্রই আপনার সাথে আবার দেখা হবে!",

    telephonePlaceholder: "০৮১৪৯৯৮৫২৮",
    namePlaceholder: "নাম",
    companyPlaceholder: "কোম্পানির নাম",
  },
};

// Helper function to get translations for a business unit
export function getTranslationsForBU(
  bu: string,
  lang: LanguageCode
): AccessControlTranslations {
  return translations[lang] || translations.en;
}

// Helper function to get available languages for a country
export function getAvailableLanguages(
  bu: string
): { code: LanguageCode; name: string; nativeName: string }[] {
  const languageMap: Record<
    string,
    { code: LanguageCode; name: string; nativeName: string }[]
  > = {
    th: [
      { code: "en", name: "English", nativeName: "English" },
      { code: "th", name: "Thai", nativeName: "ไทย" },
    ],
    vn: [
      { code: "en", name: "English", nativeName: "English" },
      { code: "vn", name: "Vietnamese", nativeName: "Tiếng Việt" },
    ],
    kh: [
      { code: "en", name: "English", nativeName: "English" },
      { code: "kh", name: "Khmer", nativeName: "ខ្មែរ" },
    ],
    lk: [
      { code: "en", name: "English", nativeName: "English" },
      { code: "si", name: "Sinhala", nativeName: "සිංහල" },
    ],
    bd: [
      { code: "en", name: "English", nativeName: "English" },
      { code: "bn", name: "Bengali", nativeName: "বাংলা" },
    ],
  };

  return (
    languageMap[bu] || [{ code: "en", name: "English", nativeName: "English" }]
  );
}
