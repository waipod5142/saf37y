"use server";

import { getVocabularyByBu, getAllVocabularies } from "@/data/vocabulary";
import { Vocabulary } from "@/types/vocabulary";

export async function getVocabulary(
  bu: string
): Promise<{ success: boolean; vocabulary?: Vocabulary; error?: string }> {
  try {
    const vocabulary = await getVocabularyByBu(bu);
    
    if (!vocabulary) {
      return {
        success: false,
        error: "Vocabulary not found"
      };
    }

    return {
      success: true,
      vocabulary
    };
  } catch (error) {
    console.error("Error fetching vocabulary:", error);
    return {
      success: false,
      error: "Failed to fetch vocabulary"
    };
  }
}

export async function getAllVocabulariesAction(): Promise<{
  success: boolean;
  vocabularies?: Vocabulary[];
  siteMapping?: Record<string, string[]>;
  buDisplay?: Record<string, { name: string; flag: string }>;
  machineTypeMapping?: Record<string, string>;
  error?: string;
}> {
  try {
    const vocabularies = await getAllVocabularies();
    
    if (vocabularies.length === 0) {
      return {
        success: false,
        error: "No vocabularies found"
      };
    }

    // Build site mapping: { "th": ["ho", "srb", "log"], ... }
    const siteMapping: Record<string, string[]> = {};
    
    // Build BU display: { "th": { name: "Thailand", flag: "🇹🇭" }, ... }
    const buDisplay: Record<string, { name: string; flag: string }> = {};

    // Build machine type mapping with comprehensive machine type display names
    const machineTypeMapping: Record<string, string> = {
      // Core machine types
      "car": "Vehicle",
      "lifting": "Lifting Equipment", 
      "lifevest": "Life Vest",
      "forklift": "Forklift",
      "extinguisher": "Fire Extinguisher",
      "harness": "Safety Harness",
      "socket": "Electrical Socket",
      
      // Extended machine types from machine-types.ts
      "vehicle": "Vehicle",
      "truck": "Truck",
      "bulk": "Bulk Truck",
      "loader": "Loader",
      "excavator": "Excavator",
      "dump": "Dump Truck",
      "crane": "Crane",
      "overheadcrane": "Overhead Crane",
      "hoist": "Hoist",
      "mixer": "Mixer Truck",
      "motorbike": "Motorbike",
      "bag": "Bag Truck",
      
      // Fire Safety Equipment
      "hydrant": "Fire Hydrant",
      "foam": "Foam Tank",
      "pump": "Water Pump",
      "valve": "Water Valve",
      "firealarm": "Fire Alarm",
      "firepump": "Fire Pump",
      "fireexit": "Fire Exit",
      
      // Safety Equipment
      "fullbodyharness": "Full Body Harness",
      "fallarrest": "Fall Arrest System",
      "portable": "Portable Platform",
      "lifeline": "Safety Lifeline",
      "lifering": "Life Ring",
      "ladder": "Mobile Ladder",
      
      // Tools & Equipment
      "welding": "Welding Machine",
      "cable": "Power Cable",
      "electrical": "Electrical Equipment",
      "fan": "Ventilation Fan",
      "light": "Mobile Light",
      "compressor": "Air Compressor",
      "waterjet": "High Pressure Water Jet",
      
      // Medical & Emergency
      "aed": "AED",
      "firstaid": "First Aid Equipment",
      "firstaidbox": "First Aid Box",
      "emergency": "Emergency Equipment",
      "shower": "Emergency Shower",
      
      // Security & Monitoring
      "cctv": "CCTV System",
      
      // Other Equipment
      "equipment": "Equipment",
      "rescue": "Rescue Equipment",
      "plant": "Plant Equipment",
      "waste": "Waste Transport",
      "stock": "Stock Equipment",
      "thermal": "Thermal Equipment",
      "slope": "Slope Equipment",
      "liftinggear": "Lifting Gear",
      "mobile": "Mobile Equipment"
    };

    vocabularies.forEach(vocabulary => {
      if (vocabulary.bu) {
        // Add to site mapping
        siteMapping[vocabulary.bu] = vocabulary.sites || [];
        
        // Add to BU display
        buDisplay[vocabulary.bu] = {
          name: vocabulary.name || vocabulary.bu.toUpperCase(),
          flag: vocabulary.flag || ''
        };
      }
    });

    return {
      success: true,
      vocabularies,
      siteMapping,
      buDisplay,
      machineTypeMapping
    };
  } catch (error) {
    console.error("Error fetching all vocabularies:", error);
    return {
      success: false,
      error: "Failed to fetch vocabularies"
    };
  }
}