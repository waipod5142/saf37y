import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FiltersForm from "./filters-form";
import { Suspense } from "react";
import { getMachines } from "@/data/machines";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ToggleFavouriteButton from "./toggle-favourite-button";
import { getUserMachineFavourites } from "@/data/favourites";
import { cookies } from "next/headers";
import { auth } from "@/firebase/server";
import { DecodedIdToken } from "firebase-admin/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";

export default async function PropertySearch({
  searchParams,
}: {
  searchParams: Promise<any>;
}) {
  const searchParamsValues = await searchParams;

  const parsedPage = parseInt(searchParamsValues?.page);

  const page = isNaN(parsedPage) ? 1 : parsedPage;
  const bu = searchParamsValues?.bu || null;
  const type = searchParamsValues?.type || null;
  const site = searchParamsValues?.site || null;
  const id = searchParamsValues?.id || null;

  const { data, totalPages } = await getMachines({
    pagination: {
      page,
      pageSize: 20,
    },
    filters: {
      bu,
      type,
      site,
      id,
    },
  });

  const userFavourites = await getUserMachineFavourites();

  const cookieStore = await cookies();
  const token = cookieStore.get("firebaseAuthToken")?.value;
  let verifiedToken: DecodedIdToken | null = null;

  if (token) {
    verifiedToken = await auth.verifyIdToken(token);
  }

  return (
    <div className="max-w-screen-2xl mx-auto p-5">
      <h1 className="text-4xl font-bold mb-5">Machine List</h1>
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense>
            <FiltersForm />
          </Suspense>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Favorite</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>BU</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((machine: any) => {
                const machineKey = `${machine.bu}_${machine.type}_${machine.id}`;
                return (
                  <TableRow key={machine.docId || machineKey}>
                    <TableCell>
                      {(!verifiedToken || !verifiedToken.admin) && (
                        <ToggleFavouriteButton
                          isFavourite={userFavourites[machineKey]}
                          propertyId={machineKey}
                          isMachine={true}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {machine.images?.[0] && (
                        <div className="w-16 h-16 relative">
                          <Image
                            fill
                            className="object-cover rounded"
                            src={machine.images[0]}
                            alt={machine.id}
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{machine.bu}</TableCell>
                    <TableCell>{machine.site}</TableCell>
                    <TableCell>{machine.type}</TableCell>
                    <TableCell>{machine.id}</TableCell>
                    <TableCell>{machine.kind}</TableCell>
                    <TableCell>{machine.location}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          machine.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {machine.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button asChild size="sm">
                        <Link
                          href={`/Machine/${machine.bu}/${machine.type}/${machine.id}`}
                        >
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex gap-2 items-center justify-center py-10">
        {Array.from({ length: totalPages }).map((_, i) => {
          const newSearchParams = new URLSearchParams();

          if (searchParamsValues?.bu) {
            newSearchParams.set("bu", searchParamsValues.bu);
          }

          if (searchParamsValues?.type) {
            newSearchParams.set("type", searchParamsValues.type);
          }

          if (searchParamsValues?.site) {
            newSearchParams.set("site", searchParamsValues.site);
          }

          if (searchParamsValues?.id) {
            newSearchParams.set("id", searchParamsValues.id);
          }

          newSearchParams.set("page", `${i + 1}`);

          return (
            <Button
              asChild={page !== i + 1}
              disabled={page === i + 1}
              variant="outline"
              key={i}
            >
              <Link href={`/property-search?${newSearchParams.toString()}`}>
                {i + 1}
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
