import { getAllVocabulariesAction } from "@/lib/actions/vocabulary";

export interface Country {
  code: string;
  name: string;
  flag: string;
  sites: string[];
}

// Fallback data for backward compatibility
export const FALLBACK_COUNTRIES: Country[] = [
  {
    code: "th",
    name: "Thailand",
    flag: "🇹🇭",
    sites: ["srb", "log", "office", "support", "driver", "sccc", "isup", "cwt", "mortar", "isubs", "ray", "cho", "quarry", "plant3", "skl", "plant2", "ebkk", "isubr", "icho"]
  },
  {
    code: "vn", 
    name: "Vietnam",
    flag: "🇻🇳",
    sites: ["honc", "thiv", "catl", "hiep", "nhon", "cant", "ho"]
  },
  {
    code: "lk",
    name: "Sri Lanka", 
    flag: "🇱🇰",
    sites: ["pcw", "rcw", "elc", "hbp", "quarry"]
  },
  {
    code: "bd",
    name: "Bangladesh",
    flag: "🇧🇩", 
    sites: ["plant"]
  },
  {
    code: "cmic",
    name: "Cambodia",
    flag: "🇰🇭",
    sites: ["cmic"]
  }
];

// Fallback site mapping for backward compatibility
export const FALLBACK_SITE_MAPPING: Record<string, string[]> = {
  "th": ["srb", "log", "office", "support", "driver", "sccc", "isup", "cwt", "mortar", "isubs", "ray", "cho", "quarry", "plant3", "skl", "plant2", "ebkk", "isubr", "icho"],
  "vn": ["honc", "thiv", "catl", "hiep", "nhon", "cant", "ho"],
  "lk": ["pcw", "rcw", "elc", "hbp", "quarry"],
  "bd": ["plant"],
  "cmic": ["cmic"]
};

/**
 * Get countries data from vocabulary system with fallback
 */
export async function getCountries(): Promise<Country[]> {
  try {
    const result = await getAllVocabulariesAction();
    
    if (result.success && result.siteMapping && result.buDisplay) {
      // Convert vocabulary data to Country format
      const countries: Country[] = Object.keys(result.siteMapping).map(code => ({
        code,
        name: result.buDisplay![code]?.name || code.toUpperCase(),
        flag: result.buDisplay![code]?.flag || "",
        sites: result.siteMapping![code] || []
      }));
      
      return countries.length > 0 ? countries : FALLBACK_COUNTRIES;
    }
    
    return FALLBACK_COUNTRIES;
  } catch (error) {
    console.error("Error fetching countries from vocabulary:", error);
    return FALLBACK_COUNTRIES;
  }
}

/**
 * Get site mapping from vocabulary system with fallback
 */
export async function getSiteMapping(): Promise<Record<string, string[]>> {
  try {
    const result = await getAllVocabulariesAction();
    
    if (result.success && result.siteMapping) {
      return Object.keys(result.siteMapping).length > 0 
        ? result.siteMapping 
        : FALLBACK_SITE_MAPPING;
    }
    
    return FALLBACK_SITE_MAPPING;
  } catch (error) {
    console.error("Error fetching site mapping from vocabulary:", error);
    return FALLBACK_SITE_MAPPING;
  }
}

/**
 * Get sites for a specific business unit
 */
export async function getSitesForBU(bu: string): Promise<string[]> {
  try {
    const siteMapping = await getSiteMapping();
    return siteMapping[bu] || [];
  } catch (error) {
    console.error(`Error fetching sites for BU ${bu}:`, error);
    return FALLBACK_SITE_MAPPING[bu] || [];
  }
}