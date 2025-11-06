import { NextRequest, NextResponse } from "next/server";
import { getFormWithTitle } from "@/data/forms";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bu = searchParams.get("bu");
    const type = searchParams.get("type");

    if (!bu || !type) {
      return NextResponse.json(
        { error: "Missing bu or type parameter" },
        { status: 400 }
      );
    }

    const formData = await getFormWithTitle(bu, type);

    if (!formData) {
      return NextResponse.json(
        { title: null, emoji: null },
        { status: 200 }
      );
    }

    return NextResponse.json({
      title: formData.title || null,
      emoji: formData.emoji || null,
    });
  } catch (error) {
    console.error("Error fetching form title:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
