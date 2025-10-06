"use client";

import React, { useState } from "react";
import { SotManRecord } from "@/types/man";
import { deleteManRecord } from "@/lib/actions/man";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  MapPin,
  User,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  FileText,
  Camera,
  ToggleLeftIcon,
  ToggleRightIcon,
  Trash2Icon,
} from "lucide-react";
import { useManFormTranslation } from "@/lib/i18n/man-forms";

interface SotManDetailClientProps {
  records: SotManRecord[];
  bu: string;
}

// Safety issue categories with colors matching the form
const safetyIssueCategories = [
  {
    id: "ppe",
    label: "อุปกรณ์คุ้มครองความปลอดภัยส่วนบุคคล (PPE)",
    color: "bg-blue-500",
  },
  {
    id: "workingAtHight",
    label: "การทำงานบนที่สูง (Working at Height)",
    color: "bg-red-500",
  },
  {
    id: "isolation",
    label: "การตัดแยกแหล่งพลังงาน (Isolation of plant and equipment)",
    color: "bg-orange-500",
  },
  {
    id: "vehicles",
    label: "ยานพาหนะและการจราจร (Vehicles and Traffic Safety)",
    color: "bg-yellow-500",
  },
  {
    id: "electrical",
    label: "การทำงานกับไฟฟ้า (Electrical Safety)",
    color: "bg-yellow-400",
  },
  {
    id: "guarding",
    label: "การ์ดของเครื่องจักร (Machine Guarding)",
    color: "bg-green-500",
  },
  {
    id: "hotwork",
    label: "การทำงานความร้อนและประกายไฟ (Hot Work and Permits)",
    color: "bg-teal-500",
  },
  {
    id: "lifting",
    label: "การทำงานยก (Lifting Equipment)",
    color: "bg-blue-600",
  },
  {
    id: "quarries",
    label: "การทำงานเกี่ยวกับเหมือง (Quarries)",
    color: "bg-indigo-500",
  },
  {
    id: "hotMaterials",
    label: "การทำงานกับวัสดุที่มีความร้อน (Hot Materials)",
    color: "bg-purple-500",
  },
  {
    id: "csm",
    label: "การบริหารจัดการผู้รับเหมา (Contractor Management)",
    color: "bg-pink-500",
  },
  {
    id: "equipment",
    label: "การใช้งานอุปกรณ์และเครื่องมือ (Portable Equipment)",
    color: "bg-purple-400",
  },
  {
    id: "generalWork",
    label: "การทำงานทั่วไป (General Work Permits)",
    color: "bg-gray-500",
  },
];

// Get safety issue category by ID
const getSafetyCategory = (id: string) => {
  return (
    safetyIssueCategories.find((cat) => cat.id === id) || {
      id,
      label: id,
      color: "bg-gray-400",
    }
  );
};

// Get risk level styling - accepts translation function
const getRiskLevelStyle = (level: string, t: any) => {
  switch (level) {
    case "low":
      return { color: "bg-green-500 text-white", text: t.sot.low };
    case "medium":
      return { color: "bg-orange-500 text-white", text: t.sot.medium };
    case "high":
      return { color: "bg-red-500 text-white", text: t.sot.high };
    default:
      return { color: "bg-gray-500 text-white", text: level };
  }
};

