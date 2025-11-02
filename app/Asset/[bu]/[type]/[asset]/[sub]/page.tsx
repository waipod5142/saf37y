import AssetHeader from "@/components/asset-header";
import AssetDetail from "@/components/asset-detail";
import AssetForm from "@/components/asset-form";
import { normalizeBuCode } from "@/lib/utils";

export default async function AssetPage({
  params,
}: {
  params: Promise<{ bu: string; type: string; asset: string; sub: string }>;
}) {
  const { bu, type, asset, sub } = await params;

  // Decode URL parameters to handle special characters (including Thai characters)
  const decodedBu = decodeURIComponent(bu);
  const decodedType = decodeURIComponent(type);
  const decodedAsset = decodeURIComponent(asset);
  const decodedSub = decodeURIComponent(sub);

  // Normalize BU code (map office, srb, mkt, lbm, rmx, iagg, ieco to "th")
  const normalizedBu = normalizeBuCode(decodedBu);

  return (
    <div className="max-w-4xl mx-auto p-2 pb-24">
      <AssetHeader
        bu={normalizedBu}
        type={decodedType.toLowerCase()}
        asset={decodedAsset}
        sub={decodedSub}
      />
      <AssetDetail
        bu={normalizedBu}
        type={decodedType.toLowerCase()}
        asset={decodedAsset}
        sub={decodedSub}
      />
      <AssetForm
        bu={normalizedBu}
        type={decodedType.toLowerCase()}
        asset={decodedAsset}
        sub={decodedSub}
      />
    </div>
  );
}
