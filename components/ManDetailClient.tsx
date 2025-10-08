"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDateTime } from "@/components/ui/date-utils";
import { ManRecord } from "@/lib/actions/man";

interface ManDetailClientProps {
  records: ManRecord[];
  employeeData?: { site?: string; [key: string]: any };
}

// Form type configuration
const FORM_TYPE_CONFIG: Record<
  string,
  { icon: string; label: string; color: string }
> = {
  toolbox: { icon: "🧰", label: "Toolbox Talk", color: "bg-blue-500" },
  alertform: {
    icon: "⚠️",
    label: "Red Alert Acknowledgement",
    color: "bg-red-500",
  },
  bootform: { icon: "🥾", label: "Boot on the ground", color: "bg-green-500" },
  sot: { icon: "👁️", label: "Safety Observation", color: "bg-purple-500" },
  talk: { icon: "💬", label: "Safety Talk", color: "bg-yellow-500" },
  meetingform: { icon: "📋", label: "Meeting Form", color: "bg-indigo-500" },
  alert: { icon: "⚠️", label: "Red Alert", color: "bg-red-500" },
  vfl: { icon: "👁️", label: "VFL Observation", color: "bg-indigo-500" },
  trainingform: { icon: "📚", label: "Training", color: "bg-green-600" },
};

export default function ManDetailClient({
  records,
  employeeData,
}: ManDetailClientProps) {
  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">
            No records found for this person.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Employee Info */}
      {employeeData && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Employee Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {employeeData.site && (
                <div>
                  <span className="text-gray-600">Site:</span>{" "}
                  <span className="font-medium">{employeeData.site}</span>
                </div>
              )}
              {employeeData.name && (
                <div>
                  <span className="text-gray-600">Name:</span>{" "}
                  <span className="font-medium">{employeeData.name}</span>
                </div>
              )}
              {employeeData.department && (
                <div>
                  <span className="text-gray-600">Department:</span>{" "}
                  <span className="font-medium">{employeeData.department}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Records */}
      <div>
        <h3 className="font-semibold mb-3">Safety Records ({records.length})</h3>
        <div className="space-y-3">
          {records.map((record) => (
            <Card key={record.docId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        className={
                          FORM_TYPE_CONFIG[record.type]?.color ||
                          "bg-gray-500"
                        }
                      >
                        {FORM_TYPE_CONFIG[record.type]?.icon || "📄"}{" "}
                        {FORM_TYPE_CONFIG[record.type]?.label || record.type}
                      </Badge>
                      {record.site && (
                        <Badge variant="outline" className="text-xs">
                          {record.site.toUpperCase()}
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Date:</span>
                        <span>{formatRelativeDateTime(record.timestamp)}</span>
                      </div>

                      {record.remark && (
                        <div>
                          <span className="text-gray-600">Remark:</span>{" "}
                          <span>{record.remark}</span>
                        </div>
                      )}

                      {/* Type-specific fields */}
                      {record.type === "alert" && record.typeAccident && (
                        <div>
                          <span className="text-gray-600">Accident Type:</span>{" "}
                          <span className="font-medium">{record.typeAccident}</span>
                        </div>
                      )}

                      {record.type === "alert" && record.learn && (
                        <div>
                          <span className="text-gray-600">Lesson Learned:</span>{" "}
                          <p className="mt-1 text-gray-700">{record.learn}</p>
                        </div>
                      )}

                      {(record.type === "sot" || record.type === "vfl") && record.area && (
                        <div>
                          <span className="text-gray-600">Area:</span>{" "}
                          <span>{record.area}</span>
                        </div>
                      )}

                      {record.type === "toolbox" && record.topics && (
                        <div>
                          <span className="text-gray-600">Topics:</span>{" "}
                          <span>{Array.isArray(record.topics) ? record.topics.join(", ") : record.topics}</span>
                        </div>
                      )}

                      {/* Images */}
                      {record.images && record.images.length > 0 && (
                        <div className="mt-2">
                          <span className="text-gray-600 text-xs">
                            Images ({record.images.length}):
                          </span>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            {record.images.map((img: string, idx: number) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Record image ${idx + 1}`}
                                className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80"
                                onClick={() => window.open(img, "_blank")}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
