"use server";

import { firestore } from "@/firebase/server";
import { FieldValue } from "firebase-admin/firestore";
import admin from "firebase-admin";

// Asset type definition based on the collection structure
export interface Asset {
  asset: number;
  sub: number;
  bu: string;
  type: string;
  site: string;
  description: string;
  assetClass: number;
  quantity: number;
  uom: string;
  usefulLife: number;
  depreciationKey: string;
  bookVal: number;
  location: string;
  accumDep: number;
  OrdDepStartDate: string;
  capitalizedOn: string;
  acquisVal: number;
  department: string;
  plant: string;
  plantName: string;
  costCenter: string;
  costCenterOwner: string;
  plantLocation: string;
  uploadedAt?: string;
}

// Asset transaction type definition based on assettr collection
export interface AssetTransaction {
  id?: string;
  asset: number;
  sub: number;
  bu: string;
  type: string;
  site: string;
  date: string;
  inspector: string;
  status: string;
  qty: string;
  place: string;
  images: string[]; // Array of image URLs
  latitude: number;
  longitude: number;
  remark: string;
  qtyR?: string;
  transferTo?: string;
  uploadedAt?: string;
  url?: string; // Legacy field - deprecated, use images array instead
}

// Utility function to convert Firebase Timestamp to ISO string
const convertTimestamp = (timestamp: any): string | undefined => {
  if (!timestamp) return undefined;

  // If it has toDate method (actual Firebase Timestamp)
  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    return timestamp.toDate().toISOString();
  }

  // If it's a serialized timestamp with _seconds
  if (timestamp._seconds !== undefined) {
    const date = new Date(
      timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000
    );
    return date.toISOString();
  }

  // If it's already a string, return as-is
  if (typeof timestamp === "string") {
    return timestamp;
  }

  return undefined;
};

// Extract storage path from Firebase Storage URL
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

    // Handle relative paths (already in storage path format)
    if (!url.startsWith("http")) {
      return url;
    }

    return null;
  } catch (error) {
    console.error(`Error extracting storage path from URL: ${url}`, error);
    return null;
  }
}

// Get asset by bu, type, site, asset number and sub number
export async function getAssetByAssetSubAction(
  bu: string,
  type: string,
  site: string,
  asset: string,
  sub: string
): Promise<{
  success: boolean;
  asset?: Asset;
  error?: string;
}> {
  try {
    const assetNumber = parseInt(asset);
    const subNumber = parseInt(sub);

    if (isNaN(assetNumber)) {
      return {
        success: false,
        error: "Invalid asset number",
      };
    }

    // Query the asset collection with all criteria
    const assetQuery = firestore
      .collection("asset")
      .where("bu", "==", bu)
      .where("type", "==", type.toLowerCase())
      .where("site", "==", site.toLowerCase())
      .where("asset", "==", assetNumber)
      .where("sub", "==", subNumber)
      .limit(1);

    const snapshot = await assetQuery.get();

    if (snapshot.empty) {
      return {
        success: false,
        error: "Asset not found",
      };
    }

    const doc = snapshot.docs[0];
    const rawData = doc.data();

    // Convert Firebase Timestamp to serializable format
    const assetData: Asset = {
      ...rawData,
      uploadedAt: convertTimestamp(rawData.uploadedAt),
    } as Asset;

    return {
      success: true,
      asset: assetData,
    };
  } catch (error) {
    console.error("Error fetching asset:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch asset",
    };
  }
}

