import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Classroom } from '../types';
import { getCurrentPositionPromise } from '../utils/geo';
import { 
  QrCode, 
  Download, 
  Maximize2, 
  Minimize2, 
  MapPin, 
  Plus, 
  Copy, 
  Check, 
  Compass, 
  ShieldAlert,
  Sparkles,
  Info
} from 'lucide-react';

interface QrGeneratorProps {
  sessions: Classroom[];
  activeSession: Classroom;
  onSelectSession: (session: Classroom) => void;
  onAddSession: (newSession: Classroom) => void;
}

export const QrGenerator: React.FC<QrGeneratorProps> = ({
  sessions,
  activeSession,
  onSelectSession,
  onAddSession,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);

  // New session form state
  const [courseName, setCourseName] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [room, setRoom] = useState('');
  const [lecturerName, setLecturerName] = useState('');
  const [requireGps, setRequireGps] = useState(true);
  const [radiusMeters, setRadiusMeters] = useState(200);
  const [classroomLat, setClassroomLat] = useState<number | null>(null);
  const [classroomLng, setClassroomLng] = useState<number | null>(null);
  const [classroomAddress, setClassroomAddress] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const activeClassName = activeSession.name || activeSession.courseName || 'Lớp học';

  // Generate QR payload
  // The QR code contains an encoded JSON with the session details or direct web app URL params
  const qrDataPayload = JSON.stringify({
    app: 'DiemDanhSinhVien',
    code: activeSession.code,
    course: activeClassName,
    room: activeSession.room,
    gps: activeSession.classroomLocation ? {
      lat: activeSession.classroomLocation.latitude,
      lng: activeSession.classroomLocation.longitude,
      radius: activeSession.classroomLocation.radiusMeters,
    } : null,
    time: Date.now(),
  });

  const getShareableLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('session', activeSession.code);
    return url.toString();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareableLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('class-qr-code-svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 100, 100, 800, 800);

        // Add caption
        ctx.font = 'bold 36px sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.fillText(`${activeClassName} (${activeSession.code})`, 500, 70);
        ctx.font = '24px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`Phòng: ${activeSession.room} - Quét để điểm danh`, 500, 940);
        
        const a = document.createElement('a');
        a.download = `QR_DiemDanh_${activeSession.code}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleGetTeacherGps = async () => {
    setIsGettingGps(true);
    setGpsNotice(null);
    const res = await getCurrentPositionPromise();
    setIsGettingGps(false);
    if (res.success && res.data) {
      setClassroomLat(res.data.latitude);
      setClassroomLng(res.data.longitude);
      setClassroomAddress(res.data.address || `${res.data.latitude.toFixed(5)}, ${res.data.longitude.toFixed(5)}`);
      setGpsNotice(`Đã lấy vị trí thành công (Độ chính xác: ±${res.data.accuracy}m)`);
    } else {
      setGpsNotice(res.error || 'Không thể lấy vị trí hiện tại');
    }
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim() || !sessionCode.trim()) {
      alert('Vui lòng nhập tên môn học và mã buổi học');
      return;
    }

    const newSess: Classroom = {
      id: `class-${Date.now()}`,
      code: sessionCode.trim().toUpperCase(),
      name: courseName.trim(),
      room: room.trim() || 'Phòng học lý thuyết',
      lecturerName: lecturerName.trim() || 'Giảng viên',
      lecturerEmail: 'giangvien@ctu.edu.vn',
      requireGps: requireGps,
      classroomLocation: requireGps && classroomLat !== null && classroomLng !== null ? {
        latitude: classroomLat,
        longitude: classroomLng,
        radiusMeters: radiusMeters,
        addressName: classroomAddress,
      } : undefined,
      students: [],
      createdAt: Date.now(),
    };

    onAddSession(newSess);
    onSelectSession(newSess);
    setShowCreateForm(false);
    // Reset inputs
    setCourseName('');
    setSessionCode('');
    setRoom('');
    setLecturerName('');
    setClassroomLat(null);
    setClassroomLng(null);
    setGpsNotice(null);
  };

  return (
    <div className="space-y-6">
      {/* Presentation Fullscreen Mode for Projector */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col items-center justify-center p-8 animate-in fade-in">
          <button
            onClick={() => setIsFullScreen(false)}
            className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 text-sm font-medium transition-colors"
          >
            <Minimize2 className="w-4 h-4" /> Thoát trình chiếu
          </button>

          <div className="max-w-2xl w-full text-center flex flex-col items-center">
            <span className="px-3.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/30 uppercase tracking-widest mb-3">
              MÃ QR ĐIỂM DANH LỚP HỌC
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
              {activeClassName}
            </h1>
            <p className="text-slate-400 text-lg mb-6">
              Mã: <span className="text-white font-mono font-bold">{activeSession.code}</span> • {activeSession.room}
            </p>

            <div className="p-8 bg-white rounded-3xl shadow-2xl border-4 border-emerald-500 mb-6 flex flex-col items-center">
              <QRCodeSVG
                value={qrDataPayload}
                size={340}
                level="H"
                includeMargin={false}
              />
            </div>

            <p className="text-slate-300 text-base max-w-md">
              Sinh viên dùng điện thoại quét mã QR này để tự động kết nối buổi học và xác nhận điểm danh kèm vị trí GPS.
            </p>
          </div>
        </div>
      )}

      {/* Header & Session Selector */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-indigo-600" />
              Tạo & Quản lý Mã QR Buổi Học
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Trình chiếu mã QR cho sinh viên quét điểm danh trực tiếp tại phòng học
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-xl border border-indigo-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {showCreateForm ? 'Ẩn tạo mới' : 'Tạo buổi học mới'}
            </button>
          </div>
        </div>

        {/* Session Switcher Pills */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Chọn buổi học đang diễn ra:
          </label>
          <div className="flex flex-wrap gap-2">
            {sessions.map((sess) => {
              const isSelected = sess.code === activeSession.code;
              return (
                <button
                  key={sess.code}
                  onClick={() => onSelectSession(sess)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all text-left flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="font-mono font-bold text-xs">{sess.code}</span>
                  <span className="text-xs truncate max-w-[180px]">{sess.name || sess.courseName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Create Session Form Drawer */}
        {showCreateForm && (
          <form onSubmit={handleCreateSession} className="mt-6 p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" /> Thiết lập buổi học & Tọa độ điểm danh
              </h3>
              <span className="text-xs text-slate-500">Giảng viên / Quản trị viên</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên môn học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lập trình Web & Di động"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã buổi học / Lớp học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: CNTT2024-K48"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl uppercase font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phòng học / Giảng đường
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Giảng đường A1 - Phòng 302"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Giảng viên
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: ThS. Trần Hoàng Nam"
                  value={lecturerName}
                  onChange={(e) => setLecturerName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* GPS verification requirement */}
            <div className="pt-2 border-t border-slate-200/80">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireGps}
                    onChange={(e) => setRequireGps(e.target.checked)}
                    className="w-4 h-4 rounded-sm text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-800">
                    Bắt buộc kiểm tra định vị GPS trong bán kính phòng học
                  </span>
                </label>
              </div>

              {requireGps && (
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs text-slate-600">
                      Tọa độ tâm phòng học: {classroomLat ? `${classroomLat.toFixed(5)}, ${classroomLng?.toFixed(5)}` : 'Chưa thiết lập'}
                    </span>
                    <button
                      type="button"
                      onClick={handleGetTeacherGps}
                      disabled={isGettingGps}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors"
                    >
                      <Compass className={`w-3.5 h-3.5 ${isGettingGps ? 'animate-spin' : ''}`} />
                      {isGettingGps ? 'Đang lấy vị trí...' : 'Lấy vị trí GPS hiện tại làm tâm'}
                    </button>
                  </div>

                  {gpsNotice && (
                    <div className="text-xs text-emerald-700 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{gpsNotice}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Bán kính cho phép (mét):</label>
                      <select
                        value={radiusMeters}
                        onChange={(e) => setRadiusMeters(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                      >
                        <option value={50}>50 mét (Phòng học nhỏ)</option>
                        <option value={100}>100 mét (Giảng đường chuẩn)</option>
                        <option value={200}>200 mét (Tòa nhà / Khuôn viên gần)</option>
                        <option value={500}>500 mét (Toàn khu trường)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Mô tả vị trí phòng:</label>
                      <input
                        type="text"
                        placeholder="Khuôn viên trường Đại học..."
                        value={classroomAddress}
                        onChange={(e) => setClassroomAddress(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                Lưu & Kích hoạt buổi học
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Active Session Display & QR Code View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Big QR Visual & Projector trigger */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
          <div className="flex items-center justify-between w-full mb-4">
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
              Mã QR Đang Chiếu
            </span>
            <button
              onClick={() => setIsFullScreen(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" /> Toàn màn hình
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 shadow-inner mb-4">
            <div className="p-4 bg-white rounded-xl shadow-xs">
              <QRCodeSVG
                id="class-qr-code-svg"
                value={qrDataPayload}
                size={240}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>

          <p className="text-xs text-slate-500 font-mono mb-4">
            Phiên: <span className="font-bold text-slate-800">{activeSession.code}</span>
          </p>

          <div className="grid grid-cols-2 gap-2.5 w-full">
            <button
              type="button"
              onClick={handleDownloadQR}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" /> Tải ảnh QR (PNG)
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Đã sao chép link' : 'Sao chép Link điểm danh'}
            </button>
          </div>
        </div>

        {/* Right: Detailed Session Specs */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Thông tin buổi học</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{activeSession.courseName}</h3>
            <p className="text-sm text-slate-500 font-mono mt-0.5">Mã lớp: {activeSession.code}</p>
          </div>

          <div className="space-y-3 pt-2 text-sm">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500">Phòng học:</span>
              <span className="font-semibold text-slate-900">{activeSession.room}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500">Giảng viên phụ trách:</span>
              <span className="font-semibold text-slate-900">{activeSession.lecturerName}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" /> Kiểm tra vị trí GPS:
                </span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  activeSession.requireGps 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {activeSession.requireGps ? 'Bắt buộc' : 'Không bắt buộc'}
                </span>
              </div>

              {activeSession.classroomLocation && (
                <div className="text-xs text-slate-600 pt-1 border-t border-slate-200/60 space-y-1">
                  <div className="flex justify-between">
                    <span>Tọa độ phòng học:</span>
                    <span className="font-mono text-slate-800 font-medium">
                      {activeSession.classroomLocation.latitude.toFixed(5)}, {activeSession.classroomLocation.longitude.toFixed(5)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bán kính cho phép:</span>
                    <span className="font-medium text-emerald-700">
                      {activeSession.classroomLocation.radiusMeters} mét
                    </span>
                  </div>
                  {activeSession.classroomLocation.addressName && (
                    <div className="pt-1 text-[11px] text-slate-500 truncate">
                      {activeSession.classroomLocation.addressName}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-900 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Mã QR này chứa thông tin mã phiên. Khi sinh viên quét mã này bằng điện thoại, hệ thống sẽ tự động kích hoạt định vị GPS để so khớp vị trí thực tế của sinh viên với phòng học.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
