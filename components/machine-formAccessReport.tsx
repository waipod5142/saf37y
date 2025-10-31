"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, BarChart3 } from "lucide-react";
import { db } from "@/firebase/client";
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface MachineReportProps {
  bu: string;
  id: string;
}

interface VisitorTransaction {
  tel: string;
  name: string;
  company: string;
  checkInTimestamp: any;
  checkOutTimestamp?: any;
  active: boolean;
}

interface VisitorStats {
  totalVisitorsToday: number;
  currentlyInPlant: number;
  checkedOutToday: number;
  averageDuration: string;
  visitors: Array<{
    docId: string;
    name: string;
    company: string;
    tel: string;
    checkIn: Date;
    checkOut?: Date;
    duration?: string;
    status: "in-plant" | "checked-out";
  }>;
}

export default function MachineReport({ bu, id }: MachineReportProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchVisitorStats = async () => {
    try {
      setIsLoading(true);

      // Get today's start timestamp (00:00:00)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's end timestamp (23:59:59)
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // Query visitortr collection - simplified query to avoid index requirement
      const visitortrRef = collection(db, "visitortr");
      const q = query(
        visitortrRef,
        where("bu", "==", bu),
        where("id", "==", id)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setStats({
          totalVisitorsToday: 0,
          currentlyInPlant: 0,
          checkedOutToday: 0,
          averageDuration: "N/A",
          visitors: [],
        });
        return;
      }

      const now = new Date();
      const tenHoursAgo = new Date(now.getTime() - 10 * 60 * 60 * 1000);

      let totalVisitors = 0;
      let currentlyInPlant = 0;
      let checkedOut = 0;
      let totalDurationMinutes = 0;
      let completedVisits = 0;

      const visitors: VisitorStats["visitors"] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as VisitorTransaction;
        const checkIn = data.checkInTimestamp?.toDate();
        const checkOut = data.checkOutTimestamp?.toDate();

        // Filter for today's check-ins only
        if (!checkIn || checkIn < today || checkIn > todayEnd) {
          return; // Skip records not from today
        }

        totalVisitors++;

        // Check if visitor is currently in plant (checked in within last 10 hours and no checkout)
        if (checkIn >= tenHoursAgo && data.active && !checkOut) {
          currentlyInPlant++;
        }

        // Check if visitor checked out today
        if (checkOut && checkOut >= today && checkOut <= todayEnd) {
          checkedOut++;
        }

        // Calculate duration for completed visits
        let duration: string | undefined;
        if (checkIn && checkOut) {
          const diffMs = checkOut.getTime() - checkIn.getTime();
          const diffMins = Math.floor(diffMs / (1000 * 60));
          totalDurationMinutes += diffMins;
          completedVisits++;

          const hours = Math.floor(diffMins / 60);
          const mins = diffMins % 60;
          if (hours > 0) {
            duration = `${hours}h ${mins}m`;
          } else {
            duration = `${mins}m`;
          }
        }

        // Determine status
        const status =
          checkIn >= tenHoursAgo && data.active && !checkOut
            ? "in-plant"
            : "checked-out";

        visitors.push({
          docId: doc.id,
          name: data.name,
          company: data.company,
          tel: data.tel,
          checkIn,
          checkOut,
          duration,
          status,
        });
      });

      // Calculate average duration
      let averageDuration = "N/A";
      if (completedVisits > 0) {
        const avgMins = Math.floor(totalDurationMinutes / completedVisits);
        const hours = Math.floor(avgMins / 60);
        const mins = avgMins % 60;
        if (hours > 0) {
          averageDuration = `${hours}h ${mins}m`;
        } else {
          averageDuration = `${mins}m`;
        }
      }

      // Sort visitors by check-in time (most recent first)
      visitors.sort((a, b) => b.checkIn.getTime() - a.checkIn.getTime());

      setStats({
        totalVisitorsToday: totalVisitors,
        currentlyInPlant,
        checkedOutToday: checkedOut,
        averageDuration,
        visitors,
      });
    } catch (error: any) {
      console.error("Error fetching visitor stats:", error);
      toast.error(`Failed to fetch visitor statistics: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = async () => {
    setShowDialog(true);
    await fetchVisitorStats();
  };

  const handleDeleteRecord = async (docId: string, visitorName: string) => {
    if (!confirm(`Are you sure you want to delete the record for ${visitorName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(docId);
      const docRef = doc(db, "visitortr", docId);
      await deleteDoc(docRef);

      toast.success(`Record for ${visitorName} has been deleted`);

      // Refresh the data
      await fetchVisitorStats();
    } catch (error: any) {
      console.error("Error deleting record:", error);
      toast.error(`Failed to delete record: ${error.message || "Unknown error"}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Hidden button - small and subtle */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleOpenDialog}
        className="absolute top-2 right-2 opacity-20 hover:opacity-100 transition-opacity w-8 h-8 p-0"
        title="Visitor Report"
      >
        <BarChart3 className="h-4 w-4" />
      </Button>

      {/* Analytics Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <button
            onClick={() => setShowDialog(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>

          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl">
              Visitor Analytics Report
            </DialogTitle>
            <DialogDescription>
              Today's visitor statistics for {id.toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 space-y-4 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : stats ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Total Visitors Today
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">
                        {stats.totalVisitorsToday}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Currently In Plant
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-600">
                        {stats.currentlyInPlant}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        (10hr window)
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Checked Out Today
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">
                        {stats.checkedOutToday}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Avg Duration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-600">
                        {stats.averageDuration}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Visitor List */}
                {stats.visitors.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Visitor Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats.visitors.map((visitor, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border ${
                              visitor.status === "in-plant"
                                ? "bg-orange-50 border-orange-200"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-lg">
                                    {visitor.name}
                                  </h4>
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full ${
                                      visitor.status === "in-plant"
                                        ? "bg-orange-600 text-white"
                                        : "bg-green-600 text-white"
                                    }`}
                                  >
                                    {visitor.status === "in-plant"
                                      ? "🔵 IN PLANT"
                                      : "✓ Checked Out"}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">
                                  {visitor.company}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Tel: {visitor.tel}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRecord(visitor.docId, visitor.name)}
                                disabled={deletingId === visitor.docId}
                                className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Delete this record"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Check-in:</span>
                                <p className="font-medium">
                                  {visitor.checkIn.toLocaleString("en-GB", {
                                    hour12: false,
                                  })}
                                </p>
                              </div>
                              {visitor.checkOut && (
                                <>
                                  <div>
                                    <span className="text-gray-600">
                                      Check-out:
                                    </span>
                                    <p className="font-medium">
                                      {visitor.checkOut.toLocaleString("en-GB", {
                                        hour12: false,
                                      })}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">
                                      Duration:
                                    </span>
                                    <p className="font-medium text-purple-600">
                                      {visitor.duration}
                                    </p>
                                  </div>
                                </>
                              )}
                              {!visitor.checkOut &&
                                visitor.status === "in-plant" && (
                                  <div>
                                    <span className="text-gray-600">
                                      Time in plant:
                                    </span>
                                    <p className="font-medium text-orange-600">
                                      {(() => {
                                        const now = new Date();
                                        const diffMs =
                                          now.getTime() -
                                          visitor.checkIn.getTime();
                                        const diffMins = Math.floor(
                                          diffMs / (1000 * 60)
                                        );
                                        const hours = Math.floor(diffMins / 60);
                                        const mins = diffMins % 60;
                                        if (hours > 0) {
                                          return `${hours}h ${mins}m`;
                                        }
                                        return `${mins}m`;
                                      })()}
                                    </p>
                                  </div>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                      No visitor records found for today
                    </CardContent>
                  </Card>
                )}
              </>
            ) : null}
          </div>

          <div className="flex-shrink-0 flex justify-end pt-4">
            <Button
              type="button"
              onClick={() => setShowDialog(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
