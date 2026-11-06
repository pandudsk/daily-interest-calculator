import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
async function shareStatement(customerName, statementText) {
  if (Capacitor.isNativePlatform()) {
    await Share.share({ title: `Daily Interest Statement - ${customerName}`, text: statementText, dialogTitle: 'Share customer statement' });
    return true;
  }
  if (navigator.share) {
    await navigator.share({ title: `Daily Interest Statement - ${customerName}`, text: statementText });
    return true;
  }
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(statementText);
    return true;
  }
  throw new Error('No share method available');
}
window.NativeShare = { shareStatement };
