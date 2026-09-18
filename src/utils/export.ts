import { AttendanceRecord, Classroom } from '../types';

/**
 * Escapes a cell value for CSV format
 */
function escapeCsvCell(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  // If value contains comma, quotes, or newline, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Exports comprehensive attendance report for a specific selected classroom:
 * Includes class metadata, roster attendance matrix (present/absent), and detailed audit logs.
 */
export function exportClassAttendanceToCSV(
  classroom: Classroom,
  allRecords: AttendanceRecord[],
  options?: { dateFilter?: string }
) {
  if (!classroom) {
    alert('Không tìm thấy thông tin lớp học để xuất file.');
    return;
  }

  // 1. Filter records matching this class code
  let classRecords = allRecords.filter(
    (rec) => rec.sessionCode.toUpperCase() === classroom.code.toUpperCase()
  );

  // Filter by date if specified and not 'all'
  if (options?.dateFilter && options.dateFilter !== 'all') {
    classRecords = classRecords.filter((rec) => rec.dateOnly === options.dateFilter);
  }

  const attendedIds = new Set(classRecords.map((r) => r.studentId.toUpperCase()));
  const totalStudents = classroom.students.length;
  const attendedCount = classroom.students.filter((s) => attendedIds.has(s.studentId.toUpperCase())).length;
  const absentCount = Math.max(0, totalStudents - attendedCount);
  const attendanceRate = totalStudents > 0 ? ((attendedCount / totalStudents) * 100).toFixed(1) : '0.0';

  const exportDateStr = new Date().toLocaleString('vi-VN');
  const fileDateSuffix = new Date().toISOString().slice(0, 10);

  // Metadata block
  const lines: string[] = [
    'BÁO CÁO ĐIỂM DANH LỚP HỌC - ĐẠI HỌC CẦN THƠ',
    `MÃ LỚP / HỌC PHẦN,${escapeCsvCell(classroom.code)}`,
    `TÊN MÔN HỌC / LỚP,${escapeCsvCell(classroom.name)}`,
    `GIẢNG VIÊN PHỤ TRÁCH,${escapeCsvCell(`${classroom.lecturerName} (${classroom.lecturerEmail})`)}`,
    `PHÒNG HỌC & ĐỊA ĐIỂM,${escapeCsvCell(classroom.room)}`,
    `YÊU CẦU ĐỊNH VỊ GPS,${escapeCsvCell(classroom.requireGps ? `Có (Bán kính ${classroom.classroomLocation?.radiusMeters || 200}m)` : 'Không bắt buộc')}`,
    `SĨ SỐ LỚP HỌC,${escapeCsvCell(`${totalStudents} sinh viên`)}`,
    `SỐ SINH VIÊN CÓ MẶT,${escapeCsvCell(`${attendedCount} / ${totalStudents} (Tỷ lệ: ${attendanceRate}%)`)}`,
    `SỐ SINH VIÊN VẮNG MẶT,${escapeCsvCell(`${absentCount} sinh viên`)}`,
    `TỔNG SỐ LƯỢT ĐIỂM DANH,${escapeCsvCell(`${classRecords.length} lượt`)}`,
    `NGÀY XUẤT BÁO CÁO,${escapeCsvCell(exportDateStr)}`,
    options?.dateFilter && options.dateFilter !== 'all' ? `BỘ LỌC NGÀY,${escapeCsvCell(options.dateFilter)}` : 'BỘ LỌC NGÀY,"Tất cả các ngày"',
    '', // blank separator
  ];

  // SECTION 1: BẢNG TỔNG HỢP SĨ SỐ LỚP (CÓ MẶT / VẮNG MẶT)
  lines.push('--- BẢNG 1: TỔNG HỢP SĨ SỐ LỚP HỌC & TÌNH TRẠNG ĐIỂM DANH ---');
  const rosterHeaders = [
    'STT',
    'Mã số sinh viên (MSSV)',
    'Họ và tên',
    'Ngành học',
    'Email sinh viên',
    'Tình trạng điểm danh',
    'Số lượt điểm danh',
    'Thời gian điểm danh gần nhất',
    'Trạng thái GPS',
    'Khoảng cách tới phòng học (m)',
    'Tọa độ GPS ghi nhận',
    'Địa chỉ GPS',
    'Mã xác thực QR',
  ];
  lines.push(rosterHeaders.join(','));

  classroom.students.forEach((stu, index) => {
    const studentRecords = classRecords.filter(
      (r) => r.studentId.toUpperCase() === stu.studentId.toUpperCase()
    );
    const isPresent = studentRecords.length > 0;
    const latestRec = studentRecords[0]; // records are sorted latest first

    let statusText = isPresent ? 'CÓ MẶT' : 'CHƯA ĐIỂM DANH (VẮNG)';
    let gpsText = 'Chưa có';
    let distText = 'N/A';
    let coordText = '';
    let addrText = '';
    let qrToken = '';

    if (latestRec) {
      if (latestRec.locationStatus === 'valid') gpsText = 'Hợp lệ trong phòng học';
      else if (latestRec.locationStatus === 'out_of_range') gpsText = 'Vượt bán kính phòng học';
      else if (latestRec.locationStatus === 'warning') gpsText = 'Cảnh báo GPS sai lệch';
      else gpsText = 'Không có GPS';

      distText = latestRec.distanceToClassroom !== undefined ? `${latestRec.distanceToClassroom}m` : 'N/A';
      coordText = latestRec.location ? `${latestRec.location.latitude.toFixed(6)}, ${latestRec.location.longitude.toFixed(6)}` : '';
      addrText = latestRec.location?.address || '';
      qrToken = latestRec.qrCodeUsed || '';
    }

    lines.push([
      index + 1,
      escapeCsvCell(stu.studentId),
      escapeCsvCell(stu.fullName),
      escapeCsvCell(stu.major),
      escapeCsvCell(stu.email || ''),
      escapeCsvCell(statusText),
      escapeCsvCell(studentRecords.length),
      escapeCsvCell(latestRec ? latestRec.timestamp : 'Chưa điểm danh'),
      escapeCsvCell(gpsText),
      escapeCsvCell(distText),
      escapeCsvCell(coordText),
      escapeCsvCell(addrText),
      escapeCsvCell(qrToken),
    ].join(','));
  });

  // SECTION 2: NHẬT KÝ CHI TIẾT TỪNG LƯỢT ĐIỂM DANH
  lines.push('');
  lines.push('--- BẢNG 2: NHẬT KÝ CHI TIẾT TẤT CẢ LƯỢT ĐIỂM DANH (LỊCH SỬ THỜI GIAN THỰC) ---');
  const auditHeaders = [
    'STT',
    'Mã số sinh viên (MSSV)',
    'Họ và tên',
    'Ngành học',
    'Mã lớp / Học phần',
    'Tên môn học',
    'Ngày điểm danh',
    'Giờ điểm danh',
    'Thời gian ghi nhận',
    'Trạng thái GPS',
    'Khoảng cách tới phòng học (m)',
    'Vĩ độ (Latitude)',
    'Kinh độ (Longitude)',
    'Độ chính xác GPS (m)',
    'Địa chỉ GPS',
    'Mã QR xác thực',
    'Email nhận thông báo',
    'Liên kết Google Maps',
  ];
  lines.push(auditHeaders.join(','));

  if (classRecords.length === 0) {
    lines.push('"Chưa có lượt điểm danh nào được ghi nhận cho lớp này trong khoảng thời gian đã chọn"');
  } else {
    classRecords.forEach((rec, index) => {
      let statusLabel = 'Không có GPS';
      if (rec.locationStatus === 'valid') statusLabel = 'Hợp lệ trong lớp';
      else if (rec.locationStatus === 'out_of_range') statusLabel = 'Vượt bán kính phòng học';
      else if (rec.locationStatus === 'warning') statusLabel = 'Cảnh báo GPS sai lệch';

      const lat = rec.location ? rec.location.latitude.toFixed(6) : '';
      const lng = rec.location ? rec.location.longitude.toFixed(6) : '';
      const acc = rec.location ? `${rec.location.accuracy}m` : '';
      const dist = rec.distanceToClassroom !== undefined ? `${rec.distanceToClassroom}m` : 'N/A';
      const mapUrl = rec.location ? `https://www.google.com/maps?q=${lat},${lng}` : '';

      lines.push([
        index + 1,
        escapeCsvCell(rec.studentId),
        escapeCsvCell(rec.fullName),
        escapeCsvCell(rec.major),
        escapeCsvCell(rec.sessionCode),
        escapeCsvCell(rec.courseName || classroom.name),
        escapeCsvCell(rec.dateOnly || ''),
        escapeCsvCell(rec.timeOnly || ''),
        escapeCsvCell(rec.timestamp),
        escapeCsvCell(statusLabel),
        escapeCsvCell(dist),
        escapeCsvCell(lat),
        escapeCsvCell(lng),
        escapeCsvCell(acc),
        escapeCsvCell(rec.location?.address || ''),
        escapeCsvCell(rec.qrCodeUsed || ''),
        escapeCsvCell(rec.studentEmail || ''),
        escapeCsvCell(mapUrl),
      ].join(','));
    });
  }

  // Prepend UTF-8 BOM (\uFEFF) for Excel
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const cleanCode = classroom.code.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `DiemDanh_${cleanCode}_${fileDateSuffix}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports arbitrary attendance records to a CSV file with UTF-8 BOM for Microsoft Excel compatibility in Vietnamese
 */
export function exportAttendanceToCSV(records: AttendanceRecord[], sessionTitle?: string) {
  if (!records || records.length === 0) {
    alert('Không có dữ liệu điểm danh để xuất file.');
    return;
  }

  const headers = [
    'STT',
    'Mã số sinh viên (MSSV)',
    'Họ và tên',
    'Ngành học',
    'Mã buổi học / Môn học',
    'Tên môn học',
    'Ngày điểm danh',
    'Giờ điểm danh',
    'Thời gian đầy đủ',
    'Vĩ độ (Latitude)',
    'Kinh độ (Longitude)',
    'Độ chính xác (m)',
    'Khoảng cách tới lớp (m)',
    'Trạng thái vị trí GPS',
    'Địa chỉ / Vị trí ghi nhận',
    'Mã QR xác thực',
    'Email sinh viên',
    'Liên kết Google Maps',
  ];

  const rows = records.map((record, index) => {
    let statusLabel = 'Không có GPS';
    if (record.locationStatus === 'valid') statusLabel = 'Hợp lệ (Trong lớp)';
    else if (record.locationStatus === 'out_of_range') statusLabel = 'Vượt bán kính phòng học';
    else if (record.locationStatus === 'warning') statusLabel = 'Cảnh báo GPS sai lệch';

    const lat = record.location ? record.location.latitude.toFixed(6) : '';
    const lng = record.location ? record.location.longitude.toFixed(6) : '';
    const acc = record.location ? `${record.location.accuracy}m` : '';
    const dist = record.distanceToClassroom !== undefined ? `${record.distanceToClassroom}m` : 'N/A';
    const addr = record.location?.address || '';
    const mapUrl = record.location ? `https://www.google.com/maps?q=${lat},${lng}` : '';

    return [
      index + 1,
      escapeCsvCell(record.studentId),
      escapeCsvCell(record.fullName),
      escapeCsvCell(record.major),
      escapeCsvCell(record.sessionCode),
      escapeCsvCell(record.courseName || ''),
      escapeCsvCell(record.dateOnly || ''),
      escapeCsvCell(record.timeOnly || ''),
      escapeCsvCell(record.timestamp),
      escapeCsvCell(lat),
      escapeCsvCell(lng),
      escapeCsvCell(acc),
      escapeCsvCell(dist),
      escapeCsvCell(statusLabel),
      escapeCsvCell(addr),
      escapeCsvCell(record.qrCodeUsed || ''),
      escapeCsvCell(record.studentEmail || ''),
      escapeCsvCell(mapUrl),
    ].join(',');
  });

  // Prepend UTF-8 BOM (\uFEFF) so Excel opens UTF-8 without garbled Vietnamese text
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const cleanTitle = sessionTitle ? sessionTitle.replace(/\s+/g, '_') : 'SinhVien';
  const link = document.createElement('a');
  const fileName = `DiemDanh_${cleanTitle}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
