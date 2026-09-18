import React, { useState, useMemo } from 'react';
import { AttendanceRecord, Classroom } from '../types';
import { exportAttendanceToCSV, exportClassAttendanceToCSV } from '../utils/export';
import { formatCoordinates, getGoogleMapsUrl } from '../utils/geo';
import { 
  History, 
  Search, 
  Calendar, 
  Building2, 
  FileSpreadsheet, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  QrCode, 
  ExternalLink, 
  Trash2, 
  Users, 
  UserX,
  Mail,
  Filter,
  Check,
  Clock,
  Download
} from 'lucide-react';

interface AttendanceHistoryProps {
  records: AttendanceRecord[];
  classrooms: Classroom[];
  activeClassroom: Classroom;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  onViewQrCard: (record: AttendanceRecord) => void;
}

export const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({
  records,
  classrooms,
  activeClassroom,
  onDeleteRecord,
  onClearAll,
  onViewQrCard,
}) => {
  const [selectedClassCode, setSelectedClassCode] = useState<string>(activeClassroom?.code || 'all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all'); // 'all' | 'today' | 'yesterday' | custom YYYY-MM-DD
  const [customDate, setCustomDate] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'present' | 'absent'>('present');

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // 1. Class filter
      if (selectedClassCode !== 'all' && rec.sessionCode !== selectedClassCode) {
        return false;
      }

      // 2. Date filter
      if (selectedDateFilter === 'today' && rec.dateOnly !== todayStr) {
        return false;
      }
      if (selectedDateFilter === 'yesterday' && rec.dateOnly !== yesterdayStr) {
        return false;
      }
      if (selectedDateFilter === 'custom' && customDate && rec.dateOnly !== customDate) {
        return false;
      }

      // 3. Status filter
      if (selectedStatus !== 'all' && rec.locationStatus !== selectedStatus) {
        return false;
      }

      // 4. Search query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const match =
          rec.studentId.toLowerCase().includes(query) ||
          rec.fullName.toLowerCase().includes(query) ||
          rec.major.toLowerCase().includes(query) ||
          (rec.studentEmail && rec.studentEmail.toLowerCase().includes(query));
        if (!match) return false;
      }

      return true;
    });
  }, [records, selectedClassCode, selectedDateFilter, customDate, selectedStatus, searchTerm, todayStr, yesterdayStr]);

  // Absent student calculation for selected class
  const targetClass = classrooms.find((c) => c.code === selectedClassCode);
  const absentStudents = useMemo(() => {
    if (!targetClass) return [];
    
    // Checked in student IDs in the current filtered date/records
    const attendedIds = new Set(filteredRecords.map((r) => r.studentId));
    return targetClass.students.filter((s) => !attendedIds.has(s.studentId));
  }, [targetClass, filteredRecords]);

  const handleExport = () => {
    if (targetClass) {
      const activeDate =
        selectedDateFilter === 'today'
          ? todayStr
          : selectedDateFilter === 'yesterday'
          ? yesterdayStr
          : selectedDateFilter === 'custom'
          ? customDate
          : 'all';
      exportClassAttendanceToCSV(targetClass, records, { dateFilter: activeDate });
    } else {
      exportAttendanceToCSV(filteredRecords, 'TatCaLopHoc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Lịch Sử Điểm Danh & Đối Soát
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Ghi lại đầy đủ ngày giờ, thông tin sinh viên, vị trí GPS và mã QR đã sử dụng
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            title="Xuất file Excel (.csv) với mã hóa tiếng Việt chuẩn UTF-8 BOM"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {targetClass ? `Xuất Excel Lớp ${targetClass.code} (.csv)` : 'Xuất Báo Cáo Excel (.csv)'}
          </button>
          {records.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử điểm danh?')) {
                  onClearAll();
                }
              }}
              className="p-2.5 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl border border-slate-200 text-xs transition-colors"
              title="Xóa toàn bộ lịch sử"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-700 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-indigo-600" /> Bộ Lọc Lịch Sử Điểm Danh
          </div>

          {/* Quick Class Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-medium">Chọn nhanh:</span>
            <button
              onClick={() => setSelectedClassCode('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedClassCode === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            {classrooms.map((c) => (
              <button
                key={c.code}
                onClick={() => setSelectedClassCode(c.code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedClassCode === c.code
                    ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.code}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Filter 1: By Classroom */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Theo Lớp học:</label>
            <select
              value={selectedClassCode}
              onChange={(e) => setSelectedClassCode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
            >
              <option value="all">Tất cả các lớp</option>
              {classrooms.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 2: By Date */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Theo Ngày:</label>
            <select
              value={selectedDateFilter}
              onChange={(e) => {
                setSelectedDateFilter(e.target.value);
                if (e.target.value !== 'custom') setCustomDate('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
            >
              <option value="all">Tất cả các ngày</option>
              <option value="today">Hôm nay ({todayStr})</option>
              <option value="yesterday">Hôm qua ({yesterdayStr})</option>
              <option value="custom">Chọn ngày tùy chỉnh...</option>
            </select>
            {selectedDateFilter === 'custom' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="mt-2 w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
              />
            )}
          </div>

          {/* Filter 3: GPS Status */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Trạng thái GPS:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="valid">Hợp lệ (Trong lớp)</option>
              <option value="out_of_range">Ngoài bán kính</option>
              <option value="no_gps">Không có GPS</option>
            </select>
          </div>

          {/* Filter 4: Keyword Search */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Tìm kiếm sinh viên:</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Nhập MSSV, họ tên, ngành..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Tab switch between Present vs Absent if specific class is selected */}
        {targetClass && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('present')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'present'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã Điểm Danh ({filteredRecords.length})
              </button>

              <button
                onClick={() => setActiveTab('absent')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'absent'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <UserX className="w-3.5 h-3.5" />
                Chưa Điểm Danh / Vắng ({absentStudents.length})
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-slate-500">
                Sĩ số lớp: <strong>{targetClass.students.length}</strong> • Tỷ lệ có mặt:{' '}
                <strong className="text-indigo-700">
                  {targetClass.students.length > 0
                    ? Math.round((filteredRecords.length / targetClass.students.length) * 100)
                    : 0}
                  %
                </strong>
              </span>

              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-300 transition-colors"
                title={`Xuất báo cáo Excel (.csv) cho lớp ${targetClass.code}`}
              >
                <Download className="w-3.5 h-3.5" /> Xuất Excel lớp này
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {activeTab === 'present' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">STT</th>
                  <th className="py-3.5 px-4">Ngày & Giờ</th>
                  <th className="py-3.5 px-4">Mã số SV</th>
                  <th className="py-3.5 px-4">Họ và tên</th>
                  <th className="py-3.5 px-4">Lớp / Môn học</th>
                  <th className="py-3.5 px-4">Vị trí GPS & Địa chỉ</th>
                  <th className="py-3.5 px-4">Mã QR đã dùng</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      Không tìm thấy lịch sử điểm danh phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                        {index + 1}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-mono text-slate-700 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{item.timeOnly}</div>
                        <div className="text-[11px] text-slate-500">{item.dateOnly}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-1 rounded-md">
                          {item.studentId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{item.fullName}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[160px]">{item.major}</div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-700">
                        <div className="font-mono font-semibold text-indigo-700">{item.sessionCode}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{item.courseName}</div>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        {item.location ? (
                          <div className="space-y-0.5 max-w-[200px]">
                            <div className="font-mono text-slate-800 font-medium flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                              {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
                              <a
                                href={getGoogleMapsUrl(item.location.latitude, item.location.longitude)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 ml-1"
                                title="Xem trên Google Maps"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            {item.distanceToClassroom !== undefined && (
                              <div className="text-[11px] text-slate-500">
                                Cách lớp: ~{item.distanceToClassroom}m
                              </div>
                            )}
                            {item.location.address && (
                              <div className="text-[10px] text-slate-400 truncate">
                                {item.location.address}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Không xác định GPS</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                        <div className="truncate max-w-[120px] bg-slate-100 px-2 py-0.5 rounded-sm" title={item.qrCodeUsed}>
                          {item.qrCodeUsed}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {item.locationStatus === 'valid' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Hợp lệ
                          </span>
                        )}
                        {item.locationStatus === 'out_of_range' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3 h-3" /> Ngoài bán kính
                          </span>
                        )}
                        {item.locationStatus === 'no_gps' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            <XCircle className="w-3 h-3" /> Không GPS
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onViewQrCard(item)}
                            title="Xem lại thẻ QR sinh viên"
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(item.id)}
                            title="Xóa lượt điểm danh này"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Absent Students View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-rose-50/60 border-b border-rose-100 text-xs font-semibold text-rose-900 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">STT</th>
                  <th className="py-3.5 px-4">Mã số sinh viên (MSSV)</th>
                  <th className="py-3.5 px-4">Họ và tên</th>
                  <th className="py-3.5 px-4">Ngành học</th>
                  <th className="py-3.5 px-4">Email liên hệ</th>
                  <th className="py-3.5 px-4">Tình trạng buổi này</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {absentStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-emerald-700 bg-emerald-50/30 font-medium">
                      🎉 Tuyệt vời! 100% sinh viên của lớp đã có mặt điểm danh đầy đủ!
                    </td>
                  </tr>
                ) : (
                  absentStudents.map((stu, index) => (
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
                        {stu.major}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-indigo-600 font-mono">
                        {stu.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                          <UserX className="w-3.5 h-3.5" /> Chưa điểm danh (Vắng)
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
