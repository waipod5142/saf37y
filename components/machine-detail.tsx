import { getMachineInspectionRecords } from "@/data/machines";
import { getMachineQuestions } from "@/lib/actions/forms";
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
  // Fetch both records and questions in parallel
  const [records, questionsResult] = await Promise.all([
    getMachineInspectionRecords(bu, type, id),
    getMachineQuestions(bu, type)
  ]);
  
  // Serialize the records to ensure they can be passed to client component
  const serializedRecords = records.map(serializeRecord);
  
  // Extract questions from the result, fallback to empty array if failed
  const questions = questionsResult.success && questionsResult.questions ? questionsResult.questions : [];
  
  return (
    <div className="max-w-4xl mx-auto p-2">
      <MachineDetailClient records={serializedRecords} questions={questions} />
    </div>
  );
}