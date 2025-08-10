import { firestore } from "@/firebase/server";
import { Machine } from "@/types/machine";
import { MachineInspectionRecord } from "@/types/machineInspectionRecord";
import { getFormInspectionPeriods, InspectionPeriod } from "./forms";
import { getSiteMapping } from "@/lib/constants/countries";
import "server-only";

// Helper function to check if a machine type is a mixer type
export const isMixerType = (type: string): boolean => {
  return type.toLowerCase().startsWith('mixer');
};

// Define all mixer type variants
export const MIXER_TYPES = ['mixer', 'mixertsm', 'mixertrainer', 'mixerweek'];

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

export const getMachineById = async (
  bu: string,
  type: string,
  id: string
): Promise<Machine | null> => {
  try {
    // Decode URL parameters to handle special characters (including Thai characters)
    const decodedId = decodeURIComponent(id);
    
    // Query the machine collection with matching bu, type, and id
    const machineQuery = firestore
      .collection("machine")
      .where("bu", "==", bu)
      .where("type", "==", type.toLowerCase())
      .where("id", "==", decodedId);

    const machineSnapshot = await machineQuery.get();

    if (machineSnapshot.empty) {
      return null;
    }

    // Get the first matching document
    const doc = machineSnapshot.docs[0];
    const machineData = doc.data();

    return {
      ...machineData,
    } as Machine;
  } catch (error) {
    console.error("Error fetching machine data:", error);
    return null;
  }
};

