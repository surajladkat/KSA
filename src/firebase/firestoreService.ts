/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Firestore Service — centralised CRUD and real-time listener helpers.
 * All collection names are defined as constants to prevent typos.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  Timestamp,
  serverTimestamp,
  QueryConstraint,
  DocumentData,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import {
  TeacherUser,
  StudentUser,
  ParentUser,
  StudyMaterial,
  Assignment,
  Submission,
  CommunicationMessage,
  Notification,
  ActivityLog,
  TimetableEntry,
  AttendanceRecord,
} from '../types';

// ─── Collection Name Constants ────────────────────────────────────────────────
export const COLLECTIONS = {
  TEACHERS:        'teachers',
  STUDENTS:        'students',
  PARENTS:         'parents',
  ASSIGNMENTS:     'assignments',
  ATTENDANCE:      'attendance',
  MESSAGES:        'messages',
  NOTIFICATIONS:   'notifications',
  STUDY_MATERIALS: 'studyMaterials',
  SUBMISSIONS:     'submissions',
  ACTIVITY_LOGS:   'activityLogs',
  TIMETABLES:      'timetables',
  APP_CONFIG:      'appConfig',   // stores the admin singleton doc
} as const;

// ─── Generic helpers ──────────────────────────────────────────────────────────

/** Write a document with a known ID (upsert). */
export async function setDocument<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: T,
): Promise<void> {
  await setDoc(doc(db, collectionName, id), { ...data, updatedAt: serverTimestamp() });
}

/** Add a document with an auto-generated ID. Returns the new ID. */
export async function addDocument<T extends DocumentData>(
  collectionName: string,
  data: T,
): Promise<string> {
  const ref = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Partially update an existing document. */
export async function updateDocument<T extends Partial<DocumentData>>(
  collectionName: string,
  id: string,
  data: T,
): Promise<void> {
  await updateDoc(doc(db, collectionName, id), { ...data, updatedAt: serverTimestamp() });
}

/** Delete a document by ID. */
export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  await deleteDoc(doc(db, collectionName, id));
}

/** Fetch all documents in a collection (one-time read). */
export async function fetchCollection<T>(collectionName: string): Promise<T[]> {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T));
}

/** Fetch a single document by ID. */
export async function fetchDocument<T>(collectionName: string, id: string): Promise<T | null> {
  const snap = await getDoc(doc(db, collectionName, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as T;
}

// ─── onSnapshot real-time listeners ──────────────────────────────────────────

/**
 * Subscribe to an entire collection.
 * Returns the unsubscribe function — call it on component unmount.
 */
export function subscribeToCollection<T>(
  collectionName: string,
  callback: (data: T[]) => void,
  constraints: QueryConstraint[] = [],
): Unsubscribe {
  const q = constraints.length
    ? query(collection(db, collectionName), ...constraints)
    : collection(db, collectionName);

  return onSnapshot(q, snapshot => {
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T));
    callback(data);
  });
}

/**
 * Subscribe to a single document.
 */
export function subscribeToDocument<T>(
  collectionName: string,
  id: string,
  callback: (data: T | null) => void,
): Unsubscribe {
  return onSnapshot(doc(db, collectionName, id), snap => {
    if (!snap.exists()) { callback(null); return; }
    callback({ id: snap.id, ...snap.data() } as T);
  });
}

// ─── Typed collection subscribers ────────────────────────────────────────────

export const subscribeTeachers = (cb: (t: TeacherUser[]) => void) =>
  subscribeToCollection<TeacherUser>(COLLECTIONS.TEACHERS, cb);

export const subscribeStudents = (cb: (s: StudentUser[]) => void) =>
  subscribeToCollection<StudentUser>(COLLECTIONS.STUDENTS, cb);

export const subscribeParents = (cb: (p: ParentUser[]) => void) =>
  subscribeToCollection<ParentUser>(COLLECTIONS.PARENTS, cb);

export const subscribeAssignments = (cb: (a: Assignment[]) => void) =>
  subscribeToCollection<Assignment>(COLLECTIONS.ASSIGNMENTS, cb, [orderBy('uploadedAt', 'desc')]);

export const subscribeSubmissions = (cb: (s: Submission[]) => void) =>
  subscribeToCollection<Submission>(COLLECTIONS.SUBMISSIONS, cb, [orderBy('submittedAt', 'desc')]);

export const subscribeMessages = (cb: (m: CommunicationMessage[]) => void) =>
  subscribeToCollection<CommunicationMessage>(COLLECTIONS.MESSAGES, cb, [orderBy('timestamp', 'asc')]);

export const subscribeNotifications = (
  userId: string,
  role: string,
  cb: (n: Notification[]) => void,
) => {
  // Listen for both personal and broadcast notifications
  const unsubPersonal = subscribeToCollection<Notification>(
    COLLECTIONS.NOTIFICATIONS,
    (personal) => {
      cb(personal);
    },
    [where('recipientId', 'in', [userId, `ALL_${role}S`]), orderBy('timestamp', 'desc')],
  );
  return unsubPersonal;
};

export const subscribeStudyMaterials = (cb: (m: StudyMaterial[]) => void) =>
  subscribeToCollection<StudyMaterial>(COLLECTIONS.STUDY_MATERIALS, cb, [orderBy('uploadedAt', 'desc')]);

export const subscribeActivityLogs = (cb: (l: ActivityLog[]) => void) =>
  subscribeToCollection<ActivityLog>(COLLECTIONS.ACTIVITY_LOGS, cb, [orderBy('timestamp', 'desc')]);

export const subscribeTimetables = (cb: (t: TimetableEntry[]) => void) =>
  subscribeToCollection<TimetableEntry>(COLLECTIONS.TIMETABLES, cb);

export const subscribeAttendance = (cb: (a: AttendanceRecord[]) => void) =>
  subscribeToCollection<AttendanceRecord>(COLLECTIONS.ATTENDANCE, cb, [orderBy('date', 'desc')]);

// ─── Batch seed (run once) ────────────────────────────────────────────────────

/**
 * Atomically write a batch of documents.
 * Each item must have an `id` field to use as the Firestore document ID.
 */
export async function batchWriteDocuments<T extends { id: string }>(
  collectionName: string,
  items: T[],
): Promise<void> {
  const batch = writeBatch(db);
  items.forEach(item => {
    const ref = doc(db, collectionName, item.id);
    batch.set(ref, { ...item, updatedAt: Timestamp.now() });
  });
  await batch.commit();
}

/**
 * Check whether a collection is empty (used during initial seed).
 */
export async function isCollectionEmpty(collectionName: string): Promise<boolean> {
  const snap = await getDocs(query(collection(db, collectionName)));
  return snap.empty;
}
