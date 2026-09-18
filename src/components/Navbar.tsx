import React from 'react';
import { 
  GraduationCap, 
  QrCode, 
  Building2, 
  History, 
  CheckSquare,
  Bell,
  Sparkles
} from 'lucide-react';
import { Classroom } from '../types';

export type ActiveNavTab = 'student' | 'classes' | 'generator' | 'history';

interface NavbarProps {
  activeTab: ActiveNavTab;
  onChangeTab: (tab: ActiveNavTab) => void;
  activeSession: Classroom;
  totalRecordsCount: number;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onChangeTab,
  activeSession,
  totalRecordsCount,
  unreadNotificationsCount,
  onOpenNotifications,
}) => {
  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Brand logo & title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-xs">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 text-sm sm:text-base md:text-lg tracking-tight">
                  Điểm Danh Sinh Viên
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  GPS & QR Code
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Quản lý lớp học, điểm danh GPS, QR Code & thông báo email tự động
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-full">
            <button
              onClick={() => onChangeTab('student')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'student'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Điểm danh</span>
            </button>

            <button
              onClick={() => onChangeTab('classes')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'classes'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Quản lý lớp</span>
            </button>

            <button
              onClick={() => onChangeTab('generator')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'generator'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Tạo mã</span> QR
            </button>

            <button
              onClick={() => onChangeTab('history')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Lịch sử</span>
              <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'history' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {totalRecordsCount}
              </span>
            </button>
          </nav>

          {/* Notification Center Trigger */}
          <div className="flex items-center">
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Xem thông báo & email xác nhận"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
