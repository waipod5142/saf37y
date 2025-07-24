"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MachineInspectionRecord } from "@/types/machineInspectionRecord";
import { DashboardMachineStatsByBU } from "@/data/machines";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";

const SITE_MAPPING: Record<string, string[]> = {
  "th": ["ho"],
  "vn": ["honc", "catl"]
};

const BU_DISPLAY: Record<string, { name: string; flag: string }> = {
  "th": { name: "Thailand", flag: "🇹🇭" },
  "vn": { name: "Vietnam", flag: "🇻🇳" }
};

const MACHINE_TYPE_DISPLAY: Record<string, string> = {
  "car": "Vehicle",
  "lifting": "Lifting Equipment",
  "lifevest": "Life Vest"
};

const MACHINE_TYPE_ICONS: Record<string, string> = {
  "car": "🚗",
  "lifting": "🏗️",
  "lifevest": "🦺"
};


function getCompletionColor(percentage: number): string {
  if (percentage === 0) return "bg-gray-200 text-gray-600";
  if (percentage <= 33) return "bg-red-500 text-white";
  if (percentage <= 66) return "bg-yellow-500 text-white";
  if (percentage <= 99) return "bg-green-500 text-white";
  return "bg-green-200 text-green-800";
}


function DashboardTable({ stats, title, showDefects, sites }: { stats: DashboardMachineStatsByBU; title: string; showDefects: boolean; sites: string[] }) {
  const machineTypes = Object.keys(stats);
  
  if (machineTypes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No inspection data available for this period.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto shadow-sm">
          <table className="w-full border-collapse border border-gray-300 bg-white rounded-lg">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                <th className="border border-gray-300 p-3 text-left font-semibold text-gray-800 min-w-[200px]">Type</th>
                {sites.map(site => (
                  <th key={site} className="border border-gray-300 p-3 text-center font-semibold text-gray-800 min-w-[120px]">{site.toUpperCase()}</th>
                ))}
                <th className="border border-gray-300 p-3 text-center font-semibold text-gray-800 min-w-[80px]">Total</th>
              </tr>
            </thead>
            <tbody>
              {machineTypes.map(type => {
                const displayName = MACHINE_TYPE_DISPLAY[type] || type;
                const icon = MACHINE_TYPE_ICONS[type] || "🔧";
                
                let totalInspected = 0;
                
                return (
                  <tr key={type} className="hover:bg-gray-50 transition-colors">
                    <td className="border border-gray-300 p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{icon}</span>
                        <span className="font-medium text-gray-800">{displayName}</span>
                      </div>
                    </td>
                    {sites.map(site => {
                      const data = stats[type][site] || { inspected: 0, total: 0, percentage: 0, defects: 0, inspectionRecords: [] };
                      totalInspected += showDefects ? data.defects : data.inspected;
                      
                      const displayValue = showDefects ? data.defects : data.inspected;
                      const displayTotal = showDefects ? data.inspected : data.total;
                      const displayPercentage = showDefects ? 
                        (data.inspected > 0 ? Math.round((data.defects / data.inspected) * 100) : 0) : 
                        data.percentage;
                      
                      if (displayValue === 0) {
                        return (
                          <td key={site} className="border border-gray-300 p-3 text-center">
                            <span className="text-gray-400 font-medium">0</span>
                          </td>
                        );
                      }
                      
                      const colorClass = showDefects ? 
                        (displayValue > 0 ? "bg-red-500 text-white shadow-sm" : "bg-green-200 text-green-800") :
                        getCompletionColor(displayPercentage);
                      
                      return (
                        <td key={site} className="border border-gray-300 p-2 text-center">
                          <div className={`px-3 py-2 rounded-md text-sm font-semibold ${colorClass} inline-block min-w-[100px]`}>
                            {displayValue} / {displayTotal} ({displayPercentage}%)
                          </div>
                        </td>
                      );
                    })}
                    <td className="border border-gray-300 p-3 text-center">
                      <span className="font-bold text-lg text-gray-800">{totalInspected}</span>
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gradient-to-r from-gray-100 to-gray-50 font-bold border-t-2 border-gray-400">
                <td className="border border-gray-300 p-3 text-gray-800">Total</td>
                {sites.map(site => {
                  const siteTotal = machineTypes.reduce((sum, type) => 
                    sum + (showDefects ? (stats[type][site]?.defects || 0) : (stats[type][site]?.inspected || 0)), 0
                  );
                  return (
                    <td key={site} className="border border-gray-300 p-3 text-center text-gray-800">
                      {siteTotal}
                    </td>
                  );
                })}
                <td className="border border-gray-300 p-3 text-center text-gray-800">
                  {machineTypes.reduce((sum, type) => 
                    sum + sites.reduce((siteSum, site) => 
                      siteSum + (showDefects ? (stats[type][site]?.defects || 0) : (stats[type][site]?.inspected || 0)), 0
                    ), 0
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const params = useParams();
  const bu = params.bu as string;
  
  const [dashboardStats, setDashboardStats] = useState<{
    daily: DashboardMachineStatsByBU;
    monthly: DashboardMachineStatsByBU;
    quarterly: DashboardMachineStatsByBU;
    annually: DashboardMachineStatsByBU;
  }>({
    daily: {},
    monthly: {},
    quarterly: {},
    annually: {}
  });
  const [allRecords, setAllRecords] = useState<MachineInspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDefects, setShowDefects] = useState(false);
  
  const sites = SITE_MAPPING[bu] || [];
  const buInfo = BU_DISPLAY[bu] || { name: "Unknown", flag: "🏳️" };
  
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch stats for all periods
        const periods = ['daily', 'monthly', 'quarterly', 'annually'];
        const statsPromises = periods.map(async (period) => {
          const response = await fetch(`/api/dashboard-data?period=${period}&bu=${bu}`);
          const data = await response.json();
          return { period, stats: data.stats, records: data.records };
        });
        
        const results = await Promise.all(statsPromises);
        
        const newStats = {
          daily: {},
          monthly: {},
          quarterly: {},
          annually: {}
        };
        
        let allRecordsData: MachineInspectionRecord[] = [];
        
        results.forEach(({ period, stats, records }) => {
          newStats[period as keyof typeof newStats] = stats || {};
          if (period === 'annually') {
            // Use annual records as the complete dataset
            allRecordsData = records || [];
          }
        });
        
        setDashboardStats(newStats);
        setAllRecords(allRecordsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: buInfo.name },
        ]}
      />
      
      <div className="mt-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{buInfo.flag}</span>
          <h1 className="text-3xl font-bold">{buInfo.name} - Combined daily, monthly, quarterly, annually</h1>
        </div>
        
        <div className="flex items-center gap-6 mb-4">
          <span className="text-sm text-gray-600">
            {showDefects ? "Defects / Total Inspected ( % )" : "Inspected / Total Machines ( % )"}
          </span>
          <Button 
            variant={showDefects ? "destructive" : "outline"}
            size="sm"
            onClick={() => setShowDefects(!showDefects)}
            className={showDefects ? "bg-red-500" : ""}
          >
            {showDefects ? "Showing Defects" : "Show Defects"}
          </Button>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>0-33%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>34-66%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>67-99%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-200 rounded"></div>
            <span>100%</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading dashboard data...</div>
        </div>
      ) : Object.keys(dashboardStats.annually).length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="text-lg text-gray-600 mb-2">No inspection data available</div>
            <div className="text-sm text-gray-500">Please check if there are any inspection records in the database.</div>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
            <TabsTrigger value="daily" className="text-sm md:text-base">DAILY</TabsTrigger>
            <TabsTrigger value="monthly" className="text-sm md:text-base">MONTHLY</TabsTrigger>
            <TabsTrigger value="quarterly" className="text-sm md:text-base">QUARTERLY</TabsTrigger>
            <TabsTrigger value="annually" className="text-sm md:text-base">ANNUALLY</TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily">
            <DashboardTable 
              stats={dashboardStats.daily} 
              title="Daily Inspection Report"
              showDefects={showDefects}
              sites={sites}
            />
          </TabsContent>
          
          <TabsContent value="monthly">
            <DashboardTable 
              stats={dashboardStats.monthly} 
              title="Monthly Inspection Report"
              showDefects={showDefects}
              sites={sites}
            />
          </TabsContent>
          
          <TabsContent value="quarterly">
            <DashboardTable 
              stats={dashboardStats.quarterly} 
              title="Quarterly Inspection Report"
              showDefects={showDefects}
              sites={sites}
            />
          </TabsContent>
          
          <TabsContent value="annually">
            <DashboardTable 
              stats={dashboardStats.annually} 
              title="Annual Inspection Report"
              showDefects={showDefects}
              sites={sites}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}