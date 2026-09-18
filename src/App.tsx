import React, { useState, useEffect } from 'react';
import { 
  AttendanceRecord, 
  Classroom,
  ClassStudent,
  SystemNotification
} from './types';
import { 
  DEFAULT_CLASSROOMS, 
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_NOTIFICATIONS
} from './constants/majors';
import { Navbar, ActiveNavTab } from './components/Navbar';
import { StudentForm } from './components/StudentForm';
import { ClassManager } from './components/ClassManager';
import { QrGenerator } from './components/QrGenerator';
import { AttendanceHistory } from './components/AttendanceHistory';
import { StudentQrCardModal } from './components/StudentQrCardModal';
import { QrScannerModal } from './components/QrScannerModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  // 1. Classrooms persistence
  const [classrooms, setClassrooms] = useState<Classroom[]>(() => {
    try {
      const saved = localStorage.getItem('diem_danh_classrooms');
      return saved ? JSON.parse(saved) : DEFAULT_CLASSROOMS;
    } catch {
      return DEFAULT_CLASSROOMS;
    }
  });

  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    return classrooms[0]?.id || DEFAULT_CLASSROOMS[0].id;
  });

  const activeClassroom = classrooms.find((c) => c.id === selectedClassId) || classrooms[0] || DEFAULT_CLASSROOMS[0];

  // 2. Attendance records persistence
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('diem_danh_records');
      return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE_RECORDS;
    } catch {
      return INITIAL_ATTENDANCE_RECORDS;
    }
  });

  // 3. Notifications persistence
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    try {
      const saved = localStorage.getItem('diem_danh_notifications');
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  // UI state
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('student');
  const [selectedQrCardRecord, setSelectedQrCardRecord] = useState<AttendanceRecord | null>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [recentRecord, setRecentRecord] = useState<AttendanceRecord | null>(() => {
    return records[0] || null;
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('diem_danh_classrooms', JSON.stringify(classrooms));
    } catch (e) {
      console.warn('Failed to save classrooms', e);
    }
  }, [classrooms]);

  useEffect(() => {
    try {
      localStorage.setItem('diem_danh_records', JSON.stringify(records));
    } catch (e) {
      console.warn('Failed to save records', e);
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem('diem_danh_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.warn('Failed to save notifications', e);
    }
  }, [notifications]);

  // Handle URL parameters (e.g. ?session=CNTT2024-K48)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get('session');
    if (sessionParam) {
      const matched = classrooms.find((s) => s.code.toUpperCase() === sessionParam.toUpperCase());
      if (matched) {
        setSelectedClassId(matched.id);
        setActiveTab('student');
        showToast(`Đã nhận diện lớp học: ${matched.name}`);
      }
    }
  }, [classrooms]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Student Attendance Submission & Triggering Email / Notifications
  const handleAddAttendance = (newRecord: AttendanceRecord) => {
    // 1. Prepend record
    setRecords((prev) => [newRecord, ...prev]);
    setRecentRecord(newRecord);
    setSelectedQrCardRecord(newRecord);

    const targetClass = classrooms.find((c) => c.code === newRecord.sessionCode) || activeClassroom;

    // 2. Generate confirmation email to student
    const studentNotif: SystemNotification = {
      id: `notif-stu-${Date.now()}`,
      title: `Xác nhận điểm danh thành công: ${targetClass.name}`,
      recipientEmail: newRecord.studentEmail || `${newRecord.studentId.toLowerCase()}@student.ctu.edu.vn`,
      recipientName: newRecord.fullName,
      className: targetClass.name,
      classCode: targetClass.code,
      studentId: newRecord.studentId,
      studentName: newRecord.fullName,
      content: `Xin chào ${newRecord.fullName}, bạn đã hoàn thành điểm danh lớp ${targetClass.name} (${targetClass.code}) lúc ${newRecord.timestamp}. Tọa độ vị trí GPS và mã QR xác thực của bạn đã được đối soát hợp lệ.`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      isRead: false,
      type: 'student_email',
      targetRole: 'student',
      emailPayload: {
        subject: `Xác nhận điểm danh: ${targetClass.name} (${targetClass.code})`,
        courseName: targetClass.name,
        studentId: newRecord.studentId,
        studentName: newRecord.fullName,
        timestamp: newRecord.timestamp,
        sessionCode: newRecord.sessionCode,
        gpsStatusText: newRecord.locationStatus === 'valid' ? 'Vị trí GPS hợp lệ tại phòng học' : 'Vị trí GPS ngoài bán kính lớp',
        locationText: newRecord.location ? `${newRecord.location.latitude.toFixed(5)}, ${newRecord.location.longitude.toFixed(5)}` : 'Không có GPS',
        qrToken: newRecord.qrCodeUsed || 'AUTH-QR-LIVE',
      }
    };

    // 3. Generate notification to lecturer managing this class
    const isOutRange = newRecord.locationStatus === 'out_of_range';
    const teacherNotif: SystemNotification = {
      id: `notif-tea-${Date.now()}`,
      title: isOutRange 
        ? `[Cảnh báo GPS] ${newRecord.fullName} (${newRecord.studentId}) điểm danh ngoài bán kính`
        : `[Điểm danh mới] ${newRecord.fullName} (${newRecord.studentId}) - ${targetClass.code}`,
      recipientEmail: targetClass.lecturerEmail || 'giangvien@ctu.edu.vn',
      recipientName: targetClass.lecturerName || 'Giảng viên quản lý',
      className: targetClass.name,
      classCode: targetClass.code,
      studentId: newRecord.studentId,
      studentName: newRecord.fullName,
      content: isOutRange
        ? `Sinh viên ${newRecord.fullName} vừa điểm danh lúc ${newRecord.timestamp} nhưng tọa độ GPS cách phòng học ~${newRecord.distanceToClassroom}m (vượt quá bán kính cho phép).`
        : `Sinh viên ${newRecord.fullName} (${newRecord.studentId}) vừa điểm danh thành công lớp ${targetClass.name} tại ${targetClass.room}. Vị trí GPS hợp lệ.`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      isRead: false,
      type: isOutRange ? 'teacher_warning' : 'teacher_alert',
      targetRole: 'teacher',
    };

    setNotifications((prev) => [studentNotif, teacherNotif, ...prev]);

    showToast(`Điểm danh thành công! Đã gửi email xác nhận đến ${studentNotif.recipientEmail}`);
  };

  // Classroom Management Actions
  const handleCreateClass = (newClass: Classroom) => {
    setClassrooms((prev) => [newClass, ...prev]);
    setSelectedClassId(newClass.id);
    showToast(`Đã tạo thành công lớp: ${newClass.name} (${newClass.code})`);
  };

  const handleDeleteClass = (id: string) => {
    setClassrooms((prev) => prev.filter((c) => c.id !== id));
    if (selectedClassId === id) {
      const remaining = classrooms.filter((c) => c.id !== id);
      if (remaining.length > 0) setSelectedClassId(remaining[0].id);
    }
    showToast('Đã xóa lớp học');
  };

  const handleAddStudentToClass = (classId: string, student: ClassStudent) => {
    setClassrooms((prev) =>
      prev.map((c) => {
        if (c.id === classId) {
          return {
            ...c,
            students: [...c.students, student],
          };
        }
        return c;
      })
    );
    showToast(`Đã thêm sinh viên ${student.fullName} (${student.studentId}) vào lớp`);
  };

  const handleBatchAddStudents = (classId: string, newStudents: ClassStudent[]) => {
    setClassrooms((prev) =>
      prev.map((c) => {
        if (c.id === classId) {
          return {
            ...c,
            students: [...c.students, ...newStudents],
          };
        }
        return c;
      })
    );
    showToast(`Đã nhập thành công ${newStudents.length} sinh viên vào lớp`);
  };

  const handleRemoveStudentFromClass = (classId: string, studentId: string) => {
    setClassrooms((prev) =>
      prev.map((c) => {
        if (c.id === classId) {
          return {
            ...c,
            students: c.students.filter((s) => s.studentId !== studentId),
          };
        }
        return c;
      })
    );
    showToast('Đã xóa sinh viên khỏi danh sách lớp');
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    showToast('Đã xóa bản ghi điểm danh');
  };

  const handleClearAllRecords = () => {
    setRecords([]);
    showToast('Đã xóa toàn bộ lịch sử điểm danh');
  };

  const handleMarkAllNotifsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('Đã đánh dấu tất cả thông báo là đã đọc');
  };

  const handleScanSuccess = (scannedText: string) => {
    setIsQrScannerOpen(false);

    try {
      const parsed = JSON.parse(scannedText);
      if (parsed.code) {
        const found = classrooms.find((c) => c.code.toUpperCase() === parsed.code.toUpperCase());
        if (found) {
          setSelectedClassId(found.id);
          setActiveTab('student');
          showToast(`Quét mã QR thành công! Đã kết nối lớp: ${found.name}`);
          return;
        }
      }
    } catch {
      // url or plain code
      let code = scannedText;
      if (scannedText.includes('session=')) {
        try {
          const url = new URL(scannedText);
          code = url.searchParams.get('session') || code;
        } catch {
          const match = scannedText.match(/session=([^&]+)/);
          if (match) code = match[1];
        }
      }

      const found = classrooms.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
      if (found) {
        setSelectedClassId(found.id);
        setActiveTab('student');
        showToast(`Quét thành công lớp: ${found.name}`);
      } else {
        showToast(`Mã quét: ${code}`);
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        activeSession={activeClassroom}
        totalRecordsCount={records.length}
        unreadNotificationsCount={unreadCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Tab 1: Điểm danh sinh viên */}
        {activeTab === 'student' && (
          <StudentForm
            sessions={classrooms}
            activeSession={activeClassroom}
            onSelectSession={(sess) => {
              const cls = classrooms.find((c) => c.code === sess.code);
              if (cls) setSelectedClassId(cls.id);
            }}
            onSubmitAttendance={handleAddAttendance}
            onOpenQrScanner={() => setIsQrScannerOpen(true)}
            onViewQrCard={setSelectedQrCardRecord}
            recentRecord={recentRecord}
          />
        )}

        {/* Tab 2: Quản lý lớp học */}
        {activeTab === 'classes' && (
          <ClassManager
            classrooms={classrooms}
            selectedClassId={selectedClassId}
            records={records}
            onSelectClass={setSelectedClassId}
            onCreateClass={handleCreateClass}
            onDeleteClass={handleDeleteClass}
            onAddStudentToClass={handleAddStudentToClass}
            onBatchAddStudents={handleBatchAddStudents}
            onRemoveStudentFromClass={handleRemoveStudentFromClass}
            onSwitchToSession={(cls) => {
              setSelectedClassId(cls.id);
              setActiveTab('student');
              showToast(`Đã chọn lớp: ${cls.name} để điểm danh`);
            }}
          />
        )}

        {/* Tab 3: Tạo mã QR */}
        {activeTab === 'generator' && (
          <QrGenerator
            sessions={classrooms}
            activeSession={activeClassroom}
            onSelectSession={(sess) => {
              const cls = classrooms.find((c) => c.code === sess.code);
              if (cls) setSelectedClassId(cls.id);
            }}
            onAddSession={(newSess) => {
              handleCreateClass(newSess);
            }}
          />
        )}

        {/* Tab 4: Lịch sử điểm danh */}
        {activeTab === 'history' && (
          <AttendanceHistory
            records={records}
            classrooms={classrooms}
            activeClassroom={activeClassroom}
            onDeleteRecord={handleDeleteRecord}
            onClearAll={handleClearAllRecords}
            onViewQrCard={setSelectedQrCardRecord}
          />
        )}
      </main>

      {/* Student QR Verification Card Modal */}
      <StudentQrCardModal
        record={selectedQrCardRecord}
        onClose={() => setSelectedQrCardRecord(null)}
      />

      {/* QR Scanner Modal (Camera / Image file) */}
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotifsAsRead}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-2.5 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-500">
        <p>© 2026 Hệ Thống Điểm Danh Sinh Viên Thông Minh • Quản Lý Lớp Học • Định Vị GPS & Mã QR</p>
      </footer>
    </div>
  );
}
