# School Management Portal — Firebase Firestore Migration

This project has been fully migrated from **localStorage** to **Firebase Firestore** with real-time `onSnapshot` listeners.

---

## What Changed

| Before | After |
|---|---|
| `localStorage.setItem/getItem` everywhere | Firestore `setDoc` / `updateDoc` / `deleteDoc` |
| Data lost on browser clear | Data persists in Firestore cloud |
| Single-device only | Real-time sync across all devices |
| No backend | Firebase project + security rules |

---

## New Files Added

```
src/
  firebase/
    config.ts            ← Firebase app init, exports db & auth
    firestoreService.ts  ← All CRUD helpers + typed onSnapshot subscribers
    seedFirestore.ts     ← One-time seed from mockData on first run

firestore.rules          ← Firestore security rules
firestore.indexes.json   ← Composite index definitions
firebase.json            ← Firebase CLI configuration
.env.example             ← Environment variable template
```

---

## Firestore Collections

| Collection | Description |
|---|---|
| `teachers` | Teacher accounts with subjects & classes |
| `students` | Student accounts with fee & grade info |
| `parents` | Parent accounts linked to students |
| `assignments` | Assignments created by teachers |
| `submissions` | Student homework submissions |
| `studyMaterials` | Teacher-uploaded reference materials |
| `messages` | E2E-encrypted inter-user messages |
| `notifications` | System and personal alerts |
| `attendance` | Daily per-student attendance records |
| `activityLogs` | Audit trail of all user actions |
| `timetables` | Class schedule entries |
| `appConfig` | Admin singleton document |

---

## Setup

### 1. Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → Add Project
2. Build → Firestore Database → Create database (test mode initially)
3. Build → Project Overview → Add web app → copy firebaseConfig values

### 2. Configure Environment Variables

```bash
cp .env.example .env
# Fill in your Firebase project values
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Deploy Rules & Indexes

```bash
npm install -g firebase-tools
firebase login
firebase use --add
npm run firebase:deploy:rules
npm run firebase:deploy:indexes
```

### 5. Run

```bash
npm run dev
```

On first load, Firestore is seeded automatically from `mockData.ts`.

---

## Demo Login Credentials

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Teacher | `teach-sharma` | `teach-sharma123` |
| Student | `stu26-9-105` | `stu26-9-105123` |
| Parent | `par26-9-105` | `par26-9-105123` |

All passwords follow the pattern: `username + 123`

---

## Production Checklist

- [ ] Replace test Firestore rules with Firebase Auth-based rules
- [ ] Add Firebase Authentication (Email/Password or custom tokens)
- [ ] Enable Firestore automated backups
- [ ] Set up Firebase App Check
- [ ] Upgrade encryption from XOR to WebCrypto AES-GCM
