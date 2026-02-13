import { getAssetsByPlant } from "@/lib/actions/assets";
import AssetDetailPlantClient from "./asset-detail-plant-client";

interface AssetDetailPlantProps {
  bu: string;
  type: string;
  id: string;
}

export default async function AssetDetailPlant({
  bu,
  type,
  id,
}: AssetDetailPlantProps) {
  // Fetch assets by plant (id is the plant code)
  const result = await getAssetsByPlant(bu, type, id);

  if (!result.success) {
    return (
      <div className="p-4 text-center text-red-500">
        Error loading assets: {result.error}
      </div>
    );
  }

  const assets = result.assets || [];

  if (assets.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No assets found for plant {id}
      </div>
    );
  }

  return <AssetDetailPlantClient assets={assets} bu={bu} type={type} />;
}
