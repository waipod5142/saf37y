import { firestore, auth } from "@/firebase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";

// CREATE - Add new machine
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("firebaseAuthToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const verifiedToken = await auth.verifyIdToken(token);
    const userId = verifiedToken.uid;
    const userEmail = verifiedToken.email || "";

    const body = await request.json();
    const { bu, site, type, id, kind, location, plantId, email, status } = body;

    if (!bu || !site || !type || !id) {
      return NextResponse.json(
        { error: "Missing required fields: bu, site, type, id" },
        { status: 400 }
      );
    }

    // Normalize type to lowercase
    const normalizedType = type.toLowerCase();

    // Check if machine already exists
    const existingMachine = await firestore
      .collection("machine")
      .where("bu", "==", bu)
      .where("type", "==", normalizedType)
      .where("id", "==", id)
      .get();

    if (!existingMachine.empty) {
      return NextResponse.json(
        { error: "Machine with this BU, Type, and ID already exists" },
        { status: 409 }
      );
    }

    // Create machine document
    const machineData = {
      bu,
      site,
      type: normalizedType,
      id,
      kind: kind || "",
      location: location || "",
      plantId: plantId || site,
      email: email || userEmail,
      status: status || "active",
      createdAt: FieldValue.serverTimestamp(),
      createdBy: userEmail,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userEmail,
      importedAt: FieldValue.serverTimestamp(),
      lastImportedAt: FieldValue.serverTimestamp(),
      images: [],
    };

    const machineRef = await firestore.collection("machine").add(machineData);

    // Automatically add to user's favorites
    const machineKey = `${bu}_${normalizedType}_${id}`;
    await firestore
      .collection("machineFavourites")
      .doc(userId)
      .set(
        {
          [machineKey]: true,
        },
        { merge: true }
      );

    return NextResponse.json({
      success: true,
      message: "Machine created and added to favorites",
      machineId: machineRef.id,
      machineKey,
    });
  } catch (error) {
    console.error("Error creating machine:", error);
    return NextResponse.json(
      { error: "Failed to create machine", details: String(error) },
      { status: 500 }
    );
  }
}

// READ - Get machines (optional, for future use)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bu = searchParams.get("bu");
    const site = searchParams.get("site");
    const type = searchParams.get("type");

    let query = firestore.collection("machine") as any;

    if (bu) query = query.where("bu", "==", bu);
    if (site) query = query.where("site", "==", site);
    if (type) query = query.where("type", "==", type.toLowerCase());

    const snapshot = await query.limit(100).get();

    const machines = snapshot.docs.map((doc: any) => ({
      docId: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, machines, count: machines.length });
  } catch (error) {
    console.error("Error fetching machines:", error);
    return NextResponse.json(
      { error: "Failed to fetch machines", details: String(error) },
      { status: 500 }
    );
  }
}

// UPDATE - Update machine (for future use)
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("firebaseAuthToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const verifiedToken = await auth.verifyIdToken(token);
    const userEmail = verifiedToken.email || "";

    const body = await request.json();
    const { docId, ...updateData } = body;

    if (!docId) {
      return NextResponse.json({ error: "Missing docId" }, { status: 400 });
    }

    // Update machine
    await firestore
      .collection("machine")
      .doc(docId)
      .update({
        ...updateData,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: userEmail,
      });

    return NextResponse.json({
      success: true,
      message: "Machine updated successfully",
    });
  } catch (error) {
    console.error("Error updating machine:", error);
    return NextResponse.json(
      { error: "Failed to update machine", details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Delete machine (for future use)
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("firebaseAuthToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await auth.verifyIdToken(token);

    const { searchParams } = new URL(request.url);
    const docId = searchParams.get("docId");

    if (!docId) {
      return NextResponse.json({ error: "Missing docId" }, { status: 400 });
    }

    await firestore.collection("machine").doc(docId).delete();

    return NextResponse.json({
      success: true,
      message: "Machine deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting machine:", error);
    return NextResponse.json(
      { error: "Failed to delete machine", details: String(error) },
      { status: 500 }
    );
  }
}
