export type UserRole = 'teacher' | 'student' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  studentIdNumber?: string; // e.g. STU-2026-081
  department?: string;
  phone?: string;
  parentPhone?: string;
  parentEmail?: string;
}

export interface ClassLocation {
  lat: number;
  lng: number;
  name: string;
}

export interface ClassItem {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  teacherName?: string;
  schedule: string;
  room: string;
  department: string;
  semester: string;
  location: ClassLocation;
  geofenceRadiusMeters: number;
  color: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  enrolledAt: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type AttendanceMethod = 'manual' | 'qr_dynamic' | 'geofence' | 'code_entry' | 'admin_override';

export interface AttendanceRecord {
  id: string;
  classId: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  method: AttendanceMethod;
  timestamp: string; // ISO string
  note?: string;
  verifiedLocation?: boolean;
  distanceMeters?: number;
}

export interface ActiveSession {
  classId: string;
  date: string;
  token: string;
  code6Digit: string;
  expiresAt: number; // epoch ms
  intervalSeconds: number;
  geofenceRequired: boolean;
  createdAt: number;
}

export interface ExcuseRequest {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  date: string;
  reason: string;
  doctorNoteUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  responseNote?: string;
}

export interface NotificationLog {
  id: string;
  type: 'sms' | 'email';
  recipient: string;
  recipientName: string;
  studentName: string;
  className: string;
  date: string;
  status: AttendanceStatus;
  message: string;
  sentAt: string;
  channel: 'Parent' | 'Student';
}
