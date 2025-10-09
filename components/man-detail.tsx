import { getManRecords } from "@/data/man";
import {
  ManRecord,
  SotManRecord,
  TalkManRecord,
  ToolboxManRecord,
  AlertManRecord,
  BootManRecord,
  MeetingManRecord,
  TrainingManRecord,
  GreaseRecord,
} from "@/types/man";
import SotManDetailClient from "./man-detail-sot-client";
import TalkManDetailClient from "./man-detail-talk-client";
import ToolboxManDetailClient from "./man-detail-toolbox-client";
import AlertManDetailClient from "./man-detail-alert-client";
import BootManDetailClient from "./man-detail-boot-client";
import MeetingManDetailClient from "./man-detail-meeting-client";
import TrainingManDetailClient from "./man-detail-training-client";
import GreaseManDetailClient from "./man-detail-grease-client";

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
      return new Date(
        timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000
      );
    }
    return timestamp;
  };

  return {
    ...record,
    timestamp: convertTimestamp(record.timestamp),
    createdAt: convertTimestamp(record.createdAt),
  };
};

// Type guard functions
const isSotRecord = (record: ManRecord): record is SotManRecord => {
  return record.type === "sot";
};

const isVflRecord = (record: ManRecord): record is SotManRecord => {
  return record.type === "sot";
};

const isTalkRecord = (record: ManRecord): record is TalkManRecord => {
  return record.type === "talk";
};

const isToolboxRecord = (record: ManRecord): record is ToolboxManRecord => {
  return record.type === "toolbox";
};

const isAlertRecord = (record: ManRecord): record is AlertManRecord => {
  return record.type === "alertform";
};

const isBootRecord = (record: ManRecord): record is BootManRecord => {
  return record.type === "bootform";
};

const isMeetingRecord = (record: ManRecord): record is MeetingManRecord => {
  return record.type === "meetingform";
};

const isTrainingRecord = (record: ManRecord): record is TrainingManRecord => {
  return (
    record.type === "trainingform" ||
    record.type === "training" ||
    record.type === undefined ||
    !("type" in record)
  );
};

const isGreaseRecord = (record: ManRecord): record is GreaseRecord => {
  return record.type === "greaseform";
};

const isSotOrVflRecord = (record: ManRecord): record is SotManRecord => {
  return record.type === "sot";
};

export default async function ManDetail({ bu, type, id }: ManDetailProps) {
  // Return null if type is undefined
  if (!type) return null;

  // Fetch man records (handles both mantr and methodtr collections)
  const records = await getManRecords(bu, type, id);

  // Normalize type to lowercase for proper matching
  const normalizedType = type.toLowerCase();

  // Serialize the records to ensure they can be passed to client component
  const serializedRecords = records.map(serializeRecord);

  if (!serializedRecords || serializedRecords.length === 0) {
    return null;
  }

  // Separate records by type
  const sotRecords = serializedRecords.filter(isSotOrVflRecord);
  const talkRecords = serializedRecords.filter(isTalkRecord);
  const toolboxRecords = serializedRecords.filter(isToolboxRecord);
  const alertRecords = serializedRecords.filter(isAlertRecord);
  const bootRecords = serializedRecords.filter(isBootRecord);
  const meetingRecords = serializedRecords.filter(isMeetingRecord);
  const trainingRecords = serializedRecords.filter(isTrainingRecord);
  const greaseRecords = serializedRecords.filter(isGreaseRecord);

  // Render only the specific type based on the normalized type parameter
  if (normalizedType === "talk") {
    return talkRecords.length > 0 ? (
      <TalkManDetailClient records={talkRecords} bu={bu} />
    ) : null;
  }

  if (normalizedType === "sot") {
    return sotRecords.length > 0 ? (
      <SotManDetailClient records={sotRecords} bu={bu} />
    ) : null;
  }

  if (normalizedType === "toolbox") {
    return toolboxRecords.length > 0 ? (
      <ToolboxManDetailClient records={toolboxRecords} bu={bu} />
    ) : null;
  }

  if (normalizedType === "alert") {
    return alertRecords.length > 0 ? (
      <AlertManDetailClient records={alertRecords} bu={bu} />
    ) : null;
  }

  if (normalizedType === "boot") {
    return bootRecords.length > 0 ? (
      <BootManDetailClient records={bootRecords} bu={bu} />
    ) : null;
  }

  if (normalizedType === "meeting") {
    return meetingRecords.length > 0 ? (
      <MeetingManDetailClient records={meetingRecords} bu={bu} />
    ) : null;
  }

  if (normalizedType === "training") {
    return trainingRecords.length > 0 ? (
      <TrainingManDetailClient records={trainingRecords} bu={bu} />
    ) : null;
  }

  if (normalizedType === "grease" || normalizedType === "greaseform") {
    return greaseRecords.length > 0 ? (
      <GreaseManDetailClient records={greaseRecords} bu={bu} />
    ) : null;
  }

  // Fallback: if type doesn't match, return null
  return null;
}
