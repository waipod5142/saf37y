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
    
    // Optimized: Only fetch records from the current week using Firestore timestamp filtering
    const inspectionQuery = firestore
      .collection("machinetr")
      .where("bu", "==", bu)
      .where("timestamp", ">=", weekStart) // Only fetch records from current week
      .orderBy("timestamp", "desc");
    
    const inspectionSnapshot = await inspectionQuery.get();
    
    // Process only the filtered records
    const weekRecords: MachineInspectionRecord[] = inspectionSnapshot.docs.map(doc => {
      const recordData = doc.data();
      return {
        id: recordData.id,
        bu: recordData.bu,
        type: recordData.type,
        inspector: recordData.inspector,
        timestamp: recordData.timestamp,
        createdAt: recordData.createdAt,
        remark: recordData.remark,
        images: recordData.images,
        docId: doc.id,
        ...recordData,
      } as MachineInspectionRecord;
    });
    
    let totalToday = 0;
    let totalWeek = 0;
    let lastInspectionDate: Date | undefined;
    
    weekRecords.forEach(record => {
      if (!record.timestamp) return;
      
      const recordDate = convertFirebaseTimestamp(record.timestamp);
      if (!recordDate) return;
      
      // Update last inspection date
      if (!lastInspectionDate || recordDate > lastInspectionDate) {
        lastInspectionDate = recordDate;
      }
      
      // Count by time periods (all records are already within the week)
      totalWeek++;
      
      if (recordDate >= todayStart) {
        totalToday++;
      }
    });
    
    // Return only today and week totals (removed totalMonth)
    return NextResponse.json({
      totalToday,
      totalWeek,
      lastInspection: lastInspectionDate?.toISOString() ?? null,
      totalRecords: weekRecords.length
    });
  } catch (error) {
    console.error("Error fetching transaction summary:", error);
    return NextResponse.json({ error: "Failed to fetch transaction summary" }, { status: 500 });
  }
}