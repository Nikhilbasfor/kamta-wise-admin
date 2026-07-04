"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, addDoc } from "firebase/firestore";

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  orders: any[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  profile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, phone?: string, address?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfileDetails: (name: string, phone: string, address: string) => Promise<void>;
  addOrder: (order: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        try {
          setUser(currentUser);
          if (currentUser) {
            // Load custom user profile from localStorage namespace
            const savedProfile = localStorage.getItem(`kamta_wise_profile_${currentUser.uid}`);
            if (savedProfile) {
              try {
                setProfile(JSON.parse(savedProfile));
              } catch (e) {
                console.error("Error loading saved user profile", e);
              }
            } else {
              // Try Firestore first
              const docRef = doc(db, "users", currentUser.uid);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                const data = docSnap.data() as UserProfile;
                localStorage.setItem(`kamta_wise_profile_${currentUser.uid}`, JSON.stringify(data));
                setProfile(data);
              } else {
                // Create fresh profile
                const defaultProfile: UserProfile = {
                  name: currentUser.displayName || "",
                  email: currentUser.email || "",
                  phone: "",
                  address: "",
                  orders: [],
                };
                await setDoc(docRef, defaultProfile);
                localStorage.setItem(`kamta_wise_profile_${currentUser.uid}`, JSON.stringify(defaultProfile));
                setProfile(defaultProfile);
              }
            }
          } else {
            setProfile(null);
          }
        } catch (e) {
          console.error("Error in onAuthStateChanged observer callback:", e);
        } finally {
          setLoading(false);
        }
      });
      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up onAuthStateChanged observer:", err);
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    setIsAuthModalOpen(false);
  };

  const signUp = async (name: string, email: string, password: string, phone = "", address = "") => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: name,
      });
      // Force reload to apply displayName updates immediately
      await userCredential.user.reload();
      const freshUser = auth.currentUser;
      setUser(freshUser);

      const newProfile: UserProfile = {
        name,
        email,
        phone,
        address,
        orders: [],
      };
      localStorage.setItem(`kamta_wise_profile_${userCredential.user.uid}`, JSON.stringify(newProfile));
      setProfile(newProfile);
      await setDoc(doc(db, "users", userCredential.user.uid), newProfile);
    }
    setIsAuthModalOpen(false);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const googleUser = result.user;
    if (googleUser) {
      const docRef = doc(db, "users", googleUser.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        const defaultProfile: UserProfile = {
          name: googleUser.displayName || "",
          email: googleUser.email || "",
          phone: "",
          address: "",
          orders: [],
        };
        await setDoc(docRef, defaultProfile);
        localStorage.setItem(`kamta_wise_profile_${googleUser.uid}`, JSON.stringify(defaultProfile));
        setProfile(defaultProfile);
      } else {
        const data = docSnap.data() as UserProfile;
        localStorage.setItem(`kamta_wise_profile_${googleUser.uid}`, JSON.stringify(data));
        setProfile(data);
      }
    }
    setIsAuthModalOpen(false);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateProfileDetails = async (name: string, phone: string, address: string) => {
    if (!user) return;
    await updateProfile(user, {
      displayName: name,
    });
    await user.reload();
    setUser(auth.currentUser);

    const updated = {
      name,
      email: profile?.email || user.email || "",
      phone,
      address,
      orders: profile?.orders || [],
    };
    localStorage.setItem(`kamta_wise_profile_${user.uid}`, JSON.stringify(updated));
    setProfile(updated);
    await setDoc(doc(db, "users", user.uid), updated, { merge: true });
  };

  const addOrder = async (order: any) => {
    if (!user) return;
    const updatedOrders = profile ? [order, ...profile.orders] : [order];
    const updated = {
      name: profile?.name || user.displayName || "",
      email: profile?.email || user.email || "",
      phone: profile?.phone || "",
      address: profile?.address || "",
      orders: updatedOrders
    };
    localStorage.setItem(`kamta_wise_profile_${user.uid}`, JSON.stringify(updated));
    setProfile(updated);

    // Write updated profile with orders array to Firestore
    await setDoc(doc(db, "users", user.uid), updated, { merge: true });

    // Write individual order to orders subcollection
    await addDoc(collection(db, "users", user.uid, "orders"), order);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthModalOpen,
        setIsAuthModalOpen,
        profile,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
        updateProfileDetails,
        addOrder,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
