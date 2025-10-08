"use server";

import { firestore } from "@/firebase/server";
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
  if (obj && typeof obj === "object" && obj.toDate) {
    return obj.toDate().toISOString();
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => serializeFirestoreData(item));
  }

  // Handle plain objects
  if (obj && typeof obj === "object" && obj.constructor === Object) {
    const serialized: any = {};
    Object.keys(obj).forEach((key) => {
      serialized[key] = serializeFirestoreData(obj[key]);
    });
    return serialized;
  }

  // Return primitive values as-is
  return obj;
}

export async function getEmployeeByIdAction(
  bu: string,
  id: string
): Promise<{
  success: boolean;
  employee?: { site?: string; [key: string]: any };
  error?: string;
}> {
  try {
    const decodedId = decodeURIComponent(id);
    const buUpperCase = bu.toUpperCase(); // Convert to uppercase to match Firestore data

    const employeeQuery = firestore
      .collection("employees")
      .where("bu", "==", buUpperCase)
      .where("empId", "==", decodedId);

    const employeeSnapshot = await employeeQuery.get();

    if (employeeSnapshot.empty) {
      // Try with original case if uppercase didn't work
      const employeeQueryOriginal = firestore
        .collection("employees")
        .where("bu", "==", bu)
        .where("empId", "==", decodedId);

      const employeeSnapshotOriginal = await employeeQueryOriginal.get();

      if (employeeSnapshotOriginal.empty) {
        return { success: false, error: "Employee not found" };
      }

      const doc = employeeSnapshotOriginal.docs[0];
      const employeeData = doc.data();

      return {
        success: true,
        employee: serializeFirestoreData({ ...employeeData, docId: doc.id }),
      };
    }

    const doc = employeeSnapshot.docs[0];
    const employeeData = doc.data();

    return {
      success: true,
      employee: serializeFirestoreData({ ...employeeData, docId: doc.id }),
    };
  } catch (error) {
    console.error("Error fetching employee data:", error);
    return { success: false, error: "Failed to fetch employee data" };
  }
}

