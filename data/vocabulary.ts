import { firestore } from "@/firebase/server";
import { Vocabulary } from "@/types/vocabulary";
import "server-only";

export const getVocabularyByBu = async (
  bu: string
): Promise<Vocabulary | null> => {
  try {
    // Query the vocabulary collection with matching bu
    const vocabularyQuery = firestore
      .collection("vocabulary")
      .where("bu", "==", bu);

    const vocabularySnapshot = await vocabularyQuery.get();

    if (vocabularySnapshot.empty) {
      return null;
    }

    // Get the first matching document
    const doc = vocabularySnapshot.docs[0];
    const vocabularyData = doc.data();

    return {
      bu: vocabularyData.bu,
      accept: vocabularyData.accept,
      choices: vocabularyData.choices || [],
      howto: vocabularyData.howto,
      inspector: vocabularyData.inspector,
      picture: vocabularyData.picture,
      remark: vocabularyData.remark,
      remarkr: vocabularyData.remarkr,
      submit: vocabularyData.submit,
    } as Vocabulary;
  } catch (error) {
    console.error("Error fetching vocabulary data:", error);
    return null;
  }
};