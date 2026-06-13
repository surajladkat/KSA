/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { ClassGrade, StudyMaterial, Assignment, AttendanceStatus, AttendanceRecord } from '../../types';
import { decryptData } from '../../cryptoUtils';
import { Upload, PlusCircle, CheckSquare, MessageSquare, BookOpen, Send, Lock, Unlock, Award, ChevronRight, FileText, Calendar, Download, AlertCircle, Trash2, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

// HELPER: Get correct MIME type based on file extension
const getMimeType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'pdf': return 'application/pdf';
    case 'doc':
    case 'docx': return 'application/msword';
    default: return 'text/plain'; // fallback
  }
};

// HELPER: Convert Base64/DataURL to Blob for correct downloading
const dataURItoBlob = (dataURI: string): Blob => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

export default function TeacherDashboard() {
  const {
    currentUser,
    students,
    parents,
    studyMaterials,
    assignments,
    submissions,
    messages,
    timetables,
    attendance,
    sendMessage,
    uploadStudyMaterial,
    deleteStudyMaterial,
    createAssignment,
    gradeSubmission,
    submitDailyAttendance,
    deleteSubmission // ✅ NEW: Added delete function from context
  } = useSchool();

  const teacher = currentUser as any;

  const [activeSubTab, setActiveSubTab] = useState<'material' | 'assignment' | 'submissions' | 'communications' | 'timetable' | 'attendance'>('submissions');

  // Attendance states
  const [attClass, setAttClass] = useState<ClassGrade>(teacher?.classes?.[0] || '9th');
  const [attSubject, setAttSubject] = useState<string>(teacher?.subjects?.[0] || '');
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [attRecords, setAttRecords] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>({});

  const activeClassStudents = students.filter(s => s.classGrade === attClass);
  
  React.useEffect(() => {
    const initial: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    activeClassStudents.forEach(st => {
      const existing = attendance.find(
        r => r.studentId === st.id && r.classGrade === attClass && r.subject === attSubject && r.date === attDate
      );
      initial[st.id] = {
        status: existing?.status || 'PRESENT',
        remarks: existing?.remarks || ''
      };
    });
    setAttRecords(initial);
  }, [attClass, attSubject, attDate, students, attendance]);

  // Study material form state
  const [matTitle, setMatTitle] = useState('');
  const [matDesc, setMatDesc] = useState('');
  const [matClass, setMatClass] = useState<ClassGrade>(teacher?.classes?.[0] || '9th');
  const [matSubject, setMatSubject] = useState(teacher?.subjects?.[0] || '');
  const [matFileName, setMatFileName] = useState('');
  const [matFileContent, setMatFileContent] = useState('');
  const [matLink, setMatLink] = useState(''); 
  const [matDragActive, setMatDragActive] = useState(false);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Assignment form state
  const [asgTitle, setAsgTitle] = useState('');
  const [asgDesc, setAsgDesc] = useState('');
  const [asgClass, setAsgClass] = useState<ClassGrade>(teacher?.classes?.[0] || '9th');
  const [asgSubject, setAsgSubject] = useState(teacher?.subjects?.[0] || '');
  const [asgDueDate, setAsgDueDate] = useState('');

  // Grading states
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null); // ✅ NEW: State for deleting submission
  const [inputGrade, setInputGrade] = useState('');
  const [inputFeedback, setInputFeedback] = useState('');

  // Communication states
  const [selectedParentId, setSelectedParentId] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [whatsappInfo, setWhatsappInfo] = useState<{ url: string; parentName: string; phone: string } | null>(null);

  const handleMaterialFile = (file: File) => {
    if (!file) return;
    setMatFileName(file.name);
    setUploadedFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    
    const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    setMatTitle(prev => prev ? prev : cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1));
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string || '';
      setMatFileContent(content);
    };
    reader.readAsDataURL(file); 
  };

  const handleDownloadHomeworkFile = (fileName: string, encryptedContent: string) => {
    try {
      const decrypted = decryptData(encryptedContent, 'SCHOOL_SECRET_KEY');
      let blob: Blob;

      if (decrypted.startsWith('data:')) {
        blob = dataURItoBlob(decrypted);
      } else {
        const mimeType = getMimeType(fileName);
        blob = new Blob([decrypted], { type: `${mimeType};charset=utf-8` });
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download homework file', e);
      alert('There was an error decoding this file.');
    }
  };

  const handleDownloadMaterialFile = (fileName: string, encryptedContent: string) => {
    try {
      const decrypted = decryptData(encryptedContent, 'SCHOOL_SECRET_KEY');
      let blob: Blob;

      if (decrypted.startsWith('data:')) {
        blob = dataURItoBlob(decrypted);
      } else {
        const mimeType = getMimeType(fileName);
        blob = new Blob([decrypted], { type: `${mimeType};charset=utf-8` });
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download material file', e);
      alert('There was an error decoding this material file.');
    }
  };

  const handleMaterialUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matTitle || !matDesc) {
      alert("Please provide a Title and Description.");
      return;
    }
    if (!matFileContent && !matLink) {
      alert("Please either attach a file OR provide a reference link (e.g., Google Drive).");
      return;
    }

    uploadStudyMaterial({
      title: matTitle,
      description: matDesc,
      classGrade: matClass,
      subject: matSubject,
      fileName: matFileName || 'External Reference Link',
      fileSize: uploadedFileSize || (matLink ? 'Web Link' : `${(matFileContent.length / 1024).toFixed(1)} KB`),
      fileContent: matFileContent || 'EXTERNAL_LINK_PROVIDED', 
      link: matLink.trim() 
    } as any);

    setMatTitle('');
    setMatDesc('');
    setMatFileName('');
    setMatFileContent('');
    setMatLink('');
    setUploadedFileSize(null);
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asgTitle || !asgDesc || !asgDueDate) return;

    createAssignment({
      title: asgTitle,
      description: asgDesc,
      classGrade: asgClass,
      subject: asgSubject,
      dueDate: new Date(asgDueDate).toISOString()
    });

    setAsgTitle('');
    setAsgDesc('');
    setAsgDueDate('');
  };

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubId || !inputGrade) return;

    gradeSubmission(selectedSubId, inputGrade, inputFeedback);
    setSelectedSubId(null);
    setInputGrade('');
    setInputFeedback('');
  };

  const handleSendInternalWebsiteMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParentId || !chatInput.trim()) return;

    sendMessage(selectedParentId, chatInput.trim());
    setChatInput('');
  };

  const handleSendWhatsAppReport = () => {
    if (!selectedParentId || !chatInput.trim()) return;

    const parentUser = parents.find(p => p.id === selectedParentId);
    
    sendMessage(selectedParentId, chatInput.trim());

    if (parentUser && parentUser.mobileNumber) {
      const student = students.find(s => s.id === parentUser.childId);
      const studentSubmissions = submissions.filter(
        sub => sub.studentId === student?.id && sub.status === 'GRADED'
      );

      let homeworkReport = 'No homework items graded yet in system.';
      if (studentSubmissions.length > 0) {
        homeworkReport = studentSubmissions.map(
          sub => `• ${sub.assignmentTitle}: Grade [${sub.grade || 'N/A'}] feedback "${sub.feedback || 'Excellent'}"`
        ).join('\n');
      }

      const reportText = `*ACADEMY STUDENT PROGRESS LOG*\n` +
        `----------------------------------------\n` +
        `*Dear ${parentUser.name},*\n\n` +
        `Here is the official progress report for your child *${student?.name || parentUser.childName || 'N/A'}*:\n\n` +
        `*💬 Teacher Message Memo:*\n` +
        `"${chatInput}"\n\n` +
        `*📊 Enrollment batch:*\n` +
        `- Class: ${student?.classGrade || parentUser.childClass || 'N/A'}\n` +
        `- Enrollment Card ID: ${student?.studentIdCardNum || 'N/A'}\n` +
        `*📚 Academic Coursework Submissions Graded:*\n` +
        `${homeworkReport}\n\n` +
        `----------------------------------------\n` +
        `_Sent securely via Academy Official Gateway._`;

      const cleanPhone = parentUser.mobileNumber.replace(/[^0-9+]/g, '');
      const waUrl = `https://wa.me/${cleanPhone}/?text=${encodeURIComponent(reportText)}`;

      setWhatsappInfo({
        url: waUrl,
        parentName: parentUser.name,
        phone: parentUser.mobileNumber
      });

      try {
        window.open(waUrl, '_blank');
      } catch (err) {
        console.warn('Browser popups blocked automatic WhatsApp opening', err);
      }
    }

    setChatInput('');
  };

  const myAssignmentIds = assignments
    .filter(a => a.uploadedBy === currentUser?.id)
    .map(a => a.id);

  const teacherSubmissions = submissions.filter(s => 
    myAssignmentIds.includes(s.assignmentId)
  );

  const filteredMessages = messages.filter(m => 
    selectedParentId 
      ? (m.senderId === currentUser?.id && m.receiverId === selectedParentId) || (m.senderId === selectedParentId && m.receiverId === currentUser?.id)
      : (m.senderId === currentUser?.id || m.receiverId === currentUser?.id)
  ).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const parentChoices = parents
    .filter(p => p.childClass && teacher?.classes?.includes(p.childClass))
    .map(p => ({
      id: p.id,
      display: `${p.name} (Parent of ${p.childName}, Class ${p.childClass})`
    }));

  const gradedCount = teacherSubmissions.filter(s => s.status === 'GRADED').length;
  const pendingEvaluation = teacherSubmissions.filter(s => s.status !== 'GRADED').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-1">
      {/* Sidebar layout */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm col-span-1 h-fit space-y-2">
        <div className="px-3 py-2 mb-4 border-b border-slate-100 pb-4">
          <p className="text-xs font-semibold text-emerald-600 tracking-wider uppercase">Faculty Lounge</p>
          <p className="text-sm font-bold text-slate-800 mt-1">{currentUser?.name}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {(currentUser as any)?.subjects?.map((s: string) => (
              <span key={s} className="px-1.5 py-0.5 bg-slate-100 text-[9px] text-slate-500 font-bold rounded">
                {s}
              </span>
            ))}
          </div>
        </div>

        <button 
          onClick={() => setActiveSubTab('submissions')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'submissions' 
              ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CheckSquare className="w-4 h-4 text-indigo-600" />
          Grades & Submissions ({pendingEvaluation})
        </button>

        <button 
          onClick={() => setActiveSubTab('material')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'material' 
              ? 'bg-cyan-50 text-cyan-800 border border-cyan-200' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Upload className="w-4 h-4 text-cyan-600" />
          Upload Study Material
        </button>

        <button 
          onClick={() => setActiveSubTab('assignment')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'assignment' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-emerald-600" />
          Assign Homework Task
        </button>

        <button 
          onClick={() => setActiveSubTab('communications')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'communications' 
              ? 'bg-amber-50 text-amber-800 border border-amber-200' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-amber-600" />
          Dialogue Portal ({selectedParentId ? 'Active Conversation' : 'All Memos'})
        </button>

        <button 
          onClick={() => setActiveSubTab('attendance')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'attendance' 
              ? 'bg-rose-50 text-rose-805 text-rose-800 border border-rose-200' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CheckSquare className="w-4 h-4 text-rose-600" />
          Attendance Roll Call
        </button>

        <button 
          onClick={() => setActiveSubTab('timetable')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'timetable' 
              ? 'bg-sky-50 text-sky-850 text-sky-800 border border-sky-100' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4 text-sky-600" />
          My Assigned Timetable
        </button>
      </div>

      {/* Main Panel Area */}
      <motion.div 
        key={activeSubTab}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="lg:col-span-3 space-y-6"
      >

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-center gap-6 justify-between font-sans">
          <div className="space-y-1">
            <p className="text-xs text-slate-450 font-bold uppercase tracking-wider font-mono">Academic Achievement Stats</p>
            <div className="flex flex-wrap gap-4 pt-1">
              <span className="text-xs font-semibold text-slate-600">✍️ {pendingEvaluation} Homework Submissions Pending</span>
              <span className="text-xs font-semibold text-slate-600">✅ {gradedCount} Tasks Evaluated</span>
            </div>
          </div>
          
          <div className="w-full md:w-48 bg-slate-50 rounded-lg p-2.5 border border-dashed border-slate-200">
            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider font-mono">Evaluation Rate</p>
            <div className="flex justify-between items-baseline mt-1 font-mono">
              <span className="text-lg font-bold text-blue-600">
                {teacherSubmissions.length ? Math.round((gradedCount / teacherSubmissions.length) * 100) : 100}%
              </span>
              <span className="text-[10px] text-slate-400">{gradedCount} of {teacherSubmissions.length}</span>
            </div>
          </div>
        </div>

        {/* Selected Mode displays */}
        {activeSubTab === 'submissions' && (
          <div className="space-y-6">
            
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-sans">Pending & Graded Homeworks</h2>
                <p className="text-xs text-slate-405 text-slate-400 mt-1 font-sans">Review student task solutions and enter marks directly below.</p>
              </div>

              {teacherSubmissions.length === 0 ? (
                <p className="text-xs italic text-slate-400 py-6 text-center font-sans">No student assignments submitted yet.</p>
              ) : (
                <div className="space-y-5">
                  {teacherSubmissions.map(sub => {
                    const displayContent = decryptData(sub.submittedContent, 'SCHOOL_SECRET_KEY');
                    
                    const isImage = displayContent.startsWith('data:image/');
                    const isOtherFile = displayContent.startsWith('data:') && !isImage;
                    
                    const safeContent = displayContent.length > 3000 
                      ? displayContent.substring(0, 3000) + '\n\n... [Content Truncated due to large image size. Please download the Answer Sheet file to view properly.]' 
                      : displayContent;

                    return (
                      <div key={sub.id} className="border border-slate-200 rounded-xl p-5 bg-slate-50/30 space-y-4 shadow-sm hover:border-blue-200 transition-colors">
                        
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b border-slate-100 pb-3">
                          <div>
                            <p className="text-sm font-bold text-slate-800 font-sans">{sub.assignmentTitle}</p>
                            <p className="text-xs text-slate-500 mt-1 font-sans">
                              Submitted by <strong className="text-blue-700">{sub.studentName}</strong> (Class {sub.classGrade}) • {new Date(sub.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold font-mono uppercase tracking-wider ${
                            sub.status === 'GRADED' 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {sub.status === 'GRADED' ? `Grade: ${sub.grade}` : 'Pending review'}
                          </span>
                        </div>

                        {sub.fileName && (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                              <div className="min-w-0">
                                <span className="font-bold text-blue-900 truncate block font-sans">{sub.fileName}</span>
                                <span className="text-[10px] text-blue-600 font-mono block mt-0.5">Attached File size: {sub.fileSize}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDownloadHomeworkFile(sub.fileName!, sub.submittedContent)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg flex items-center justify-center gap-1.5 transition whitespace-nowrap cursor-pointer shadow-sm"
                            >
                              <Download className="w-4 h-4 text-white" />
                              Download Answer Sheet
                            </button>
                          </div>
                        )}

                        <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                          <div className="border-b border-slate-100 pb-1.5 font-sans">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Student Submitted Answer
                            </span>
                          </div>
                          <div className="max-h-96 overflow-y-auto custom-scrollbar p-1">
                            {isImage ? (
                              <img src={displayContent} alt="Student Work" className="w-full max-w-2xl h-auto rounded border border-slate-200 shadow-sm" />
                            ) : isOtherFile ? (
                              <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
                                <FileText className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-xs italic">Document attached. Click "Download Answer Sheet" above to view.</p>
                              </div>
                            ) : (
                              <p className="font-mono text-[11px] text-slate-600 whitespace-pre-wrap leading-relaxed break-all">
                                {safeContent}
                              </p>
                            )}
                          </div>
                        </div>

                        {sub.feedback && (
                          <div className="bg-emerald-50/40 p-3 rounded-lg border border-emerald-100 text-xs">
                            <p className="font-bold text-emerald-800 font-mono flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              Your Evaluation Remarks:
                            </p>
                            <p className="text-slate-700 mt-1.5 font-sans">"{sub.feedback}"</p>
                          </div>
                        )}

                        {/* ✅ NEW: Delete / Assess State Handling */}
                        {deletingSubId === sub.id ? (
                          <div className="mt-4 bg-red-50/50 p-3 rounded-lg border border-red-100 flex flex-col gap-2 animate-fade-in">
                            <span className="text-[11px] font-bold text-red-700 uppercase tracking-wide font-mono text-center">Delete this record permanently?</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (deleteSubmission) deleteSubmission(sub.id);
                                  setDeletingSubId(null);
                                }}
                                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition shadow-sm cursor-pointer"
                              >
                                Confirm Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingSubId(null)}
                                className="flex-1 py-2 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-xs rounded-lg transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : selectedSubId === sub.id ? (
                          <form onSubmit={handleGradeSubmit} className="mt-4 bg-slate-100 border border-slate-200 rounded-xl p-4 space-y-4 animate-fade-in">
                            <h4 className="text-xs font-bold text-blue-800 flex items-center gap-1.5 font-mono uppercase tracking-wide">
                              <Award className="w-4 h-4" /> Evaluate Submission
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-600">Assign Grade / Score</label>
                                <input 
                                  type="text"
                                  required
                                  placeholder="e.g. A+, 92/100, Excellent"
                                  value={inputGrade}
                                  onChange={e => setInputGrade(e.target.value)}
                                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-blue-500 font-bold"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-600">Feedback Remarks</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Good job, check question 2..."
                                  value={inputFeedback}
                                  onChange={e => setInputFeedback(e.target.value)}
                                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:outline-blue-500"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 pt-2 border-t border-slate-200">
                              <button
                                type="submit"
                                className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-sm"
                              >
                                Publish Grade & Alert Student
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedSubId(null)}
                                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="mt-3 flex gap-2">
                            {sub.status !== 'GRADED' && (
                              <button
                                onClick={() => {
                                  setSelectedSubId(sub.id);
                                  setInputGrade('');
                                  setInputFeedback('');
                                }}
                                className="flex-1 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition cursor-pointer font-sans shadow-sm"
                              >
                                Assess & Give Marks
                              </button>
                            )}
                            <button
                              onClick={() => setDeletingSubId(sub.id)}
                              className="px-4 py-2.5 bg-white border border-slate-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                              title="Delete this record to clear space"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Record
                            </button>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Material */}
        {activeSubTab === 'material' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 xl:col-span-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-sans pb-1 justify-between">
                  <span className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-600" />
                    Upload Course Study Materials
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-sans">Upload handouts or syllabi, or directly link to Google Drive/Web Resources.</p>
              </div>

              <div className="space-y-1.5 font-sans">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wide">Option 1: Drag & Drop File</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setMatDragActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setMatDragActive(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setMatDragActive(false);
                    if (e.dataTransfer.files?.[0]) handleMaterialFile(e.dataTransfer.files[0]);
                  }}
                  onClick={() => document.getElementById('teacher-mat-file-input')?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    matDragActive 
                      ? 'border-blue-500 bg-blue-50 text-blue-800' 
                      : matFileName 
                      ? 'border-emerald-300 bg-emerald-50/20' 
                      : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50'
                  }`}
                >
                  <input
                    type="file"
                    id="teacher-mat-file-input"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleMaterialFile(e.target.files[0]);
                    }}
                  />
                  {matFileName ? (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                        <span className="p-1 bg-emerald-100 rounded text-emerald-700">✓ Detected</span>
                        {matFileName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">Size: {uploadedFileSize} • Click or drag to replace</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <p className="text-xs font-semibold text-slate-600">
                        Drag and drop a PDF, Word, or image here, or <span className="text-blue-600 underline">browse</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs text-slate-500 font-bold uppercase tracking-wide">Option 2: Reference Link (Google Drive / Web)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon className="h-4 w-4 text-slate-400" />
                  </div>
                  <input 
                    type="url"
                    placeholder="https://drive.google.com/file/d/..."
                    value={matLink}
                    onChange={e => setMatLink(e.target.value)}
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg py-3 pl-10 pr-4 bg-slate-50/50 focus:bg-white focus:outline-blue-500 transition-all placeholder-slate-400"
                  />
                </div>
                <p className="text-[10px] text-slate-400 italic">If you provide a link, students will be redirected directly to this URL instead of downloading a file.</p>
              </div>

              <form onSubmit={handleMaterialUpload} className="space-y-4 font-sans border-t border-slate-100 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-medium font-sans">Document Title</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Kinematics Equations"
                      value={matTitle}
                      onChange={e => setMatTitle(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-medium font-sans">Subject Topic</label>
                    <select
                      value={matSubject}
                      onChange={e => setMatSubject(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-blue-500"
                    >
                      {teacher?.subjects?.length > 0 ? (
                        teacher.subjects.map((sub: string) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))
                      ) : (
                        <option value="">No Subjects Assigned</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-medium font-sans">Target Class Folder</label>
                    <select
                      value={matClass}
                      onChange={e => setMatClass(e.target.value as ClassGrade)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-blue-500"
                    >
                      {teacher?.classes?.length > 0 ? (
                        teacher.classes.map((cls: string) => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))
                      ) : (
                        <option value="">No Classes Assigned</option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-medium font-sans">Short Description</label>
                    <input 
                      type="text"
                      required
                      placeholder="Brief details about the study material..."
                      value={matDesc}
                      onChange={e => setMatDesc(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-blue-500"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 cursor-pointer transition shadow-xs font-sans mt-2"
                >
                  <Upload className="w-4 h-4" />
                  Publish Study Material to Class {matClass}
                </button>
              </form>
            </div>

            {/* List side panel */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 h-fit">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  Uploaded Catalog
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Reference documents uploaded to Class lockers.</p>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {studyMaterials.length === 0 ? (
                  <p className="text-xs italic text-slate-400 py-6 text-center font-sans animate-pulse">No materials posted yet.</p>
                ) : (
                  studyMaterials.map((mat) => (
                    <div key={mat.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50/40 space-y-2.5 hover:border-slate-300 transition-colors">
                      <div>
                        <div className="flex justify-between items-center text-[9px] font-bold font-mono mb-1">
                          <span className="text-blue-700 uppercase bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                            {mat.subject}
                          </span>
                          <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            Class {mat.classGrade}
                          </span>
                        </div>
                        <h4 className="text-xs font-extrabold text-slate-800 mt-1.5 font-sans truncate" title={mat.title}>{mat.title}</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate flex items-center gap-1">
                          {(mat as any).link ? (
                            <><LinkIcon className="w-3 h-3 text-blue-500" /> Reference Web Link</>
                          ) : (
                            <><FileText className="w-3 h-3 text-slate-400" /> {mat.fileName} ({mat.fileSize})</>
                          )}
                        </p>
                      </div>

                      {deletingId === mat.id ? (
                        <div className="bg-red-50/50 p-2 rounded-lg border border-red-100/60 flex flex-col gap-2">
                          <span className="text-[10px] font-extrabold text-red-700 uppercase tracking-wide font-mono text-center">Delete permanently?</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                deleteStudyMaterial(mat.id);
                                setDeletingId(null);
                              }}
                              className="flex-1 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded transition cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(null)}
                              className="flex-1 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold text-[10px] rounded transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-between">
                          {(mat as any).link ? (
                            <a
                              href={(mat as any).link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[11px] font-bold rounded flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                              <LinkIcon className="w-3.5 h-3.5" />
                              Open Link
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDownloadMaterialFile(mat.fileName, mat.fileContent)}
                              className="flex-1 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-500" />
                              Download
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setDeletingId(mat.id)}
                            className="p-1.5 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-600 rounded flex items-center justify-center transition cursor-pointer"
                            title="Delete this study material"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Assign Homework */}
        {activeSubTab === 'assignment' && (
          <div className="bg-white rounded-xl border border-slate-205 border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-sans">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                Assign Homework Task / Specific Study Groups
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-sans">Post a new assignment. Targeted students and their parents will be notified instantly via system-wide sync.</p>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4 font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-medium font-sans">Assignment Title</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Exercise 4.2 Quadratic Formulas"
                    value={asgTitle}
                    onChange={e => setAsgTitle(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:outline-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-medium font-sans">Due Date & Completion Time</label>
                  <input 
                    type="datetime-local"
                    required
                    value={asgDueDate}
                    onChange={e => setAsgDueDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:outline-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-medium font-sans">Subject Category</label>
                  <select
                    value={asgSubject}
                    onChange={e => setAsgSubject(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:outline-blue-500 font-sans"
                  >
                    {teacher?.subjects?.length > 0 ? (
                      teacher.subjects.map((sub: string) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))
                    ) : (
                      <option value="">No Subjects Assigned</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-medium font-sans">Target Class Level</label>
                  <select
                    value={asgClass}
                    onChange={e => setAsgClass(e.target.value as ClassGrade)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:outline-blue-500 font-sans"
                  >
                    {teacher?.classes?.length > 0 ? (
                      teacher.classes.map((cls: string) => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))
                    ) : (
                      <option value="">No Classes Assigned</option>
                    )}
                  </select>
                </div>

              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-medium font-sans">Assignment Guidelines & Instructions</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe precisely what students should complete, write out equations or reference sections, and outline expectations..."
                  value={asgDesc}
                  onChange={e => setAsgDesc(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:outline-blue-500"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                Assign Homework and Alert Student-Parent Network
              </button>
            </form>
          </div>
        )}

        {/* Communication Portal */}
        {activeSubTab === 'communications' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-sans">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Dual-Channel Communication Portal
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-sans">Chat directly through this website portal or optionally push professional report layouts to WhatsApp.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
              
              {/* Left Form: Select Parent & Write Message */}
              <div className="md:col-span-1 border border-slate-200 p-4 rounded-xl h-fit space-y-4 bg-white shadow-2xs">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center gap-1.5 font-mono">
                  <Lock className="w-3.5 h-3.5 text-blue-600" /> Dialogue Dispatcher
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-medium font-mono">Select Parent Recipient</label>
                  <select
                    value={selectedParentId}
                    onChange={e => {
                      setSelectedParentId(e.target.value);
                      setWhatsappInfo(null);
                    }}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50 focus:bg-white"
                  >
                    <option value="">-- Choose a parent --</option>
                    {parentChoices.map(p => (
                      <option key={p.id} value={p.id}>{p.display}</option>
                    ))}
                  </select>

                  {selectedParentId && (
                    <div className="text-[10px] leading-relaxed pt-1">
                      {parents.find(p => p.id === selectedParentId)?.mobileNumber ? (
                        <span className="text-emerald-700 font-semibold block font-mono">
                          🟢 WhatsApp Active: {parents.find(p => p.id === selectedParentId)?.mobileNumber}
                        </span>
                      ) : (
                        <span className="text-red-500 font-bold block">⚠️ No Contact Number Mapped</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-medium">Message Content</label>
                  <textarea
                    rows={4}
                    placeholder="Type message text here..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    disabled={!selectedParentId}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white disabled:opacity-50"
                  />
                </div>

                {whatsappInfo && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-[11px] text-emerald-800 space-y-2 font-sans animate-fade-in">
                    <p className="font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      WhatsApp Link Ready
                    </p>
                    <a
                      href={whatsappInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-center text-xs font-bold flex items-center justify-center gap-1"
                    >
                      💬 Open WhatsApp Window
                    </a>
                  </div>
                )}

                {/* DUAL CHANNEL ACTION BUTTONS */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSendInternalWebsiteMessage}
                    disabled={!selectedParentId || !chatInput.trim()}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer shadow-xs"
                  >
                    Send Direct Website Message
                  </button>
                  <button
                    type="button"
                    onClick={handleSendWhatsAppReport}
                    disabled={!selectedParentId || !chatInput.trim()}
                    className="w-full py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 disabled:opacity-50 transition cursor-pointer"
                  >
                    Push to WhatsApp Report
                  </button>
                </div>
              </div>

              {/* Right Box: Chat History Stream View */}
              <div className="md:col-span-2 border border-slate-200 rounded-xl p-4 h-[420px] flex flex-col justify-between bg-slate-50/30 shadow-2xs">
                <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide font-mono">
                    {selectedParentId 
                      ? `Conversation Channel: ${parents.find(p => p.id === selectedParentId)?.name}` 
                      : 'Website Live Feed Log'}
                  </h3>
                  <span className="text-[9px] font-mono bg-blue-50 text-blue-700 border border-blue-150 px-2 py-0.5 rounded-md font-bold">In-App Chat Sync</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-3 custom-scrollbar">
                  {filteredMessages.length === 0 ? (
                    <div className="text-center py-16">
                      <p className="text-xs text-slate-400 italic">No communication items found. Select a parent to begin live internal dialogue stream.</p>
                    </div>
                  ) : (
                    filteredMessages.map(msg => {
                      const isMe = msg.senderId === currentUser?.id;
                      const decryptedText = decryptData(msg.content, 'SCHOOL_SECRET_KEY');
                      
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`p-3 rounded-xl text-xs max-w-sm shadow-2xs ${
                            isMe 
                              ? 'bg-blue-600 text-white rounded-br-none' 
                              : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
                          }`}>
                            <div className="flex items-center gap-2 opacity-75 text-[9px] mb-1 font-mono justify-between">
                              <span>{isMe ? 'You' : msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="leading-relaxed font-sans font-normal break-all">{decryptedText}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Daily Attendance Roll Call section */}
        {activeSubTab === 'attendance' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-sans pb-1">
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                  Daily Student Turnout & Roll Call
                </h2>
                <p className="text-xs text-slate-400 font-sans">
                  Select a class grade and course subject to initiate turnout roster list. Double-check statuses and hit commit to securely lock records and trigger automated parent SMS alerts.
                </p>
              </div>

              {/* Selector Toolbar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/60 p-4 rounded-xl border border-slate-200/60 font-sans">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Academic Class Grade</label>
                  <select
                    value={attClass}
                    onChange={(e) => setAttClass(e.target.value as ClassGrade)}
                    className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-blue-500"
                  >
                    {teacher?.classes?.length > 0 ? (
                      teacher.classes.map((cls: string) => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))
                    ) : (
                      <option value="">No Classes Assigned</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Lecture Subject</label>
                  <select
                    value={attSubject}
                    onChange={(e) => setAttSubject(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-blue-500"
                  >
                    {teacher?.subjects?.length > 0 ? (
                      teacher.subjects.map((sub: string) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))
                    ) : (
                      <option value="">No Subjects Assigned</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Attendance Date</label>
                  <input
                    type="date"
                    required
                    value={attDate}
                    onChange={(e) => setAttDate(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Quick action bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans pt-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                  Roster: <strong className="text-slate-700">{activeClassStudents.length} Students</strong> registered in {attClass}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...attRecords };
                      activeClassStudents.forEach(st => {
                        updated[st.id] = { ...(updated[st.id] || { remarks: '' }), status: 'PRESENT' };
                      });
                      setAttRecords(updated);
                    }}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 rounded-lg text-xs font-bold transition border border-emerald-100 cursor-pointer"
                  >
                    Mark All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...attRecords };
                      activeClassStudents.forEach(st => {
                        updated[st.id] = { ...(updated[st.id] || { remarks: '' }), status: 'ABSENT' };
                      });
                      setAttRecords(updated);
                    }}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100/80 rounded-lg text-xs font-bold transition border border-rose-100 cursor-pointer"
                  >
                    Mark All Absent
                  </button>
                </div>
              </div>

              {/* Student Roll Call List */}
              <div className="space-y-3 font-sans">
                {activeClassStudents.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl space-y-2">
                    <p className="text-sm text-slate-500 italic">No students registered in {attClass} yet.</p>
                    <p className="text-[10px] text-slate-400">Please select a different class or ask Admin to enroll students.</p>
                  </div>
                ) : (
                  <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {activeClassStudents.map((st) => {
                      const currentStatus = attRecords[st.id]?.status || 'PRESENT';
                      const currentRemarks = attRecords[st.id]?.remarks || '';

                      return (
                        <div key={st.id} className="p-4 bg-slate-50/15 hover:bg-slate-50/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-slate-800 tracking-tight">{st.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {st.studentIdCardNum} • seat: {st.seatNumber || 'Unassigned'}</p>
                          </div>

                          {/* Interactive Roster Selection Capsules */}
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setAttRecords(prev => ({
                                  ...prev,
                                  [st.id]: { ...(prev[st.id] || { remarks: '' }), status: 'PRESENT' }
                                }));
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                currentStatus === 'PRESENT'
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              } cursor-pointer`}
                            >
                              Present
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setAttRecords(prev => ({
                                  ...prev,
                                  [st.id]: { ...(prev[st.id] || { remarks: '' }), status: 'ABSENT' }
                                }));
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                currentStatus === 'ABSENT'
                                  ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              } cursor-pointer`}
                            >
                              Absent
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setAttRecords(prev => ({
                                  ...prev,
                                  [st.id]: { ...(prev[st.id] || { remarks: '' }), status: 'LATE' }
                                }));
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                currentStatus === 'LATE'
                                  ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              } cursor-pointer`}
                            >
                              Late
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setAttRecords(prev => ({
                                  ...prev,
                                  [st.id]: { ...(prev[st.id] || { remarks: '' }), status: 'EXCUSED' }
                                }));
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                currentStatus === 'EXCUSED'
                                  ? 'bg-slate-500 border-slate-500 text-white shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              } cursor-pointer`}
                            >
                              Excused
                            </button>

                            <input
                              type="text"
                              placeholder="Add remarks..."
                              value={currentRemarks}
                              onChange={(e) => {
                                setAttRecords(prev => ({
                                  ...prev,
                                  [st.id]: { ...(prev[st.id] || { status: 'PRESENT' }), remarks: e.target.value }
                                }));
                              }}
                              className="text-[11px] p-1.5 border border-slate-200 rounded-md focus:outline-blue-500 w-32 md:w-40 ml-1 font-sans bg-white"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Commit Roll Call trigger button */}
              {activeClassStudents.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const formattedRecords = activeClassStudents.map(st => ({
                      studentId: st.id,
                      studentName: st.name,
                      status: attRecords[st.id]?.status || 'PRESENT',
                      remarks: attRecords[st.id]?.remarks || ''
                    }));
                    submitDailyAttendance({
                      classGrade: attClass,
                      subject: attSubject,
                      date: attDate,
                      records: formattedRecords
                    });
                    alert(`Roll Call Attendance details for Class ${attClass} on date ${attDate} successfully written & parents informed!`);
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-2 transition shadow-xs cursor-pointer uppercase tracking-wider font-mono"
                >
                  <Lock className="w-4 h-4" />
                  Lock & Submit Class {attClass} Roll Call
                </button>
              )}
            </div>

            {/* Turnout History of past locked dates */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  Turnout Dashboard Logs
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">Historical overview of daily turnout locked across courses.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Visual statistics */}
                <div className="border border-slate-100 p-4.5 bg-slate-50/30 rounded-xl space-y-3 font-sans">
                  <h4 className="text-xs font-bold text-slate-650 tracking-wide uppercase font-mono text-slate-500">Global Attendance Overview</h4>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-emerald-50/50 border border-emerald-100/60 rounded-lg p-2.5 text-center">
                      <span className="text-[10px] text-emerald-700 block font-bold font-mono">PRESENT</span>
                      <strong className="text-lg text-emerald-900 font-black">
                        {attendance.filter(r => r.status === 'PRESENT').length}
                      </strong>
                    </div>
                    <div className="bg-rose-50/50 border border-rose-100/60 rounded-lg p-2.5 text-center">
                      <span className="text-[10px] text-rose-700 block font-bold font-mono">ABSENT</span>
                      <strong className="text-lg text-rose-900 font-black">
                        {attendance.filter(r => r.status === 'ABSENT').length}
                      </strong>
                    </div>
                    <div className="bg-amber-50/50 border border-amber-100/60 rounded-lg p-2.5 text-center">
                      <span className="text-[10px] text-amber-700 block font-bold font-mono">LATE</span>
                      <strong className="text-lg text-amber-950 font-black">
                        {attendance.filter(r => r.status === 'LATE').length}
                      </strong>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                    Total Turnout entries cataloged: {attendance.length} items logged by school staff members.
                  </p>
                </div>

                {/* Chronicled Table */}
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/10 space-y-2 max-h-[290px] overflow-y-auto">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide font-mono pb-1 border-b border-slate-100">Live Turnout Chronicle</h4>
                  {attendance.length === 0 ? (
                    <p className="text-xs text-slate-400 italic font-mono pt-4 text-center">No logs generated.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {[...attendance].reverse().slice(0, 15).map(log => (
                        <div key={log.id} className="py-2 flex items-center justify-between text-[11px] font-sans">
                          <div>
                            <span className="font-bold text-slate-800">{log.studentName}</span>
                            <span className="text-slate-400 font-mono block text-[9.5px]">
                              {log.date} • {log.subject} ({log.classGrade})
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded font-black text-[9px] font-mono ${
                            log.status === 'PRESENT'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : log.status === 'ABSENT'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : log.status === 'LATE'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Assigned Timetable view */}
        {activeSubTab === 'timetable' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-sans pb-1">
                <Calendar className="w-5 h-5 text-blue-600" />
                My Weekly Lecture Schedule
              </h2>
              <p className="text-xs text-slate-400 font-sans">View your assigned teaching sessions, active classes, and period intervals structured by administration.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(dayName => {
                const slots = timetables.filter(t => t.teacherName?.toLowerCase() === currentUser?.name?.toLowerCase() && t.day === dayName);
                return (
                  <div key={dayName} className="border border-slate-200 rounded-xl p-4.5 bg-slate-50/20 space-y-3 font-sans">
                    <h3 className="text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-100 py-1 px-2.5 rounded w-fit font-mono">
                      {dayName}
                    </h3>

                    {slots.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic py-2 pl-1">No teaching slots structured for {dayName}.</p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {slots.map(slot => (
                          <div key={slot.id} className="py-2.5 flex justify-between items-center text-xs">
                            <div>
                              <p className="font-bold text-slate-800">{slot.subject}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{slot.timeSlot}</p>
                            </div>
                            <span className="text-[10.5px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-black font-mono">
                              {slot.classGrade}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
}