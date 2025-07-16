import { getMachineInspectionRecords } from "@/data/machines";
import { MachineInspectionRecord } from "@/types/machineInspectionRecord";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, UserIcon, FileTextIcon, AlertTriangleIcon } from "lucide-react";

interface MachineDetailProps {
  bu: string;
  type: string;
  id: string;
}

export default async function MachineDetail({ bu, type, id }: MachineDetailProps) {
  const records = await getMachineInspectionRecords(bu, type, id);

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
      <Card key={record.docId} className={`mb-4 ${isLatest ? 'border-blue-500 shadow-md' : ''}`}>
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
                  <div key={index} className="w-20 h-20 bg-gray-100 rounded border flex items-center justify-center">
                    <span className="text-xs text-gray-500">Image {index + 1}</span>
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

  return (
    <div className="mb-6">
      {/* All Records */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Machine Inspection Records ({records.length} record{records.length > 1 ? 's' : ''})
        </h3>
        <div className="space-y-4">
          {records.map((record, index) => renderInspectionRecord(record, index === 0))}
        </div>
      </div>
    </div>
  );
}