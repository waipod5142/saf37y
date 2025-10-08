import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/firebase/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bu = searchParams.get("bu");
    const site = searchParams.get("site");
    const type = searchParams.get("type");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    if (!bu || !startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Build query
    let query = firestore
      .collection("mantr")
      .where("bu", "==", bu)
      .where("timestamp", ">=", startDate)
      .where("timestamp", "<=", endDate);

    // Add optional filters
    if (site && site !== "all") {
      query = query.where("site", "==", site);
    }

    if (type && type !== "all") {
      query = query.where("type", "==", type);
    }

    // Execute query
    const snapshot = await query.get();

    // Convert to plain objects
    const records = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        docId: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      };
    });

    // Sort by timestamp descending (most recent first)
    records.sort((a, b) => {
      const dateA = new Date(a.timestamp || a.createdAt);
      const dateB = new Date(b.timestamp || b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({ success: true, records, count: records.length });
  } catch (error) {
    console.error("Error fetching man records:", error);
    return NextResponse.json(
      { error: "Failed to fetch records" },
      { status: 500 }
    );
  }
}
