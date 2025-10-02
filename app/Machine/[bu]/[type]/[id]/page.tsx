import MachineTitle from "@/components/machine-title";
import MachineHeader from "@/components/machine-header";
import MachineDetail from "@/components/machine-detail";
import MachineForm from "@/components/machine-form";
import MachineForm4photo from "@/components/machine-form4photo";
import MachineOption from "@/components/machine-option";
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
      <MachineTitle bu={normalizedBu} type={decodedType} id={decodedId} />
      <MachineOption bu={normalizedBu} type={decodedType} id={decodedId} />
      <MachineHeader bu={normalizedBu} type={decodedType} id={decodedId} />
      <MachineDetail bu={normalizedBu} type={decodedType} id={decodedId} />
      {decodedType.toLowerCase() === "mixerphoto" ? (
        <MachineForm4photo bu={normalizedBu} type={decodedType} id={decodedId} />
      ) : (
        <MachineForm bu={normalizedBu} type={decodedType} id={decodedId} />
      )}
    </div>
  );
}
