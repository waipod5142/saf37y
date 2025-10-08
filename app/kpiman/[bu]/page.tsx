"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Calendar,
  Eye,
  CheckCircle2,
} from "lucide-react";

interface InspectionData {
  inspected: number;
  defected: number;
  total: number;
  percentage: number;
  defectPercentage: number;
  bySite?: Record<string, {
    inspected: number;
    defected: number;
    total: number;
    percentage: number;
    defectPercentage: number;
  }>;
}

interface KPIInspectionData {
  success: boolean;
  bu: string;
  frequency: string;
  data: {
    byType: Record<string, InspectionData>;
    bySite: Record<string, InspectionData>;
    total: InspectionData;
  };
  timestamp: string;
}

// Business Unit display names
const BU_NAMES: Record<string, string> = {
  vn: "Vietnam",
  th: "Thailand",
  lk: "Sri Lanka",
  bd: "Bangladesh",
  cmic: "Cambodia",
};

// Business Unit flags
const BU_FLAGS: Record<string, string> = {
  vn: "🇻🇳",
  th: "🇹🇭",
  lk: "🇱🇰",
  bd: "🇧🇩",
  cmic: "🇰🇭",
};

// Man type icons
const MAN_TYPE_ICONS: Record<string, string> = {
  employee: "👷",
  contractors: "🔨",
  vendor: "📦",
};

function getPercentageColor(percentage: number): string {
  if (percentage === 0) return "text-gray-500";
  if (percentage <= 33) return "text-red-600 bg-red-50";
  if (percentage <= 66) return "text-yellow-600 bg-yellow-50";
  if (percentage <= 99) return "text-green-600 bg-green-50";
  return "text-emerald-700 bg-emerald-50";
}

function getPercentageBadgeColor(percentage: number): string {
  if (percentage === 0) return "bg-gray-200 text-gray-600";
  if (percentage <= 33) return "bg-red-500 text-white";
  if (percentage <= 66) return "bg-yellow-500 text-white";
  if (percentage <= 99) return "bg-green-500 text-white";
  return "bg-emerald-600 text-white";
}

interface InspectionTableProps {
  data: KPIInspectionData;
  frequency: string;
  showDefects: boolean;
  bu: string;
}

