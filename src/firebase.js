import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";

// Ganti dengan config dari Firebase Console Anda
const firebaseConfig = {
  apiKey: "AIzaSyAIxe55-HP7yjTDwoCbGKdyga-yZA0mJeI",
  authDomain: "syn-erp.firebaseapp.com",
  projectId: "syn-erp",
  storageBucket: "syn-erp.firebasestorage.app",
  messagingSenderId: "1038403525510",
  appId: "1:1038403525510:web:375b8d19c46cb46e2d6a07",
  measurementId: "G-26BNMNR9E5"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
const analytics = getAnalytics(app);

export const requestForToken = async () => {
  try {
    const currentToken = await getToken(messaging, { 
      // Masukkan VAPID Key yang Anda generate di Langkah 2
      vapidKey: 'BDeg3Rsaeg3mRnNJ_EI3qhaso9zPXj_NWc2nHCTcHnB1Vj8U-YnzO6sIxYF69bz2Y6IQ14sUs52T4xn6wxLRdpg' 
    });
    if (currentToken) {
      console.log('FCM Token ditemukan:', currentToken);
      return currentToken;
      // Nanti token ini akan kita simpan ke database Supabase
    } else {
      console.log('Tidak ada token pendaftaran. Mintalah izin untuk membuat token.');
      return null;
    }
  } catch (err) {
    console.error('Terjadi kesalahan saat mengambil token. ', err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export { messaging };