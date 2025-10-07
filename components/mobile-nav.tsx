"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AuthButtons from "@/components/auth-buttons";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="md:hidden px-0 text-white hover:text-white hover:bg-red-700"
          size="icon"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[300px] bg-red-600 text-white border-l-red-500"
      >
        <nav className="flex flex-col space-y-6 mt-6">
          <Link
            href="/kpi"
            className="text-lg uppercase tracking-widest hover:underline"
            onClick={() => setOpen(false)}
          >
            Dashboard-Machine
          </Link>
          {/* <Link
            href="/dashboardbysite"
            className="text-lg uppercase tracking-widest hover:underline"
            onClick={() => setOpen(false)}
          >
            Dashboard by Site
          </Link>
          <Link
            href="/transaction"
            className="text-lg uppercase tracking-widest hover:underline"
            onClick={() => setOpen(false)}
          >
            Latest Transaction
          </Link> */}
          <div className="pt-4 border-t border-red-500">
            <AuthButtons />
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
