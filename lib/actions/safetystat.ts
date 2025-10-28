"use server";

import { firestore } from "@/firebase/server";

export interface SafetyStatRecord {
  plantId: string;
  lastAccidentDate?: string | null;
  bestRecord?: number | null;
}

/**
 * Fetch safety statistics for a specific plant from Firestore
 * @param plantId - The plant ID to fetch
 * @returns Safety statistics data or null if not found
 */
export async function getSafetyStatByPlantId(
  plantId: string
): Promise<{ success: boolean; data?: SafetyStatRecord; error?: string }> {
  try {
    const docRef = firestore.collection("safetystat").doc(plantId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return {
        success: true,
        data: undefined,
      };
    }

    const data = doc.data() as SafetyStatRecord;

    return {
      success: true,
      data: {
        plantId: doc.id,
        lastAccidentDate: data.lastAccidentDate || null,
        bestRecord: data.bestRecord || null,
      },
    };
  } catch (error) {
    console.error("Error fetching safety stat:", error);
    return {
      success: false,
      error: "Failed to fetch safety statistics",
    };
  }
}

/**
 * Get all safety statistics from Firestore
 * @returns Array of all safety stat records
 */
export async function getAllSafetyStats(): Promise<{
  success: boolean;
  data?: SafetyStatRecord[];
  error?: string;
}> {
  try {
    const snapshot = await firestore.collection("safetystat").get();

    const records: SafetyStatRecord[] = [];

    snapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      records.push({
        plantId: doc.id,
        lastAccidentDate: data.lastAccidentDate || null,
        bestRecord: data.bestRecord || null,
      });
    });

    return {
      success: true,
      data: records,
    };
  } catch (error) {
    console.error("Error fetching all safety stats:", error);
    return {
      success: false,
      error: "Failed to fetch safety statistics",
    };
  }
}
