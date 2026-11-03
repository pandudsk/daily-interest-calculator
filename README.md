# Daily Interest & Compound Interest Calculator

Standalone Android app project (Capacitor 7). The app is offline-first and stores customer records on the device.

## Included features
- Multiple customer accounts; add and rename customers
- Manually add dated borrowing transactions
- Daily interest: monthly rate / 100 / 30
- Default rate: ₹1.50 per ₹100 per month (0.05% per day)
- Optional annual compounding on the anniversary of the first transaction
- Calculation date selector
- Day-wise interest ledger and summary
- Telugu and English interface; printed statement and shared statement follow the selected language
- Print / Save as PDF, detailed statement sharing through Android share menu, CSV export
- JSON backup and restore
- English / Telugu interface
- 200+ transactions supported by the UI (browser/device storage capacity applies)

## Calculation rules
- All transaction amounts are treated as additional borrowings, not repayments.
- Transactions are grouped by date.
- Interest accrues on the outstanding running balance for the exact number of elapsed days.
- When annual compounding is enabled, accrued interest is added to the balance on each anniversary of the first transaction date.
- A transaction on an anniversary date is added after the anniversary interest is capitalized.
- No interest is charged before the first transaction date.
- This is a mathematical calculator; confirm the agreed rate and applicable legal requirements before using a statement as a formal demand.

## Build Android APK
Requirements: Node.js 20+, Android Studio, Android SDK, and Java version supported by your installed Android Gradle Plugin.

1. Extract this ZIP.
2. Open a terminal in the extracted folder.
3. Run:
   ```bash
   npm install
   npx cap add android
   npx cap sync android
   npx cap open android
   ```
4. In Android Studio, wait for Gradle sync.
5. For a debug APK: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
6. Android Studio shows the generated APK location. For a signed release APK, use **Build > Generate Signed Bundle / APK**.

## Data and privacy
Customer data is stored locally in app/browser storage. It is not automatically uploaded to a cloud service. Use Backup data regularly and keep the backup file safe. Uninstalling the app or clearing app data can remove locally stored records.

## Notes
- The app uses browser print support for PDF. On Android, choose **Save as PDF** in the system print dialog.
- The Share statement action shares a concise text summary. PDF sharing can be done from the generated PDF in the Android share sheet after saving it.
- This project ZIP is source code, not a prebuilt APK. An Android SDK build is required to produce the installable APK.
