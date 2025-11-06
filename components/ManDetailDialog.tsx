"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { normalizeBuCode } from "@/lib/utils";

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
  // Decode URL parameters to handle special characters (including Thai characters)
  const decodedBu = decodeURIComponent(bu || "");
  const decodedType = decodeURIComponent(type || "");
  const decodedId = decodeURIComponent(id || "");

  // Normalize BU code (map office, srb, mkt, lbm, rmx, iagg, ieco to "th")
  const normalizedBu = normalizeBuCode(decodedBu);

  // Build the URL for the iframe - point to the full Man page
  const iframeUrl = `/Man/${encodeURIComponent(normalizedBu)}/${encodeURIComponent(decodedType)}/${encodeURIComponent(decodedId)}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6">
          <DialogTitle className="text-lg font-semibold">
            Employee Details - {decodedId}
          </DialogTitle>
        </DialogHeader>

        {/* Iframe to load the full Man page with Header, Detail, and Form */}
        <div className="flex-1 overflow-hidden">
          <iframe
            src={iframeUrl}
            className="w-full h-full border-0"
            title={`Employee ${decodedId} Details`}
          />
        </div>

        <div className="flex-shrink-0 px-6 pb-6 flex justify-end border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
