'use client';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
let services;
export function getClientServices() {
    if (typeof window === 'undefined') throw new Error('Firebase cliente requiere un navegador.');
    if (!services) {
        const app = getApps().length ? getApp() : initializeApp({
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
            measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
        });
        const auth = getAuth(app);
        const persistence = setPersistence(auth, browserLocalPersistence);
        services = { app, auth, db: getFirestore(app), persistence };
    }
    return services;
}
export async function track(event, parameters = {}) {
    if (typeof window === 'undefined' || process.env.NEXT_PUBLIC_FIREBASE_ANALYTICS_ENABLED !== 'true') return;
    try {
        const { isSupported, getAnalytics, logEvent } = await import('firebase/analytics');
        if (await isSupported()) logEvent(getAnalytics(getClientServices().app), event, parameters);
    } catch { /* Una medición nunca debe impedir la búsqueda o el contacto. */ }
}
export function authError(error) {
    return ({ 'auth/invalid-credential': 'El email o la contraseña son incorrectos.', 'auth/user-disabled': 'Esta cuenta está deshabilitada.', 'auth/too-many-requests': 'Hubo demasiados intentos. Probá nuevamente en unos minutos.', 'auth/network-request-failed': 'No pudimos conectar. Revisá tu conexión.', 'auth/invalid-email': 'Ingresá un email válido.', 'auth/operation-not-allowed': 'El acceso por email todavía no está habilitado.', 'auth/invalid-api-key': 'Falta completar la configuración de Firebase.' })[error.code] || 'No pudimos completar la operación. Intentá nuevamente.';
}
