import { getMachineInspectionCountry } from "@/data/machines";
import { NextResponse } from "next/server";

// Utility function for Firebase timestamp conversion
function convertFirebaseTimestamp(timestamp: any): Date | null {
  if (!timestamp) return null;
  
  // If it has toDate method (actual Firebase Timestamp)
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // If it's a serialized timestamp with _seconds
  if (timestamp._seconds !== undefined) {
    return new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
  }
  
  // Fallback to regular Date parsing
  return new Date(timestamp);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bu = searchParams.get('bu');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    if (!bu) {
      return NextResponse.json({ error: "Business unit parameter is required" }, { status: 400 });
    }
    
    // Get all inspection records for the business unit
    const allRecords = await getMachineInspectionCountry(bu);
    
    // Sort by timestamp descending (most recent first)
    const sortedRecords = allRecords.sort((a, b) => {
      const aDate = convertFirebaseTimestamp(a.timestamp);
      const bDate = convertFirebaseTimestamp(b.timestamp);
      
      if (!aDate || !bDate) return 0;
      
      return bDate.getTime() - aDate.getTime(); // Descending order (newest first)
    });
    
    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRecords = sortedRecords.slice(startIndex, endIndex);
    const hasMore = endIndex < sortedRecords.length;
    
    return NextResponse.json({
      transactions: paginatedRecords,
      hasMore,
      total: sortedRecords.length,
      page,
      limit
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}