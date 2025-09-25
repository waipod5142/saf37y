import { firestore } from "@/firebase/server";
import { ManRecord } from "@/types/man";
import "server-only";

// Utility function for Firebase timestamp conversion
function convertFirebaseTimestamp(timestamp: any): Date | null {
  if (!timestamp) return null;

  // If it has toDate method (actual Firebase Timestamp)
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }

  // If it's a serialized timestamp with _seconds
  if (timestamp._seconds !== undefined) {
    return new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
  }

  // Fallback to regular Date parsing
  return new Date(timestamp);
}

// Serialize Firebase Timestamps to plain objects
const serializeManRecord = (record: any): ManRecord => {
  return {
    ...record,
    timestamp: convertFirebaseTimestamp(record.timestamp),
    createdAt: convertFirebaseTimestamp(record.createdAt),
  };
};

export const getManRecords = async (
  bu: string,
  type: string,
  id: string
): Promise<ManRecord[]> => {
  try {
    // Decode URL parameters to handle special characters (including Thai characters)
    const decodedId = decodeURIComponent(id);

    console.log(`Searching for man records with bu: ${bu}, type: ${type}, id: ${decodedId}`);

    // First, try with the exact parameters but without orderBy to avoid index issues
    let manQuery = firestore
      .collection("mantr")
      .where("bu", "==", bu)
      .where("type", "==", type.toLowerCase())
      .where("id", "==", decodedId);

    let manSnapshot = await manQuery.get();

    // If no results, try without the type filter (in case type field is different)
    if (manSnapshot.empty) {
      console.log(`No records found with type filter. Trying without type filter...`);
      manQuery = firestore
        .collection("mantr")
        .where("bu", "==", bu)
        .where("id", "==", decodedId);

      manSnapshot = await manQuery.get();
    }

    // If still no results, try with just the id
    if (manSnapshot.empty) {
      console.log(`No records found with bu filter. Trying with just id...`);
      manQuery = firestore
        .collection("mantr")
        .where("id", "==", decodedId);

      manSnapshot = await manQuery.get();
    }

    if (manSnapshot.empty) {
      console.log(`No man records found for any combination. Final attempt: bu: ${bu}, type: ${type}, id: ${decodedId}`);
      return [];
    }

    const records: ManRecord[] = [];
    manSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`Found record:`, data);
      const serializedRecord = serializeManRecord({
        ...data,
        docId: doc.id, // Include Firestore document ID
      });
      records.push(serializedRecord);
    });

    // Sort by timestamp client-side since we removed orderBy
    records.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB.getTime() - dateA.getTime();
    });

    console.log(`Found ${records.length} man records for bu: ${bu}, type: ${type}, id: ${decodedId}`);
    return records;
  } catch (error) {
    console.error("Error fetching man records:", error);
    return [];
  }
};

export const getManRecordById = async (
  recordId: string
): Promise<ManRecord | null> => {
  try {
    const docSnapshot = await firestore
      .collection("mantr")
      .doc(recordId)
      .get();

    if (!docSnapshot.exists) {
      console.log(`No man record found with ID: ${recordId}`);
      return null;
    }

    const data = docSnapshot.data();
    if (!data) return null;

    const serializedRecord = serializeManRecord({
      ...data,
      docId: docSnapshot.id,
    });

    return serializedRecord;
  } catch (error) {
    console.error("Error fetching man record by ID:", error);
    return null;
  }
};

