export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  allowedEmail: string | null;
  allowedUid: string | null;
}

export interface CloudAccount {
  uid: string;
  email: string | null;
}

export class CloudAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CloudAccessError";
  }
}

export function readFirebaseWebConfig(env: object): FirebaseWebConfig | null {
  const apiKey = readEnvString(env, "VITE_FIREBASE_API_KEY");
  const authDomain = readEnvString(env, "VITE_FIREBASE_AUTH_DOMAIN");
  const projectId = readEnvString(env, "VITE_FIREBASE_PROJECT_ID");
  const storageBucket = readEnvString(env, "VITE_FIREBASE_STORAGE_BUCKET");
  const messagingSenderId = readEnvString(env, "VITE_FIREBASE_MESSAGING_SENDER_ID");
  const appId = readEnvString(env, "VITE_FIREBASE_APP_ID");
  if (
    apiKey === null ||
    authDomain === null ||
    projectId === null ||
    storageBucket === null ||
    messagingSenderId === null ||
    appId === null
  ) {
    return null;
  }
  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    allowedEmail: readEnvString(env, "VITE_FIREBASE_ALLOWED_EMAIL"),
    allowedUid: readEnvString(env, "VITE_FIREBASE_ALLOWED_UID"),
  };
}

export function cloudAccountAllowed(
  account: CloudAccount,
  policy: Pick<FirebaseWebConfig, "allowedEmail" | "allowedUid">,
): boolean {
  if (policy.allowedUid !== null && account.uid !== policy.allowedUid) {
    return false;
  }
  if (policy.allowedEmail === null) {
    return true;
  }
  const email = account.email?.trim().toLowerCase() ?? "";
  return email !== "" && email === policy.allowedEmail.trim().toLowerCase();
}

export function cloudFailureMessage(error: unknown, fallback: string): string {
  if (error instanceof CloudAccessError) {
    return error.message;
  }
  const code = errorCode(error);
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
    return "Sign-in was cancelled.";
  }
  if (code === "auth/popup-blocked") {
    return "The browser blocked Google sign-in. Allow popups and try again.";
  }
  if (code === "auth/unauthorized-domain") {
    return "This domain is not authorised for Google sign-in.";
  }
  if (code === "permission-denied") {
    return "Cloud storage denied this account. Check that Firestore rules allow it.";
  }
  return fallback;
}

export function errorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return null;
  }
  const code = error.code;
  return typeof code === "string" ? code : null;
}

function readEnvString(env: object, key: string): string | null {
  for (const [entryKey, entryValue] of Object.entries(env)) {
    if (entryKey === key && typeof entryValue === "string") {
      const trimmed = entryValue.trim();
      return trimmed === "" ? null : trimmed;
    }
  }
  return null;
}
