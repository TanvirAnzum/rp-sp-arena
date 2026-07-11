import { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { getUserDoc } from "../firebase/firestoreHelpers";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [role, setRole]               = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading]         = useState(true);
  const [disabledMsg, setDisabledMsg] = useState("");

  // Cache user doc fetched during login() so onAuthStateChanged doesn't re-read it
  const pendingUserDoc = useRef(null);

  useEffect(() => {
    let userDocUnsub = null;

    const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (userDocUnsub) { userDocUnsub(); userDocUnsub = null; }

      if (firebaseUser) {
        // Reuse doc fetched by login() if available — avoids a double read
        let data = pendingUserDoc.current;
        pendingUserDoc.current = null;

        if (!data) {
          data = await getUserDoc(firebaseUser.uid);
        }

        if (!data) {
          await signOut(auth);
          setUser(null); setRole(null); setDisplayName("");
          setLoading(false);
          return;
        }

        if (data.disabled) {
          await signOut(auth);
          setUser(null); setRole(null); setDisplayName("");
          setDisabledMsg("Your account has been deactivated. Please contact the owner.");
          setLoading(false);
          return;
        }

        setUser(firebaseUser);
        setRole(data.role ?? null);
        setDisplayName(data.displayName || firebaseUser.displayName || "");
        setLoading(false);

        // Real-time listener: auto-logout if owner disables this account mid-session
        userDocUnsub = onSnapshot(doc(db, "users", firebaseUser.uid), (snap) => {
          if (!snap.exists() || snap.data().disabled) {
            signOut(auth);
            setUser(null); setRole(null); setDisplayName("");
            setDisabledMsg("Your account has been deactivated. Please contact the owner.");
          }
        });
      } else {
        setUser(null);
        setRole(null);
        setDisplayName("");
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      if (userDocUnsub) userDocUnsub();
    };
  }, []);

  async function login(email, password) {
    setDisabledMsg("");
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const data = await getUserDoc(cred.user.uid);

    if (!data) {
      await signOut(auth);
      throw new Error("No account found. Contact the arena owner.");
    }
    if (data.disabled) {
      await signOut(auth);
      throw new Error("Your account has been deactivated. Please contact the owner.");
    }

    // Cache so onAuthStateChanged (which fires next) skips its own getUserDoc call
    pendingUserDoc.current = data;

    setRole(data.role ?? null);
    setDisplayName(data.displayName || "");
    return data.role ?? null;
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
    setRole(null);
    setDisplayName("");
  }

  const value = {
    user, role, displayName, loading,
    login, logout,
    isOwner: role === "owner",
    disabledMsg,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
