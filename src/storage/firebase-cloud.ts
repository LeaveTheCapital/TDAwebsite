import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type Auth,
  type User,
} from "firebase/auth";
import {
  doc,
  DocumentReference,
  Firestore,
  getDocFromServer,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  setDoc,
} from "firebase/firestore";

import {
  CloudAccessError,
  cloudAccountAllowed,
  errorCode,
  type CloudAccount,
  type FirebaseWebConfig,
} from "./firebase-web-config";
import {
  createFirestoreDocumentClient,
  FirestoreAdapter,
  type CloudSnapshot,
  type FirestoreSdk,
} from "./firestore-adapter";

const cloudAccessMessage = "This Google account cannot access the cloud copy.";

export class FirebaseCloud {
  private readonly config: FirebaseWebConfig;
  private readonly auth: Auth;
  private readonly firestore: Firestore;
  private readonly sdk: FirestoreSdk;

  constructor(config: FirebaseWebConfig) {
    this.config = config;
    const app = firebaseApp(config);
    this.auth = getAuth(app);
    this.firestore = firestoreFor(app);
    this.sdk = modularSdk();
  }

  onAccount(listener: (account: CloudAccount | null, rejection: string | null) => void): void {
    onAuthStateChanged(this.auth, (user) => {
      if (user === null) {
        listener(null, null);
        return;
      }
      const account = toAccount(user);
      if (!cloudAccountAllowed(account, this.config)) {
        void firebaseSignOut(this.auth);
        listener(null, cloudAccessMessage);
        return;
      }
      listener(account, null);
    });
  }

  async signIn(): Promise<CloudAccount> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(this.auth, provider);
    const account = toAccount(result.user);
    if (!cloudAccountAllowed(account, this.config)) {
      await firebaseSignOut(this.auth);
      throw new CloudAccessError(cloudAccessMessage);
    }
    return account;
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(this.auth);
  }

  adapterFor(account: CloudAccount): FirestoreAdapter {
    if (!cloudAccountAllowed(account, this.config)) {
      throw new CloudAccessError(cloudAccessMessage);
    }
    return new FirestoreAdapter(
      createFirestoreDocumentClient(this.firestore, this.sdk),
      account.uid,
    );
  }
}

export function connectFirebase(config: FirebaseWebConfig): FirebaseCloud {
  return new FirebaseCloud(config);
}

function firebaseApp(config: FirebaseWebConfig): FirebaseApp {
  for (const existing of getApps()) {
    return existing;
  }
  return initializeApp({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
  });
}

function firestoreFor(app: FirebaseApp): Firestore {
  try {
    return initializeFirestore(app, { localCache: memoryLocalCache() });
  } catch (error: unknown) {
    if (errorCode(error) === "failed-precondition") {
      return getFirestore(app);
    }
    throw error;
  }
}

function modularSdk(): FirestoreSdk {
  return {
    doc(firestore, collection, userId, configs, configId) {
      return doc(requireFirestore(firestore), collection, userId, configs, configId);
    },
    setDoc(reference, data) {
      return setDoc(requireReference(reference), data);
    },
    async getDocFromServer(reference): Promise<CloudSnapshot> {
      const snapshot = await getDocFromServer(requireReference(reference));
      return {
        exists: () => snapshot.exists(),
        data: () => snapshot.data(),
      };
    },
  };
}

function requireFirestore(value: unknown): Firestore {
  if (value instanceof Firestore) {
    return value;
  }
  throw new Error("Missing Firestore.");
}

function requireReference(value: unknown): DocumentReference {
  if (!(value instanceof DocumentReference)) {
    throw new Error("Missing Firestore document.");
  }
  return value as DocumentReference;
}

function toAccount(user: User): CloudAccount {
  return {
    uid: user.uid,
    email: user.email,
  };
}
