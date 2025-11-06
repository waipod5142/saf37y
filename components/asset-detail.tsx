import { getAssetTransactions } from "@/lib/actions/assets";
import { AssetTransaction } from "@/lib/actions/assets";
import AssetDetailClient from "./asset-detail-client";

interface AssetDetailProps {
  bu: string;
  type: string;
  asset: string;
  sub: string;
}

// Serialize records to plain objects
const serializeRecord = (record: AssetTransaction): AssetTransaction => {
  return {
    ...record,
  };
};

export default async function AssetDetail({
  bu,
  type,
  asset,
  sub,
}: AssetDetailProps) {
  const assetNumber = parseInt(asset);
  const subNumber = parseInt(sub);

  let records: AssetTransaction[] = [];

  // Fetch asset transaction records
  const result = await getAssetTransactions(bu, type, assetNumber, subNumber);

  if (result.success && result.transactions) {
    records = result.transactions;
  }

  // Serialize the records to ensure they can be passed to client component
  const serializedRecords = records.map(serializeRecord);

  return <AssetDetailClient records={serializedRecords} />;
}
