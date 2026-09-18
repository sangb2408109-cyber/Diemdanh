export interface GeoLocationData {
  latitude: number;
  longitude: number;
  accuracy: number; // in meters
  address?: string;
  timestamp: number;
}

export interface ClassStudent {
  id: string;
  studentId: string; // MSSV (e.g. B2408109)
  fullName: string;
  major: string;
  email: string;
  joinedAt: string;
}

export interface Classroom {
  id: string;
  code: string; // Mã lớp (e.g. "CNTT2024-K48")
  name: string; // Tên lớp / Môn học
  room: string; // Phòng học
  lecturerName: string; // Tên giảng viên
  lecturerEmail: string; // Email giảng viên nhận thông báo
  requireGps: boolean;
  classroomLocation?: {
    latitude: number;
    longitude: number;
    radiusMeters: number; // in meters
    addressName?: string;
  };
  students: ClassStudent[];
  createdAt: number;
}

// Backward compatibility alias
export type AttendanceSession = Classroom;

export interface AttendanceRecord {
  id: string;
  studentId: string; // Mã số sinh viên (MSSV)
  fullName: string; // Họ và tên
  major: string; // Ngành
  studentEmail?: string; // Email sinh viên nhận xác nhận
  sessionCode: string; // Mã lớp / buổi học
  courseName: string; // Tên lớp / môn học
  dateOnly: string; // YYYY-MM-DD
  timeOnly: string; // HH:mm:ss
  timestamp: string; // Chuỗi hiển thị đầy đủ
  createdAt: number;
  location?: GeoLocationData;
  locationStatus: 'valid' | 'warning' | 'out_of_range' | 'no_gps';
  distanceToClassroom?: number; // meters
  qrCodeUsed: string; // Dữ liệu mã QR đã dùng để điểm danh
  qrVerified?: boolean;
}

export interface SystemNotification {
  id: string;
  type: 'student_email' | 'teacher_alert' | 'teacher_warning';
  targetRole: 'student' | 'teacher';
  recipientEmail: string;
  recipientName: string;
  title: string;
  content: string;
  classCode: string;
  className: string;
  studentId?: string;
  studentName?: string;
  timestamp: string;
  createdAt: number;
  isRead: boolean;
  emailPayload?: {
    subject: string;
    studentName: string;
    studentId: string;
    courseName: string;
    sessionCode: string;
    timestamp: string;
    locationText?: string;
    gpsStatusText: string;
    qrToken: string;
  };
}
