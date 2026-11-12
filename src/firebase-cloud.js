import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

const PROJECT_ID = 'daily-interest-calculato-b68a7';
const DOC_URL = 'https://firestore.googleapis.com/v1/projects/' + PROJECT_ID + '/databases/(default)/documents/users/';
const clone = value => JSON.parse(JSON.stringify(value));
function mergeStates(local, remote) {
  const result = clone(local || {});
  const byId = new Map();
  [...(remote?.customers || []), ...(local?.customers || [])].forEach(customer => {
    if (!customer?.id) return;
    const previous = byId.get(customer.id) || {};
    const transactions = new Map();
    [...(previous.transactions || []), ...(customer.transactions || [])].forEach(tx => {
      const key = tx.id || [tx.date, tx.amount, tx.type, tx.description].join('|');
      transactions.set(key, tx);
    });
    byId.set(customer.id, { ...previous, ...customer, transactions: [...transactions.values()] });
  });
  result.customers = [...byId.values()];
  result.settings = { ...(remote?.settings || {}), ...(local?.settings || {}) };
  result.profile = { ...(remote?.profile || {}), ...(local?.profile || {}) };
  if (!result.customers.some(c => c.id === result.selected)) result.selected = result.customers[0]?.id || null;
  return result;
}
async function token() {
  const user = (await FirebaseAuthentication.getCurrentUser()).user;
  if (!user?.uid) throw new Error('Please sign in again to sync your account.');
  const result = await FirebaseAuthentication.getIdToken();
  const value = result?.token || result?.idToken || result;
  if (typeof value !== 'string' || !value) throw new Error('Could not get a secure Firebase login token.');
  return { uid: user.uid, value };
}
async function request(uid, idToken, method, body) {
  const url = DOC_URL + encodeURIComponent(uid) + '/khataBook';
  const response = await fetch(url, {
    method,
    headers: { Authorization: 'Bearer ' + idToken, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  if (response.status === 404) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || 'Firestore request failed (' + response.status + '). Enable Cloud Firestore and check its security rules.');
  return payload;
}
function decode(document) {
  try {
    const raw = document?.fields?.state?.stringValue;
    return raw ? JSON.parse(raw) : null;
  } catch { throw new Error('Cloud data format is invalid. Local data has not been changed.'); }
}
function encode(state) {
  return { fields: {
    state: { stringValue: JSON.stringify(state) },
    schemaVersion: { integerValue: '1' },
    updatedAt: { timestampValue: new Date().toISOString() }
  }};
}
window.FirebaseCloud = {
  sync: async localState => {
    const { uid, value } = await token();
    const document = await request(uid, value, 'GET');
    const remoteState = decode(document);
    const merged = mergeStates(localState, remoteState);
    await request(uid, value, 'PATCH', encode(merged));
    return { state: merged, hadCloudData: !!remoteState, syncedAt: new Date().toISOString() };
  },
  status: async () => {
    const { uid, value } = await token();
    const document = await request(uid, value, 'GET');
    return { connected: !!document, updatedAt: document?.fields?.updatedAt?.timestampValue || null };
  }
};
