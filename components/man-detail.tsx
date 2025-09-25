import { getManRecords } from "@/data/man";
import { ManRecord } from "@/types/man";
import ManDetailClient from "./man-detail-client";

interface ManDetailProps {
  bu: string;
  type: string;
  id: string;
}

// Serialize Firebase Timestamps to plain objects
const serializeRecord = (record: ManRecord): ManRecord => {
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

export default async function ManDetail({ bu, type, id }: ManDetailProps) {
  // Fetch man records from the mantr collection
  const records = await getManRecords(bu, type, id);

  // Serialize the records to ensure they can be passed to client component
  const serializedRecords = records.map(serializeRecord);

  return (
    <ManDetailClient records={serializedRecords} />
  );
}