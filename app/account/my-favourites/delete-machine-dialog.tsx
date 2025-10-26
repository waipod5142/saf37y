"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Machine } from "@/types/machine";

interface DeleteMachineDialogProps {
  isOpen: boolean;
  onClose: () => void;
  machine: (Machine & { machineKey: string }) | null;
}

export function DeleteMachineDialog({
  isOpen,
  onClose,
  machine,
}: DeleteMachineDialogProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!machine) return;

    try {
      const response = await fetch(
        `/api/machines/delete?docId=${machine.docId}&machineKey=${machine.machineKey}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Machine and favorite deleted successfully!");
        onClose();
        router.refresh();
      } else {
        toast.error(data.error || "Failed to delete machine");
      }
    } catch (error) {
      toast.error("Failed to delete: " + error);
    }
  };

  if (!machine) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>This action cannot be undone. This will permanently delete:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Machine from database:</strong> {machine.bu} / {machine.type} /{" "}
                {machine.id}
              </li>
              <li>
                <strong>From your favorites</strong>
              </li>
              <li>
                <strong>All associated inspection records</strong> (if any)
              </li>
            </ul>
            <p className="text-destructive font-semibold mt-4">
              This will affect all users who have this machine in their favorites!
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Yes, Delete Everything
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
