import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  ActiveSession,
  AttendanceMethod,
  AttendanceRecord,
  AttendanceStatus,
  ClassItem,
  Enrollment,
  ExcuseRequest,
  NotificationLog,
  User,
  UserRole
} from '../types/attendance';
import {
  INITIAL_CLASSES,
  INITIAL_ENROLLMENTS,
  INITIAL_EXCUSES,
  INITIAL_NOTIFICATIONS,
  INITIAL_RECORDS,
  INITIAL_USERS
} from '../data/initialData';
import { calculateDistanceMeters } from '../utils/geo';
import { downloadCSV, exportDailyAttendanceCSV, exportSemesterSummaryCSV } from '../utils/exportCsv';

interface CheckInResult {
  success: boolean;
  message: string;
  distanceMeters?: number;
  record?: AttendanceRecord;
}

interface AttendanceContextType {
  // Users & Auth
  currentUser: User;
  setCurrentUser: (user: User) => void;
  availableUsers: User[];
  currentRole: UserRole;
  switchRole: (role: UserRole) => void;

  // Classes
  classes: ClassItem[];
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  selectedClass: ClassItem;
  addClass: (cls: Omit<ClassItem, 'id'>) => void;
  updateClass: (id: string, updates: Partial<ClassItem>) => void;

  // Date & Roll Call
  selectedDate: string;
  setSelectedDate: (date: string) => void;

  // Attendance Records
  records: AttendanceRecord[];
  markAttendance: (
    classId: string,
    studentId: string,
    date: string,
    status: AttendanceStatus,
    method?: AttendanceMethod,
    note?: string,
    verifiedLocation?: boolean,
    distanceMeters?: number
  ) => void;
  bulkMarkAttendance: (classId: string, date: string, status: AttendanceStatus) => void;
  clearDateAttendance: (classId: string, date: string) => void;

  // Enrollments & Students
  enrollments: Enrollment[];
  getStudentsForClass: (classId: string) => User[];
  getClassesForStudent: (studentId: string) => ClassItem[];
  enrollStudent: (studentId: string, classId: string) => void;
  unenrollStudent: (studentId: string, classId: string) => void;

  // Active Dynamic QR Session
  activeSession: ActiveSession | null;
  startQRSession: (classId: string, intervalSeconds?: number, geofenceRequired?: boolean) => void;
  stopQRSession: () => void;
  sessionRemainingSeconds: number;
  verifyAndCheckIn: (
    tokenOrCode: string,
    studentId: string,
    studentLat?: number,
    studentLng?: number
  ) => CheckInResult;

  // Excuses
  excuses: ExcuseRequest[];
  submitExcuse: (studentId: string, classId: string, date: string, reason: string) => void;
  updateExcuseStatus: (id: string, status: 'approved' | 'rejected', responseNote?: string) => void;

  // Automated Alerts
  notifications: NotificationLog[];
  dispatchAbsentAlerts: (classId: string, date: string) => number;

  // Downloads / Exports
  downloadDailyReport: (classId?: string, date?: string) => void;
  downloadSemesterReport: (classId?: string) => void;
  downloadStudentReport: (studentId: string, classId?: string) => void;
  downloadFullBackupJSON: () => void;

  // Reset
  resetToSampleData: () => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'attendpulse_2026_';

function getStoredOrDefault<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading storage for', key, e);
  }
  return defaultVal;
}

function saveToStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(val));
  } catch (e) {
    console.error('Failed saving storage for', key, e);
  }
}

