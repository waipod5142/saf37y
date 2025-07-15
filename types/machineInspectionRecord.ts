export interface MachineInspectionRecord {
  id: string;
  bu: string;
  type: string;
  inspector: string;
  timestamp: any; // Firebase Timestamp
  createdAt?: any; // Firebase Timestamp
  remark?: string;
  images?: string[];
  docId?: string;
  
  // Inspection results - dynamic fields based on machine type
  [key: string]: any;
}