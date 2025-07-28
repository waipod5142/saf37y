"use server";

import { getFormWithTitle } from "@/data/forms";
import { MachineItem } from "@/lib/machine-types";

export async function getMachineQuestions(
  bu: string,
  type: string,
): Promise<{ success: boolean; questions?: MachineItem[]; title?: string; image?: string; inspection?: string; emoji?: string; error?: string }> {
  try {
    // Process parameters
    const processedType = type.toLowerCase();
    
    const formData = await getFormWithTitle(bu, processedType);
    if (!formData) {
      return {
        success: false,
        error: "Form not found"
      };
    }

    // Validate that questions exists and is an array
    if (!formData.questions || !Array.isArray(formData.questions)) {
      return {
        success: true,
        questions: [],
        title: formData.title,
        image: formData.image,
        inspection: formData.inspection,
        emoji: formData.emoji
      };
    }
    if (formData.questions.length === 0) {
      return {
        success: true,
        questions: [],
        title: formData.title,
        image: formData.image,
        inspection: formData.inspection,
        emoji: formData.emoji
      };
    }

    // Convert form questions to MachineItem format
    const formattedQuestions: MachineItem[] = formData.questions.map((q) => ({
      name: q.name,
      question: q.question,
      howto: q.howto,
      accept: q.accept,
    }));

    return {
      success: true,
      questions: formattedQuestions,
      title: formData.title,
      image: formData.image,
      inspection: formData.inspection,
      emoji: formData.emoji
    };
  } catch (error) {
    console.error("Error fetching machine questions:", error);
    return {
      success: false,
      error: "Failed to fetch machine questions"
    };
  }
}