import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore/lite";

const firebaseConfig = {
  apiKey: "AIzaSyBjDgJ9r9vw9h8G0UFJqt4feYQcMXbMw2o",
  authDomain: "e-2-7d86b.firebaseapp.com",
  projectId: "e-2-7d86b",
  storageBucket: "e-2-7d86b.appspot.com",
  messagingSenderId: "129506609511",
  appId: "1:129506609511:web:20c3d5467ace47c91087c2",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
export default db;
