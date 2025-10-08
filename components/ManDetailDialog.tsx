"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { normalizeBuCode } from "@/lib/utils";
import {
  getManRecordsByIdAction,
  getEmployeeByIdAction,
  ManRecord,
} from "@/lib/actions/man";
import ManDetailClient from "@/components/ManDetailClient";
import dynamic from "next/dynamic";

// Dynamically import form components to avoid server-side issues
const ManFormSOT = dynamic(() => import("@/components/man-form-sot"), {
  ssr: false,
});
const ManFormTalk = dynamic(() => import("@/components/man-form-talk"), {
  ssr: false,
});
const ManFormToolbox = dynamic(() => import("@/components/man-form-toolbox"), {
  ssr: false,
});

interface ManDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bu: string;
  type: string;
  id: string;
}

export function ManDetailDialog({
  isOpen,
  onClose,
  bu,
  type,
  id,
}: ManDetailDialogProps) {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<ManRecord[]>([]);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Decode URL parameters to handle special characters (including Thai characters)
  const decodedBu = decodeURIComponent(bu);
  const decodedType = decodeURIComponent(type);
  const decodedId = decodeURIComponent(id);

  // Normalize BU code (map office, srb, mkt, lbm, rmx, iagg, ieco to "th")
  const normalizedBu = normalizeBuCode(decodedBu);

  useEffect(() => {
    if (isOpen && decodedId) {
      fetchManData();
      // Reset scroll position when dialog opens
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      }, 100);
    }
  }, [isOpen, decodedBu, decodedType, decodedId]);

  const fetchManData = async () => {
    setLoading(true);
    try {
      // Fetch records and employee data in parallel
      const [recordsResult, employeeResult] = await Promise.all([
        getManRecordsByIdAction(normalizedBu, decodedType, decodedId),
        getEmployeeByIdAction(normalizedBu, decodedId),
      ]);

      if (recordsResult.success) {
        setRecords(recordsResult.records || []);
      }

      if (employeeResult.success && employeeResult.employee) {
        setEmployeeData(employeeResult.employee);
      }
    } catch (error) {
      console.error("Error fetching man data:", error);
    } finally {
      setLoading(false);
      // Reset scroll position after content is loaded
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      }, 50);
    }
  };

  // Determine which form to render based on type
  const renderForm = () => {
    const lowerType = decodedType.toLowerCase();
    if (lowerType === "sot" || lowerType === "vfl") {
      return <ManFormSOT bu={normalizedBu} type={decodedType} id={decodedId} />;
    } else if (lowerType === "talk") {
      return (
        <ManFormTalk bu={normalizedBu} type={decodedType} id={decodedId} />
      );
    } else if (lowerType === "toolbox") {
      return (
        <ManFormToolbox bu={normalizedBu} type={decodedType} id={decodedId} />
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] h-[90vh] overflow-hidden flex flex-col [&>button]:hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg font-semibold">
            Man Record Details - {decodedId}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8 flex-1">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
              <div className="text-gray-600">Loading record details...</div>
            </div>
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="overflow-y-auto flex-1 px-1 min-h-0"
            style={{ scrollBehavior: "auto" }}
          >
            <div
              className="space-y-6 pb-4"
              style={{ position: "relative", top: 0 }}
            >
              <ManDetailClient records={records} employeeData={employeeData} />

              {/* Render form if applicable */}
              {renderForm()}
            </div>
          </div>
        )}

        <div className="flex-shrink-0 mt-4 flex justify-end border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
