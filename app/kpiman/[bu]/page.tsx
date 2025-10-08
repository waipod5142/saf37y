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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Calendar,
  FileText,
  BarChart3,
  X,
} from "lucide-react";

interface TransactionData {
  transactionCount: number;
  defectCount: number;
  defectPercentage: number;
  bySite?: Record<
    string,
    {
      transactionCount: number;
      defectCount: number;
      defectPercentage: number;
    }
  >;
}

interface KPITransactionData {
  success: boolean;
  bu: string;
  frequency: string;
  data: {
    byType: Record<string, TransactionData>;
    bySite: Record<string, TransactionData>;
    total: TransactionData;
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

// Form type icons and display names
const FORM_TYPE_CONFIG: Record<
  string,
  { icon: string; label: string; color: string }
> = {
  toolbox: { icon: "🧰", label: "Toolbox Talk", color: "bg-blue-500" },
  alertform: {
    icon: "⚠️",
    label: "Red Alert Acknowledgement",
    color: "bg-red-500",
  },
  bootform: { icon: "🥾", label: "Boot on the ground", color: "bg-green-500" },
  sot: { icon: "👁️", label: "Safety Observation", color: "bg-purple-500" },
  talk: { icon: "💬", label: "Safety Talk", color: "bg-yellow-500" },
  meetingform: { icon: "📋", label: "Meeting Form", color: "bg-indigo-500" },
};

function getTransactionBadgeColor(count: number): string {
  if (count === 0) return "bg-gray-200 text-gray-600";
  if (count <= 5) return "bg-blue-100 text-blue-700 border border-blue-300";
  if (count <= 15) return "bg-green-100 text-green-700 border border-green-300";
  if (count <= 30)
    return "bg-yellow-100 text-yellow-700 border border-yellow-300";
  return "bg-purple-100 text-purple-700 border border-purple-300";
}

interface TransactionTableProps {
  data: KPITransactionData;
  frequency: string;
  bu: string;
  onTabChange?: (tab: string) => void;
}

function TransactionTable({
  data,
  frequency,
  bu,
  onTabChange,
}: TransactionTableProps) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    bu: string;
    site: string;
    type: string;
    frequency: string;
  }>({
    isOpen: false,
    bu: "",
    site: "",
    type: "",
    frequency: "",
  });
  const [records, setRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Calculate date ranges based on frequency
  const getDateRange = (freq: string) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const day = now.getDay();

    let startDate: Date;

    switch (freq) {
      case "daily":
        // Daily: from midnight today to now (local time)
        startDate = new Date(year, month, date, 0, 0, 0, 0);
        break;
      case "weekly":
        // Weekly: from Monday to Sunday (current week)
        const daysFromMonday = day === 0 ? 6 : day - 1;
        startDate = new Date(year, month, date - daysFromMonday, 0, 0, 0, 0);
        break;
      case "monthly":
        // Monthly: from 1st day of current month
        startDate = new Date(year, month, 1, 0, 0, 0, 0);
        break;
      case "annual":
        // Annual: from 1st of January of current year
        startDate = new Date(year, 0, 1, 0, 0, 0, 0);
        break;
      default:
        startDate = new Date(year, month, date, 0, 0, 0, 0);
    }

    return { startDate, endDate: now };
  };

