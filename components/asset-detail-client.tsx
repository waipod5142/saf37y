"use client";

import React, { useState } from "react";
import { AssetTransaction, deleteAssetTransaction } from "@/lib/actions/assets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import {
  CalendarIcon,
  UserIcon,
  FileTextIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  MapPinIcon,
  ZoomInIcon,
  ImageIcon,
  Trash2Icon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface AssetDetailClientProps {
  records: AssetTransaction[];
}

export default function AssetDetailClient({ records }: AssetDetailClientProps) {
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setIsMapModalOpen(true);
  };

  const formatImageUrl = (image: string) => {
    // If it's already a full Firebase Storage URL, return as-is
    if (image.startsWith("https://firebasestorage.googleapis.com")) {
      return image;
    }

    // Otherwise, format it as a Firebase Storage URL
    return `https://firebasestorage.googleapis.com/v0/b/sccc-inseesafety-prod.firebasestorage.app/o/${encodeURIComponent(image)}?alt=media`;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src =
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMkgxNFYxNkgyMFYyMlpNMjAgMzhIMTRWMzJIMjBWMzhaTTIwIDQ2SDE0VjQwSDIwVjQ2WiIgZmlsbD0iIzlDQTRBRiIvPgo8cGF0aCBkPSJNNTAgMjJINDRWMTZINTBWMjJaTTUwIDM4SDQ0VjMySDUwVjM4Wk01MCA0Nkg0NFY0MEg1MFY0NloiIGZpbGw9IiM5Q0E0QUYiLz4KPHBhdGggZD0iTTM1IDIySDI5VjE2SDM1VjIyWk0zNSAzOEgyOVYzMkgzNVYzOFpNMzUgNDZIMjlWNDBIMzVWNDZaIiBmaWxsPSIjOUNBNEFGIi8+Cjx0ZXh0IHg9IjMyIiB5PSIzNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzlDQTRBRiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjhweCI+RXJyb3I8L3RleHQ+Cjwvc3ZnPg==";
  };

  const handleImageClick = (image: string) => {
    const imageUrl = formatImageUrl(image);
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  const getStatusBadgeColor = (status: string) => {
    if (status.includes("Active") || status.includes("Work")) {
      return "bg-green-500";
    } else if (status.includes("Idle")) {
      return "bg-lime-500";
    } else if (status.includes("Waiting")) {
      return "bg-yellow-500";
    } else if (status.includes("Breakdown") || status.includes("Damage")) {
      return "bg-rose-500";
    } else if (status.includes("Not Exist")) {
      return "bg-red-500";
    } else if (status.includes("Cannot Find")) {
      return "bg-purple-500";
    } else if (status.includes("Transferred")) {
      return "bg-teal-500";
    }
    return "bg-gray-500";
  };

  const isWithinDeleteTimeWindow = (record: AssetTransaction) => {
    const uploadedAt = record.uploadedAt;
    if (!uploadedAt) return false;

    try {
      const recordDate = new Date(uploadedAt);
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

  const handleDelete = async (recordId: string) => {
    setDeletingRecordId(recordId);
    try {
      const result = await deleteAssetTransaction(recordId);

      if (result.success) {
        toast.success("Record deleted successfully!");
        // Reload the page to refresh the data
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to delete record");
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setDeletingRecordId(null);
      setShowDeleteConfirm(null);
    }
  };

  const renderAssetRecord = (record: AssetTransaction, isLatest = false) => {
    return (
      <Card
        className={`${isLatest ? "border-blue-500 shadow-md" : ""}`}
        key={record.id}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">
                {isLatest && (
                  <Badge variant="default" className="mr-2 mb-2">
                    Latest
                  </Badge>
                )}
                <Badge variant="outline" className="mr-2 mb-2">
                  Asset {record.asset}-{record.sub}
                </Badge>
                Asset Tracking Record
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  {record.date}
                </div>
                {record.inspector && (
                  <div className="flex items-center gap-1">
                    <UserIcon className="h-4 w-4" />
                    {record.inspector}
                  </div>
                )}
              </div>

              {/* Location Information */}
              {record.lat && record.lng && (
                <button
                  onClick={() => handleMapClick(record.lat, record.lng)}
                  className="mt-3 p-2 text-gray-800 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                  title="View location on map"
                >
                  <MapPinIcon className="h-6 w-6 text-blue-500" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={`${getStatusBadgeColor(record.status)} text-white`}
              >
                {record.status}
              </Badge>
              {/* Delete Button - Only show for latest record within 5 minutes */}
              {record.id && isLatest && isWithinDeleteTimeWindow(record) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(record.id!)}
                  disabled={deletingRecordId === record.id}
                  className="ml-2 hover:bg-red-50 hover:border-red-300"
                  title="Delete this record (available for 5 minutes)"
                >
                  {deletingRecordId === record.id ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-b-transparent" />
                  ) : (
                    <Trash2Icon className="h-4 w-4 text-red-500" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Images */}
        {record.images && record.images.length > 0 && (
          <div className="mb-4 px-4">
            <Card className="border-2 border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-base text-gray-800">
                      Asset Images ({record.images.length})
                    </h4>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={`grid gap-4 ${record.images.length > 1 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1"}`}
                >
                  {record.images.map((image, index) => (
                    <div
                      key={index}
                      className="group relative aspect-square rounded-lg border-2 border-gray-200 overflow-hidden hover:border-blue-400 hover:shadow-xl transition-all duration-300 cursor-pointer bg-gray-50"
                      onClick={() => handleImageClick(image)}
                    >
                      <img
                        src={formatImageUrl(image)}
                        alt={`Asset image ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={handleImageError}
                      />

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center">
                        <ZoomInIcon className="h-8 w-8 text-white mb-2" />
                        <span className="text-white text-sm font-medium">
                          View Full Size
                        </span>
                      </div>

                      {/* Image number badge */}
                      {record.images.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded">
                          {index + 1}/{record.images.length}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <CardContent>
          {/* Asset Details */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500 font-medium block mb-1">
                  Quantity
                </span>
                <span className="text-gray-900 font-semibold">
                  {record.qty} {record.qtyR && `(${record.qtyR})`}
                </span>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500 font-medium block mb-1">
                  Place
                </span>
                <span className="text-gray-900 font-semibold">
                  {record.place}
                </span>
              </div>
            </div>

            {record.transferTo && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <span className="text-yellow-700 font-medium block mb-1">
                  Transfer To
                </span>
                <span className="text-yellow-900 font-semibold">
                  {record.transferTo}
                </span>
              </div>
            )}
          </div>

          {/* Remarks */}
          {record.remark && (
            <div className="mt-4">
              <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-1">
                <FileTextIcon className="h-4 w-4" />
                Remarks
              </h4>
              <p className="text-sm bg-gray-50 p-3 rounded border">
                {record.remark}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (records.length === 0) {
    return (
      <div className="mb-6">
        <p className="text-sm text-red-500 mt-2">
          No tracking records found for this asset.
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
            Asset Tracking Records ({showAllRecords ? records.length : 1} of{" "}
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
          {displayedRecords.map((record, index) => (
            <div key={record.id || index}>
              {renderAssetRecord(record, index === 0)}
            </div>
          ))}
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Asset Image</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-2">
            {selectedImage && (
              <div className="flex justify-center">
                <img
                  src={selectedImage}
                  alt="Asset image"
                  className="max-w-full max-h-[70vh] object-contain rounded"
                  onError={(e) => {
                    e.currentTarget.src =
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCA0MDAgMzAwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CiAgPHRleHQgeD0iMjAwIiB5PSIxNTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Q0E0QUYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNnB4Ij5JbWFnZSBjb3VsZCBub3QgYmUgbG9hZGVkPC90ZXh0Pgo8L3N2Zz4=";
                  }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Map Modal */}
      <Dialog open={isMapModalOpen} onOpenChange={setIsMapModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <MapPinIcon className="h-5 w-5" />
              Asset Location
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-2">
            {selectedLocation && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Coordinates:</div>
                  <div className="font-mono text-lg font-semibold">
                    {formatCoordinates(
                      selectedLocation.lat,
                      selectedLocation.lng
                    )}
                  </div>
                </div>

                <div className="w-full h-96 border rounded-lg overflow-hidden">
                  <iframe
                    src={`https://maps.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}&z=18&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Asset Location Map"
                  />
                </div>

                <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `https://maps.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}&z=18`,
                        "_blank"
                      )
                    }
                    className="flex items-center gap-2"
                  >
                    <MapPinIcon className="h-4 w-4" />
                    Open in Google Maps
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `${selectedLocation.lat},${selectedLocation.lng}`
                      )
                    }
                    className="flex items-center gap-2"
                  >
                    📋 Copy Coordinates
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!showDeleteConfirm}
        onOpenChange={(open) => !open && setShowDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Record?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this asset tracking record? This
              action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(null)}
              disabled={!!deletingRecordId}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                showDeleteConfirm && handleDelete(showDeleteConfirm)
              }
              disabled={!!deletingRecordId}
            >
              {deletingRecordId ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
