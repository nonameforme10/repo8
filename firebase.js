import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCeatEqJSVYJlmB4FMOJKZXza6TDdUvKco",
  authDomain: "ipilisation.firebaseapp.com",
  projectId: "ipilisation",
  storageBucket: "ipilisation.firebasestorage.app",
  messagingSenderId: "57979531475",
  appId: "1:57979531475:web:1c2ab6644ae6ae847fe426",
  measurementId: "G-3TD5BNM7Q9"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);