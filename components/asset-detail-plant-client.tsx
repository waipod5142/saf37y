"use client";

import React, { useState } from "react";
import { Asset, AssetTransaction } from "@/lib/actions/assets";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "./ui/button";
import { ExternalLinkIcon } from "lucide-react";

interface AssetDetailPlantClientProps {
  assets: (Asset & { latestTransaction?: AssetTransaction })[];
  bu: string;
  type: string;
}

export default function AssetDetailPlantClient({
  assets,
  bu,
  type,
}: AssetDetailPlantClientProps) {
  const [selectedAsset, setSelectedAsset] = useState<
    (Asset & { latestTransaction?: AssetTransaction }) | null
  >(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAssetClick = (
    asset: Asset & { latestTransaction?: AssetTransaction }
  ) => {
    setSelectedAsset(asset);
    setIsDialogOpen(true);
  };

  const getStatusBadgeColor = (status: string) => {
    if (status.includes("Active") || status.includes("Work")) {
      return "bg-green-500";
    } else if (status.includes("Idle")) {
      return "bg-lime-500";
    } else if (status.includes("Waiting")) {
      return "bg-yellow-500";
    } else if (status.includes("Breakdown") || status.includes("Damage")) {
      return "bg-rose-500";
    } else if (status.includes("Not Exist")) {
      return "bg-red-500";
    } else if (status.includes("Cannot Find")) {
      return "bg-purple-500";
    } else if (status.includes("Transferred")) {
      return "bg-teal-500";
    }
    return "bg-gray-500";
  };

  const openAssetPage = (asset: number, sub: number) => {
    const url = `/Asset/${bu}/Tracking/${asset}/${sub}`;
    window.open(url, "_blank");
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Plant Assets ({assets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Asset/Sub</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Quantity</TableHead>
                  <TableHead className="w-[100px]">UOM</TableHead>
                  <TableHead className="w-[150px]">Location</TableHead>
                  <TableHead className="w-[150px]">Latest Status</TableHead>
                  <TableHead className="w-[120px]">Latest Date</TableHead>
                  <TableHead className="w-[80px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={`${asset.asset}-${asset.sub}`}>
                    <TableCell>
                      <button
                        onClick={() => handleAssetClick(asset)}
                        className="font-mono font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {asset.asset}-{asset.sub}
                      </button>
                    </TableCell>
                    <TableCell className="max-w-md">
                      {asset.description}
                    </TableCell>
                    <TableCell className="text-right">
                      {asset.latestTransaction?.qty || asset.quantity}
                    </TableCell>
                    <TableCell>{asset.uom}</TableCell>
                    <TableCell>
                      {asset.latestTransaction?.place || asset.location}
                    </TableCell>
                    <TableCell>
                      {asset.latestTransaction ? (
                        <Badge
                          className={`${getStatusBadgeColor(asset.latestTransaction.status)} text-white`}
                        >
                          {asset.latestTransaction.status}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">
                          No records
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {asset.latestTransaction?.date || "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAssetPage(asset.asset, asset.sub)}
                        title="Open asset details in new tab"
                      >
                        <ExternalLinkIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Asset Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Asset Details:{" "}
              <span className="font-mono">
                {selectedAsset?.asset}-{selectedAsset?.sub}
              </span>
            </DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-4">
              {/* Basic Asset Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Asset Number</div>
                  <div className="font-mono font-semibold text-lg">
                    {selectedAsset.asset}-{selectedAsset.sub}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Business Unit</div>
                  <div className="font-semibold">
                    {selectedAsset.bu.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-gray-500">Description</div>
                <div className="font-medium">{selectedAsset.description}</div>
              </div>

              {/* Asset Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Asset Class</div>
                  <div className="font-semibold">
                    {selectedAsset.assetClass}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Quantity</div>
                  <div className="font-semibold">
                    {selectedAsset.quantity} {selectedAsset.uom}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Plant</div>
                  <div className="font-semibold">{selectedAsset.plant}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Location</div>
                  <div className="font-semibold">{selectedAsset.location}</div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Financial Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Book Value</div>
                    <div className="font-semibold">
                      {selectedAsset.bookVal.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">
                      Acquisition Value
                    </div>
                    <div className="font-semibold">
                      {selectedAsset.acquisVal.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">
                      Accumulated Depreciation
                    </div>
                    <div className="font-semibold">
                      {selectedAsset.accumDep.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">
                      Useful Life
                    </div>
                    <div className="font-semibold">
                      {selectedAsset.usefulLife} years
                    </div>
                  </div>
                </div>
              </div>

              {/* Latest Transaction */}
              {selectedAsset.latestTransaction && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Latest Transaction</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`${getStatusBadgeColor(selectedAsset.latestTransaction.status)} text-white`}
                      >
                        {selectedAsset.latestTransaction.status}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        on {selectedAsset.latestTransaction.date}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">
                          Inspector
                        </div>
                        <div className="font-semibold">
                          {selectedAsset.latestTransaction.inspector}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">Place</div>
                        <div className="font-semibold">
                          {selectedAsset.latestTransaction.place}
                        </div>
                      </div>
                    </div>
                    {selectedAsset.latestTransaction.remark && (
                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                        <div className="text-sm text-yellow-700 mb-1">
                          Remark
                        </div>
                        <div className="text-sm">
                          {selectedAsset.latestTransaction.remark}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="border-t pt-4 flex justify-end">
                <Button
                  onClick={() =>
                    openAssetPage(selectedAsset.asset, selectedAsset.sub)
                  }
                  className="flex items-center gap-2"
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                  View Full Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
