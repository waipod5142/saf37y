"use server";

import { firestore } from "@/firebase/server";
import { MachineInspectionRecord } from "@/types/machineInspectionRecord";
import { FieldValue } from "firebase-admin/firestore";

export async function submitMachineForm(
  formData: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create the machine inspection record
    const inspectionRecord: Partial<MachineInspectionRecord> = {
      id: formData.id,
      bu: formData.bu,
      type: formData.type,
      inspector: formData.inspector,
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      remark: formData.remark,
      images: formData.images || [],
      ...formData, // Include all form fields
    };

    // Save to the machinetr collection
    const docRef = await firestore
      .collection("machinetr")
      .add(inspectionRecord);

    console.log("Machine inspection record saved with ID:", docRef.id);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error saving machine inspection record:", error);
    return {
      success: false,
      error: "Failed to save machine inspection record",
    };
  }
}