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

export async function submitMethodForm(
  formData: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create the base method record with common fields
    const methodRecord = {
      id: formData.id, // Staff ID (user input)
      bu: formData.bu,
      type: formData.type,
      site: formData.site, // Site field fetched from employees collection
      images: formData.images || [],
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      remark: formData.remark, // Optional remarks field
      ...formData, // Include any additional form fields
    };

    // Remove undefined values before saving to Firestore
    const cleanedRecord = removeUndefinedValues(methodRecord);

    // Save to the methodtr collection
    const docRef = await firestore.collection("methodtr").add(cleanedRecord);

    console.log("Method record saved with ID:", docRef.id);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error saving method record:", error);
    return {
      success: false,
      error: `Failed to save method record: ${error instanceof Error ? error.message : "Unknown error"}`,
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

export async function deleteMethodRecord(
  recordId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First, fetch the method record to get the images array
    const docRef = firestore.collection("methodtr").doc(recordId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      return {
        success: false,
        error: "Method record not found",
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

    // Delete the method record from the methodtr collection
    await docRef.delete();

    console.log("Method record deleted with ID:", recordId);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting method record:", error);
    return {
      success: false,
      error: `Failed to delete method record: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
