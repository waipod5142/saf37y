"use client";

import { removeFavourite, removeMachineFavourite } from "@/app/property-search/actions";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function RemoveFavouriteButton({
  propertyId,
  isMachine = false,
}: {
  propertyId: string;
  isMachine?: boolean;
}) {
  const auth = useAuth();
  const router = useRouter();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        const tokenResult = await auth?.currentUser?.getIdTokenResult();
        if (!tokenResult) {
          return;
        }
        if (isMachine) {
          await removeMachineFavourite(propertyId, tokenResult.token);
          toast.warning("Machine removed from favourites");
        } else {
          await removeFavourite(propertyId, tokenResult.token);
          toast.warning("Property removed from favourites");
        }
        router.refresh();
      }}
    >
      <Trash2Icon className="h-4 w-4 text-red-500" />
    </Button>
  );
}
