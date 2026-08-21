import React, { useState, useEffect } from 'react';
import { AuthContext } from './authContextDef';
import { auth, db, isFirebaseConfigured } from '../services/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export { AuthContext };

// Helper to format Firebase error codes into human-readable messages
function getFriendlyAuthErrorMessage(error) {
  if (!error) return 'An unexpected error occurred. Please try again.';
  const code = error.code || '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please verify your credentials.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please log in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Access is temporarily disabled. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    default:
      return error.message || 'Authentication failed. Please try again.';
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Synchronize Firebase persistent authentication state
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          if (firebaseUser) {
            try {
              let profileData = {};
              if (db) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                
                if (userDocSnap.exists()) {
                  profileData = userDocSnap.data();
                } else {
                  // First time profile creation if not already stored
                  profileData = {
                    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                    email: firebaseUser.email,
                    createdAt: firebaseUser.metadata?.creationTime || new Date().toISOString()
                  };
                  await setDoc(userDocRef, profileData, { merge: true });
                }
              }

              setUser({
                id: firebaseUser.uid,
                uid: firebaseUser.uid,
                name: profileData.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                email: firebaseUser.email,
                created_at: profileData.createdAt || firebaseUser.metadata?.creationTime || new Date().toISOString()
              });
            } catch (err) {
              console.error('Error fetching user profile from Firestore:', err);
              // Fallback to basic Firebase user info
              setUser({
                id: firebaseUser.uid,
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                email: firebaseUser.email,
                created_at: firebaseUser.metadata?.creationTime || new Date().toISOString()
              });
            }
          } else {
            setUser(null);
          }
          setLoading(false);
        },
        (authErr) => {
          console.error('Firebase onAuthStateChanged error:', authErr);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Failed to attach Firebase auth state listener:', err);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setError(null);
    if (!isFirebaseConfigured || !auth) {
      const msg = 'Firebase is not configured. Please set your Firebase environment variables.';
      setError(msg);
      throw new Error(msg);
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = userCredential.user;

      let profileData = {};
      if (db) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          profileData = userDocSnap.exists() ? userDocSnap.data() : {};
        } catch (dbErr) {
          console.warn('Could not read user profile from Firestore:', dbErr);
        }
      }

      const userObj = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        name: profileData.name || firebaseUser.displayName || firebaseUser.email.split('@')[0],
        email: firebaseUser.email,
        created_at: profileData.createdAt || firebaseUser.metadata?.creationTime || new Date().toISOString()
      };

      setUser(userObj);
      return userObj;
    } catch (err) {
      const friendlyMessage = getFriendlyAuthErrorMessage(err);
      setError(friendlyMessage);
      const customError = new Error(friendlyMessage);
      customError.code = err.code;
      throw customError;
    }
  };

  // Register handler
  const register = async (name, email, password) => {
    setError(null);
    if (!isFirebaseConfigured || !auth) {
      const msg = 'Firebase is not configured. Please set your Firebase environment variables.';
      setError(msg);
      throw new Error(msg);
    }
    try {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim().toLowerCase();

      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      const firebaseUser = userCredential.user;

      // Update Auth display name
      try {
        await updateProfile(firebaseUser, { displayName: trimmedName });
      } catch (profileErr) {
        console.warn('Could not update Auth displayName:', profileErr);
      }

      // Store user profile in Cloud Firestore under users/{uid}
      const createdAt = new Date().toISOString();
      const userDocData = {
        name: trimmedName,
        email: trimmedEmail,
        createdAt
      };

      if (db) {
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), userDocData);
        } catch (dbErr) {
          console.warn('Could not write user profile to Firestore:', dbErr);
        }
      }

      const userObj = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        name: trimmedName,
        email: trimmedEmail,
        created_at: createdAt
      };

      setUser(userObj);
      return userObj;
    } catch (err) {
      const friendlyMessage = getFriendlyAuthErrorMessage(err);
      setError(friendlyMessage);
      const customError = new Error(friendlyMessage);
      customError.code = err.code;
      throw customError;
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Password reset handler
  const forgotPassword = async (email) => {
    setError(null);
    if (!isFirebaseConfigured || !auth) {
      const msg = 'Firebase is not configured. Please set your Firebase environment variables.';
      setError(msg);
      throw new Error(msg);
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { message: 'Password reset link sent to your email. Please check your inbox.' };
    } catch (err) {
      const friendlyMessage = getFriendlyAuthErrorMessage(err);
      setError(friendlyMessage);
      const customError = new Error(friendlyMessage);
      customError.code = err.code;
      throw customError;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        setError,
        login,
        register,
        logout,
        forgotPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
