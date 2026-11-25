import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
export function adminServices() {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId || (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL && !process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
        const error = new Error('Falta configurar el acceso administrativo a Firebase.'); error.status = 503; throw error;
    }
    let app = getApps().find(item => item.name === 'sinte-admin');
    if (!app) {
        const credential = process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? cert({ projectId, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n') }) : applicationDefault();
        app = initializeApp({ projectId, credential }, 'sinte-admin');
    }
    return { db: getFirestore(app), auth: getAuth(app), projectId };
}
