import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBuht58TZusVJm4do47LSooBWBGSZErsS8",
  authDomain: "asialog-2aa38.firebaseapp.com",
  projectId: "asialog-2aa38",
  storageBucket: "asialog-2aa38.firebasestorage.app",
  messagingSenderId: "472239170057",
  appId: "1:472239170057:web:c5267f425f2ab661520ed8",
  measurementId: "G-VZWR0QP89W"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);

// For phone auth
export const setupRecaptcha = (containerId: string) => {
  if (!(window as any).recaptchaVerifier) {
    (window as any).recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, containerId, {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA solved');
      },
    });
  }
  return (window as any).recaptchaVerifier;
};
