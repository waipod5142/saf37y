import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { getCountries } from "@/lib/constants/countries";
import { AlertTriangle } from "lucide-react";
import QRCodeComponent from "@/components/qr-code";

export default async function AlertDashboardPage() {
  const countries = await getCountries();
  return (
    <div className="container mx-auto p-6">
      <Breadcrumbs items={[{ label: "Alert Dashboard" }]} />

      <div className="mt-6 mb-8 flex items-start justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
            Safety Alert Dashboard
          </h1>
          <p className="text-gray-600">
            Select a country to view safety alerts and incident reports.
          </p>
        </div>
        <div className="flex-shrink-0">
          <QRCodeComponent value="https://www.saf37y.com/kpialert" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {countries.map((country) => (
          <Link key={country.code} href={`/kpialert/${country.code}`}>
            <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-orange-300 cursor-pointer">
              <CardHeader className="text-center pb-4">
                <div className="text-8xl mb-3">{country.flag}</div>
                <CardTitle className="text-2xl font-bold">
                  {country.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200 hover:border-orange-300">
                  <div className="flex items-center justify-center gap-2 text-orange-700 font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    <span>View Alerts</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
