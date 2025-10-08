"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumb";

// Country data with BU codes, names, flags, and sites
const COUNTRIES = [
  {
    code: "bd",
    name: "Bangladesh",
    flag: "🇧🇩",
    sites: ["PLANT"],
    siteCount: 1
  },
  {
    code: "cmic",
    name: "Cambodia",
    flag: "🇰🇭",
    sites: ["CMIC"],
    siteCount: 1
  },
  {
    code: "lk",
    name: "Sri Lanka",
    flag: "🇱🇰",
    sites: ["PCW", "RCW", "ELC", "HBP", "QUARRY"],
    siteCount: 5
  },
  {
    code: "th",
    name: "Thailand",
    flag: "🇹🇭",
    sites: ["SRB", "LOG", "OFFICE", "SUPPORT", "DRIVER", "SCCC", "ISUP", "CWT", "MORTAR", "ISUBS", "RAY", "CHO", "QUARRY", "PLANT3", "SKL", "PLANT2", "EBKK", "ISUBR", "ICHO"],
    siteCount: 19
  },
  {
    code: "vn",
    name: "Vietnam",
    flag: "🇻🇳",
    sites: ["HONC", "THIV", "CATL", "HIEP", "NHON", "CANT", "HO"],
    siteCount: 7
  }
];

export default function KPIPage() {
  return (
    <div className="container mx-auto p-6">
      <Breadcrumbs items={[{ label: "KPI" }]} />

      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold mb-4">Safety Inspection Dashboard</h1>
        <p className="text-gray-600">Select a country to view detailed inspection reports and statistics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {COUNTRIES.map((country) => (
          <Link key={country.code} href={`/kpi/${country.code}`}>
            <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group hover:scale-105 border-2 hover:border-blue-200">
              <CardHeader className="text-center pb-4">
                <div className="text-8xl mb-3 group-hover:scale-110 transition-transform duration-200">
                  {country.flag}
                </div>
                <CardTitle className="text-2xl font-bold group-hover:text-blue-600 transition-colors">
                  {country.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-sm font-medium text-gray-800 mb-2">
                  {country.siteCount} site{country.siteCount !== 1 ? 's' : ''}
                </div>
                <div className="text-xs text-gray-500 mb-4 leading-relaxed">
                  {country.sites.join(", ")}
                </div>
                <div className="mt-4 text-blue-600 text-sm font-medium group-hover:underline transition-all duration-200">
                  View Dashboard →
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}