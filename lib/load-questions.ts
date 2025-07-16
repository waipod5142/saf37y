import { MachineItem } from "./machine-types";

export interface QuestionData {
  questions: MachineItem[];
}

// Sample questions for demonstration - you can extend this with actual data
const sampleQuestions: MachineItem[] = [
  {
    id: "1",
    name: "lub",
    question: "Engine oil level check",
    howto: "Check the oil level using the dipstick",
    accept: "Oil level between minimum and maximum marks",
  },
  {
    id: "2",
    name: "radiator",
    question: "Radiator coolant level",
    howto: "Check coolant level in radiator tank",
    accept: "Coolant level at proper mark",
  },
  {
    id: "3",
    name: "battery",
    question: "Battery condition check",
    howto: "Check battery terminals and electrolyte level",
    accept: "Clean terminals, proper electrolyte level",
  },
  {
    id: "4",
    name: "headLight",
    question: "Headlight functionality",
    howto: "Turn on headlights and check both lights",
    accept: "Both headlights working properly",
  },
  {
    id: "5",
    name: "brakeLight",
    question: "Brake light check",
    howto: "Press brake pedal and check rear lights",
    accept: "All brake lights illuminate",
  },
];

export const loadQuestions = async (
  bu: string | undefined | null,
  machine: string | undefined | null
): Promise<QuestionData> => {
  // Simulate async loading
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const key = `${bu}_${machine}`;
  
  // For now, return sample questions for all combinations
  // In a real implementation, you would load specific questions based on the key
  switch (key) {
    case "th_Truck":
    case "th_Truckall":
    case "th_Car":
    case "th_Mixer":
    case "vn_Vehicle":
    case "vn_Forklift":
    case "lk_Car":
    case "lk_Forklift":
    case "bd_Forklift":
    case "cmic_Vehicle":
    case "cmic_Forklift":
      return { questions: sampleQuestions };
    
    case "th_Extinguisher":
    case "vn_Extinguisher":
    case "lk_Extinguisher":
    case "bd_Extinguisher":
    case "cmic_Extinguisher":
      return {
        questions: [
          {
            id: "1",
            name: "gauge",
            question: "Pressure gauge reading",
            howto: "Check pressure gauge on extinguisher",
            accept: "Gauge needle in green zone",
          },
          {
            id: "2",
            name: "handle",
            question: "Handle and trigger condition",
            howto: "Check handle and trigger mechanism",
            accept: "Handle secure, trigger moves freely",
          },
          {
            id: "3",
            name: "label",
            question: "Label and instructions",
            howto: "Check instruction label visibility",
            accept: "Label clearly visible and readable",
          },
        ],
      };
    
    default:
      return { questions: sampleQuestions };
  }
};