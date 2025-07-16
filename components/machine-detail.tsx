import { getMachineInspectionRecords } from "@/data/machines";
import { MachineInspectionRecord } from "@/types/machineInspectionRecord";
import MachineDetailClient from "./machine-detail-client";

interface MachineDetailProps {
  bu: string;
  type: string;
  id: string;
}

// Serialize Firebase Timestamps to plain objects
const serializeRecord = (record: MachineInspectionRecord): MachineInspectionRecord => {
  // Convert Firebase Timestamps to Date objects which can be safely serialized
  const convertTimestamp = (timestamp: any) => {
    if (!timestamp) return null;
    if (timestamp.toDate) {
      return timestamp.toDate();
    }
    if (timestamp._seconds) {
      return new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
    }
    return timestamp;
  };

  return {
    ...record,
    timestamp: convertTimestamp(record.timestamp),
    createdAt: convertTimestamp(record.createdAt),
  };
};

export default async function MachineDetail({ bu, type, id }: MachineDetailProps) {
  const records = await getMachineInspectionRecords(bu, type, id);
  
  // Serialize the records to ensure they can be passed to client component
  const serializedRecords = records.map(serializeRecord);
  
  return <MachineDetailClient records={serializedRecords} />;
}