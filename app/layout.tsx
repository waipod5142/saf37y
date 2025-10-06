import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { AuthProvider } from "@/context/auth";
import AuthButtons from "@/components/auth-buttons";
import { Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import Image from "next/image";
import { MobileNav } from "@/components/mobile-nav";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "INSEE Safety",
  description: "Application for Insee Safety",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.className} antialiased`}>
        <AuthProvider>
          <nav className="bg-red-600 text-white p-5 h-14 flex items-center justify-between z-10 relative">
            <Link
              href="/"
              className="flex gap-3 items-center"
            >
              <Image
                src="/SCCC.BK.svg"
                alt="INSEE Logo"
                width={40}
                height={40}
                className="w-8 h-8 filter brightness-0 invert"
              />
              <span className="text-xl tracking-widest uppercase font-semibold">INSEE Safety</span>
            </Link>
            
            {/* Desktop Navigation */}
            <ul className="hidden md:flex gap-6 items-center">
              <li>
                <Link
                  href="/kpi"
                  className="uppercase tracking-widest hover:underline"
                >
                  Dashboard by country
                </Link>
              </li>
              {/* <li>
                <Link
                  href="/dashboardbysite"
                  className="uppercase tracking-widest hover:underline"
                >
                  Dashboard by Site
                </Link>
              </li> */}
              {/* <li>
                <Link
                  href="/transaction"
                  className="uppercase tracking-widest hover:underline"
                >
                  Lastest transaction
                </Link>
              </li> */}
              <li>
                <AuthButtons />
              </li>
            </ul>

            {/* Mobile Navigation */}
            <MobileNav />
          </nav>
          {children}
          <Toaster richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
