import { firestore } from "@/firebase/server";
import { MachineInspectionRecord } from "@/types/machineInspectionRecord";
import { NextResponse } from "next/server";

// Force dynamic rendering - don't try to statically optimize this route during build
export const dynamic = 'force-dynamic';

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
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const bu = searchParams.get('bu');
    
    if (!bu) {
      return NextResponse.json({ error: "Business unit parameter is required" }, { status: 400 });
    }
    
    // Calculate time boundaries - only need current week
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Fetch all records for the business unit and process in memory to avoid composite index requirements
    let totalToday = 0;
    let totalWeek = 0;
    let lastInspectionDate: Date | undefined;

    try {
      // Single query to get all records for the business unit (with reasonable limit)
      const allRecordsQuery = firestore
        .collection("machinetr")
        .where("bu", "==", bu)
        .limit(10000); // Reasonable limit to prevent memory issues while capturing most data

      const allRecordsSnapshot = await allRecordsQuery.get();

      // Process all records in memory for counting and finding max timestamp
      if (!allRecordsSnapshot.empty) {
        let maxDate: Date | null = null;

        allRecordsSnapshot.docs.forEach(doc => {
          const recordData = doc.data();
          if (!recordData.timestamp) return;

          const recordDate = convertFirebaseTimestamp(recordData.timestamp);
          if (!recordDate) return;

          // Update last inspection date
          if (!maxDate || recordDate > maxDate) {
            maxDate = recordDate;
          }

          // Count by time periods
          if (recordDate >= weekStart) {
            totalWeek++;

            if (recordDate >= todayStart) {
              totalToday++;
            }
          }
        });

        if (maxDate) {
          lastInspectionDate = maxDate;
        }
      }
      
    } catch (queryError) {
      console.error("Error fetching records for transaction summary:", queryError);

      // Return zero counts if query fails
      totalToday = 0;
      totalWeek = 0;
      lastInspectionDate = undefined;
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`Transaction summary for ${bu} completed in ${processingTime}ms`);
    
    // Return only today and week totals
    return NextResponse.json({
      totalToday,
      totalWeek,
      lastInspection: lastInspectionDate?.toISOString() ?? null,
      totalRecords: totalWeek, // For backward compatibility
      processingTime: processingTime
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const { searchParams } = new URL(request.url);
    const bu = searchParams.get('bu');
    console.error(`Error fetching transaction summary for bu=${bu} (${processingTime}ms):`, error);
    
    // Return a more informative error response
    return NextResponse.json({ 
      error: "Failed to fetch transaction summary", 
      details: error instanceof Error ? error.message : "Unknown error",
      bu: bu,
      processingTime: processingTime
    }, { status: 500 });
  }
}