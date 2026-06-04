import axios from "axios";
import { auth } from "@/firebase/firebase";
import { signOut } from "firebase/auth";

// Create an Axios instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to attach the custom JWT from localStorage
apiClient.interceptors.request.use(
  (config) => {
    // Check if we are running in the browser
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 Unauthorized errors globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (typeof window !== "undefined") {
        console.error("Token expired or unauthorized. Logging out...");
        localStorage.removeItem("accessToken");
        try {
          await signOut(auth);
        } catch (err) {
          console.error("Firebase signout error:", err);
        }
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
