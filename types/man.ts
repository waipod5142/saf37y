export interface ManRecord {
  id: string;
  bu: string;
  type: string;
  report: 'sot' | 'vfl';
  area: string;
  talkwith: string; // Observer name
  topics: string[]; // Safety issues array
  safe?: string; // Positive reinforcement
  care?: string; // Safety care
  riskLevel: 'low' | 'medium' | 'high';
  actionComment?: string;
  remark?: string;
  images: string[]; // Array of image URLs
  timestamp: Date | string;
  createdAt: Date | string;
  safetyIssues?: string[]; // Alternative field name for topics
  docId?: string; // Firestore document ID for delete functionality
}