import { registerPlugin } from '@capacitor/core';
const NativeAppLock = registerPlugin('NativeAppLock');
window.NativeAppLock = NativeAppLock;
