"use client";

import { Provider } from "react-redux";
import { store } from "./index";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import { setUser, clearUser } from "./authSlice";

// A wrapper to handle the auth listener inside the Provider
function AuthListener({ children }) {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Serialize user object to avoid non-serializable value errors in Redux
        store.dispatch(setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoUrl: user.photoURL || user.photoUrl,
        }));
      } else {
        store.dispatch(clearUser());
      }
    });

    return () => unsubscribe();
  }, []);

  return <>{children}</>;
}

export default function StoreProvider({ children }) {
  return (
    <Provider store={store}>
      <AuthListener>{children}</AuthListener>
    </Provider>
  );
}
