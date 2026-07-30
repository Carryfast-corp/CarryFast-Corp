import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";

export const login = (email, password) => {
  if (!firebaseAuth) throw new Error("Firebase is not configured.");
  return signInWithEmailAndPassword(firebaseAuth, email, password);
};

export const logout = async () => {
  if (!firebaseAuth) return;
  try {
    await firebaseSignOut(firebaseAuth);
  } catch (e) {
    // ignore
  }
};

export const onAuthChange = (cb) => {
  if (!firebaseAuth) return () => {};
  return onAuthStateChanged(firebaseAuth, cb);
};

export default { login, logout, onAuthChange };
