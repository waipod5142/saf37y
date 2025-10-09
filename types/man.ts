// Base interface for all man records
export interface BaseManRecord {
  id: string;
  bu: string;
  type: string;
  site?: string; // Site field from employees collection
  images: string[]; // Array of image URLs
  timestamp: Date | string;
  createdAt: Date | string;
  remark?: string;
  docId?: string; // Firestore document ID for delete functionality
}

// SOT/VFL/Meeting record interface (safety-focused)
export interface SotManRecord extends BaseManRecord {
  report: "sot" | "vfl";
  area: string;
  talkwith: string; // Observer name
  topics: string[]; // Safety issues array
  safe?: string; // Positive reinforcement
  care?: string; // Safety care
  riskLevel: "low" | "medium" | "high";
  actionComment?: string;
  safetyIssues?: string[]; // Alternative field name for topics
}

// Talk record interface (communication-focused)
export interface TalkManRecord extends BaseManRecord {
  selectedTopic: string;
  participate: number; // Number of participants
  talkdetail: string;
  place: string; // Location
  safetyIssues?: string[]; // May be empty array for talks
}

// Toolbox Talk record interface (training-focused)
export interface ToolboxManRecord extends BaseManRecord {
  presenter: string;
  subject: string;
  learn: string;
}

// Alert form record interface (accident reporting)
export interface AlertManRecord extends BaseManRecord {
  acknowledge: string; // Acknowledgment status
  alertNo: string; // Alert number identifier
  typeAccident: string; // Type of accident (e.g., "lostTime")
  learn: string; // Learning points from the incident
}

// Alert form record interface (accident reporting)
export interface BootManRecord extends BaseManRecord {
  observeContact: string;
  commentSafeBehavior: string;
  discussUnsafeBehavior: string;
  otherSafetyIssues: string;
  agreementWorkSafely: string;
  area: string;
}

// Meeting form record interface (safety meeting participation)
export interface MeetingManRecord extends BaseManRecord {
  acknowledge: string; // Acknowledgment status
  alertNo: string; // Meeting identifier (reusing same field name)
  feedback: string; // Meeting feedback instead of learn
  // Note: No typeAccident field (distinguishes from AlertManRecord)
}

// Training record interface (safety training/certification)
export interface TrainingManRecord extends BaseManRecord {
  empId: string; // Employee ID (maps to id param)
  courseId: string; // Course identifier
  courseName: string; // Course name in Thai/English
  trainingCourse: string; // Course name in Thai/English
  trainingDate: Date | string; // Training completion date
  expiryDate: Date | string; // Certificate expiry date
  expirationDate: Date | string; // Certificate expiry date
  hours: string; // Training duration
  score: string; // Test score
  status: string; // Training status (active, expired, etc.)
  files: string[]; // Certificate/document URLs (maps to images field)
  evidenceText?: string; // Text evidence (optional)
  updateAt: Date | string; // Last update
  updateBy: string; // Updated by
}

// Grease record interface (greasing method from methodtr collection)
export interface GreaseRecord extends BaseManRecord {
  type: "greaseform";
  // No additional fields - uses base fields only
}

// Union type for all man records
export type ManRecord =
  | SotManRecord
  | TalkManRecord
  | ToolboxManRecord
  | AlertManRecord
  | BootManRecord
  | MeetingManRecord
  | TrainingManRecord
  | GreaseRecord;

// Legacy interface for backward compatibility
export interface LegacyManRecord {
  id: string;
  bu: string;
  type: string;
  report: "sot" | "vfl";
  area: string;
  talkwith: string; // Observer name
  topics: string[]; // Safety issues array
  safe?: string; // Positive reinforcement
  care?: string; // Safety care
  riskLevel: "low" | "medium" | "high";
  actionComment?: string;
  remark?: string;
  images: string[]; // Array of image URLs
  timestamp: Date | string;
  createdAt: Date | string;
  safetyIssues?: string[]; // Alternative field name for topics
  docId?: string; // Firestore document ID for delete functionality
}
