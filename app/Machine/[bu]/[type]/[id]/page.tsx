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
  
  return (
    <div className="max-w-4xl mx-auto p-2">     
      <MachineTitle bu={bu} type={type} id={id} />
      <MachineHeader bu={bu} type={type} id={id} />
      <MachineDetail bu={bu} type={type} id={id} />
      <MachineForm bu={bu} type={type} id={id} />
    </div>
  );
}
