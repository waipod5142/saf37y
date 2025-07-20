// import { Button } from "@/components/ui/button";
// import { SearchIcon } from "lucide-react";
import Image from "next/image";
// import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen -mt-24 relative p-6 md:p-24 flex items-center justify-center">
      <Image fill className="object-contain" src="/SCCC.BK_BIG.png" alt="" />
      <div className="absolute top-0 left-0 size-full bg-black/50 backdrop-blur-sm" />
      <div className="flex flex-col gap-10 text-white relative z-10">
        <div className="flex flex-col items-center gap-6">
          <Image
            src="/SCCC.BK.svg"
            alt="INSEE Logo"
            width={120}
            height={120}
            className="w-24 h-24 md:w-32 md:h-32 filter brightness-0 invert"
          />
          <h1 className="uppercase tracking-widest font-semibold text-red-600 text-4xl md:text-5xl max-w-screen-md text-center brightness-0 invert">
            Insee Safety Application
          </h1>
        </div>
        {/* <Button asChild className="mx-auto p-8 text-lg gap-5">
          <Link href="/property-search">
            <SearchIcon /> Search Properties
          </Link>
        </Button> */}
      </div>
    </main>
  );
}
