import { firestore, auth } from "@/firebase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";

// DELETE - Delete machine from both machine collection and user's favorites
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("firebaseAuthToken")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const verifiedToken = await auth.verifyIdToken(token);
    const userId = verifiedToken.uid;

    const { searchParams } = new URL(request.url);
    const docId = searchParams.get("docId");
    const machineKey = searchParams.get("machineKey");

    if (!docId || !machineKey) {
      return NextResponse.json(
        { error: "Missing docId or machineKey" },
        { status: 400 }
      );
    }

    // Delete from machine collection
    await firestore.collection("machine").doc(docId).delete();

    // Remove from user's favorites
    await firestore
      .collection("machineFavourites")
      .doc(userId)
      .update({
        [machineKey]: FieldValue.delete(),
      });

    return NextResponse.json({
      success: true,
      message: "Machine and favorite deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting machine:", error);
    return NextResponse.json(
      { error: "Failed to delete machine", details: String(error) },
      { status: 500 }
    );
  }
}
