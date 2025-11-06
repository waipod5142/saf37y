"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InspectionDetail {
  id: string;
  timestamp: string;
  inspector: string;
  hasDefect: boolean;
}

interface OwnerRowProps {
  owner: string;
  total: number;
  inspectedToday: number;
  inspectionDetails: InspectionDetail[];
  maxCount: number;
}

export function OwnerRow({
  owner,
  total,
  inspectedToday,
  inspectionDetails,
  maxCount,
}: OwnerRowProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalBarWidth = (total / maxCount) * 100;
  const inspectedBarWidth = (inspectedToday / maxCount) * 100;
  const percentage = total > 0 ? Math.round((inspectedToday / total) * 100) : 0;

  return (
    <>
      <div className="border rounded-lg p-4">
        <div className="mb-2 flex justify-between items-center">
          <h3 className="font-semibold truncate" title={owner}>
            {owner}
          </h3>
          <span className="text-sm text-gray-600">
            {percentage}% inspected today
          </span>
        </div>

        {/* Total vehicles bar */}
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500 w-28">Total vehicles:</span>
            <div className="flex-1 flex items-center gap-2">
              <div
                className="bg-gray-300 h-6 rounded"
                style={{ width: `${totalBarWidth}%` }}
              />
              <span className="text-sm font-semibold w-12">{total}</span>
            </div>
          </div>
        </div>

        {/* Inspected today bar */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-28">Inspected today:</span>
            <div className="flex-1 flex items-center gap-2">
              <div
                className="bg-green-500 h-6 rounded cursor-pointer hover:bg-green-600 transition-colors"
                style={{ width: `${inspectedBarWidth}%` }}
                onClick={() => inspectedToday > 0 && setIsModalOpen(true)}
                title={inspectedToday > 0 ? "Click to view inspected vehicles" : ""}
              />
              <span
                className={`text-sm font-semibold w-12 ${
                  inspectedToday > 0 ? "cursor-pointer hover:text-green-600" : ""
                }`}
                onClick={() => inspectedToday > 0 && setIsModalOpen(true)}
              >
                {inspectedToday}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Inspected Vehicles Today - {owner}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-4">
              Total inspected today: <strong>{inspectedToday}</strong>
            </p>
            <div className="space-y-3">
              {inspectionDetails.map((inspection, idx) => {
                const date = new Date(inspection.timestamp);
                const formattedDate = date.toLocaleDateString();
                const formattedTime = date.toLocaleTimeString();

                return (
                  <div
                    key={idx}
                    className={`border rounded-lg p-4 transition-colors ${
                      inspection.hasDefect
                        ? "bg-red-50 border-red-200"
                        : "bg-green-50 border-green-200"
                    }`}
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-gray-500">Vehicle ID:</span>
                        <p className="font-mono font-semibold">{inspection.id}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Inspector:</span>
                        <p className="font-medium">{inspection.inspector}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Date:</span>
                        <p className="text-sm">{formattedDate}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Time:</span>
                        <p className="text-sm">{formattedTime}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-gray-500">Status:</span>
                        <div className="mt-1">
                          {inspection.hasDefect ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-200 text-red-800">
                              ⚠️ Defect Found
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-200 text-green-800">
                              ✓ No Defects
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
