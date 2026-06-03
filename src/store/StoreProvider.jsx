"use client";

import { Provider } from "react-redux";
import { store } from "./index";
import { useEffect } from "react";
import axios from "axios";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import { setUser, clearUser } from "./authSlice";

// A wrapper to handle the auth listener inside the Provider
function AuthListener({ children }) {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch custom JWT token from backend
        try {
          // Fallback just in case env variable is missing a trailing slash
          let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000/";
          if (!backendUrl.endsWith("/")) backendUrl += "/";
          
          const res = await axios.post(`${backendUrl}get-token`, {
            email: user.email,
            uid: user.uid,
            name: user.displayName,
            photoUrl: user.photoURL || user.photoUrl,
          });
          
          if (res.data?.token) {
            localStorage.setItem("accessToken", res.data.token);
          }
        } catch (error) {
          console.error("Failed to fetch custom JWT from backend:", error);
        }

        // Serialize user object to avoid non-serializable value errors in Redux
        store.dispatch(setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoUrl: user.photoURL || user.photoUrl,
        }));
      } else {
        localStorage.removeItem("accessToken");
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
