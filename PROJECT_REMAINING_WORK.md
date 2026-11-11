# Daily Interest Calculator — Remaining Work Plan

Branch: `v1.20-development`
Application ID: `com.dintakurthi.dailyinterest`

## Approved design constraints
- Preserve the existing ledger + calculator + blue pen icon artwork. Do not replace it with a new design.
- Add safe purple padding around the existing artwork so Android launcher masks do not crop it.
- Refresh the splash screen with the purple brand, app name, and Dintakurthi's Finsol attribution.
- Keep Share Statement PDF layout and calculations unchanged.
- Preserve existing local customer and transaction data.

## Work sequence
1. Splash and icon: refresh splash presentation; generate a square padded derivative from the original artwork during CI; generate Android density/adaptive launcher resources.
2. Authentication screens: add Login and Registration after splash, including mobile OTP, email/password, Google sign-in, forgot password, registration details, validation, loading/error states, persistent session, and logout.
3. Firebase Authentication: connect the supplied Firebase Android project configuration; implement email/password, email verification/password reset, phone OTP with reCAPTCHA, and Android-compatible Google sign-in. Do not mark a provider ready until enabled and tested in Firebase Console and on-device.
4. User data isolation and migration: give each account its own Firestore path; preserve local-first operation; migrate existing local records only after the signed-in user explicitly confirms ownership; never silently upload device data to another account.
5. Cloud sync and recovery: implement queued offline writes, reconnect sync, conflict handling, backup/restore, and restrictive Firestore security rules; verify cross-account isolation.
6. Keyboard and regression testing: ensure Android system keyboard language switching (spacebar long-press) remains available in text fields; preserve numeric keyboards for amount/rate fields; test ledger calculations, annual compounding, customer CRUD, Telugu/English, CSV, backup/restore, Store Profile, About version display, Open Statement preview, and unchanged Share Statement PDF/print.
7. Release: increment versionCode, build debug and signed release APK with the existing keystore, verify signing, install/update test without uninstalling, and confirm existing local data survives.

## Firebase Console prerequisites
- Enable Email/Password, Phone, and Google providers in Firebase Authentication.
- Configure authorized domains and Android SHA-1/SHA-256 fingerprints for Google sign-in as required.
- Create/enable Cloud Firestore and deploy restrictive per-user security rules.
- Confirm phone/SMS region policy and quotas.
- Confirm Google OAuth client configuration matches package `com.dintakurthi.dailyinterest`.

## Status at this checkpoint
- Splash layout update committed in this development branch.
- About version display fallback and Android bundle copy of generated version metadata committed; validate in the next APK.
- CI launcher-icon padding step committed; source artwork in Git remains unchanged.
- Login/Registration, Firebase connection, Firestore sync, data migration, and device regression tests remain pending.