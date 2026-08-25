import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAjSjzZ2_16aRc4IQoSlFM-ctzSDccgz2NvU",
  authDomain: "brand-marvel.firebaseapp.com",
  databaseURL: "https://brand-marvel-default-rtdb.firebaseio.com",
  projectId: "brand-marvel",
  storageBucket: "brand-marvel.firebasestorage.app",
  messagingSenderId: "573130978355",
  appId: "1:573130978355:web:79c6d8856dfcddbb4a746"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);
