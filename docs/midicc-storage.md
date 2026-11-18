# MIDI configuration storage

Automatic edits are still saved in this browser under `tda-midi-cc-config-v1`. That path is unchanged: every edit writes it, and reloading the page restores it.

**Upload to cloud** stores a separate snapshot under the key `tda-midi-cc-config`. Later edits stay in the automatic local save until the next upload. **Load from cloud** reads that snapshot back into the form, then copies it into the automatic local save so a reload keeps it. A failed upload or load leaves the form and the automatic local save as they were. A missing snapshot does not clear the form.

The upload status line reports pending, success, and failure on its own.

## Socket

`JsonStorageSocket` is the port. It is not a network WebSocket. `write(key, value)` JSON-encodes the value and `read(key)` parses it back to a value, or `null` when nothing is stored. `JsonStorageAdapter` is the destination:

- `write(key, json)` resolves only after the destination confirms persistence, and rejects on failure.
- `read(key)` resolves with the stored JSON string, `null` when nothing is stored, and rejects on failure.

`LocalStorageAdapter` implements the same contract for this browser. The books page still uses it for its own demo upload.

## Firebase

When every required `VITE_FIREBASE_*` variable is present, the MIDI CC page signs in with Firebase Authentication (Google) and reads and writes Cloud Firestore. The document path is `users/{uid}/configs/{key}` and the fields are `json` and `updatedAt`. `json` is the snapshot string. Reads use a server fetch. Writes resolve when Firestore acknowledges them, and time out if it does not.

The web config is public by design. It is not a secret, and it is supplied at build time with Vite env vars so the repository does not contain a filled-in config. Access control is `firestore.rules`: only the signed-in user can read or write their own `users/{uid}/configs` documents, the document may only contain those two fields, and `allowedEmail()` / `allowedUid()` can pin that user. The sample email in the rules matches nobody.

When the variables are missing, or Firebase fails to start, sign-in stays hidden. Upload and load keep working through `LocalStorageAdapter`, and the status line says the copy is only in this browser. Local development and CI use that path. There is no private key in the bundle either way.

Set the variables before `npm run build` as well as before `npm run dev`. Vite inlines `VITE_*` values at build time, so a production build made without them stays on the local fallback.

## Firebase setup

Use the Firebase console on the existing Google Cloud account.

1. Open the [Firebase console](https://console.firebase.google.com/) and add a project. Choose the existing Google Cloud project if it is listed.
2. Add a **Web** app. Copy its config into `.env` in the repository root, using the names in `.env.example`. Do not commit `.env`.
3. **Authentication → Sign-in method**: enable **Google**.
4. If Google later says the app is unverified or blocked, open Google Cloud Console → **APIs & Services → OAuth consent screen**, set an app name and support email, and add the owner as a test user while the app is in testing.
5. **Authentication → Settings → Authorised domains**: add every host that serves the site. `localhost` is already there. Add `127.0.0.1` if you use it, and add the production domain before signing in from it.
6. **Firestore Database**: create a database in Native mode and pick a region close to where the rig is used.
7. Edit `allowedEmail()` in `firestore.rules`. Set it to the owner's lowercase Google email. An empty string allows every signed-in user to use only their own `users/{uid}` path, which lets other Google accounts create documents in this project. The committed sample address matches nobody, so deploying it unchanged denies every account. Set `allowedUid()` too if you want that extra pin; leave it `""` to skip it.
8. Deploy the rules. From this repository, run `npx firebase-tools login`, then `npx firebase-tools use YOUR_PROJECT_ID`, then `npx firebase-tools deploy --only firestore:rules`. `firebase.json` points at `firestore.rules`. You can paste the file into the Firestore **Rules** tab instead. `.firebaserc` is local and is gitignored.
9. Put the same lowercase email in `VITE_FIREBASE_ALLOWED_EMAIL` when the rules check an email, and the same uid in `VITE_FIREBASE_ALLOWED_UID` when the rules check a uid. The page uses those to fail before the request. The rules are what actually enforce them. Empty values skip the client check.
10. Restart `npm run dev`. The page should show **Sign in with Google**. Sign in, upload, then open the page on another browser, sign in with the same account, and **Load from cloud**.

Required variables: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.
