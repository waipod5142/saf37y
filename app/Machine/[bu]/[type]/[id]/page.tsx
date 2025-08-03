import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import MachineTitle from "@/components/machine-title";
import MachineHeader from "@/components/machine-header";
import MachineDetail from "@/components/machine-detail";
import MachineForm from "@/components/machine-form";

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

  return (
    <div className="max-w-4xl mx-auto p-2">     
      <MachineTitle bu={decodedBu} type={decodedType} id={decodedId} />
      <MachineHeader bu={decodedBu} type={decodedType} id={decodedId} />
      <MachineDetail bu={decodedBu} type={decodedType} id={decodedId} />
      <MachineForm bu={decodedBu} type={decodedType} id={decodedId} />
    </div>
  );
}
