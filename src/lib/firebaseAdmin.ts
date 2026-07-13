import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let cachedAuth: any = null;
let cachedDb: any = null;
let cachedApp: any = null;

function initAdmin() {
  if (cachedApp) return { auth: cachedAuth, db: cachedDb };

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    console.warn("FIREBASE_SERVICE_ACCOUNT_JSON is missing. Using mock admin auth and db.");
    const mockAuth = {
      verifyIdToken: async () => { throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is missing"); },
      createCustomToken: async () => { throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is missing"); }
    };
    const mockDb = {
      collection: () => {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is missing");
      }
    };
    return { auth: mockAuth, db: mockDb };
  }

  try {
    const certObj = JSON.parse(serviceAccountJson);
    const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(certObj) });
    cachedApp = app;
    cachedAuth = getAuth(app);
    cachedDb = getFirestore(app);
    return { auth: cachedAuth, db: cachedDb };
  } catch (error: any) {
    console.warn("Firebase Admin SDK initialization failed:", error.message);
    const mockAuth = {
      verifyIdToken: async () => { throw new Error("Firebase Admin SDK not initialized: " + error.message); },
      createCustomToken: async () => { throw new Error("Firebase Admin SDK not initialized: " + error.message); }
    };
    const mockDb = {
      collection: () => {
        throw new Error("Firebase Admin SDK not initialized: " + error.message);
      }
    };
    return { auth: mockAuth, db: mockDb };
  }
}

export const adminAuth = new Proxy({} as any, {
  get(target, prop) {
    const { auth } = initAdmin();
    const value = (auth as any)[prop];
    if (typeof value === "function") {
      return value.bind(auth);
    }
    return value;
  }
});

export const adminDb = new Proxy({} as any, {
  get(target, prop) {
    const { db } = initAdmin();
    const value = (db as any)[prop];
    if (typeof value === "function") {
      return value.bind(db);
    }
    return value;
  }
});
