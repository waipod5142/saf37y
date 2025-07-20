"use client";

import React, { useState } from "react";
import { MachineInspectionRecord } from "@/types/machineInspectionRecord";
import { MachineItem } from "@/lib/machine-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarIcon, UserIcon, FileTextIcon, ToggleLeftIcon, ToggleRightIcon, Trash2Icon } from "lucide-react";
import { deleteMachineInspectionRecord } from "@/lib/actions/machines";

interface MachineDetailClientProps {
  records: MachineInspectionRecord[];
  questions: MachineItem[];
}

export default function MachineDetailClient({ records, questions }: MachineDetailClientProps) {
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Create a mapping from question name to question text for descriptive display
  const questionMapping = React.useMemo(() => {
    const mapping: { [key: string]: string } = {};
    questions.forEach((question) => {
      mapping[question.name] = question.question;
    });
    return mapping;
  }, [questions]);

  const formatImageUrl = (image: string) => {
    return `https://firebasestorage.googleapis.com/v0/b/sccc-inseesafety-prod.firebasestorage.app/o/${encodeURIComponent(image)}?alt=media`;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMkgxNFYxNkgyMFYyMlpNMjAgMzhIMTRWMzJIMjBWMzhaTTIwIDQ2SDE0VjQwSDIwVjQ2WiIgZmlsbD0iIzlDQTRBRiIvPgo8cGF0aCBkPSJNNTAgMjJINDRWMTZINTBWMjJaTTUwIDM4SDQ0VjMySDUwVjM4Wk01MCA0Nkg0NFY0MEg1MFY0NloiIGZpbGw9IiM5Q0E0QUYiLz4KPHBhdGggZD0iTTM1IDIySDI5VjE2SDM1VjIyWk0zNSAzOEgyOVYzMkgzNVYzOFpNMzUgNDZIMjlWNDBIMzVWNDZaIiBmaWxsPSIjOUNBNEFGIi8+Cjx0ZXh0IHg9IjMyIiB5PSIzNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzlDQTRBRiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjhweCI+RXJyb3I8L3RleHQ+Cjwvc3ZnPg==';
  };

  const handleImageClick = (image: string) => {
    const imageUrl = formatImageUrl(image);
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
      let date: Date;
      
      // Handle Firebase Timestamp
      if (timestamp.toDate) {
        date = timestamp.toDate();
      }
      // Handle regular Date object
      else if (timestamp instanceof Date) {
        date = timestamp;
      }
      // Handle string dates
      else {
        date = new Date(timestamp);
      }
      
      // Calculate days difference
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const inspectionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      const diffTime = today.getTime() - inspectionDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const formattedDateTime = date.toLocaleString("en-GB", { hour12: false });
      
      if (diffDays === 0) {
        // Today - show normal format
        return formattedDateTime;
      } else if (diffDays === 1) {
        // Yesterday
        return `1 day ago - ${formattedDateTime}`;
      } else if (diffDays > 1) {
        // Multiple days ago
        return `${diffDays} days ago - ${formattedDateTime}`;
      } else {
        // Future date (shouldn't happen for inspection records, but handle gracefully)
        return formattedDateTime;
      }
      
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getQuestionGroups = (record: MachineInspectionRecord) => {
    const groups: { [questionName: string]: { status: any, remark?: string, images?: string[] } } = {};
    
    Object.keys(record).forEach(key => {
      if (key.endsWith('R')) {
        // Remark field
        const questionName = key.slice(0, -1);
        if (!groups[questionName]) groups[questionName] = { status: null };
        groups[questionName].remark = record[key];
      } else if (key.endsWith('P')) {
        // Images field  
        const questionName = key.slice(0, -1);
        if (!groups[questionName]) groups[questionName] = { status: null };
        groups[questionName].images = Array.isArray(record[key]) ? record[key] : [record[key]];
      } else if (!['id', 'bu', 'type', 'inspector', 'timestamp', 'createdAt', 'remark', 'images', 'docId'].includes(key)) {
        // Status field
        if (!groups[key]) groups[key] = { status: null };
        groups[key].status = record[key];
      }
    });
    
    return groups;
  };

  const getInspectionResult = (record: MachineInspectionRecord) => {
    // Check for common pass/fail indicators
    const keys = Object.keys(record);
    const resultKeys = keys.filter(key => 
      key !== 'id' && key !== 'bu' && key !== 'type' && key !== 'inspector' && 
      key !== 'timestamp' && key !== 'createdAt' && key !== 'remark' && 
      key !== 'images' && key !== 'docId' && !key.endsWith('R') && !key.endsWith('P')
    );
    
    const failedItems = resultKeys.filter(key => 
      record[key] === 'fail' || record[key] === false
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
                variant={result.status === 'Passed' ? 'success' : result.status === 'Failed' ? 'destructive' : 'default'}
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
            <div className="text-sm text-gray-600 mb-3">
              {result.status === 'Passed' 
                ? `All ${result.total} items passed inspection`
                : `${result.count} of ${result.total} items failed inspection`
              }
            </div>
            
            {/* Individual Inspection Items */}
            <div className="space-y-2">
              <h5 className="font-medium text-xs text-gray-600 mb-2">Detailed Results:</h5>
              <div className="grid gap-2">
                {Object.keys(record)
                  .filter(key => 
                    key !== 'id' && key !== 'bu' && key !== 'type' && key !== 'inspector' && 
                    key !== 'timestamp' && key !== 'createdAt' && key !== 'remark' && 
                    key !== 'images' && key !== 'docId' &&
                    !key.endsWith('R') && !key.endsWith('P') // Exclude remark and image fields
                  )
                  .map(key => {
                    const value = record[key];
                    const isPassed = value === 'pass' || value === true || value === 'Passed';
                    const isFailed = value === 'fail' || value === false || value === 'Failed';
                    
                    return (
                      <div 
                        key={key} 
                        className={`flex justify-between items-center text-xs px-3 py-2 rounded border ${
                          isFailed 
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        <span className="font-medium">
                          {questionMapping[key] || key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <Badge 
                          variant={isPassed ? "success" : isFailed ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {String(value)}
                        </Badge>
                      </div>
                    );
                  })}
              </div>
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
                      src={formatImageUrl(image)}
                      alt={`Inspection image ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                      onError={handleImageError}
                      onClick={() => handleImageClick(image)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Defect Details Section */}
          {result.status === 'Failed' && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm text-gray-700 mb-3">Defect Details</h4>
              <div className="space-y-4">
                {Object.entries(getQuestionGroups(record))
                  .filter(([questionName, data]) => data.status === 'fail' || data.status === false)
                  .map(([questionName, data]) => (
                    <div key={questionName} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      {/* Question Status */}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="destructive" className="text-xs">Failed</Badge>
                        <span className="font-medium text-sm text-red-800">
                          {questionMapping[questionName] || questionName.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                      
                      {/* Remark */}
                      {data.remark && (
                        <div className="mb-3">
                          <span className="text-xs font-medium text-red-700">Remark: </span>
                          <span className="text-xs text-red-600">{data.remark}</span>
                        </div>
                      )}
                      
                      {/* Images */}
                      {data.images && data.images.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-red-700 block mb-2">
                            Defect Images ({data.images.length}):
                          </span>
                          <div className="flex gap-2 flex-wrap">
                            {data.images.map((image, index) => (
                              <div key={index} className="w-16 h-16 rounded border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                                <img 
                                  src={formatImageUrl(image)}
                                  alt={`${questionName} defect image ${index + 1}`}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                                  onError={handleImageError}
                                  onClick={() => handleImageClick(image)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
        <p className="text-sm text-red-500 mt-2">No inspection records found for this machine.</p>
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