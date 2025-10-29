"use server";

import { firestore } from "@/firebase/server";

export interface SafetyStatRecord {
  plantId: string;
  lastAccidentDate?: string | null;
  bestRecord?: number | null;
}

export interface Campaign {
  campaignId: string;
  title: string;
  description: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  durationYears: number;
  isActive: boolean;
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
    const snapshot = await firestore
      .collection("safetystat")
      .where("plantId", "==", plantId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return {
        success: true,
        data: undefined,
      };
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    // Convert Firestore Timestamp to ISO string for client components
    let lastAccidentDate: string | null = null;
    if (data.lastAccidentDate) {
      if (data.lastAccidentDate.toDate) {
        // Firestore Timestamp object
        lastAccidentDate = data.lastAccidentDate.toDate().toISOString();
      } else if (typeof data.lastAccidentDate === "string") {
        // Already a string
        lastAccidentDate = data.lastAccidentDate;
      }
    }

    return {
      success: true,
      data: {
        plantId: data.plantId || plantId,
        lastAccidentDate: lastAccidentDate,
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

/**
 * Fetch the active campaign from Firestore (safetystat/safetyCampaigns)
 * @returns Active campaign data or null if not found
 */
export async function getActiveCampaign(): Promise<{
  success: boolean;
  data?: Campaign;
  error?: string;
}> {
  try {
    const docRef = firestore.collection("safetystat").doc("safetyCampaigns");
    const doc = await docRef.get();

    if (!doc.exists) {
      console.warn("No active campaign found in Firestore");
      return {
        success: true,
        data: undefined,
      };
    }

    const data = doc.data();

    // Convert Firestore Timestamps to ISO strings
    let startDate = "2024-01-01";
    let endDate = "2026-12-31";

    if (data?.startDate) {
      if (data.startDate.toDate) {
        startDate = data.startDate.toDate().toISOString().split("T")[0];
      } else if (typeof data.startDate === "string") {
        startDate = data.startDate;
      }
    }

    if (data?.endDate) {
      if (data.endDate.toDate) {
        endDate = data.endDate.toDate().toISOString().split("T")[0];
      } else if (typeof data.endDate === "string") {
        endDate = data.endDate;
      }
    }

    return {
      success: true,
      data: {
        campaignId: data?.campaignId || "safety-first-campaign",
        title: data?.title || "Safety First Campaign",
        description:
          data?.description || "3-Year Safety Culture Promotion Campaign",
        startDate,
        endDate,
        durationYears: data?.durationYears || 3,
        isActive: data?.isActive ?? true,
      },
    };
  } catch (error) {
    console.error("Error fetching active campaign:", error);
    return {
      success: false,
      error: "Failed to fetch campaign data",
    };
  }
}

/**
 * Update the active campaign in Firestore (safetystat/safetyCampaigns)
 * @param campaign - Campaign data to update
 */
export async function updateActiveCampaign(
  campaign: Omit<Campaign, "isActive">
): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = firestore.collection("safetystat").doc("safetyCampaigns");

    await docRef.set(
      {
        campaignId: campaign.campaignId,
        title: campaign.title,
        description: campaign.description,
        startDate: new Date(campaign.startDate),
        endDate: new Date(campaign.endDate),
        durationYears: campaign.durationYears,
        isActive: true,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return { success: true };
  } catch (error) {
    console.error("Error updating campaign:", error);
    return {
      success: false,
      error: "Failed to update campaign data",
    };
  }
}
