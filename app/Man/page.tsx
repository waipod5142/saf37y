import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircleIcon } from "lucide-react";
import Link from "next/link";

export default function NewProperty() {
  return (
    <div>
      <Breadcrumbs
        items={[
          {
            href: "/Machine",
            label: "Machine page",
          },
          {
            label: "New Property",
          },
        ]}
      />
      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">New Property</CardTitle>
        </CardHeader>
        <CardContent>test</CardContent>
      </Card>
      <h1 className="text-4xl font-bold mt-6">Go to Machine</h1>
      <Button asChild className="inline-flex pl-2 gap-2 mt-4">
        <Link href="/Machine">
          <PlusCircleIcon /> New Property
        </Link>
      </Button>
    </div>
  );
}
