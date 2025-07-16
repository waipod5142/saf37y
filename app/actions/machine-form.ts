"use server";

import { firestore } from "@/firebase/server";
import { revalidatePath } from "next/cache";

export interface MachineFormData {
  inspector: string;
  bu: string;
  type: string;
  id: string;
  mileage?: string;
  tag?: string;
  certificate?: string;
  remark?: string;
  images?: string[];
  [key: string]: any;
}

export async function submitMachineForm(formData: MachineFormData) {
  try {
    // Add the document to Firestore using server-side admin SDK
    const docRef = await firestore.collection("machinetr").add({
      ...formData,
      timestamp: new Date(),
      createdAt: new Date(),
    });

    console.log("Machine form submitted successfully:", docRef.id);
    
    // Revalidate the specific machine page to refresh the data
    revalidatePath(`/Machine/${formData.bu}/${formData.type}/${formData.id}`);
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error submitting machine form:", error);
    return { success: false, error: "Failed to submit form" };
  }
}