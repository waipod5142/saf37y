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
    code: "bd",
    name: "Bangladesh",
    flag: "🇧🇩",
    sites: ["plant"],
  },
  {
    code: "lk",
    name: "Sri Lanka",
    flag: "🇱🇰",
    sites: ["hbp", "pcw", "quarry", "rmx"],
  },
  {
    code: "th",
    name: "Thailand",
    flag: "🇹🇭",
    sites: [
      "cwt",
      "iagg",
      "log",
      "office",
      "rmx",
      "sccc",
      "srb",
      "support",
      "iecc",
      "lbm",
    ],
  },
  {
    code: "vn",
    name: "Vietnam",
    flag: "🇻🇳",
    sites: ["catl", "hiep", "honc", "thiv", "ho", "cant", "nhon"],
  },
  {
    code: "kh",
    name: "Cambodia",
    flag: "🇰🇭",
    sites: ["cmic"],
  },
];

// Fallback site mapping for backward compatibility
export const FALLBACK_SITE_MAPPING: Record<string, string[]> = {
  bd: ["plant"],
  lk: ["hbp", "pcw", "quarry", "rmx"],
  th: ["iagg", "log", "office", "rmx", "sccc", "srb", "support", "ieco", "lbm"],
  vn: ["catl", "hiep", "honc", "thiv", "ho", "cant", "nhon"],
  kh: ["cmic"],
};

/**
 * Get countries data from vocabulary system with fallback
 */
export async function getCountries(): Promise<Country[]> {
  try {
    const result = await getAllVocabulariesAction();

    if (result.success && result.siteMapping && result.buDisplay) {
      // Convert vocabulary data to Country format
      const countries: Country[] = Object.keys(result.siteMapping).map(
        (code) => ({
          code,
          name: result.buDisplay![code]?.name || code.toUpperCase(),
          flag: result.buDisplay![code]?.flag || "",
          sites: result.siteMapping![code] || [],
        })
      );

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
