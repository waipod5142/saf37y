import { redirect } from "next/navigation";

export default async function MachinePage({
  params,
}: {
  params: Promise<{ bu: string; type: string; id: string }>;
}) {
  const { id } = await params;

  // Decode the ID to handle special characters (including Thai characters)
  const decodedId = decodeURIComponent(id);

  // Redirect to the old system automatically
  redirect(`https://sccc-inseesafety-prod.web.app/Machine/${decodedId}`);
}
