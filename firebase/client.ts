// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { FirebaseStorage, getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCbLOLR4KqlWaGOfvZesdVVgFzlyDluPkI",
  authDomain: "sccc-inseesafety-prod.firebaseapp.com",
  projectId: "sccc-inseesafety-prod",
  storageBucket: "sccc-inseesafety-prod.firebasestorage.app",
  messagingSenderId: "874085997493",
  appId: "1:874085997493:web:5156272fd22b224b5097fc",
  measurementId: "G-KZT8MZC6MB",
};

// Initialize Firebase
const currentApps = getApps();
let auth: Auth;
let storage: FirebaseStorage;

if (!currentApps.length) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  storage = getStorage(app);
} else {
  const app = currentApps[0];
  auth = getAuth(app);
  storage = getStorage(app);
}

export { auth, storage };
