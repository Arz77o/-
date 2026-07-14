import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "quirky-prism-vxqhd",
  appId: "1:56602605789:web:38b2b26d2d932012aa8334",
  apiKey: "AIzaSyC4gUn-FDjatBQVmlm2Wu98ynsvnJP1Ncs",
  authDomain: "quirky-prism-vxqhd.firebaseapp.com",
  storageBucket: "quirky-prism-vxqhd.firebasestorage.app",
  messagingSenderId: "56602605789"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-bbf8c371-3b6d-48d0-a884-b24cbf421f7b");
export const auth = getAuth(app);
