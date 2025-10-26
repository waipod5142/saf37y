export interface Machine {
  id: string;
  bu: string;
  type: string;
  description?: string;
  site?: string;
  country?: string;

  // Schema fields from Firebase
  createdAt?: any;
  createdBy?: string;
  email?: string;
  importedAt?: any;
  kind?: string;
  lastImportedAt?: any;
  location?: string;
  plantId?: string;
  status?: string;
  updatedAt?: any;
  updatedBy?: string;
  images?: string[];

  // Additional fields that might be present in machine data
  name?: string;
  question?: string;
  howto?: string;
  accept?: string;
  questions?: Array<{
    question: string;
    name: string;
    howto: string;
    accept: string;
  }>;
  specifications?: Record<string, any>;
  lastInspection?: string;
  nextInspection?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;

  // Firebase document ID
  docId?: string;

  // Any other dynamic fields from Firebase
  [key: string]: any;
}