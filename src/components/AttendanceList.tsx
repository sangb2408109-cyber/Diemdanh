import React, { useState, useMemo } from 'react';
import { AttendanceRecord, AttendanceSession } from '../types';
import { exportAttendanceToCSV } from '../utils/export';
import { formatCoordinates, getGoogleMapsUrl } from '../utils/geo';
import { 
  Users, 
  Search, 
  Download, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ExternalLink, 
  Trash2, 
  QrCode, 
  FileSpreadsheet,
  Filter,
  GraduationCap
} from 'lucide-react';

interface AttendanceListProps {
  records: AttendanceRecord[];
  sessions: AttendanceSession[];
  activeSession: AttendanceSession;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  onViewQrCard: (record: AttendanceRecord) => void;
}

export const AttendanceList: React.FC<AttendanceListProps> = ({
  records,
  sessions,
  activeSession,
  onDeleteRecord,
  onClearAll,
  onViewQrCard,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSessionCode, setSelectedSessionCode] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMajor, setSelectedMajor] = useState<string>('all');

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchSearch =
        rec.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.major.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSession =
        selectedSessionCode === 'all' || rec.sessionCode === selectedSessionCode;

      const matchStatus =
        selectedStatus === 'all' || rec.locationStatus === selectedStatus;

      const matchMajor =
        selectedMajor === 'all' || rec.major === selectedMajor;

      return matchSearch && matchSession && matchStatus && matchMajor;
    });
  }, [records, searchTerm, selectedSessionCode, selectedStatus, selectedMajor]);

  // Unique majors in current records
  const uniqueMajors = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => set.add(r.major));
    return Array.from(set);
  }, [records]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const validGps = filteredRecords.filter((r) => r.locationStatus === 'valid').length;
    const outOfRange = filteredRecords.filter((r) => r.locationStatus === 'out_of_range').length;
    const noGps = filteredRecords.filter((r) => r.locationStatus === 'no_gps').length;
    return { total, validGps, outOfRange, noGps };
  }, [filteredRecords]);

  const handleExportCSV = () => {
    const sessionObj = sessions.find((s) => s.code === selectedSessionCode);
    const title = sessionObj ? `${sessionObj.code}_${sessionObj.courseName}` : 'TatCaBuoiHoc';
    exportAttendanceToCSV(filteredRecords, title);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tổng số sinh viên
            </span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-500">lượt điểm danh</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Vị trí hợp lệ
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{stats.validGps}</span>
            <span className="text-xs text-slate-500">trong bán kính</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              Ngoài bán kính
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">{stats.outOfRange}</span>
            <span className="text-xs text-slate-500">cần kiểm tra</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Không có GPS
            </span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-700">{stats.noGps}</span>
            <span className="text-xs text-slate-500">chưa bật vị trí</span>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm theo MSSV, họ tên, hoặc ngành học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" /> Xuất Excel (CSV)
            </button>

            {records.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách điểm danh này không?')) {
                    onClearAll();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-medium rounded-xl border border-slate-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-slate-500 mb-1 font-medium">Buổi học:</label>
            <select
              value={selectedSessionCode}
              onChange={(e) => setSelectedSessionCode(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="all">Tất cả các buổi học</option>
              {sessions.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} - {s.courseName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1 font-medium">Ngành học:</label>
            <select
              value={selectedMajor}
              onChange={(e) => setSelectedMajor(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="all">Tất cả các ngành</option>
              {uniqueMajors.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1 font-medium">Trạng thái GPS:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="valid">Hợp lệ (Trong lớp)</option>
              <option value="out_of_range">Vượt bán kính phòng học</option>
              <option value="no_gps">Không có GPS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">STT</th>
                <th className="py-3.5 px-4">Mã số SV</th>
                <th className="py-3.5 px-4">Họ và tên</th>
                <th className="py-3.5 px-4">Ngành học</th>
                <th className="py-3.5 px-4">Thời gian</th>
                <th className="py-3.5 px-4">Vị trí GPS & Khoảng cách</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Không tìm thấy sinh viên nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item, index) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                        {index + 1}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-1 rounded-md">
                          {item.studentId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {item.fullName}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-700">
                        <span className="inline-flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {item.major}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                        {item.timestamp}
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        {item.location ? (
                          <div className="space-y-0.5">
                            <div className="font-mono text-slate-800 font-medium flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                              {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
                              <a
                                href={getGoogleMapsUrl(item.location.latitude, item.location.longitude)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Xem trên Google Maps"
                                className="text-indigo-600 hover:text-indigo-800 ml-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            {item.distanceToClassroom !== undefined && (
                              <div className="text-[11px] text-slate-500">
                                Cách lớp: ~{item.distanceToClassroom}m
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Không xác định</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {item.locationStatus === 'valid' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Hợp lệ
                          </span>
                        )}
                        {item.locationStatus === 'out_of_range' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5" /> Ngoài bán kính
                          </span>
                        )}
                        {item.locationStatus === 'no_gps' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <XCircle className="w-3.5 h-3.5" /> Không có GPS
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onViewQrCard(item)}
                            title="Xem thẻ QR sinh viên"
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(item.id)}
                            title="Xóa bản ghi"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
