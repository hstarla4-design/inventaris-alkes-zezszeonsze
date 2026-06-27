import admin from "firebase-admin";
import { env } from "../../config/index.js";

export function getFirebaseAdmin() {
  if (admin.apps.length) return admin.app();
  if (!env.firebase.projectId || !env.firebase.clientEmail || !env.firebase.privateKey) {
    return null;
  }
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.firebase.projectId,
      clientEmail: env.firebase.clientEmail,
      privateKey: env.firebase.privateKey,
    }),
  });
}
