import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { getAssetsByPlant } from "@/lib/actions/assets";
import AssetDetailPlantClient from "@/components/asset-detail-plant-client";
import { getCountries } from "@/lib/constants/countries";
import QRCodeComponent from "@/components/qr-code";
import { ArrowLeft, Package } from "lucide-react";

interface BUSiteAssetPageProps {
  params: Promise<{
    bu: string;
    site: string;
  }>;
}

export default async function BUSiteAssetPage({
  params,
}: BUSiteAssetPageProps) {
  const { bu, site } = await params;

  // Fetch assets by plant
  const result = await getAssetsByPlant(bu, "tracking", site);

  // Get country information
  const countries = await getCountries();
  const country = countries.find((c) => c.code === bu.toLowerCase());
  const buName = country?.name || bu.toUpperCase();
  const buFlag = country?.flag || "🏢";
  const siteName = site.toUpperCase();

  if (!result.success) {
    return (
      <div className="container mx-auto p-6">
        <Breadcrumbs
          items={[
            { label: "Asset KPI", href: "/kpiasset" },
            // { label: buName, href: `/kpiasset/${bu}` },
            { label: siteName },
          ]}
        />
        <div className="mt-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href={`/kpiasset/${bu}`}>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to {buName}
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl">{buFlag}</div>
            <div>
              <h1 className="text-3xl font-bold">
                {buName} - {siteName}
              </h1>
            </div>
          </div>
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <div className="text-red-500 text-xl mb-4">
              Error loading assets
            </div>
            <p className="text-gray-600">{result.error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const assets = result.assets || [];

  if (assets.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Breadcrumbs
          items={[
            { label: "Asset KPI", href: "/kpiasset" },
            { label: buName, href: `/kpiasset/${bu}` },
            { label: siteName },
          ]}
        />
        <div className="mt-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href={`/kpiasset/${bu}`}>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to {buName}
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl">{buFlag}</div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">
                {buName} - {siteName}
              </h1>
              <p className="text-gray-600">Asset Tracking Dashboard</p>
            </div>
            <div className="ml-6 flex-shrink-0">
              <QRCodeComponent
                value={`https://www.saf37y.com/kpiasset/${bu}/${site}`}
              />
            </div>
          </div>
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              No assets found for plant {siteName}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Breadcrumbs
        items={[
          { label: "Asset KPI", href: "/kpiasset" },
          { label: buName, href: `/kpiasset/${bu}` },
          { label: siteName },
        ]}
      />

      {/* Header */}
      <div className="mt-6 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/kpiasset/${bu}`}>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {buName}
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="text-4xl">{buFlag}</div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">
              {buName} - {siteName}
            </h1>
            <p className="text-gray-600">
              Asset Tracking Dashboard - {assets.length} asset
              {assets.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <div className="ml-6 flex-shrink-0">
            <QRCodeComponent
              value={`https://www.saf37y.com/kpiasset/${bu}/${site}`}
            />
          </div>
        </div>
      </div>

      {/* Asset Table */}
      <AssetDetailPlantClient assets={assets} bu={bu} type="tracking" />
    </div>
  );
}
