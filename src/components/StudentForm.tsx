import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  AttendanceRecord, 
  AttendanceSession, 
  GeoLocationData,
  Classroom
} from '../types';
import { POPULAR_MAJORS, MAJOR_GROUPS } from '../constants/majors';
import { 
  getCurrentPositionPromise, 
  calculateDistanceMeters, 
  formatCoordinates, 
  getGoogleMapsUrl 
} from '../utils/geo';
import { 
  CheckCircle2, 
  MapPin, 
  QrCode, 
  Compass, 
  User, 
  GraduationCap, 
  BookOpen, 
  AlertTriangle, 
  ExternalLink, 
  ShieldCheck, 
  RefreshCw, 
  Clock, 
  Mail,
  Sparkles,
  Search,
  Check
} from 'lucide-react';

interface StudentFormProps {
  sessions: AttendanceSession[];
  activeSession: AttendanceSession;
  onSelectSession: (session: AttendanceSession) => void;
  onSubmitAttendance: (record: AttendanceRecord) => void;
  onOpenQrScanner: () => void;
  onViewQrCard: (record: AttendanceRecord) => void;
  recentRecord: AttendanceRecord | null;
}

export const StudentForm: React.FC<StudentFormProps> = ({
  sessions,
  activeSession,
  onSelectSession,
  onSubmitAttendance,
  onOpenQrScanner,
  onViewQrCard,
  recentRecord,
}) => {
  // Form fields
  const [studentId, setStudentId] = useState('B2408109');
  const [fullName, setFullName] = useState('Nguyễn Văn Sang');
  const [major, setMajor] = useState(POPULAR_MAJORS[0]);
  const [studentEmail, setStudentEmail] = useState('sangb2408109@student.ctu.edu.vn');
  const [customMajor, setCustomMajor] = useState('');
  const [isCustomMajor, setIsCustomMajor] = useState(false);
  const [matchedRosterStudent, setMatchedRosterStudent] = useState<boolean>(true);

  // Geolocation state
  const [locationData, setLocationData] = useState<GeoLocationData | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | undefined>(undefined);
  const [locationStatus, setLocationStatus] = useState<'valid' | 'warning' | 'out_of_range' | 'no_gps'>('no_gps');

  // Submit feedback
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastSubmittedRecord, setLastSubmittedRecord] = useState<AttendanceRecord | null>(null);

  // Auto-fetch location on mount
  useEffect(() => {
    handleGetLocation();
  }, []);

  // Check if student exists in active session roster
  const checkRosterForStudent = (mssv: string) => {
    const clean = mssv.trim().toUpperCase();
    if (!clean || !activeSession.students) {
      setMatchedRosterStudent(false);
      return;
    }

    const found = activeSession.students.find((s) => s.studentId === clean);
    if (found) {
      setFullName(found.fullName);
      setMajor(found.major);
      setStudentEmail(found.email);
      setMatchedRosterStudent(true);
    } else {
      setMatchedRosterStudent(false);
    }
  };

  // Update distance check whenever location or active session changes
  useEffect(() => {
    if (locationData && activeSession.classroomLocation) {
      const dist = calculateDistanceMeters(
        locationData.latitude,
        locationData.longitude,
        activeSession.classroomLocation.latitude,
        activeSession.classroomLocation.longitude
      );
      setDistanceMeters(dist);

      if (dist <= activeSession.classroomLocation.radiusMeters) {
        setLocationStatus('valid');
      } else {
        setLocationStatus('out_of_range');
      }
    } else if (locationData) {
      setDistanceMeters(undefined);
      setLocationStatus('valid');
    } else {
      setDistanceMeters(undefined);
      setLocationStatus('no_gps');
    }
  }, [locationData, activeSession]);

  const handleGetLocation = async () => {
    setIsLocating(true);
    setLocationError(null);
    const result = await getCurrentPositionPromise();
    setIsLocating(false);

    if (result.success && result.data) {
      setLocationData(result.data);
      setLocationError(null);
    } else {
      setLocationError(result.error || 'Không thể xác định vị trí');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanId = studentId.trim().toUpperCase();
    const cleanName = fullName.trim();
    const selectedMajor = isCustomMajor ? customMajor.trim() : major;
    const cleanEmail = studentEmail.trim() || `${cleanId.toLowerCase()}@student.ctu.edu.vn`;

    if (!cleanId) {
      alert('Vui lòng nhập Mã số sinh viên (MSSV).');
      return;
    }
    if (!cleanName) {
      alert('Vui lòng nhập Họ và tên.');
      return;
    }
    if (!selectedMajor) {
      alert('Vui lòng chọn hoặc nhập Ngành học.');
      return;
    }

    const now = new Date();
    const dateOnly = now.toISOString().slice(0, 10);
    const timeOnly = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const timeFormatted = `${timeOnly} - ${now.toLocaleDateString('vi-VN')}`;

    const newRecord: AttendanceRecord = {
      id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      studentId: cleanId,
      fullName: cleanName,
      major: selectedMajor,
      studentEmail: cleanEmail,
      sessionCode: activeSession.code,
      courseName: activeSession.name,
      dateOnly: dateOnly,
      timeOnly: timeOnly,
      timestamp: timeFormatted,
      createdAt: Date.now(),
      location: locationData || undefined,
      locationStatus: locationStatus,
      distanceToClassroom: distanceMeters,
      qrCodeUsed: `QR-${activeSession.code}-AUTH`,
      qrVerified: true,
    };

    onSubmitAttendance(newRecord);
    setLastSubmittedRecord(newRecord);
    setIsSubmitted(true);

    // Fire celebratory confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Banner / Class Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs mb-2">
              <BookOpen className="w-3.5 h-3.5" /> Lớp học đang diễn ra
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {activeSession.name}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-blue-100 mt-2 font-mono">
              <span className="bg-white/15 px-2 py-0.5 rounded-md font-semibold">
                Mã lớp: {activeSession.code}
              </span>
              <span>{activeSession.room}</span>
              <span>• Giảng viên: {activeSession.lecturerName}</span>
              <span>• Sĩ số: {activeSession.students?.length || 0} SV</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenQrScanner}
            className="self-start sm:self-center inline-flex items-center gap-2 px-3.5 py-2.5 bg-white text-indigo-800 hover:bg-blue-50 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
          >
            <QrCode className="w-4 h-4 text-indigo-600" />
            Quét mã QR Buổi học
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {isSubmitted && lastSubmittedRecord && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-slate-800 space-y-3 shadow-xs animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-900 text-base">Điểm danh thành công!</h3>
                <p className="text-xs text-emerald-700">
                  Thông tin và vị trí GPS của bạn đã được ghi nhận vào lịch sử lớp học.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onViewQrCard(lastSubmittedRecord)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" /> Thẻ QR Xác Nhận
            </button>
          </div>

          <div className="bg-white/80 p-3.5 rounded-xl text-xs space-y-1.5 border border-emerald-200/60 font-mono">
            <div><strong>MSSV:</strong> {lastSubmittedRecord.studentId} - <strong>{lastSubmittedRecord.fullName}</strong></div>
            <div><strong>Ngành:</strong> {lastSubmittedRecord.major}</div>
            <div><strong>Thời gian:</strong> {lastSubmittedRecord.timestamp}</div>
            {lastSubmittedRecord.location && (
              <div className="text-emerald-800">
                <strong>GPS:</strong> {lastSubmittedRecord.location.latitude.toFixed(5)}, {lastSubmittedRecord.location.longitude.toFixed(5)} (±{lastSubmittedRecord.location.accuracy}m)
              </div>
            )}
            <div className="text-indigo-700 pt-1 border-t border-emerald-100 flex items-center gap-1 font-sans">
              <Mail className="w-3.5 h-3.5" />
              <span>Đã gửi email thông báo xác nhận điểm danh đến: <strong>{lastSubmittedRecord.studentEmail}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Main Attendance Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              Nhập Thông Tin Điểm Danh
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhập MSSV để tự động điền thông tin từ danh sách lớp
            </p>
          </div>
          {matchedRosterStudent && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Check className="w-3.5 h-3.5" /> Trong danh sách lớp
            </span>
          )}
        </div>

        {/* 1. Mã số sinh viên (MSSV) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="student-id" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Mã số sinh viên (MSSV) <span className="text-rose-500">*</span>
            </label>
            {activeSession.students && activeSession.students.length > 0 && (
              <span className="text-[11px] text-slate-400">
                Gợi ý: {activeSession.students.slice(0, 3).map((s) => s.studentId).join(', ')}...
              </span>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <span className="font-mono text-xs font-bold text-slate-500">ID</span>
            </div>
            <input
              id="student-id"
              type="text"
              required
              autoComplete="off"
              placeholder="Ví dụ: B2408109"
              value={studentId}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setStudentId(val);
                checkRosterForStudent(val);
              }}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base font-semibold text-slate-900 placeholder:text-slate-400 uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* 2. Họ và tên */}
        <div>
          <label htmlFor="full-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Họ và tên sinh viên <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4 text-slate-400" />
            </div>
            <input
              id="full-name"
              type="text"
              required
              placeholder="Ví dụ: Nguyễn Văn Sang"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* 3. Ngành học */}
        <div>
          <label htmlFor="major-select" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Ngành học <span className="text-rose-500">*</span>
          </label>
          
          {!isCustomMajor ? (
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                </div>
                <select
                  id="major-select"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                >
                  {MAJOR_GROUPS.map((group) => (
                    <optgroup key={group.groupName} label={group.groupName}>
                      {group.majors.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsCustomMajor(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                >
                  + Ngành của tôi không có trong danh sách
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                required
                placeholder="Nhập tên ngành học của bạn..."
                value={customMajor}
                onChange={(e) => setCustomMajor(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsCustomMajor(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                >
                  Chọn lại từ danh sách có sẵn
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Email nhận thông báo xác nhận */}
        <div>
          <label htmlFor="student-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Email nhận thông báo xác nhận điểm danh <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4 text-slate-400" />
            </div>
            <input
              id="student-email"
              type="email"
              required
              placeholder="sangb2408109@student.ctu.edu.vn"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Hệ thống sẽ gửi email xác nhận kèm mã QR và vị trí điểm danh về hòm thư này ngay khi hoàn tất.
          </p>
        </div>

        {/* 5. Chọn Lớp học / Buổi học */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Chọn lớp học cần điểm danh
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sessions.map((sess) => (
              <div
                key={sess.code}
                onClick={() => {
                  onSelectSession(sess);
                  if (sess.students) {
                    const found = sess.students.find((s) => s.studentId === studentId.trim().toUpperCase());
                    if (found) {
                      setFullName(found.fullName);
                      setMajor(found.major);
                      setStudentEmail(found.email);
                      setMatchedRosterStudent(true);
                    } else {
                      setMatchedRosterStudent(false);
                    }
                  }
                }}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  sess.code === activeSession.code
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-2xs font-semibold'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-indigo-700 font-bold">{sess.code}</span>
                  {sess.code === activeSession.code && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  )}
                </div>
                <div className="truncate mt-0.5">{sess.name}</div>
                <div className="text-[11px] text-slate-500 mt-1">{sess.room} • {sess.students?.length || 0} SV</div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Định vị vị trí nhập (Geolocation Box) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-sm font-bold text-slate-900">
                Định vị vị trí nhập (GPS)
              </span>
            </div>

            <button
              type="button"
              onClick={handleGetLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-emerald-600' : ''}`} />
              {isLocating ? 'Đang xác định GPS...' : 'Cập nhật lại vị trí'}
            </button>
          </div>

          {/* Location details card */}
          {locationData ? (
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Tọa độ GPS:</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatCoordinates(locationData.latitude, locationData.longitude)}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Độ chính xác:</span>
                <span className="text-emerald-700 font-semibold font-mono">
                  ±{locationData.accuracy} mét
                </span>
              </div>

              {locationData.address && (
                <div className="text-slate-600 text-[11px] leading-relaxed">
                  <span className="text-slate-400 font-medium">Địa chỉ xấp xỉ: </span>
                  {locationData.address}
                </div>
              )}

              {/* Distance to classroom if session has GPS */}
              {activeSession.classroomLocation && distanceMeters !== undefined && (
                <div className={`p-2.5 rounded-lg text-xs font-medium flex items-center justify-between ${
                  locationStatus === 'valid'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  <div className="flex items-center gap-1.5">
                    {locationStatus === 'valid' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span>
                      Cách tâm phòng học: <strong>~{distanceMeters}m</strong> (Bán kính: {activeSession.classroomLocation.radiusMeters}m)
                    </span>
                  </div>
                  <span className="font-bold text-[11px] shrink-0">
                    {locationStatus === 'valid' ? 'HỢP LỆ' : 'NGOÀI BÁN KÍNH'}
                  </span>
                </div>
              )}

              <div className="pt-1 flex items-center justify-end">
                <a
                  href={getGoogleMapsUrl(locationData.latitude, locationData.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Xem trên Google Maps
                </a>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Chưa có thông tin vị trí GPS</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  {locationError || 'Vui lòng nhấn nút "Cập nhật lại vị trí" và cho phép trình duyệt truy cập vị trí của bạn để xác thực điểm danh.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-base rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-5 h-5" />
          Xác Nhận Điểm Danh & Gửi Thông Báo Email
        </button>

        {/* Existing / Recent Card quick button */}
        {recentRecord && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => onViewQrCard(recentRecord)}
              className="text-xs text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1 font-medium transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" /> Xem thẻ điểm danh gần nhất ({recentRecord.studentId})
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
