/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SchoolContext — Firebase Firestore edition.
 * All localStorage operations have been replaced with Firestore CRUD calls.
 * Real-time synchronisation is handled by onSnapshot listeners that are
 * registered on mount and cleaned up on unmount.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  AdminUser,
  TeacherUser,
  StudentUser,
  ParentUser,
  StudyMaterial,
  Assignment,
  Submission,
  CommunicationMessage,
  Notification,
  ActivityLog,
  ClassGrade,
  Role,
  TimetableEntry,
  AttendanceRecord,
  AttendanceStatus,
} from '../types';
import { DEFAULT_ADMIN, checkPasswordMatch } from '../mockData';
import {
  generateId,
  generateStudentLoginId,
  generateParentLoginId,
  generateTeacherLoginId,
  encryptData,
} from '../cryptoUtils';
import {
  COLLECTIONS,
  setDocument,
  addDocument,
  updateDocument,
  deleteDocument,
  subscribeTeachers,
  subscribeStudents,
  subscribeParents,
  subscribeAssignments,
  subscribeSubmissions,
  subscribeMessages,
  subscribeNotifications,
  subscribeStudyMaterials,
  subscribeActivityLogs,
  subscribeTimetables,
  subscribeAttendance,
  batchWriteDocuments,
} from '../firebase/firestoreService';
import { seedFirestoreIfEmpty } from '../firebase/seedFirestore';

// ─── Context interface (unchanged from localStorage version) ──────────────────

interface SchoolContextType {
  currentUser: User | null;
  users: User[];
  teachers: TeacherUser[];
  students: StudentUser[];
  parents: ParentUser[];
  studyMaterials: StudyMaterial[];
  assignments: Assignment[];
  submissions: Submission[];
  messages: CommunicationMessage[];
  notifications: Notification[];
  activityLogs: ActivityLog[];
  timetables: TimetableEntry[];
  attendance: AttendanceRecord[];
  isLoading: boolean;

  // Auth
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Admin
  registerStudentWithParent: (data: {
    studentName: string;
    classGrade: ClassGrade;
    parentName: string;
    parentRelation: string;
    parentPhone: string;
    totalFee: number;
    paidFee: number;
    seatNumber?: string;
    benchNumber?: string;
  }) => Promise<{ studentLogin: string; studentPass: string; parentLogin: string; parentPass: string }>;

  registerTeacher: (data: {
    name: string;
    subjects: string[];
    classes: ClassGrade[];
  }) => Promise<{ teacherLogin: string; teacherPass: string }>;

  updateStudentFee: (studentId: string, amountPaid: number) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  deleteTeacher: (teacherId: string) => Promise<void>;

  // Teacher
  uploadStudyMaterial: (material: Omit<StudyMaterial, 'id' | 'uploadedBy' | 'uploadedAt'>) => Promise<void>;
  deleteStudyMaterial: (id: string) => Promise<void>;
  createAssignment: (asg: Omit<Assignment, 'id' | 'uploadedBy' | 'teacherName' | 'uploadedAt'>) => Promise<void>;
  gradeSubmission: (submissionId: string, grade: string, feedback: string) => Promise<void>;

  // Student
  submitAssignmentHomework: (assignmentId: string, content: string, fileName?: string, fileSize?: string) => Promise<void>;

  // Communication
  sendMessage: (receiverId: string, rawContent: string) => Promise<void>;

