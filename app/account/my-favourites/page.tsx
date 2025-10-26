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

  // Get machine favourites
  const machineFavourites = await getUserMachineFavourites();
  const allMachineFavourites = Object.keys(machineFavourites);

  // Fetch ALL machine data (not paginated yet)
  const allMachines: (Machine & { machineKey: string })[] = [];
  for (const machineKey of allMachineFavourites) {
    const [bu, type, id] = machineKey.split("_");
    if (bu && type && id) {
      try {
        const machineQuery = firestore
          .collection("machine")
          .where("bu", "==", bu)
          .where("type", "==", type)
          .where("id", "==", id);

        const machineSnapshot = await machineQuery.get();

        if (!machineSnapshot.empty) {
          const rawData = machineSnapshot.docs[0].data();

          // Convert Firebase Timestamps to serializable format
          const serializedData = JSON.parse(
            JSON.stringify(rawData, (key, value) => {
              // Convert Firestore Timestamps to ISO strings
              if (value && typeof value === 'object' && '_seconds' in value) {
                return new Date(value._seconds * 1000).toISOString();
              }
              return value;
            })
          );

          const machineData = {
            ...serializedData,
            docId: machineSnapshot.docs[0].id,
            machineKey,
          } as Machine & { machineKey: string };
          allMachines.push(machineData);
        }
      } catch (error) {
        console.error(`Error fetching machine ${machineKey}:`, error);
      }
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

  // Filter by type if specified
  const filteredMachines = filterType
    ? allMachines.filter((m) => m.type === filterType)
    : allMachines;

  // Paginate filtered results
  const pageSize = 20;
  const totalPages = Math.ceil(filteredMachines.length / pageSize);
  const paginatedMachines = filteredMachines.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  if (!paginatedMachines.length && page > 1) {
    redirect(`/account/my-favourites?page=${totalPages}${filterType ? `&type=${filterType}` : ""}`);
  }

  return (
    <MyFavouritesClient
      machines={paginatedMachines}
      totalCount={totalCount}
      countByType={countByType}
      currentPage={page}
      totalPages={totalPages}
      filterType={filterType}
      filteredCount={filteredMachines.length}
      startIndex={(page - 1) * pageSize}
    />
  );
}