export async function submitManForm(
  formData: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create the base man record with common fields
    const baseRecord = {
      id: formData.id, // Staff ID (user input)
      alertNo: formData.alertNo, // Alert number (from URL parameter)
      trainingCourse: formData.trainingCourse, // Training course name (from URL parameter)
      bu: formData.bu,
      type: formData.type,
      site: formData.site, // Site field fetched from employees collection
      images: formData.images || [],
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      remark: formData.remark, // Optional remarks field (common to all forms)
    };

    // Handle different form types
    let manRecord;

    if (formData.type === "sot" || formData.type === "vfl") {
      // SOT/VFL-specific fields
      manRecord = {
        ...baseRecord,
        report: formData.report, // 'sot' or 'vfl'
        area: formData.area,
        talkwith: formData.talkwith,
        topics: formData.topics || [],
        safe: formData.safe,
        care: formData.care,
        riskLevel: formData.riskLevel,
        actionComment: formData.actionComment,
      };
    } else if (formData.type === "alert") {
      // Alert-specific fields
      manRecord = {
        ...baseRecord,
        typeAccident: formData.typeAccident, // Selected accident type
        learn: formData.learn, // Lesson learned
        acknowledge: formData.acknowledge, // Understanding acknowledgement (yes/no)
      };
    } else if (formData.type === "trainingform") {
      // Training-specific fields
      manRecord = {
        ...baseRecord,
        courseId: formData.courseId,
        trainingDate: formData.trainingDate,
        expirationDate: formData.expirationDate,
      };
    } else {
      // Default case - include all form data
      manRecord = {
        ...baseRecord,
        ...formData, // Include any additional form fields
      };
    }

    // Remove undefined values before saving to Firestore
    const cleanedRecord = removeUndefinedValues(manRecord);

    // Save to the mantr collection
    const docRef = await firestore.collection("mantr").add(cleanedRecord);

    console.log("Man record saved with ID:", docRef.id);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error saving man record:", error);
    return {
      success: false,
      error: `Failed to save man record: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function submitTrainingForm(
  formData: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create the training record with specific fields
    const trainingRecord = {
      empId: formData.empId, // Staff ID (user input)
      trainingCourse: formData.trainingCourse, // Training course name (from URL parameter)
      bu: formData.bu,
      type: formData.type,
      courseId: formData.courseId,
      trainingDate: formData.trainingDate,
      expirationDate: formData.expirationDate,
      remark: formData.remark || "",
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    };

    // Remove undefined values before saving to Firestore
    const cleanedRecord = removeUndefinedValues(trainingRecord);

    // Save to the trainings collection
    const docRef = await firestore.collection("trainings").add(cleanedRecord);

    console.log("Training record saved with ID:", docRef.id);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error saving training record:", error);
    return {
      success: false,
      error: `Failed to save training record: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// Helper function to extract storage path from Firebase Storage URL
function extractStoragePathFromUrl(url: string): string | null {
  try {
    // Handle full Firebase Storage URLs
    if (url.includes("firebasestorage.googleapis.com")) {
      // Extract path between '/o/' and '?alt=media' or '?alt=...'
      const match = url.match(/\/o\/([^?]+)/);
      if (match) {
        // Decode the URL-encoded path
        return decodeURIComponent(match[1]);
      }
    }

    // If it's already a storage path (not a full URL), return as-is
    if (!url.startsWith("http")) {
      return url;
    }

    console.warn(`Could not extract storage path from URL: ${url}`);
    return null;
  } catch (error) {
    console.error(`Error extracting storage path from URL: ${url}`, error);
    return null;
  }
}

export async function deleteManRecord(
  recordId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First, fetch the man record to get the images array
    const docRef = firestore.collection("mantr").doc(recordId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      return {
        success: false,
        error: "Man record not found",
      };
    }

    const recordData = docSnapshot.data();

    // Collect all image URLs from the record
    const allImageUrls: string[] = [];

    // Add images from the images array
    if (recordData?.images && recordData.images.length > 0) {
      allImageUrls.push(...recordData.images);
    }

    // Delete all collected images from Firebase Storage
    if (allImageUrls.length > 0) {
      try {
        const bucket = admin
          .storage()
          .bucket("sccc-inseesafety-prod.firebasestorage.app");

        // Delete all images in parallel
        const deletePromises = allImageUrls.map(async (imageUrl: string) => {
          try {
            // Extract storage path from the URL
            const storagePath = extractStoragePathFromUrl(imageUrl);
            if (!storagePath) {
              console.warn(
                `Skipping deletion - could not extract storage path from: ${imageUrl}`
              );
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
        console.log(
          `Attempted to delete ${allImageUrls.length} total images from Storage`
        );
      } catch (storageError) {
        console.error("Error during image deletion:", storageError);
        // Continue with document deletion even if image deletion fails
      }
    }

    // Delete the man record from the mantr collection
    await docRef.delete();

    console.log("Man record deleted with ID:", recordId);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting man record:", error);
    return {
      success: false,
      error: `Failed to delete man record: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function deleteTrainingRecord(
  recordId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First, fetch the training record to get the files array
    const docRef = firestore.collection("trainings").doc(recordId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      return {
        success: false,
        error: "Training record not found",
      };
    }

    const recordData = docSnapshot.data();

    // Collect all file URLs from the record
    const allFileUrls: string[] = [];

    // Add files from the files array
    if (recordData?.files && recordData.files.length > 0) {
      allFileUrls.push(...recordData.files);
    }

    // Delete all collected files from Firebase Storage
    if (allFileUrls.length > 0) {
      try {
        const bucket = admin
          .storage()
          .bucket("sccc-inseesafety-prod.firebasestorage.app");

        // Delete all files in parallel
        const deletePromises = allFileUrls.map(async (fileUrl: string) => {
          try {
            // Extract storage path from the URL
            const storagePath = extractStoragePathFromUrl(fileUrl);
            if (!storagePath) {
              console.warn(
                `Skipping deletion - could not extract storage path from: ${fileUrl}`
              );
              return;
            }

            const file = bucket.file(storagePath);
            await file.delete();
            console.log(`Successfully deleted file: ${storagePath}`);
          } catch (fileError) {
            console.error(`Failed to delete file ${fileUrl}:`, fileError);
            // Don't throw here - we want to continue deleting other files
          }
        });

        await Promise.allSettled(deletePromises);
        console.log(
          `Attempted to delete ${allFileUrls.length} total files from Storage`
        );
      } catch (storageError) {
        console.error("Error during file deletion:", storageError);
        // Continue with document deletion even if file deletion fails
      }
    }

    // Delete the training record from the trainings collection
    await docRef.delete();

    console.log("Training record deleted with ID:", recordId);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting training record:", error);
    return {
      success: false,
      error: `Failed to delete training record: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export interface ManRecord {
  docId: string;
  id: string;
  bu: string;
  type: string;
  site?: string;
  timestamp: string;
  createdAt: string;
  remark?: string;
  images?: string[];
  [key: string]: any; // Allow other fields from different form types
}

export async function getManWithRecordsAction(
  bu: string,
  site: string,
  type: string,
  frequency: string
): Promise<{ success: boolean; records?: ManRecord[]; error?: string }> {
  try {
    console.log("=== getManWithRecordsAction ===");
    console.log("Input parameters:", { bu, site, type, frequency });

    // Calculate date range based on frequency
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const day = now.getDay();

    let startDate: Date;

    switch (frequency) {
      case "daily":
        // Daily: from midnight today to now (local time)
        startDate = new Date(year, month, date, 0, 0, 0, 0);
        break;
      case "weekly":
        // Weekly: from Monday to Sunday (current week)
        const daysFromMonday = day === 0 ? 6 : day - 1;
        startDate = new Date(year, month, date - daysFromMonday, 0, 0, 0, 0);
        break;
      case "monthly":
        // Monthly: from 1st day of current month
        startDate = new Date(year, month, 1, 0, 0, 0, 0);
        break;
      case "annual":
        // Annual: from 1st of January of current year
        startDate = new Date(year, 0, 1, 0, 0, 0, 0);
        break;
      default:
        startDate = new Date(year, month, date, 0, 0, 0, 0);
    }

    const endDate = now;

    console.log("Date range:", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    // Build query
    let query = firestore
      .collection("mantr")
      .where("bu", "==", bu)
      .where("timestamp", ">=", startDate)
      .where("timestamp", "<=", endDate);

    // Add optional filters
    if (site && site !== "all") {
      query = query.where("site", "==", site);
    }

    if (type && type !== "all") {
      query = query.where("type", "==", type);
    }

    // Execute query
    const snapshot = await query.get();

    console.log("Query results:", {
      empty: snapshot.empty,
      size: snapshot.size,
      docs: snapshot.docs.length,
    });

    if (snapshot.empty) {
      console.log("=== No records found ===");
      return {
        success: true,
        records: [],
      };
    }

    // Convert to plain objects
    const records: ManRecord[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return serializeFirestoreData({
        docId: doc.id,
        ...data,
      }) as ManRecord;
    });

    // Sort by timestamp descending (most recent first)
    records.sort((a, b) => {
      const dateA = new Date(a.timestamp || a.createdAt);
      const dateB = new Date(b.timestamp || b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    console.log(`Found ${records.length} man records`);

    return {
      success: true,
      records,
    };
  } catch (error) {
    console.error("Error fetching man records:", error);
    return {
      success: false,
      error: `Failed to fetch man records: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
