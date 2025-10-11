"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MachineListModal } from "@/components/MachineListModal";
import { getAllVocabulariesAction } from "@/lib/actions/vocabulary";
import { getMachineEmoji } from "@/lib/machine-types";
import { FALLBACK_COUNTRIES } from "@/lib/constants/countries";
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Calendar,
  Eye,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface InspectionData {
  inspected: number;
  defected: number;
  total: number;
  percentage: number;
  defectPercentage: number;
}

interface KPIInspectionData {
  success: boolean;
  bu: string;
  site?: string;
  frequency: string;
  data: {
    byType: Record<string, InspectionData>;
    total: InspectionData;
  };
  timestamp: string;
}

// Business Unit display names and flags from constants
const BU_NAMES: Record<string, string> = Object.fromEntries(
  FALLBACK_COUNTRIES.map((c) => [c.code, c.name])
);

const BU_FLAGS: Record<string, string> = Object.fromEntries(
  FALLBACK_COUNTRIES.map((c) => [c.code, c.flag])
);

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
  site: string;
  machineTypeMapping: Record<string, string>;
}

function InspectionTable({
  data,
  frequency,
  showDefects,
  bu,
  site,
  machineTypeMapping,
}: InspectionTableProps) {
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

  const handleCellClick = (
    bu: string,
    site: string,
    type: string,
    hasData: boolean
  ) => {
    if (hasData) {
      setModalState({
        isOpen: true,
        bu,
        site,
        type,
      });
    }
  };

  const handleModalClose = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  if (!data.success) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load inspection data</p>
      </div>
    );
  }

  const { byType, total } = data.data;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Total Defects</p>
                <p className="text-2xl font-bold text-red-600">
                  {total.defected}
                </p>
                <p className="text-xs text-gray-500">
                  {total.defectPercentage}% of inspected
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Machines</p>
                <p className="text-2xl font-bold">{total.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div
                className={`h-5 w-5 rounded ${getPercentageColor(total.percentage)}`}
              ></div>
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
            {frequency.charAt(0).toUpperCase() + frequency.slice(1)} Inspection
            Report - {site.toUpperCase()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Type</th>
                  <th className="text-center p-3 font-semibold">Inspected</th>
                  <th className="text-center p-3 font-semibold">Total</th>
                  <th className="text-center p-3 font-semibold">Percentage</th>
                  {showDefects && (
                    <th className="text-center p-3 font-semibold">Defects</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {Object.entries(byType).map(([type, equipment]) => {
                  const hasData = equipment.total > 0;
                  return (
                    <tr key={type} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {getMachineEmoji(type) || "🔧"}
                          </span>
                          <span className="font-medium capitalize">
                            {machineTypeMapping[type] ||
                              type
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (str) => str.toUpperCase())}
                          </span>
                        </div>
                      </td>
                      <td className="text-center p-3">
                        <span
                          className={`font-semibold ${hasData ? "cursor-pointer hover:underline" : ""}`}
                          onClick={() =>
                            handleCellClick(bu, site, type, hasData)
                          }
                        >
                          {equipment.inspected}
                        </span>
                      </td>
                      <td className="text-center p-3">
                        <span
                          className={`font-semibold ${hasData ? "cursor-pointer hover:underline" : ""}`}
                          onClick={() =>
                            handleCellClick(bu, site, type, hasData)
                          }
                        >
                          {equipment.total}
                        </span>
                      </td>
                      <td className="text-center p-3">
                        <Badge
                          className={`font-semibold ${getPercentageBadgeColor(equipment.percentage)} ${hasData ? "cursor-pointer hover:ring-2 hover:ring-offset-1" : ""}`}
                          onClick={() =>
                            handleCellClick(bu, site, type, hasData)
                          }
                        >
                          {equipment.percentage}%
                        </Badge>
                      </td>
                      {showDefects && (
                        <td className="text-center p-3">
                          {equipment.defected > 0 ? (
                            <Badge
                              variant="destructive"
                              className={`text-xs ${hasData ? "cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-red-300" : ""}`}
                              onClick={() =>
                                handleCellClick(bu, site, type, hasData)
                              }
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {equipment.defected} ({equipment.defectPercentage}
                              %)
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
                {/* Total Row */}
                <tr className="border-t-2 bg-gray-50 font-semibold">
                  <td className="p-3 font-bold">Total</td>
                  <td className="text-center p-3">
                    <span className="font-bold">{total.inspected}</span>
                  </td>
                  <td className="text-center p-3">
                    <span className="font-bold">{total.total}</span>
                  </td>
                  <td className="text-center p-3">
                    <Badge
                      className={`font-bold text-base px-3 py-1 ${getPercentageBadgeColor(total.percentage)}`}
                    >
                      {total.percentage}%
                    </Badge>
                  </td>
                  {showDefects && (
                    <td className="text-center p-3">
                      {total.defected > 0 ? (
                        <Badge
                          variant="destructive"
                          className="text-sm font-bold"
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          {total.defected} ({total.defectPercentage}%)
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  )}
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
        typeName={
          machineTypeMapping[modalState.type] ||
          modalState.type.charAt(0).toUpperCase() + modalState.type.slice(1)
        }
      />
    </div>
  );
}

export default function SiteKPIPage() {
  const params = useParams();
  const bu = params.bu as string;
  const site = params.site as string;

  const [dailyData, setDailyData] = useState<KPIInspectionData | null>(null);
  const [monthlyData, setMonthlyData] = useState<KPIInspectionData | null>(
    null
  );
  const [quarterlyData, setQuarterlyData] = useState<KPIInspectionData | null>(
    null
  );
  const [annualData, setAnnualData] = useState<KPIInspectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState("daily");
  const [showDefects, setShowDefects] = useState(false);
  const [machineTypeMapping, setMachineTypeMapping] = useState<
    Record<string, string>
  >({});

  const fetchData = async (frequency: string) => {
    try {
      const response = await fetch(
        `https://dashboard-874085997493.asia-southeast1.run.app/kpi?bu=${bu}&site=${site}&frequency=${frequency}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error(`Error fetching ${frequency} KPI data:`, err);
      throw err;
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [daily, monthly, quarterly, annual] = await Promise.all([
        fetchData("daily"),
        fetchData("monthly"),
        fetchData("quarterly"),
        fetchData("annual"),
      ]);

      setDailyData(daily);
      setMonthlyData(monthly);
      setQuarterlyData(quarterly);
      setAnnualData(annual);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching site KPI data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch vocabulary data on component mount
  useEffect(() => {
    async function fetchVocabularies() {
      try {
        const result = await getAllVocabulariesAction();

        if (result.success && result.machineTypeMapping) {
          setMachineTypeMapping(result.machineTypeMapping);
        }
      } catch (error) {
        console.error("Error fetching vocabularies:", error);
      }
    }

    fetchVocabularies();
  }, []);

  useEffect(() => {
    if (bu && site) {
      fetchAllData();
      // Refresh data every 5 minutes
      const interval = setInterval(fetchAllData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [bu, site]);

  const buName = BU_NAMES[bu?.toLowerCase()] || bu?.toUpperCase();
  const buFlag = BU_FLAGS[bu?.toLowerCase()] || "🏢";
  const siteName = site?.toUpperCase() || site;

  if (loading && !dailyData) {
    return (
      <div className="container mx-auto p-6">
        <Breadcrumbs
          items={[
            { label: "Machine KPI", href: "/kpi" },
            { label: buName, href: `/kpi/${bu}` },
            { label: siteName },
          ]}
        />
        <div className="mt-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl">{buFlag}</div>
            <div>
              <h1 className="text-3xl font-bold">
                {buName} - {siteName}
              </h1>
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
            { label: "Machine KPI", href: "/kpi" },
            { label: buName, href: `/kpi/${bu}` },
            { label: siteName },
          ]}
        />
        <div className="mt-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href={`/kpi/${bu}`}>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to {buName}
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl">{buFlag}</div>
            <div>
              <h1 className="text-3xl font-bold">
                {buName} - {siteName}
              </h1>
            </div>
          </div>
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Unable to Load {siteName} Inspection Data
            </h3>
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
          { label: "Machine KPI", href: "/kpi" },
          { label: buName, href: `/kpi/${bu}` },
          { label: siteName },
        ]}
      />

      {/* Header */}
      <div className="mt-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href={`/kpi/${bu}`}>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to {buName}
              </Button>
            </Link>
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
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="text-4xl">{buFlag}</div>
          <div>
            <h1 className="text-3xl font-bold">
              {buName} - {siteName}
            </h1>
            <p className="text-gray-600">
              Site-specific inspection dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium mb-2">
                Inspection Completion Rate
              </p>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDefects(!showDefects)}
              className={`flex items-center gap-2 ${showDefects ? "border-green-500 hover:border-green-600" : "border-red-500 hover:border-red-600"}`}
            >
              <Eye className="h-4 w-4" />
              {showDefects ? "HIDE" : "SHOW"} DEFECTS
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily" className="font-semibold">
            DAILY
          </TabsTrigger>
          <TabsTrigger value="monthly" className="font-semibold">
            MONTHLY
          </TabsTrigger>
          <TabsTrigger value="quarterly" className="font-semibold">
            QUARTERLY
          </TabsTrigger>
          <TabsTrigger value="annual" className="font-semibold">
            ANNUAL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          {dailyData && (
            <InspectionTable
              data={dailyData}
              frequency="daily"
              showDefects={showDefects}
              bu={bu}
              site={site}
              machineTypeMapping={machineTypeMapping}
            />
          )}
        </TabsContent>

        <TabsContent value="monthly">
          {monthlyData && (
            <InspectionTable
              data={monthlyData}
              frequency="monthly"
              showDefects={showDefects}
              bu={bu}
              site={site}
              machineTypeMapping={machineTypeMapping}
            />
          )}
        </TabsContent>

        <TabsContent value="quarterly">
          {quarterlyData && (
            <InspectionTable
              data={quarterlyData}
              frequency="quarterly"
              showDefects={showDefects}
              bu={bu}
              site={site}
              machineTypeMapping={machineTypeMapping}
            />
          )}
        </TabsContent>

        <TabsContent value="annual">
          {annualData && (
            <InspectionTable
              data={annualData}
              frequency="annual"
              showDefects={showDefects}
              bu={bu}
              site={site}
              machineTypeMapping={machineTypeMapping}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