// Format date
const formatDate = (date: Date | string) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export default function SotManDetailClient({
  records,
  bu,
}: SotManDetailClientProps) {
  const { t } = useManFormTranslation(bu);

  const [showAllRecords, setShowAllRecords] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );

  // Utility function for Firebase timestamp conversion
  const convertFirebaseTimestamp = (timestamp: any): Date | null => {
    if (!timestamp) return null;

    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      return timestamp.toDate();
    }

    if (timestamp._seconds !== undefined) {
      return new Date(
        timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000
      );
    }

    return new Date(timestamp);
  };

  // Helper function to check if record is within 5-minute delete window
  const isWithinDeleteTimeWindow = (record: SotManRecord) => {
    const recordTimestamp = record.timestamp || record.createdAt;
    if (!recordTimestamp) return false;

    try {
      const recordDate = convertFirebaseTimestamp(recordTimestamp);
      if (!recordDate) return false;

      const now = new Date();
      const timeDifference = now.getTime() - recordDate.getTime();
      const fiveMinutesInMs = 5 * 60 * 1000; // 5 minutes in milliseconds

      return timeDifference <= fiveMinutesInMs;
    } catch (error) {
      console.error("Error checking delete time window:", error);
      return false;
    }
  };

  // Image click handler
  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src =
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMkgxNFYxNkgyMFYyMlpNMjAgMzhIMTRWMzJIMjBWMzhaTTIwIDQ2SDE0VjQwSDIwVjQ2WiIgZmlsbD0iIzlDQTRBRiIvPgo8cGF0aCBkPSJNNTAgMjJINDRWMTZINTBWMjJaTTUwIDM4SDQ0VjMySDUwVjM4Wk01MCA0Nkg0NFY0MEg1MFY0NloiIGZpbGw9IiM5Q0E0QUYiLz4KPHBhdGggZD0iTTM1IDIySDI5VjE2SDM1VjIyWk0zNSAzOEgyOVYzMkgzNVYzOFpNMzUgNDZIMjlWNDBIMzVWNDZaIiBmaWxsPSIjOUNBNEFGIi8+Cjx0ZXh0IHg9IjMyIiB5PSIzNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzlDQTRBRiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjhweCI+RXJyb3I8L3RleHQ+Cjwvc3ZnPg==";
  };

  // Delete record handler
  const handleDeleteRecord = async (docId: string) => {
    if (!docId) return;

    setDeletingRecordId(docId);
    try {
      const result = await deleteManRecord(docId);
      if (result.success) {
        // Reload the page to refresh the records
        window.location.reload();
      } else {
        alert("Failed to delete record: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      alert("Failed to delete record");
      console.error("Delete error:", error);
    } finally {
      setDeletingRecordId(null);
      setShowDeleteConfirm(null);
    }
  };

  if (!records || records.length === 0) {
    return (
      <div className="mb-6">
        <p className="text-sm text-red-500 mt-2">
          No SOT/VFL reports found for this machine.
        </p>
      </div>
    );
  }

  const displayedRecords = showAllRecords ? records : records.slice(0, 1);

  return (
    <div className="mb-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            🛡️ SOT/VFL Reports ({showAllRecords ? records.length : 1} of{" "}
            {records.length} record{records.length > 1 ? "s" : ""})
          </h3>
          {/* Toggle Button */}
          {records.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllRecords(!showAllRecords)}
              className={`flex items-center gap-2 ${showAllRecords ? "bg-red-100" : "bg-green-100"}`}
            >
              {showAllRecords ? (
                <>
                  <ToggleRightIcon className="h-4 w-4" />
                  {t.common.showLess}
                </>
              ) : (
                <>
                  <ToggleLeftIcon className="h-4 w-4" />
                  {t.common.showAll}
                </>
              )}
            </Button>
          )}
        </div>

        {/* Records */}
        <div className="space-y-4">
          {displayedRecords.map((record, index) => {
            const riskStyle = getRiskLevelStyle(record.riskLevel, t);

            return (
              <Card key={index} className="shadow-lg border-l-4 border-l-purple-500">
                {/* Header */}
                <CardHeader className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border-b">
                  <div className="flex flex-col gap-3">
                    {/* Top Row: Badges and Type */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <Badge variant="default" className="bg-green-600">
                            ✓ Latest
                          </Badge>
                        )}
                        <Badge
                          className={`${
                            record.report === "sot" ? "bg-red-600" : "bg-blue-600"
                          } text-white px-3 py-1.5 text-sm font-semibold shadow-sm`}
                        >
                          {record.report === "sot" ? "🔍 SOT" : "👁️ VFL"}
                        </Badge>
                        <Badge className="bg-gray-700 text-white px-2 py-1 text-xs">
                          ID: {record.id}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-sm text-gray-700 bg-white px-3 py-1.5 rounded-md shadow-sm">
                          <Calendar className="h-4 w-4 text-purple-600" />
                          <span className="font-medium">{formatDate(record.createdAt || record.timestamp)}</span>
                        </div>
                        {record.docId && isWithinDeleteTimeWindow(record) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(record.docId!)}
                            disabled={deletingRecordId === record.docId}
                            className="hover:bg-red-50 hover:border-red-400"
                          >
                            {deletingRecordId === record.docId ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-b-transparent" />
                            ) : (
                              <Trash2Icon className="h-4 w-4 text-red-600" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  {/* Key Information Section */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Area */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-md shadow-sm">
                          <MapPin className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            {t.sot.area}
                          </p>
                          <p className="font-semibold text-gray-900">{record.area || '-'}</p>
                        </div>
                      </div>

                      {/* Observer */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-md shadow-sm">
                          <User className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            {t.sot.talkWith}
                          </p>
                          <p className="font-semibold text-gray-900">{record.talkwith || '-'}</p>
                        </div>
                      </div>

                      {/* Risk Level */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-md shadow-sm">
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            {t.sot.riskLevel}
                          </p>
                          <Badge className={`${riskStyle.color} px-3 py-1 font-semibold shadow-sm`}>
                            {riskStyle.text}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Safety Topics Section */}
                  {record.topics && record.topics.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="h-5 w-5 text-indigo-600" />
                        <h4 className="font-bold text-gray-800">ประเด็นความปลอดภัย / Safety Issues</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {record.topics.map((topicId, topicIndex) => {
                          const category = getSafetyCategory(topicId);
                          return (
                            <Badge
                              key={topicIndex}
                              className={`${category.color} text-white text-xs px-3 py-1.5 shadow-sm hover:shadow-md transition-shadow`}
                            >
                              {category.label}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Observations Section */}
                  <div className="space-y-4 mb-6">
                    {/* Positive Reinforcement */}
                    {record.safe && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-l-4 border-green-500 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <h4 className="font-bold text-green-900">การชมเชย / Positive Reinforcement</h4>
                        </div>
                        <p className="text-gray-800 leading-relaxed">{record.safe}</p>
                      </div>
                    )}

                    {/* Safety Care */}
                    {record.care && (
                      <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border-l-4 border-orange-500 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                          <h4 className="font-bold text-orange-900">ความห่วงใย / Safety Care</h4>
                        </div>
                        <p className="text-gray-800 leading-relaxed">{record.care}</p>
                      </div>
                    )}

                    {/* Action Comments */}
                    {record.actionComment && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                          <h4 className="font-bold text-blue-900">มาตรการแก้ไข / Action Comments</h4>
                        </div>
                        <p className="text-gray-800 leading-relaxed">{record.actionComment}</p>
                      </div>
                    )}

                    {/* Remarks */}
                    {record.remark && (
                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border-l-4 border-gray-500 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-5 w-5 text-gray-600" />
                          <h4 className="font-bold text-gray-900">{t.common.remark}</h4>
                        </div>
                        <p className="text-gray-800 leading-relaxed">{record.remark}</p>
                      </div>
                    )}
                  </div>

                  {/* Images */}
                  {record.images && record.images.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <p className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        {t.common.images} ({record.images.length})
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {record.images.map((imageUrl, imgIndex) => (
                          <div
                            key={imgIndex}
                            className="relative group cursor-pointer"
                            onClick={() => handleImageClick(imageUrl)}
                          >
                            <img
                              src={imageUrl}
                              alt={`SOT/VFL Image ${imgIndex + 1}`}
                              className="w-full h-32 object-cover rounded-md shadow-md group-hover:shadow-lg transition-shadow pointer-events-none"
                              onError={handleImageError}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-md pointer-events-none" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>SOT/VFL Image</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-2">
            {selectedImage && (
              <div className="flex justify-center">
                <img
                  src={selectedImage}
                  alt="SOT/VFL image"
                  className="max-w-full max-h-[70vh] object-contain rounded"
                  onError={(e) => {
                    e.currentTarget.src =
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCA0MDAgMzAwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CiAgPHRleHQgeD0iMjAwIiB5PSIxNTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Q0E0QUYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiI+SW1hZ2UgY291bGQgbm90IGJlIGxvYWRlZDwvdGV4dD4KPC9zdmc+";
                  }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Delete SOT/VFL Report
            </h3>
            <p className="text-gray-600 mb-6">{t.common.deleteConfirm}</p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deletingRecordId !== null}
              >
                {t.common.cancel}
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteRecord(showDeleteConfirm)}
                disabled={deletingRecordId !== null}
              >
                {deletingRecordId === showDeleteConfirm
                  ? t.common.deleting
                  : t.common.delete}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
