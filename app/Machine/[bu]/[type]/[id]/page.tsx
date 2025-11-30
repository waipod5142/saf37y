import MachineTitle from "@/components/machine-title";
import MachineHeader from "@/components/machine-header";
import MachineDetail from "@/components/machine-detail";
import MachineForm from "@/components/machine-form";
import MachineForm4photo from "@/components/machine-form4photo";
import MachineFormTalk from "@/components/machine-formTalk";
import MachineFormDriving from "@/components/machine-formDriving";
import MachineFormStat from "@/components/machine-formStat";
import MachineFormAccess from "@/components/machine-formAccess";
import AssetDetailPlant from "@/components/asset-detail-plant";
import MachineOption from "@/components/machine-option";
import MachineInduction from "@/components/machine-induction";
import { normalizeBuCode } from "@/lib/utils";

export default async function MachinePage({
  params,
}: {
  params: Promise<{ bu: string; type: string; id: string }>;
}) {
  const { bu, type, id } = await params;

  // Decode URL parameters to handle special characters (including Thai characters)
  const decodedBu = decodeURIComponent(bu);
  const decodedType = decodeURIComponent(type);
  const decodedId = decodeURIComponent(id);

  // Normalize BU code (map office, srb, mkt, lbm, rmx, iagg, ieco to "th")
  const normalizedBu = normalizeBuCode(decodedBu);

  return (
    <div className="max-w-4xl mx-auto p-2 pb-24">
      <MachineTitle
        bu={normalizedBu}
        type={decodedType.toLowerCase()}
        id={decodedId}
      />
      <MachineOption
        bu={normalizedBu}
        type={decodedType.toLowerCase()}
        id={decodedId}
      />
      <MachineHeader
        bu={normalizedBu}
        type={decodedType.toLowerCase()}
        id={decodedId}
      />
      <MachineInduction
        bu={decodedBu}
        type={decodedType.toLowerCase()}
        id={decodedId}
      />
      {decodedType.toLowerCase() !== "plantaccess" &&
        decodedType.toLowerCase() !== "plantasset" && (
          <MachineDetail
            bu={normalizedBu}
            type={decodedType.toLowerCase()}
            id={decodedId}
          />
        )}
      {decodedType.toLowerCase() === "mixerphoto" ? (
        <MachineForm4photo
          bu={normalizedBu}
          type={decodedType.toLowerCase()}
          id={decodedId}
        />
      ) : decodedType.toLowerCase() === "planttalk" ? (
        <MachineFormTalk
          bu={normalizedBu}
          type={decodedType.toLowerCase()}
          id={decodedId}
        />
      ) : decodedType.toLowerCase() === "plantstat" ? (
        <MachineFormStat
          bu={normalizedBu}
          type={decodedType.toLowerCase()}
          id={decodedId}
        />
      ) : decodedType.toLowerCase() === "plantaccess" ? (
        <MachineFormAccess
          bu={normalizedBu}
          type={decodedType.toLowerCase()}
          id={decodedId}
        />
      ) : decodedType.toLowerCase() === "plantasset" ? (
        <AssetDetailPlant
          bu={normalizedBu}
          type={decodedType.toLowerCase()}
          id={decodedId}
        />
      ) : decodedType.toLowerCase() === "driving" ? (
        <MachineFormDriving
          bu={normalizedBu}
          type={decodedType.toLowerCase()}
          id={decodedId}
        />
      ) : (
        <MachineForm
          bu={normalizedBu}
          type={decodedType.toLowerCase()}
          id={decodedId}
        />
      )}
    </div>
  );
}
