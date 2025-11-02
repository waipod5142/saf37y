"use server";

import { firestore } from "@/firebase/server";
import { FieldValue } from "firebase-admin/firestore";

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
  qty: number | string;
  place: string;
  url: string;
  lat: number;
  lng: number;
  remark: string;
  qtyR?: string;
  transferTo?: string;
  uploadedAt?: string;
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
      qty: formData.qtyR || formData.qty || 1, // Use qtyR if provided, otherwise use qty
      place: formData.place || "",
      url:
        formData.images && formData.images.length > 0 ? formData.images[0] : "",
      lat: formData.latitude || 0,
      lng: formData.longitude || 0,
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
