import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import MachineHeader from "@/components/machine-header";
import MachineDetail from "@/components/machine-detail";
import MachineForm from "@/components/machine-form";

export default async function MachinePage({ 
  params 
}: { 
  params: Promise<{ bu: string; type: string; id: string }> 
}) {
  const { bu, type, id } = await params;
  
  return (
    <div className="container mx-auto py-6">
      <Breadcrumbs
        items={[
          {
            href: "/Machine",
            label: "Machine Inspection",
          },
          {
            href: `/Machine/${bu}`,
            label: bu.toUpperCase(),
          },
          {
            href: `/Machine/${bu}/${type}`,
            label: type.toUpperCase(),
          },
          {
            label: `ID: ${id}`,
          },
        ]}
      />
      
      <div className="flex items-center justify-between my-6">
        <h1 className="text-3xl font-bold">Machine Inspection Form</h1>
        <Button asChild variant="outline" className="inline-flex gap-2">
          <Link href="/Machine">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Machine List
          </Link>
        </Button>
      </div>
      
      <MachineHeader bu={bu} type={type} id={id} />
      <MachineDetail bu={bu} type={type} id={id} />
      <MachineForm bu={bu} type={type} id={id} />
    </div>
  );
}
