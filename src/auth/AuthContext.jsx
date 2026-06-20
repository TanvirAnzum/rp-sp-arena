import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { getUserRole } from "../firebase/firestoreHelpers";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);   // Firebase user object
  const [role, setRole] = useState(null);   // "owner" | "staff" | null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const r = await getUserRole(firebaseUser.uid);
        setUser(firebaseUser);
        setRole(r);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const r = await getUserRole(cred.user.uid);
    setRole(r);
    return r;
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
    setRole(null);
  }

  const value = { user, role, loading, login, logout, isOwner: role === "owner" };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
