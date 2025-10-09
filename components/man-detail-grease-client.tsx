"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeDateTime } from "@/components/ui/date-utils";
import { GreaseRecord } from "@/types/man";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteMethodRecord } from "@/lib/actions/method";

interface GreaseManDetailClientProps {
  records: GreaseRecord[];
  bu: string;
}

export default function GreaseManDetailClient({
  records: initialRecords,
  bu,
}: GreaseManDetailClientProps) {
  const [records, setRecords] = useState<GreaseRecord[]>(initialRecords);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleDelete = async (docId: string) => {
    if (!docId) {
      toast.error("Cannot delete: missing document ID");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this grease record? This action cannot be undone."
    );

    if (!confirmed) return;

    setDeletingIds((prev) => new Set(prev).add(docId));

    try {
      const result = await deleteMethodRecord(docId);

      if (result.success) {
        toast.success("Grease record deleted successfully");
        setRecords((prev) => prev.filter((r) => r.docId !== docId));
      } else {
        toast.error(result.error || "Failed to delete grease record");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("An error occurred while deleting");
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(docId);
        return newSet;
      });
    }
  };

  if (!records || records.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        {bu === "vn" ? "Lịch sử bơm mỡ" : "ประวัติการอัดจารบี"} (
        {records.length})
      </h2>

      {records.map((record) => (
        <Card key={record.docId || record.timestamp.toString()} className="relative">
          <CardContent className="pt-6">
            {/* Delete Button */}
            {record.docId && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 text-red-600 hover:text-red-800 hover:bg-red-50"
                onClick={() => handleDelete(record.docId!)}
                disabled={deletingIds.has(record.docId)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}

            {/* Header Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="default" className="bg-green-500">
                  {bu === "vn" ? "Bơm mỡ" : "อัดจารบี"}
                </Badge>
                {record.site && (
                  <Badge variant="outline">{record.site.toUpperCase()}</Badge>
                )}
              </div>

              <div className="text-sm text-gray-600">
                <p>
                  <strong>{bu === "vn" ? "Mã nhân viên:" : "รหัสพนักงาน:"}</strong>{" "}
                  {record.id}
                </p>
                <p>
                  <strong>{bu === "vn" ? "Thời gian:" : "เวลา:"}</strong>{" "}
                  {formatRelativeDateTime(record.timestamp)}
                </p>
              </div>
            </div>

            {/* Remark */}
            {record.remark && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  {bu === "vn" ? "Ghi chú:" : "หมายเหตุ:"}
                </p>
                <p className="text-sm text-gray-600">{record.remark}</p>
              </div>
            )}

            {/* Images */}
            {record.images && record.images.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">
                  {bu === "vn"
                    ? "Hình ảnh trước khi bơm mỡ:"
                    : "รูปภาพก่อนอัดจารบี:"}{" "}
                  ({record.images.length})
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {record.images.map((imageUrl, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square overflow-hidden rounded-lg border border-gray-200"
                    >
                      <img
                        src={imageUrl}
                        alt={`Grease image ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open(imageUrl, "_blank")}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
