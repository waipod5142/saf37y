"use client";

import React, { useState } from "react";
import { TrainingManRecord } from "@/types/man";
import { deleteTrainingRecord } from "@/lib/actions/man";
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
  GraduationCap,
  Clock,
  Award,
  FileText,
  Camera,
  ToggleLeftIcon,
  ToggleRightIcon,
  Trash2Icon,
  User,
  Factory as FactoryIcon,
} from "lucide-react";
import { useManFormTranslation } from "@/lib/i18n/man-forms";

interface TrainingManDetailClientProps {
  records: TrainingManRecord[];
  bu: string;
}

// Get training status styling
const getTrainingStatusStyle = (status: string) => {
  if (!status) {
    return { color: "bg-gray-400 text-white", text: "N/A" };
  }

  switch (status.toLowerCase()) {
    case "active":
      return { color: "bg-green-500 text-white", text: "Active / ใช้งานได้" };
    case "expired":
      return { color: "bg-red-500 text-white", text: "Expired / หมดอายุ" };
    case "pending":
      return {
        color: "bg-orange-500 text-white",
        text: "Pending / รอดำเนินการ",
      };
    case "suspended":
      return { color: "bg-gray-500 text-white", text: "Suspended / ระงับ" };
    default:
      return { color: "bg-blue-500 text-white", text: status };
  }
};

// Format date
const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "N/A";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }

    return dateObj.toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};

export default function TrainingManDetailClient({
  records,
  bu,
}: TrainingManDetailClientProps) {
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

    try {
      if (timestamp.toDate && typeof timestamp.toDate === "function") {
        return timestamp.toDate();
      }

      if (timestamp._seconds !== undefined) {
        return new Date(
          timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000
        );
      }

      const dateObj = new Date(timestamp);
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        return null;
      }

      return dateObj;
    } catch (error) {
      console.error("Error converting Firebase timestamp:", error);
      return null;
    }
  };

  // Helper function to check if record is within 5-minute delete window
  const isWithinDeleteTimeWindow = (record: TrainingManRecord) => {
    const recordTimestamp = record.timestamp || record.createdAt;
    if (!recordTimestamp) return false;

    try {
      const recordDate = convertFirebaseTimestamp(recordTimestamp);
      if (!recordDate || isNaN(recordDate.getTime())) return false;

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
      const result = await deleteTrainingRecord(docId);
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
        <p className="text-sm text-green-500 mt-2">
          No Training records found for this employee.
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
            Training Records ({showAllRecords ? records.length : 1} of{" "}
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
            const statusInfo = getTrainingStatusStyle(record.status);

            return (
              <Card key={index} className="shadow-lg">
                {/* Header */}
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {index === 0 && (
                        <Badge variant="default" className="mr-2">
                          Latest
                        </Badge>
                      )}
                      <Badge className="bg-green-600 text-white px-3 py-1 text-sm font-medium">
                        TRAINING
                      </Badge>
                      <div className="text-sm text-gray-600">
                        Course: {record.courseId}
                      </div>
                      <div className="text-sm text-gray-600">
                        Employee: {record.empId}
                      </div>
                      {record.site && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <FactoryIcon className="h-4 w-4" />
                          Site: {record.site}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {formatDate(record.createdAt || record.timestamp)}
                      </div>
                      {record.docId && isWithinDeleteTimeWindow(record) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(record.docId!)}
                          disabled={deletingRecordId === record.docId}
                          className="ml-2 hover:bg-red-50 hover:border-red-300"
                        >
                          {deletingRecordId === record.docId ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-b-transparent" />
                          ) : (
                            <Trash2Icon className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      {/* Course Name */}
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-semibold text-gray-700">
                            ชื่อหลักสูตร / Course Name
                          </p>
                          <p className="text-gray-600">
                            {record.courseName}
                            {record.trainingCourse}
                          </p>
                        </div>
                      </div>

                      {/* Training Hours and Score */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-semibold text-gray-700">
                              ชั่วโมง / Hours
                            </p>
                            <p className="text-gray-600">{record.hours}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-purple-500" />
                          <div>
                            <p className="font-semibold text-gray-700">
                              คะแนน / Score
                            </p>
                            <p className="text-gray-600">{record.score}</p>
                          </div>
                        </div>
                      </div>

                      {/* Training Status */}
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-semibold text-gray-700 mb-2">
                            สถานะ / Status
                          </p>
                          <Badge className={`${statusInfo.color} px-3 py-1`}>
                            {statusInfo.text}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      {/* Training Date */}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-semibold text-gray-700">
                            วันที่อบรม / Training Date
                          </p>
                          <p className="text-gray-600">
                            {formatDate(record.trainingDate)}
                          </p>
                        </div>
                      </div>

                      {/* Expiry Date */}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-semibold text-gray-700">
                            วันหมดอายุ / Expiry Date
                          </p>
                          <p className="text-gray-600">
                            {record.expiryDate && formatDate(record.expiryDate)}
                            {record.expirationDate &&
                              formatDate(record.expirationDate)}
                          </p>
                        </div>
                      </div>

                      {/* Update Information */}
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-semibold text-gray-700">
                            อัปเดตโดย / Updated By
                          </p>
                          <p className="text-gray-600">{record.updateBy}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(record.updateAt)}
                          </p>
                        </div>
                      </div>

                      {/* Evidence Text */}
                      {record.evidenceText && (
                        <div>
                          <p className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-gray-600" />
                            หลักฐาน / Evidence
                          </p>
                          <div className="bg-gray-50 p-3 rounded-md border-l-4 border-gray-500">
                            <p className="text-gray-700">
                              {record.evidenceText}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Type*/}
                      {record.type && (
                        <div>
                          <p className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-gray-600" />
                            วิธีการ Upload / Type
                          </p>
                          <div className="bg-gray-50 p-3 rounded-md border-l-4 border-gray-500">
                            <p className="text-gray-700">{record.type}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Certificate Files */}
                  {record.files && record.files.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <p className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        ใบประกาศนียบัตรและเอกสาร / Certificates & Documents (
                        {record.files.length})
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {record.files.map((fileUrl, fileIndex) => (
                          <div
                            key={fileIndex}
                            className="relative group cursor-pointer"
                            onClick={() => handleImageClick(fileUrl)}
                          >
                            <img
                              src={fileUrl}
                              alt={`Training Certificate ${fileIndex + 1}`}
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
            <DialogTitle>Training Certificate</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-2">
            {selectedImage && (
              <div className="flex justify-center">
                <img
                  src={selectedImage}
                  alt="Training certificate"
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
              Delete Training Form Report
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
