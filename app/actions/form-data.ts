"use server";

import { getFormQuestions } from "@/data/forms";
import { MachineItem } from "@/lib/machine-types";

export async function getMachineQuestions(
  bu: string,
  type: string,
  id: string
): Promise<{ success: boolean; questions?: MachineItem[]; error?: string }> {
  try {
    const questions = await getFormQuestions(bu, type);
    
    if (!questions) {
      return {
        success: false,
        error: "Form not found"
      };
    }

    if (questions.length === 0) {
      return {
        success: true,
        questions: []
      };
    }

    // Convert form questions to MachineItem format
    const formattedQuestions: MachineItem[] = questions.map((q, index) => ({
      id: String(index + 1),
      name: q.name,
      question: q.question,
      howto: q.howto,
      accept: q.accept,
    }));

    return {
      success: true,
      questions: formattedQuestions
    };
  } catch (error) {
    console.error("Error fetching machine questions:", error);
    return {
      success: false,
      error: "Failed to fetch machine questions"
    };
  }
}