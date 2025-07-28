import { firestore } from "@/firebase/server";
import { Machine } from "@/types/machine";
import { MachineInspectionRecord } from "@/types/machineInspectionRecord";
import { getMachineEmoji } from "@/lib/machine-types";
import "server-only";

export const getFormQuestions = async (
  bu: string,
  type: string
): Promise<Array<{ question: string; name: string; howto: string; accept: string }> | null> => {
  try {
    // Query the forms collection with matching bu and type
    const formsQuery = firestore
      .collection("forms")
      .where("bu", "==", bu)
      .where("type", "==", type.toLowerCase());

    const formsSnapshot = await formsQuery.get();

    if (formsSnapshot.empty) {
      return null;
    }

    // Get the first matching document
    const doc = formsSnapshot.docs[0];
    const formData = doc.data();

    // Parse questions if it's stored as a JSON string
    let questions = formData.questions || [];
    if (typeof questions === 'string') {
      try {
        questions = JSON.parse(questions);
      } catch (error) {
        console.error('Error parsing questions JSON:', error);
        questions = [];
      }
    }
    
    // Return the questions array from the form document
    return questions;
  } catch (error) {
    console.error("Error fetching form questions:", error);
    return null;
  }
};

export const getFormWithTitle = async (
  bu: string,
  type: string
): Promise<{ questions: Array<{ question: string; name: string; howto: string; accept: string }>; title?: string; image?: string; inspection?: string; emoji?: string } | null> => {
  try {
    // Query the forms collection with matching bu and type
    const formsQuery = firestore
      .collection("forms")
      .where("bu", "==", bu)
      .where("type", "==", type.toLowerCase());

    const formsSnapshot = await formsQuery.get();

    if (formsSnapshot.empty) {
      return null;
    }

    // Get the first matching document
    const doc = formsSnapshot.docs[0];
    const formData = doc.data();

    // Parse questions if it's stored as a JSON string
    let questions = formData.questions || [];
    if (typeof questions === 'string') {
      try {
        questions = JSON.parse(questions);
      } catch (error) {
        console.error('Error parsing questions JSON:', error);
        questions = [];
      }
    }
    
    // Get emoji for the machine type
    const emoji = getMachineEmoji(type);
    
    // Return questions, title, image, inspection period, and emoji from the form document
    return {
      questions,
      title: formData.title,
      image: formData.image,
      inspection: formData.inspection,
      emoji: emoji || undefined
    };
  } catch (error) {
    console.error("Error fetching form with title:", error);
    return null;
  }
};

export type InspectionPeriod = "daily" | "monthly" | "quarterly" | "annual";

export const getFormInspectionPeriods = async (
  bu?: string
): Promise<Record<string, InspectionPeriod>> => {
  try {
    // Query all forms, optionally filtered by business unit
    const formsQuery = bu 
      ? firestore.collection("forms").where("bu", "==", bu)
      : firestore.collection("forms");

    const formsSnapshot = await formsQuery.get();

    if (formsSnapshot.empty) {
      return {};
    }

    // Build mapping of machine type to inspection period
    const inspectionMapping: Record<string, InspectionPeriod> = {};
    
    formsSnapshot.docs.forEach(doc => {
      const formData = doc.data();
      const type = formData.type;
      const inspection = formData.inspection;
      
      if (type && inspection && (inspection === "daily" || inspection === "monthly" || inspection === "quarterly" || inspection === "annual")) {
        inspectionMapping[type] = inspection as InspectionPeriod;
      }
    });

    return inspectionMapping;
  } catch (error) {
    console.error("Error fetching form inspection periods:", error);
    return {};
  }
};

export const getFormInspectionPeriodForType = async (
  bu: string,
  type: string
): Promise<InspectionPeriod | null> => {
  try {
    // Query the forms collection with matching bu and type
    const formsQuery = firestore
      .collection("forms")
      .where("bu", "==", bu)
      .where("type", "==", type.toLowerCase());

    const formsSnapshot = await formsQuery.get();

    if (formsSnapshot.empty) {
      return null;
    }

    // Get the first matching document
    const doc = formsSnapshot.docs[0];
    const formData = doc.data();
    const inspection = formData.inspection;
    
    if (inspection && (inspection === "daily" || inspection === "monthly" || inspection === "quarterly" || inspection === "annual")) {
      return inspection as InspectionPeriod;
    }

    return null;
  } catch (error) {
    console.error("Error fetching form inspection period:", error);
    return null;
  }
};
