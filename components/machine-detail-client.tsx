"use client";

import { useState } from "react";
import { MachineInspectionRecord } from "@/types/machineInspectionRecord";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, UserIcon, FileTextIcon, ToggleLeftIcon, ToggleRightIcon } from "lucide-react";

interface MachineDetailClientProps {
  records: MachineInspectionRecord[];
}

export default function MachineDetailClient({ records }: MachineDetailClientProps) {
  const [showAllRecords, setShowAllRecords] = useState(false);

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
    <div className="max-w-4xl mx-auto p-2">
      <Card className={`mb-4 ${isLatest ? 'border-blue-500 bg-yellow-100 shadow-md' : 'bg-yellow-50'}`}>
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
            <Badge 
              variant={result.status === 'Passed' ? 'default' : 'destructive'}
              className="ml-2"
            >
              {result.status}
            </Badge>
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
                      onClick={() => window.open(image, '_blank')}
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
    </div>
    );
  };

  if (records.length === 0) {
    return (
      <div className="mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-gray-500 text-center">
              <FileTextIcon className="h-8 w-8 mx-auto mb-2" />
              <p>No inspection records found for this machine.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayedRecords = showAllRecords ? records : records.slice(0, 1);

  return (
    <div className="max-w-4xl mx-auto p-2">
      {/* Header with Toggle Button */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-800">
            Machine Inspection Records ({showAllRecords ? records.length : 1} of {records.length} record{records.length > 1 ? 's' : ''})
          </h3>
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
        <div className="space-y-4">
          {displayedRecords.map((record, index) => (
            <div key={record.docId || record.id || index}>
              {renderInspectionRecord(record, index === 0)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}