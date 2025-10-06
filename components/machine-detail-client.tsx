"use client";

import React, { useState, useEffect } from "react";
import { MachineInspectionRecord } from "@/types/machineInspectionRecord";
import { MachineItem } from "@/lib/machine-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarIcon, UserIcon, FileTextIcon, ToggleLeftIcon, ToggleRightIcon, Trash2Icon, MapPinIcon, WrenchIcon, CheckIcon, AwardIcon, GaugeIcon, FactoryIcon } from "lucide-react";
import { deleteMachineInspectionRecord, updateMachineInspectionRecord } from "@/lib/actions/machines";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MultiImageUploader, { ImageUpload } from "@/components/multi-image-uploader";
import { auth, storage } from "@/firebase/client";
import { signInAnonymously } from "firebase/auth";
import { ref, uploadBytesResumable, UploadTask } from "firebase/storage";
import { Certificate } from "crypto";
import { convertFirebaseTimestamp, formatRelativeDateTime } from "@/components/ui/date-utils";

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
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [showDefectResponseModal, setShowDefectResponseModal] = useState<string | null>(null);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [responder, setResponder] = useState('');
  const [defectAnswers, setDefectAnswers] = useState<{ [questionName: string]: string }>({});
  const [defectFixImages, setDefectFixImages] = useState<{ [questionName: string]: ImageUpload[] }>({});

  // Create a mapping from question name to question text for descriptive display
  const questionMapping = React.useMemo(() => {
    const mapping: { [key: string]: string } = {};
    questions.forEach((question) => {
      mapping[question.name] = question.question;
    });
    return mapping;
  }, [questions]);

  // Populate form with existing data when modal opens
  useEffect(() => {
    if (showDefectResponseModal) {
      const currentRecord = records.find(r => (r.docId || r.id) === showDefectResponseModal);
      if (currentRecord) {
        // Set responder if exists
        if (currentRecord.responder) {
          setResponder(currentRecord.responder);
        }
        
        // Set existing answers and images
        const answers: { [key: string]: string } = {};
        const images: { [key: string]: ImageUpload[] } = {};
        
        Object.keys(currentRecord).forEach(key => {
          if (key.endsWith('A')) {
            const questionName = key.slice(0, -1);
            answers[questionName] = currentRecord[key];
          } else if (key.endsWith('F') && Array.isArray(currentRecord[key])) {
            const questionName = key.slice(0, -1);
            images[questionName] = currentRecord[key].map((url: string, index: number) => ({
              id: `existing-${index}`,
              url,
            }));
          }
        });
        
        setDefectAnswers(answers);
        setDefectFixImages(images);
      }
    } else {
      // Reset form when modal closes
      setResponder('');
      setDefectAnswers({});
      setDefectFixImages({});
    }
  }, [showDefectResponseModal, records]);

  // Helper function to check if record is within 5-minute delete window
  const isWithinDeleteTimeWindow = (record: MachineInspectionRecord) => {
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

  // Helper functions for location formatting
  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const formatLocationTimestamp = (timestamp: any) => {
    if (!timestamp) return "N/A";
    try {
      const date = convertFirebaseTimestamp(timestamp);
      if (!date) return "N/A";
      
      return `Captured: ${date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric", 
        year: "numeric" 
      })} at ${date.toLocaleTimeString("en-US", { 
        hour: "numeric", 
        minute: "2-digit",
        hour12: true 
      })}`;
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy <= 10) return "text-green-700 bg-green-50";
    if (accuracy <= 50) return "text-yellow-700 bg-yellow-50";
    return "text-red-700 bg-red-50";
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setIsMapModalOpen(true);
  };

  const handleSubmitDefectResponse = async (record: MachineInspectionRecord) => {
    if (!record.docId || !responder.trim()) return;
    
    setIsSubmittingResponse(true);
    try {
      // Authenticate anonymously if not already authenticated (for Storage upload)
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (authError) {
          console.error("Authentication error:", authError);
          alert("Authentication failed. Please try again.");
          return;
        }
      }

      // Prepare the update data
      const updateData: Record<string, any> = {
        responder: responder.trim()
      };

      // Add question-specific answer fields (questionName + "A")
      Object.keys(defectAnswers).forEach(questionName => {
        if (defectAnswers[questionName]) {
          updateData[questionName + "A"] = defectAnswers[questionName];
        }
      });

      // Upload fix images to Firebase Storage and get paths
      const uploadTasks: UploadTask[] = [];
      const questionImagePaths: { [questionName: string]: string[] } = {};

      // Process each question's fix images
      Object.keys(defectFixImages).forEach(questionName => {
        const images = defectFixImages[questionName];
        if (images && images.length > 0) {
          questionImagePaths[questionName] = [];
          
          images.forEach((image, index) => {
            if (image.file) {
              // Create path for fix images: Machine/{bu}/{type}/{id}/{questionName}/fix-{timestamp}-{index}-{filename}
              const path = `Machine/${record.bu}/${record.type.toLowerCase()}/${record.id}/${questionName}/fix-${Date.now()}-${index}-${image.file.name}`;
              questionImagePaths[questionName].push(path);
              const storageRef = ref(storage, path);
              uploadTasks.push(uploadBytesResumable(storageRef, image.file));
            } else if (image.url && !image.url.startsWith('blob:')) {
              // Keep existing Firebase Storage URLs
              questionImagePaths[questionName].push(image.url);
            }
          });
        }
      });

      // Wait for all image uploads to complete
      if (uploadTasks.length > 0) {
        try {
          await Promise.all(uploadTasks);
        } catch (uploadError) {
          console.error("Image upload error:", uploadError);
          alert("Failed to upload images. Please try again.");
          return;
        }
      }

      // Add question-specific fix image paths (questionName + "F")
      Object.keys(questionImagePaths).forEach(questionName => {
        if (questionImagePaths[questionName].length > 0) {
          updateData[questionName + "F"] = questionImagePaths[questionName];
        }
      });

      // Update the machinetr record using server action
      const result = await updateMachineInspectionRecord(record.docId, updateData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update record');
      }
      
      // Reset form and close modal
      setResponder('');
      setDefectAnswers({});
      setDefectFixImages({});
      setShowDefectResponseModal(null);
      
      // Reload page to show updated data
      window.location.reload();
      
    } catch (error) {
      console.error('Error submitting defect response:', error);
      alert('Failed to submit defect response. Please try again.');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const formatImageUrl = (image: string) => {
    // If it's already a full Firebase Storage URL, return as-is
    if (image.startsWith('https://firebasestorage.googleapis.com')) {
      return image;
    }
    
    // Otherwise, format it as a Firebase Storage URL
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
      } else if (!['id', 'bu', 'type', 'inspector', 'timestamp', 'createdAt', 'updatedAt', 'remark', 'images', 'docId', 'site', 'latitude', 'longitude', 'locationTimestamp', 'locationAccuracy'].includes(key)) {
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
      key !== 'timestamp' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'remark' && 
      key !== 'images' && key !== 'docId' && key !== 'site' && 
      key !== 'latitude' && key !== 'longitude' && key !== 'locationTimestamp' && key !== 'locationAccuracy' &&
      !key.endsWith('R') && !key.endsWith('P')
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
      <Card className={`${isLatest ? 'border-blue-500 shadow-md' : ''} ${
        result.status === 'Failed' ? 'bg-red-50' : 'bg-green-50'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">
                {isLatest && <Badge variant="default" className="mr-2 mb-2">Latest</Badge>}
                {record.type && (
                  <Badge variant="outline" className="mr-2 mb-2 capitalize">
                    {record.type}
                  </Badge>
                )}
                Inspection Record
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  {formatRelativeDateTime(record.timestamp || record.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  <UserIcon className="h-4 w-4" />
                  {record.inspector || "Unknown Inspector"}
                </div>
                {record.site && (
                  <div className="flex items-center gap-1">
                    <FactoryIcon className="h-4 w-4" />
                    {record.site}
                  </div>
                )}
              </div>
              
              {/* Certificate Section */}
              {record.certificate && (
                <div className="mt-3">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 px-3 py-2 rounded-lg shadow-sm">
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full shadow-sm">
                      <AwardIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-amber-800 uppercase tracking-wide">Certification</div>
                      <div className="text-sm font-semibold text-amber-900">{record.certificate}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Certificate Section */}
              {record.mileage && (
                <div className="mt-3">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 px-3 py-2 rounded-lg shadow-sm">
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full shadow-sm">
                      <GaugeIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-amber-800 uppercase tracking-wide">Mileage</div>
                      <div className="text-sm font-semibold text-amber-900">{record.mileage}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Location Information Section */}
              {record.latitude && record.longitude && (
                <button
                  onClick={() => handleMapClick(record.latitude!, record.longitude!)}
                  className="mt-3 p-2 text-gray-800 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                  title="View location on map"
                >
                  <MapPinIcon className="h-6 w-6 text-blue-500" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={result.status === 'Passed' ? 'success' : result.status === 'Failed' ? 'destructive' : 'default'}
                className="ml-2"
              >
                {result.status}
              </Badge>
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
        <CardContent>
          {/* Inspection Results Summary */}
          <div className="mb-4">
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
                    key !== 'id' && key !== 'bu' && key !== 'type' && key !== 'inspector' && key !== 'certificate' && key !== 'mileage' && 
                    key !== 'timestamp' && key !== 'createdAt'&& key !== 'updatedAt' && key !== 'remark' && 
                    key !== 'images' && key !== 'docId' && key !== 'site' && 
                    key !== 'latitude' && key !== 'longitude' && key !== 'locationTimestamp' && key !== 'locationAccuracy' &&
                    !key.endsWith('R') && !key.endsWith('P') // Exclude remark and image fields
                  )
                  .map((key, idx) => {
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
                        <span className="font-medium">{idx + 1}{'. '}
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

          {/* Photo Gallery - Display specific photo fields */}
          {(() => {
            const allowedPhotoFields = ['frontP', 'backP', 'leftP', 'rightP'];
            const photoFields = Object.keys(record)
              .filter(key => allowedPhotoFields.includes(key) && record[key] && Array.isArray(record[key]) && record[key].length > 0)
              .sort(); // Sort for consistent ordering

            if (photoFields.length === 0) return null;

            return (
              <div className="mb-4">
                <h4 className="font-semibold text-sm text-gray-700 mb-3">Machine Photos</h4>
                <div className="grid gap-4">
                  {photoFields.map(field => {
                    const photoType = field.slice(0, -1); // Remove 'P' suffix
                    const photos = record[field] as string[];

                    return (
                      <div key={field} className="bg-gray-50 p-3 rounded-lg">
                        <h5 className="text-xs font-medium text-gray-600 mb-2 capitalize">
                          {photoType} View ({photos.length} photo{photos.length > 1 ? 's' : ''})
                        </h5>
                        <div className="flex gap-2 flex-wrap">
                          {photos.map((image, index) => (
                            <div key={index} className="w-20 h-20 rounded border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                              <img
                                src={formatImageUrl(image)}
                                alt={`${photoType} view ${index + 1}`}
                                className="w-full h-full object-cover hover:scale-105 transition-transform"
                                onError={handleImageError}
                                onClick={() => handleImageClick(image)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Defect Details Section */}
          {result.status === 'Failed' && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm text-gray-700">Defect Details</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDefectResponseModal(record.docId || record.id)}
                  className="flex items-center gap-2 hover:bg-green-50 hover:border-green-300"
                >
                  <WrenchIcon className="h-4 w-4 text-green-600" />
                  <span className="text-green-700">Respond to Defects</span>
                </Button>
              </div>
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
                        <div className="mb-3">
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

                      {/* Fix Response Section */}
                      {(record[questionName + 'A'] || record[questionName + 'F']) && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckIcon className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Fix Applied</span>
                            {record.responder && (
                              <span className="text-xs text-green-600">by {record.responder}</span>
                            )}
                          </div>
                          
                          {record[questionName + 'A'] && (
                            <div className="mb-2">
                              <span className="text-xs font-medium text-green-700">Fix Description: </span>
                              <span className="text-xs text-green-600">{record[questionName + 'A']}</span>
                            </div>
                          )}
                          
                          {record[questionName + 'F'] && Array.isArray(record[questionName + 'F']) && record[questionName + 'F'].length > 0 && (
                            <div>
                              <span className="text-xs font-medium text-green-700 block mb-2">
                                Fix Evidence ({record[questionName + 'F'].length}):
                              </span>
                              <div className="flex gap-2 flex-wrap">
                                {record[questionName + 'F'].map((image: string, index: number) => (
                                  <div key={index} className="w-16 h-16 rounded border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                                    <img 
                                      src={formatImageUrl(image)}
                                      alt={`${questionName} fix image ${index + 1}`}
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

      {/* Map Modal */}
      <Dialog open={isMapModalOpen} onOpenChange={setIsMapModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <MapPinIcon className="h-5 w-5" />
              Inspection Location
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-2">
            {selectedLocation && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Coordinates:</div>
                  <div className="font-mono text-lg font-semibold">
                    {formatCoordinates(selectedLocation.lat, selectedLocation.lng)}
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
                    title="Inspection Location Map"
                  />
                </div>
                
                <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://maps.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}&z=18`, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <MapPinIcon className="h-4 w-4" />
                    Open in Google Maps
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(`${selectedLocation.lat},${selectedLocation.lng}`)}
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

      {/* Defect Response Modal */}
      {showDefectResponseModal && (
        <Dialog open={!!showDefectResponseModal} onOpenChange={() => setShowDefectResponseModal(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <WrenchIcon className="h-5 w-5 text-green-600" />
                Respond to Defects
              </DialogTitle>
            </DialogHeader>
            
            {(() => {
              const currentRecord = records.find(r => (r.docId || r.id) === showDefectResponseModal);
              if (!currentRecord) return null;
              
              const failedQuestions = Object.entries(getQuestionGroups(currentRecord))
                .filter(([questionName, data]) => data.status === 'fail' || data.status === false);

              return (
                <div className="space-y-6">
                  {/* Responder Field */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <Label htmlFor="responder" className="text-sm font-semibold text-blue-800 mb-2 block">
                      👤 Responder Name
                    </Label>
                    <Input
                      id="responder"
                      value={responder}
                      onChange={(e) => setResponder(e.target.value)}
                      placeholder="Enter name of person fixing the defects"
                      className="w-full"
                    />
                    <p className="text-xs text-blue-600 mt-1">
                      This person will be recorded as the defect responder for all fixes in this record.
                    </p>
                  </div>

                  {/* Defect Response Forms */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-700">
                      Fix Details for {failedQuestions.length} Failed Item{failedQuestions.length > 1 ? 's' : ''}
                    </h4>
                    
                    {failedQuestions.map(([questionName, data]) => (
                      <div key={questionName} className="border border-red-200 bg-red-50 rounded-lg p-4">
                        {/* Question Header */}
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="destructive" className="text-xs">Failed</Badge>
                          <span className="font-medium text-red-800">
                            {questionMapping[questionName] || questionName.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                        
                        {/* Original Defect Info */}
                        {data.remark && (
                          <div className="mb-3 p-2 bg-white bg-opacity-50 rounded text-xs">
                            <span className="font-medium text-red-700">Original Issue: </span>
                            <span className="text-red-600">{data.remark}</span>
                          </div>
                        )}

                        {/* Response Text Field */}
                        <div className="mb-4">
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            📝 Fix Description
                          </Label>
                          <Textarea
                            value={defectAnswers[questionName] || ''}
                            onChange={(e) => setDefectAnswers(prev => ({ ...prev, [questionName]: e.target.value }))}
                            placeholder="Describe how this defect was fixed or addressed..."
                            className="w-full min-h-20"
                          />
                        </div>

                        {/* Fix Images Upload */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            📷 Fix Evidence Photos
                          </Label>
                          <MultiImageUploader
                            images={defectFixImages[questionName] || []}
                            onImagesChange={(images) => setDefectFixImages(prev => ({ ...prev, [questionName]: images }))}
                            urlFormatter={(image) => image.url}
                            compressionType="defect"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Upload photos showing the completed fix or resolution
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setShowDefectResponseModal(null)}
                      disabled={isSubmittingResponse}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleSubmitDefectResponse(currentRecord)}
                      disabled={isSubmittingResponse || !responder.trim()}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isSubmittingResponse ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-4 w-4 mr-2" />
                          Submit Response
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}