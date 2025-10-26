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
import { EyeIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import RemoveFavouriteButton from "./remove-favourite-button";
import Image from "next/image";
import { Machine } from "@/types/machine";
import { MachineDetailDialog } from "@/components/MachineDetailDialog";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const [selectedMachine, setSelectedMachine] = useState<{
    bu: string;
    type: string;
    id: string;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleViewMachine = (bu: string, type: string, id: string) => {
    setSelectedMachine({ bu, type, id });
    setIsDialogOpen(true);
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

  return (
    <div className="max-w-screen-2xl mx-auto p-5">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-4xl font-bold">My Machine Favourites</h1>
        <Button onClick={() => router.push("/admin/add-machine")}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add New Machine
        </Button>
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
              <TableHead>No</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>BU</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>ID</TableHead>
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
                  <TableCell>{globalIndex}</TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="font-medium">{machine.bu}</TableCell>
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
                  <TableCell>{machine.id}</TableCell>
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
                      onClick={() =>
                        handleViewMachine(
                          machine.bu,
                          machine.type || "",
                          machine.id
                        )
                      }
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <RemoveFavouriteButton
                      propertyId={machine.machineKey}
                      isMachine={true}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={10} className="text-center">
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

      {/* Machine Detail Dialog */}
      {selectedMachine && (
        <MachineDetailDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          bu={selectedMachine.bu}
          type={selectedMachine.type}
          id={selectedMachine.id}
        />
      )}
    </div>
  );
}
