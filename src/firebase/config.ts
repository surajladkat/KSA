/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration — fill in your project values from Firebase Console
// or set these as environment variables prefixed with VITE_
const firebaseConfig = {
  apiKey: "AIzaSyDW92zPqJZIdWwUwJpzf0VJTKPrd2JIk3c",
  authDomain: "shree-samarth-class1.firebaseapp.com",
  projectId: "shree-samarth-class1",
  storageBucket: "shree-samarth-class1.firebasestorage.app",
  messagingSenderId: "1021377617282",
  appId: "1:1021377617282:web:4379f6198d5439538ec39b",
  measurementId: "G-8C448H1B9Y"
};

const app = initializeApp(firebaseConfig);

export const db   = getFirestore(app);
export const auth = getAuth(app);
export default app;
