import { firestore } from "@/firebase/server";
import { MachineInspectionRecord } from "@/types/machineInspectionRecord";
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
    
    // Use aggregation queries for better performance with large datasets
    let totalToday = 0;
    let totalWeek = 0;
    let lastInspectionDate: Date | undefined;
    
    try {
      // Count today's records using aggregation
      const todayCountQuery = firestore
        .collection("machinetr")
        .where("bu", "==", bu)
        .where("timestamp", ">=", todayStart)
        .where("timestamp", "<", new Date(todayStart.getTime() + 24 * 60 * 60 * 1000));
      
      // Count week's records using aggregation  
      const weekCountQuery = firestore
        .collection("machinetr")
        .where("bu", "==", bu)
        .where("timestamp", ">=", weekStart);
      
      // Get most recent record for last inspection date (limit to 1 for efficiency)
      const lastInspectionQuery = firestore
        .collection("machinetr")
        .where("bu", "==", bu)
        .orderBy("timestamp", "desc")
        .limit(1);
      
      // Execute queries in parallel for better performance
      const [todaySnapshot, weekSnapshot, lastInspectionSnapshot] = await Promise.all([
        todayCountQuery.get(),
        weekCountQuery.get(),
        lastInspectionQuery.get()
      ]);
      
      // Count records efficiently
      totalToday = todaySnapshot.size;
      totalWeek = weekSnapshot.size;
      
      // Get last inspection date from the most recent record
      if (!lastInspectionSnapshot.empty) {
        const lastRecord = lastInspectionSnapshot.docs[0].data();
        if (lastRecord.timestamp) {
          const convertedDate = convertFirebaseTimestamp(lastRecord.timestamp);
          if (convertedDate) {
            lastInspectionDate = convertedDate;
          }
        }
      }
      
    } catch (aggregationError) {
      console.warn("Aggregation query failed, falling back to batch processing:", aggregationError);
      
      // Fallback: Use batch processing to get all records without timeout
      let hasMoreRecords = true;
      let lastDoc: any = null;
      const batchSize = 500; // Process in smaller batches to avoid memory issues
      
      while (hasMoreRecords) {
        let batchQuery = firestore
          .collection("machinetr")
          .where("bu", "==", bu)
          .where("timestamp", ">=", weekStart)
          .orderBy("timestamp", "desc")
          .limit(batchSize);
        
        // Add pagination cursor if we have processed previous batch
        if (lastDoc) {
          batchQuery = batchQuery.startAfter(lastDoc);
        }
        
        const batchSnapshot = await batchQuery.get();
        
        // If we got fewer records than batch size, this is the last batch
        if (batchSnapshot.size < batchSize) {
          hasMoreRecords = false;
        }
        
        // Process current batch
        batchSnapshot.docs.forEach(doc => {
          const recordData = doc.data();
          if (!recordData.timestamp) return;
          
          const recordDate = convertFirebaseTimestamp(recordData.timestamp);
          if (!recordDate) return;
          
          // Update last inspection date
          if (!lastInspectionDate || recordDate > lastInspectionDate) {
            lastInspectionDate = recordDate;
          }
          
          // Count by time periods
          totalWeek++;
          
          if (recordDate >= todayStart) {
            totalToday++;
          }
        });
        
        // Set cursor for next batch
        if (batchSnapshot.size > 0) {
          lastDoc = batchSnapshot.docs[batchSnapshot.size - 1];
        }
        
        // Safety break if we've processed too many batches (prevent infinite loops)
        if (totalWeek > 50000) { // Reasonable upper limit
          console.warn(`Processed over 50,000 records for bu=${bu}, stopping to prevent timeout`);
          break;
        }
      }
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