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
  
  // Location data
  latitude?: number;
  longitude?: number;
  locationTimestamp?: any; // Firebase Timestamp when location was captured
  locationAccuracy?: number; // GPS accuracy in meters
  
  // Inspection results - dynamic fields based on machine type
  [key: string]: any;
}