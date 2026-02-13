// Asset tracking form questions and choices

export interface AssetQuestion {
  id: number;
  question: string;
  howto?: string;
  accept?: string;
}

export interface AssetChoice {
  value: string;
  text: string;
  colorClass: string;
}

// Question 1: Asset Status
export const statusQuestion: AssetQuestion = {
  id: 1,
  question: "สถานะทรัพย์สิน Asset Status",
  howto: "ตรวจสอบสภาพและสถานะปัจจุบันของทรัพย์สิน",
  accept: "ระบุสถานะที่ตรงกับสภาพจริงของทรัพย์สิน",
};

export const statusChoices: AssetChoice[] = [
  { value: "Exist-Active", text: "Exist-Active", colorClass: "bg-green-500" },
  { value: "Exist-Idle", text: "Exist-Idle", colorClass: "bg-lime-500" },
  {
    value: "Exist-Waiting Transfer",
    text: "Exist-Waiting Transfer",
    colorClass: "bg-yellow-500",
  },
  {
    value: "Exist-Breakdown",
    text: "Exist-Breakdown",
    colorClass: "bg-rose-500",
  },
  { value: "Not Exist", text: "Not Exist", colorClass: "bg-rose-500" },
  {
    value: "Exist-Cannot Find",
    text: "Exist-Cannot Find",
    colorClass: "bg-purple-500",
  },
  {
    value: "Exist-Transferred",
    text: "Exist-Transferred",
    colorClass: "bg-teal-500",
  },
];

// Question 2: Quantity Status
export const quantityQuestion: AssetQuestion = {
  id: 2,
  question: "จำนวนทรัพย์สิน Quantity",
  howto: "นับจำนวนทรัพย์สินที่พบ",
  accept: "ระบุจำนวนที่แน่นอน",
};

export const quantityChoices: AssetChoice[] = [
  { value: "none", text: "ไม่มี None", colorClass: "bg-green-500" },
  { value: "1", text: "1", colorClass: "bg-lime-500" },
  { value: "2", text: "2", colorClass: "bg-yellow-500" },
  { value: "3", text: "3", colorClass: "bg-orange-500" },
  { value: "3up", text: "มากกว่า 3 More than 3", colorClass: "bg-rose-500" },
];

// Place options for dropdown
export const placeOptions = [
  "CMIC Office",
  "CMIC Plant",
  "RMC Siam Office",
  "RMC Siam Plant",
  "RMX Office",
  "RMX Plant",
  "Mabtakood Office",
  "Mabtakood Plant",
  "Lumbuilding Office",
  "Lumbuilding Plant",
  "Vietnam Office",
  "Vietnam Plant",
  "Cambodia Office",
  "Cambodia Plant",
  "Sri Lanka Office",
  "Sri Lanka Plant",
  "Bangladesh Office",
  "Bangladesh Plant",
  "Other",
];
