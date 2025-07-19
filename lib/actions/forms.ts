"use server";

import { getFormWithTitle } from "@/data/forms";
import { MachineItem } from "@/lib/machine-types";

export async function getMachineQuestions(
  bu: string,
  type: string,
): Promise<{ success: boolean; questions?: MachineItem[]; title?: string; error?: string }> {
  try {
    const formData = await getFormWithTitle(bu, type);
    
    if (!formData) {
      return {
        success: false,
        error: "Form not found"
      };
    }

    if (formData.questions.length === 0) {
      return {
        success: true,
        questions: [],
        title: formData.title
      };
    }

    // Convert form questions to MachineItem format
    const formattedQuestions: MachineItem[] = formData.questions.map((q, index) => ({
      name: q.name,
      question: q.question,
      howto: q.howto,
      accept: q.accept,
    }));

    return {
      success: true,
      questions: formattedQuestions,
      title: formData.title
    };
  } catch (error) {
    console.error("Error fetching machine questions:", error);
    return {
      success: false,
      error: "Failed to fetch machine questions"
    };
  }
}