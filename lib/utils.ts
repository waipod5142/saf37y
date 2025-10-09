import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeBuCode(bu: string): string {
  const buMapping: Record<string, string> = {
    office: "th",
    srb: "th",
    mkt: "th",
    lbm: "th",
    rmx: "th",
    iagg: "th",
    ieco: "th",
    cmic: "kh",
  };
  return buMapping[bu.toLowerCase()] || bu;
}
