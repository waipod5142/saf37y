"use server";

import { getMachineById } from "@/data/machines";
import { MachineItem } from "@/lib/machine-types";

export async function getMachineQuestions(
  bu: string,
  type: string,
  id: string
): Promise<{ success: boolean; questions?: MachineItem[]; error?: string }> {
  try {
    const machineData = await getMachineById(bu, type, id);
    
    if (!machineData) {
      return {
        success: false,
        error: "Machine not found"
      };
    }

    if (!machineData.questions || machineData.questions.length === 0) {
      return {
        success: true,
        questions: []
      };
    }

    // Convert machine questions to MachineItem format
    const formattedQuestions: MachineItem[] = machineData.questions.map((q, index) => ({
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