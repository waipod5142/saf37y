"use server";

import { auth, firestore } from "@/firebase/server";
import { FieldValue } from "firebase-admin/firestore";

export const removeFavourite = async (
  propertyId: string,
  authToken: string
) => {
  const verifiedToken = await auth.verifyIdToken(authToken);

  if (!verifiedToken) {
    return {
      error: true,
      message: "Unauthorized",
    };
  }

  await firestore
    .collection("favourites")
    .doc(verifiedToken.uid)
    .update({
      [propertyId]: FieldValue.delete(),
    });
};

export const addFavourite = async (propertyId: string, authToken: string) => {
  const verifiedToken = await auth.verifyIdToken(authToken);

  if (!verifiedToken) {
    return {
      error: true,
      message: "Unauthorized",
    };
  }

  await firestore
    .collection("favourites")
    .doc(verifiedToken.uid)
    .set(
      {
        [propertyId]: true,
      },
      {
        merge: true,
      }
    );
};

export const removeMachineFavourite = async (
  machineKey: string,
  authToken: string
) => {
  const verifiedToken = await auth.verifyIdToken(authToken);

  if (!verifiedToken) {
    return {
      error: true,
      message: "Unauthorized",
    };
  }

  await firestore
    .collection("machineFavourites")
    .doc(verifiedToken.uid)
    .update({
      [machineKey]: FieldValue.delete(),
    });
};

export const addMachineFavourite = async (
  machineKey: string,
  authToken: string
) => {
  const verifiedToken = await auth.verifyIdToken(authToken);

  if (!verifiedToken) {
    return {
      error: true,
      message: "Unauthorized",
    };
  }

  await firestore
    .collection("machineFavourites")
    .doc(verifiedToken.uid)
    .set(
      {
        [machineKey]: true,
      },
      {
        merge: true,
      }
    );
};
