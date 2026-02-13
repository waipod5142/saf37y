import { redirect } from "next/navigation";

export default async function MachinePage({
  params,
}: {
  params: Promise<{ bu: string; type: string; id: string }>;
}) {
  const { type, id } = await params;

  // Decode URL parameters to handle special characters (including Thai characters)
  const decodedType = decodeURIComponent(type);
  const decodedId = decodeURIComponent(id);

  // Determine redirect URL based on type
  const lowerType = decodedType.toLowerCase();

  if (lowerType === "toolbox") {
    // Redirect Toolbox to the old system
    redirect(`https://sccc-inseesafety-prod.web.app/Man/toolbox/${decodedId}`);
  } else if (lowerType === "boot") {
    // Redirect Boot to the old system
    redirect(`https://sccc-inseesafety-prod.web.app/Man/bootform/${decodedId}`);
  }

  // For other types, redirect to generic Man page (you can modify this if needed)
  redirect(`https://sccc-inseesafety-prod.web.app/Man/${lowerType}/${decodedId}`);
}
