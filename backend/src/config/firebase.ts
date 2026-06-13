import * as admin from 'firebase-admin';

import type { Auth } from 'firebase-admin/auth';
import type { Messaging } from 'firebase-admin/messaging';
import type { Storage } from 'firebase-admin/storage';
import type { Firestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.GOOGLE_CLOUD_PROJECT || 'streetbite-dev',
  });
}

export const db: Firestore = admin.firestore();
export const auth: Auth = admin.auth();
export const messaging: Messaging = admin.messaging();
export const storage: Storage = admin.storage();

export default admin;