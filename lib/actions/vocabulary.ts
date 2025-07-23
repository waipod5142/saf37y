"use server";

import { getVocabularyByBu } from "@/data/vocabulary";
import { Vocabulary } from "@/types/vocabulary";

export async function getVocabulary(
  bu: string
): Promise<{ success: boolean; vocabulary?: Vocabulary; error?: string }> {
  try {
    // Process parameters
    const processedBu = bu && ['srb', 'mkt', 'office', 'lbm', 'rmx', 'iagg', 'ieco'].includes(bu) ? 'th' : bu;
    
    const vocabulary = await getVocabularyByBu(processedBu);
    
    if (!vocabulary) {
      return {
        success: false,
        error: "Vocabulary not found"
      };
    }

    return {
      success: true,
      vocabulary
    };
  } catch (error) {
    console.error("Error fetching vocabulary:", error);
    return {
      success: false,
      error: "Failed to fetch vocabulary"
    };
  }
}