"use client";

import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardMachineStatsByBU } from "@/data/machines";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { MachineListModal } from "@/components/MachineListModal";
import { getMachineEmoji } from "@/lib/machine-types";
import { getAllVocabulariesAction } from "@/lib/actions/vocabulary";

function getCompletionColor(percentage: number): string {
  if (percentage === 0) return "bg-gray-200 text-gray-600";
  if (percentage <= 33) return "bg-red-500 text-white";
  if (percentage <= 66) return "bg-yellow-500 text-white";
  if (percentage <= 99) return "bg-green-500 text-white";
  return "bg-green-200 text-green-800";
}

function DashboardTable({ stats, title, showDefects, sites, bu, machineTypeMapping }: { stats: DashboardMachineStatsByBU; title: string; showDefects: boolean; sites: string[]; bu: string; machineTypeMapping: Record<string, string> }) {
  const machineTypes = Object.keys(stats);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    bu: string;
    site: string;
    type: string;
  }>({
    isOpen: false,
    bu: "",
    site: "",
    type: "",
  });

  const handleCellClick = (bu: string, site: string, type: string, hasData: boolean) => {
    console.log("=== Dashboard Cell Click ===");
    console.log("Click parameters:", { bu, site, type, hasData });
    
    if (hasData) {
      console.log("Opening modal with state:", { bu, site, type });
      setModalState({
        isOpen: true,
        bu,
        site,
        type,
      });
    } else {
      console.log("Cell click ignored - no data available");
    }
  };

  const handleModalClose = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };
  
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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto shadow-sm">
            <table className="w-full border-collapse border border-gray-300 bg-white rounded-lg">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="border border-gray-300 p-3 text-left font-semibold text-gray-800 min-w-[200px]">Machine Type</th>
                  <th className="border border-gray-300 p-3 text-center font-semibold text-gray-800 min-w-[120px]">Inspection Status</th>
                </tr>
              </thead>
              <tbody>
              {machineTypes.map(type => {
                const displayName = machineTypeMapping[type] || type;
                const icon = getMachineEmoji(type) || "🔧";

                // Get data for the single site (sites array now contains only one site)
                const siteData = stats[type][sites[0]] || { inspected: 0, total: 0, percentage: 0, defects: 0, inspectionRecords: [] };

                const displayValue = showDefects ? siteData.defects : siteData.inspected;
                const displayTotal = showDefects ? siteData.inspected : siteData.total;
                const displayPercentage = showDefects ?
                  (siteData.inspected > 0 ? Math.round((siteData.defects / siteData.inspected) * 100) : 0) :
                  siteData.percentage;

                const colorClass = showDefects ?
                  (displayValue > 0 ? "bg-red-500 text-white shadow-sm" : "bg-green-200 text-green-800") :
                  getCompletionColor(displayPercentage);

                const hasData = displayTotal > 0;

                return (
                  <tr key={type} className="hover:bg-gray-50 transition-colors">
                    <td className="border border-gray-300 p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{icon}</span>
                        <span className="font-medium text-gray-800">{displayName}</span>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3 text-center">
                      {displayValue === 0 && displayTotal === 0 ? (
                        <span className="text-gray-400 font-medium">No data</span>
                      ) : (
                        <div
                          className={`px-4 py-2 rounded-md text-sm font-semibold ${colorClass} inline-block ${
                            hasData ? 'cursor-pointer hover:opacity-80 hover:scale-105 transition-all duration-200' : ''
                          }`}
                          onClick={hasData ? () => handleCellClick(bu, sites[0], type, hasData) : undefined}
                        >
                          {displayValue} / {displayTotal} ({displayPercentage}%)
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gradient-to-r from-gray-100 to-gray-50 font-bold border-t-2 border-gray-400">
                <td className="border border-gray-300 p-3 text-gray-800">Overall Total</td>
                <td className="border border-gray-300 p-3 text-center">
                  {(() => {
                    const totalInspected = machineTypes.reduce((sum, type) =>
                      sum + (stats[type][sites[0]]?.inspected || 0), 0
                    );
                    const totalDefects = machineTypes.reduce((sum, type) =>
                      sum + (stats[type][sites[0]]?.defects || 0), 0
                    );
                    const totalMachines = machineTypes.reduce((sum, type) =>
                      sum + (stats[type][sites[0]]?.total || 0), 0
                    );

                    const displayValue = showDefects ? totalDefects : totalInspected;
                    const displayTotal = showDefects ? totalInspected : totalMachines;
                    const displayPercentage = showDefects ?
                      (totalInspected > 0 ? Math.round((totalDefects / totalInspected) * 100) : 0) :
                      (totalMachines > 0 ? Math.round((totalInspected / totalMachines) * 100) : 0);

                    if (displayValue === 0 && displayTotal === 0) {
                      return <span className="text-gray-400 font-bold">No data</span>;
                    }

                    const colorClass = showDefects ?
                      (displayValue > 0 ? "bg-red-500 text-white shadow-sm" : "bg-green-200 text-green-800") :
                      getCompletionColor(displayPercentage);

                    return (
                      <div className={`px-4 py-2 rounded-md text-sm font-bold ${colorClass} inline-block`}>
                        {displayValue} / {displayTotal} ({displayPercentage}%)
                      </div>
                    );
                  })()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <MachineListModal
      isOpen={modalState.isOpen}
      onClose={handleModalClose}
      bu={modalState.bu}
      site={modalState.site}
      type={modalState.type}
      siteName={modalState.site.toUpperCase()}
      typeName={machineTypeMapping[modalState.type] || modalState.type}
    />
  </>
  );
}

export default function DashboardPage() {
  const params = useParams();
  const site = params.site as string;

  // State to store the determined BU for this site
  const [bu, setBu] = useState<string>("");
  
  const [dashboardStats, setDashboardStats] = useState<{
    daily: DashboardMachineStatsByBU;
    monthly: DashboardMachineStatsByBU;
    quarterly: DashboardMachineStatsByBU;
    annual: DashboardMachineStatsByBU;
  }>({
    daily: {},
    monthly: {},
    quarterly: {},
    annual: {}
  });
  const [loading, setLoading] = useState(true);
  const [showDefects, setShowDefects] = useState(false);
  const [vocabularyLoading, setVocabularyLoading] = useState(true);
  const [siteMapping, setSiteMapping] = useState<Record<string, string[]>>({});
  const [buDisplay, setBuDisplay] = useState<Record<string, { name: string | null; flag: string | null }>>({});
  const [machineTypeMapping, setMachineTypeMapping] = useState<Record<string, string>>({});
  
  // For single site view, we only need the current site
  const sites = [site];
  const buInfo = buDisplay[bu] || { name: null, flag: null };
  
  // Fetch vocabulary data on component mount
  useEffect(() => {
    async function fetchVocabularies() {
      try {
        setVocabularyLoading(true);
        const result = await getAllVocabulariesAction();
        
        if (result.success && result.siteMapping && result.buDisplay) {
          setSiteMapping(result.siteMapping);
          setBuDisplay(result.buDisplay);
          if (result.machineTypeMapping) {
            setMachineTypeMapping(result.machineTypeMapping);
          }

          // Determine which BU this site belongs to
          let foundBu = "";
          Object.entries(result.siteMapping).forEach(([buCode, sitesList]) => {
            if (sitesList.includes(site)) {
              foundBu = buCode;
            }
          });
          setBu(foundBu);
        } else {
          console.warn('Failed to load vocabularies, using fallback data:', result.error);
        }
      } catch (error) {
        console.error('Error fetching vocabularies:', error);
      } finally {
        setVocabularyLoading(false);
      }
    }
    
    fetchVocabularies();
  }, []);
  
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch stats for all periods
        const periods = ['daily', 'monthly', 'quarterly', 'annual'];
        const statsPromises = periods.map(async (period) => {
          const response = await fetch(`/api/dashboard-data?period=${period}&bu=${bu}&site=${site}`);
          const data = await response.json();
          return { period, stats: data.stats, records: data.records };
        });
        
        const results = await Promise.all(statsPromises);
        
        const newStats = {
          daily: {},
          monthly: {},
          quarterly: {},
          annual: {}
        };
        
        results.forEach(({ period, stats }) => {
          newStats[period as keyof typeof newStats] = stats || {};
        });
        
        setDashboardStats(newStats);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    // Only fetch data once we have determined the BU
    if (bu) {
      fetchData();
    }
  }, [bu, site]);

  return (
    <div className="container mx-auto p-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard by site", href: "/dashboardbysite" },
          { label: vocabularyLoading ? "Loading..." : (buInfo.name || "Unknown"), href: `/dashboard/${bu}` },
          { label: site.toUpperCase() },
        ]}
      />
      
      <div className="mt-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">
            {vocabularyLoading ? (
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              buInfo.flag || "🏳️"
            )}
          </span>
          <h1 className="text-3xl font-bold">
            {vocabularyLoading ? (
              <div className="w-64 h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              `${buInfo.name || "Unknown"} - ${site.toUpperCase()} Site Dashboard`
            )}
          </h1>
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
            <span>1-33%</span>
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
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
            <div className="text-lg text-gray-600">Loading dashboard data...</div>
          </div>
        </div>
      ) : sites.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="text-lg text-gray-600 mb-2">No site data available</div>
            <div className="text-sm text-gray-500">Unable to load site configuration for this business unit.</div>
          </div>
        </div>
      ) : Object.keys(dashboardStats.annual).length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="text-lg text-gray-600 mb-2">No machine data available</div>
            <div className="text-sm text-gray-500">Please check if there are any machines registered for this business unit.</div>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
            <TabsTrigger value="daily" className="text-sm md:text-base">DAILY</TabsTrigger>
            <TabsTrigger value="monthly" className="text-sm md:text-base">MONTHLY</TabsTrigger>
            <TabsTrigger value="quarterly" className="text-sm md:text-base">QUARTERLY</TabsTrigger>
            <TabsTrigger value="annual" className="text-sm md:text-base">ANNUAL</TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily">
            <DashboardTable 
              stats={dashboardStats.daily} 
              title="Daily Inspection Report"
              showDefects={showDefects}
              sites={sites}
              bu={bu}
              machineTypeMapping={machineTypeMapping}
            />
          </TabsContent>

          <TabsContent value="monthly">
            <DashboardTable 
              stats={dashboardStats.monthly} 
              title="Monthly Inspection Report"
              showDefects={showDefects}
              sites={sites}
              bu={bu}
              machineTypeMapping={machineTypeMapping}
            />
          </TabsContent>
          
          <TabsContent value="quarterly">
            <DashboardTable 
              stats={dashboardStats.quarterly} 
              title="Quarterly Inspection Report"
              showDefects={showDefects}
              sites={sites}
              bu={bu}
              machineTypeMapping={machineTypeMapping}
            />
          </TabsContent>
          
          <TabsContent value="annual">
            <DashboardTable 
              stats={dashboardStats.annual} 
              title="Annual Inspection Report"
              showDefects={showDefects}
              sites={sites}
              bu={bu}
              machineTypeMapping={machineTypeMapping}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}