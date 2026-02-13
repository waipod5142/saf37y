"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FALLBACK_COUNTRIES } from "@/lib/constants/countries";
import { ManListModal } from "@/components/ManListModal";
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Calendar,
  AlertTriangle,
} from "lucide-react";

interface AlertData {
  success: boolean;
  bu: string;
  type: string;
  data: {
    sites: string[];
    alertNos: string[];
    matrix: Record<string, Record<string, number>>;
    rows: Array<{
      alertNo: string;
      sites: Record<string, number>;
      total: number;
    }>;
    totals: {
      bySite: Record<string, number>;
      byAlertNo: Record<string, number>;
      overall: number;
    };
  };
  metadata: {
    totalTransactions: number;
    uniqueSites: number;
    uniqueAlertNos: number;
    timestamp: string;
  };
}

const BU_NAMES: Record<string, string> = Object.fromEntries(
  FALLBACK_COUNTRIES.map((c) => [c.code, c.name])
);

const BU_FLAGS: Record<string, string> = Object.fromEntries(
  FALLBACK_COUNTRIES.map((c) => [c.code, c.flag])
);

function getAlertTypeBadgeColor(alertNo: string): string {
  const type = alertNo.split("-")[0];
  if (type === "LTI") return "bg-orange-500 text-white";
  if (type === "CI") return "bg-yellow-500 text-white";
  if (type === "F") return "bg-red-500 text-white";
  if (type === "FI") return "bg-red-500 text-white";
  return "bg-gray-500 text-white";
}

export default function BUAlertPage() {
  const params = useParams();
  const bu = params.bu as string;

  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    bu: string;
    site: string;
    type: string;
    alertNo: string;
  }>({
    isOpen: false,
    bu: "",
    site: "",
    type: "alertform",
    alertNo: "",
  });

  const handleBadgeClick = (
    bu: string,
    site: string,
    type: string,
    alertNo: string
  ) => {
    setModalState({
      isOpen: true,
      bu,
      site,
      type,
      alertNo,
    });
  };

  const handleModalClose = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const fetchAlertData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://dashboard-alert-874085997493.asia-southeast1.run.app/alert?bu=${bu}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error("Failed to load alert data");
      }

      setAlertData(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching alert data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bu) {
      fetchAlertData();
    }
  }, [bu]);

  const buName = BU_NAMES[bu.toLowerCase()] || bu.toUpperCase();
  const buFlag = BU_FLAGS[bu.toLowerCase()] || "🏴";

  if (loading && !alertData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-12 w-12 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Breadcrumbs
          items={[
            { label: "Alert Dashboard", href: "/kpialert" },
            { label: `${buName} Alert Report` },
          ]}
        />
        <div className="mt-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/kpialert">
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
              <h1 className="text-3xl font-bold">{buName} - Alert Report</h1>
            </div>
          </div>
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Unable to Load {buName} Alert Data
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={fetchAlertData}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!alertData) {
    return null;
  }

  const { data, metadata } = alertData;
  const sites = data.sites;
  const rows = data.rows;

  return (
    <div className="container mx-auto p-6">
      <Breadcrumbs
        items={[
          { label: "Alert Dashboard", href: "/kpialert" },
          { label: buName },
        ]}
      />

      <div className="mt-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* <Link href="/kpialert">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Overview
              </Button>
            </Link> */}
            {lastUpdated && (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
            <Button
              onClick={fetchAlertData}
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
            <h1 className="text-3xl font-bold">{buName} - Alert Report</h1>
            <p className="text-gray-600 mt-1">
              Total Alerts: {metadata.totalTransactions} across{" "}
              {metadata.uniqueSites} sites
            </p>
          </div>
        </div>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div>
            <p className="text-sm font-medium mb-2">Alert Types</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-xs">F & FI - Fatility</span>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-xs">LTI - Lost Time Injury</span>
                </div>
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-xs">CI - Criticle Incident</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold">
                  {metadata.totalTransactions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Unique Alert Types</p>
                <p className="text-2xl font-bold">{metadata.uniqueAlertNos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active Sites</p>
                <p className="text-2xl font-bold">{metadata.uniqueSites}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Alert Summary by Site
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="p-3 text-left font-semibold sticky left-0 bg-gray-100 z-10">
                    Alert No.
                  </th>
                  {sites.map((site) => (
                    <th
                      key={site}
                      className="p-3 text-center font-semibold uppercase"
                    >
                      {site}
                    </th>
                  ))}
                  <th className="p-3 text-center font-semibold bg-blue-50">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.alertNo}
                    className={`border-b hover:bg-gray-50 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <td className="p-3 sticky left-0 bg-white z-10">
                      <Badge
                        className={`${getAlertTypeBadgeColor(
                          row.alertNo
                        )} font-mono text-xs`}
                      >
                        {row.alertNo}
                      </Badge>
                    </td>
                    {sites.map((site) => {
                      const count = row.sites[site] || 0;
                      return (
                        <td key={site} className="text-center p-3">
                          {count > 0 ? (
                            <span
                              className="font-semibold text-gray-800 cursor-pointer hover:text-blue-600 hover:underline"
                              onClick={() =>
                                handleBadgeClick(
                                  bu,
                                  site,
                                  "alertform",
                                  row.alertNo
                                )
                              }
                            >
                              {count}
                            </span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-center p-3 bg-blue-50">
                      <Badge className="bg-blue-600 text-white font-bold">
                        {row.total}
                      </Badge>
                    </td>
                  </tr>
                ))}

                <tr className="border-t-2 bg-gray-100 font-semibold">
                  <td className="p-3 font-bold sticky left-0 bg-gray-100 z-10">
                    Total
                  </td>
                  {sites.map((site) => {
                    const siteTotal = data.totals.bySite[site] || 0;
                    return (
                      <td key={site} className="text-center p-3">
                        <Badge className="bg-gray-700 text-white font-bold">
                          {siteTotal}
                        </Badge>
                      </td>
                    );
                  })}
                  <td className="text-center p-3 bg-blue-100">
                    <Badge className="bg-blue-700 text-white font-bold text-base px-3 py-1">
                      {data.totals.overall}
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Alert Records Modal */}
      <ManListModal
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        bu={modalState.bu}
        site={modalState.site}
        type={modalState.type}
        frequency="all"
        siteName={
          modalState.site !== "" ? modalState.site.toUpperCase() : undefined
        }
        typeName={`Alert: ${modalState.alertNo}`}
        startDate={new Date(2000, 0, 1)}
        endDate={new Date(2099, 11, 31)}
        alertNo={modalState.alertNo}
      />
    </div>
  );
}
