"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMachineByIdAction, Asset } from "@/lib/actions/assets";
import { AlertTriangleIcon } from "lucide-react";
import QRCodeComponent from "./qr-code";

interface AssetHeaderClientProps {
  bu: string;
  type: string;
  asset: string;
  sub: string;
}

export default function AssetHeader({
  bu,
  type,
  asset,
  sub,
}: AssetHeaderClientProps) {
  const [assetData, setAssetData] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAssetIdClick = () => {
    // Capitalize first letter of type
    const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
    // Navigate to asset detail page
    router.push(
      `/Asset/${bu}/${capitalizedType}/${encodeURIComponent(asset)}/${encodeURIComponent(sub)}`
    );
  };

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        setLoading(true);
        const id = sub ? `${asset}-${sub}` : asset;
        // Use the updated function with bu and type filters
        const result = await getMachineByIdAction(bu, type, id);

        if (result.success && result.machine) {
          setAssetData(result.machine as Asset);
        } else {
          setError(result.error || "Asset not found");
        }
      } catch (err) {
        setError("Failed to fetch asset data");
        console.error("Error fetching asset:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAsset();
  }, [bu, type, asset, sub]);

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <div className="text-gray-600">Loading asset details...</div>
      </div>
    );
  }

  if (error || !assetData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangleIcon className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Asset Not Found</h2>
        </div>
        <p className="text-red-600 mt-2">
          {error || `No asset data found for ${asset}-${sub}`}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <button
              onClick={handleAssetIdClick}
              className="text-2xl font-bold text-blue-600 hover:text-blue-800 mb-2 cursor-pointer transition-colors duration-200 bg-transparent border-none p-0 text-left"
              title="Click to open full asset page"
            >
              {assetData.asset}-{assetData.sub}
            </button>

            {/* Asset information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-500 font-medium">Description</span>
                <span className="text-gray-900">{assetData.description}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-gray-500 font-medium">Asset Class</span>
                <span className="text-gray-900">{assetData.assetClass}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-gray-500 font-medium">BU / Type / Site</span>
                <span className="text-gray-900 uppercase">
                  {assetData.bu} / {assetData.type} / {assetData.site}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-gray-500 font-medium">Plant</span>
                <span className="text-gray-900">
                  {assetData.plantName} ({assetData.plant})
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-gray-500 font-medium">Location</span>
                <span className="text-gray-900">{assetData.plantLocation}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-gray-500 font-medium">Department</span>
                <span className="text-gray-900">{assetData.department}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-gray-500 font-medium">Cost Center</span>
                <span className="text-gray-900">{assetData.costCenter}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-gray-500 font-medium">
                  Cost Center Owner
                </span>
                <span className="text-gray-900">
                  {assetData.costCenterOwner}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-gray-500 font-medium">Quantity</span>
                <span className="text-gray-900">
                  {assetData.quantity} {assetData.uom}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-gray-500 font-medium">Useful Life</span>
                <span className="text-gray-900">
                  {assetData.usefulLife} years
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-gray-500 font-medium">Book Value</span>
                <span className="text-gray-900">
                  {assetData.bookVal.toLocaleString()} THB
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-gray-500 font-medium">
                  Acquisition Value
                </span>
                <span className="text-gray-900">
                  {assetData.acquisVal.toLocaleString()} THB
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-gray-500 font-medium">
                  Accumulated Depreciation
                </span>
                <span className="text-gray-900">
                  {assetData.accumDep.toLocaleString()} THB
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-gray-500 font-medium">
                  Capitalized On
                </span>
                <span className="text-gray-900">{assetData.capitalizedOn}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-gray-500 font-medium">
                  Depreciation Start
                </span>
                <span className="text-gray-900">
                  {assetData.OrdDepStartDate}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-gray-500 font-medium">
                  Depreciation Key
                </span>
                <span className="text-gray-900">
                  {assetData.depreciationKey}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="ml-6 flex-shrink-0">
            <QRCodeComponent
              value={`https://www.saf37y.com/Asset/${bu}/${type.charAt(0).toUpperCase() + type.slice(1)}/${encodeURIComponent(asset)}/${encodeURIComponent(sub)}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
