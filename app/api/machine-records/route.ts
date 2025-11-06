import { NextRequest, NextResponse } from "next/server";
import { getMachineInspectionRecords } from "@/data/machines";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bu = searchParams.get("bu");
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!bu || !type || !id) {
      return NextResponse.json(
        { error: "Missing required parameters: bu, type, id" },
        { status: 400 }
      );
    }

    const records = await getMachineInspectionRecords(bu, type, id);

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Error fetching machine inspection records:", error);
    return NextResponse.json(
      { error: "Failed to fetch inspection records" },
      { status: 500 }
    );
  }
}