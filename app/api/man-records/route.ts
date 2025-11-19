import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/firebase/server";

// Force dynamic rendering - don't try to statically optimize this route during build
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bu = searchParams.get("bu");
    const site = searchParams.get("site");
    const type = searchParams.get("type");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const alertNo = searchParams.get("alertNo");

    console.log("=== Man Records API Route ===");
    console.log("Request params:", { bu, site, type, startDateStr, endDateStr, alertNo });

    if (!bu || !startDateStr || !endDateStr) {
      console.log("Missing required parameters");
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    console.log("Parsed dates:", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    // Query by bu first (most selective filter)
    let query = firestore
      .collection("mantr")
      .where("bu", "==", bu);

    console.log("Base query built (bu filter)");

    // Execute query
    const snapshot = await query.get();

    console.log("Query executed, docs found:", snapshot.docs.length);

    // Convert all records and handle both Timestamp and string dates
    const allRecords = snapshot.docs.map((doc) => {
      const data = doc.data();

      // Handle timestamp - could be Firestore Timestamp, Date, or string
      let timestampISO: any = data.timestamp;
      if (data.timestamp?.toDate) {
        // Firestore Timestamp
        timestampISO = data.timestamp.toDate().toISOString();
      } else if (data.timestamp instanceof Date) {
        // Date object
        timestampISO = data.timestamp.toISOString();
      } else if (typeof data.timestamp === 'string') {
        // Already a string
        timestampISO = data.timestamp;
      }

      // Handle createdAt similarly
      let createdAtISO: any = data.createdAt;
      if (data.createdAt?.toDate) {
        createdAtISO = data.createdAt.toDate().toISOString();
      } else if (data.createdAt instanceof Date) {
        createdAtISO = data.createdAt.toISOString();
      }

      return {
        ...data,
        docId: doc.id,
        timestamp: timestampISO,
        createdAt: createdAtISO,
      } as any;
    });

    console.log("All records before filtering:", allRecords.length);

    // Apply filters including date range and alertNo
    let records = allRecords.filter((record) => {
      const buMatch = record.bu === bu;
      const siteMatch = !site || site === "all" || record.site === site;
      const typeMatch = !type || type === "all" || record.type === type;
      const alertNoMatch = !alertNo || record.alertNo === alertNo;

      // Date range check - convert timestamp string to Date for comparison
      const recordDate = new Date(record.timestamp || record.createdAt);
      const dateMatch = !startDateStr || !endDateStr || (recordDate >= startDate && recordDate <= endDate);

      const match = buMatch && siteMatch && typeMatch && alertNoMatch && dateMatch;

      if (!match && buMatch && siteMatch && typeMatch && alertNoMatch) {
        console.log("Date filter excluded:", {
          recordDate: recordDate.toISOString(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          id: record.id
        });
      }

      return match;
    });

    console.log("Records after filtering:", records.length);

    // Sort by timestamp descending (most recent first)
    records.sort((a, b) => {
      const dateA = new Date(a.timestamp || a.createdAt);
      const dateB = new Date(b.timestamp || b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    // Batch fetch employee names for filtered records only
    const uniqueEmployeeIds = [...new Set(records.map(r => r.id).filter(Boolean))];
    console.log("Fetching employee names for", uniqueEmployeeIds.length, "unique IDs");

    const employeeMap = new Map<string, string>();
    if (uniqueEmployeeIds.length > 0) {
      try {
        // Firestore 'in' queries support max 10 items, so batch them
        const batchSize = 10;
        const batches = [];
        for (let i = 0; i < uniqueEmployeeIds.length; i += batchSize) {
          batches.push(uniqueEmployeeIds.slice(i, i + batchSize));
        }

        await Promise.all(
          batches.map(async (batch) => {
            const employeeSnapshot = await firestore
              .collection("employees")
              .where("empId", "in", batch)
              .get();

            employeeSnapshot.docs.forEach((doc) => {
              const data = doc.data();
              if (data.empId && data.fullName) {
                employeeMap.set(data.empId, data.fullName);
              }
            });
          })
        );
      } catch (error) {
        console.error("Error batch fetching employee names:", error);
      }
    }

    // Add employee names to records
    records = records.map(record => ({
      ...record,
      employeeName: record.id ? employeeMap.get(record.id) : undefined
    }));

    console.log("Returning records:", records.length);

    return NextResponse.json({ success: true, records, count: records.length });
  } catch (error) {
    console.error("Error fetching man records:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch records",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
