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
import { formatRelativeDateTime } from "@/components/ui/date-utils";
import {
  getMachinesWithInspectionsAction,
  MachineWithInspection,
} from "@/lib/actions/machines";
import { LocationMapDialog } from "./LocationMapDialog";
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
  const [filteredMachines, setFilteredMachines] = useState<
    MachineWithInspection[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [showMachineDetail, setShowMachineDetail] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState("");
  const [isMainModalVisible, setIsMainModalVisible] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && bu && site && type) {
      fetchMachines();
    }
    // Reset visibility when modal opens
    if (isOpen) {
      setIsMainModalVisible(true);
    } else {
      // Close detail dialog when main modal is closed
      setShowMachineDetail(false);
      setSelectedMachineId("");
    }
  }, [isOpen, bu, site, type]);

  useEffect(() => {
    // Filter machines based on search term
    if (searchTerm.trim() === "") {
      setFilteredMachines(machines);
    } else {
      const filtered = machines.filter((machine) =>
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
    // Hide main modal to prevent overlay conflicts
    setIsMainModalVisible(false);
  };

  const handleMachineDetailClose = () => {
    setShowMachineDetail(false);
    setSelectedMachineId("");
    // Show main modal again
    setIsMainModalVisible(true);
  };

  const handleImageClick = (imgUrl: string) => {
    // Helper function to convert relative paths to full URLs (defined inline to access it here)
    const getImageUrl = (imgPath: string) => {
      if (imgPath.startsWith("http")) {
        return imgPath; // Already a full URL
      }
      // Convert relative path to Firebase Storage URL
      return `https://firebasestorage.googleapis.com/v0/b/sccc-inseesafety-prod.firebasestorage.app/o/${encodeURIComponent(imgPath)}?alt=media`;
    };

    const imageUrl = getImageUrl(imgUrl);
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  const getDaysLabel = (days: number) => {
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  const getStats = () => {
    const total = filteredMachines.length;
    const inspected = filteredMachines.filter((m) => m.lastInspection).length;
    const withDefects = filteredMachines.filter((m) => m.hasDefects).length;
    return { total, inspected, withDefects };
  };

  const displaySiteName = siteName || site.toUpperCase();
  const displayTypeName =
    typeName || type.charAt(0).toUpperCase() + type.slice(1);
  const stats = getStats();

  return (
    <>
      <Dialog open={isOpen && isMainModalVisible} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {displayTypeName} - {displaySiteName} Site
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            {/* Stats and Controls */}
            <div className="mb-4 space-y-3">
              {/* Stats Summary */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">
                  Total: {stats.total} | Inspected: {stats.inspected} | With
                  Defects: {stats.withDefects}
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
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                  <div className="text-gray-600">Loading machines...</div>
                </div>
              </div>
            ) : filteredMachines.length === 0 ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-gray-500">
                  {searchTerm
                    ? `No machines found matching "${searchTerm}"`
                    : "No machines found for this combination."}
                </div>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[50vh]">
                <div className="space-y-2">
                  {filteredMachines.map((machine, idx) => (
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
                              <Badge
                                variant={
                                  machine.hasDefects ? "destructive" : "success"
                                }
                              >
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
                              <div>
                                📅 Last Inspected:{" "}
                                {formatRelativeDateTime(machine.inspectionDate)}
                              </div>
                            )}
                            {machine.lastInspection?.inspector && (
                              <div>
                                👤 Inspector: {machine.lastInspection.inspector}
                              </div>
                            )}
                            {machine.description && (
                              <div>📝 Description: {machine.description}</div>
                            )}
                            {machine.owner && (
                              <div>📝 Owner: {machine.owner}</div>
                            )}
                            {machine.location && (
                              <div>📍 Location: {machine.location}</div>
                            )}
                            {machine.name && machine.name !== machine.id && (
                              <div>🏷️ Name: {machine.name}</div>
                            )}

                            {/* Images section - moved here from gray wrapper */}
                            {(() => {
                              // Check both machine.images and lastInspection.images
                              const imageArray =
                                machine.images ||
                                machine.image ||
                                machine.lastInspection?.images;
                              console.log(
                                "Machine images for",
                                machine.id,
                                ":",
                                imageArray
                              );

                              // Helper function to convert relative paths to full URLs
                              const getImageUrl = (imgPath: string) => {
                                if (imgPath.startsWith("http")) {
                                  return imgPath; // Already a full URL
                                }
                                // Convert relative path to Firebase Storage URL
                                return `https://firebasestorage.googleapis.com/v0/b/sccc-inseesafety-prod.firebasestorage.app/o/${encodeURIComponent(imgPath)}?alt=media`;
                              };

                              return (
                                imageArray &&
                                Array.isArray(imageArray) &&
                                imageArray.length > 0 && (
                                  <div className="mt-2">
                                    <div className="text-xs text-gray-600 mb-1">
                                      📷 Images ({imageArray.length}):
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                      {imageArray.map(
                                        (imgUrl: string, idx: number) => (
                                          <img
                                            key={idx}
                                            src={getImageUrl(imgUrl)}
                                            alt={`${machine.id} image ${idx + 1}`}
                                            className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-80"
                                            onClick={() =>
                                              handleImageClick(imgUrl)
                                            }
                                            onError={(e) => {
                                              e.currentTarget.src =
                                                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect fill="%23ddd"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">✗</text></svg>';
                                            }}
                                          />
                                        )
                                      )}
                                    </div>
                                  </div>
                                )
                              );
                            })()}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          Type: {machine.type} : {idx + 1}
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

      {/* <RecentInspectionsDialog
        isOpen={showRecentInspections}
        onClose={() => setShowRecentInspections(false)}
        bu={bu}
        site={site}
        type={type}
        siteName={siteName}
        typeName={typeName}
      /> */}

      <MachineDetailDialog
        isOpen={showMachineDetail}
        onClose={handleMachineDetailClose}
        bu={bu}
        type={type.charAt(0).toUpperCase() + type.slice(1)}
        id={selectedMachineId}
      />

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Machine Image</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-2">
            {selectedImage && (
              <div className="flex justify-center">
                <img
                  src={selectedImage}
                  alt="Machine image"
                  className="max-w-full max-h-[70vh] object-contain rounded"
                  onError={(e) => {
                    e.currentTarget.src =
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCA0MDAgMzAwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CiAgPHRleHQgeD0iMjAwIiB5PSIxNTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Q0E0QUYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiI+SW1hZ2UgY291bGQgbm90IGJlIGxvYWRlZDwvdGV4dD4KPC9zdmc+";
                  }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