export const AttendanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => getStoredOrDefault('users', INITIAL_USERS));
  const [classes, setClasses] = useState<ClassItem[]>(() => getStoredOrDefault('classes', INITIAL_CLASSES));
  const [enrollments, setEnrollments] = useState<Enrollment[]>(() => getStoredOrDefault('enrollments', INITIAL_ENROLLMENTS));
  const [records, setRecords] = useState<AttendanceRecord[]>(() => getStoredOrDefault('records', INITIAL_RECORDS));
  const [excuses, setExcuses] = useState<ExcuseRequest[]>(() => getStoredOrDefault('excuses', INITIAL_EXCUSES));
  const [notifications, setNotifications] = useState<NotificationLog[]>(() => getStoredOrDefault('notifications', INITIAL_NOTIFICATIONS));

  // Current session user defaults to Prof. Sarah Connor (teacher)
  const [currentUser, setCurrentUser] = useState<User>(() => users.find(u => u.id === 'teacher-1') || users[0]);
  const [selectedClassId, setSelectedClassId] = useState<string>('class-1');
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-26');

  // Active Dynamic QR Session State
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [sessionRemainingSeconds, setSessionRemainingSeconds] = useState<number>(0);

  // Sync state to LocalStorage
  useEffect(() => saveToStorage('users', users), [users]);
  useEffect(() => saveToStorage('classes', classes), [classes]);
  useEffect(() => saveToStorage('enrollments', enrollments), [enrollments]);
  useEffect(() => saveToStorage('records', records), [records]);
  useEffect(() => saveToStorage('excuses', excuses), [excuses]);
  useEffect(() => saveToStorage('notifications', notifications), [notifications]);

  // Dynamic QR Token Rotation Engine
  useEffect(() => {
    if (!activeSession) {
      setSessionRemainingSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((activeSession.expiresAt - now) / 1000));
      setSessionRemainingSeconds(diff);

      // Rotate token when expired
      if (diff <= 0) {
        const interval = activeSession.intervalSeconds || 25;
        const newToken = `TOKEN-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now()}`;
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        setActiveSession(prev => {
          if (!prev) return null;
          return {
            ...prev,
            token: newToken,
            code6Digit: newCode,
            expiresAt: Date.now() + interval * 1000,
          };
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSession]);

  const selectedClass = useMemo(() => {
    return classes.find(c => c.id === selectedClassId) || classes[0];
  }, [classes, selectedClassId]);

  const currentRole = currentUser.role;

  const switchRole = (role: UserRole) => {
    const candidate = users.find(u => u.role === role);
    if (candidate) {
      setCurrentUser(candidate);
    }
  };

  const getStudentsForClass = (classId: string): User[] => {
    const studentIds = enrollments.filter(e => e.classId === classId).map(e => e.studentId);
    return users.filter(u => u.role === 'student' && studentIds.includes(u.id));
  };

  const getClassesForStudent = (studentId: string): ClassItem[] => {
    const classIds = enrollments.filter(e => e.studentId === studentId).map(e => e.classId);
    return classes.filter(c => classIds.includes(c.id));
  };

  const markAttendance = (
    classId: string,
    studentId: string,
    date: string,
    status: AttendanceStatus,
    method: AttendanceMethod = 'manual',
    note?: string,
    verifiedLocation?: boolean,
    distanceMeters?: number
  ) => {
    setRecords(prev => {
      const existingIdx = prev.findIndex(r => r.classId === classId && r.studentId === studentId && r.date === date);
      const newRecord: AttendanceRecord = {
        id: existingIdx >= 0 ? prev[existingIdx].id : `rec-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        classId,
        studentId,
        date,
        status,
        method,
        timestamp: new Date().toISOString(),
        note: note !== undefined ? note : (existingIdx >= 0 ? prev[existingIdx].note : undefined),
        verifiedLocation,
        distanceMeters,
      };

      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = newRecord;
        return copy;
      }
      return [...prev, newRecord];
    });
  };

  const bulkMarkAttendance = (classId: string, date: string, status: AttendanceStatus) => {
    const enrolledStudents = getStudentsForClass(classId);
    setRecords(prev => {
      const updated = [...prev];
      const now = new Date().toISOString();

      enrolledStudents.forEach(student => {
        const existingIdx = updated.findIndex(r => r.classId === classId && r.studentId === student.id && r.date === date);
        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            status,
            method: 'manual',
            timestamp: now,
          };
        } else {
          updated.push({
            id: `rec-${Date.now()}-${student.id}`,
            classId,
            studentId: student.id,
            date,
            status,
            method: 'manual',
            timestamp: now,
          });
        }
      });
      return updated;
    });
  };

  const clearDateAttendance = (classId: string, date: string) => {
    setRecords(prev => prev.filter(r => !(r.classId === classId && r.date === date)));
  };

  const addClass = (clsData: Omit<ClassItem, 'id'>) => {
    const newClass: ClassItem = {
      ...clsData,
      id: `class-${Date.now()}`,
    };
    setClasses(prev => [...prev, newClass]);
    setSelectedClassId(newClass.id);
  };

  const updateClass = (id: string, updates: Partial<ClassItem>) => {
    setClasses(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  const enrollStudent = (studentId: string, classId: string) => {
    if (!enrollments.some(e => e.studentId === studentId && e.classId === classId)) {
      setEnrollments(prev => [
        ...prev,
        {
          id: `enr-${Date.now()}`,
          studentId,
          classId,
          enrolledAt: new Date().toISOString(),
        }
      ]);
    }
  };

  const unenrollStudent = (studentId: string, classId: string) => {
    setEnrollments(prev => prev.filter(e => !(e.studentId === studentId && e.classId === classId)));
  };

  const startQRSession = (classId: string, intervalSeconds: number = 25, geofenceRequired: boolean = true) => {
    const token = `TOKEN-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now()}`;
    const code6Digit = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();

    setActiveSession({
      classId,
      date: selectedDate,
      token,
      code6Digit,
      expiresAt: now + intervalSeconds * 1000,
      intervalSeconds,
      geofenceRequired,
      createdAt: now,
    });
    setSessionRemainingSeconds(intervalSeconds);
  };

  const stopQRSession = () => {
    setActiveSession(null);
    setSessionRemainingSeconds(0);
  };

  const verifyAndCheckIn = (
    tokenOrCode: string,
    studentId: string,
    studentLat?: number,
    studentLng?: number
  ): CheckInResult => {
    if (!activeSession) {
      return { success: false, message: 'No active attendance session is running for this class right now.' };
    }

    const trimmedInput = tokenOrCode.trim();
    const isTokenMatch = trimmedInput === activeSession.token;
    const isCodeMatch = trimmedInput === activeSession.code6Digit;

    if (!isTokenMatch && !isCodeMatch) {
      return { success: false, message: 'Invalid or expired QR code/PIN. Please rescan the refreshed code.' };
    }

    // Check enrollment
    const isEnrolled = enrollments.some(e => e.classId === activeSession.classId && e.studentId === studentId);
    if (!isEnrolled) {
      return { success: false, message: 'You are not officially enrolled in this class.' };
    }

    // Check if already checked in today
    const existing = records.find(r => r.classId === activeSession.classId && r.studentId === studentId && r.date === activeSession.date);
    if (existing && (existing.status === 'present' || existing.status === 'late')) {
      return { success: false, message: 'You are already marked present for today’s session.' };
    }

    // Geofencing verification
    const targetClass = classes.find(c => c.id === activeSession.classId);
    let distanceMeters: number | undefined;
    let verifiedLocation = true;

    if (activeSession.geofenceRequired && targetClass) {
      if (studentLat !== undefined && studentLng !== undefined) {
        distanceMeters = calculateDistanceMeters(
          studentLat,
          studentLng,
          targetClass.location.lat,
          targetClass.location.lng
        );

        const allowedRadius = targetClass.geofenceRadiusMeters || 80;
        if (distanceMeters > allowedRadius) {
          return {
            success: false,
            message: `Geofence check failed: You are ${distanceMeters}m away from ${targetClass.room}. You must be within ${allowedRadius}m of the classroom.`,
            distanceMeters,
          };
        }
      }
    }

    // Mark present!
    markAttendance(
      activeSession.classId,
      studentId,
      activeSession.date,
      'present',
      isTokenMatch ? 'qr_dynamic' : 'code_entry',
      `Auto checked-in at ${new Date().toLocaleTimeString()} ${distanceMeters !== undefined ? `(${distanceMeters}m)` : ''}`,
      verifiedLocation,
      distanceMeters
    );

    return {
      success: true,
      message: 'Attendance verified successfully! You are marked PRESENT.',
      distanceMeters,
    };
  };

  const submitExcuse = (studentId: string, classId: string, date: string, reason: string) => {
    const student = users.find(u => u.id === studentId);
    const cls = classes.find(c => c.id === classId);
    if (!student || !cls) return;

    const newExcuse: ExcuseRequest = {
      id: `exc-${Date.now()}`,
      studentId,
      studentName: student.name,
      classId,
      className: cls.name,
      date,
      reason,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    setExcuses(prev => [newExcuse, ...prev]);
  };

  const updateExcuseStatus = (id: string, status: 'approved' | 'rejected', responseNote?: string) => {
    setExcuses(prev => {
      const target = prev.find(e => e.id === id);
      if (target && status === 'approved') {
        // Automatically update the attendance record to excused
        markAttendance(target.classId, target.studentId, target.date, 'excused', 'admin_override', `Excuse approved: ${responseNote || target.reason}`);
      }
      return prev.map(e => e.id === id ? { ...e, status, responseNote } : e);
    });
  };

  const dispatchAbsentAlerts = (classId: string, date: string): number => {
    const targetClass = classes.find(c => c.id === classId);
    if (!targetClass) return 0;

    const enrolledStudents = getStudentsForClass(classId);
    const classRecords = records.filter(r => r.classId === classId && r.date === date);

    const absentStudents = enrolledStudents.filter(s => {
      const rec = classRecords.find(r => r.studentId === s.id);
      return rec && rec.status === 'absent';
    });

    const newLogs: NotificationLog[] = [];
    const now = new Date().toISOString();

    absentStudents.forEach(student => {
      // 1. Parent SMS if phone exists
      if (student.parentPhone) {
        newLogs.push({
          id: `notif-sms-${Date.now()}-${student.id}`,
          type: 'sms',
          channel: 'Parent',
          recipient: student.parentPhone,
          recipientName: `${student.name}'s Guardian`,
          studentName: student.name,
          className: targetClass.name,
          date,
          status: 'absent',
          message: `Official Attendance Notice: ${student.name} was marked absent for ${targetClass.name} on ${date}. Please reply if this is an excused absence.`,
          sentAt: now,
        });
      }

      // 2. Student Email
      newLogs.push({
        id: `notif-email-${Date.now()}-${student.id}`,
        type: 'email',
        channel: 'Student',
        recipient: student.email,
        recipientName: student.name,
        studentName: student.name,
        className: targetClass.name,
        date,
        status: 'absent',
        message: `Hello ${student.name}, you have been recorded as absent for ${targetClass.code}: ${targetClass.name} on ${date}. If you were present or have a medical note, submit an excuse request through AttendPulse.`,
        sentAt: now,
      });
    });

    if (newLogs.length > 0) {
      setNotifications(prev => [...newLogs, ...prev]);
    }

    return newLogs.length;
  };

  // Download Reports
  const downloadDailyReport = (classId?: string, date?: string) => {
    const cId = classId || selectedClassId;
    const d = date || selectedDate;
    const cls = classes.find(c => c.id === cId) || selectedClass;
    const students = getStudentsForClass(cId);
    exportDailyAttendanceCSV(cls, d, students, records);
  };

  const downloadSemesterReport = (classId?: string) => {
    const cId = classId || selectedClassId;
    const cls = classes.find(c => c.id === cId) || selectedClass;
    const students = getStudentsForClass(cId);

    // Get unique dates for this class
    const classRecords = records.filter(r => r.classId === cId);
    const uniqueDates = Array.from(new Set(classRecords.map(r => r.date)));
    const totalSessions = Math.max(uniqueDates.length, 1);

    exportSemesterSummaryCSV(cls, students, classRecords, totalSessions);
  };

  const downloadStudentReport = (studentId: string, classId?: string) => {
    const student = users.find(u => u.id === studentId);
    if (!student) return;

    const studentRecords = records.filter(r => r.studentId === studentId && (!classId || r.classId === classId));
    
    const headers = ['Record ID', 'Class Code', 'Class Name', 'Date', 'Status', 'Method', 'Check-in Time', 'Verified Geofence', 'Note'];
    const rows = studentRecords.map(r => {
      const cls = classes.find(c => c.id === r.classId);
      return [
        `"${r.id}"`,
        `"${cls?.code || r.classId}"`,
        `"${cls?.name || 'Class'}"`,
        `"${r.date}"`,
        `"${r.status.toUpperCase()}"`,
        `"${r.method}"`,
        `"${new Date(r.timestamp).toLocaleTimeString()}"`,
        `"${r.verifiedLocation ? 'Yes' : 'No'}"`,
        `"${(r.note || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const filename = `${student.name.replace(/\s+/g, '_')}_Attendance_Report_${selectedDate}.csv`;
    downloadCSV(filename, csv);
  };

  const downloadFullBackupJSON = () => {
    const backupData = {
      appName: 'AttendPulse',
      exportedAt: new Date().toISOString(),
      classes,
      users,
      enrollments,
      records,
      excuses,
      notifications,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AttendPulse_Complete_Backup_${selectedDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetToSampleData = () => {
    setUsers(INITIAL_USERS);
    setClasses(INITIAL_CLASSES);
    setEnrollments(INITIAL_ENROLLMENTS);
    setRecords(INITIAL_RECORDS);
    setExcuses(INITIAL_EXCUSES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCurrentUser(INITIAL_USERS[0]);
    setSelectedClassId('class-1');
    setSelectedDate('2026-09-26');
    setActiveSession(null);
    localStorage.clear();
  };

  return (
    <AttendanceContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        availableUsers: users,
        currentRole,
        switchRole,
        classes,
        selectedClassId,
        setSelectedClassId,
        selectedClass,
        addClass,
        updateClass,
        selectedDate,
        setSelectedDate,
        records,
        markAttendance,
        bulkMarkAttendance,
        clearDateAttendance,
        enrollments,
        getStudentsForClass,
        getClassesForStudent,
        enrollStudent,
        unenrollStudent,
        activeSession,
        startQRSession,
        stopQRSession,
        sessionRemainingSeconds,
        verifyAndCheckIn,
        excuses,
        submitExcuse,
        updateExcuseStatus,
        notifications,
        dispatchAbsentAlerts,
        downloadDailyReport,
        downloadSemesterReport,
        downloadStudentReport,
        downloadFullBackupJSON,
        resetToSampleData,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
