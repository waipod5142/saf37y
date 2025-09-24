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
    // Debug logging
    console.log("updateMachineInspectionRecord called with:", { docId, updateData });

    // Validate input parameters
    if (!docId || typeof docId !== 'string' || docId.trim() === '') {
      return {
        success: false,
        error: "Invalid document ID provided",
      };
    }

    if (!updateData || typeof updateData !== 'object' || updateData === null) {
      return {
        success: false,
        error: "Invalid update data provided",
      };
    }

    // Remove undefined values before saving to Firestore
    const cleanedData = removeUndefinedValues(updateData);
    console.log("Cleaned data:", cleanedData);

    // Check if cleaned data is empty
    if (Object.keys(cleanedData).length === 0) {
      return {
        success: false,
        error: "No valid data to update after cleaning",
      };
    }

    // Validate data types for common fields
    for (const [key, value] of Object.entries(cleanedData)) {
      if (value !== null && value !== undefined) {
        // Ensure arrays are actually arrays
        if (key.endsWith('F') || key.endsWith('P') || key === 'images') {
          if (value !== null && !Array.isArray(value) && typeof value !== 'string') {
            console.warn(`Field ${key} should be array or string, got:`, typeof value, value);
          }
        }
      }
    }

    // Update the inspection record in the machinetr collection
    const docRef = firestore.collection("machinetr").doc(docId);
    await docRef.update(cleanedData);

    console.log("Machine inspection record updated with ID:", docId);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating machine inspection record:", error);
    console.error("Error details:", {
      docId,
      updateDataKeys: updateData ? Object.keys(updateData) : 'null/undefined',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return {
      success: false,
      error: `Failed to update machine inspection record: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Helper function to extract storage path from Firebase Storage URL
function extractStoragePathFromUrl(url: string): string | null {
  try {
    // Handle full Firebase Storage URLs
    if (url.includes('firebasestorage.googleapis.com')) {
      // Extract path between '/o/' and '?alt=media' or '?alt=...'
      const match = url.match(/\/o\/([^?]+)/);
      if (match) {
        // Decode the URL-encoded path
        return decodeURIComponent(match[1]);
      }
    }

    // If it's already a storage path (not a full URL), return as-is
    if (!url.startsWith('http')) {
      return url;
    }

    console.warn(`Could not extract storage path from URL: ${url}`);
    return null;
  } catch (error) {
    console.error(`Error extracting storage path from URL: ${url}`, error);
    return null;
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

    // Collect all image URLs from the record
    const allImageUrls: string[] = [];

    // Add general images
    if (recordData.images && recordData.images.length > 0) {
      allImageUrls.push(...recordData.images);
    }

    // Find and add question-specific images (fields ending with 'P' or 'F')
    Object.keys(recordData).forEach(key => {
      if ((key.endsWith('P') || key.endsWith('F')) && recordData[key]) {
        const value = recordData[key];
        if (Array.isArray(value)) {
          // Handle array of images (new format)
          allImageUrls.push(...value);
        } else if (typeof value === 'string') {
          // Handle single image (backward compatibility)
          allImageUrls.push(value);
        }
      }
    });

    // Delete all collected images from Firebase Storage
    if (allImageUrls.length > 0) {
      try {
        const bucket = admin.storage().bucket("sccc-inseesafety-prod.firebasestorage.app");

        // Delete all images in parallel
        const deletePromises = allImageUrls.map(async (imageUrl: string) => {
          try {
            // Extract storage path from the URL
            const storagePath = extractStoragePathFromUrl(imageUrl);
            if (!storagePath) {
              console.warn(`Skipping deletion - could not extract storage path from: ${imageUrl}`);
              return;
            }

            const file = bucket.file(storagePath);
            await file.delete();
            console.log(`Successfully deleted image: ${storagePath}`);
          } catch (imageError) {
            console.error(`Failed to delete image ${imageUrl}:`, imageError);
            // Don't throw here - we want to continue deleting other images
          }
        });

        await Promise.allSettled(deletePromises);
        console.log(`Attempted to delete ${allImageUrls.length} total images from Storage (including question-specific images)`);

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

// Helper function to check if inspection has defects
function hasDefects(record: any): boolean {
  return Object.keys(record).some(key => {
    const value = record[key];
    return typeof value === 'string' && (
      value.toLowerCase() === 'fail' ||
      value.toLowerCase() === 'failed' ||
      value.toLowerCase() === 'ng' ||
      value.toLowerCase() === 'no'
    );
  });
}

export interface MachineWithInspection extends Omit<Machine, 'lastInspection'> {
  lastInspection?: MachineInspectionRecord;
  hasDefects?: boolean;
  inspectionDate?: string;
  daysSinceInspection?: number;
}

export async function getMachinesWithInspectionsAction(
  bu: string,
  site: string,
  type: string
): Promise<{ success: boolean; machines?: MachineWithInspection[]; error?: string }> {
  try {
    console.log("=== getMachinesWithInspectionsAction ===");
    console.log("Input parameters:", { bu, site, type });
    console.log("Query will search for:", { 
      bu, 
      site, 
      type: type.toLowerCase(),
      collection: "machine"
    });

    // Get machines
    const machineQuery = firestore
      .collection("machine")
      .where("bu", "==", bu)
      .where("site", "==", site)
      .where("type", "==", type.toLowerCase());

    const machineSnapshot = await machineQuery.get();
    
    console.log("Machine query results:", {
      empty: machineSnapshot.empty,
      size: machineSnapshot.size,
      docs: machineSnapshot.docs.length
    });
    
    if (!machineSnapshot.empty) {
      console.log("Sample machine data:", machineSnapshot.docs.slice(0, 2).map(doc => ({
        id: doc.data().id,
        site: doc.data().site,
        type: doc.data().type,
        bu: doc.data().bu
      })));
    }
    
    if (machineSnapshot.empty) {
      console.log("=== No machines found - checking alternate queries ===");
      
      // Debug: Check for machines with this bu/type (any site)
      const debugQuery1 = firestore
        .collection("machine")
        .where("bu", "==", bu)
        .where("type", "==", type.toLowerCase());
      const debugSnapshot1 = await debugQuery1.get();
      console.log(`Machines with bu=${bu}, type=${type.toLowerCase()} (any site):`, debugSnapshot1.size);
      
      // Debug: Check for machines with this bu/site (any type)
      const debugQuery2 = firestore
        .collection("machine")
        .where("bu", "==", bu)
        .where("site", "==", site);
      const debugSnapshot2 = await debugQuery2.get();
      console.log(`Machines with bu=${bu}, site=${site} (any type):`, debugSnapshot2.size);
      
      if (!debugSnapshot2.empty) {
        const siteTypes = debugSnapshot2.docs.map(doc => doc.data().type);
        console.log(`Available types for bu=${bu}, site=${site}:`, [...new Set(siteTypes)]);
      }
      
      return { success: true, machines: [] };
    }

    // Get all inspection records for this bu, site, and type
    const inspectionQuery = firestore
      .collection("machinetr")
      .where("bu", "==", bu)
      .where("type", "==", type.toLowerCase());

    const inspectionSnapshot = await inspectionQuery.get();

    // Group inspections by machine ID and get the latest for each
    const latestInspections: Record<string, MachineInspectionRecord> = {};
    
    inspectionSnapshot.docs.forEach(doc => {
      const recordData = doc.data();
      
      // Serialize the inspection record data
      const serializedRecord = serializeFirestoreData(recordData);
      const record = { ...serializedRecord, docId: doc.id } as MachineInspectionRecord;
      
      // Join with machine data to get site information
      const correspondingMachine = machineSnapshot.docs.find(mDoc => 
        mDoc.data().id === record.id && mDoc.data().site === site
      );
      
      if (correspondingMachine) {
        const machineKey = record.id;
        const existingRecord = latestInspections[machineKey];
        
        if (!existingRecord) {
          latestInspections[machineKey] = record;
        } else {
          // Compare timestamps (now as ISO strings)
          const recordTime = record.timestamp ? new Date(record.timestamp).getTime() : 0;
          const existingTime = existingRecord.timestamp ? new Date(existingRecord.timestamp).getTime() : 0;
          
          if (recordTime > existingTime) {
            latestInspections[machineKey] = record;
          }
        }
      }
    });

    // Create machines with inspection data
    const machinesWithInspections: MachineWithInspection[] = machineSnapshot.docs.map(doc => {
      const machineData = doc.data();
      const inspection = latestInspections[machineData.id];
      
      let inspectionDate: string | undefined;
      let daysSinceInspection: number | undefined;
      
      if (inspection?.timestamp) {
        const date = inspection.timestamp.toDate ? inspection.timestamp.toDate() : new Date(inspection.timestamp);
        inspectionDate = date.toISOString();
        daysSinceInspection = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Serialize Firestore data
      const serializedData: any = {};
      Object.keys(machineData).forEach(key => {
        const value = machineData[key];
        if (value && typeof value === 'object' && value.toDate) {
          serializedData[key] = value.toDate().toISOString();
        } else {
          serializedData[key] = value;
        }
      });

      return {
        ...serializedData,
        docId: doc.id,
        lastInspection: inspection,
        hasDefects: inspection ? hasDefects(inspection) : false,
        inspectionDate,
        daysSinceInspection,
      } as MachineWithInspection;
    });

    // Sort: defects first, then by inspection date (newest first), then by machine ID
    machinesWithInspections.sort((a, b) => {
      // First priority: defects
      if (a.hasDefects && !b.hasDefects) return -1;
      if (!a.hasDefects && b.hasDefects) return 1;
      
      // Second priority: inspection date (newest first)
      if (a.inspectionDate && b.inspectionDate) {
        return new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime();
      }
      if (a.inspectionDate && !b.inspectionDate) return -1;
      if (!a.inspectionDate && b.inspectionDate) return 1;
      
      // Third priority: machine ID
      return (a.id || "").localeCompare(b.id || "");
    });

    // Ensure all data is properly serialized before returning
    const serializedMachines = machinesWithInspections.map(machine => serializeFirestoreData(machine));
    
    console.log("Returning machines with inspections:", serializedMachines.length);
    return { success: true, machines: serializedMachines };
    
  } catch (error) {
    console.error("Error fetching machines with inspections:", error);
    return {
      success: false,
      error: `Failed to fetch machines with inspections: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function getRecentInspectionsAction(
  bu: string,
  site: string,
  type: string,
  days: number = 15
): Promise<{ success: boolean; machines?: MachineWithInspection[]; error?: string }> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get all machines with inspections first
    const result = await getMachinesWithInspectionsAction(bu, site, type);
    
    if (!result.success || !result.machines) {
      return result;
    }

    // Filter to only machines inspected in the last X days
    const recentMachines = result.machines.filter(machine => {
      if (!machine.inspectionDate) return false;
      const inspectionDate = new Date(machine.inspectionDate);
      return inspectionDate >= cutoffDate;
    });

    // Ensure all data is properly serialized
    const serializedMachines = recentMachines.map(machine => serializeFirestoreData(machine));

    return { success: true, machines: serializedMachines };
    
  } catch (error) {
    console.error("Error fetching recent inspections:", error);
    return {
      success: false,
      error: `Failed to fetch recent inspections: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function getInspectionLocationsAction(
  bu: string,
  site: string,
  type: string
): Promise<{ success: boolean; locations?: Array<{
  id: string;
  latitude: number;
  longitude: number;
  hasDefects: boolean;
  inspectionDate: string;
  inspector: string;
}>; error?: string }> {
  try {
    const result = await getMachinesWithInspectionsAction(bu, site, type);
    
    if (!result.success || !result.machines) {
      return { success: false, error: result.error };
    }

    // Extract location data from machines with valid coordinates
    const locations = result.machines
      .filter(machine => 
        machine.lastInspection?.latitude != null && 
        machine.lastInspection?.longitude != null &&
        machine.inspectionDate
      )
      .map(machine => ({
        id: machine.id,
        latitude: machine.lastInspection!.latitude!,
        longitude: machine.lastInspection!.longitude!,
        hasDefects: machine.hasDefects || false,
        inspectionDate: machine.inspectionDate!,
        inspector: machine.lastInspection!.inspector || 'Unknown',
      }));

    // Ensure locations data is serialized
    const serializedLocations = serializeFirestoreData(locations);

    return { success: true, locations: serializedLocations };
    
  } catch (error) {
    console.error("Error fetching inspection locations:", error);
    return {
      success: false,
      error: `Failed to fetch inspection locations: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

export async function getMachineByIdAction(
  bu: string,
  type: string,
  id: string
): Promise<{ success: boolean; machine?: Machine; error?: string }> {
  try {
    // Decode URL parameters to handle special characters (including Thai characters)
    const decodedId = decodeURIComponent(id);
    
    // Query the machine collection with matching bu, type, and id
    const machineQuery = firestore
      .collection("machine")
      .where("bu", "==", bu)
      .where("type", "==", type.toLowerCase())
      .where("id", "==", decodedId);

    const machineSnapshot = await machineQuery.get();

    if (machineSnapshot.empty) {
      return {
        success: false,
        error: "Machine not found"
      };
    }

    // Get the first matching document
    const doc = machineSnapshot.docs[0];
    const machineData = doc.data();

    // Serialize the data for client-server boundary
    const serializedMachine = serializeFirestoreData({
      ...machineData,
      docId: doc.id,
    });

    return {
      success: true,
      machine: serializedMachine as Machine,
    };
  } catch (error) {
    console.error("Error fetching machine by ID:", error);
    return {
      success: false,
      error: `Failed to fetch machine: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function getMachineInspectionRecordsAction(
  bu: string,
  type: string,
  id: string
): Promise<{ success: boolean; records?: MachineInspectionRecord[]; error?: string }> {
  try {
    // Decode URL parameters to handle special characters (including Thai characters)
    const decodedId = decodeURIComponent(id);
    
    // Query the machinetr collection with matching bu, type (lowercase), and id
    const inspectionQuery = firestore
      .collection("machinetr")
      .where("bu", "==", bu)
      .where("type", "==", type.toLowerCase())
      .where("id", "==", decodedId);

    const inspectionSnapshot = await inspectionQuery.get();

    if (inspectionSnapshot.empty) {
      return {
        success: true,
        records: [],
      };
    }

    // Map all matching documents to MachineInspectionRecord objects
    const records: MachineInspectionRecord[] = inspectionSnapshot.docs.map((doc) => {
      const recordData = doc.data();
      const serializedRecord = serializeFirestoreData({
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
      });

      return serializedRecord as MachineInspectionRecord;
    });

    // Sort by timestamp in descending order (latest first)
    records.sort((a, b) => {
      if (!a.timestamp || !b.timestamp) return 0;

      const aDate = new Date(a.timestamp);
      const bDate = new Date(b.timestamp);

      return bDate.getTime() - aDate.getTime();
    });

    return {
      success: true,
      records,
    };
  } catch (error) {
    console.error("Error fetching machine inspection records:", error);
    return {
      success: false,
      error: `Failed to fetch inspection records: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}