export const getMachineInspectionRecords = async (
  bu: string,
  type: string,
  id: string
): Promise<MachineInspectionRecord[]> => {
  try {
    // Decode URL parameters to handle special characters (including Thai characters)
    const decodedId = decodeURIComponent(id);
    
    // Query the machinetr collection with matching bu, type (lowercase), and id
    const inspectionQuery = firestore
      .collection("machinetr")
      .where("bu", "==", bu)
      .where("type", "==", type.toLowerCase())
      .where("id", "==", decodedId)
      .orderBy("timestamp", "desc"); // Latest first

    const inspectionSnapshot = await inspectionQuery.get();

    if (inspectionSnapshot.empty) {
      return [];
    }

    // Map all matching documents to MachineInspectionRecord objects
    const records: MachineInspectionRecord[] = inspectionSnapshot.docs.map((doc) => {
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

    return records;
  } catch (error) {
    console.error("Error fetching machine inspection records:", error);
    return [];
  }
};

export const getMachineInspectionRecordsForMixers = async (
  bu: string,
  id: string
): Promise<MachineInspectionRecord[]> => {
  try {
    // Decode URL parameters to handle special characters (including Thai characters)
    const decodedId = decodeURIComponent(id);
    
    // Create queries for all mixer types
    const queryPromises = MIXER_TYPES.map(mixerType => {
      return firestore
        .collection("machinetr")
        .where("bu", "==", bu)
        .where("type", "==", mixerType.toLowerCase())
        .where("id", "==", decodedId)
        .get();
    });

    // Execute all queries in parallel
    const snapshots = await Promise.all(queryPromises);

    // Collect all records from all mixer types
    const allRecords: MachineInspectionRecord[] = [];
    
    snapshots.forEach((snapshot) => {
      if (!snapshot.empty) {
        const records = snapshot.docs.map((doc) => {
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
        allRecords.push(...records);
      }
    });

    // Sort by timestamp in descending order (latest first)
    allRecords.sort((a, b) => {
      const aDate = convertFirebaseTimestamp(a.timestamp);
      const bDate = convertFirebaseTimestamp(b.timestamp);
      
      if (!aDate || !bDate) return 0;
      
      return bDate.getTime() - aDate.getTime();
    });

    return allRecords;
  } catch (error) {
    console.error("Error fetching machine inspection records for mixers:", error);
    return [];
  }
};

export const getMachineInspectionCountry = async (
  bu: string,
): Promise<MachineInspectionRecord[]> => {
  try {
    // Query both machines and inspection records for the business unit
    const machineQuery = firestore
      .collection("machine")
      .where("bu", "==", bu);

    const inspectionQuery = firestore
      .collection("machinetr")
      .where("bu", "==", bu);

    const [machineSnapshot, inspectionSnapshot] = await Promise.all([
      machineQuery.get(),
      inspectionQuery.get()
    ]);

    if (inspectionSnapshot.empty) {
      return [];
    }

    // Create machine lookup map for site information
    const machineLookup: Record<string, Machine> = {};
    
    machineSnapshot.docs.forEach(doc => {
      const machine = { ...doc.data(), docId: doc.id } as Machine;
      // Create lookup key: bu_type_id
      const lookupKey = `${machine.bu}_${machine.type}_${machine.id}`;
      machineLookup[lookupKey] = machine;
    });

    // Map all matching documents to MachineInspectionRecord objects with site information
    const records: MachineInspectionRecord[] = inspectionSnapshot.docs.map((doc) => {
      const recordData = doc.data();
      
      // Look up corresponding machine to get site information
      const lookupKey = `${recordData.bu}_${recordData.type}_${recordData.id}`;
      const correspondingMachine = machineLookup[lookupKey];
      const site = correspondingMachine?.site || undefined;

      return {
        id: recordData.id,
        bu: recordData.bu,
        type: recordData.type,
        site: site, // Site comes from joined machine data
        inspector: recordData.inspector,
        timestamp: recordData.timestamp,
        createdAt: recordData.createdAt,
        remark: recordData.remark,
        images: recordData.images,
        docId: doc.id,
        ...recordData,
      } as MachineInspectionRecord;
    });

    // Sort by timestamp in descending order (latest first)
    records.sort((a, b) => {
      const aDate = convertFirebaseTimestamp(a.timestamp);
      const bDate = convertFirebaseTimestamp(b.timestamp);
      
      if (!aDate || !bDate) return 0;
      
      return bDate.getTime() - aDate.getTime();
    });

    return records;
  } catch (error) {
    console.error("Error fetching machine inspection records:", error);
    return [];
  }
};

export const getMachinesBySiteAndType = async (
  bu: string,
  site: string,
  type: string
): Promise<Machine[]> => {
  try {
    // Query the machine collection with matching bu, site, and type
    const machineQuery = firestore
      .collection("machine")
      .where("bu", "==", bu)
      .where("site", "==", site)
      .where("type", "==", type.toLowerCase());

    const machineSnapshot = await machineQuery.get();

    if (machineSnapshot.empty) {
      return [];
    }

    // Map all matching documents to Machine objects
    const machines: Machine[] = machineSnapshot.docs.map((doc) => {
      const machineData = doc.data();
      return {
        ...machineData,
        docId: doc.id,
      } as Machine;
    });

    // Sort by machine ID for consistent ordering
    machines.sort((a, b) => (a.id || "").localeCompare(b.id || ""));

    return machines;
  } catch (error) {
    console.error("Error fetching machines by site and type:", error);
    return [];
  }
};

export interface DashboardMachineStats {
  [machineType: string]: {
    [businessUnit: string]: {
      inspected: number;
      total: number;
      percentage: number;
      defects: number;
      inspectionRecords: MachineInspectionRecord[];
    };
  };
}

export const getDashboardMachineStats = async (period?: string): Promise<{
  stats: DashboardMachineStats;
  allRecords: MachineInspectionRecord[];
}> => {
  try {
    const BUSINESS_UNITS = ["th", "vn"];
    
    // Get form inspection periods for filtering (get all forms, not BU-specific)
    const formInspectionPeriods = await getFormInspectionPeriods();
    
    // Get all machines
    const machineQuery = firestore.collection("machine");
    const machineSnapshot = await machineQuery.get();
    
    // Get all inspection records
    const inspectionQuery = firestore.collection("machinetr");
    const inspectionSnapshot = await inspectionQuery.get();
    
    // Process machines by bu and type
    const machinesByBuType: Record<string, Record<string, Machine[]>> = {};
    machineSnapshot.docs.forEach(doc => {
      const machine = { ...doc.data(), docId: doc.id } as Machine;
      if (!machinesByBuType[machine.bu]) {
        machinesByBuType[machine.bu] = {};
      }
      if (!machinesByBuType[machine.bu][machine.type]) {
        machinesByBuType[machine.bu][machine.type] = [];
      }
      machinesByBuType[machine.bu][machine.type].push(machine);
    });

    // Process inspection records
    const allRecords: MachineInspectionRecord[] = inspectionSnapshot.docs.map(doc => {
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

    // Initialize stats structure
    const stats: DashboardMachineStats = {};
    
    // Get all unique machine types from both collections
    const allMachineTypes = new Set<string>();
    Object.values(machinesByBuType).forEach(buMachines => {
      Object.keys(buMachines).forEach(type => allMachineTypes.add(type));
    });
    allRecords.forEach(record => allMachineTypes.add(record.type));

    // Filter machine types based on form inspection periods and requested period
    const filteredMachineTypes = Array.from(allMachineTypes).filter(type => {
      const formPeriod = formInspectionPeriods[type];
      
      // If no period is specified, show all types
      if (!period) return true;
      
      // If form has inspection period defined, only show if it matches requested period
      if (formPeriod) {
        return formPeriod === period;
      }
      
      // If no form inspection period is defined, show in all periods (backward compatibility)
      return true;
    });

    // Initialize stats for filtered machine types only
    filteredMachineTypes.forEach(type => {
      stats[type] = {};
      BUSINESS_UNITS.forEach(bu => {
        stats[type][bu] = {
          inspected: 0,
          total: 0,
          percentage: 0,
          defects: 0,
          inspectionRecords: []
        };
      });
    });

    // Set total machine counts for filtered types only
    Object.keys(machinesByBuType).forEach(bu => {
      Object.keys(machinesByBuType[bu]).forEach(type => {
        if (filteredMachineTypes.includes(type) && stats[type] && stats[type][bu]) {
          stats[type][bu].total = machinesByBuType[bu][type].length;
        }
      });
    });

    // Filter records by time period if specified
    let filteredRecords = allRecords;
    if (period) {
      const now = new Date();
      filteredRecords = allRecords.filter(record => {
        if (!record.timestamp) return false;
        
        const recordDate = convertFirebaseTimestamp(record.timestamp);
        if (!recordDate) return false;
        
        switch (period) {
          case "daily":
            // Check if the inspection was done within today local time
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            return recordDate >= todayStart && recordDate < todayEnd;
          case "monthly": 
            const daysDiffMonthly = (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysDiffMonthly <= 31;
          case "quarterly":
            const daysDiffQuarterly = (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysDiffQuarterly <= 90;
          case "annual":
            const daysDiffAnnually = (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysDiffAnnually <= 365;
          default:
            return true;
        }
      });
    }

    // Group filtered inspection records by bu/type/id and get the latest for each machine
    const latestInspectionsByMachine: Record<string, MachineInspectionRecord> = {};
    
    filteredRecords.forEach(record => {
      const machineKey = `${record.bu}_${record.type}_${record.id}`;
      const existingRecord = latestInspectionsByMachine[machineKey];
      
      if (!existingRecord) {
        latestInspectionsByMachine[machineKey] = record;
      } else {
        // Compare timestamps to keep the latest
        const recordDate = convertFirebaseTimestamp(record.timestamp);
        const existingDate = convertFirebaseTimestamp(existingRecord.timestamp);
        
        if (!recordDate || !existingDate) return;
        
        const recordTime = recordDate.getTime();
        const existingTime = existingDate.getTime();
        
        if (recordTime > existingTime) {
          latestInspectionsByMachine[machineKey] = record;
        }
      }
    });

    // Process latest inspection records to calculate stats (only for filtered types)
    Object.values(latestInspectionsByMachine).forEach(record => {
      // Only process records for filtered machine types
      if (filteredMachineTypes.includes(record.type) && stats[record.type] && stats[record.type][record.bu]) {
        // Only count if this machine actually exists in the machine collection
        const machineExists = machinesByBuType[record.bu]?.[record.type]?.some(m => m.id === record.id);
        
        if (machineExists) {
          stats[record.type][record.bu].inspected++;
          stats[record.type][record.bu].inspectionRecords.push(record);
          
          // Count defects
          const hasDefects = Object.keys(record).some(key => {
            const value = record[key];
            return typeof value === 'string' && (
              value.toLowerCase() === 'fail' ||
              value.toLowerCase() === 'failed' ||
              value.toLowerCase() === 'ng' ||
              value.toLowerCase() === 'no'
            );
          });
          
          if (hasDefects) {
            stats[record.type][record.bu].defects++;
          }
        }
      }
    });

    // Calculate percentages
    Object.keys(stats).forEach(type => {
      BUSINESS_UNITS.forEach(bu => {
        const data = stats[type][bu];
        if (data.total > 0) {
          data.percentage = Math.round((data.inspected / data.total) * 100);
        }
      });
    });

    return { stats, allRecords };
  } catch (error) {
    console.error("Error fetching dashboard machine stats:", error);
    return { stats: {}, allRecords: [] };
  }
};

export interface DashboardMachineStatsByBU {
  [machineType: string]: {
    [site: string]: {
      inspected: number;
      total: number;
      percentage: number;
      defects: number;
      inspectionRecords: MachineInspectionRecord[];
    };
  };
}

export const getDashboardMachineStatsByBU = async (period?: string, bu?: string): Promise<{
  stats: DashboardMachineStatsByBU;
  allRecords: MachineInspectionRecord[];
}> => {
  try {
    console.log(`=== getDashboardMachineStatsByBU called for bu: ${bu}, period: ${period} ===`);
    
    // Get site mapping from vocabulary system with fallback
    const siteMapping = await getSiteMapping();
    const sites = siteMapping[bu || ""] || [];
    
    // Get form inspection periods for filtering
    const formInspectionPeriods = await getFormInspectionPeriods(bu);
    
    // Get all machines filtered by business unit
    const machineQuery = bu 
      ? firestore.collection("machine").where("bu", "==", bu)
      : firestore.collection("machine");
    const machineSnapshot = await machineQuery.get();
    
    // Get all inspection records filtered by business unit
    const inspectionQuery = bu
      ? firestore.collection("machinetr").where("bu", "==", bu)
      : firestore.collection("machinetr");
    const inspectionSnapshot = await inspectionQuery.get();
    
    // Create machine lookup map for site information
    const machineLookup: Record<string, Machine> = {};
    const machinesBySiteType: Record<string, Record<string, Machine[]>> = {};
    
    machineSnapshot.docs.forEach(doc => {
      const machine = { ...doc.data(), docId: doc.id } as Machine;
      const site = machine.site || "unknown";
      
      // Create lookup key: bu_type_id
      const lookupKey = `${machine.bu}_${machine.type}_${machine.id}`;
      machineLookup[lookupKey] = machine;
      
      // Group by site and type
      if (!machinesBySiteType[site]) {
        machinesBySiteType[site] = {};
      }
      if (!machinesBySiteType[site][machine.type]) {
        machinesBySiteType[site][machine.type] = [];
      }
      machinesBySiteType[site][machine.type].push(machine);
    });

    // Process inspection records and join with machine data for site information
    const allRecords: MachineInspectionRecord[] = inspectionSnapshot.docs.map(doc => {
      const recordData = doc.data();
      
      // Look up corresponding machine to get site information
      const lookupKey = `${recordData.bu}_${recordData.type}_${recordData.id}`;
      const correspondingMachine = machineLookup[lookupKey];
      const site = correspondingMachine?.site || "unknown";
      
      return {
        id: recordData.id,
        bu: recordData.bu,
        type: recordData.type,
        site: site, // Site comes from joined machine data
        inspector: recordData.inspector,
        timestamp: recordData.timestamp,
        createdAt: recordData.createdAt,
        remark: recordData.remark,
        images: recordData.images,
        docId: doc.id,
        ...recordData,
      } as MachineInspectionRecord;
    });

    // Initialize stats structure
    const stats: DashboardMachineStatsByBU = {};
    
    // Get all unique machine types from both collections
    const allMachineTypes = new Set<string>();
    Object.values(machinesBySiteType).forEach(siteMachines => {
      Object.keys(siteMachines).forEach(type => allMachineTypes.add(type));
    });
    allRecords.forEach(record => allMachineTypes.add(record.type));

    // Filter machine types based on form inspection periods and requested period
    const filteredMachineTypes = Array.from(allMachineTypes).filter(type => {
      const formPeriod = formInspectionPeriods[type];
      
      // If no period is specified, show all types
      if (!period) return true;
      
      // If form has inspection period defined, only show if it matches requested period
      if (formPeriod) {
        return formPeriod === period;
      }
      
      // If no form inspection period is defined, show in all periods (backward compatibility)
      return true;
    });

    // Initialize stats for filtered machine types only
    filteredMachineTypes.forEach(type => {
      stats[type] = {};
      sites.forEach(site => {
        stats[type][site] = {
          inspected: 0,
          total: 0,
          percentage: 0,
          defects: 0,
          inspectionRecords: []
        };
      });
    });


    // If no filtered types but we have machines, include all machine types found
    if (filteredMachineTypes.length === 0 && allMachineTypes.size > 0) {
      Array.from(allMachineTypes).forEach(type => {
        stats[type] = {};
        sites.forEach(site => {
          stats[type][site] = {
            inspected: 0,
            total: 0,
            percentage: 0,
            defects: 0,
            inspectionRecords: []
          };
        });
      });
    }

    // Set total machine counts for all types in stats
    Object.keys(machinesBySiteType).forEach(site => {
      Object.keys(machinesBySiteType[site]).forEach(type => {
        if (stats[type] && stats[type][site]) {
          stats[type][site].total = machinesBySiteType[site][type].length;
        }
      });
    });

    // Filter records by time period if specified
    let filteredRecords = allRecords;
    if (period) {
      const now = new Date();
      filteredRecords = allRecords.filter(record => {
        if (!record.timestamp) return false;
        
        const recordDate = convertFirebaseTimestamp(record.timestamp);
        if (!recordDate) return false;
        
        switch (period) {
          case "daily":
            // Check if the inspection was done within today local time
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            return recordDate >= todayStart && recordDate < todayEnd;
          case "monthly": 
            const daysDiffMonthly = (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysDiffMonthly <= 31;
          case "quarterly":
            const daysDiffQuarterly = (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysDiffQuarterly <= 90;
          case "annual":
            const daysDiffAnnually = (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysDiffAnnually <= 365;
          default:
            return true;
        }
      });
    }

    // Group filtered inspection records by site/type/id and get the latest for each machine
    const latestInspectionsByMachine: Record<string, MachineInspectionRecord> = {};
    
    filteredRecords.forEach(record => {
      const machineKey = `${record.site || "unknown"}_${record.type}_${record.id}`;
      const existingRecord = latestInspectionsByMachine[machineKey];
      
      if (!existingRecord) {
        latestInspectionsByMachine[machineKey] = record;
      } else {
        // Compare timestamps to keep the latest
        const recordDate = convertFirebaseTimestamp(record.timestamp);
        const existingDate = convertFirebaseTimestamp(existingRecord.timestamp);
        
        if (!recordDate || !existingDate) return;
        
        const recordTime = recordDate.getTime();
        const existingTime = existingDate.getTime();
        
        if (recordTime > existingTime) {
          latestInspectionsByMachine[machineKey] = record;
        }
      }
    });

    // Process latest inspection records to calculate stats (for all types in stats)
    Object.values(latestInspectionsByMachine).forEach(record => {
      const site = record.site || "unknown";
      
      // Only process records for machine types in stats and valid sites
      if (stats[record.type] && stats[record.type][site] && site !== "unknown") {
        // Only count if this machine actually exists in the machine collection
        const machineExists = machinesBySiteType[site]?.[record.type]?.some(m => m.id === record.id);
        
        if (machineExists) {
          stats[record.type][site].inspected++;
          stats[record.type][site].inspectionRecords.push(record);
          
          // Count defects
          const hasDefects = Object.keys(record).some(key => {
            const value = record[key];
            return typeof value === 'string' && (
              value.toLowerCase() === 'fail' ||
              value.toLowerCase() === 'failed' ||
              value.toLowerCase() === 'ng' ||
              value.toLowerCase() === 'no'
            );
          });
          
          if (hasDefects) {
            stats[record.type][site].defects++;
          }
        } else {
          console.log(`Warning: Inspection record for ${record.id} (${record.type}) found but no corresponding machine in site ${site}`);
        }
      }
    });

    // Calculate percentages
    Object.keys(stats).forEach(type => {
      sites.forEach(site => {
        const data = stats[type][site];
        if (data.total > 0) {
          data.percentage = Math.round((data.inspected / data.total) * 100);
        }
      });
    });

    // Final debug logging
    if (bu === "lk") {
      console.log("=== Final Sri Lanka Stats ===");
      console.log("Stats object keys:", Object.keys(stats));
      console.log("Stats structure:", JSON.stringify(stats, null, 2));
      console.log("Total records found:", allRecords.length);
    }

    return { stats, allRecords };
  } catch (error) {
    console.error("Error fetching dashboard machine stats by BU:", error);
    return { stats: {}, allRecords: [] };
  }
};
