"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeDateTime } from "@/components/ui/date-utils";
import { FileText, Search } from "lucide-react";

// Dynamic import to avoid server-side rendering issues
const ManDetailDialog = dynamic(
  () =>
    import("./ManDetailDialog").then((mod) => ({
      default: mod.ManDetailDialog,
    })),
  {
    ssr: false,
    loading: () => <div>Loading...</div>,
  }
);

interface ManRecord {
  docId: string;
  id: string;
  bu: string;
  site: string;
  type: string;
  timestamp: string;
  createdAt?: string;
  remark?: string;
  [key: string]: any;
}

interface ManListModalProps {
  isOpen: boolean;
  onClose: () => void;
  bu: string;
  site: string;
  type: string;
  frequency: string;
  siteName?: string;
  typeName?: string;
  startDate: Date;
  endDate: Date;
}

// Form type configuration
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
  meetingform: {
    icon: "📋",
    label: "Safety Meeting Attention",
    color: "bg-indigo-500",
  },
};

export function ManListModal({
  isOpen,
  onClose,
  bu,
  site,
  type,
  frequency,
  siteName,
  typeName,
  startDate,
  endDate,
}: ManListModalProps) {
  const [records, setRecords] = useState<ManRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ManRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showManDetail, setShowManDetail] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [selectedRecordBu, setSelectedRecordBu] = useState("");
  const [selectedRecordType, setSelectedRecordType] = useState("");
  const [isMainModalVisible, setIsMainModalVisible] = useState(true);

  useEffect(() => {
    if (isOpen && bu && startDate && endDate) {
      fetchRecords();
    }
    // Reset search and visibility when modal opens
    if (isOpen) {
      setSearchTerm("");
      setIsMainModalVisible(true);
    } else {
      // Close detail dialog when main modal is closed
      setShowManDetail(false);
      setSelectedRecordId("");
      setSelectedRecordBu("");
      setSelectedRecordType("");
    }
  }, [isOpen, bu, site, type, startDate, endDate]);

  useEffect(() => {
    // Filter records based on search term
    if (searchTerm.trim() === "") {
      setFilteredRecords(records);
    } else {
      const filtered = records.filter(
        (record) =>
          record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.remark?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRecords(filtered);
    }
  }, [records, searchTerm]);

  const fetchRecords = async () => {
    setLoading(true);
    console.log("=== ManListModal fetchRecords ===");
    console.log("Modal parameters:", {
      bu,
      site,
      type,
      frequency,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    try {
      const apiUrl = `/api/man-records?bu=${bu}&site=${site}&type=${type}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      console.log("Fetching from:", apiUrl);

      const response = await fetch(apiUrl);

      if (response.ok) {
        const data = await response.json();
        console.log("API Response:", data);
        setRecords(data.records || []);
      } else {
        console.error("Failed to fetch records:", response.status);
        setRecords([]);
      }
    } catch (error) {
      console.error("Error in fetchRecords:", error);
      setRecords([]);
    } finally {
      setLoading(false);
      console.log("=== End ManListModal fetchRecords ===");
    }
  };

  const handleRecordClick = (record: ManRecord) => {
    setSelectedRecordId(record.id);
    setSelectedRecordBu(record.bu);
    setSelectedRecordType(record.type);
    setShowManDetail(true);
    // Hide main modal to prevent overlay conflicts
    setIsMainModalVisible(false);
  };

  const handleManDetailClose = () => {
    setShowManDetail(false);
    setSelectedRecordId("");
    setSelectedRecordBu("");
    setSelectedRecordType("");
    // Show main modal again
    setIsMainModalVisible(true);
  };

  const displaySiteName =
    siteName || (site === "all" ? "All Sites" : site.toUpperCase());
  const displayTypeName =
    typeName ||
    (type === "all"
      ? "All Forms"
      : FORM_TYPE_CONFIG[type]?.label ||
        type.charAt(0).toUpperCase() + type.slice(1));
  const displayFrequency =
    frequency.charAt(0).toUpperCase() + frequency.slice(1);

  const getStats = () => {
    const total = filteredRecords.length;
    return { total };
  };

  const stats = getStats();

  return (
    <>
      <Dialog open={isOpen && isMainModalVisible} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {displayTypeName} - {displaySiteName} ({displayFrequency})
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            {/* Stats and Controls */}
            <div className="mb-4 space-y-3">
              {/* Stats Summary */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  Total Records: {stats.total}
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by ID or remark..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                  <div className="text-gray-600">Loading records...</div>
                </div>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  {searchTerm
                    ? `No records found matching "${searchTerm}"`
                    : "No records found for this selection."}
                </div>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[50vh]">
                <div className="space-y-3">
                  {filteredRecords.map((record) => (
                    <Card
                      key={record.docId || record.id}
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
                                  {record.site.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>
                                <strong>ID:</strong>{" "}
                                <Button
                                  variant="link"
                                  className="p-0 h-auto font-semibold text-blue-600 hover:text-blue-800"
                                  onClick={() => handleRecordClick(record)}
                                >
                                  {record.id}
                                </Button>
                              </p>
                              {record.timestamp && (
                                <p>
                                  <strong>Date:</strong>{" "}
                                  {formatRelativeDateTime(record.timestamp)}
                                </p>
                              )}
                              {record.remark && (
                                <p className="text-xs text-gray-500 mt-2">
                                  <strong>Remark:</strong> {record.remark}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Man Detail Dialog */}
      <ManDetailDialog
        isOpen={showManDetail}
        onClose={handleManDetailClose}
        bu={selectedRecordBu}
        type={selectedRecordType}
        id={selectedRecordId}
      />
    </>
  );
}
