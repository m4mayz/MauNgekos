import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// TODO: Replace with your Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: 'AIzaSyDU41udhvXgLUkWQkVwjLD3ZkLPlPHkNiI',
  authDomain: 'mobile-programming-d7040.firebaseapp.com',
  projectId: 'mobile-programming-d7040',
  storageBucket: 'mobile-programming-d7040.firebasestorage.app',
  messagingSenderId: '730510956878',
  appId: '1:730510956878:web:81c44e006f29a46205661f',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };
