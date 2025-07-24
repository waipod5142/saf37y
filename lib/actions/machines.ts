"use server";

import { firestore } from "@/firebase/server";
import { MachineInspectionRecord } from "@/types/machineInspectionRecord";
import { Machine } from "@/types/machine";
import { FieldValue } from "firebase-admin/firestore";
import admin from "firebase-admin";

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
      // Location data
      latitude: formData.latitude,
      longitude: formData.longitude,
      locationTimestamp: formData.locationTimestamp ? admin.firestore.Timestamp.fromDate(new Date(formData.locationTimestamp)) : null,
      locationAccuracy: formData.locationAccuracy,
      ...formData, // Include all form fields
    };

    // Remove undefined values before saving to Firestore
    const cleanedRecord = removeUndefinedValues(inspectionRecord);

    // Save to the machinetr collection
    const docRef = await firestore
      .collection("machinetr")
      .add(cleanedRecord);

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

export async function updateMachineInspectionRecord(
  docId: string,
  updateData: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Remove undefined values before saving to Firestore
    const cleanedData = removeUndefinedValues(updateData);

    // Update the inspection record in the machinetr collection
    const docRef = firestore.collection("machinetr").doc(docId);
    await docRef.update(cleanedData);

    console.log("Machine inspection record updated with ID:", docId);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating machine inspection record:", error);
    return {
      success: false,
      error: "Failed to update machine inspection record",
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
    
    // Collect all image paths from the record
    const allImagePaths: string[] = [];
    
    // Add general images
    if (recordData.images && recordData.images.length > 0) {
      allImagePaths.push(...recordData.images);
    }
    
    // Find and add question-specific images (fields ending with 'P' or 'F')
    Object.keys(recordData).forEach(key => {
      if ((key.endsWith('P') || key.endsWith('F')) && recordData[key]) {
        const value = recordData[key];
        if (Array.isArray(value)) {
          // Handle array of images (new format)
          allImagePaths.push(...value);
        } else if (typeof value === 'string') {
          // Handle single image (backward compatibility)
          allImagePaths.push(value);
        }
      }
    });
    
    // Delete all collected images from Firebase Storage
    if (allImagePaths.length > 0) {
      try {
        const bucket = admin.storage().bucket("sccc-inseesafety-prod.firebasestorage.app");
        
        // Delete all images in parallel
        const deletePromises = allImagePaths.map(async (imagePath: string) => {
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
        console.log(`Attempted to delete ${allImagePaths.length} total images from Storage (including question-specific images)`);
        
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

export async function getMachinesAction(
  bu: string,
  site: string,
  type: string
): Promise<{ success: boolean; machines?: Machine[]; error?: string }> {
  try {
    // Debug logging
    console.log("=== getMachinesAction Debug Info ===");
    console.log("Input parameters:", { bu, site, type });
    console.log("Query type (lowercased):", type.toLowerCase());

    // Query the machine collection with matching bu, site, and type
    const machineQuery = firestore
      .collection("machine")
      .where("bu", "==", bu)
      .where("site", "==", site)
      .where("type", "==", type.toLowerCase());

    console.log("Executing Firestore query...");
    const machineSnapshot = await machineQuery.get();
    
    console.log("Query result:", {
      empty: machineSnapshot.empty,
      size: machineSnapshot.size,
      docs: machineSnapshot.docs.length
    });

    if (machineSnapshot.empty) {
      console.log("No documents found - returning empty array");
      
      // Additional debug: Let's check if there are any machines with this bu and site (ignoring type)
      const debugQuery = firestore
        .collection("machine")
        .where("bu", "==", bu)
        .where("site", "==", site);
      
      const debugSnapshot = await debugQuery.get();
      console.log("Debug check - machines with same bu/site (any type):", debugSnapshot.size);
      
      if (!debugSnapshot.empty) {
        const types = debugSnapshot.docs.map(doc => doc.data().type);
        console.log("Available types for this bu/site:", [...new Set(types)]);
      }
      
      return {
        success: true,
        machines: [],
      };
    }

    // Map all matching documents to Machine objects
    const machines: Machine[] = machineSnapshot.docs.map((doc) => {
      const machineData = doc.data();
      console.log("Found machine:", { id: machineData.id, type: machineData.type, site: machineData.site, bu: machineData.bu });
      
      // Serialize Firestore data for client-server boundary
      const serializedData: any = {};
      Object.keys(machineData).forEach(key => {
        const value = machineData[key];
        if (value && typeof value === 'object' && value.toDate) {
          // Convert Firestore Timestamp to ISO string
          serializedData[key] = value.toDate().toISOString();
        } else {
          serializedData[key] = value;
        }
      });
      
      return {
        ...serializedData,
        docId: doc.id,
      } as Machine;
    });

    // Sort by machine ID for consistent ordering
    machines.sort((a, b) => (a.id || "").localeCompare(b.id || ""));

    console.log("Returning machines:", machines.length);
    console.log("=== End Debug Info ===");

    return {
      success: true,
      machines,
    };
  } catch (error) {
    console.error("Error fetching machines by site and type:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return {
      success: false,
      error: `Failed to fetch machines: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}