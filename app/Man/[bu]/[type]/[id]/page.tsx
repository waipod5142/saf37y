import ManOption from "@/components/man-option";
import ManHeader from "@/components/man-header";
import ManDetail from "@/components/man-detail";
import ManFormSOT from "@/components/man-form-sot";
import { normalizeBuCode } from "@/lib/utils";
import ManFormTalk from "@/components/man-form-talk";
import ManFormToolbox from "@/components/man-form-toolbox";
import ManFormToken from "@/components/man-form-token";
import ManTypeBadge from "@/components/man-type-badge";
import ChangeUserButton from "@/components/change-user-button";

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
      <ChangeUserButton />
      <ManOption bu={normalizedBu} type={decodedType} id={decodedId} />
      <div className="mb-4">
        <ManTypeBadge type={decodedType} className="text-sm" />
      </div>
      {type === 'Coupon' && <ManFormToken bu={normalizedBu} type={decodedType} id={decodedId} />}
      <ManHeader bu={normalizedBu} type={decodedType} id={decodedId} />
      <ManDetail bu={normalizedBu} type={decodedType} id={decodedId} />
      
      {(() => {
        const lowerType = decodedType.toLowerCase();
        if (lowerType === "sot") {
          return <ManFormSOT bu={normalizedBu} type={decodedType} id={decodedId} />;
        } else if (lowerType === "talk") {
          return <ManFormTalk bu={normalizedBu} type={decodedType} id={decodedId} />;
        } else if (lowerType === "toolbox") {
          return <ManFormToolbox bu={normalizedBu} type={decodedType} id={decodedId} />;
        }
        // Return nothing for unrecognized types
        return null;
      })()}
    </div>
  );
}
