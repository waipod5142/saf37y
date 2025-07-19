"use client";

import { useState } from "react";
import { MachineInspectionRecord } from "@/types/machineInspectionRecord";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarIcon, UserIcon, FileTextIcon, ToggleLeftIcon, ToggleRightIcon, Trash2Icon } from "lucide-react";
import { deleteMachineInspectionRecord } from "@/lib/actions/machines";

interface MachineDetailClientProps {
  records: MachineInspectionRecord[];
}

export default function MachineDetailClient({ records }: MachineDetailClientProps) {
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const handleImageClick = (image: string) => {
    const imageUrl = `https://firebasestorage.googleapis.com/v0/b/sccc-inseesafety-prod.firebasestorage.app/o/${encodeURIComponent(image)}?alt=media`;
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  const handleDeleteRecord = async (docId: string) => {
    if (!docId) return;
    
    setDeletingRecordId(docId);
    try {
      const result = await deleteMachineInspectionRecord(docId);
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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    try {
      // Handle Firebase Timestamp
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString();
      }
      // Handle regular Date object
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
      }
      // Handle string dates
      return new Date(timestamp).toLocaleDateString();
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getInspectionResult = (record: MachineInspectionRecord) => {
    // Check for common pass/fail indicators
    const keys = Object.keys(record);
    const resultKeys = keys.filter(key => 
      key !== 'id' && key !== 'bu' && key !== 'type' && key !== 'inspector' && 
      key !== 'timestamp' && key !== 'createdAt' && key !== 'remark' && 
      key !== 'images' && key !== 'docId'
    );
    
    const failedItems = resultKeys.filter(key => 
      record[key] === 'NotPass' || record[key] === 'Fail' || record[key] === false
    );
    
    if (failedItems.length > 0) {
      return { status: 'Failed', count: failedItems.length, total: resultKeys.length };
    }
    
    return { status: 'Passed', count: resultKeys.length, total: resultKeys.length };
  };

  const renderInspectionRecord = (record: MachineInspectionRecord, isLatest = false) => {
    const result = getInspectionResult(record);
    
    return (
      <Card className={`${isLatest ? 'border-blue-500 bg-yellow-100 shadow-md' : 'bg-yellow-50'}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">
                {isLatest && <Badge variant="default" className="mr-2 mb-2">Latest</Badge>}
                Inspection Record
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  {formatDate(record.timestamp || record.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  <UserIcon className="h-4 w-4" />
                  {record.inspector || "Unknown Inspector"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={result.status === 'Passed' ? 'default' : 'destructive'}
                className="ml-2"
              >
                {result.status}
              </Badge>
              {record.docId && (
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
        
        <CardContent>
          {/* Inspection Results Summary */}
          <div className="mb-4">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Inspection Results</h4>
            <div className="text-sm text-gray-600">
              {result.status === 'Passed' 
                ? `All ${result.total} items passed inspection`
                : `${result.count} of ${result.total} items failed inspection`
              }
            </div>
          </div>

          {/* Remarks */}
          {record.remark && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-1">
                <FileTextIcon className="h-4 w-4" />
                Remarks
              </h4>
              <p className="text-sm bg-gray-50 p-3 rounded border">{record.remark}</p>
            </div>
          )}

          {/* Images */}
          {record.images && record.images.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Images</h4>
              <div className="flex gap-2 flex-wrap">
                {record.images.map((image, index) => (
                  <div key={index} className="w-20 h-20 rounded border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    <img 
                      src={`https://firebasestorage.googleapis.com/v0/b/sccc-inseesafety-prod.firebasestorage.app/o/${encodeURIComponent(
                        image
                      )}?alt=media`}
                      alt={`Inspection image ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNS4zMzMzIDI4SDE2LjY2NjdWMjEuMzMzM0gyNS4zMzMzVjI4Wk0yNS4zMzMzIDQ2LjY2NjdIMTYuNjY2N1Y0MEgyNS4zMzMzVjQ2LjY2NjdaTTI1LjMzMzMgNTguNjY2N0gxNi42NjY3VjUySDI1LjMzMzNWNTguNjY2N1oiIGZpbGw9IiM5Q0E0QUYiLz4KPHBhdGggZD0iTTYzLjMzMzMgMjhINTQuNjY2N1YyMS4zMzMzSDYzLjMzMzNWMjhaTTYzLjMzMzMgNDYuNjY2N0g1NC42NjY3VjQwSDYzLjMzMzNWNDYuNjY2N1pNNjMuMzMzMyA1OC42NjY3SDU0LjY2NjdWNTJINjMuMzMzM1Y1OC42NjY3WiIgZmlsbD0iIzlDQTRBRiIvPgo8cGF0aCBkPSJNNDQuMzMzMyAyOEgzNS42NjY3VjIxLjMzMzNINDQuMzMzM1YyOFpNNDQuMzMzMyA0Ni42NjY3SDM1LjY2NjdWNDBINDQuMzMzM1Y0Ni42NjY3Wk00NC4zMzMzIDU4LjY2NjdIMzUuNjY2N1Y1Mkg0NC4zMzMzVjU4LjY2NjdaIiBmaWxsPSIjOUNBNEFGIi8+Cjx0ZXh0IHg9IjQwIiB5PSIzNyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzlDQTRBRiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIj5FcnJvcjwvdGV4dD4KPC9zdmc+';
                      }}
                      onClick={() => handleImageClick(image)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed Items Details */}
          {result.status === 'Failed' && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Failed Items</h4>
              <div className="space-y-1">
                {Object.keys(record)
                  .filter(key => 
                    key !== 'id' && key !== 'bu' && key !== 'type' && key !== 'inspector' && 
                    key !== 'timestamp' && key !== 'createdAt' && key !== 'remark' && 
                    key !== 'images' && key !== 'docId' &&
                    (record[key] === 'NotPass' || record[key] === 'Fail' || record[key] === false)
                  )
                  .map(key => (
                    <div key={key} className="text-sm bg-red-50 text-red-700 px-2 py-1 rounded">
                      {key.replace(/([A-Z])/g, ' $1').trim()}: {String(record[key])}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (records.length === 0) {
    return (
      <div className="mb-6">
        <p className="text-sm text-gray-500 mt-2">No inspection records found for this machine.</p>
      </div>
    );
  }

  const displayedRecords = showAllRecords ? records : records.slice(0, 1);

  return (
    <div className="mb-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Machine Inspection Records ({showAllRecords ? records.length : 1} of {records.length} record{records.length > 1 ? 's' : ''})
          </h3>
          
          {/* Toggle Button */}
          {records.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllRecords(!showAllRecords)}
              className={`flex items-center gap-2 ${showAllRecords ? 'bg-rose-100' : 'bg-green-100'}`}
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
            <div key={record.docId || record.id || index}>
              {renderInspectionRecord(record, index === 0)}
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Inspection Record</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this inspection record? This action cannot be undone.
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

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Inspection Image</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-2">
            {selectedImage && (
              <div className="flex justify-center">
                <img
                  src={selectedImage}
                  alt="Inspection image"
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
    </div>
  );
}