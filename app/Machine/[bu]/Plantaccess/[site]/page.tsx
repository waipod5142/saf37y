import { redirect } from "next/navigation";
import { firestore } from "@/firebase/server";

export default async function PlantAccessRedirect({
  params,
}: {
  params: Promise<{ bu: string; site: string }>;
}) {
  const { site } = await params;

  let plantId = site; // Fallback to site if plantId not found

  try {
    // Query plants collection where site matches
    const plantsRef = firestore.collection("plants");
    const snapshot = await plantsRef.where("site", "==", site).limit(1).get();

    if (!snapshot.empty) {
      const plantDoc = snapshot.docs[0];
      const plantData = plantDoc.data();

      // Check if plantId array exists and has at least one element
      if (
        plantData.plantId &&
        Array.isArray(plantData.plantId) &&
        plantData.plantId.length > 0
      ) {
        plantId = plantData.plantId[0];
      }
    }
  } catch (error) {
    console.error("Error fetching plant data:", error);
    // Use fallback (site value)
  }

  // Redirect to legacy system with plantId
  redirect(
    `https://sccc-inseesafety-prod.web.app/public/visitor/${plantId}`
  );
}
