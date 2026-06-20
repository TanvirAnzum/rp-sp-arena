import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBKq4syB3mfZ1Tk5xNeB21SLc52W1Fpov4",
  authDomain: "rp-sp-arena.firebaseapp.com",
  projectId: "rp-sp-arena",
  storageBucket: "rp-sp-arena.firebasestorage.app",
  messagingSenderId: "488127041713",
  appId: "1:488127041713:web:52b7b79def20fde9631290",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
