"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <h1 className="text-3xl font-bold mb-4">Safety Inspection Dashboard</h1>
        <p className="text-gray-600">Select a country to view detailed inspection reports and statistics.</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {countries.map((country) => (
            <Link key={country.code} href={`/dashboard/${country.code}`}>
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group hover:scale-105">
                  <CardHeader className="text-center pb-4">
                    <div className="text-6xl mb-3 group-hover:scale-110 transition-transform duration-200">
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
                  <div className="mt-4 text-blue-600 text-sm font-medium group-hover:underline transition-all duration-200">
                    View Dashboard →
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}