function InspectionTable({ data, frequency, showDefects, bu }: InspectionTableProps) {
  if (!data.success) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load inspection data</p>
      </div>
    );
  }

  const { byType, bySite, total } = data.data;

  // Get all unique sites across all man types
  const allSites = new Set<string>();
  Object.values(byType).forEach(manType => {
    if (manType.bySite) {
      Object.keys(manType.bySite).forEach(site => allSites.add(site));
    }
  });

  const siteList = Array.from(allSites).sort();

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Inspected</p>
                <p className="text-2xl font-bold">{total.inspected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Personnel</p>
                <p className="text-2xl font-bold">{total.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className={`h-5 w-5 rounded ${getPercentageColor(total.percentage)}`}></div>
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">{total.percentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inspection Report Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {frequency.charAt(0).toUpperCase() + frequency.slice(1)} Personnel Inspection Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Type</th>
                  {siteList.map(site => (
                    <th key={site} className="text-center p-3 font-semibold uppercase">
                      {site}
                    </th>
                  ))}
                  <th className="text-center p-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byType).map(([type, manTypeData]) => (
                  <tr key={type} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {MAN_TYPE_ICONS[type] || "👤"}
                        </span>
                        <span className="font-medium capitalize">
                          {type}
                        </span>
                      </div>
                    </td>
                    {siteList.map(site => {
                      const siteData = manTypeData.bySite?.[site];
                      if (!siteData || siteData.total === 0) {
                        return (
                          <td key={site} className="text-center p-3 text-gray-400">
                            -
                          </td>
                        );
                      }
                      return (
                        <td key={site} className="text-center p-3">
                          <div className="flex flex-col items-center gap-1">
                            <Badge
                              className={`text-xs font-medium ${getPercentageBadgeColor(siteData.percentage)}`}
                            >
                              {siteData.inspected} / {siteData.total} ({siteData.percentage}%)
                            </Badge>
                          </div>
                        </td>
                      );
                    })}
                    <td className="text-center p-3">
                      <div className="flex flex-col items-center gap-1">
                        <Badge
                          className={`font-semibold ${getPercentageBadgeColor(manTypeData.percentage)}`}
                        >
                          {manTypeData.inspected} / {manTypeData.total} ({manTypeData.percentage}%)
                        </Badge>
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="border-t-2 bg-gray-50 font-semibold">
                  <td className="p-3 font-bold">Total</td>
                  {siteList.map(site => {
                    const siteData = bySite[site];
                    if (!siteData || siteData.total === 0) {
                      return (
                        <td key={site} className="text-center p-3 text-gray-400">
                          -
                        </td>
                      );
                    }
                    return (
                      <td key={site} className="text-center p-3">
                        <div className="flex flex-col items-center gap-1">
                          <Badge
                            className={`font-bold ${getPercentageBadgeColor(siteData.percentage)}`}
                          >
                            {siteData.inspected} / {siteData.total} ({siteData.percentage}%)
                          </Badge>
                        </div>
                      </td>
                    );
                  })}
                  <td className="text-center p-3">
                    <div className="flex flex-col items-center gap-1">
                      <Badge
                        className={`font-bold text-base px-3 py-1 ${getPercentageBadgeColor(total.percentage)}`}
                      >
                        {total.inspected} / {total.total} ({total.percentage}%)
                      </Badge>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BUKPIPage() {
  const params = useParams();
  const bu = params.bu as string;

  const [dailyData, setDailyData] = useState<KPIInspectionData | null>(null);
  const [monthlyData, setMonthlyData] = useState<KPIInspectionData | null>(null);
  const [quarterlyData, setQuarterlyData] = useState<KPIInspectionData | null>(null);
  const [annualData, setAnnualData] = useState<KPIInspectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState("daily");
  const [showDefects, setShowDefects] = useState(false);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://mandashboard-874085997493.asia-southeast1.run.app/mandashboard?bu=${bu}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('Failed to load man KPI data');
      }

      // Map the new API structure to the existing state
      setDailyData({
        success: true,
        bu: data.bu,
        frequency: 'daily',
        data: data.kpiData.daily,
        timestamp: data.timestamp
      });

      setMonthlyData({
        success: true,
        bu: data.bu,
        frequency: 'monthly',
        data: data.kpiData.monthly,
        timestamp: data.timestamp
      });

      setQuarterlyData({
        success: true,
        bu: data.bu,
        frequency: 'weekly',
        data: data.kpiData.weekly,
        timestamp: data.timestamp
      });

      setAnnualData({
        success: true,
        bu: data.bu,
        frequency: 'annual',
        data: data.kpiData.annual,
        timestamp: data.timestamp
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching Man KPI data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bu) {
      fetchAllData();
      // Refresh data every 5 minutes
      const interval = setInterval(fetchAllData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [bu]);

  const buName = BU_NAMES[bu?.toLowerCase()] || bu?.toUpperCase();
  const buFlag = BU_FLAGS[bu?.toLowerCase()] || "🏢";


  if (loading && !dailyData) {
    return (
      <div className="container mx-auto p-6">
        <Breadcrumbs
          items={[
            { label: "Man KPI Dashboard", href: "/kpiman" },
            { label: `${buName} Personnel Report` }
          ]}
        />
        <div className="mt-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl">{buFlag}</div>
            <div>
              <h1 className="text-3xl font-bold">{buName} Personnel Safety Observation</h1>
              <div className="w-64 h-4 bg-gray-200 rounded animate-pulse mt-2"></div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Breadcrumbs
          items={[
            { label: "Man KPI Dashboard", href: "/kpiman" },
            { label: `${buName} Personnel Report` }
          ]}
        />
        <div className="mt-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/kpiman">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Overview
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl">{buFlag}</div>
            <div>
              <h1 className="text-3xl font-bold">{buName} Personnel Safety Observation</h1>
            </div>
          </div>
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load {buName} Personnel Data</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={fetchAllData} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
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
          { label: "Man KPI Dashboard", href: "/kpiman" },
          { label: buName }
        ]}
      />

      {/* Header */}
      <div className="mt-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
            <Button
              onClick={fetchAllData}
              variant="outline"
              size="sm"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="text-4xl">{buFlag}</div>
          <div>
            <h1 className="text-3xl font-bold">
              {buName} Personnel Safety Observation
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Click each tab to view daily, weekly, monthly, and annual reports
            </p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium mb-2">Inspected / Total Personnel ( % )</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-xs">1-33%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-xs">34-66%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-xs">67-99%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-emerald-600 rounded"></div>
                  <span className="text-xs">100%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily" className="font-semibold">DAILY</TabsTrigger>
          <TabsTrigger value="monthly" className="font-semibold">MONTHLY</TabsTrigger>
          <TabsTrigger value="quarterly" className="font-semibold">WEEKLY</TabsTrigger>
          <TabsTrigger value="annual" className="font-semibold">ANNUAL</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          {dailyData && <InspectionTable data={dailyData} frequency="daily" showDefects={showDefects} bu={bu} />}
        </TabsContent>

        <TabsContent value="monthly">
          {monthlyData && <InspectionTable data={monthlyData} frequency="monthly" showDefects={showDefects} bu={bu} />}
        </TabsContent>

        <TabsContent value="quarterly">
          {quarterlyData && <InspectionTable data={quarterlyData} frequency="weekly" showDefects={showDefects} bu={bu} />}
        </TabsContent>

        <TabsContent value="annual">
          {annualData && <InspectionTable data={annualData} frequency="annual" showDefects={showDefects} bu={bu} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}