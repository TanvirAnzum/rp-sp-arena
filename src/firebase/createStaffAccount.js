import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebaseConfig";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Creates a new staff Firebase Auth account WITHOUT disturbing the
 * owner's current session. Uses a secondary app instance.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} displayName  - stored in both Auth and Firestore
 * @returns {Promise<{uid: string, email: string}>}
 */
export async function createStaffAccount(email, password, displayName = "") {
  const secondaryApp =
    getApps().find((a) => a.name === "secondary") ??
    initializeApp(firebaseConfig, "secondary");

  const secondaryAuth = getAuth(secondaryApp);

  const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
  const { uid } = cred.user;

  // Set displayName on Auth user so user.displayName works on receipts
  if (displayName.trim()) {
    await updateProfile(cred.user, { displayName: displayName.trim() });
  }

  // Save role + displayName to Firestore
  await setDoc(doc(db, "users", uid), {
    email,
    displayName: displayName.trim() || "",
    role: "staff",
    createdAt: serverTimestamp(),
  });

  // Sign out of secondary app — primary owner session untouched
  await signOut(secondaryAuth);

  return { uid, email };
}
