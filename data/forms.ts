import { firestore } from "@/firebase/server";
import { Machine } from "@/types/machine";
import { MachineInspectionRecord } from "@/types/machineInspectionRecord";
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
): Promise<{ questions: Array<{ question: string; name: string; howto: string; accept: string }>; title?: string; image?: string } | null> => {
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
    
    // Return questions, title, and image from the form document
    return {
      questions,
      title: formData.title,
      image: formData.image
    };
  } catch (error) {
    console.error("Error fetching form with title:", error);
    return null;
  }
};