// Legacy function - kept for backward compatibility
// Get asset by asset number and sub number (without bu, type, site filtering)
export async function getMachineByIdAction(
  bu: string,
  type: string,
  id: string
): Promise<{
  success: boolean;
  machine?: Asset;
  error?: string;
}> {
  try {
    // Parse asset and sub from the id (format: "asset-sub" or just "asset")
    const [assetStr, subStr] = id.split("-");
    const asset = parseInt(assetStr);
    const sub = subStr ? parseInt(subStr) : 0;

    if (isNaN(asset)) {
      return {
        success: false,
        error: "Invalid asset number",
      };
    }

    // Query the asset collection with bu, type filters
    const assetQuery = firestore
      .collection("asset")
      .where("bu", "==", bu)
      .where("type", "==", type.toLowerCase())
      .where("asset", "==", asset)
      .where("sub", "==", sub)
      .limit(1);

    const snapshot = await assetQuery.get();

    if (snapshot.empty) {
      return {
        success: false,
        error: "Asset not found",
      };
    }

    const doc = snapshot.docs[0];
    const rawData = doc.data();

    // Convert Firebase Timestamp to serializable format
    const assetData: Asset = {
      ...rawData,
      uploadedAt: convertTimestamp(rawData.uploadedAt),
    } as Asset;

    return {
      success: true,
      machine: assetData,
    };
  } catch (error) {
    console.error("Error fetching asset:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch asset",
    };
  }
}

// Submit asset tracking form
export async function submitMachineForm(formData: any): Promise<{
  success: boolean;
  error?: string;
  docId?: string;
}> {
  try {
    // Parse asset and sub from the id
    const [assetStr, subStr] = formData.id.split("-");
    const asset = parseInt(assetStr);
    const sub = subStr ? parseInt(subStr) : 0;

    if (isNaN(asset)) {
      return {
        success: false,
        error: "Invalid asset number",
      };
    }

    // Format the date in "DD-MM-YY HH:mm" format
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const formattedDate = `${day}-${month}-${year} ${hours}:${minutes}`;

    // Prepare the transaction data with Firebase Timestamp
    const transactionData: any = {
      asset: asset,
      sub: sub,
      bu: formData.bu || "",
      type: formData.type || "",
      site: formData.site || "",
      date: formattedDate,
      inspector: formData.inspector || "",
      status: formData.status || "",
      qty: formData.qtyR || formData.qty || 1, // Store as string
      place: formData.place || "",
      images: formData.images || [], // Store as array of URLs
      latitude: formData.latitude || 0,
      longitude: formData.longitude || 0,
      remark: formData.remark || "",
      qtyR: formData.qtyR || "",
      transferTo: formData.transferTo || "",
      uploadedAt: FieldValue.serverTimestamp(), // Use Firebase server timestamp
    };

    // Add the transaction to assettr collection
    const docRef = await firestore.collection("assettr").add(transactionData);

    return {
      success: true,
      docId: docRef.id,
    };
  } catch (error) {
    console.error("Error submitting asset form:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to submit asset form",
    };
  }
}

// Get asset transaction history
export async function getAssetTransactions(
  bu: string,
  type: string,
  asset: number,
  sub: number
): Promise<{
  success: boolean;
  transactions?: AssetTransaction[];
  error?: string;
}> {
  try {
    const transactionsQuery = firestore
      .collection("assettr")
      .where("bu", "==", bu)
      .where("type", "==", type.toLowerCase())
      .where("asset", "==", asset)
      .where("sub", "==", sub)
      .orderBy("uploadedAt", "desc");

    const snapshot = await transactionsQuery.get();

    const transactions: AssetTransaction[] = snapshot.docs.map((doc) => {
      const rawData = doc.data();

      // Convert Firebase Timestamp to serializable format
      return {
        ...rawData,
        id: doc.id,
        uploadedAt: convertTimestamp(rawData.uploadedAt),
      } as AssetTransaction;
    });

    return {
      success: true,
      transactions,
    };
  } catch (error) {
    console.error("Error fetching asset transactions:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch asset transactions",
    };
  }
}

// Get all assets with optional filters
export async function getAssets(filters?: {
  plant?: string;
  department?: string;
  assetClass?: number;
}): Promise<{
  success: boolean;
  assets?: Asset[];
  error?: string;
}> {
  try {
    let assetsQuery: any = firestore.collection("asset");

    // Apply filters if provided
    if (filters?.plant) {
      assetsQuery = assetsQuery.where("plant", "==", filters.plant);
    }
    if (filters?.department) {
      assetsQuery = assetsQuery.where("department", "==", filters.department);
    }
    if (filters?.assetClass) {
      assetsQuery = assetsQuery.where("assetClass", "==", filters.assetClass);
    }

    const snapshot = await assetsQuery.get();

    const assets: Asset[] = snapshot.docs.map((doc: any) => ({
      ...(doc.data() as Asset),
      id: doc.id,
    }));

    return {
      success: true,
      assets,
    };
  } catch (error) {
    console.error("Error fetching assets:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch assets",
    };
  }
}

