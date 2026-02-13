import { firestore } from "@/firebase/server";
import { Machine } from "@/types/machine";
import { OwnerRow } from "./owner-row";

function convertFirebaseTimestamp(timestamp: any): Date | null {
  if (!timestamp) return null;

  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }

  if (timestamp._seconds !== undefined) {
    return new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
  }

  return new Date(timestamp);
}

async function getMachinesByOwner() {
  try {
    // Get all mixer machines
    const machineSnapshot = await firestore
      .collection("machine")
      .where("type", "==", "mixer")
      .get();

    // Get all mixer inspections
    const inspectionSnapshot = await firestore
      .collection("machinetr")
      .where("type", "==", "mixer")
      .get();

    // Get today's date range
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // Group machines by owner
    const machinesByOwner: Record<string, {
      total: number;
      inspectedToday: Set<string>;
      inspectionDetails: Array<{
        id: string;
        timestamp: Date;
        inspector: string;
        hasDefect: boolean;
      }>;
    }> = {};

    machineSnapshot.docs.forEach(doc => {
      const data = doc.data() as Machine;
      const owner = data.owner || "Unknown";

      if (!machinesByOwner[owner]) {
        machinesByOwner[owner] = { total: 0, inspectedToday: new Set(), inspectionDetails: [] };
      }
      machinesByOwner[owner].total++;
    });

    // Count inspections that happened today
    inspectionSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const timestamp = convertFirebaseTimestamp(data.timestamp);

      if (timestamp && timestamp >= todayStart && timestamp < todayEnd) {
        const machineId = data.id;

        // Find the owner of this machine
        const machine = machineSnapshot.docs.find(m => {
          const machineData = m.data() as Machine;
          return machineData.id === machineId;
        });

        if (machine) {
          const machineData = machine.data() as Machine;
          const owner = machineData.owner || "Unknown";

          if (!machinesByOwner[owner]) {
            machinesByOwner[owner] = { total: 0, inspectedToday: new Set(), inspectionDetails: [] };
          }
          machinesByOwner[owner].inspectedToday.add(machineId);

          // Check for defects (any field with value "fail")
          const hasDefect = Object.keys(data).some(key => {
            const value = data[key];
            return typeof value === 'string' && value.toLowerCase() === 'fail';
          });

          // Add inspection details
          machinesByOwner[owner].inspectionDetails.push({
            id: machineId,
            timestamp: timestamp,
            inspector: data.inspector || "Unknown",
            hasDefect
          });
        }
      }
    });

    // Sort by total machines descending and convert to array
    const sortedData = Object.entries(machinesByOwner)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([owner, data]) => ({
        owner,
        total: data.total,
        inspectedToday: data.inspectedToday.size,
        inspectionDetails: data.inspectionDetails.map(detail => ({
          id: detail.id,
          timestamp: detail.timestamp.toISOString(),
          inspector: detail.inspector,
          hasDefect: detail.hasDefect
        }))
      }));

    return {
      total: machineSnapshot.size,
      byOwner: sortedData,
      error: null
    };
  } catch (error) {
    console.error("Error fetching machines by owner:", error);
    return {
      total: 0,
      byOwner: [],
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export default async function RmxPage() {
  const data = await getMachinesByOwner();

  if (data.error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-red-600">Error Loading Data</h1>
        <p className="text-red-500">{data.error}</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.byOwner.map(d => d.total), 1);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Mixer Machines by Owner</h1>

      <div className="mb-8">
        <p className="text-xl">Total Mixer Machines: <strong>{data.total}</strong></p>
      </div>

      <div className="space-y-3">
        {data.byOwner.map((ownerData) => (
          <OwnerRow
            key={ownerData.owner}
            owner={ownerData.owner}
            total={ownerData.total}
            inspectedToday={ownerData.inspectedToday}
            inspectionDetails={ownerData.inspectionDetails}
            maxCount={maxCount}
          />
        ))}
      </div>
    </div>
  );
}
