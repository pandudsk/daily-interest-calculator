import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

window.FirebaseAuth = {
  getCurrentUser: async () => (await FirebaseAuthentication.getCurrentUser()).user || null,
  signInEmail: async (email, password) => (await FirebaseAuthentication.signInWithEmailAndPassword({ email, password })).user,
  registerEmail: async (email, password) => (await FirebaseAuthentication.createUserWithEmailAndPassword({ email, password })).user,
  signInGoogle: async () => (await FirebaseAuthentication.signInWithGoogle()).user,
  sendPasswordReset: async (email) => FirebaseAuthentication.sendPasswordResetEmail({ email }),
  signOut: async () => FirebaseAuthentication.signOut(),
  signInPhone: async (phone, onCodeSent) => {
    let listener;
    const codeSent = new Promise((resolve, reject) => {
      FirebaseAuthentication.addListener('phoneCodeSent', event => {
        onCodeSent(event.verificationId);
        resolve(event.verificationId);
      }).then(l => { listener = l; }).catch(reject);
      FirebaseAuthentication.addListener('phoneVerificationFailed', event => {
        reject(new Error(event.message || 'Phone verification failed'));
      }).catch(reject);
    });
    await FirebaseAuthentication.signInWithPhoneNumber({ phoneNumber: phone });
    await codeSent;
    return async (verificationCode, verificationId) => {
      try { return (await FirebaseAuthentication.confirmVerificationCode({ verificationId, verificationCode })).user; }
      finally { if (listener) listener.remove(); }
    };
  }
};
