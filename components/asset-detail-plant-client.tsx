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
import { ExternalLinkIcon, ZoomInIcon, ImageIcon } from "lucide-react";
import { MapPinIcon } from "lucide-react";

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
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

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

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setIsMapModalOpen(true);
  };

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const formatImageUrl = (image: string) => {
    // If it's already a full Firebase Storage URL, return as-is
    if (image.startsWith("https://firebasestorage.googleapis.com")) {
      return image;
    }

    // Otherwise, format it as a Firebase Storage URL
    return `https://firebasestorage.googleapis.com/v0/b/sccc-inseesafety-prod.firebasestorage.app/o/${encodeURIComponent(image)}?alt=media`;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src =
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMkgxNFYxNkgyMFYyMlpNMjAgMzhIMTRWMzJIMjBWMzhaTTIwIDQ2SDE0VjQwSDIwVjQ2WiIgZmlsbD0iIzlDQTRBRiIvPgo8cGF0aCBkPSJNNTAgMjJINDRWMTZINTBWMjJaTTUwIDM4SDQ0VjMySDUwVjM4Wk01MCA0Nkg0NFY0MEg1MFY0NloiIGZpbGw9IiM5Q0E0QUYiLz4KPHBhdGggZD0iTTM1IDIySDI5VjE2SDM1VjIyWk0zNSAzOEgyOVYzMkgzNVYzOFpNMzUgNDZIMjlWNDBIMzVWNDZaIiBmaWxsPSIjOUNBNEFGIi8+Cjx0ZXh0IHg9IjMyIiB5PSIzNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzlDQTRBRiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjhweCI+RXJyb3I8L3RleHQ+Cjwvc3ZnPg==";
  };

  const handleImageClick = (image: string) => {
    const imageUrl = formatImageUrl(image);
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
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
                  <TableHead className="w-[120px]">Asset-Sub</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Map</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead className="w-[120px]">Latest Date</TableHead>
                  <TableHead className="w-[100px]">Quantity</TableHead>
                  <TableHead className="w-[100px]">UOM</TableHead>
                  <TableHead className="w-[150px]">Location</TableHead>
                  <TableHead className="w-[150px]">Latest Status</TableHead>
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
                      {asset.latestTransaction?.inspector || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {asset.latestTransaction?.latitude &&
                        asset.latestTransaction?.longitude && (
                          <button
                            onClick={() =>
                              handleMapClick(
                                asset.latestTransaction?.latitude!,
                                asset.latestTransaction?.longitude!
                              )
                            }
                            className="mt-3 p-2 text-gray-800 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                            title="View location on map"
                          >
                            <MapPinIcon className="h-6 w-6 text-blue-500" />
                          </button>
                        )}
                    </TableCell>
                    <TableCell>
                      {asset.latestTransaction?.images &&
                      asset.latestTransaction.images.length > 0 ? (
                        <div className="flex gap-2">
                          {asset.latestTransaction.images
                            .slice(0, 3)
                            .map((image, index) => (
                              <div
                                key={index}
                                className="relative w-12 h-12 rounded border-2 border-gray-200 overflow-hidden hover:border-blue-400 cursor-pointer"
                                onClick={() => handleImageClick(image)}
                              >
                                <img
                                  src={formatImageUrl(image)}
                                  alt={`Asset ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={handleImageError}
                                />
                              </div>
                            ))}
                          {asset.latestTransaction.images.length > 3 && (
                            <div className="flex items-center justify-center w-12 h-12 rounded border-2 border-gray-200 bg-gray-100 text-xs font-semibold text-gray-600">
                              +{asset.latestTransaction.images.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {asset.latestTransaction?.date
                        ? asset.latestTransaction.date
                        : "-"}
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
                {/* <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Asset Class</div>
                  <div className="font-semibold">
                    {selectedAsset.assetClass}
                  </div>
                </div> */}
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
                {/* <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Location</div>
                  <div className="font-semibold">{selectedAsset.location}</div>
                </div> */}
              </div>

              {/* Financial Information */}
              {/* <div className="border-t pt-4">
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
              </div> */}

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
                        {selectedAsset.latestTransaction.date}
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

                    {/* Clickable Map */}
                    {selectedAsset.latestTransaction.latitude &&
                      selectedAsset.latestTransaction.longitude && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-500 mb-2">
                            Location
                          </div>
                          <button
                            onClick={() =>
                              handleMapClick(
                                selectedAsset.latestTransaction!.latitude!,
                                selectedAsset.latestTransaction!.longitude!
                              )
                            }
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <MapPinIcon className="h-5 w-5" />
                            <span className="font-mono">
                              {formatCoordinates(
                                selectedAsset.latestTransaction.latitude,
                                selectedAsset.latestTransaction.longitude
                              )}
                            </span>
                          </button>
                        </div>
                      )}

                    {/* Clickable Images */}
                    {selectedAsset.latestTransaction.images &&
                      selectedAsset.latestTransaction.images.length > 0 && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-500 mb-2">
                            Images (
                            {selectedAsset.latestTransaction.images.length})
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedAsset.latestTransaction.images.map(
                              (image, index) => (
                                <div
                                  key={index}
                                  className="relative w-20 h-20 rounded border-2 border-gray-200 overflow-hidden hover:border-blue-400 cursor-pointer transition-all hover:scale-105"
                                  onClick={() => handleImageClick(image)}
                                >
                                  <img
                                    src={formatImageUrl(image)}
                                    alt={`Asset ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={handleImageError}
                                  />
                                </div>
                              )
                            )}
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

      {/* Map Modal */}
      <Dialog open={isMapModalOpen} onOpenChange={setIsMapModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <MapPinIcon className="h-5 w-5" />
              Asset Location
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-2">
            {selectedLocation && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Coordinates:</div>
                  <div className="font-mono text-lg font-semibold">
                    {formatCoordinates(
                      selectedLocation.lat,
                      selectedLocation.lng
                    )}
                  </div>
                </div>

                <div className="w-full h-96 border rounded-lg overflow-hidden">
                  <iframe
                    src={`https://maps.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}&z=18&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Asset Location Map"
                  />
                </div>

                <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `https://maps.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}&z=18`,
                        "_blank"
                      )
                    }
                    className="flex items-center gap-2"
                  >
                    <MapPinIcon className="h-4 w-4" />
                    Open in Google Maps
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `${selectedLocation.lat},${selectedLocation.lng}`
                      )
                    }
                    className="flex items-center gap-2"
                  >
                    📋 Copy Coordinates
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Asset Image</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-2">
            {selectedImage && (
              <div className="flex justify-center">
                <img
                  src={selectedImage}
                  alt="Asset image"
                  className="max-w-full max-h-[70vh] object-contain rounded"
                  onError={(e) => {
                    e.currentTarget.src =
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCA0MDAgMzAwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CiAgPHRleHQgeD0iMjAwIiB5PSIxNTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Q0E0QUYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNnB4Ij5JbWFnZSBjb3VsZCBub3QgYmUgbG9hZGVkPC90ZXh0Pgo8L3N2Zz4=";
                  }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
