import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { AttendanceStatus } from '../../types/attendance';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Layers,
  MessageSquare,
  QrCode,
  Search,
  Send,
  Sparkles,
  Trash2,
  UserCheck,
  UserX,
  Users
} from 'lucide-react';

interface ManualRollCallProps {
  onOpenQRModal: () => void;
  onOpenNotifications: () => void;
}

export const ManualRollCall: React.FC<ManualRollCallProps> = ({ onOpenQRModal, onOpenNotifications }) => {
  const {
    selectedClass,
    selectedDate,
    getStudentsForClass,
    records,
    markAttendance,
    bulkMarkAttendance,
    clearDateAttendance,
    dispatchAbsentAlerts,
    downloadDailyReport
  } = useAttendance();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [alertSuccessMessage, setAlertSuccessMessage] = useState<string | null>(null);

  const students = getStudentsForClass(selectedClass.id);
  const classDateRecords = records.filter(r => r.classId === selectedClass.id && r.date === selectedDate);

  // Counts
  const presentCount = classDateRecords.filter(r => r.status === 'present').length;
  const lateCount = classDateRecords.filter(r => r.status === 'late').length;
  const absentCount = classDateRecords.filter(r => r.status === 'absent').length;
  const excusedCount = classDateRecords.filter(r => r.status === 'excused').length;
  const unmarkedCount = Math.max(0, students.length - (presentCount + lateCount + absentCount + excusedCount));

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.studentIdNumber && student.studentIdNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;

    const record = classDateRecords.find(r => r.studentId === student.id);
    return record?.status === statusFilter;
  });

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    markAttendance(selectedClass.id, studentId, selectedDate, status, 'manual');
  };

  const handleSaveNote = (studentId: string) => {
    const existing = classDateRecords.find(r => r.studentId === studentId);
    markAttendance(
      selectedClass.id,
      studentId,
      selectedDate,
      existing?.status || 'absent',
      existing?.method || 'manual',
      noteText
    );
    setEditingNoteId(null);
    setNoteText('');
  };

  const handleDispatchAlerts = () => {
    const count = dispatchAbsentAlerts(selectedClass.id, selectedDate);
    if (count > 0) {
      setAlertSuccessMessage(`Dispatched ${count} automated SMS & Email alerts to absent students and parents!`);
      setTimeout(() => setAlertSuccessMessage(null), 4500);
    } else {
      setAlertSuccessMessage(`No absent students found to notify for ${selectedDate}.`);
      setTimeout(() => setAlertSuccessMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Alert Dispatch Toast */}
      {alertSuccessMessage && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-blue-900 text-sm shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
            <span>{alertSuccessMessage}</span>
          </div>
          <button
            onClick={onOpenNotifications}
            className="text-xs font-bold text-blue-700 underline hover:text-blue-900 cursor-pointer"
          >
            View SMS Logs
          </button>
        </div>
      )}

      {/* Overview Stat Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Enrolled</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{students.length}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="text-emerald-700 text-xs font-medium uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Present
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {presentCount} <span className="text-xs font-normal text-emerald-600">({Math.round((presentCount / Math.max(students.length, 1)) * 100)}%)</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <div className="text-amber-700 text-xs font-medium uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Late
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{lateCount}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs">
          <div className="text-rose-700 text-xs font-medium uppercase tracking-wider flex items-center gap-1">
            <UserX className="w-3.5 h-3.5 text-rose-600" />
            Absent
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{absentCount}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-sky-200 bg-sky-50/20 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-sky-700 text-xs font-medium uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            Excused
          </div>
          <div className="text-2xl font-bold text-sky-700 mt-1">{excusedCount}</div>
        </div>
      </div>

      {/* Control & Filter Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Search & Filter pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
            />
          </div>

          {/* Filter Status */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-600">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              All ({students.length})
            </button>
            <button
              onClick={() => setStatusFilter('present')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'present' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'hover:text-emerald-700'
              }`}
            >
              Present ({presentCount})
            </button>
            <button
              onClick={() => setStatusFilter('late')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'late' ? 'bg-white text-amber-700 shadow-2xs font-bold' : 'hover:text-amber-700'
              }`}
            >
              Late ({lateCount})
            </button>
            <button
              onClick={() => setStatusFilter('absent')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'absent' ? 'bg-white text-rose-700 shadow-2xs font-bold' : 'hover:text-rose-700'
              }`}
            >
              Absent ({absentCount})
            </button>
          </div>
        </div>

        {/* Bulk Action Buttons & Download */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => bulkMarkAttendance(selectedClass.id, selectedDate, 'present')}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            Mark All Present
          </button>

          <button
            type="button"
            onClick={handleDispatchAlerts}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Automatically send SMS to parents of absent students"
          >
            <Send className="w-3.5 h-3.5 text-amber-600" />
            Notify Absents (SMS/Email)
          </button>

          <button
            type="button"
            onClick={() => downloadDailyReport(selectedClass.id, selectedDate)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download CSV of this roll call sheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            Download CSV
          </button>

          <button
            type="button"
            onClick={() => clearDateAttendance(selectedClass.id, selectedDate)}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            title="Clear all records for this date"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Student Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Method / Time</th>
                <th className="py-3 px-4">Remarks & Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                    No students match the selected filter or search term.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const record = classDateRecords.find(r => r.studentId === student.id);
                  const currentStatus = record?.status || null;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Student info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={student.name}
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 leading-tight">{student.name}</div>
                            <div className="text-xs text-slate-400">{student.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Student ID */}
                      <td className="py-3 px-4 text-xs font-mono font-medium text-slate-600">
                        {student.studentIdNumber || 'N/A'}
                      </td>

                      {/* Attendance Status Buttons */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'present')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              currentStatus === 'present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700'
                            }`}
                          >
                            Present
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'late')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              currentStatus === 'late'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700'
                            }`}
                          >
                            Late
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'absent')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              currentStatus === 'absent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700'
                            }`}
                          >
                            Absent
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'excused')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              currentStatus === 'excused'
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-sky-50 text-slate-500 hover:text-sky-700'
                            }`}
                            title="Excused Absence (Doctor note, sanctioned event)"
                          >
                            Excused
                          </button>
                        </div>
                      </td>

                      {/* Method & Timestamp */}
                      <td className="py-3 px-4 text-xs">
                        {record ? (
                          <div>
                            <span className="font-semibold text-slate-700">
                              {record.method === 'qr_dynamic' && '📱 Dynamic QR'}
                              {record.method === 'code_entry' && '⌨️ 6-Digit PIN'}
                              {record.method === 'manual' && '✋ Manual Roll Call'}
                              {record.method === 'admin_override' && '⚡ Verified Override'}
                            </span>
                            <div className="text-[11px] text-slate-400">
                              {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {record.distanceMeters !== undefined && ` • ${record.distanceMeters}m`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unmarked</span>
                        )}
                      </td>

                      {/* Remarks & Notes */}
                      <td className="py-3 px-4 text-xs">
                        {editingNoteId === student.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Reason / note..."
                              className="text-xs px-2 py-1 border border-blue-400 rounded-md focus:outline-hidden text-slate-800"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveNote(student.id)}
                              className="px-2 py-1 bg-blue-600 text-white rounded-md text-[11px] font-bold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="text-slate-400 hover:text-slate-600 text-[11px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-600 truncate max-w-[180px]">
                              {record?.note || <span className="text-slate-300 italic">No notes</span>}
                            </span>
                            <button
                              onClick={() => {
                                setEditingNoteId(student.id);
                                setNoteText(record?.note || '');
                              }}
                              className="text-slate-400 hover:text-blue-600 p-1 rounded-sm"
                              title="Add or edit remark"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
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
