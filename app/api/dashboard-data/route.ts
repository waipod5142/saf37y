import { getDashboardMachineStats, getDashboardMachineStatsByBU } from "@/data/machines";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');
    const bu = searchParams.get('bu');
    const site = searchParams.get('site');

    // If bu parameter is provided, use the filtered function
    if (bu) {
      const { stats, allRecords, departmentStats } = await getDashboardMachineStatsByBU(period || undefined, bu, site || undefined);
      return NextResponse.json({
        stats,
        records: allRecords,
        departmentStats
      });
    } else {
      // Use the original function for overall dashboard
      const { stats, allRecords } = await getDashboardMachineStats(period || undefined);
      return NextResponse.json({
        stats,
        records: allRecords
      });
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}