  const handleBadgeClick = async (
    bu: string,
    site: string,
    type: string,
    freq: string
  ) => {
    setModalState({ isOpen: true, bu, site, type, frequency: freq });
    setLoadingRecords(true);

    try {
      const { startDate, endDate } = getDateRange(freq);

      // Fetch records from mantr collection
      const response = await fetch(
        `/api/man-records?bu=${bu}&site=${site}&type=${type}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || []);
      } else {
        console.error("Failed to fetch records");
        setRecords([]);
      }
    } catch (error) {
      console.error("Error fetching records:", error);
      setRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleModalClose = () => {
    setModalState({ isOpen: false, bu: "", site: "", type: "", frequency: "" });
    setRecords([]);
  };

  if (!data.success) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load transaction data</p>
      </div>
    );
  }

  const { byType, bySite, total } = data.data;

  // Get all unique sites across all form types
  const allSites = new Set<string>();
  Object.values(byType).forEach((formType) => {
    if (formType.bySite) {
      Object.keys(formType.bySite).forEach((site) => allSites.add(site));
    }
  });

  const siteList = Array.from(allSites).sort();

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onTabChange?.("daily")}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Total Transactions
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {total.transactionCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onTabChange?.("weekly")}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Form Types</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Object.keys(byType).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onTabChange?.("monthly")}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Active Sites
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {siteList.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Report Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {frequency.charAt(0).toUpperCase() + frequency.slice(1)} Safety
            Activity Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 bg-gray-50">
                  <th className="text-left p-3 font-semibold min-w-[180px]">
                    Form Type
                  </th>
                  {siteList.map((site) => (
                    <th
                      key={site}
                      className="text-center p-3 font-semibold uppercase min-w-[100px]"
                    >
                      {site}
                    </th>
                  ))}
                  <th className="text-center p-3 font-semibold bg-gray-100 min-w-[100px]">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byType).map(([type, formTypeData]) => {
                  const config = FORM_TYPE_CONFIG[type] || {
                    icon: "📄",
                    label: type.charAt(0).toUpperCase() + type.slice(1),
                    color: "bg-gray-500",
                  };

                  return (
                    <tr
                      key={type}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{config.icon}</span>
                          <div>
                            <span className="font-medium text-gray-900 block">
                              {config.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {type}
                            </span>
                          </div>
                        </div>
                      </td>
                      {siteList.map((site) => {
                        const siteData = formTypeData.bySite?.[site];
                        if (!siteData || siteData.transactionCount === 0) {
                          return (
                            <td
                              key={site}
                              className="text-center p-3 text-gray-400"
                            >
                              -
                            </td>
                          );
                        }
                        return (
                          <td key={site} className="text-center p-3">
                            <Badge
                              className={`text-sm font-semibold px-3 py-1 cursor-pointer hover:opacity-80 transition-opacity ${getTransactionBadgeColor(
                                siteData.transactionCount
                              )}`}
                              onClick={() =>
                                handleBadgeClick(bu, site, type, frequency)
                              }
                            >
                              {siteData.transactionCount}
                            </Badge>
                          </td>
                        );
                      })}
                      <td className="text-center p-3 bg-gray-50">
                        <Badge
                          className="bg-blue-600 text-white text-sm font-bold px-4 py-1 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() =>
                            handleBadgeClick(bu, "all", type, frequency)
                          }
                        >
                          {formTypeData.transactionCount}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {/* Total Row */}
                <tr className="border-t-2 bg-gradient-to-r from-gray-100 to-gray-50 font-semibold">
                  <td className="p-3">
                    <span className="font-bold text-gray-900 text-base">
                      Total Transactions
                    </span>
                  </td>
                  {siteList.map((site) => {
                    const siteData = bySite[site];
                    if (!siteData || siteData.transactionCount === 0) {
                      return (
                        <td
                          key={site}
                          className="text-center p-3 text-gray-400"
                        >
                          -
                        </td>
                      );
                    }
                    return (
                      <td key={site} className="text-center p-3">
                        <Badge
                          className="bg-purple-600 text-white font-bold text-sm px-3 py-1 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() =>
                            handleBadgeClick(bu, site, "all", frequency)
                          }
                        >
                          {siteData.transactionCount}
                        </Badge>
                      </td>
                    );
                  })}
                  <td className="text-center p-3 bg-gray-100">
                    <Badge
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-base px-5 py-2 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() =>
                        handleBadgeClick(bu, "all", "all", frequency)
                      }
                    >
                      {total.transactionCount}
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Records Modal */}
      <Dialog open={modalState.isOpen} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                {modalState.type !== "all"
                  ? FORM_TYPE_CONFIG[modalState.type]?.label || modalState.type
                  : "All Forms"}
                {" - "}
                {modalState.site !== "all"
                  ? modalState.site.toUpperCase()
                  : "All Sites"}{" "}
                (
                {modalState.frequency.charAt(0).toUpperCase() +
                  modalState.frequency.slice(1)}
                )
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleModalClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            {loadingRecords ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No records found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {records.map((record, index) => (
                  <Card
                    key={index}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              className={
                                FORM_TYPE_CONFIG[record.type]?.color ||
                                "bg-gray-500"
                              }
                            >
                              {FORM_TYPE_CONFIG[record.type]?.icon || "📄"}{" "}
                              {FORM_TYPE_CONFIG[record.type]?.label ||
                                record.type}
                            </Badge>
                            {record.site && (
                              <Badge variant="outline" className="text-xs">
                                {record.site}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>
                              <strong>ID:</strong> {record.id}
                            </p>
                            {record.timestamp && (
                              <p>
                                <strong>Date:</strong>{" "}
                                {new Date(record.timestamp).toLocaleString()}
                              </p>
                            )}
                            {record.remark && (
                              <p className="text-xs text-gray-500 mt-2">
                                {record.remark}
                              </p>
                            )}
                          </div>
                        </div>
                        <Link
                          href={`/Man/${record.bu}/${record.type}/${record.id}`}
                          className="ml-4"
                        >
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ManKPIPage() {
  const params = useParams();
  const bu = params.bu as string;

  const [dailyData, setDailyData] = useState<KPITransactionData | null>(null);
  const [weeklyData, setWeeklyData] = useState<KPITransactionData | null>(null);
  const [monthlyData, setMonthlyData] = useState<KPITransactionData | null>(
    null
  );
  const [annualData, setAnnualData] = useState<KPITransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState("daily");

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
        throw new Error("Failed to load man KPI data");
      }

      // Map the new API structure to the existing state
      setDailyData({
        success: true,
        bu: data.bu,
        frequency: "daily",
        data: data.kpiData.daily,
        timestamp: data.timestamp,
      });

      setWeeklyData({
        success: true,
        bu: data.bu,
        frequency: "weekly",
        data: data.kpiData.weekly,
        timestamp: data.timestamp,
      });

      setMonthlyData({
        success: true,
        bu: data.bu,
        frequency: "monthly",
        data: data.kpiData.monthly,
        timestamp: data.timestamp,
      });

      setAnnualData({
        success: true,
        bu: data.bu,
        frequency: "annual",
        data: data.kpiData.annual,
        timestamp: data.timestamp,
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching Man KPI data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
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
            { label: `${buName} Safety Activities` },
          ]}
        />
        <div className="mt-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl">{buFlag}</div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">
                {buName} Safety Activities Report
              </h1>
              <div className="w-64 h-4 bg-gray-200 rounded animate-pulse mt-2"></div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
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
            { label: `${buName} Safety Activities` },
          ]}
        />
        <div className="mt-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/kpiman">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Overview
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl">{buFlag}</div>
            <div>
              <h1 className="text-3xl font-bold">
                {buName} Safety Activities Report
              </h1>
            </div>
          </div>
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Unable to Load {buName} Data
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
          { label: "Man KPI Dashboard", href: "/kpiman" },
          { label: buName },
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
              {buName} Safety Activities Report
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Track safety forms, observations, and activities across all sites
            </p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <Card className="mb-6 border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold mb-3 text-gray-700">
                Form Types:
              </p>
              <div className="flex flex-wrap items-center gap-4">
                {Object.entries(FORM_TYPE_CONFIG).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-lg">{config.icon}</span>
                    <span className="text-xs font-medium text-gray-700">
                      {config.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-l pl-4">
              <p className="text-sm font-semibold mb-2 text-gray-700">
                Transaction Volume:
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                  <span className="text-xs">1-5</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                  <span className="text-xs">6-15</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                  <span className="text-xs">16-30</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
                  <span className="text-xs">30+</span>
                </div>
              </div>
            </div>
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
          <TabsTrigger value="weekly" className="font-semibold">
            WEEKLY
          </TabsTrigger>
          <TabsTrigger value="monthly" className="font-semibold">
            MONTHLY
          </TabsTrigger>
          <TabsTrigger value="annual" className="font-semibold">
            ANNUAL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          {dailyData && (
            <TransactionTable
              data={dailyData}
              frequency="daily"
              bu={bu}
              onTabChange={setActiveTab}
            />
          )}
        </TabsContent>

        <TabsContent value="weekly">
          {weeklyData && (
            <TransactionTable
              data={weeklyData}
              frequency="weekly"
              bu={bu}
              onTabChange={setActiveTab}
            />
          )}
        </TabsContent>

        <TabsContent value="monthly">
          {monthlyData && (
            <TransactionTable
              data={monthlyData}
              frequency="monthly"
              bu={bu}
              onTabChange={setActiveTab}
            />
          )}
        </TabsContent>

        <TabsContent value="annual">
          {annualData && (
            <TransactionTable
              data={annualData}
              frequency="annual"
              bu={bu}
              onTabChange={setActiveTab}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
