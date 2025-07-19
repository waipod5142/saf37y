export interface Machine {
  id: string;
  bu: string;
  type: string;
  description: string;
  site?: string;
  country?: string;
  
  // Additional fields that might be present in machine data
  name?: string;
  question?: string;
  howto?: string;
  accept?: string;
  images?: string[];
  questions?: Array<{
    question: string;
    name: string;
    howto: string;
    accept: string;
  }>;
  specifications?: Record<string, any>;
  lastInspection?: string;
  nextInspection?: string;
  status?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  location?: string;
  
  // Firebase document ID
  docId?: string;
  
  // Any other dynamic fields from Firebase
  [key: string]: any;
}