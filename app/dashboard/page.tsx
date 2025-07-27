"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import Link from "next/link";

const COUNTRIES = [
  {
    code: "th",
    name: "Thailand",
    flag: "🇹🇭",
    sites: ["ho", "srb", "log"]
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

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard" }
        ]}
      />
      
      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold mb-4">Safety Inspection Dashboard</h1>
        <p className="text-gray-600">Select a country to view detailed inspection reports and statistics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {COUNTRIES.map((country) => (
          <Link key={country.code} href={`/dashboard/${country.code}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="text-6xl mb-3 group-hover:scale-110 transition-transform">
                  {country.flag}
                </div>
                <CardTitle className="text-xl font-bold group-hover:text-blue-600 transition-colors">
                  {country.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-sm text-gray-600 mb-2">
                  {country.sites.length} site{country.sites.length !== 1 ? 's' : ''}
                </div>
                <div className="text-xs text-gray-500">
                  {country.sites.join(", ").toUpperCase()}
                </div>
                <div className="mt-4 text-blue-600 text-sm font-medium group-hover:underline">
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