"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FALLBACK_COUNTRIES } from "@/lib/constants/countries";
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Calendar,
  Users,
  UserCheck,
  UserMinus,
  Clock,
} from "lucide-react";
import { db } from "@/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import MachineReport from "@/components/machine-formAccessReport";

interface VisitorTransaction {
  tel: string;
  name: string;
  company: string;
  checkInTimestamp: any;
  checkOutTimestamp?: any;
  active: boolean;
  id: string; // plantId
  bu: string;
}

interface PlantStats {
  plantId: string;
  totalVisitors: number;
  currentlyInPlant: number;
  checkedOut: number;
  averageDuration: string;
}

interface VisitorData {
  success: boolean;
  bu: string;
  plants: PlantStats[];
  totals: {
    totalVisitors: number;
    currentlyInPlant: number;
    checkedOut: number;
    averageDuration: string;
  };
  metadata: {
    totalTransactions: number;
    uniquePlants: number;
    timestamp: string;
  };
}

const BU_NAMES: Record<string, string> = Object.fromEntries(
  FALLBACK_COUNTRIES.map((c) => [c.code, c.name])
);

const BU_FLAGS: Record<string, string> = Object.fromEntries(
  FALLBACK_COUNTRIES.map((c) => [c.code, c.flag])
);

export default function BUVisitorPage() {
  const params = useParams();
  const bu = params.bu as string;

  const [visitorData, setVisitorData] = useState<VisitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Map business units to their timezones
    const timezoneMap: Record<string, string> = {
      th: 'Asia/Bangkok',
      vn: 'Asia/Ho_Chi_Minh',
      kh: 'Asia/Phnom_Penh',
      lk: 'Asia/Colombo',
      bd: 'Asia/Dhaka',
    };

    const timezone = timezoneMap[bu?.toLowerCase()] || 'Asia/Bangkok';
    const today = new Date();
    const localDate = new Date(today.toLocaleString('en-US', { timeZone: timezone }));
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const handlePlantClick = (plantId: string) => {
    // Find and click the hidden button to open the dialog
    const button = document.querySelector(
      `#plant-report-${plantId} button`
    ) as HTMLButtonElement;
    if (button) {
      button.click();
    }
  };

  const fetchVisitorData = async (date?: string) => {
    try {
      setLoading(true);
      setError(null);

      const dateToUse = date || selectedDate;

      // Parse the selected date and set to start/end of day
      const targetDate = new Date(dateToUse);
      targetDate.setHours(0, 0, 0, 0);

      const targetDateEnd = new Date(dateToUse);
      targetDateEnd.setHours(23, 59, 59, 999);

      // Query visitortr collection
      const visitortrRef = collection(db, "visitortr");
      const q = query(
        visitortrRef,
        where("bu", "==", bu),
        where("type", "==", "plantaccess")
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setVisitorData({
          success: true,
          bu,
          plants: [],
          totals: {
            totalVisitors: 0,
            currentlyInPlant: 0,
            checkedOut: 0,
            averageDuration: "N/A",
          },
          metadata: {
            totalTransactions: 0,
            uniquePlants: 0,
            timestamp: new Date().toISOString(),
          },
        });
        setLastUpdated(new Date());
        return;
      }

      const now = new Date();
      const tenHoursAgo = new Date(now.getTime() - 10 * 60 * 60 * 1000);

      const plantMap = new Map<
        string,
        {
          totalVisitors: number;
          currentlyInPlant: number;
          checkedOut: number;
          totalDurationMinutes: number;
          completedVisits: number;
        }
      >();

      let overallTotalVisitors = 0;
      let overallCurrentlyInPlant = 0;
      let overallCheckedOut = 0;
      let overallTotalDurationMinutes = 0;
      let overallCompletedVisits = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data() as VisitorTransaction;
        const checkIn = data.checkInTimestamp?.toDate();
        const checkOut = data.checkOutTimestamp?.toDate();

        // Filter for selected date's check-ins only
        if (!checkIn || checkIn < targetDate || checkIn > targetDateEnd) {
          return;
        }

        const plantId = data.id;

        if (!plantMap.has(plantId)) {
          plantMap.set(plantId, {
            totalVisitors: 0,
            currentlyInPlant: 0,
            checkedOut: 0,
            totalDurationMinutes: 0,
            completedVisits: 0,
          });
        }

        const plantStats = plantMap.get(plantId)!;

        plantStats.totalVisitors++;
        overallTotalVisitors++;

        // Check if visitor is currently in plant
        if (checkIn >= tenHoursAgo && data.active && !checkOut) {
          plantStats.currentlyInPlant++;
          overallCurrentlyInPlant++;
        }

        // Check if visitor checked out on selected date
        if (checkOut && checkOut >= targetDate && checkOut <= targetDateEnd) {
          plantStats.checkedOut++;
          overallCheckedOut++;
        }

        // Calculate duration
        if (checkIn && checkOut) {
          const diffMs = checkOut.getTime() - checkIn.getTime();
          const diffMins = Math.floor(diffMs / (1000 * 60));
          plantStats.totalDurationMinutes += diffMins;
          plantStats.completedVisits++;
          overallTotalDurationMinutes += diffMins;
          overallCompletedVisits++;
        }
      });

      const plants: PlantStats[] = Array.from(plantMap.entries()).map(
        ([plantId, stats]) => {
          let averageDuration = "N/A";
          if (stats.completedVisits > 0) {
            const avgMins = Math.floor(
              stats.totalDurationMinutes / stats.completedVisits
            );
            const hours = Math.floor(avgMins / 60);
            const mins = avgMins % 60;
            if (hours > 0) {
              averageDuration = `${hours}h ${mins}m`;
            } else {
              averageDuration = `${mins}m`;
            }
          }

          return {
            plantId,
            totalVisitors: stats.totalVisitors,
            currentlyInPlant: stats.currentlyInPlant,
            checkedOut: stats.checkedOut,
            averageDuration,
          };
        }
      );

      // Sort plants by total visitors descending
      plants.sort((a, b) => b.totalVisitors - a.totalVisitors);

      let overallAvgDuration = "N/A";
      if (overallCompletedVisits > 0) {
        const avgMins = Math.floor(
          overallTotalDurationMinutes / overallCompletedVisits
        );
        const hours = Math.floor(avgMins / 60);
        const mins = avgMins % 60;
        if (hours > 0) {
          overallAvgDuration = `${hours}h ${mins}m`;
        } else {
          overallAvgDuration = `${mins}m`;
        }
      }

      setVisitorData({
        success: true,
        bu,
        plants,
        totals: {
          totalVisitors: overallTotalVisitors,
          currentlyInPlant: overallCurrentlyInPlant,
          checkedOut: overallCheckedOut,
          averageDuration: overallAvgDuration,
        },
        metadata: {
          totalTransactions: overallTotalVisitors,
          uniquePlants: plants.length,
          timestamp: new Date().toISOString(),
        },
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching visitor data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
      toast.error("Failed to fetch visitor statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bu) {
      fetchVisitorData();
    }
  }, [bu]);

  const handleDateChange = async (newDate: string) => {
    setSelectedDate(newDate);
    await fetchVisitorData(newDate);
  };

  const handleQuickDate = async (daysAgo: number) => {
    // Map business units to their timezones
    const timezoneMap: Record<string, string> = {
      th: 'Asia/Bangkok',
      vn: 'Asia/Ho_Chi_Minh',
      kh: 'Asia/Phnom_Penh',
      lk: 'Asia/Colombo',
      bd: 'Asia/Dhaka',
    };

    const timezone = timezoneMap[bu?.toLowerCase()] || 'Asia/Bangkok';
    const today = new Date();
    const localDate = new Date(today.toLocaleString('en-US', { timeZone: timezone }));
    localDate.setDate(localDate.getDate() - daysAgo);

    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    setSelectedDate(dateString);
    await fetchVisitorData(dateString);
  };

  const buName = BU_NAMES[bu?.toLowerCase()] || bu?.toUpperCase();
  const buFlag = BU_FLAGS[bu?.toLowerCase()] || "🏴";

  if (loading && !visitorData) {
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
            { label: "Visitor Dashboard", href: "/kpivisitor" },
            { label: `${buName} Visitor Report` },
          ]}
        />
        <div className="mt-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/kpivisitor">
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
                {buName} - Visitor Report
              </h1>
            </div>
          </div>
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Unable to Load {buName} Visitor Data
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={() => fetchVisitorData()}
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

  if (!visitorData) {
    return null;
  }

  const { plants, totals, metadata } = visitorData;

  return (
    <div className="container mx-auto p-6">
      <Breadcrumbs
        items={[
          { label: "Visitor Dashboard", href: "/kpivisitor" },
          { label: buName },
        ]}
      />

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
              onClick={() => fetchVisitorData()}
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
            <h1 className="text-3xl font-bold">{buName} - Visitor Report</h1>
            <p className="text-gray-600 mt-1">
              Total Visitors: {metadata.totalTransactions} across{" "}
              {metadata.uniquePlants} plants
            </p>
          </div>
        </div>
      </div>

      {/* Date Selector */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1 w-full sm:w-auto">
              <Label
                htmlFor="report-date"
                className="text-sm font-medium mb-1 block"
              >
                Select Date
              </Label>
              <Input
                id="report-date"
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full"
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickDate(0)}
                className="text-xs"
              >
                Today
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickDate(1)}
                className="text-xs"
              >
                Yesterday
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickDate(2)}
                className="text-xs"
              >
                2 Days Ago
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Viewing data for:{" "}
            <strong>
              {new Date(selectedDate).toLocaleDateString("en-GB", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </strong>
          </p>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Visitors</p>
                <p className="text-2xl font-bold">{totals.totalVisitors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Currently In Plant</p>
                <p className="text-2xl font-bold">{totals.currentlyInPlant}</p>
                <p className="text-xs text-gray-500">(10hr window)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <UserMinus className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Checked Out</p>
                <p className="text-2xl font-bold">{totals.checkedOut}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold">{totals.averageDuration}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plant Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Visitor Summary by Plant
          </CardTitle>
        </CardHeader>
        <CardContent>
          {plants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="p-3 text-left font-semibold">Plant ID</th>
                    <th className="p-3 text-center font-semibold">
                      Total Visitors
                    </th>
                    <th className="p-3 text-center font-semibold">
                      Currently In Plant
                    </th>
                    <th className="p-3 text-center font-semibold">
                      Checked Out
                    </th>
                    <th className="p-3 text-center font-semibold">
                      Avg Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {plants.map((plant, index) => (
                    <tr
                      key={plant.plantId}
                      className={`border-b hover:bg-gray-50 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="p-3">
                        <Badge
                          className="bg-blue-600 text-white font-mono text-xs uppercase cursor-pointer hover:bg-blue-700 transition-colors"
                          onClick={() => handlePlantClick(plant.plantId)}
                        >
                          {plant.plantId}
                        </Badge>
                      </td>
                      <td className="text-center p-3">
                        <span className="font-semibold text-blue-600">
                          {plant.totalVisitors}
                        </span>
                      </td>
                      <td className="text-center p-3">
                        <span className="font-semibold text-orange-600">
                          {plant.currentlyInPlant}
                        </span>
                      </td>
                      <td className="text-center p-3">
                        <span className="font-semibold text-green-600">
                          {plant.checkedOut}
                        </span>
                      </td>
                      <td className="text-center p-3">
                        <span className="font-semibold text-purple-600">
                          {plant.averageDuration}
                        </span>
                      </td>
                    </tr>
                  ))}

                  <tr className="border-t-2 bg-gray-100 font-semibold">
                    <td className="p-3 font-bold">Total</td>
                    <td className="text-center p-3">
                      <Badge className="bg-blue-700 text-white font-bold">
                        {totals.totalVisitors}
                      </Badge>
                    </td>
                    <td className="text-center p-3">
                      <Badge className="bg-orange-700 text-white font-bold">
                        {totals.currentlyInPlant}
                      </Badge>
                    </td>
                    <td className="text-center p-3">
                      <Badge className="bg-green-700 text-white font-bold">
                        {totals.checkedOut}
                      </Badge>
                    </td>
                    <td className="text-center p-3">
                      <Badge className="bg-purple-700 text-white font-bold">
                        {totals.averageDuration}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              No visitor records found for{" "}
              {new Date(selectedDate).toLocaleDateString("en-GB", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden trigger buttons for each plant's visitor report */}
      <div className="hidden">
        {plants.map((plant) => (
          <div key={plant.plantId} id={`plant-report-${plant.plantId}`}>
            <MachineReport bu={bu} id={plant.plantId} />
          </div>
        ))}
      </div>
    </div>
  );
}
