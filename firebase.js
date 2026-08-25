// BRAND MARVEL — Firebase Web SDK

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAjs2Z_16aRc4IQoSlFM-ctzSDcqzg2NvU",
  authDomain: "brand-marvel.firebaseapp.com",
  databaseURL: "https://brand-marvel-default-rtdb.firebaseio.com",
  projectId: "brand-marvel",
  storageBucket: "brand-marvel.firebasestorage.app",
  messagingSenderId: "537130978355",
  appId: "1:537130978355:web:79c6d88856dfcddbb4a746"
};

export const firebaseReady = true;

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);
