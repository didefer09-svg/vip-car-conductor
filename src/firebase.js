import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

/**
 * VIP CAR Conductor - Configuración e Inicialización de Firebase
 * Provee instancia de Cloud Firestore para sincronización
 * de telemetría, odómetros de conductores y bitácora en tiempo real.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSy_demo_api_key_vipcar",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "vip-car-b2b.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "vip-car-b2b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "vip-car-b2b.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456",
};

// Indicador de configuración válida cargada desde el entorno (.env)
export const isConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_API_KEY !== "AIzaSy_demo_api_key_vipcar"
);

// Inicializar la aplicación de Firebase de forma singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Inicializar Cloud Firestore
export const db = getFirestore(app);

export default app;
