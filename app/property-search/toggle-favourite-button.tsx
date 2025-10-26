"use client";

import { HeartIcon } from "lucide-react";
import {
  addFavourite,
  removeFavourite,
  addMachineFavourite,
  removeMachineFavourite,
} from "./actions";
import { useAuth } from "@/context/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ToggleFavouriteButton({
  propertyId,
  isFavourite,
  isMachine = false,
}: {
  propertyId: string;
  isFavourite: boolean;
  isMachine?: boolean;
}) {
  const auth = useAuth();
  const router = useRouter();
  return (
    <button
      className={isMachine ? "p-1" : "absolute top-0 right-0 z-10 p-2 bg-white rounded-bl-lg"}
      onClick={async () => {
        const tokenResult = await auth?.currentUser?.getIdTokenResult();
        if (!tokenResult) {
          router.push("/login");
          return;
        }
        if (isMachine) {
          if (isFavourite) {
            await removeMachineFavourite(propertyId, tokenResult.token);
          } else {
            await addMachineFavourite(propertyId, tokenResult.token);
          }
        } else {
          if (isFavourite) {
            await removeFavourite(propertyId, tokenResult.token);
          } else {
            await addFavourite(propertyId, tokenResult.token);
          }
        }

        toast[isFavourite ? "warning" : "success"](
          `${isMachine ? "Machine" : "Property"} ${
            isFavourite ? "removed from" : "added to"
          } favourites`
        );

        router.refresh();
      }}
    >
      <HeartIcon
        className="text-black"
        fill={isFavourite ? "#db2777" : "white"}
      />
    </button>
  );
}
