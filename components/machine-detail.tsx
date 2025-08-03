import { getMachineInspectionRecords, getMachineInspectionRecordsForMixers, isMixerType, MIXER_TYPES } from "@/data/machines";
import { getMachineQuestions } from "@/lib/actions/forms";
import { MachineInspectionRecord } from "@/types/machineInspectionRecord";
import { MachineItem } from "@/lib/machine-types";
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
    locationTimestamp: convertTimestamp(record.locationTimestamp),
  };
};

export default async function MachineDetail({ bu, type, id }: MachineDetailProps) {
  // Check if this is a mixer type and use appropriate fetching strategy
  const isMixer = isMixerType(type);
  
  let records: MachineInspectionRecord[];
  let questions: MachineItem[] = [];
  
  if (isMixer) {
    // For mixer types, fetch records for all mixer variants and questions for all mixer types
    const [mixerRecords, ...questionResults] = await Promise.all([
      getMachineInspectionRecordsForMixers(bu, id),
      ...MIXER_TYPES.map(mixerType => getMachineQuestions(bu, mixerType))
    ]);
    
    records = mixerRecords;
    
    // Merge and deduplicate questions from all mixer types
    const allQuestions: MachineItem[] = [];
    const seenQuestionNames = new Set<string>();
    
    questionResults.forEach(result => {
      if (result.success && result.questions) {
        result.questions.forEach(question => {
          if (!seenQuestionNames.has(question.name)) {
            seenQuestionNames.add(question.name);
            allQuestions.push(question);
          }
        });
      }
    });
    
    questions = allQuestions;
  } else {
    // For non-mixer types, use the original logic
    const [nonMixerRecords, questionsResult] = await Promise.all([
      getMachineInspectionRecords(bu, type, id),
      getMachineQuestions(bu, type)
    ]);
    
    records = nonMixerRecords;
    questions = questionsResult.success && questionsResult.questions ? questionsResult.questions : [];
  }
  
  // Serialize the records to ensure they can be passed to client component
  const serializedRecords = records.map(serializeRecord);
  
  return (
    <MachineDetailClient records={serializedRecords} questions={questions} />
  );
}