// Get assets by plant with latest transaction data
export async function getAssetsByPlant(
  bu: string,
  type: string,
  plant: string
): Promise<{
  success: boolean;
  assets?: (Asset & { latestTransaction?: AssetTransaction })[];
  error?: string;
}> {
  try {
    console.log(`Querying assets: bu=${bu}, type="tracking", plant=${plant}`);

    // Query assets by bu, type, and site (using site field instead of plant)
    const assetsQuery = firestore
      .collection("asset")
      .where("bu", "==", bu)
      .where("type", "==", "tracking")
      .where("plant", "==", plant);

    const assetsSnapshot = await assetsQuery.get();

    console.log(`Found ${assetsSnapshot.size} assets`);

    if (assetsSnapshot.empty) {
      return {
        success: true,
        assets: [],
      };
    }

    // Fetch latest transaction for each asset
    const assetsWithTransactions = await Promise.all(
      assetsSnapshot.docs.map(async (doc) => {
        const assetData = doc.data() as Asset;

        try {
          // Get all transactions for this asset (without orderBy to avoid index requirement)
          const transactionsQuery = firestore
            .collection("assettr")
            .where("bu", "==", bu)
            .where("type", "==", "tracking")
            .where("asset", "==", assetData.asset)
            .where("sub", "==", assetData.sub);

          const transactionsSnapshot = await transactionsQuery.get();

          let latestTransaction: AssetTransaction | undefined = undefined;
          if (!transactionsSnapshot.empty) {
            // Sort in memory to avoid needing a composite index
            const transactions = transactionsSnapshot.docs
              .map((txDoc) => {
                const txData = txDoc.data();
                return {
                  ...txData,
                  id: txDoc.id,
                  uploadedAt: convertTimestamp(txData.uploadedAt),
                  _timestamp: txData.uploadedAt,
                } as AssetTransaction & { _timestamp: any };
              })
              .sort((a, b) => {
                // Sort by timestamp descending
                const aTime = a._timestamp?.toDate?.()?.getTime() || 0;
                const bTime = b._timestamp?.toDate?.()?.getTime() || 0;
                return bTime - aTime;
              });

            // Get the latest one
            if (transactions.length > 0) {
              const { _timestamp, ...txWithoutTimestamp } = transactions[0];
              latestTransaction = txWithoutTimestamp as AssetTransaction;
            }
          }

          return {
            ...assetData,
            uploadedAt: convertTimestamp(assetData.uploadedAt),
            latestTransaction,
          };
        } catch (txError) {
          console.error(
            `Error fetching transactions for asset ${assetData.asset}-${assetData.sub}:`,
            txError
          );
          // Return asset without transaction data if there's an error
          return {
            ...assetData,
            uploadedAt: convertTimestamp(assetData.uploadedAt),
            latestTransaction: undefined,
          };
        }
      })
    );

    return {
      success: true,
      assets: assetsWithTransactions,
    };
  } catch (error) {
    console.error("Error fetching assets by plant:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch assets by plant",
    };
  }
}

// Delete asset transaction record
export async function deleteAssetTransaction(recordId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Get the record first
    const docRef = firestore.collection("assettr").doc(recordId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return {
        success: false,
        error: "Record not found",
      };
    }

    const data = doc.data();

    // Delete all images from Firebase Storage
    const images = data?.images || [];
    if (images.length > 0) {
      try {
        const bucket = admin
          .storage()
          .bucket("sccc-inseesafety-prod.firebasestorage.app");

        // Delete all images in parallel
        const deletePromises = images.map(async (imageUrl: string) => {
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
        console.log(`Attempted to delete ${images.length} images from Storage`);
      } catch (storageError) {
        console.error("Error during image deletion:", storageError);
        // Continue with document deletion even if image deletion fails
      }
    }

    // Delete the record from Firestore
    await docRef.delete();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting asset transaction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete asset transaction",
    };
  }
}
