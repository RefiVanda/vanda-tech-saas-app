importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Masukkan config yang sama persis dengan yang di src/firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyAIxe55-HP7yjTDwoCbGKdyga-yZA0mJeI",
  authDomain: "syn-erp.firebaseapp.com",
  projectId: "syn-erp",
  storageBucket: "syn-erp.firebasestorage.app",
  messagingSenderId: "1038403525510",
  appId: "1:1038403525510:web:375b8d19c46cb46e2d6a07"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Menangkap notifikasi di background
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Menerima pesan di background ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png' // Pastikan logo ini ada
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});