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
import { getMachinesAction } from "@/lib/actions/machines";
import { Machine } from "@/types/machine";

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
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && bu && site && type) {
      fetchMachines();
    }
  }, [isOpen, bu, site, type]);

  const fetchMachines = async () => {
    setLoading(true);
    console.log("=== MachineListModal fetchMachines ===");
    console.log("Modal parameters:", { bu, site, type, isOpen });
    
    try {
      const result = await getMachinesAction(bu, site, type);
      console.log("getMachinesAction result:", result);
      
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
    // Capitalize first letter of type
    const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
    // Navigate to machine detail page
    router.push(`/Machine/${bu}/${capitalizedType}/${encodeURIComponent(machineId)}`);
    onClose();
  };

  const displaySiteName = siteName || site.toUpperCase();
  const displayTypeName = typeName || type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {displayTypeName} Machines - {displaySiteName} Site
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-600">Loading machines...</div>
            </div>
          ) : machines.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500">No machines found for this combination.</div>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[60vh]">
              <div className="space-y-2">
                {machines.map((machine) => (
                  <div
                    key={machine.docId || machine.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="link"
                            className="p-0 h-auto font-semibold text-blue-600 hover:text-blue-800"
                            onClick={() => handleMachineClick(machine.id)}
                          >
                            {machine.id}
                          </Button>
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          {machine.description && (
                            <div>Description: {machine.description}</div>
                          )}
                          {machine.location && (
                            <div>Location: {machine.location}</div>
                          )}
                          {machine.name && machine.name !== machine.id && (
                            <div>Name: {machine.name}</div>
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
  );
}