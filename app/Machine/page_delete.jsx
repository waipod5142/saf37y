import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { PlusCircleIcon } from "lucide-react";
import Link from "next/link";
import PropertyForm from "@/components/property-form";

export default async function AdminDashboard() {
  return (
    <div>
      <Breadcrumbs
        items={[
          {
            href: "/Man",
            label: "Man page",
          },
          {
            label: "New Property",
          },
        ]}
      />
      <h1 className="text-4xl font-bold mt-6">Go to Man</h1>
      <Button asChild className="inline-flex pl-2 gap-2 mt-4">
        <Link href="/Man">
          <PlusCircleIcon /> New Property
        </Link>
      </Button>
      <PropertyForm />
    </div>
  );
}
