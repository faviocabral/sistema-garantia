
importScripts('https://www.gstatic.com/firebasejs/8.2.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.2.2/firebase-messaging.js');

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = 
firebase.initializeApp(
{
    apiKey: "AIzaSyDik6wuvRzmmfWpGDVdt8WWpH4jAkshKiE",
    authDomain: "garden-garantia.firebaseapp.com",
    projectId: "garden-garantia",
    storageBucket: "garden-garantia.appspot.com",
    messagingSenderId: "113392643608",
    appId: "1:113392643608:web:847a1b19f9a865223e9d6d",
    measurementId: "G-GFZHYP83B3"
  });

  const messaging = firebase.messaging();

  
  messaging.setBackgroundMessageHandler(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = 'Background Message Title';
    const notificationOptions = {
      body: 'Background Message body.',
      icon: '/itwonders-web-logo.png'
    };
  
    return self.registration.showNotification(notificationTitle,
        notificationOptions);
  });
  