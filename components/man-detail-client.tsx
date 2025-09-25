"use client";

import React, { useState } from "react";
import { ManRecord } from "@/types/man";
import { deleteManRecord } from "@/lib/actions/man";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, MapPin, User, AlertTriangle, CheckCircle, MessageSquare, FileText, Camera, ToggleLeftIcon, ToggleRightIcon, Trash2Icon } from "lucide-react";

interface ManDetailClientProps {
  records: ManRecord[];
}

// Safety issue categories with colors matching the form
const safetyIssueCategories = [
  { id: 'ppe', label: 'อุปกรณ์คุ้มครองความปลอดภัยส่วนบุคคล (PPE)', color: 'bg-blue-500' },
  { id: 'workingAtHight', label: 'การทำงานบนที่สูง (Working at Height)', color: 'bg-red-500' },
  { id: 'isolation', label: 'การตัดแยกแหล่งพลังงาน (Isolation of plant and equipment)', color: 'bg-orange-500' },
  { id: 'vehicles', label: 'ยานพาหนะและการจราจร (Vehicles and Traffic Safety)', color: 'bg-yellow-500' },
  { id: 'electrical', label: 'การทำงานกับไฟฟ้า (Electrical Safety)', color: 'bg-yellow-400' },
  { id: 'guarding', label: 'การ์ดของเครื่องจักร (Machine Guarding)', color: 'bg-green-500' },
  { id: 'hotwork', label: 'การทำงานความร้อนและประกายไฟ (Hot Work and Permits)', color: 'bg-teal-500' },
  { id: 'lifting', label: 'การทำงานยก (Lifting Equipment)', color: 'bg-blue-600' },
  { id: 'quarries', label: 'การทำงานเกี่ยวกับเหมือง (Quarries)', color: 'bg-indigo-500' },
  { id: 'hotMaterials', label: 'การทำงานกับวัสดุที่มีความร้อน (Hot Materials)', color: 'bg-purple-500' },
  { id: 'csm', label: 'การบริหารจัดการผู้รับเหมา (Contractor Management)', color: 'bg-pink-500' },
  { id: 'equipment', label: 'การใช้งานอุปกรณ์และเครื่องมือ (Portable Equipment)', color: 'bg-purple-400' },
  { id: 'generalWork', label: 'การทำงานทั่วไป (General Work Permits)', color: 'bg-gray-500' },
];

// Get safety issue category by ID
const getSafetyCategory = (id: string) => {
  return safetyIssueCategories.find(cat => cat.id === id) || { id, label: id, color: 'bg-gray-400' };
};

// Get risk level styling
const getRiskLevelStyle = (level: string) => {
  switch (level) {
    case 'low':
      return { color: 'bg-green-500 text-white', text: 'ต่ำ (Low)' };
    case 'medium':
      return { color: 'bg-orange-500 text-white', text: 'ปานกลาง (Medium)' };
    case 'high':
      return { color: 'bg-red-500 text-white', text: 'สูง (High)' };
    default:
      return { color: 'bg-gray-500 text-white', text: level };
  }
};

// Format date
const formatDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function ManDetailClient({ records }: ManDetailClientProps) {
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
  const isWithinDeleteTimeWindow = (record: ManRecord) => {
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
        <p className="text-sm text-red-500 mt-2">No SOT/VFL reports found for this machine.</p>
      </div>
    );
  }

  const displayedRecords = showAllRecords ? records : records.slice(0, 1);

  return (
    <div className="mb-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            SOT/VFL Reports ({showAllRecords ? records.length : 1} of {records.length} record{records.length > 1 ? 's' : ''})
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
                  Show Latest Only
                </>
              ) : (
                <>
                  <ToggleLeftIcon className="h-4 w-4" />
                  Show All Records
                </>
              )}
            </Button>
          )}
        </div>

        {/* Records */}
        <div className="space-y-4">
          {displayedRecords.map((record, index) => {
        const riskStyle = getRiskLevelStyle(record.riskLevel);

        return (
          <Card key={index} className="shadow-lg">
            {/* Header */}
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  {index === 0 && <Badge variant="default" className="mr-2">Latest</Badge>}
                  <Badge
                    className={`${
                      record.report === 'sot' ? 'bg-red-500' : 'bg-blue-500'
                    } text-white px-3 py-1 text-sm font-medium`}
                  >
                    {record.report?.toUpperCase() || 'UNKNOWN'}
                  </Badge>
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
                  {/* Area & Observer */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-semibold text-gray-700">พื้นที่ / Area</p>
                        <p className="text-gray-600">{record.area}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-semibold text-gray-700">ผู้สังเกตการณ์ / Observer</p>
                        <p className="text-gray-600">{record.talkwith}</p>
                      </div>
                    </div>
                  </div>

                  {/* Risk Level */}
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-semibold text-gray-700 mb-1">ระดับความเสี่ยง / Risk Level</p>
                      <Badge className={`${riskStyle.color} px-3 py-1`}>
                        {riskStyle.text}
                      </Badge>
                    </div>
                  </div>

                  {/* Safety Issues */}
                  {record.topics && record.topics.length > 0 && (
                    <div>
                      <p className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        ประเด็นความปลอดภัย / Safety Issues
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {record.topics.map((topicId, topicIndex) => {
                          const category = getSafetyCategory(topicId);
                          return (
                            <Badge
                              key={topicIndex}
                              className={`${category.color} text-white text-xs px-2 py-1`}
                            >
                              {category.label}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Positive Reinforcement */}
                  {record.safe && (
                    <div>
                      <p className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        การชมเชย / Positive Reinforcement
                      </p>
                      <div className="bg-green-50 p-3 rounded-md border-l-4 border-green-500">
                        <p className="text-gray-700">{record.safe}</p>
                      </div>
                    </div>
                  )}

                  {/* Safety Care */}
                  {record.care && (
                    <div>
                      <p className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        ความห่วงใย / Safety Care
                      </p>
                      <div className="bg-orange-50 p-3 rounded-md border-l-4 border-orange-500">
                        <p className="text-gray-700">{record.care}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Comments */}
                  {record.actionComment && (
                    <div>
                      <p className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                        มาตรการแก้ไข / Action Comments
                      </p>
                      <div className="bg-blue-50 p-3 rounded-md border-l-4 border-blue-500">
                        <p className="text-gray-700">{record.actionComment}</p>
                      </div>
                    </div>
                  )}

                  {/* Remarks */}
                  {record.remark && (
                    <div>
                      <p className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gray-600" />
                        หมายเหตุ / Remarks
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
                    รูปภาพประกอบ / Images ({record.images.length})
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
            <h3 className="text-lg font-semibold mb-4">Delete SOT/VFL Report</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this SOT/VFL report? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deletingRecordId !== null}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteRecord(showDeleteConfirm)}
                disabled={deletingRecordId !== null}
              >
                {deletingRecordId === showDeleteConfirm ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}