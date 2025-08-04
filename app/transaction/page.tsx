"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { Clock, FileText, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import { formatRelativeDateTime } from "@/components/ui/date-utils";
import { getCountries, Country } from "@/lib/constants/countries";

interface TransactionSummary {
  [countryCode: string]: {
    totalToday: number;
    totalWeek: number;
    totalMonth: number;
    lastInspection?: string;
  };
}

export default function TransactionPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [transactionSummary, setTransactionSummary] = useState<TransactionSummary>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [globalStats, setGlobalStats] = useState({
    totalToday: 0,
    totalWeek: 0,
    totalMonth: 0
  });

  // Fetch countries data
  useEffect(() => {
    async function fetchCountries() {
      try {
        setCountriesLoading(true);
        const countriesData = await getCountries();
        setCountries(countriesData);
      } catch (err) {
        console.error("Error fetching countries:", err);
      } finally {
        setCountriesLoading(false);
      }
    }

    fetchCountries();
  }, []);

  const fetchTransactionSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add a small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Fetch summary data for all countries with timeout
      const summaryPromises = countries.map(async (country) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const response = await fetch(`/api/transaction-summary?bu=${country.code}`, {
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache',
            }
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          return { countryCode: country.code, ...data };
        } catch (error) {
          console.error(`Error fetching summary for ${country.code}:`, error);
          return { 
            countryCode: country.code, 
            totalToday: 0, 
            totalWeek: 0, 
            totalMonth: 0,
            error: true
          };
        }
      });
      
      const results = await Promise.all(summaryPromises);
      
      const summary: TransactionSummary = {};
      let globalToday = 0, globalWeek = 0, globalMonth = 0;
      let hasErrors = false;
      
      results.forEach(({ countryCode, totalToday, totalWeek, totalMonth, lastInspection, error: countryError }) => {
        summary[countryCode] = { totalToday, totalWeek, totalMonth, lastInspection };
        globalToday += totalToday;
        globalWeek += totalWeek;
        globalMonth += totalMonth;
        if (countryError) hasErrors = true;
      });
      
      setTransactionSummary(summary);
      setGlobalStats({
        totalToday: globalToday,
        totalWeek: globalWeek,
        totalMonth: globalMonth
      });
      
      if (hasErrors && globalToday === 0 && globalWeek === 0 && globalMonth === 0) {
        setError('Failed to load transaction data. Some services may be unavailable.');
      }
      
    } catch (error) {
      console.error('Error fetching transaction summary:', error);
      setError('Failed to load transaction data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [countries]);

  useEffect(() => {
    // Only fetch on client side to avoid SSR issues and wait for countries to load
    if (typeof window !== 'undefined' && countries.length > 0) {
      fetchTransactionSummary();
    }
  }, [retryCount, countries, fetchTransactionSummary]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Error boundary fallback
  if (error && !loading) {
    return (
      <div className="container mx-auto p-6">
        <Breadcrumbs
          items={[
            { label: "Latest Transactions" }
          ]}
        />
        
        <div className="mt-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Latest Machine Inspection Transactions</h1>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Transaction Data</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={handleRetry} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Breadcrumbs
        items={[
          { label: "Latest Transactions" }
        ]}
      />
      
      <div className="mt-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Latest Machine Inspection Transactions</h1>
        </div>
        <p className="text-gray-600">View recent machine inspection records and transaction history by country.</p>
      </div>

      {/* Global Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Today</p>
                <p className="text-2xl font-bold text-blue-800">
                  {loading ? (
                    <div className="w-12 h-8 bg-blue-200 rounded animate-pulse"></div>
                  ) : (
                    globalStats.totalToday
                  )}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">This Week</p>
                <p className="text-2xl font-bold text-green-800">
                  {loading ? (
                    <div className="w-12 h-8 bg-green-200 rounded animate-pulse"></div>
                  ) : (
                    globalStats.totalWeek
                  )}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">This Month</p>
                <p className="text-2xl font-bold text-purple-800">
                  {loading ? (
                    <div className="w-12 h-8 bg-purple-200 rounded animate-pulse"></div>
                  ) : (
                    globalStats.totalMonth
                  )}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Country Selection */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Select Country to View Latest Transactions</h2>
      </div>

      {countriesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gray-200 rounded mx-auto mb-3"></div>
                <div className="w-32 h-6 bg-gray-200 rounded mx-auto"></div>
              </CardHeader>
              <CardContent className="text-center">
                <div className="w-40 h-4 bg-gray-200 rounded mx-auto mb-4"></div>
                <div className="space-y-2 mb-4">
                  <div className="w-full h-4 bg-gray-200 rounded"></div>
                  <div className="w-full h-4 bg-gray-200 rounded"></div>
                  <div className="w-full h-4 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {countries.map((country) => {
            const summary = transactionSummary[country.code] || { totalToday: 0, totalWeek: 0, totalMonth: 0 };
            
            return (
              <Link key={country.code} href={`/transaction/${country.code}`}>
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
                    <div className="text-sm text-gray-600 mb-4">
                      {country.sites.length} site{country.sites.length !== 1 ? 's' : ''}: {country.sites.join(", ").toUpperCase()}
                    </div>
                    
                    {/* Transaction Statistics */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Today:</span>
                        {loading ? (
                          <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {summary.totalToday}
                          </Badge>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">This Week:</span>
                        {loading ? (
                          <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {summary.totalWeek}
                          </Badge>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">This Month:</span>
                        {loading ? (
                          <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {summary.totalMonth}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {summary.lastInspection && (
                      <div className="text-xs text-gray-500 mb-4">
                        Inspected: {formatRelativeDateTime(summary.lastInspection)}
                      </div>
                    )}
                    
                    <div className="mt-4 text-blue-600 text-sm font-medium group-hover:underline transition-all duration-200">
                      View Latest Transactions →
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}