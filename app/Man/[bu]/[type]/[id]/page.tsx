import ManOption from "@/components/man-option";
import ManHeader from "@/components/man-header";
import ManDetail from "@/components/man-detail";
import ManFormSOT from "@/components/man-form-sot";
import { normalizeBuCode } from "@/lib/utils";

export default async function MachinePage({ 
  params 
}: { 
  params: Promise<{ bu: string; type: string; id: string }> 
}) {
  const { bu, type, id } = await params;
  
  // Decode URL parameters to handle special characters (including Thai characters)
  const decodedBu = decodeURIComponent(bu);
  const decodedType = decodeURIComponent(type);
  const decodedId = decodeURIComponent(id);

  // Normalize BU code (map office, srb, mkt, lbm, rmx, iagg, ieco to "th")
  const normalizedBu = normalizeBuCode(decodedBu);

  return (
    <div className="max-w-4xl mx-auto p-2">
      <ManOption bu={normalizedBu} type={decodedType} id={decodedId} />
      <ManHeader bu={normalizedBu} type={decodedType} id={decodedId} />
      <ManDetail bu={normalizedBu} type={decodedType} id={decodedId} />
      <ManFormSOT bu={normalizedBu} type={decodedType} id={decodedId} />
    </div>
  );
}
