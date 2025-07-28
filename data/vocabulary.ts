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

    // Handle both 'site' (string) and 'sites' (array/string) formats
    let sites: string[] = [];
    if (vocabularyData.sites) {
      if (Array.isArray(vocabularyData.sites)) {
        sites = vocabularyData.sites;
      } else if (typeof vocabularyData.sites === 'string') {
        sites = [vocabularyData.sites];
      }
    } else if (vocabularyData.site) {
      if (typeof vocabularyData.site === 'string') {
        sites = [vocabularyData.site];
      } else if (Array.isArray(vocabularyData.site)) {
        sites = vocabularyData.site;
      }
    }

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
      flag: vocabularyData.flag || '',
      name: vocabularyData.name || '',
      sites: sites,
      site: vocabularyData.site
    } as Vocabulary;
  } catch (error) {
    console.error("Error fetching vocabulary data:", error);
    return null;
  }
};

export const getAllVocabularies = async (): Promise<Vocabulary[]> => {
  try {
    // Query all vocabulary documents
    const vocabularyQuery = firestore.collection("vocabulary");
    const vocabularySnapshot = await vocabularyQuery.get();

    if (vocabularySnapshot.empty) {
      return [];
    }

    // Map all documents to Vocabulary objects
    const vocabularies: Vocabulary[] = vocabularySnapshot.docs.map(doc => {
      const vocabularyData = doc.data();
      
      // Handle both 'site' (string) and 'sites' (array/string) formats
      let sites: string[] = [];
      if (vocabularyData.sites) {
        if (Array.isArray(vocabularyData.sites)) {
          sites = vocabularyData.sites;
        } else if (typeof vocabularyData.sites === 'string') {
          sites = [vocabularyData.sites];
        }
      } else if (vocabularyData.site) {
        if (typeof vocabularyData.site === 'string') {
          sites = [vocabularyData.site];
        } else if (Array.isArray(vocabularyData.site)) {
          sites = vocabularyData.site;
        }
      }

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
        flag: vocabularyData.flag || '',
        name: vocabularyData.name || '',
        sites: sites,
        site: vocabularyData.site
      } as Vocabulary;
    });

    return vocabularies;
  } catch (error) {
    console.error("Error fetching all vocabulary data:", error);
    return [];
  }
};