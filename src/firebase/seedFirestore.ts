/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * seedFirestore.ts — Seeds Firestore with default data on first run.
 * Called once from SchoolProvider when each collection is empty.
 */

import { batchWriteDocuments, isCollectionEmpty, COLLECTIONS, setDocument } from './firestoreService';
import {
  DEFAULT_ADMIN,
  DEFAULT_TEACHERS,
  DEFAULT_STUDENTS,
  DEFAULT_PARENTS,
  DEFAULT_STUDY_MATERIALS,
  DEFAULT_ASSIGNMENTS,
  DEFAULT_SUBMISSIONS,
  DEFAULT_MESSAGES,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_ACTIVITY_LOGS,
  DEFAULT_ATTENDANCE,
  DEFAULT_TIMETABLES,
} from '../mockData';

export async function seedFirestoreIfEmpty(): Promise<void> {
  console.log('[Firestore Seed] Checking if seed is required…');

  const seedTasks: Array<() => Promise<void>> = [
    async () => {
      if (await isCollectionEmpty(COLLECTIONS.TEACHERS)) {
        console.log('[Firestore Seed] Seeding teachers…');
        await batchWriteDocuments(COLLECTIONS.TEACHERS, DEFAULT_TEACHERS);
      }
    },
    async () => {
      if (await isCollectionEmpty(COLLECTIONS.STUDENTS)) {
        console.log('[Firestore Seed] Seeding students…');
        await batchWriteDocuments(COLLECTIONS.STUDENTS, DEFAULT_STUDENTS);
      }
    },
    async () => {
      if (await isCollectionEmpty(COLLECTIONS.PARENTS)) {
        console.log('[Firestore Seed] Seeding parents…');
        await batchWriteDocuments(COLLECTIONS.PARENTS, DEFAULT_PARENTS);
      }
    },
    async () => {
      if (await isCollectionEmpty(COLLECTIONS.STUDY_MATERIALS)) {
        console.log('[Firestore Seed] Seeding study materials…');
        await batchWriteDocuments(COLLECTIONS.STUDY_MATERIALS, DEFAULT_STUDY_MATERIALS);
      }
    },
    async () => {
      if (await isCollectionEmpty(COLLECTIONS.ASSIGNMENTS)) {
        console.log('[Firestore Seed] Seeding assignments…');
        await batchWriteDocuments(COLLECTIONS.ASSIGNMENTS, DEFAULT_ASSIGNMENTS);
      }
    },
    async () => {
      if (await isCollectionEmpty(COLLECTIONS.SUBMISSIONS)) {
        console.log('[Firestore Seed] Seeding submissions…');
        await batchWriteDocuments(COLLECTIONS.SUBMISSIONS, DEFAULT_SUBMISSIONS);
      }
    },
    async () => {
      if (await isCollectionEmpty(COLLECTIONS.MESSAGES)) {
        console.log('[Firestore Seed] Seeding messages…');
        await batchWriteDocuments(COLLECTIONS.MESSAGES, DEFAULT_MESSAGES);
      }
    },
    async () => {
      if (await isCollectionEmpty(COLLECTIONS.NOTIFICATIONS)) {
        console.log('[Firestore Seed] Seeding notifications…');
        await batchWriteDocuments(COLLECTIONS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
      }
    },
    async () => {
      if (await isCollectionEmpty(COLLECTIONS.ACTIVITY_LOGS)) {
        console.log('[Firestore Seed] Seeding activity logs…');
        await batchWriteDocuments(COLLECTIONS.ACTIVITY_LOGS, DEFAULT_ACTIVITY_LOGS);
      }
    },
    async () => {
      if (await isCollectionEmpty(COLLECTIONS.TIMETABLES)) {
        console.log('[Firestore Seed] Seeding timetables…');
        await batchWriteDocuments(COLLECTIONS.TIMETABLES, DEFAULT_TIMETABLES);
      }
    },
    async () => {
      if (await isCollectionEmpty(COLLECTIONS.ATTENDANCE)) {
        console.log('[Firestore Seed] Seeding attendance…');
        await batchWriteDocuments(COLLECTIONS.ATTENDANCE, DEFAULT_ATTENDANCE);
      }
    },
    // Admin is a singleton stored in appConfig
    async () => {
      const configRef = COLLECTIONS.APP_CONFIG;
      if (await isCollectionEmpty(configRef)) {
        console.log('[Firestore Seed] Seeding app config (admin)…');
        await setDocument(configRef, 'admin', DEFAULT_ADMIN);
      }
    },
  ];

  await Promise.all(seedTasks.map(t => t()));
  console.log('[Firestore Seed] Seed complete.');
}
