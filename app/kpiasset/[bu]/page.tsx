import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { getCountries } from "@/lib/constants/countries";
import { MapPin, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCodeComponent from "@/components/qr-code";

interface BUAssetPageProps {
  params: Promise<{
    bu: string;
  }>;
}

export default async function BUAssetPage({ params }: BUAssetPageProps) {
  const { bu } = await params;
  const countries = await getCountries();
  const country = countries.find((c) => c.code === bu.toLowerCase());

  if (!country) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Country not found
          </h1>
          <p className="text-gray-600 mb-6">
            The country code &quot;{bu}&quot; is not valid.
          </p>
          <Link href="/kpiasset">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Asset Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Breadcrumbs
        items={[
          { label: "Asset KPI", href: "/kpiasset" },
          { label: country.name },
        ]}
      />

      <div className="mt-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/kpiasset">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Overview
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="text-4xl">{country.flag}</div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{country.name} - Asset Tracking by Site</h1>
            <p className="text-gray-600 mt-2">
              Select a site to view asset tracking details
            </p>
          </div>
          <div className="ml-6 flex-shrink-0">
            <QRCodeComponent value={`https://www.saf37y.com/kpiasset/${bu}`} />
          </div>
        </div>
      </div>

      {/* Site Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {country.sites.map((site) => (
          <Link
            key={site}
            href={`/kpiasset/${bu.toLowerCase()}/${site.toLowerCase()}`}
          >
            <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-green-300 cursor-pointer h-full">
              <CardHeader className="text-center pb-3">
                <div className="flex items-center justify-center mb-2">
                  <MapPin className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl font-bold">
                  {site.toUpperCase()}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <Badge
                  variant="outline"
                  className="bg-green-50 border-green-500 text-green-700"
                >
                  View Assets
                </Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {country.sites.length === 0 && (
        <Card className="mt-6">
          <CardContent className="text-center py-12">
            <p className="text-gray-600">No sites available for {country.name}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
