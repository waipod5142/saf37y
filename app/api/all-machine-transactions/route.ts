import { NextRequest, NextResponse } from "next/server";
import { firestore } from "@/firebase/server";
import { Query, DocumentData } from "firebase-admin/firestore";

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bu = searchParams.get('bu');
    const type = searchParams.get('type');
    const site = searchParams.get('site');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Debug logging
    console.log('API Request filters:', { bu, type, site });

    // Build query with filters
    let query: Query<DocumentData> = firestore.collection("machinetr");
    
    // Count total documents first for debugging
    const totalSnapshot = await firestore.collection("machinetr").get();
    console.log('Total machinetr documents:', totalSnapshot.size);

    if (bu) {
      query = query.where("bu", "==", bu);
    }

    if (type) {
      query = query.where("type", "==", type.toLowerCase());
    }

    if (site) {
      query = query.where("site", "==", site);
    }

    // Execute query
    const snapshot = await query.get();
    console.log('Query result count:', snapshot.size);

    // If no results, let's check what field names and values exist in the first few documents
    if (snapshot.empty) {
      // Sample a few documents to see field structure
      const sampleSnapshot = await firestore.collection("machinetr").limit(3).get();
      if (!sampleSnapshot.empty) {
        console.log('Sample document field names and values:');
        sampleSnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`Document ${index + 1}:`, {
            id: doc.id,
            bu: data.bu,
            type: data.type,
            site: data.site,
            allFields: Object.keys(data)
          });
        });
      }
      
      return NextResponse.json({
        transactions: [],
        hasMore: false,
        total: 0,
        page,
        limit,
        debug: {
          totalDocuments: totalSnapshot.size,
          queryResult: snapshot.size,
          sampleFieldsLogged: true
        }
      });
    }

    // Convert documents to plain objects and handle timestamps
    const allRecords = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convert Firebase timestamps to ISO strings for JSON serialization
      if (data.timestamp) {
        const convertedDate = convertFirebaseTimestamp(data.timestamp);
        data.timestamp = convertedDate ? convertedDate.toISOString() : null;
      }
      
      // Convert any other timestamp fields that might exist
      Object.keys(data).forEach(key => {
        if (key.includes('time') || key.includes('date')) {
          const convertedDate = convertFirebaseTimestamp(data[key]);
          if (convertedDate) {
            data[key] = convertedDate.toISOString();
          }
        }
      });

      return {
        id: doc.id,
        ...data
      };
    });

    // Sort by timestamp descending (most recent first)
    const sortedRecords = allRecords.sort((a, b) => {
      const aRecord = a as any;
      const bRecord = b as any;
      const aDate = aRecord.timestamp ? new Date(aRecord.timestamp) : new Date(0);
      const bDate = bRecord.timestamp ? new Date(bRecord.timestamp) : new Date(0);
      return bDate.getTime() - aDate.getTime();
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
      limit,
      filters: {
        bu: bu || null,
        type: type || null,
        site: site || null
      }
    });

  } catch (error) {
    console.error("Error fetching machine transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch machine transactions" },
      { status: 500 }
    );
  }
}