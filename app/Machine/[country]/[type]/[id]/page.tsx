import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import MachineForm from "@/components/machine-form";

export default async function MachinePage({ 
  params 
}: { 
  params: Promise<{ country: string; type: string; id: string }> 
}) {
  const { country, type, id } = await params;
  
  return (
    <div className="container mx-auto py-6">
      <Breadcrumbs
        items={[
          {
            href: "/Machine",
            label: "Machine Inspection",
          },
          {
            href: `/Machine/${country}`,
            label: country.toUpperCase(),
          },
          {
            href: `/Machine/${country}/${type}`,
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
      
      <MachineForm country={country} type={type} id={id} />
    </div>
  );
}
