import { NextRequest, NextResponse } from "next/server";
import { getTokenData } from "@/data/man";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bu = searchParams.get("bu");
    const id = searchParams.get("id");

    // Validate required parameters
    if (!bu || !id) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
          details: "Both 'bu' and 'id' parameters are required"
        },
        { status: 400 }
      );
    }

    console.log(`API: Fetching token data for bu: ${bu}, id: ${id}`);

    // Fetch token data using the data layer function
    const tokenData = await getTokenData(bu, id);

    if (!tokenData) {
      return NextResponse.json(
        {
          error: "Token data not found",
          details: `No token data found for bu: ${bu}, id: ${id}`
        },
        { status: 404 }
      );
    }

    console.log(`API: Successfully fetched token data for id: ${id}`);

    return NextResponse.json({
      success: true,
      data: tokenData,
    });

  } catch (error) {
    console.error("API Error fetching token data:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
}