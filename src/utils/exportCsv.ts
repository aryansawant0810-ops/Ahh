import { AttendanceRecord, ClassItem, User } from '../types/attendance';

export function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportDailyAttendanceCSV(
  cls: ClassItem,
  date: string,
  students: User[],
  records: AttendanceRecord[]
) {
  const headers = ['Student ID', 'Student Name', 'Email', 'Class Code', 'Class Name', 'Date', 'Status', 'Method', 'Check-in Time', 'Notes'];
  
  const rows = students.map((student) => {
    const record = records.find(r => r.studentId === student.id && r.date === date);
    const status = record?.status || 'unmarked';
    const method = record?.method || 'N/A';
    const time = record?.timestamp ? new Date(record.timestamp).toLocaleTimeString() : 'N/A';
    const note = (record?.note || '').replace(/"/g, '""');

    return [
      `"${student.studentIdNumber || student.id}"`,
      `"${student.name}"`,
      `"${student.email}"`,
      `"${cls.code}"`,
      `"${cls.name}"`,
      `"${date}"`,
      `"${status.toUpperCase()}"`,
      `"${method}"`,
      `"${time}"`,
      `"${note}"`
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const filename = `${cls.code}_attendance_${date}.csv`;
  downloadCSV(filename, csv);
}

export function exportSemesterSummaryCSV(
  cls: ClassItem,
  students: User[],
  records: AttendanceRecord[],
  totalSessions: number
) {
  const headers = [
    'Student ID',
    'Student Name',
    'Email',
    'Class',
    'Total Sessions',
    'Present',
    'Late',
    'Excused',
    'Absent',
    'Attendance %',
    'Standing'
  ];

  const rows = students.map((student) => {
    const studentRecords = records.filter(r => r.studentId === student.id);
    const present = studentRecords.filter(r => r.status === 'present').length;
    const late = studentRecords.filter(r => r.status === 'late').length;
    const excused = studentRecords.filter(r => r.status === 'excused').length;
    const absent = studentRecords.filter(r => r.status === 'absent').length;

    // Weight late as 0.5 or present
    const rate = totalSessions > 0 ? Math.round(((present + (late * 0.75) + excused) / Math.max(totalSessions, 1)) * 100) : 100;
    const standing = rate >= 85 ? 'Good' : rate >= 75 ? 'Warning' : 'Critical Risk';

    return [
      `"${student.studentIdNumber || student.id}"`,
      `"${student.name}"`,
      `"${student.email}"`,
      `"${cls.code}"`,
      totalSessions,
      present,
      late,
      excused,
      absent,
      `"${rate}%"`,
      `"${standing}"`
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const filename = `${cls.code}_semester_attendance_summary.csv`;
  downloadCSV(filename, csv);
}
