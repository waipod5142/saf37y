"use client";

import React, { useState } from "react";
import { ToolboxManRecord } from "@/types/man";
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
  User,
  MessageSquare,
  CheckCircle,
  FileText,
  Camera,
  ToggleLeftIcon,
  ToggleRightIcon,
  Trash2Icon,
  Factory as FactoryIcon,
} from "lucide-react";
import { useManFormTranslation } from "@/lib/i18n/man-forms";

interface ToolboxManDetailClientProps {
  records: ToolboxManRecord[];
  bu: string;
}

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

export default function ToolboxManDetailClient({
  records,
  bu,
}: ToolboxManDetailClientProps) {
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
  const isWithinDeleteTimeWindow = (record: ToolboxManRecord) => {
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

  // Image click handler for popup modal
  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src =
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMkgxNFYxNkgyMFYyMlpNMjAgMzhIMTRWMzJIMjBWMzhaTTIwIDQ2SDE0VjQwSDIwVjQ2WiIgZmlsbD0iIzlDQTRBRiIvPgo8cGF0aCBkPSJNNTAgMjJINDRWMTZINTBWMjJaTTUwIDM4SDQ0VjMySDUwVjM4Wk01MCA0Nkg0NFY0MEg1MFY0NloiIGZpbGw9IiM5Q0E0QUYiLz4KPHBhdGggZD0iTTM1IDIySDI5VjE2SDM1VjIyWk0zNSAzOEgyOVYzMkgzNVYzOFpNMzUgNDZIMjlWNDBIMzVWNDZaIiBmaWxsPSIjOUNBNEFGIi8+Cjx0ZXh0IHg9IjMyIiB5PSIzNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzlDQTRBRiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjhweCI+RXJyb3I8L3RleHQ+Cjwvc3ZnPg==";
  };

  // Delete record handler with Firebase Storage cleanup
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
          No Toolbox Talk reports found for this machine.
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
            Toolbox Talk Reports ({showAllRecords ? records.length : 1} of{" "}
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
            return (
              <Card key={index} className="shadow-lg">
                {/* Header */}
                <CardHeader className="bg-gradient-to-r from-teal-50 to-green-50 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {index === 0 && (
                        <Badge variant="default" className="mr-2">
                          Latest
                        </Badge>
                      )}
                      <Badge className="bg-teal-500 text-white px-3 py-1 text-sm font-medium">
                        TOOLBOX
                      </Badge>
                      <div className="text-sm text-gray-600">
                        ID: {record.id}
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
                      {/* Presenter */}
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-semibold text-gray-700">
                            {t.toolbox.presenter}
                          </p>
                          <p className="text-gray-600">{record.presenter}</p>
                        </div>
                      </div>

                      {/* Subject */}
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-semibold text-gray-700">
                            {t.toolbox.subject}
                          </p>
                          <p className="text-gray-600">{record.subject}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      {/* Lesson Learned */}
                      <div>
                        <p className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          {t.toolbox.learn}
                        </p>
                        <div className="bg-green-50 p-3 rounded-md border-l-4 border-green-500">
                          <p className="text-gray-700">{record.learn}</p>
                        </div>
                      </div>

                      {/* Remarks */}
                      {record.remark && (
                        <div>
                          <p className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-gray-600" />
                            {t.common.remark}
                          </p>
                          <div className="bg-gray-50 p-3 rounded-md border-l-4 border-gray-500">
                            <p className="text-gray-700">{record.remark}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Images with click to popup */}
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
                              alt={`Toolbox Talk Image ${imgIndex + 1}`}
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

      {/* Image Modal for popup */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Toolbox Talk Image</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-2">
            {selectedImage && (
              <div className="flex justify-center">
                <img
                  src={selectedImage}
                  alt="Toolbox Talk image"
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

      {/* Delete Confirmation Dialog with Firebase Storage cleanup */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Delete Toolbox Talk Report
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
