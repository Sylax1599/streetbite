import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAtcUxsJ7dD-bHHnA513IpQHeux8E5yW2A",
  authDomain: "streetbite-dev.firebaseapp.com",
  projectId: "streetbite-dev",
  storageBucket: "streetbite-dev.firebasestorage.app",
  messagingSenderId: "409635283347",
  appId: "1:409635283347:web:dfa4b053b75303c5968866"
};


const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// initializeAuth con persistencia en AsyncStorage
// así la sesión se mantiene aunque cierres la app
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);