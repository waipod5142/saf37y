import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { getCountries } from "@/lib/constants/countries";
import { MapPin } from "lucide-react";
import QRCodeComponent from "@/components/qr-code";

export default async function KPIPage() {
  const countries = await getCountries();
  return (
    <div className="container mx-auto p-6">
      <Breadcrumbs items={[{ label: "MACHINE KPI" }]} />

      <div className="mt-6 mb-8 flex items-start justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-4">
            Machine Inspection Dashboard by Site by Department
          </h1>
          <p className="text-gray-600">
            Select a country to view all sites, or choose a specific site for
            faster queries.
          </p>
        </div>
        <div className="flex-shrink-0">
          <QRCodeComponent value="https://www.saf37y.com/dashboardbysite" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {countries.map((country) => (
          <Card
            key={country.code}
            className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200"
          >
            <CardHeader className="text-center pb-4">
              <div className="text-8xl mb-3">{country.flag}</div>
              <CardTitle className="text-2xl font-bold">
                {country.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-800 mb-2">
                  {country.sites.length} site
                  {country.sites.length !== 1 ? "s" : ""}
                </div>
              </div>

              {/* Individual Site Links */}
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-600 mb-3 text-center font-medium">
                  Or select a specific site:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {country.sites.map((site) => (
                    <Link
                      key={site}
                      href={`/dashboardbysite/${site.toLowerCase()}`}
                    >
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-green-50 hover:border-green-500 hover:text-green-700 transition-colors px-3 py-1"
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        {site.toUpperCase()}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
