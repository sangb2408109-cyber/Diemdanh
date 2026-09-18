import React, { useState } from 'react';
import { SystemNotification } from '../types';
import { 
  Bell, 
  Mail, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  CheckCheck, 
  ExternalLink,
  ShieldCheck,
  Calendar,
  MapPin,
  QrCode,
  User
} from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SystemNotification[];
  onMarkAllAsRead: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
}) => {
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'teacher'>('all');
  const [selectedNotification, setSelectedNotification] = useState<SystemNotification | null>(null);

  if (!isOpen) return null;

  const filteredNotifs = notifications.filter((n) => {
    if (filterRole === 'all') return true;
    return n.targetRole === filterRole;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Trung Tâm Thông Báo & Email
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-600 text-white">
                    {unreadCount} mới
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Email xác nhận cho sinh viên & thông báo thời gian thực cho giáo viên
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Đã đọc tất cả
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex border-b border-slate-100 bg-slate-50/40 p-2 gap-1.5 text-xs font-semibold">
          <button
            onClick={() => {
              setFilterRole('all');
              setSelectedNotification(null);
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterRole === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({notifications.length})
          </button>
          <button
            onClick={() => {
              setFilterRole('student');
              setSelectedNotification(null);
            }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              filterRole === 'student' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" /> Email Sinh Viên ({notifications.filter((n) => n.targetRole === 'student').length})
          </button>
          <button
            onClick={() => {
              setFilterRole('teacher');
              setSelectedNotification(null);
            }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              filterRole === 'teacher' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" /> Thông Báo Giáo Viên ({notifications.filter((n) => n.targetRole === 'teacher').length})
          </button>
        </div>

        {/* Content Body: List vs Email Detail View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {selectedNotification ? (
            /* Detailed Email / Alert Preview */
            <div className="space-y-4 animate-in fade-in duration-150">
              <button
                onClick={() => setSelectedNotification(null)}
                className="text-xs text-indigo-600 hover:underline font-semibold flex items-center gap-1 mb-2"
              >
                ← Quay lại danh sách thông báo
              </button>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                {/* Email Header */}
                <div className="bg-slate-900 text-white p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/20 text-emerald-300">
                      {selectedNotification.targetRole === 'student' ? 'Email Xác Nhận Điểm Danh' : 'Cảnh Báo Quản Lý Lớp'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{selectedNotification.timestamp}</span>
                  </div>
                  <h4 className="text-base font-bold text-white">{selectedNotification.title}</h4>
                  <div className="text-xs text-slate-300 space-y-0.5 font-mono pt-1 border-t border-slate-800">
                    <div><strong>Người nhận:</strong> {selectedNotification.recipientName} &lt;{selectedNotification.recipientEmail}&gt;</div>
                    <div><strong>Lớp học:</strong> {selectedNotification.className} ({selectedNotification.classCode})</div>
                  </div>
                </div>

                {/* Email Body Content */}
                <div className="p-6 bg-slate-50 space-y-4 text-xs text-slate-700">
                  <p className="text-sm font-medium text-slate-800 leading-relaxed">
                    {selectedNotification.content}
                  </p>

                  {selectedNotification.emailPayload && (
                    <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-slate-900">Chi tiết chứng nhận điểm danh điện tử</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-slate-600">
                        <div><strong>Mã SV:</strong> {selectedNotification.emailPayload.studentId}</div>
                        <div><strong>Họ tên:</strong> {selectedNotification.emailPayload.studentName}</div>
                        <div><strong>Thời gian:</strong> {selectedNotification.emailPayload.timestamp}</div>
                        <div><strong>Mã lớp:</strong> {selectedNotification.emailPayload.sessionCode}</div>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-emerald-800 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {selectedNotification.emailPayload.gpsStatusText}
                        </div>
                        {selectedNotification.emailPayload.locationText && (
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            {selectedNotification.emailPayload.locationText}
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] font-mono text-slate-400 bg-slate-50 p-2 rounded-lg truncate">
                        Mã xác thực QR: {selectedNotification.emailPayload.qrToken}
                      </div>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 text-center pt-2">
                    Email tự động được gửi từ Hệ thống Điểm Danh Sinh Viên Thông Minh. Vui lòng không phản hồi lại email này.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* List of Notifications */
            filteredNotifs.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                Chưa có thông báo nào trong hộp thư này.
              </div>
            ) : (
              filteredNotifs.map((item) => {
                const isStudent = item.targetRole === 'student';
                const isWarning = item.type === 'teacher_warning';

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedNotification(item)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-xs flex items-start gap-3 ${
                      !item.isRead ? 'bg-indigo-50/40 border-indigo-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isWarning
                        ? 'bg-amber-100 text-amber-700'
                        : isStudent
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {isWarning ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : isStudent ? (
                        <Mail className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {item.timestamp}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                        {item.content}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span>Đến: <strong className="text-slate-600">{item.recipientEmail}</strong></span>
                        <span>•</span>
                        <span className="text-indigo-600 font-semibold hover:underline">
                          Xem chi tiết email →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
