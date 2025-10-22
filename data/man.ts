import { firestore } from "@/firebase/server";
import { ManRecord } from "@/types/man";
import "server-only";

// Utility function for Firebase timestamp conversion
function convertFirebaseTimestamp(timestamp: any): Date | null {
  if (!timestamp) return null;

  // If it has toDate method (actual Firebase Timestamp)
  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    return timestamp.toDate();
  }

  // If it's a serialized timestamp with _seconds
  if (timestamp._seconds !== undefined) {
    return new Date(
      timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000
    );
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
    // Handle training-specific date fields
    trainingDate: convertFirebaseTimestamp(record.trainingDate),
    expirationDate: convertFirebaseTimestamp(record.expirationDate),
    expiryDate: convertFirebaseTimestamp(record.expiryDate),
    updateAt: convertFirebaseTimestamp(record.updateAt),
    updatedAt: convertFirebaseTimestamp(record.updatedAt),
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

    console.log(
      `Searching for man records with bu: ${bu}, type: ${type}, id: ${decodedId}`
    );

    // Handle training records differently - fetch from trainings collection where empId equals id
    if (type.toLowerCase() === "training") {
      console.log(
        `Fetching training records from trainings collection where empId: ${decodedId}`
      );

      const trainingQuery = firestore
        .collection("trainings")
        .where("empId", "==", decodedId);

      // Note: bu filter not applied for training records as trainings collection doesn't have bu field

      const trainingSnapshot = await trainingQuery.get();

      if (trainingSnapshot.empty) {
        console.log(`No training records found for empId: ${decodedId}`);
        return [];
      }

      const records: ManRecord[] = [];
      trainingSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`Found training record:`, data);
        const serializedRecord = serializeManRecord({
          ...data,
          docId: doc.id, // Include Firestore document ID
        });
        records.push(serializedRecord);
      });

      // Sort by timestamp client-side
      records.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.createdAt);
        const dateB = new Date(b.timestamp || b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      console.log(
        `Found ${records.length} training records for empId: ${decodedId}`
      );
      return records;
    }

    // Handle grease records differently - fetch from methodtr collection
    if (
      type.toLowerCase() === "grease" ||
      type.toLowerCase() === "greaseform"
    ) {
      console.log(
        `Fetching grease records from methodtr collection where id: ${decodedId}`
      );

      let greaseQuery = firestore
        .collection("methodtr")
        .where("id", "==", decodedId)
        .where("type", "==", "greaseform");

      // Add bu filter if provided
      if (bu) {
        greaseQuery = greaseQuery.where("bu", "==", bu);
      }

      const greaseSnapshot = await greaseQuery.get();

      if (greaseSnapshot.empty) {
        console.log(`No grease records found for id: ${decodedId}`);
        return [];
      }

      const records: ManRecord[] = [];
      greaseSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`Found grease record:`, data);
        const serializedRecord = serializeManRecord({
          ...data,
          docId: doc.id, // Include Firestore document ID
        });
        records.push(serializedRecord);
      });

      // Sort by timestamp client-side
      records.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.createdAt);
        const dateB = new Date(b.timestamp || b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      console.log(
        `Found ${records.length} grease records for id: ${decodedId}`
      );
      return records;
    }

    // For all other types, use the existing mantr collection logic
    // First, try with the exact parameters but without orderBy to avoid index issues
    let manQuery = firestore
      .collection("mantr")
      .where("bu", "==", bu)
      .where("type", "==", type.toLowerCase())
      .where("id", "==", decodedId);

    let manSnapshot = await manQuery.get();

    // If no results, try without the type filter (in case type field is different)
    if (manSnapshot.empty) {
      console.log(
        `No records found with type filter. Trying without type filter...`
      );
      manQuery = firestore
        .collection("mantr")
        .where("bu", "==", bu)
        .where("id", "==", decodedId);

      manSnapshot = await manQuery.get();
    }

    // If still no results, try with just the id
    if (manSnapshot.empty) {
      console.log(`No records found with bu filter. Trying with just id...`);
      manQuery = firestore.collection("mantr").where("id", "==", decodedId);

      manSnapshot = await manQuery.get();
    }

    if (manSnapshot.empty) {
      console.log(
        `No man records found for any combination. Final attempt: bu: ${bu}, type: ${type}, id: ${decodedId}`
      );
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

    console.log(
      `Found ${records.length} man records for bu: ${bu}, type: ${type}, id: ${decodedId}`
    );
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
    const docSnapshot = await firestore.collection("mantr").doc(recordId).get();

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

export interface TokenData {
  _id: string;
  id: string;
  name: string;
  position: string;
  department: string;
  site: string;
  type: string;
  eSite: string;
  status: string;
  company: string;
  trans: TokenTransaction[];
}

export interface TokenTransaction {
  _id: string;
  id: string;
  date: string;
  token: string;
}

export const getTokenData = async (
  bu: string,
  id: string
): Promise<TokenData | null> => {
  try {
    // Decode URL parameters to handle special characters (including Thai characters)
    const decodedId = decodeURIComponent(id);

    console.log(`Fetching token data for bu: ${bu}, id: ${decodedId}`);

    // First try to get from vehicleTr collection (if it exists in Firestore)
    let tokenQuery = firestore
      .collection("vehicleTr")
      .where("bu", "==", bu)
      .where("id", "==", decodedId)
      .where("type", "==", "token");

    let tokenSnapshot = await tokenQuery.get();

    // If no results, try just with id and type
    if (tokenSnapshot.empty) {
      console.log(
        `No token records found with bu filter. Trying with just id and type...`
      );
      tokenQuery = firestore
        .collection("vehicleTr")
        .where("id", "==", decodedId)
        .where("type", "==", "token");

      tokenSnapshot = await tokenQuery.get();
    }

    // If still no results, try just with id
    if (tokenSnapshot.empty) {
      console.log(
        `No token records found with type filter. Trying with just id...`
      );
      tokenQuery = firestore
        .collection("vehicleTr")
        .where("id", "==", decodedId);

      tokenSnapshot = await tokenQuery.get();
    }

    if (tokenSnapshot.empty) {
      console.log(`No token data found for id: ${decodedId}`);
      return null;
    }

    // Get the first matching document
    const doc = tokenSnapshot.docs[0];
    const data = doc.data();

    // Transform the data to match the expected TokenData interface
    const tokenData: TokenData = {
      _id: doc.id,
      id: data.id || decodedId,
      name: data.name || "",
      position: data.position || "",
      department: data.department || "",
      site: data.site || "",
      type: data.type || "token",
      eSite: data.eSite || "",
      status: data.status || "",
      company: data.company || "",
      trans: data.trans || [],
    };

    console.log(`Found token data for id: ${decodedId}`, tokenData);
    return tokenData;
  } catch (error) {
    console.error("Error fetching token data:", error);
    return null;
  }
};
