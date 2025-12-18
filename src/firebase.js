import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDMjwtk-54ZGFkqut-9HPPbkrLW5-wNbfE",
  authDomain: "meal-planner-c7b70.firebaseapp.com",
  projectId: "meal-planner-c7b70",
  storageBucket: "meal-planner-c7b70.firebasestorage.app",
  messagingSenderId: "139370951304",
  appId: "1:139370951304:web:eb26879fb784dc78f0a53d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
