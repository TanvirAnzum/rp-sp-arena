import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

/**
 * Fetch the role of a user from Firestore.
 * @param {string} uid
 * @returns {Promise<"owner"|"staff"|null>}
 */
export async function getUserRole(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data().role ?? null;
}

/**
 * Create or overwrite a user document (used when seeding an owner/staff account).
 */
export async function setUserDoc(uid, data) {
  await setDoc(doc(db, "users", uid), data, { merge: true });
}

/**
 * Generic document updater.
 */
export async function updateDocument(collectionPath, docId, data) {
  await updateDoc(doc(db, collectionPath, docId), data);
}
