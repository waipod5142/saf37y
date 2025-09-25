"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getCountries, Country } from "@/lib/constants/countries";

export default function DashboardPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCountries() {
      try {
        setLoading(true);
        setError(null);
        const countriesData = await getCountries();
        setCountries(countriesData);
      } catch (err) {
        console.error("Error fetching countries:", err);
        setError("Failed to load countries data");
      } finally {
        setLoading(false);
      }
    }

    fetchCountries();
  }, []);
  return (
    <div className="container mx-auto p-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard" }
        ]}
      />
      
      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold mb-4">Site Selection Dashboard</h1>
        <p className="text-gray-600">Select a specific site to view detailed inspection reports and statistics.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gray-200 rounded mx-auto mb-3"></div>
                <div className="w-32 h-6 bg-gray-200 rounded mx-auto"></div>
              </CardHeader>
              <CardContent className="text-center">
                <div className="w-24 h-4 bg-gray-200 rounded mx-auto mb-2"></div>
                <div className="w-40 h-3 bg-gray-200 rounded mx-auto"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {countries.map((country) => (
            <div key={country.code} className="space-y-4">
              <div className="flex items-center gap-4 border-b pb-3">
                <span className="text-4xl">{country.flag}</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{country.name}</h2>
                  <p className="text-sm text-gray-600">{country.sites.length} site{country.sites.length !== 1 ? 's' : ''} available</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {country.sites.map((site) => (
                  <Link key={site} href={`/dashboardbysite/${site}`}>
                    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group hover:scale-105 h-full">
                      <CardContent className="p-4 text-center h-full flex flex-col justify-center">
                        <div className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors mb-2">
                          {site.toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-500 mb-3">
                          {country.name}
                        </div>
                        <div className="text-blue-600 text-xs font-medium group-hover:underline transition-all duration-200">
                          View Site →
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}