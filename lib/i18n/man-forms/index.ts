import { th } from "./th";
import { vn } from "./vn";
import { lk } from "./lk";
import { bd } from "./bd";
import { cmic } from "./cmic";

// Type for all translations
export type ManFormTranslations = typeof th;

// Translations object
const translations: Record<string, ManFormTranslations> = {
  th,
  vn,
  lk,
  bd,
  cmic,
};

/**
 * Custom hook to get translations for Man forms based on business unit
 * @param bu - Business unit code (th, vn, lk, bd, cmic)
 * @returns Object containing translations (t) and business unit (bu)
 *
 * @example
 * const { t } = useManFormTranslation('vn');
 * console.log(t.toolbox.title); // "Thảo luận an toàn / Toolbox Talk"
 */
export function useManFormTranslation(bu: string = "th") {
  const t = translations[bu] || translations.th;
  return { t, bu };
}

// Export individual translations for direct access if needed
export { th, vn, lk, bd, cmic };
