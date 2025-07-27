"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getMachinesWithInspectionsAction, MachineWithInspection } from "@/lib/actions/machines";
import { LocationMapDialog } from "./LocationMapDialog";
import { RecentInspectionsDialog } from "./RecentInspectionsDialog";
import { MachineDetailDialog } from "./MachineDetailDialog";

interface MachineListModalProps {
  isOpen: boolean;
  onClose: () => void;
  bu: string;
  site: string;
  type: string;
  siteName?: string;
  typeName?: string;
}

export function MachineListModal({
  isOpen,
  onClose,
  bu,
  site,
  type,
  siteName,
  typeName,
}: MachineListModalProps) {
  const [machines, setMachines] = useState<MachineWithInspection[]>([]);
  const [filteredMachines, setFilteredMachines] = useState<MachineWithInspection[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [showRecentInspections, setShowRecentInspections] = useState(false);
  const [showMachineDetail, setShowMachineDetail] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState("");

  useEffect(() => {
    if (isOpen && bu && site && type) {
      fetchMachines();
    }
  }, [isOpen, bu, site, type]);

  useEffect(() => {
    // Filter machines based on search term
    if (searchTerm.trim() === "") {
      setFilteredMachines(machines);
    } else {
      const filtered = machines.filter(machine =>
        machine.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMachines(filtered);
    }
  }, [machines, searchTerm]);

  const fetchMachines = async () => {
    setLoading(true);
    console.log("=== MachineListModal fetchMachines ===");
    console.log("Modal parameters:", { bu, site, type, isOpen });
    
    try {
      const result = await getMachinesWithInspectionsAction(bu, site, type);
      console.log("getMachinesWithInspectionsAction result:", result);
      
      if (result.success) {
        const machinesData = result.machines || [];
        console.log("Setting machines data:", machinesData.length, "machines");
        setMachines(machinesData);
      } else {
        console.error("Error fetching machines:", result.error);
        setMachines([]);
      }
    } catch (error) {
      console.error("Error in fetchMachines:", error);
      setMachines([]);
    } finally {
      setLoading(false);
      console.log("=== End MachineListModal fetchMachines ===");
    }
  };

  const handleMachineClick = (machineId: string) => {
    setSelectedMachineId(machineId);
    setShowMachineDetail(true);
  };

  const getDaysLabel = (days: number) => {
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  const getStats = () => {
    const total = filteredMachines.length;
    const inspected = filteredMachines.filter(m => m.lastInspection).length;
    const withDefects = filteredMachines.filter(m => m.hasDefects).length;
    return { total, inspected, withDefects };
  };

  const displaySiteName = siteName || site.toUpperCase();
  const displayTypeName = typeName || type.charAt(0).toUpperCase() + type.slice(1);
  const stats = getStats();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {displayTypeName} Machines - {displaySiteName} Site
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {/* Stats and Controls */}
            <div className="mb-4 space-y-3">
              {/* Stats Summary */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">
                  Total: {stats.total} | Inspected: {stats.inspected} | With Defects: {stats.withDefects}
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
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span>Not Inspected</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLocationMap(true)}
                  className="flex items-center gap-1"
                >
                  📍 Show Locations
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRecentInspections(true)}
                  className="flex items-center gap-1"
                >
                  📅 Last 15 Days
                </Button>
              </div>

              {/* Search */}
              <div>
                <Input
                  placeholder="Search by Machine ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-gray-600">Loading machines...</div>
              </div>
            ) : filteredMachines.length === 0 ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-gray-500">
                  {searchTerm ? `No machines found matching "${searchTerm}"` : "No machines found for this combination."}
                </div>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[50vh]">
                <div className="space-y-2">
                  {filteredMachines.map((machine) => (
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
                            {machine.lastInspection && (
                              <Badge variant={machine.hasDefects ? "destructive" : "success"}>
                                {machine.hasDefects ? "Defects" : "Pass"}
                              </Badge>
                            )}
                            {machine.daysSinceInspection !== undefined && (
                              <Badge variant="outline" className="text-xs">
                                {getDaysLabel(machine.daysSinceInspection)}
                              </Badge>
                            )}
                            {!machine.lastInspection && (
                              <Badge variant="secondary">Not Inspected</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {machine.inspectionDate && (
                              <div>📅 Last Inspection: {new Date(machine.inspectionDate).toLocaleDateString()}</div>
                            )}
                            {machine.lastInspection?.inspector && (
                              <div>👤 Inspector: {machine.lastInspection.inspector}</div>
                            )}
                            {machine.description && (
                              <div>📝 Description: {machine.description}</div>
                            )}
                            {machine.location && (
                              <div>📍 Location: {machine.location}</div>
                            )}
                            {machine.name && machine.name !== machine.id && (
                              <div>🏷️ Name: {machine.name}</div>
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
            )}
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-dialogs */}
      <LocationMapDialog
        isOpen={showLocationMap}
        onClose={() => setShowLocationMap(false)}
        bu={bu}
        site={site}
        type={type}
        siteName={siteName}
        typeName={typeName}
      />

      <RecentInspectionsDialog
        isOpen={showRecentInspections}
        onClose={() => setShowRecentInspections(false)}
        bu={bu}
        site={site}
        type={type}
        siteName={siteName}
        typeName={typeName}
      />

      <MachineDetailDialog
        isOpen={showMachineDetail}
        onClose={() => setShowMachineDetail(false)}
        bu={bu}
        type={type.charAt(0).toUpperCase() + type.slice(1)}
        id={selectedMachineId}
      />
    </>
  );
}