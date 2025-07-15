import { firestore } from "@/firebase/server";
import { Machine } from "@/types/machine";
import { MachineInspectionRecord } from "@/types/machineInspectionRecord";
import "server-only";

export const getMachineById = async (
  bu: string,
  type: string,
  id: string
): Promise<Machine | null> => {
  try {
    // Query the machine collection with matching bu, type, and id
    const machineQuery = firestore
      .collection("machine")
      .where("bu", "==", bu)
      .where("type", "==", type)
      .where("id", "==", id);

    const machineSnapshot = await machineQuery.get();

    if (machineSnapshot.empty) {
      return null;
    }

    // Get the first matching document
    const doc = machineSnapshot.docs[0];
    const machineData = doc.data();

    return {
      ...machineData,
    } as Machine;
  } catch (error) {
    console.error("Error fetching machine data:", error);
    return null;
  }
};

export const getMachineInspectionRecords = async (
  bu: string,
  type: string,
  id: string
): Promise<MachineInspectionRecord[]> => {
  try {
    // Query the machinetr collection with matching bu, type (lowercase), and id
    const inspectionQuery = firestore
      .collection("machinetr")
      .where("bu", "==", bu)
      .where("type", "==", type.toLowerCase())
      .where("id", "==", id)
      .orderBy("timestamp", "desc"); // Latest first

    const inspectionSnapshot = await inspectionQuery.get();

    if (inspectionSnapshot.empty) {
      return [];
    }

    // Map all matching documents to MachineInspectionRecord objects
    const records: MachineInspectionRecord[] = inspectionSnapshot.docs.map((doc) => {
      const recordData = doc.data();
      return {
        id: recordData.id,
        bu: recordData.bu,
        type: recordData.type,
        inspector: recordData.inspector,
        timestamp: recordData.timestamp,
        createdAt: recordData.createdAt,
        remark: recordData.remark,
        images: recordData.images,
        docId: doc.id,
        ...recordData,
      } as MachineInspectionRecord;
    });

    return records;
  } catch (error) {
    console.error("Error fetching machine inspection records:", error);
    return [];
  }
};
