export type MachineItem = {
  id: string;
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
  | "Lifting"
  | "Extinguisher"
  | "Hydrant"
  | "Foam"
  | "Pump"
  | "Valve"
  | "Forklift"
  | "Mobile"
  | "Vehicle"
  | "Harness"
  | "Portable"
  | "Lifeline"
  | "Lifering"
  | "Lifevest"
  | "Welding"
  | "Cable"
  | "Fan"
  | "Light"
  | "Cctv"
  | "Equipment"
  | "Rescue"
  | "Truck"
  | "Mixer"
  | "Car"
  | "Motorbike"
  | "Bulk"
  | "Bag"
  | "Plant"
  | "Aed"
  | "Emergency"
  | "Fireexit"
  | "Waste"
  | "Crane"
  | "Welding"
  | "Shower"
  | "Waterjet"
  | "Compressor"
  | "Fallarrest"
  | "Firealarm"
  | "Firepump"
  | "Fullbodyharness"
  | "Hoist"
  | "Overheadcrane";

export const isValidDetailType = (id: string): id is DetailTypes => {
  return [
    "Lifting",
    "Extinguisher",
    "Hydrant",
    "Foam",
    "Pump",
    "Valve",
    "Forklift",
    "Mobile",
    "Vehicle",
    "Harness",
    "Portable",
    "Lifeline",
    "Lifering",
    "Lifevest",
    "Welding",
    "Cable",
    "Fan",
    "Light",
    "Cctv",
    "Equipment",
    "Rescue",
    "Truck",
    "Mixer",
    "Car",
    "Motorbike",
    "Bulk",
    "Bag",
    "Plant",
    "Aed",
    "Emergency",
    "Fireexit",
    "Waste",
    "Crane",
    "Shower",
    "Waterjet",
    "Compressor",
    "Fallarrest",
    "Firealarm",
    "Firepump",
    "Fullbodyharness",
    "Hoist",
    "Overheadcrane",
  ].includes(id);
};

export const machineTitles: { [key: string]: string } = {
  jkcementForklift: "Forklift Inspection",
  vnLifting: "Kiểm định thiết bị nâng / Lifting Equipment",
  vnLiftinggear: "Kiểm định dụng cụ nâng hạ / Lifting Gear",
  vnForklift: "Kiểm định thiết bị nâng / Forklift",
  vnMobile: "Kiểm tra thiết bị di động / Mobile Equipment",
  vnVehicle: "Kiểm tra xe cơ giới / Vehicle",
  vnExtinguisher: "Kiểm tra bình chữa cháy / Fire Extinguisher",
  vnHydrant: "Kiểm tra trụ nước cứu hỏa / Fire Hydrant",
  vnFoam: "Kiểm tra Foam chữa cháy / Foam Tank",
  vnPump: "HƯỚNG DẪN KIỂM TRA BƠM NƯỚC CHỮA CHÁY / Water Pump",
  vnValve: "HƯỚNG DẪN KIỂM TRA VAN NGUỒN NƯỚC / Water Valve",
  vnHarness: "HƯỚNG DẪN KIỂM TRA DÂY AN TOÀN / Safety Harness",
  vnPortable: "HƯỚNG DẪN KIỂM TRA SÀN DI ĐỘNG / Portable Platform",
  vnLifeline: "HƯỚNG DẪN KIỂM TRA DÂY AN TOÀN / Safety Lifeline",
  vnLifering: "Hướng dẫn kiểm tra phao cứu sinh / Safety Life Ring",
  vnLifevest: "Hướng dẫn kiểm tra áo phao cứu sinh / Safety Life Vest",
  vnWelding: "Hướng dẫn kiểm tra máy hàn / Welding Machine",
  vnCable: "Hướng dẫn kiểm tra dây nguồn / Power Cable",
  vnFan: "Hướng dẫn kiểm tra quạt thông gió / Ventilation Fan",
  vnLight: "Hướng dẫn kiểm tra đèn chiếu sáng di động / Mobile Light",
  vnCctv: "Hướng dẫn kiểm tra hệ thống camera giám sát / Plant CCTV",
  vnEquipment: "Hướng dẫn kiểm tra thiết bị di động / Portable Equipment",
  vnRescue: "Gangway, Rescue Boat",

  // CMIC
  cmicBulk: "ការត្រួតពិនិត្យរថយន្តមុនពេលប្រើប្រាស់ប្រចាំថ្ងៃ",
  cmicLoader: "ការត្រួតពិនិត្យរថយន្តមុនពេលប្រើប្រាស់ប្រចាំថ្ងៃ",
  cmicForklift: "ការត្រួតពិនិត្យរថយន្តមុនពេលប្រើប្រាស់ប្រចាំថ្ងៃ",
  cmicDump: "ការត្រួតពិនិត្យរថយន្តមុនពេលប្រើប្រាស់ប្រចាំថ្ងៃ",
  cmicExcavator: "ការត្រួតពិនិត្យរថយន្តមុនពេលប្រើប្រាស់ប្រចាំថ្ងៃ",
  cmicCrane: "ការត្រួតពិនិត្យឧបករណ៍ជើងយកឬក្រេនមុនពេលប្រើប្រាស់ប្រចាំថ្ងៃ",
  cmicExtinguisher: "ការត្រួតពិនិត្យបំពង់ពន្លត់អគ្គីភ័យមុនពេលប្រើប្រាស់ប្រចាំថ្ងៃ",
  cmicHydrant: "ការត្រួតពិនិត្យប្រព័ន្ធទឹកបាញ់អគ្គីភ័យមុនពេលប្រើប្រាស់ប្រចាំថ្ងៃ",
  cmicVehicle: "ការត្រួតពិនិត្យយានជំនិះស្រាលមុនពេលប្រើប្រាស់ប្រចាំថ្ងៃ",

  // BD
  bdBulk: "Bulk Truck inspection form",
  bdForklift: "Forklift inspection form",
  bdLoader: "Loader inspection form",
  bdHarness: "Safety Harness inspection form",
  bdLadder: "Mobile Ladder inspection form",
  bdExtinguisher: "Fire Extinguisher inspection form",

  // LK
  lkForklift: "Forklift Inspection Form",
  lkExtinguisher: "Fire Extinguisher Inspection Form",
  lkCar: "Light Vehicle Inspection Form",

  // TH
  thTruck: "แบบฟอร์มตรวจรถบรรทุกประจำวัน ของฝ่ายเหมือง (เท่านั้น)",
  thTruckall: "แบบฟอร์ม F-TES-053 ตรวจสอบสภาพรถบรรทุกประจำวัน",
  thCrane: "แบบตรวจสภาพความพร้อมรอก/เครนก่อนการใช้งานประจำวัน",
  thEquipment: "แบบตรวจสภาพความของเครืองมือ/อุปกรณ์ที่สามารถเคลื่อนย้ายได้",
  thCar: "แบบตรวจเช็ครถเล็กก่อนใช้งานประจำวัน",
  thMixer: "แบบตรวจเช็ครถโม่ก่อนใช้งานประจำวัน",
  thMixerweek: "แบบตรวจเช็ครถโม่ก่อนใช้งานประจำสัปดาห์",
  thMixertrainer: "แบบตรวจเช็ครถโม่สำหรับครูฝึกอบรม",
  thMixertsm: "แบบตรวจเช็ครถโม่สำหรับ TSM ของ ผจส",
  thMotorbike: "แบบตรวจเช็คมอเตอร์ไซด์ก่อนใช้งานประจำวัน",
  thBulk: "แบบตรวจเช็ครถซีเมนต์ผงก่อนใช้งานประจำวัน",
  thBag: "แบบตรวจเช็ครถซีเมนต์ถุงก่อนใช้งานประจำวัน",
  thPlant: "Daily (FM-SCCO-PROD-003 Production)",
  thAed: "แบบตรวจเช็คเครื่อง AED ประจำเดือน",
  thEmergency: "แบบตรวจสอบป้ายทางหนีไฟ แผนผังเส้นทางหนีไฟ และจุดรวมพล",
  thExtinguisher: "แบบตรวจเช็คถัง Fire Extinguisher ประจำเดือน",
  thHydrant: "แบบตรวจหัวฉีดน้ำดับเพลิง Fire Hydrant ประจำเดือน",
  thWaste: "แบบตรวจเช็ครถขนส่ง Waste ก่อนใช้งานประจำวัน",
  thHarness: "แบบตรวจสายรัดตัวก่อนใช้งานประจำเดือน",
  thForklift: "Forklift",
  thFrontend: "Frontend Loader",
  thWelding: "แบบตรวจเช็ค Welding Machine",
  thShower: "แบบตรวจเช็คEmergency Shower and Eye Wash Station",
  thWaterjet: "แบบตรวจเช็ค High Pressure Water Jet",
  thCompressor: "แบบตรวจเช็ค Air Compressor",
  thFallarrest: "แบบตรวจสายดึงตัวก่อนใช้งานประจำเดือน",
  thFirealarm: "แบบตรวจเช็ค Fire Alarm",
  thFirepump: "แบบตรวจเช็ค Fire Pump",
  thFullbodyharness: "แบบตรวจเช็ค Full Body Harness",
  thHoist: "แบบตรวจเช็ค Hoist",
  thOverheadcrane: "แบบตรวจเช็ค Overhead Crane",
};

export const quarterlyEquipment = [
  { id: "Harness" },
  { id: "Portable" },
  { id: "Lifeline" },
  { id: "Lifering" },
  { id: "Lifevest" },
  { id: "Welding" },
  { id: "Cable" },
  { id: "Fan" },
  { id: "Light" },
  { id: "Cctv" },
  { id: "Equipment" },
  { id: "Rescue" },
  { id: "Socket" },
  { id: "Electric" },
];