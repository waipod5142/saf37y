import { firestore } from "@/firebase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId, bu, site } = await request.json();

    if (!userId || !bu || !site) {
      return NextResponse.json(
        { error: "Missing required parameters: userId, bu, site" },
        { status: 400 }
      );
    }

    console.log(`Fetching machines for bu="${bu}" and site="${site}"...`);

    // Fetch all machines with specified bu and site
    const machinesQuery = firestore
      .collection("machine")
      .where("bu", "==", bu)
      .where("site", "==", site);

    const machinesSnapshot = await machinesQuery.get();

    console.log(`Found ${machinesSnapshot.size} machines`);

    if (machinesSnapshot.empty) {
      return NextResponse.json(
        { message: "No machines found with the specified criteria", count: 0 },
        { status: 200 }
      );
    }

    // Build favorites object
    const favorites: Record<string, boolean> = {};

    machinesSnapshot.docs.forEach((doc) => {
      const machineData = doc.data();
      const machineKey = `${machineData.bu}_${machineData.type}_${machineData.id}`;
      favorites[machineKey] = true;
    });

    console.log(
      `Adding ${Object.keys(favorites).length} machines to favorites for user ${userId}...`
    );

    // Update the user's machine favorites
    await firestore
      .collection("machineFavourites")
      .doc(userId)
      .set(favorites, { merge: true });

    return NextResponse.json({
      success: true,
      message: "Successfully added machine favorites",
      count: Object.keys(favorites).length,
      favorites: Object.keys(favorites),
    });
  } catch (error) {
    console.error("Error adding machine favorites:", error);
    return NextResponse.json(
      { error: "Failed to add machine favorites", details: String(error) },
      { status: 500 }
    );
  }
}
