import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

let verificationId = null;
let phoneListeners = [];
const clean = async () => { await Promise.all(phoneListeners.map(x => x.remove())); phoneListeners=[]; };
const userOf = result => result?.user || null;
export const getCurrentUser = async () => userOf(await FirebaseAuthentication.getCurrentUser());
export const registerEmail = async (email,password) => userOf(await FirebaseAuthentication.createUserWithEmailAndPassword({email,password}));
export const loginEmail = async (email,password) => userOf(await FirebaseAuthentication.signInWithEmailAndPassword({email,password}));
export const sendEmailVerification = async () => FirebaseAuthentication.sendEmailVerification();
export const reloadCurrentUser = async () => { await FirebaseAuthentication.reload(); return userOf(await FirebaseAuthentication.getCurrentUser()); };
export async function sendPhoneOtp(phoneNumber,onSent,onAuto,onError){
  await clean(); verificationId=null;
  phoneListeners.push(await FirebaseAuthentication.addListener('phoneCodeSent',e=>{verificationId=e.verificationId;onSent?.(e)}));
  phoneListeners.push(await FirebaseAuthentication.addListener('phoneVerificationCompleted',e=>onAuto?.(userOf(e.result))));
  phoneListeners.push(await FirebaseAuthentication.addListener('phoneVerificationFailed',e=>onError?.(e)));
  await FirebaseAuthentication.signInWithPhoneNumber({phoneNumber,timeout:60});
}
export async function verifyPhoneOtp(code){
  if(!verificationId) throw new Error('OTP_VERIFICATION_NOT_STARTED');
  const result=await FirebaseAuthentication.confirmVerificationCode({verificationId,verificationCode:code});
  verificationId=null; await clean(); return userOf(result);
}
export const googleLogin = async () => userOf(await FirebaseAuthentication.signInWithGoogle());
export const signOut = () => FirebaseAuthentication.signOut();
export function errorText(e){
 const c=e?.code||'',m={
 'auth/email-already-in-use':'ఈ Email ఇప్పటికే వాడుకలో ఉంది.',
 'auth/invalid-email':'సరైన Email address ఇవ్వండి.',
 'auth/weak-password':'Password కనీసం 6 అక్షరాలు ఉండాలి.',
 'auth/user-not-found':'ఈ వివరాలతో Account లేదు.',
 'auth/wrong-password':'Password తప్పు.',
 'auth/invalid-credential':'Email లేదా Password తప్పుగా ఉంది.',
 'auth/too-many-requests':'చాలా ప్రయత్నాలు చేశారు. కొద్దిసేపటి తర్వాత ప్రయత్నించండి.',
 'auth/invalid-phone-number':'సరైన Mobile Number ఇవ్వండి.',
 'auth/quota-exceeded':'OTP పరిమితి పూర్తయింది.',
 'auth/operation-not-allowed':'ఈ Login విధానం Firebase‌లో Enable చేయాలి.',
 'OTP_VERIFICATION_NOT_STARTED':'ముందుగా OTP పంపించండి.'
 }; return m[c]||e?.message||'Login విఫలమైంది. మళ్లీ ప్రయత్నించండి.';
}
window.DailyKhataAuth={getCurrentUser,registerEmail,loginEmail,sendEmailVerification,reloadCurrentUser,sendPhoneOtp,verifyPhoneOtp,googleLogin,signOut,errorText};
