import React, { useState } from 'react';
import { Classroom, ClassStudent, AttendanceRecord } from '../types';
import { POPULAR_MAJORS, MAJOR_GROUPS } from '../constants/majors';
import { exportClassAttendanceToCSV } from '../utils/export';
import { getCurrentPositionPromise } from '../utils/geo';
import { 
  Building2, 
  Plus, 
  Users, 
  UserPlus, 
  Trash2, 
  MapPin, 
  Mail, 
  Sparkles, 
  GraduationCap, 
  Upload, 
  Check, 
  AlertCircle,
  Compass,
  ArrowRight,
  QrCode,
  Search,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  UserX
} from 'lucide-react';

interface ClassManagerProps {
  classrooms: Classroom[];
  selectedClassId: string;
  records: AttendanceRecord[];
  onSelectClass: (id: string) => void;
  onCreateClass: (newClass: Classroom) => void;
  onDeleteClass: (id: string) => void;
  onAddStudentToClass: (classId: string, student: ClassStudent) => void;
  onBatchAddStudents: (classId: string, students: ClassStudent[]) => void;
  onRemoveStudentFromClass: (classId: string, studentId: string) => void;
  onSwitchToSession: (classroom: Classroom) => void;
}

export const ClassManager: React.FC<ClassManagerProps> = ({
  classrooms,
  selectedClassId,
  records,
  onSelectClass,
  onCreateClass,
  onDeleteClass,
  onAddStudentToClass,
  onBatchAddStudents,
  onRemoveStudentFromClass,
  onSwitchToSession,
}) => {
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // Create Class Form State
  const [className, setClassName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [room, setRoom] = useState('');
  const [lecturerName, setLecturerName] = useState('');
  const [lecturerEmail, setLecturerEmail] = useState('');
  const [requireGps, setRequireGps] = useState(true);
  const [radiusMeters, setRadiusMeters] = useState(200);
  const [classroomLat, setClassroomLat] = useState<number | null>(null);
  const [classroomLng, setClassroomLng] = useState<number | null>(null);
  const [classroomAddress, setClassroomAddress] = useState('');
  const [isGettingGps, setIsGettingGps] = useState(false);

  // Single Add Student Form State
  const [newMssv, setNewMssv] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newMajor, setNewMajor] = useState(POPULAR_MAJORS[0]);
  const [newEmail, setNewEmail] = useState('');

  // Batch import text state
  const [batchText, setBatchText] = useState('');
  const [batchNotice, setBatchNotice] = useState<string | null>(null);

  const currentClass = classrooms.find((c) => c.id === selectedClassId) || classrooms[0];

  // Calculate attendance stats for current class
  const classAttendanceRecords = (records || []).filter(
    (r) => r.sessionCode.toUpperCase() === currentClass?.code.toUpperCase()
  );
  const attendedIds = new Set(classAttendanceRecords.map((r) => r.studentId.toUpperCase()));
  const totalStudentsCount = currentClass?.students.length || 0;
  const attendedCount = currentClass ? currentClass.students.filter((s) => attendedIds.has(s.studentId.toUpperCase())).length : 0;
  const absentCount = Math.max(0, totalStudentsCount - attendedCount);
  const attendancePercent = totalStudentsCount > 0 ? ((attendedCount / totalStudentsCount) * 100).toFixed(0) : '0';

  const handleExportCurrentClass = () => {
    if (!currentClass) return;
    exportClassAttendanceToCSV(currentClass, records || []);
  };

  const handleGetLocation = async () => {
    setIsGettingGps(true);
    const res = await getCurrentPositionPromise();
    setIsGettingGps(false);
    if (res.success && res.data) {
      setClassroomLat(res.data.latitude);
      setClassroomLng(res.data.longitude);
      setClassroomAddress(res.data.address || `${res.data.latitude.toFixed(5)}, ${res.data.longitude.toFixed(5)}`);
    } else {
      alert(res.error || 'Không thể lấy vị trí hiện tại');
    }
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim() || !classCode.trim()) {
      alert('Vui lòng điền tên lớp và mã lớp.');
      return;
    }

    const newClass: Classroom = {
      id: `class-${Date.now()}`,
      code: classCode.trim().toUpperCase(),
      name: className.trim(),
      room: room.trim() || 'Phòng học lý thuyết',
      lecturerName: lecturerName.trim() || 'Giảng viên',
      lecturerEmail: lecturerEmail.trim() || 'giangvien@ctu.edu.vn',
      requireGps,
      classroomLocation: requireGps && classroomLat !== null && classroomLng !== null ? {
        latitude: classroomLat,
        longitude: classroomLng,
        radiusMeters,
        addressName: classroomAddress,
      } : undefined,
      students: [],
      createdAt: Date.now(),
    };

    onCreateClass(newClass);
    onSelectClass(newClass.id);
    setShowCreateClassModal(false);

    // Reset
    setClassName('');
    setClassCode('');
    setRoom('');
    setLecturerName('');
    setLecturerEmail('');
    setClassroomLat(null);
    setClassroomLng(null);
  };

  const handleSaveSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass) return;
    const cleanId = newMssv.trim().toUpperCase();
    const cleanName = newFullName.trim();
    if (!cleanId || !cleanName) {
      alert('Vui lòng nhập MSSV và Họ tên.');
      return;
    }

    // Check duplicate MSSV in class
    if (currentClass.students.some((s) => s.studentId === cleanId)) {
      alert(`Sinh viên với MSSV ${cleanId} đã tồn tại trong danh sách lớp này.`);
      return;
    }

    const studentEmail = newEmail.trim() || `${cleanId.toLowerCase()}@student.ctu.edu.vn`;

    const student: ClassStudent = {
      id: `stu-${Date.now()}`,
      studentId: cleanId,
      fullName: cleanName,
      major: newMajor,
      email: studentEmail,
      joinedAt: new Date().toISOString().slice(0, 10),
    };

    onAddStudentToClass(currentClass.id, student);
    setShowAddStudentModal(false);
    setNewMssv('');
    setNewFullName('');
    setNewEmail('');
  };

  const handleProcessBatchImport = () => {
    if (!currentClass || !batchText.trim()) return;

    const lines = batchText.split('\n');
    const newStudents: ClassStudent[] = [];
    const existingIds = new Set(currentClass.students.map((s) => s.studentId));

    lines.forEach((line) => {
      const parts = line.split(/[,\t|;-]/).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const mssv = parts[0].toUpperCase();
        const name = parts[1];
        const major = parts[2] || 'Công nghệ thông tin';
        const email = parts[3] || `${mssv.toLowerCase()}@student.ctu.edu.vn`;

        if (!existingIds.has(mssv) && mssv.length >= 4) {
          existingIds.add(mssv);
          newStudents.push({
            id: `stu-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            studentId: mssv,
            fullName: name,
            major: major,
            email: email,
            joinedAt: new Date().toISOString().slice(0, 10),
          });
        }
      }
    });

    if (newStudents.length === 0) {
      setBatchNotice('Không tìm thấy sinh viên hợp lệ hoặc các mã sinh viên đã có trong lớp.');
      return;
    }

    onBatchAddStudents(currentClass.id, newStudents);
    setShowBatchModal(false);
    setBatchText('');
    setBatchNotice(null);
  };

  const filteredStudents = currentClass ? currentClass.students.filter((s) => 
    s.studentId.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    s.fullName.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    s.major.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(studentSearchTerm.toLowerCase())
  ) : [];

  return (
    <div className="space-y-6">
      {/* Header with class management action */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Quản Lý Lớp Học & Danh Sách Sinh Viên
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Tạo lớp mới, thiết lập giảng viên, phòng học và quản lý danh sách sinh viên riêng biệt của từng lớp
          </p>
        </div>

        <button
          onClick={() => setShowCreateClassModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tạo Lớp Học Mới
        </button>
      </div>

      {/* Classroom Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {classrooms.map((cls) => {
          const isSelected = cls.id === currentClass?.id;
          return (
            <div
              key={cls.id}
              onClick={() => onSelectClass(cls.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-800">
                  {cls.code}
                </span>
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {cls.students.length} sinh viên
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-base mt-2 line-clamp-1">{cls.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{cls.room} • {cls.lecturerName}</p>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-600 truncate max-w-[160px] flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" /> {cls.lecturerEmail}
                </span>
                {isSelected && (
                  <span className="text-indigo-600 font-semibold flex items-center gap-1">
                    Đang chọn <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Classroom Student Roster View */}
      {currentClass && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Header of Active Class */}
          <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold mb-1">
                <span>DANH SÁCH LỚP HỌC</span>
                <span>•</span>
                <span className="font-mono text-white">{currentClass.code}</span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight">{currentClass.name}</h3>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-2 font-medium">
                <span>Giảng viên: {currentClass.lecturerName} ({currentClass.lecturerEmail})</span>
                <span>•</span>
                <span>{currentClass.room}</span>
                <span>•</span>
                <span>Sĩ số: <strong>{currentClass.students.length} sinh viên</strong></span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportCurrentClass}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                title="Xuất lịch sử điểm danh lớp này ra file Excel (.csv)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" /> Xuất Excel (.csv) Lớp Này
              </button>
              <button
                onClick={() => onSwitchToSession(currentClass)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
              >
                <QrCode className="w-4 h-4" /> Mở điểm danh
              </button>
              {classrooms.length > 1 && (
                <button
                  onClick={() => {
                    if (confirm(`Bạn có chắc muốn xóa lớp ${currentClass.name}?`)) {
                      onDeleteClass(currentClass.id);
                    }
                  }}
                  className="p-2 bg-white/10 hover:bg-rose-600 text-white rounded-xl transition-colors"
                  title="Xóa lớp học này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Attendance Overview & Export Strip */}
          <div className="px-6 py-3.5 bg-slate-100/90 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600">Sĩ số:</span>
                <strong className="text-slate-900 font-semibold">{totalStudentsCount} sinh viên</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-slate-600">Có mặt:</span>
                <strong className="text-emerald-700 font-semibold">{attendedCount} ({attendancePercent}%)</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <UserX className="w-4 h-4 text-amber-600" />
                <span className="text-slate-600">Vắng mặt:</span>
                <strong className="text-amber-700 font-semibold">{absentCount} sinh viên</strong>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <span>Tổng lượt điểm danh:</span>
                <span className="font-mono font-medium text-slate-700">{classAttendanceRecords.length}</span>
              </div>
            </div>

            <button
              onClick={handleExportCurrentClass}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-300 shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Tải Excel (.csv) báo cáo lớp
            </button>
          </div>

          {/* Action & Search Bar for Students */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm MSSV, họ tên, email hoặc ngành trong lớp..."
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                <UserPlus className="w-4 h-4" /> Thêm sinh viên
              </button>

              <button
                onClick={() => setShowBatchModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs transition-colors"
              >
                <Upload className="w-4 h-4" /> Nhập danh sách nhanh
              </button>
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">STT</th>
                  <th className="py-3 px-4">Mã số sinh viên (MSSV)</th>
                  <th className="py-3 px-4">Họ và tên</th>
                  <th className="py-3 px-4">Ngành học</th>
                  <th className="py-3 px-4">Email nhận thông báo</th>
                  <th className="py-3 px-4">Ngày vào lớp</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      Chưa có sinh viên nào trong danh sách lớp này. Nhấn "Thêm sinh viên" để bắt đầu!
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((stu, index) => (
                    <tr key={stu.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-1 rounded-md">
                          {stu.studentId}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {stu.fullName}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700">
                        <span className="inline-flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {stu.major}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-indigo-600 font-mono">
                        {stu.email}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                        {stu.joinedAt}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`Xóa sinh viên ${stu.fullName} (${stu.studentId}) khỏi lớp?`)) {
                              onRemoveStudentFromClass(currentClass.id, stu.studentId);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa sinh viên khỏi lớp"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Create Class Modal */}
      {showCreateClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" /> Tạo Lớp Học Mới
              </h3>
              <button
                onClick={() => setShowCreateClassModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã lớp <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: CT299-01"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tên lớp / Môn học <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Lập trình Web"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phòng học / Giảng đường</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Phòng B1-204"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tên giảng viên</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: TS. Nguyễn Văn A"
                    value={lecturerName}
                    onChange={(e) => setLecturerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email giảng viên nhận thông báo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ví dụ: gv.nguyenvana@ctu.edu.vn"
                  value={lecturerEmail}
                  onChange={(e) => setLecturerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Email này sẽ nhận thông báo khi sinh viên điểm danh và các cảnh báo vị trí
                </p>
              </div>

              {/* GPS Settings for Class */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={requireGps}
                    onChange={(e) => setRequireGps(e.target.checked)}
                    className="rounded-sm text-indigo-600"
                  />
                  Bắt buộc xác thực vị trí GPS tại phòng học
                </label>

                {requireGps && (
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">
                        {classroomLat ? `Tọa độ: ${classroomLat.toFixed(5)}, ${classroomLng?.toFixed(5)}` : 'Chưa thiết lập tọa độ'}
                      </span>
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isGettingGps}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-indigo-700 font-semibold rounded-lg border border-slate-200 flex items-center gap-1"
                      >
                        <Compass className={`w-3.5 h-3.5 ${isGettingGps ? 'animate-spin' : ''}`} />
                        Lấy vị trí của tôi
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-slate-500 block mb-0.5">Bán kính cho phép:</label>
                        <select
                          value={radiusMeters}
                          onChange={(e) => setRadiusMeters(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <option value={50}>50m (Phòng học nhỏ)</option>
                          <option value={100}>100m (Giảng đường chuẩn)</option>
                          <option value={200}>200m (Khuôn viên gần)</option>
                          <option value={500}>500m (Toàn trường)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-0.5">Mô tả địa chỉ:</label>
                        <input
                          type="text"
                          placeholder="Khu II, Đại học Cần Thơ..."
                          value={classroomAddress}
                          onChange={(e) => setClassroomAddress(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateClassModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Lưu Lớp Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Single Student */}
      {showAddStudentModal && currentClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" /> Thêm Sinh Viên Vào Lớp
              </h3>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Lớp: <strong className="text-slate-800">{currentClass.name} ({currentClass.code})</strong>
            </p>

            <form onSubmit={handleSaveSingleStudent} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mã số sinh viên (MSSV) <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: B2408109"
                  value={newMssv}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setNewMssv(val);
                    if (!newEmail || newEmail.includes('@student.ctu.edu.vn')) {
                      setNewEmail(`${val.toLowerCase()}@student.ctu.edu.vn`);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và tên <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn Sang"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ngành học</label>
                <select
                  value={newMajor}
                  onChange={(e) => setNewMajor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  {MAJOR_GROUPS.map((group) => (
                    <optgroup key={group.groupName} label={group.groupName}>
                      {group.majors.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email nhận thông báo</label>
                <input
                  type="email"
                  placeholder="sangb2408109@student.ctu.edu.vn"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Thêm Sinh Viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Batch Import Students */}
      {showBatchModal && currentClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" /> Nhập Danh Sách Sinh Viên Nhanh
              </h3>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Dán danh sách sinh viên theo định dạng: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">MSSV, Họ tên, Ngành (tùy chọn), Email (tùy chọn)</code> (mỗi sinh viên một dòng):
            </p>

            <textarea
              rows={6}
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder={`B2408109, Nguyễn Văn Sang, Công nghệ thông tin, sangb2408109@student.ctu.edu.vn\nB2305412, Lê Thị Mỹ Duyên, Kỹ thuật phần mềm\nB2209315, Trần Bảo Long, Hệ thống thông tin`}
              className="w-full p-3 font-mono text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />

            {batchNotice && (
              <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{batchNotice}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleProcessBatchImport}
                className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
              >
                Nhập Vào Lớp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
