import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AttendanceRecord } from '../types';
import { CheckCircle2, Download, X, MapPin, Calendar, BookOpen, GraduationCap, ShieldCheck } from 'lucide-react';

interface StudentQrCardModalProps {
  record: AttendanceRecord | null;
  onClose: () => void;
}

export const StudentQrCardModal: React.FC<StudentQrCardModalProps> = ({ record, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!record) return null;

  // JSON string encoded inside the QR code for instant digital verification
  const qrPayload = JSON.stringify({
    type: 'ATTENDANCE_VERIFIED',
    mssv: record.studentId,
    name: record.fullName,
    major: record.major,
    session: record.sessionCode,
    course: record.courseName,
    time: record.timestamp,
    loc: record.location ? `${record.location.latitude.toFixed(5)},${record.location.longitude.toFixed(5)}` : 'N/A',
    status: record.locationStatus,
    id: record.id,
  });

  const handleDownloadQR = () => {
    const svg = document.getElementById('student-qr-code-svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 600;
      canvas.height = 600;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50, 500, 500);
        
        const a = document.createElement('a');
        a.download = `QR_DiemDanh_${record.studentId}_${record.sessionCode}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        ref={cardRef}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
      >
        {/* Card Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-3 border border-white/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Thẻ Điểm Danh Điện Tử</h2>
          <p className="text-emerald-100 text-xs mt-1">Xác thực thành công với GPS & Mã QR</p>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-5">
          {/* QR Code section */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="bg-white p-3 rounded-lg shadow-xs border border-slate-200">
              <QRCodeSVG
                id="student-qr-code-svg"
                value={qrPayload}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>
            <span className="text-xs font-mono text-slate-500 mt-2">Mã bảo mật: {record.id.slice(0, 8).toUpperCase()}</span>
          </div>

          {/* Student Info Details */}
          <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Mã sinh viên (MSSV):</span>
              <span className="font-bold font-mono text-emerald-700 text-base">{record.studentId}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Họ và tên:</span>
              <span className="font-semibold text-slate-900">{record.fullName}</span>
            </div>

            <div className="flex items-start justify-between pb-2 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Ngành:
              </span>
              <span className="font-medium text-slate-800 text-right max-w-[200px]">{record.major}</span>
            </div>

            <div className="flex items-start justify-between pb-2 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Buổi học:
              </span>
              <span className="font-medium text-slate-800 text-right max-w-[200px]">
                {record.courseName || record.sessionCode}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Thời gian:
              </span>
              <span className="text-slate-700 text-xs font-mono">{record.timestamp}</span>
            </div>

            {record.location && (
              <div className="pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Vị trí định vị:
                  </span>
                  <span className="font-mono text-slate-700 font-semibold">
                    {record.location.latitude.toFixed(4)}, {record.location.longitude.toFixed(4)}
                  </span>
                </div>
                {record.location.address && (
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug truncate">
                    {record.location.address}
                  </p>
                )}
                {record.distanceToClassroom !== undefined && (
                  <div className="mt-1 text-xs">
                    <span className="text-emerald-700 font-medium">
                      Cách phòng học: ~{record.distanceToClassroom}m ({record.locationStatus === 'valid' ? 'Hợp lệ' : 'Ngoài phạm vi'})
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDownloadQR}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" /> Tải mã QR thẻ
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-xl border border-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
