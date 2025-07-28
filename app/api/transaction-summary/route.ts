import { getMachineInspectionCountry } from "@/data/machines";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bu = searchParams.get('bu');
    
    if (!bu) {
      return NextResponse.json({ error: "Business unit parameter is required" }, { status: 400 });
    }
    
    // Get all inspection records for the business unit
    const allRecords = await getMachineInspectionCountry(bu);
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let totalToday = 0;
    let totalWeek = 0;
    let totalMonth = 0;
    let lastInspectionDate: Date | undefined;
    
    allRecords.forEach(record => {
      if (!record.timestamp) return;
      
      const recordDate = record.timestamp.toDate ? record.timestamp.toDate() : new Date(record.timestamp);
      
      // Update last inspection date
      if (!lastInspectionDate || recordDate > lastInspectionDate) {
        lastInspectionDate = recordDate;
      }
      
      // Count by time periods
      if (recordDate >= todayStart) {
        totalToday++;
      }
      if (recordDate >= weekStart) {
        totalWeek++;
      }
      if (recordDate >= monthStart) {
        totalMonth++;
      }
    });
    
    return NextResponse.json({
      totalToday,
      totalWeek,
      totalMonth,
      lastInspection: lastInspectionDate?.toISOString() ?? null,
      totalRecords: allRecords.length
    });
  } catch (error) {
    console.error("Error fetching transaction summary:", error);
    return NextResponse.json({ error: "Failed to fetch transaction summary" }, { status: 500 });
  }
}