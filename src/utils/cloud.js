import { initializeApp } from 'firebase/app';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut as fbSignOut,
} from 'firebase/auth';
import {
  getFirestore, collection, doc, getDoc, setDoc, getDocs, query, orderBy,
  startAfter, limit, writeBatch, serverTimestamp, Timestamp,
} from 'firebase/firestore/lite';
import { firebaseConfig } from '../config';

export const cloudEnabled = !!firebaseConfig.apiKey;
const app = cloudEnabled ? initializeApp(firebaseConfig) : null;
const auth = app && getAuth(app);
const db = app && getFirestore(app);
const uid = () => auth.currentUser.uid;

const MSG = {
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/email-already-in-use': 'This email already has an account. Sign in instead.',
  'auth/weak-password': 'Use a password with at least 8 characters.',
  'auth/invalid-email': 'Enter a valid email.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
  'auth/network-request-failed': 'No connection.',
  'auth/operation-not-allowed': 'Email/password sign-in is not enabled in Firebase.',
};
const wrap = async (fn) => {
  try { return await fn(); } catch (e) { throw new Error(MSG[e.code] || 'Something went wrong. Try again.'); }
};

export const watchAuth = (cb) => onAuthStateChanged(auth, cb);
export const signIn = (e, p) => wrap(() => signInWithEmailAndPassword(auth, e, p));
export const signUp = (e, p) => wrap(async () => { await createUserWithEmailAndPassword(auth, e, p); return true; });
export const signOut = () => fbSignOut(auth);

const vaultRef = () => doc(db, 'users', uid(), 'vault', 'main');
export async function getVault() {
  const s = await getDoc(vaultRef());
  return s.exists() ? s.data() : null;
}
export const createVault = (salt, check_blob) => setDoc(vaultRef(), { salt, check_blob });

// "since" is "seconds:nanoseconds" of the last server timestamp seen.
export async function pull(since) {
  const col = collection(db, 'users', uid(), 'notes');
  const valid = since && /^\d+:\d+$/.test(since);
  const [a, b] = valid ? since.split(':').map(Number) : [0, 0];
  const q = valid
    ? query(col, orderBy('synced_at'), startAfter(new Timestamp(a, b)), limit(1000))
    : query(col, orderBy('synced_at'), limit(1000));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id, data: x.data, deleted: x.deleted, updated_at: x.updated_at,
      synced_at: `${x.synced_at.seconds}:${x.synced_at.nanoseconds}`,
    };
  });
}

export async function push(rows) {
  for (let i = 0; i < rows.length; i += 200) {
    const b = writeBatch(db);
    rows.slice(i, i + 200).forEach((r) =>
      b.set(doc(db, 'users', uid(), 'notes', r.id), {
        data: r.data, deleted: r.deleted, updated_at: r.updated_at, synced_at: serverTimestamp(),
      })
    );
    await b.commit();
  }
}
