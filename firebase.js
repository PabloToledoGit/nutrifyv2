import admin from 'firebase-admin';
import serviceAccount from './nutrify-v2-firebase-adminsdk-fbsvc-fff741cf3e.json'; 

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const db = admin.firestore();
