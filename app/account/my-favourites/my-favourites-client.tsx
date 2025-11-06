"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditIcon, PlusIcon, Trash2Icon, QrCode } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Machine } from "@/types/machine";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MachineEditModal } from "./machine-edit-modal";
import { DeleteMachineDialog } from "./delete-machine-dialog";
import { MachineDetailDialog } from "@/components/MachineDetailDialog";
import { MachineQRGenerator } from "@/components/MachineQRGenerator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MyFavouritesClientProps {
  machines: (Machine & { machineKey: string })[];
  totalCount: number;
  countByType: Record<string, number>;
  currentPage: number;
  totalPages: number;
  filterType: string | null;
  filteredCount: number;
  startIndex: number;
}

export default function MyFavouritesClient({
  machines,
  totalCount,
  countByType,
  currentPage,
  totalPages,
  filterType,
  filteredCount,
  startIndex,
}: MyFavouritesClientProps) {
  const router = useRouter();
  const [selectedMachine, setSelectedMachine] = useState<
    (Machine & { machineKey: string }) | null
  >(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState<
    (Machine & { machineKey: string }) | null
  >(null);

  // For MachineDetailDialog
  const [selectedMachineDetail, setSelectedMachineDetail] = useState<{
    bu: string;
    type: string;
    id: string;
  } | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // For QR Code generation
  const [selectedMachineKeys, setSelectedMachineKeys] = useState<Set<string>>(
    new Set()
  );
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);

  const handleEditMachine = (machine: Machine & { machineKey: string }) => {
    setSelectedMachine(machine);
    setIsEditModalOpen(true);
  };

  const handleDeleteMachine = (machine: Machine & { machineKey: string }) => {
    setMachineToDelete(machine);
    setIsDeleteDialogOpen(true);
  };

  const handleViewDetail = (bu: string, type: string, id: string) => {
    setSelectedMachineDetail({ bu, type, id });
    setIsDetailDialogOpen(true);
  };

  const handleUpdate = () => {
    router.refresh();
  };

  const handleTypeClick = (type: string) => {
    if (filterType === type) {
      // Remove filter
      router.push("/account/my-favourites");
    } else {
      // Apply filter
      router.push(`/account/my-favourites?type=${type}`);
    }
  };

  const sortedTypes = Object.entries(countByType).sort((a, b) => b[1] - a[1]);

  const handleSelectMachine = (machineKey: string, checked: boolean) => {
    const newSelected = new Set(selectedMachineKeys);
    if (checked) {
      newSelected.add(machineKey);
    } else {
      newSelected.delete(machineKey);
    }
    setSelectedMachineKeys(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = new Set(machines.map((m) => m.machineKey));
      setSelectedMachineKeys(allKeys);
    } else {
      setSelectedMachineKeys(new Set());
    }
  };

  const handleGenerateQR = () => {
    if (selectedMachineKeys.size > 0) {
      setIsQRDialogOpen(true);
    }
  };

  const selectedMachines = machines.filter((m) =>
    selectedMachineKeys.has(m.machineKey)
  );
  const allSelected =
    machines.length > 0 && selectedMachineKeys.size === machines.length;
  const someSelected = selectedMachineKeys.size > 0 && !allSelected;

  return (
    <div className="max-w-screen-2xl mx-auto p-5">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-4xl font-bold">My Machines</h1>
        <div className="flex gap-2">
          {selectedMachineKeys.size > 0 && (
            <Button onClick={handleGenerateQR} variant="outline">
              <QrCode className="mr-2 h-4 w-4" />
              Generate QR ({selectedMachineKeys.size})
            </Button>
          )}
          {/* <Button onClick={() => router.push("/admin/add-machine")}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add New Machine
          </Button> */}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <Card>
          <CardHeader>
            <CardTitle>Total Machines</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalCount}</p>
            {filterType && (
              <p className="text-sm text-gray-600 mt-2">
                Showing {filteredCount} filtered results
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Machines by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {sortedTypes.map(([type, count]) => (
                <Badge
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => handleTypeClick(type)}
                >
                  {type}: {count}
                </Badge>
              ))}
            </div>
            {filterType && (
              <Button
                variant="link"
                size="sm"
                onClick={() => router.push("/account/my-favourites")}
                className="mt-2 p-0"
              >
                Clear filter
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {!machines.length && (
        <h2 className="text-center text-zinc-400 text-3xl font-bold py-10">
          {filterType
            ? `No machines of type "${filterType}" found.`
            : "You have no favourited machines."}
        </h2>
      )}

      {!!machines.length && (
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>No</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>CC Email</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {machines.map((machine, idx) => {
              // Calculate the global index based on filtered results
              const globalIndex = startIndex + idx + 1;
              return (
                <TableRow key={machine.machineKey}>
                  <TableCell>
                    <Checkbox
                      checked={selectedMachineKeys.has(machine.machineKey)}
                      onCheckedChange={(checked) =>
                        handleSelectMachine(
                          machine.machineKey,
                          checked as boolean
                        )
                      }
                      aria-label={`Select ${machine.id}`}
                    />
                  </TableCell>
                  <TableCell>{globalIndex}</TableCell>
                  {/* <TableCell>
                    {machine.images?.[0] && (
                      <div className="w-16 h-16 relative">
                        <Image
                          fill
                          className="object-cover rounded"
                          src={machine.images[0]}
                          alt={machine.id}
                        />
                      </div>
                    )}
                  </TableCell> */}
                  <TableCell>{machine.site}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => handleTypeClick(machine.type || "")}
                    >
                      {machine.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() =>
                        handleViewDetail(
                          machine.bu,
                          machine.type || "",
                          machine.id
                        )
                      }
                      className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                    >
                      {machine.id}
                    </button>
                  </TableCell>
                  <TableCell>{machine.email}</TableCell>
                  <TableCell>{machine.supemail}</TableCell>
                  <TableCell>{machine.kind}</TableCell>
                  <TableCell>{machine.location}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        machine.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {machine.status}
                    </span>
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditMachine(machine)}
                      title="View/Edit Machine"
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteMachine(machine)}
                      title="Delete Machine"
                    >
                      <Trash2Icon className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={11} className="text-center">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  const params = new URLSearchParams();
                  params.set("page", pageNum.toString());
                  if (filterType) {
                    params.set("type", filterType);
                  }

                  return (
                    <Button
                      disabled={currentPage === pageNum}
                      key={i}
                      asChild={currentPage !== pageNum}
                      variant="outline"
                      className="mx-1"
                    >
                      <Link
                        href={`/account/my-favourites?${params.toString()}`}
                      >
                        {pageNum}
                      </Link>
                    </Button>
                  );
                })}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )}

      {/* Machine Edit Modal */}
      {selectedMachine && (
        <MachineEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedMachine(null);
          }}
          machine={selectedMachine}
          onUpdate={handleUpdate}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteMachineDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setMachineToDelete(null);
        }}
        machine={machineToDelete}
      />

      {/* Machine Detail Dialog (for viewing inspection history) */}
      {selectedMachineDetail && (
        <MachineDetailDialog
          isOpen={isDetailDialogOpen}
          onClose={() => {
            setIsDetailDialogOpen(false);
            setSelectedMachineDetail(null);
          }}
          bu={selectedMachineDetail.bu}
          type={selectedMachineDetail.type}
          id={selectedMachineDetail.id}
        />
      )}

      {/* QR Code Generation Dialog */}
      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate QR Codes for Selected Machines</DialogTitle>
            <DialogDescription>
              {selectedMachineKeys.size} machine
              {selectedMachineKeys.size !== 1 ? "s" : ""} selected. Preview and
              download as PDF for printing on A4 paper.
            </DialogDescription>
          </DialogHeader>
          <MachineQRGenerator
            machines={selectedMachines}
            onClose={() => setIsQRDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
