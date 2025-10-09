import { Firestore, getFirestore } from "firebase-admin/firestore";
import { getApps, ServiceAccount } from "firebase-admin/app";
import admin from "firebase-admin";
import { Auth, getAuth } from "firebase-admin/auth";

// Helper function to properly format the private key
function getPrivateKey(): string {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error('FIREBASE_PRIVATE_KEY environment variable is not set');
  }

  // Ensure it's a string and handle both escaped and actual newlines
  const keyString = String(privateKey);

  // If the key contains escaped newlines, replace them with actual newlines
  if (keyString.includes('\\n')) {
    return keyString.replace(/\\n/g, '\n');
  }

  // Otherwise, return as-is (it already has actual newlines)
  return keyString;
}

function getServiceAccount(): ServiceAccount {
  return {
    type: "service_account",
    project_id: "sccc-inseesafety-prod",
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: getPrivateKey(),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url:
      "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40sccc-inseesafety-prod.iam.gserviceaccount.com",
    universe_domain: "googleapis.com",
  } as ServiceAccount;
}

let firestore: Firestore;
let auth: Auth;

// Initialize Firebase Admin
const currentApps = getApps();

if (!currentApps.length) {
  const serviceAccount = getServiceAccount();

  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  firestore = getFirestore(app);
  auth = getAuth(app);
} else {
  const app = currentApps[0];
  firestore = getFirestore(app);
  auth = getAuth(app);
}

export { firestore, auth };

export const getTotalPages = async (
  firestoreQuery: FirebaseFirestore.Query<
    FirebaseFirestore.DocumentData,
    FirebaseFirestore.DocumentData
  >,
  pageSize: number
) => {
  const queryCount = firestoreQuery.count();
  const countSnapshot = await queryCount.get();
  const countData = countSnapshot.data();
  const total = countData.count;
  const totalPages = Math.ceil(total / pageSize);
  return totalPages;
};
