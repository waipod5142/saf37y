export type MachineItem = {
  name: string;
  question: string;
  howto: string;
  accept?: string;
};

export interface FilteredMachineItem {
  _id: string;
  id: string;
  date: string;
  inspector: string;
  responder?: string;
  remark: string;
  lat: number;
  lng: number;
  url?: string;
  horn?: string;
  lights?: string;
  isolator?: string;
  limitSwitch?: string;
  loadLimit?: string;
  safetyLatch?: string;
  loadChart?: string;
  email?: string;
}

export type DetailTypes =
  | "lifting"
  | "extinguisher"
  | "hydrant"
  | "foam"
  | "pump"
  | "valve"
  | "forklift"
  | "mobile"
  | "vehicle"
  | "harness"
  | "portable"
  | "lifeline"
  | "lifering"
  | "lifevest"
  | "welding"
  | "cable"
  | "fan"
  | "light"
  | "cctv"
  | "equipment"
  | "rescue"
  | "truck"
  | "mixer"
  | "car"
  | "motorbike"
  | "bulk"
  | "bag"
  | "plant"
  | "aed"
  | "emergency"
  | "fireexit"
  | "waste"
  | "crane"
  | "shower"
  | "waterjet"
  | "compressor"
  | "fallarrest"
  | "firealarm"
  | "firepump"
  | "fullbodyharness"
  | "hoist"
  | "overheadcrane";

export const isValidDetailType = (id: string): id is DetailTypes => {
  return [
    "lifting",
    "extinguisher",
    "hydrant",
    "foam",
    "pump",
    "valve",
    "forklift",
    "mobile",
    "vehicle",
    "harness",
    "portable",
    "lifeline",
    "lifering",
    "lifevest",
    "welding",
    "cable",
    "fan",
    "light",
    "cctv",
    "equipment",
    "rescue",
    "truck",
    "mixer",
    "car",
    "motorbike",
    "bulk",
    "bag",
    "plant",
    "aed",
    "emergency",
    "fireexit",
    "waste",
    "crane",
    "shower",
    "waterjet",
    "compressor",
    "fallarrest",
    "firealarm",
    "firepump",
    "fullbodyharness",
    "hoist",
    "overheadcrane",
  ].includes(id);
};

