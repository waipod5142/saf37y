import { getUserMachineFavourites } from "@/data/favourites";
import { redirect } from "next/navigation";
import { Machine } from "@/types/machine";
import { firestore } from "@/firebase/server";
import MyFavouritesClient from "./my-favourites-client";

export default async function MyFavourites({
  searchParams,
}: {
  searchParams: Promise<any>;
}) {
  const searchParamsValues = await searchParams;
  const page = searchParamsValues?.page ? parseInt(searchParamsValues.page) : 1;
  const filterType = searchParamsValues?.type || null;
  const filterId = searchParamsValues?.id || null;

  // Get machine favourites
  const machineFavourites = await getUserMachineFavourites();
  const allMachineFavourites = Object.keys(machineFavourites);

  // Parse all machine keys to get unique BUs for batch fetching
  const machinesByBu: Record<string, Array<{ bu: string; type: string; id: string; key: string }>> = {};

  allMachineFavourites.forEach((machineKey) => {
    const [bu, type, id] = machineKey.split("_");
    if (bu && type && id) {
      if (!machinesByBu[bu]) {
        machinesByBu[bu] = [];
      }
      machinesByBu[bu].push({ bu, type, id, key: machineKey });
    }
  });

  // Fetch machines in batches by BU (much faster!)
  const allMachines: (Machine & { machineKey: string })[] = [];

  for (const bu of Object.keys(machinesByBu)) {
    try {
      // Fetch all machines for this BU at once
      const machinesSnapshot = await firestore
        .collection("machine")
        .where("bu", "==", bu)
        .get();

      // Create a lookup map for fast access
      const machineMap = new Map<string, any>();
      machinesSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const lookupKey = `${data.bu}_${data.type}_${data.id}`;
        machineMap.set(lookupKey, { ...data, docId: doc.id });
      });

      // Match with favorites
      machinesByBu[bu].forEach(({ key }) => {
        const machineData = machineMap.get(key);
        if (machineData) {
          // Convert Firebase Timestamps to serializable format
          const serializedData = JSON.parse(
            JSON.stringify(machineData, (_key, value) => {
              if (value && typeof value === 'object' && '_seconds' in value) {
                return new Date(value._seconds * 1000).toISOString();
              }
              return value;
            })
          );

          allMachines.push({
            ...serializedData,
            machineKey: key,
          } as Machine & { machineKey: string });
        }
      });
    } catch (error) {
      console.error(`Error fetching machines for BU ${bu}:`, error);
    }
  }

  // Sort all machines by bu, site, type, id
  allMachines.sort((a, b) => {
    if (a.bu !== b.bu) return (a.bu || "").localeCompare(b.bu || "");
    if (a.site !== b.site) return (a.site || "").localeCompare(b.site || "");
    if (a.type !== b.type) return (a.type || "").localeCompare(b.type || "");
    return (a.id || "").localeCompare(b.id || "");
  });

  // Calculate statistics
  const totalCount = allMachines.length;
  const countByType: Record<string, number> = {};
  allMachines.forEach((machine) => {
    const type = machine.type || "unknown";
    countByType[type] = (countByType[type] || 0) + 1;
  });

  // Filter by type and ID if specified
  let filteredMachines = allMachines;

  if (filterType) {
    filteredMachines = filteredMachines.filter((m) => m.type === filterType);
  }

  if (filterId) {
    filteredMachines = filteredMachines.filter((m) =>
      m.id?.toLowerCase().includes(filterId.toLowerCase())
    );
  }

  // Paginate filtered results
  const pageSize = 20;
  const totalPages = Math.ceil(filteredMachines.length / pageSize);
  const paginatedMachines = filteredMachines.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  if (!paginatedMachines.length && page > 1) {
    const params = new URLSearchParams();
    params.set("page", totalPages.toString());
    if (filterType) params.set("type", filterType);
    if (filterId) params.set("id", filterId);
    redirect(`/account/my-favourites?${params.toString()}`);
  }

  return (
    <MyFavouritesClient
      machines={paginatedMachines}
      totalCount={totalCount}
      countByType={countByType}
      currentPage={page}
      totalPages={totalPages}
      filterType={filterType}
      filterId={filterId}
      filteredCount={filteredMachines.length}
      startIndex={(page - 1) * pageSize}
    />
  );
}
