import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "smectmanutencao-16c2e.firebaseapp.com",
  projectId: "smectmanutencao-16c2e",
  storageBucket: "smectmanutencao-16c2e.firebasestorage.app",
  messagingSenderId: "252078232955",
  appId: "1:252078232955:web:117bfeaa588130c04259de",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