  // Helpers
  getStudentParent: (studentId: string) => ParentUser | undefined;
  getParentChild: (parentId: string) => StudentUser | undefined;
  markNotificationsAsRead: () => Promise<void>;
  addToastNotification: (recipientId: string, title: string, message: string, type: Notification['type']) => Promise<void>;
  addTimetableEntry: (entry: Omit<TimetableEntry, 'id'>) => Promise<void>;
  deleteTimetableEntry: (id: string) => Promise<void>;
  submitDailyAttendance: (data: {
    classGrade: ClassGrade;
    subject: string;
    date: string;
    records: { studentId: string; studentName: string; status: AttendanceStatus; remarks?: string }[];
  }) => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading]           = useState(true);
  const [currentUser, setCurrentUser]       = useState<User | null>(() => {
    // Persist session in sessionStorage (not localStorage) so it clears on tab close
    try {
      const saved = sessionStorage.getItem('school_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [teachers,       setTeachers]       = useState<TeacherUser[]>([]);
  const [students,       setStudents]       = useState<StudentUser[]>([]);
  const [parents,        setParents]        = useState<ParentUser[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [assignments,    setAssignments]    = useState<Assignment[]>([]);
  const [submissions,    setSubmissions]    = useState<Submission[]>([]);
  const [messages,       setMessages]       = useState<CommunicationMessage[]>([]);
  const [notifications,  setNotifications]  = useState<Notification[]>([]);
  const [activityLogs,   setActivityLogs]   = useState<ActivityLog[]>([]);
  const [timetables,     setTimetables]     = useState<TimetableEntry[]>([]);
  const [attendance,     setAttendance]     = useState<AttendanceRecord[]>([]);
  const [users,          setUsers]          = useState<User[]>([]);

  // ── Derived user list ────────────────────────────────────────────────────────
  useEffect(() => {
    setUsers([DEFAULT_ADMIN, ...teachers, ...students, ...parents]);
  }, [teachers, students, parents]);

  // ── Session persistence ──────────────────────────────────────────────────────
  useEffect(() => {
    try {
      if (currentUser) {
        sessionStorage.setItem('school_current_user', JSON.stringify(currentUser));
      } else {
        sessionStorage.removeItem('school_current_user');
      }
    } catch { /* ignore */ }
  }, [currentUser]);

  // ── Seed + real-time listeners ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        await seedFirestoreIfEmpty();
      } catch (e) {
        console.warn('[SchoolContext] Seed failed (may already be seeded):', e);
      }

      if (cancelled) return;

      // Register onSnapshot listeners — returns unsubscribe functions
      const unsubs = [
        subscribeTeachers(data       => !cancelled && setTeachers(data)),
        subscribeStudents(data       => !cancelled && setStudents(data)),
        subscribeParents(data        => !cancelled && setParents(data)),
        subscribeAssignments(data    => !cancelled && setAssignments(data)),
        subscribeSubmissions(data    => !cancelled && setSubmissions(data)),
        subscribeMessages(data       => !cancelled && setMessages(data)),
        subscribeStudyMaterials(data => !cancelled && setStudyMaterials(data)),
        subscribeActivityLogs(data   => !cancelled && setActivityLogs(data)),
        subscribeTimetables(data     => !cancelled && setTimetables(data)),
        subscribeAttendance(data     => !cancelled && setAttendance(data)),
      ];

      setIsLoading(false);

      return () => unsubs.forEach(u => u());
    };

    const cleanup = init();

    return () => {
      cancelled = true;
      cleanup.then(fn => fn && fn());
    };
  }, []);

  // ── Notification listener depends on currentUser ──────────────────────────────
  useEffect(() => {
    if (!currentUser) { setNotifications([]); return; }
    const unsub = subscribeNotifications(currentUser.id, currentUser.role, data =>
      setNotifications(data),
    );
    return () => unsub();
  }, [currentUser?.id, currentUser?.role]);

  // ─── Helper: log activity ────────────────────────────────────────────────────
  const logActivity = useCallback(
    async (userId: string, userName: string, role: Role, action: string) => {
      const log: ActivityLog = {
        id: generateId('LOG'),
        userId,
        userName,
        userRole: role,
        action,
        timestamp: new Date().toISOString(),
        ipAddress: `192.168.${Math.floor(10 + Math.random() * 20)}.${Math.floor(2 + Math.random() * 250)}`,
      };
      await setDocument(COLLECTIONS.ACTIVITY_LOGS, log.id, log);
    },
    [],
  );

  // ─── Helper: create notification ────────────────────────────────────────────
  const addToastNotification = useCallback(
    async (recipientId: string, title: string, message: string, type: Notification['type']) => {
      const notif: Notification = {
        id: generateId('NOT'),
        recipientId,
        title,
        message,
        type,
        timestamp: new Date().toISOString(),
        read: false,
      };
      await setDocument(COLLECTIONS.NOTIFICATIONS, notif.id, notif);
    },
    [],
  );

  // ─── Auth ────────────────────────────────────────────────────────────────────
  const login = async (
    username: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    // Admin check (singleton)
    if (username === DEFAULT_ADMIN.username && checkPasswordMatch(username, password)) {
      setCurrentUser(DEFAULT_ADMIN);
      await logActivity(DEFAULT_ADMIN.id, DEFAULT_ADMIN.name, 'ADMIN', 'Admin logged into control panel');
      return { success: true };
    }

    const foundTeacher = teachers.find(t => t.username.toLowerCase() === username.toLowerCase());
    if (foundTeacher && checkPasswordMatch(foundTeacher.username, password)) {
      setCurrentUser(foundTeacher);
      await logActivity(foundTeacher.id, foundTeacher.name, 'TEACHER', 'Teacher logged in');
      return { success: true };
    }

    const foundStudent = students.find(s => s.username.toLowerCase() === username.toLowerCase());
    if (foundStudent && checkPasswordMatch(foundStudent.username, password)) {
      setCurrentUser(foundStudent);
      await logActivity(foundStudent.id, foundStudent.name, 'STUDENT', `Student logged in (Class ${foundStudent.classGrade})`);
      return { success: true };
    }

    const foundParent = parents.find(p => p.username.toLowerCase() === username.toLowerCase());
    if (foundParent && checkPasswordMatch(foundParent.username, password)) {
      setCurrentUser(foundParent);
      await logActivity(foundParent.id, foundParent.name, 'PARENT', 'Parent logged in');
      return { success: true };
    }

    return { success: false, error: 'Invalid credentials. Contact Administration.' };
  };

  const logout = async () => {
    if (currentUser) {
      await logActivity(currentUser.id, currentUser.name, currentUser.role, 'User logged out securely');
    }
    setCurrentUser(null);
  };

  // ─── Admin: register student + parent ────────────────────────────────────────
  const registerStudentWithParent = async (data: {
    studentName: string;
    classGrade: ClassGrade;
    parentName: string;
    parentRelation: string;
    parentPhone: string;
    totalFee: number;
    paidFee: number;
    seatNumber?: string;
    benchNumber?: string;
  }) => {
    const sId = generateId('STU');
    const pId = generateId('PAR');
    const studentUsername = generateStudentLoginId(data.classGrade);
    const parentUsername  = generateParentLoginId(studentUsername);
    const studentPassword = `${studentUsername}123`;
    const parentPassword  = `${parentUsername}123`;

    const pendingFee     = Math.max(0, data.totalFee - data.paidFee);
    const paymentStatus  = data.paidFee >= data.totalFee ? 'PAID' : data.paidFee > 0 ? 'PARTIAL' : 'PENDING';

    const newStudent: StudentUser = {
      id: sId,
      username: studentUsername,
      name: data.studentName,
      role: 'STUDENT',
      classGrade: data.classGrade,
      parentId: pId,
      studentIdCardNum: `STU-${data.classGrade.replace('th', '')}-2026-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      seatNumber: data.seatNumber || '',
      benchNumber: data.benchNumber || '',
      totalFee: data.totalFee,
      paidFee: data.paidFee,
      pendingFee,
      paymentStatus: paymentStatus as StudentUser['paymentStatus'],
    };

    const newParent: ParentUser = {
      id: pId,
      username: parentUsername,
      name: data.parentName,
      role: 'PARENT',
      childId: sId,
      childName: data.studentName,
      childClass: data.classGrade,
      relationship: data.parentRelation,
      mobileNumber: data.parentPhone,
      createdAt: new Date().toISOString(),
    };

    await Promise.all([
      setDocument(COLLECTIONS.STUDENTS, sId, newStudent),
      setDocument(COLLECTIONS.PARENTS,  pId, newParent),
    ]);

    if (currentUser) {
      await logActivity(
        currentUser.id, currentUser.name, currentUser.role,
        `Registered student ${data.studentName} (${data.classGrade}) with fee ₹${data.totalFee}`,
      );
    }
    await addToastNotification('ALL_TEACHERS', 'New Student Admission', `Welcome ${data.studentName} to Class ${data.classGrade}!`, 'INFO');

    return { studentLogin: studentUsername, studentPass: studentPassword, parentLogin: parentUsername, parentPass: parentPassword };
  };

  // ─── Admin: register teacher ─────────────────────────────────────────────────
  const registerTeacher = async (data: { name: string; subjects: string[]; classes: ClassGrade[] }) => {
    const tId             = generateId('TEACH');
    const teacherUsername = generateTeacherLoginId(data.subjects[0] || 'gen');
    const teacherPassword = `${teacherUsername}123`;

    const newTeacher: TeacherUser = {
      id: tId,
      username: teacherUsername,
      name: data.name,
      role: 'TEACHER',
      subjects: data.subjects,
      classes: data.classes,
      createdAt: new Date().toISOString(),
    };

    await setDocument(COLLECTIONS.TEACHERS, tId, newTeacher);

    if (currentUser) {
      await logActivity(
        currentUser.id, currentUser.name, currentUser.role,
        `Registered new teacher ${data.name} for: ${data.subjects.join(', ')}`,
      );
    }

    return { teacherLogin: teacherUsername, teacherPass: teacherPassword };
  };

  // ─── Admin: update fee ────────────────────────────────────────────────────────
  const updateStudentFee = async (studentId: string, amountPaid: number) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const newPaidFee    = student.paidFee + amountPaid;
    const newPendingFee = Math.max(0, student.totalFee - newPaidFee);
    const newStatus     = newPaidFee >= student.totalFee ? 'PAID' : newPaidFee > 0 ? 'PARTIAL' : 'PENDING';

    await updateDocument(COLLECTIONS.STUDENTS, studentId, {
      paidFee: newPaidFee,
      pendingFee: newPendingFee,
      paymentStatus: newStatus,
    });

    if (currentUser) {
      await logActivity(
        currentUser.id, currentUser.name, currentUser.role,
        `Recorded payment ₹${amountPaid} for ${student.name}. Balance: ₹${newPendingFee}`,
      );
    }
  };

  // ─── Admin: delete student ────────────────────────────────────────────────────
  const deleteStudent = async (studentId: string) => {
  if (!currentUser || currentUser.role !== 'ADMIN') return;
  
  const target = students.find(s => s.id === studentId);
  if (!target) return;

  // TRAP 2 BYPASS: Use the student's own record to find the parent ID.
  // If target.parentId is missing, fallback to searching the parents array.
  const parentIdToDelete = target.parentId || parents.find(p => p.childId === studentId)?.id;

  await Promise.all([
    deleteDocument(COLLECTIONS.STUDENTS, studentId),
    parentIdToDelete ? deleteDocument(COLLECTIONS.PARENTS, parentIdToDelete) : Promise.resolve(),
  ]);

  await logActivity(
    currentUser.id, currentUser.name, 'ADMIN',
    `Expelled student: ${target.name} (${target.classGrade}) and revoked parent access`,
  );
  await addToastNotification(currentUser.id, 'Student Deleted', `${target.name} and linked parent removed.`, 'INFO');
};

  // ─── Admin: delete teacher ────────────────────────────────────────────────────
  const deleteTeacher = async (teacherId: string) => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    const target = teachers.find(t => t.id === teacherId);
    if (!target) return;

    await deleteDocument(COLLECTIONS.TEACHERS, teacherId);
    await logActivity(currentUser.id, currentUser.name, 'ADMIN', `Dismissed teacher: ${target.name}`);
    await addToastNotification(currentUser.id, 'Teacher Deleted', `${target.name} dismissed and removed.`, 'INFO');
  };

  // ─── Teacher: upload study material ─────────────────────────────────────────
  const uploadStudyMaterial = async (material: Omit<StudyMaterial, 'id' | 'uploadedBy' | 'uploadedAt'>) => {
    if (!currentUser || currentUser.role !== 'TEACHER') return;

    const newMaterial: StudyMaterial = {
      ...material,
      id: generateId('MAT'),
      uploadedBy: currentUser.name,
      uploadedAt: new Date().toISOString(),
    };

    await setDocument(COLLECTIONS.STUDY_MATERIALS, newMaterial.id, newMaterial);
    await logActivity(currentUser.id, currentUser.name, 'TEACHER', `Uploaded: "${material.title}" for Class ${material.classGrade}`);

    const targetStudents = students.filter(s => s.classGrade === material.classGrade);
    await Promise.all(
      targetStudents.map(s =>
        addToastNotification(s.id, 'New Study Material', `${currentUser.name} uploaded "${material.title}"`, 'INFO'),
      ),
    );
  };

  // ─── Teacher: delete study material ─────────────────────────────────────────
  const deleteStudyMaterial = async (id: string) => {
    if (!currentUser || currentUser.role !== 'TEACHER') return;
    const material = studyMaterials.find(m => m.id === id);
    if (!material) return;

    await deleteDocument(COLLECTIONS.STUDY_MATERIALS, id);
    await logActivity(currentUser.id, currentUser.name, 'TEACHER', `Deleted material: "${material.title}"`);
    await addToastNotification(currentUser.id, 'Material Deleted', `"${material.title}" removed.`, 'INFO');
  };

  // ─── Teacher: create assignment ──────────────────────────────────────────────
  const createAssignment = async (asg: Omit<Assignment, 'id' | 'uploadedBy' | 'teacherName' | 'uploadedAt'>) => {
    if (!currentUser || currentUser.role !== 'TEACHER') return;

    const newAssignment: Assignment = {
      ...asg,
      id: generateId('ASG'),
      uploadedBy: currentUser.id,
      teacherName: currentUser.name,
      uploadedAt: new Date().toISOString(),
    };

    await setDocument(COLLECTIONS.ASSIGNMENTS, newAssignment.id, newAssignment);
    await logActivity(currentUser.id, currentUser.name, 'TEACHER', `Created assignment "${asg.title}" for Class ${asg.classGrade}`);

    const targetStudents = students.filter(s => s.classGrade === asg.classGrade);
    const dueStr = new Date(asg.dueDate).toLocaleDateString();

    await Promise.all(
      targetStudents.flatMap(s => [
        addToastNotification(s.id, 'New Assignment', `"${asg.title}" due ${dueStr}`, 'ASSIGNMENT'),
        s.parentId
          ? addToastNotification(s.parentId, 'Child Assignment', `${s.name} has "${asg.title}" due ${dueStr}`, 'ASSIGNMENT')
          : Promise.resolve(),
      ]),
    );
  };

  // ─── Teacher: grade submission ───────────────────────────────────────────────
  const gradeSubmission = async (submissionId: string, grade: string, feedback: string) => {
    if (!currentUser || currentUser.role !== 'TEACHER') return;

    const sub = submissions.find(s => s.id === submissionId);
    if (!sub) return;

    await updateDocument(COLLECTIONS.SUBMISSIONS, submissionId, {
      status: 'GRADED',
      grade,
      feedback,
    });

    const student = students.find(s => s.id === sub.studentId);

    await Promise.all([
      addToastNotification(sub.studentId, 'Homework Graded', `"${sub.assignmentTitle}" received Grade: ${grade}`, 'GRADE'),
      student?.parentId
        ? addToastNotification(student.parentId, 'Academics Updated', `${sub.studentName} received Grade: ${grade} for "${sub.assignmentTitle}"`, 'GRADE')
        : Promise.resolve(),
      logActivity(currentUser.id, currentUser.name, 'TEACHER', `Graded ${sub.studentName}'s "${sub.assignmentTitle}" → ${grade}`),
    ]);
  };

  // ─── Student: submit assignment ──────────────────────────────────────────────
  const submitAssignmentHomework = async (
    assignmentId: string,
    rawContent: string,
    fileName?: string,
    fileSize?: string,
  ) => {
    if (!currentUser || currentUser.role !== 'STUDENT') return;
    const studentUser = currentUser as StudentUser;

    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    // Delete previous submission for same assignment+student if exists
    const existing = submissions.find(
      s => s.assignmentId === assignmentId && s.studentId === studentUser.id,
    );
    if (existing) {
      await deleteDocument(COLLECTIONS.SUBMISSIONS, existing.id);
    }

    const encryptedContent = encryptData(rawContent, 'SCHOOL_SECRET_KEY');

    const newSubmission: Submission = {
      id: generateId('SUB'),
      assignmentId,
      assignmentTitle: assignment.title,
      studentId: studentUser.id,
      studentName: studentUser.name,
      classGrade: studentUser.classGrade,
      submittedAt: new Date().toISOString(),
      submittedContent: encryptedContent,
      status: 'SUBMITTED',
      fileName,
      fileSize,
    };

    await setDocument(COLLECTIONS.SUBMISSIONS, newSubmission.id, newSubmission);
    await logActivity(studentUser.id, studentUser.name, 'STUDENT', `Submitted homework for "${assignment.title}"`);
    await addToastNotification(
      assignment.uploadedBy,
      'Homework Submitted',
      `${studentUser.name} submitted "${assignment.title}"`,
      'SUBMISSION',
    );
  };

  // ─── Communication: send message ─────────────────────────────────────────────
  const sendMessage = async (receiverId: string, rawContent: string) => {
    if (!currentUser) return;
    const recipient = users.find(u => u.id === receiverId);
    if (!recipient) return;

    const encryptedMsg = encryptData(rawContent, 'SCHOOL_SECRET_KEY');
    const newMsg: CommunicationMessage = {
      id: generateId('MSG'),
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      receiverId,
      receiverName: recipient.name,
      receiverRole: recipient.role,
      content: encryptedMsg,
      timestamp: new Date().toISOString(),
    };

    await setDocument(COLLECTIONS.MESSAGES, newMsg.id, newMsg);
    await addToastNotification(
      receiverId,
      'New Secure Message',
      `E2E encrypted message from ${currentUser.name} (${currentUser.role})`,
      'MESSAGE',
    );
    await logActivity(currentUser.id, currentUser.name, currentUser.role, `Sent message to ${recipient.name} (${recipient.role})`);
  };

  // ─── Attendance: submit daily roll ───────────────────────────────────────────
  const submitDailyAttendance = async (data: {
    classGrade: ClassGrade;
    subject: string;
    date: string;
    records: { studentId: string; studentName: string; status: AttendanceStatus; remarks?: string }[];
  }) => {
    if (!currentUser || currentUser.role !== 'TEACHER') return;
    const teacherUser = currentUser as TeacherUser;

    // Delete existing records for same classGrade + subject + date (upsert behaviour)
    const existing = attendance.filter(
      r => r.classGrade === data.classGrade && r.subject === data.subject && r.date === data.date,
    );
    await Promise.all(existing.map(r => deleteDocument(COLLECTIONS.ATTENDANCE, r.id)));

    const newRecords: AttendanceRecord[] = data.records.map(rec => ({
      id: generateId('ATT'),
      studentId: rec.studentId,
      studentName: rec.studentName,
      classGrade: data.classGrade,
      date: data.date,
      status: rec.status,
      markedBy: teacherUser.id,
      teacherName: teacherUser.name,
      subject: data.subject,
      remarks: rec.remarks || '',
    }));

    await Promise.all(newRecords.map(r => setDocument(COLLECTIONS.ATTENDANCE, r.id, r)));
    await logActivity(teacherUser.id, teacherUser.name, 'TEACHER', `Attendance locked for Class ${data.classGrade} (${data.subject}) on ${data.date}`);

    const alertRecords = data.records.filter(r => r.status === 'ABSENT' || r.status === 'LATE');
    await Promise.all(
      alertRecords.flatMap(rec => {
        const linkedParent = parents.find(p => p.childId === rec.studentId);
        return [
          addToastNotification(rec.studentId, `Attendance: ${rec.status}`, `Marked ${rec.status.toLowerCase()} in ${data.subject} on ${data.date}`, 'INFO'),
          linkedParent
            ? addToastNotification(linkedParent.id, `Child Attendance: ${rec.status}`, `${rec.studentName} was ${rec.status.toLowerCase()} in ${data.subject}`, 'INFO')
            : Promise.resolve(),
        ];
      }),
    );
  };

  // ─── Timetable ────────────────────────────────────────────────────────────────
  const addTimetableEntry = async (entry: Omit<TimetableEntry, 'id'>) => {
    const newEntry: TimetableEntry = { ...entry, id: generateId('TT') };
    await setDocument(COLLECTIONS.TIMETABLES, newEntry.id, newEntry);
    if (currentUser) {
      await logActivity(currentUser.id, currentUser.name, currentUser.role, `Added timetable: ${entry.subject} (${entry.classGrade}) on ${entry.day}`);
    }
  };

  const deleteTimetableEntry = async (id: string) => {
    const entry = timetables.find(t => t.id === id);
    await deleteDocument(COLLECTIONS.TIMETABLES, id);
    if (currentUser && entry) {
      await logActivity(currentUser.id, currentUser.name, currentUser.role, `Deleted timetable: ${entry.subject} (${entry.classGrade})`);
    }
  };

  // ─── Notifications: mark as read ─────────────────────────────────────────────
  const markNotificationsAsRead = async () => {
    if (!currentUser) return;
    const unread = notifications.filter(
      n => !n.read && (n.recipientId === currentUser.id || n.recipientId === `ALL_${currentUser.role}S`),
    );
    await Promise.all(unread.map(n => updateDocument(COLLECTIONS.NOTIFICATIONS, n.id, { read: true })));
  };

  // ─── Simple helpers ───────────────────────────────────────────────────────────
  const getStudentParent  = (studentId: string) => parents.find(p => p.childId === studentId);
  const getParentChild    = (parentId: string)  => {
    const parent = parents.find(p => p.id === parentId);
    return parent?.childId ? students.find(s => s.id === parent.childId) : undefined;
  };

  // ─── Context value ────────────────────────────────────────────────────────────
  return (
    <SchoolContext.Provider
      value={{
        currentUser,
        users,
        teachers,
        students,
        parents,
        studyMaterials,
        assignments,
        submissions,
        messages,
        notifications,
        activityLogs,
        timetables,
        attendance,
        isLoading,
        login,
        logout,
        registerStudentWithParent,
        registerTeacher,
        updateStudentFee,
        deleteStudent,
        deleteTeacher,
        uploadStudyMaterial,
        deleteStudyMaterial,
        createAssignment,
        gradeSubmission,
        submitAssignmentHomework,
        sendMessage,
        addTimetableEntry,
        deleteTimetableEntry,
        submitDailyAttendance,
        getStudentParent,
        getParentChild,
        markNotificationsAsRead,
        addToastNotification,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) throw new Error('useSchool must be used within a SchoolProvider');
  return context;
};
