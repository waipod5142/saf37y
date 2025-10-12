import ManFormAlert from "@/components/man-form-alert";
import { normalizeBuCode } from "@/lib/utils";
import ManFormMeeting from "@/components/man-form-meeting";
import ManFormToolbox from "@/components/man-form-toolbox";
import ManFormBoot from "@/components/man-form-boot";
import ManFormRa from "@/components/man-form-ra";

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
    <div className="max-w-4xl mx-auto p-2">
      {(() => {
        const lowerType = decodedType.toLowerCase();
        if (lowerType === "alertform") {
          return (
            <ManFormAlert bu={normalizedBu} type={decodedType} id={decodedId} />
          );
        } else if (lowerType === "meetingform") {
          return (
            <ManFormMeeting
              bu={normalizedBu}
              type={decodedType}
              id={decodedId}
            />
          );
        } else if (lowerType === "toolbox") {
          return (
            <ManFormToolbox
              bu={normalizedBu}
              type={decodedType}
              id={decodedId}
            />
          );
        } else if (lowerType === "bootform") {
          return (
            <ManFormBoot bu={normalizedBu} type={decodedType} id={decodedId} />
          );
        } else if (lowerType === "raform") {
          return (
            <ManFormRa bu={normalizedBu} type={decodedType} id={decodedId} />
          );
        }
        // Return nothing for unrecognized types
        return null;
      })()}
    </div>
  );
}