export const machineTitles: { [key: string]: string } = {
  jkcementforklift: "Forklift Inspection",
  vnlifting: "Kiểm định thiết bị nâng / Lifting Equipment",
  vnliftinggear: "Kiểm định dụng cụ nâng hạ / Lifting Gear",
  vnforklift: "Kiểm định thiết bị nâng / Forklift",
  vnmobile: "Kiểm tra thiết bị di động / Mobile Equipment",
  vnvehicle: "Kiểm tra xe cơ giới / Vehicle",
  vnextinguisher: "Kiểm tra bình chữa cháy / Fire Extinguisher",
  vnhydrant: "Kiểm tra trụ nước cứu hỏa / Fire Hydrant",
  vnfoam: "Kiểm tra Foam chữa cháy / Foam Tank",
  vnpump: "HƯỚNG DẪN KIỂM TRA BƠM NƯỚC CHỮA CHÁY / Water Pump",
  vnvalve: "HƯỚNG DẪN KIỂM TRA VAN NGUỒN NƯỚC / Water Valve",
  vnharness: "HƯỚNG DẪN KIỂM TRA DÂY AN TOÀN / Safety Harness",
  vnportable: "HƯỚNG DẪN KIỂM TRA SÀN DI ĐỘNG / Portable Platform",
  vnlifeline: "HƯỚNG DẪN KIỂM TRA DÂY AN TOÀN / Safety Lifeline",
  vnlifering: "Hướng dẫn kiểm tra phao cứu sinh / Safety Life Ring",
  vnlifevest: "Hướng dẫn kiểm tra áo phao cứu sinh / Safety Life Vest",
  vnwelding: "Hướng dẫn kiểm tra máy hàn / Welding Machine",
  vncable: "Hướng dẫn kiểm tra dây nguồn / Power Cable",
  vnfan: "Hướng dẫn kiểm tra quạt thông gió / Ventilation Fan",
  vnlight: "Hướng dẫn kiểm tra đèn chiếu sáng di động / Mobile Light",
  vncctv: "Hướng dẫn kiểm tra hệ thống camera giám sát / Plant CCTV",
  vnequipment: "Hướng dẫn kiểm tra thiết bị di động / Portable Equipment",
  vnrescue: "Gangway, Rescue Boat",

  // CMIC
  cmicbulk: "ការត្រួតពិនិត្យរថយន្តមុនពេលប្រើប្រាស់ប្រចាំថ្ងៃ",
  cmicloader: "ការត្រួតពិនិត្យរថយន្តមុនពេលប្រើប្រាស់ប្រចាំថ្ងៃ",
  cmicforklift: "ការត្រួតពិនិត្យរថយន្តមុនពេលប្រើប្រាស់ប្រចាំថ្ងៃ",
  cmicdump: "ការត្រួតពិនិត្យរថយន្តមុនពេលប្រើប្រាស់ប្រចាំថ្ងៃ",
  cmicexcavator: "ការត្រួតពិនិត្យរថយន្តមុនពេលប្រើប្រាស់ប្រចាំថ្ងៃ",
  cmiccrane: "ការត្រួតពិនិត្យឧបករណ៍ជើងយកឬក្រេនមុនពេលប្រើប្រាស់ប្រចាំថ្ងៃ",
  cmicextinguisher: "ការត្រួតពិនិត្យបំពង់ពន្លត់អគ្គីភ័យមុនពេលប្រើប្រាស់ប្រចាំថ្ងៃ",
  cmichydrant: "ការត្រួតពិនិត្យប្រព័ន្ធទឹកបាញ់អគ្គីភ័យមុនពេលប្រើប្រាស់ប្រចាំថ្ងៃ",
  cmicvehicle: "ការត្រួតពិនិត្យយានជំនិះស្រាលមុនពេលប្រើប្រាស់ប្រចាំថ្ងៃ",

  // BD
  bdbulk: "Bulk Truck inspection form",
  bdforklift: "Forklift inspection form",
  bdloader: "Loader inspection form",
  bdharness: "Safety Harness inspection form",
  bdladder: "Mobile Ladder inspection form",
  bdextinguisher: "Fire Extinguisher inspection form",

  // LK
  lkforklift: "Forklift Inspection Form",
  lkextinguisher: "Fire Extinguisher Inspection Form",
  lkcar: "Light Vehicle Inspection Form",

  // TH
  thtruck: "แบบฟอร์มตรวจรถบรรทุกประจำวัน ของฝ่ายเหมือง (เท่านั้น)",
  thtruckall: "แบบฟอร์ม F-TES-053 ตรวจสอบสภาพรถบรรทุกประจำวัน",
  thcrane: "แบบตรวจสภาพความพร้อมรอก/เครนก่อนการใช้งานประจำวัน",
  thequipment: "แบบตรวจสภาพความของเครืองมือ/อุปกรณ์ที่สามารถเคลื่อนย้ายได้",
  thcar: "แบบตรวจเช็ครถเล็กก่อนใช้งานประจำวัน",
  thmixer: "แบบตรวจเช็ครถโม่ก่อนใช้งานประจำวัน",
  thmixerweek: "แบบตรวจเช็ครถโม่ก่อนใช้งานประจำสัปดาห์",
  thmixertrainer: "แบบตรวจเช็ครถโม่สำหรับครูฝึกอบรม",
  thmixertsm: "แบบตรวจเช็ครถโม่สำหรับ TSM ของ ผจส",
  thmotorbike: "แบบตรวจเช็คมอเตอร์ไซด์ก่อนใช้งานประจำวัน",
  thbulk: "แบบตรวจเช็ครถซีเมนต์ผงก่อนใช้งานประจำวัน",
  thbag: "แบบตรวจเช็ครถซีเมนต์ถุงก่อนใช้งานประจำวัน",
  thplant: "Daily (FM-SCCO-PROD-003 Production)",
  thaed: "แบบตรวจเช็คเครื่อง AED ประจำเดือน",
  themergency: "แบบตรวจสอบป้ายทางหนีไฟ แผนผังเส้นทางหนีไฟ และจุดรวมพล",
  thextinguisher: "แบบตรวจเช็คถัง Fire Extinguisher ประจำเดือน",
  thhydrant: "แบบตรวจหัวฉีดน้ำดับเพลิง Fire Hydrant ประจำเดือน",
  thwaste: "แบบตรวจเช็ครถขนส่ง Waste ก่อนใช้งานประจำวัน",
  thharness: "แบบตรวจสายรัดตัวก่อนใช้งานประจำเดือน",
  thforklift: "Forklift",
  thfrontend: "Frontend Loader",
  thwelding: "แบบตรวจเช็ค Welding Machine",
  thshower: "แบบตรวจเช็คEmergency Shower and Eye Wash Station",
  thwaterjet: "แบบตรวจเช็ค High Pressure Water Jet",
  thcompressor: "แบบตรวจเช็ค Air Compressor",
  thfallarrest: "แบบตรวจสายดึงตัวก่อนใช้งานประจำเดือน",
  thfirealarm: "แบบตรวจเช็ค Fire Alarm",
  thfirepump: "แบบตรวจเช็ค Fire Pump",
  thfullbodyharness: "แบบตรวจเช็ค Full Body Harness",
  thhoist: "แบบตรวจเช็ค Hoist",
  thoverheadcrane: "แบบตรวจเช็ค Overhead Crane",
};

export const quarterlyEquipment = [
  { id: "harness" },
  { id: "portable" },
  { id: "lifeline" },
  { id: "lifering" },
  { id: "lifevest" },
  { id: "welding" },
  { id: "cable" },
  { id: "fan" },
  { id: "light" },
  { id: "cctv" },
  { id: "equipment" },
  { id: "rescue" },
  { id: "socket" },
  { id: "electric" },
];