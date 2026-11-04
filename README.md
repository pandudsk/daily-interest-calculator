# Daily Interest Calculator — Updated Source

Standalone Android project source for the existing `com.dintakurthi.dailyinterest` Capacitor app. This is **source code, not a prebuilt APK**.

## Included in this revision
- Purple/lavender theme across all app screens; splash branding references are included in `www/assets/`.
- Existing customer data schema is retained. Legacy transactions without a `type` are migrated as `credit` (Appulu).
- Customer add, rename, delete, and select are in the Customers tab; Dashboard only selects a customer and records entries.
- Separate Appulu (credit) and Jamalu (debit) ledgers, each with its own first transaction date and annual compounding anniversary.
- Final settlement = (Appulu principal + Appulu interest) − (Jamalu principal + Jamalu interest).
- ₹1.50 per ₹100 per month by default, 30-day month, daily rate 0.05%.
- Non-blocking transaction success toast; no OK dialog.
- JSON backup/restore, transaction CSV export, share statement, print preview.
- Printer guidance/settings for Android system print services, Bluetooth thermal printer apps/services, and USB OTG where compatible.

## Calculation convention
For each ledger independently, interest accrues on that ledger's running balance at `monthlyRate / 100 / 30` per day. On each anniversary of that ledger's first transaction date, accrued interest is capitalized into that ledger's balance. The other ledger is calculated independently. This means a Jamalu transaction is not treated as a repayment against Appulu; both totals and their interest are calculated separately, then netted only in the final settlement.

## Important testing notes
- This source should be tested with sample cases before being used for actual financial settlement. It is not certified accounting software.
- Existing old records are treated as Appulu because the earlier version only supported borrowings. Review migrated records before relying on results.
- The app uses local device storage. Back up before installing an update; Android uninstall/data-clear can erase local data.
- Android printing opens the Android print flow (`window.print`). Wi-Fi/network printers depend on Android Print Service. Bluetooth thermal and USB OTG printing depend on the printer model, installed service/driver, Android version, and vendor app; universal direct-print compatibility is not guaranteed.

## Build
Requirements: Node.js 20+, Java 21, Android SDK, Android Studio (optional for local builds).

```bash
npm install
npx cap add android   # only for a new clone without android/ folder
npx cap sync android
cd android
./gradlew assembleDebug
```
APK output: `android/app/build/outputs/apk/debug/app-debug.apk`.

For the existing GitHub repository, upload/replace the contents of this source archive in the repository while preserving the directory structure. Commit and run the existing GitHub Actions workflow. Download the generated APK artifact from Actions.

## V2 build notes
- The GitHub Actions workflow copies the supplied ledger/calculator/pen artwork into Android launcher icon density folders.
- Date-only anniversary calculations use local calendar dates to avoid UTC timezone date shifts.
- This remains a debug APK workflow. Android update installation also requires the new APK to be signed with the same signing certificate as the installed APK. GitHub-hosted ephemeral debug signing may differ between builds; if Android reports a signature conflict, do not uninstall until any required backup has been taken.
