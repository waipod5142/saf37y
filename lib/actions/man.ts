"use server";

import { firestore } from "@/firebase/server";
import { FieldValue } from "firebase-admin/firestore";

// Utility function to remove undefined values from an object
function removeUndefinedValues(obj: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      // Keep null values as they are valid in Firestore, only filter undefined
      cleaned[key] = value;
    }
  }

  return cleaned;
}

// Utility function to serialize Firestore objects for client-server boundary
function serializeFirestoreData(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle Firestore Timestamp objects
  if (obj && typeof obj === 'object' && obj.toDate) {
    return obj.toDate().toISOString();
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => serializeFirestoreData(item));
  }

  // Handle plain objects
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const serialized: any = {};
    Object.keys(obj).forEach(key => {
      serialized[key] = serializeFirestoreData(obj[key]);
    });
    return serialized;
  }

  // Return primitive values as-is
  return obj;
}

export async function submitManForm(
  formData: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create the man SOT/VFL inspection record
    const manRecord = {
      id: formData.id,
      bu: formData.bu,
      type: formData.type,
      reportingType: formData.reportingType, // 'sot' or 'vfl'
      area: formData.area,
      observerName: formData.observerName,
      safetyIssues: formData.safetyIssues || [],
      positiveReinforcement: formData.positiveReinforcement,
      safetyCare: formData.safetyCare,
      riskLevel: formData.riskLevel,
      processComments: formData.processComments,
      remarks: formData.remarks,
      images: formData.images || [],
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      ...formData, // Include any additional form fields
    };

    // Remove undefined values before saving to Firestore
    const cleanedRecord = removeUndefinedValues(manRecord);

    // Save to the mantr collection
    const docRef = await firestore
      .collection("mantr")
      .add(cleanedRecord);

    console.log("Man SOT/VFL record saved with ID:", docRef.id);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error saving man SOT/VFL record:", error);
    return {
      success: false,
      error: `Failed to save man SOT/VFL record: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function deleteManRecord(
  recordId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await firestore
      .collection("mantr")
      .doc(recordId)
      .delete();

    console.log(`Man record deleted with ID: ${recordId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting man record:", error);
    return {
      success: false,
      error: `Failed to delete man record: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}