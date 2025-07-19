"use server";

import { firestore } from "@/firebase/server";
import { MachineInspectionRecord } from "@/types/machineInspectionRecord";
import { FieldValue } from "firebase-admin/firestore";
import admin from "firebase-admin";

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

export async function deleteMachineInspectionRecord(
  docId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First, fetch the inspection record to get the images array
    const docRef = firestore.collection("machinetr").doc(docId);
    const docSnapshot = await docRef.get();
    
    if (!docSnapshot.exists) {
      return {
        success: false,
        error: "Inspection record not found",
      };
    }

    const recordData = docSnapshot.data() as MachineInspectionRecord;
    
    // Delete images from Firebase Storage if they exist
    if (recordData.images && recordData.images.length > 0) {
      try {
        const bucket = admin.storage().bucket("sccc-inseesafety-prod.firebasestorage.app");
        
        // Delete all images in parallel
        const deletePromises = recordData.images.map(async (imagePath: string) => {
          try {
            const file = bucket.file(imagePath);
            await file.delete();
            console.log(`Successfully deleted image: ${imagePath}`);
          } catch (imageError) {
            console.error(`Failed to delete image ${imagePath}:`, imageError);
            // Don't throw here - we want to continue deleting other images
          }
        });

        await Promise.allSettled(deletePromises);
        console.log(`Attempted to delete ${recordData.images.length} images from Storage`);
        
      } catch (storageError) {
        console.error("Error during image deletion:", storageError);
        // Continue with document deletion even if image deletion fails
      }
    }

    // Delete the inspection record from the machinetr collection
    await docRef.delete();

    console.log("Machine inspection record deleted with ID:", docId);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting machine inspection record:", error);
    return {
      success: false,
      error: "Failed to delete machine inspection record",
    };
  }
}