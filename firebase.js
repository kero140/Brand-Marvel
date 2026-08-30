// BRAND MARVEL — Firebase Web SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAjs2Z_16aRc4IQSlFM-ctzSDcqzg2NvU",
  authDomain: "brand-marvel.firebaseapp.com",
  databaseURL: "https://brand-marvel-default-rtdb.firebaseio.com",
  projectId: "brand-marvel",
  storageBucket: "brand-marvel.firebasestorage.app",
  messagingSenderId: "537130978355",
  appId: "1:537130978355:web:79c6d88856dfcddbb4a746"
};
const required=["apiKey","authDomain","databaseURL","projectId","messagingSenderId","appId"];
export const firebaseReady=required.every(k=>{const v=String(firebaseConfig[k]??"").trim();return v&&!v.startsWith("YOUR_")});
export const app=initializeApp(firebaseConfig);
export const auth=getAuth(app);
export const db=getDatabase(app);
