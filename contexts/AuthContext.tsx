import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, UserRole } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
        if (userDoc.exists()) {
          const userData = { id: fbUser.uid, ...userDoc.data() } as User;
          setUser(userData);

          // Log user data for debugging
          console.log('[AuthContext] User loaded:', {
            id: userData.id,
            name: userData.name,
            role: userData.role,
            kos_quota: userData.kos_quota,
            savedKos: userData.savedKos?.length || 0,
          });
        } else {
          console.warn('[AuthContext] User document not found for:', fbUser.uid);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Prepare user data based on role
    const userData: any = {
      email,
      name,
      role,
      createdAt: serverTimestamp(),
    };

    // Add role-specific fields
    if (role === 'pencari') {
      userData.savedKos = []; // Initialize empty saved kos array for pencari
    } else if (role === 'penyewa') {
      userData.kos_quota = 1; // Default quota: 1 kos for free tier
    }
    // Admin doesn't need special fields for now

    // Create user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), userData);

    console.log('[AuthContext] User created with data:', userData);
  };

  const signOut = async () => {
    // Clear local cache before signing out
    if (user) {
      const cacheKey = `savedKos_${user.id}`;
      await AsyncStorage.removeItem(cacheKey);
      console.log('[AuthContext] Cleared cache for user:', user.id);
    }

    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
