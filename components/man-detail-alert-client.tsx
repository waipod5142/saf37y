"use client";

import React, { useState } from "react";
import { AlertManRecord } from "@/types/man";
import { deleteManRecord } from "@/lib/actions/man";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, AlertTriangle, BookOpen, FileText, Camera, ToggleLeftIcon, ToggleRightIcon, Trash2Icon, ClipboardCheck } from "lucide-react";
import { useManFormTranslation } from "@/lib/i18n/man-forms";

interface AlertManDetailClientProps {
  records: AlertManRecord[];
  bu: string;
}

// Accident type categories with colors and labels
const accidentTypeCategories = {
  'lostTime': {
    label: 'Lost Time Injury',
    color: 'bg-red-500 text-white',
    description: 'อุบัติเหตุที่ทำให้เสียเวลาการทำงาน'
  },
  'medicalTreatment': {
    label: 'Medical Treatment',
    color: 'bg-orange-500 text-white',
    description: 'อุบัติเหตุที่ต้องรักษาพยาบาล'
  },
  'firstAid': {
    label: 'First Aid',
    color: 'bg-yellow-500 text-white',
    description: 'อุบัติเหตุที่ต้องปฐมพยาบาล'
  },
  'nearMiss': {
    label: 'Near Miss',
    color: 'bg-blue-500 text-white',
    description: 'เหตุการณ์เกือบเกิดอุบัติเหตุ'
  },
  'propertyDamage': {
    label: 'Property Damage',
    color: 'bg-purple-500 text-white',
    description: 'ความเสียหายต่อทรัพย์สิน'
  }
};

// Get accident type styling and info
const getAccidentTypeInfo = (type: string) => {
  return accidentTypeCategories[type as keyof typeof accidentTypeCategories] || {
    label: type,
    color: 'bg-gray-500 text-white',
    description: type
  };
};

// Get acknowledgment status styling - will be created inside component to access translations
const createGetAcknowledgmentStyle = (t: any) => (status: string) => {
  switch (status.toLowerCase()) {
    case 'yes':
    case 'acknowledged':
    case 'true':
      return { color: 'bg-green-500 text-white', text: t.alert.acknowledged };
    case 'no':
    case 'pending':
    case 'false':
      return { color: 'bg-orange-500 text-white', text: t.alert.pending };
    default:
      return { color: 'bg-gray-500 text-white', text: status };
  }
};

// Format date
const formatDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

export default function AlertManDetailClient({ records, bu }: AlertManDetailClientProps) {
  const { t } = useManFormTranslation(bu);
  const getAcknowledgmentStyle = createGetAcknowledgmentStyle(t);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Utility function for Firebase timestamp conversion
  const convertFirebaseTimestamp = (timestamp: any): Date | null => {
    if (!timestamp) return null;

    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }

    if (timestamp._seconds !== undefined) {
      return new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
    }

    return new Date(timestamp);
  };

  // Helper function to check if record is within 5-minute delete window
  const isWithinDeleteTimeWindow = (record: AlertManRecord) => {
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
    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMkgxNFYxNkgyMFYyMlpNMjAgMzhIMTRWMzJIMjBWMzhaTTIwIDQ2SDE0VjQwSDIwVjQ2WiIgZmlsbD0iIzlDQTRBRiIvPgo8cGF0aCBkPSJNNTAgMjJINDRWMTZINTBWMjJaTTUwIDM4SDQ0VjMySDUwVjM4Wk01MCA0Nkg0NFY0MEg1MFY0NloiIGZpbGw9IiM5Q0E0QUYiLz4KPHBhdGggZD0iTTM1IDIySDI5VjE2SDM1VjIyWk0zNSAzOEgyOVYzMkgzNVYzOFpNMzUgNDZIMjlWNDBIMzVWNDZaIiBmaWxsPSIjOUNBNEFGIi8+Cjx0ZXh0IHg9IjMyIiB5PSIzNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzlDQTRBRiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjhweCI+RXJyb3I8L3RleHQ+Cjwvc3ZnPg==';
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
        <p className="text-sm text-red-500 mt-2">{t.alert.noReports}</p>
      </div>
    );
  }

  const displayedRecords = showAllRecords ? records : records.slice(0, 1);

  return (
    <div className="mb-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {t.alert.reportsCount} ({showAllRecords ? records.length : 1} {t.alert.of} {records.length} {records.length > 1 ? t.alert.records : t.alert.record})
          </h3>

          {/* Toggle Button */}
          {records.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllRecords(!showAllRecords)}
              className={`flex items-center gap-2 ${showAllRecords ? 'bg-red-100' : 'bg-green-100'}`}
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
        const accidentInfo = getAccidentTypeInfo(record.typeAccident);
        const acknowledgmentInfo = getAcknowledgmentStyle(record.acknowledge);

        return (
          <Card key={index} className="shadow-lg">
            {/* Header */}
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  {index === 0 && <Badge variant="default" className="mr-2">{t.alert.latest}</Badge>}
                  <Badge className="bg-red-600 text-white px-3 py-1 text-sm font-medium">
                    {t.alert.alertForm.toUpperCase()}
                  </Badge>
                  <div className="text-sm text-gray-600">
                    Alert No: {record.alertNo}
                  </div>
                  <div className="text-sm text-gray-600">
                    ID: {record.id}
                  </div>
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
                  {/* Alert Number */}
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-semibold text-gray-700">{t.alert.alertNumber}</p>
                      <p className="text-gray-600 font-mono">{record.alertNo}</p>
                    </div>
                  </div>

                  {/* Accident Type */}
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-semibold text-gray-700 mb-2">{t.alert.accidentType}</p>
                      <Badge className={`${accidentInfo.color} px-3 py-1`}>
                        {accidentInfo.label}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">{accidentInfo.description}</p>
                    </div>
                  </div>

                  {/* Acknowledgment Status */}
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-semibold text-gray-700 mb-2">{t.alert.acknowledgmentStatus}</p>
                      <Badge className={`${acknowledgmentInfo.color} px-3 py-1`}>
                        {acknowledgmentInfo.text}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Learning Points */}
                  {record.learn && (
                    <div>
                      <p className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        {t.alert.learningPoints}
                      </p>
                      <div className="bg-blue-50 p-3 rounded-md border-l-4 border-blue-500">
                        <p className="text-gray-700">{record.learn}</p>
                      </div>
                    </div>
                  )}

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
                          alt={`${t.alert.imageAlt} ${imgIndex + 1}`}
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
            <DialogTitle>{t.alert.imageModalTitle}</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-2">
            {selectedImage && (
              <div className="flex justify-center">
                <img
                  src={selectedImage}
                  alt={t.alert.imageAlt}
                  className="max-w-full max-h-[70vh] object-contain rounded"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCA0MDAgMzAwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CiAgPHRleHQgeD0iMjAwIiB5PSIxNTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Q0E0QUYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiI+SW1hZ2UgY291bGQgbm90IGJlIGxvYWRlZDwvdGV4dD4KPC9zdmc+';
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
            <h3 className="text-lg font-semibold mb-4">{t.alert.deleteTitle}</h3>
            <p className="text-gray-600 mb-6">
              {t.common.deleteConfirm}
            </p>
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
                {deletingRecordId === showDeleteConfirm ? t.common.deleting : t.common.delete}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}