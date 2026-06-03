import axios from 'axios';
import { auth } from '@/firebase/firebase';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to automatically attach the Firebase ID token
apiClient.interceptors.request.use(
  async (config) => {
    // Check if there is a currently logged in user
    const user = auth.currentUser;
    
    if (user) {
      try {
        // Fetch the Firebase Auth token
        const token = await user.getIdToken();
        // Attach the token to the Authorization header
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Error fetching Firebase token:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
