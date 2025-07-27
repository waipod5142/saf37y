"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getRecentInspectionsAction, MachineWithInspection } from "@/lib/actions/machines";

interface RecentInspectionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bu: string;
  site: string;
  type: string;
  siteName?: string;
  typeName?: string;
}

export function RecentInspectionsDialog({
  isOpen,
  onClose,
  bu,
  site,
  type,
  siteName,
  typeName,
}: RecentInspectionsDialogProps) {
  const [machines, setMachines] = useState<MachineWithInspection[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && bu && site && type) {
      fetchRecentInspections();
    }
  }, [isOpen, bu, site, type]);

  const fetchRecentInspections = async () => {
    setLoading(true);
    try {
      const result = await getRecentInspectionsAction(bu, site, type, 15);
      if (result.success && result.machines) {
        setMachines(result.machines);
      } else {
        console.error("Error fetching recent inspections:", result.error);
        setMachines([]);
      }
    } catch (error) {
      console.error("Error in fetchRecentInspections:", error);
      setMachines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMachineClick = (machineId: string) => {
    const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
    router.push(`/Machine/${bu}/${capitalizedType}/${encodeURIComponent(machineId)}`);
    onClose();
  };

  const getDaysLabel = (days: number) => {
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  const displaySiteName = siteName || site.toUpperCase();
  const displayTypeName = typeName || type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            📅 Recent Inspections (Last 15 Days) - {displayTypeName} at {displaySiteName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-600">Loading recent inspections...</div>
            </div>
          ) : machines.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-center">
                <div className="text-gray-500 text-lg mb-2">No inspections in the last 15 days</div>
                <div className="text-sm text-gray-400">Try checking the main machine list for older inspections</div>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">
                  Inspected in last 15 days: {machines.length} | 
                  With defects: {machines.filter(m => m.hasDefects).length} | 
                  Passed: {machines.filter(m => !m.hasDefects).length}
                </div>
                <div className="flex gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Has Defects</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Passed</span>
                  </div>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[50vh]">
                <div className="space-y-2">
                  {machines.map((machine) => (
                    <div
                      key={machine.docId || machine.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Button
                              variant="link"
                              className="p-0 h-auto font-semibold text-blue-600 hover:text-blue-800"
                              onClick={() => handleMachineClick(machine.id)}
                            >
                              {machine.id}
                            </Button>
                            <Badge variant={machine.hasDefects ? "destructive" : "default"}>
                              {machine.hasDefects ? "Defects" : "Pass"}
                            </Badge>
                            {machine.daysSinceInspection !== undefined && (
                              <Badge variant="outline" className="text-xs">
                                {getDaysLabel(machine.daysSinceInspection)}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {machine.inspectionDate && (
                              <div>📅 Inspected: {new Date(machine.inspectionDate).toLocaleDateString()} at {new Date(machine.inspectionDate).toLocaleTimeString()}</div>
                            )}
                            {machine.lastInspection?.inspector && (
                              <div>👤 Inspector: {machine.lastInspection.inspector}</div>
                            )}
                            {machine.lastInspection?.remark && (
                              <div>💬 Remark: {machine.lastInspection.remark}</div>
                            )}
                            {machine.description && (
                              <div>📝 Description: {machine.description}</div>
                            )}
                            {machine.location && (
                              <div>📍 Location: {machine.location}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          Type: {machine.type}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}