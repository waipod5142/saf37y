"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getMachineQuestions } from "@/lib/actions/forms";
import { getMachineInspectionRecordsAction } from "@/lib/actions/machines";
import { MachineInspectionRecord } from "@/types/machineInspectionRecord";
import { MachineItem } from "@/lib/machine-types";
import MachineTitle from "@/components/machine-title";
import MachineHeader from "@/components/machine-header";
import MachineDetailClient from "@/components/machine-detail-client";
import MachineForm from "@/components/machine-form";

interface MachineDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bu: string;
  type: string;
  id: string;
}

export function MachineDetailDialog({
  isOpen,
  onClose,
  bu,
  type,
  id,
}: MachineDetailDialogProps) {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<MachineInspectionRecord[]>([]);
  const [questions, setQuestions] = useState<MachineItem[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Decode URL parameters to handle special characters (including Thai characters)
  const decodedBu = decodeURIComponent(bu);
  const decodedType = decodeURIComponent(type.toLowerCase());
  const decodedId = decodeURIComponent(id);

  useEffect(() => {
    if (isOpen && decodedId) {
      fetchMachineData();
      // Reset scroll position when dialog opens
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      }, 100);
    }
  }, [isOpen, decodedBu, decodedType, decodedId]);

  const fetchMachineData = async () => {
    setLoading(true);
    try {
      // Fetch inspection records and form questions for the MachineDetailClient component
      const [recordsResult, questionsResult] = await Promise.all([
        getMachineInspectionRecordsAction(decodedBu, decodedType, decodedId),
        getMachineQuestions(decodedBu, decodedType)
      ]);

      if (recordsResult.success) {
        setRecords(recordsResult.records || []);
      }

      if (questionsResult.success && questionsResult.questions) {
        setQuestions(questionsResult.questions);
      }
    } catch (error) {
      console.error("Error fetching machine data:", error);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] h-[90vh] overflow-hidden flex flex-col [&>button]:hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg font-semibold">
            Machine Details - {decodedId}
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center py-8 flex-1">
            <div className="text-gray-600">Loading machine details...</div>
          </div>
        ) : (
          <div 
            ref={scrollContainerRef}
            className="overflow-y-auto flex-1 px-1 min-h-0" 
            style={{ scrollBehavior: 'auto' }}
          >
            <div className="space-y-6 pb-4" style={{ position: 'relative', top: 0 }}>
              <MachineTitle bu={decodedBu} type={decodedType} id={decodedId} />
              <MachineHeader bu={decodedBu} type={decodedType} id={decodedId} />
              <MachineDetailClient records={records} questions={questions} />
              <MachineForm bu={decodedBu} type={decodedType} id={decodedId} isInDialog={true} />
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