import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// TODO: 請將下方的設定替換成您 Firebase Console 中的設定
// 您可以在 Firebase Console -> Project Settings -> General -> Your apps 找到這些資訊
const firebaseConfig = {
  apiKey: "AIzaSyB5gaTwJiVcp5SaHNW7VFeIAVAbkrW8Tgs",
  authDomain: "burn-battle.firebaseapp.com",
  databaseURL: "https://burn-battle-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "burn-battle",
  storageBucket: "burn-battle.firebasestorage.app",
  messagingSenderId: "59289503078",
  appId: "1:59289503078:web:9b279083f70065366b74a7",
  measurementId: "G-QW8KZZSQ19"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 導出 Realtime Database 實例
export const db = getDatabase(app);