import { firestore } from "@/firebase/server";
import { Machine } from "@/types/machine";
import { MachineInspectionRecord } from "@/types/machineInspectionRecord";
import { getFormInspectionPeriods, InspectionPeriod } from "./forms";
import "server-only";

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

export const getMachineInspectionCountry = async (
  bu: string,
): Promise<MachineInspectionRecord[]> => {
  try {
    // Query the machinetr collection with matching bu
    const inspectionQuery = firestore
      .collection("machinetr")
      .where("bu", "==", bu);

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

    // Sort by timestamp in descending order (latest first)
    records.sort((a, b) => {
      if (!a.timestamp || !b.timestamp) return 0;
      const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
      const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
      return bTime - aTime;
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
        
        const recordDate = record.timestamp.toDate ? record.timestamp.toDate() : new Date(record.timestamp);
        const daysDiff = (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24);
        
        switch (period) {
          case "daily":
            return daysDiff <= 1;
          case "monthly": 
            return daysDiff <= 30;
          case "quarterly":
            return daysDiff <= 90;
          case "annually":
            return daysDiff <= 365;
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
        const recordTime = record.timestamp?.toDate ? record.timestamp.toDate().getTime() : new Date(record.timestamp).getTime();
        const existingTime = existingRecord.timestamp?.toDate ? existingRecord.timestamp.toDate().getTime() : new Date(existingRecord.timestamp).getTime();
        
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
    const SITE_MAPPING: Record<string, string[]> = {
      "th": ["ho", "srb"],
      "vn": ["honc", "catl", "nhon", "thiv"]
    };
    
    const sites = SITE_MAPPING[bu || ""] || [];
    
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

    // Set total machine counts for filtered types only
    Object.keys(machinesBySiteType).forEach(site => {
      Object.keys(machinesBySiteType[site]).forEach(type => {
        if (filteredMachineTypes.includes(type) && stats[type] && stats[type][site]) {
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
        
        const recordDate = record.timestamp.toDate ? record.timestamp.toDate() : new Date(record.timestamp);
        const daysDiff = (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24);
        
        switch (period) {
          case "daily":
            return daysDiff <= 1;
          case "monthly": 
            return daysDiff <= 30;
          case "quarterly":
            return daysDiff <= 90;
          case "annually":
            return daysDiff <= 365;
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
        const recordTime = record.timestamp?.toDate ? record.timestamp.toDate().getTime() : new Date(record.timestamp).getTime();
        const existingTime = existingRecord.timestamp?.toDate ? existingRecord.timestamp.toDate().getTime() : new Date(existingRecord.timestamp).getTime();
        
        if (recordTime > existingTime) {
          latestInspectionsByMachine[machineKey] = record;
        }
      }
    });

    // Process latest inspection records to calculate stats (only for filtered types)
    Object.values(latestInspectionsByMachine).forEach(record => {
      const site = record.site || "unknown";
      
      // Only process records for filtered machine types
      if (filteredMachineTypes.includes(record.type) && stats[record.type] && stats[record.type][site]) {
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

    return { stats, allRecords };
  } catch (error) {
    console.error("Error fetching dashboard machine stats by BU:", error);
    return { stats: {}, allRecords: [] };
  }
};
