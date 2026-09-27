import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { ManualRollCall } from './ManualRollCall';
import { AnalyticsTab } from './AnalyticsTab';
import { DynamicQRCodeModal } from './DynamicQRCodeModal';
import {
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileSpreadsheet,
  GraduationCap,
  Layers,
  MapPin,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users
} from 'lucide-react';

interface TeacherDashboardProps {
  onOpenNotifications: () => void;
  onOpenPrintReport: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onOpenNotifications, onOpenPrintReport }) => {
  const {
    selectedClass,
    selectedDate,
    getStudentsForClass,
    records,
    excuses,
    updateExcuseStatus,
    downloadDailyReport,
    downloadSemesterReport,
    activeSession,
    startQRSession
  } = useAttendance();

  const [activeTab, setActiveTab] = useState<'rollcall' | 'analytics' | 'excuses' | 'roster'>('rollcall');
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const students = getStudentsForClass(selectedClass.id);
  const classDateRecords = records.filter(r => r.classId === selectedClass.id && r.date === selectedDate);
  const presentCount = classDateRecords.filter(r => r.status === 'present').length;

  const classExcuses = excuses.filter(e => e.classId === selectedClass.id);
  const pendingExcusesCount = classExcuses.filter(e => e.status === 'pending').length;

  return (
    <div className="space-y-6">
      
      {/* Teacher Class Hero Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/70 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 tracking-wide uppercase">
                {selectedClass.code}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                {selectedClass.department}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                {selectedClass.semester}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {selectedClass.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>{selectedClass.schedule}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>{selectedClass.room}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <Users className="w-4 h-4 text-purple-600" />
                <span>{students.length} Enrolled Students</span>
              </div>
            </div>
          </div>

          {/* Quick Hero Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Start Live Dynamic QR Code Button */}
            <button
              type="button"
              onClick={() => {
                if (!activeSession) {
                  startQRSession(selectedClass.id, 25, true);
                }
                setIsQRModalOpen(true);
              }}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <QrCode className="w-5 h-5 stroke-[2.5]" />
              <span>{activeSession ? 'Show Active QR Screen' : 'Start Live QR Attendance'}</span>
            </button>

            {/* Direct Instant CSV Download */}
            <button
              type="button"
              onClick={() => downloadDailyReport(selectedClass.id, selectedDate)}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition-colors cursor-pointer"
              title="Download roll call CSV for selected date"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-100 mt-6 pt-4 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('rollcall')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'rollcall'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Roll Call Sheet</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
              {presentCount}/{students.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics & Trends</span>
          </button>

          <button
            onClick={() => setActiveTab('excuses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'excuses'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Absence Excuses</span>
            {pendingExcusesCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white">
                {pendingExcusesCount} new
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'roster'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Class Roster ({students.length})</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'rollcall' && (
        <ManualRollCall
          onOpenQRModal={() => setIsQRModalOpen(true)}
          onOpenNotifications={onOpenNotifications}
        />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsTab
          onOpenNotifications={onOpenNotifications}
          onOpenPrintReport={onOpenPrintReport}
        />
      )}

      {activeTab === 'excuses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Medical & Sanctioned Absence Excuses
              </h2>
              <p className="text-xs text-slate-500">
                Review absence explanations submitted by students with automatic record updating upon approval
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">
              {classExcuses.length} Total Requests
            </span>
          </div>

          <div className="space-y-3">
            {classExcuses.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No absence excuses submitted for this class.
              </div>
            ) : (
              classExcuses.map((exc) => (
                <div
                  key={exc.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{exc.studentName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-slate-200 text-slate-700">
                        Date: {exc.date}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          exc.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : exc.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {exc.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1">"{exc.reason}"</p>
                    <div className="text-[11px] text-slate-400">
                      Submitted: {new Date(exc.submittedAt).toLocaleDateString()} at {new Date(exc.submittedAt).toLocaleTimeString()}
                    </div>
                  </div>

                  {exc.status === 'pending' && (
                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => updateExcuseStatus(exc.id, 'approved', 'Medical certificate verified.')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Approve & Mark Excused
                      </button>
                      <button
                        onClick={() => updateExcuseStatus(exc.id, 'rejected', 'Insufficient documentation.')}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'roster' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Official Enrolled Student Roster
              </h2>
              <p className="text-xs text-slate-500">
                All students currently enrolled in {selectedClass.code}
              </p>
            </div>
            <button
              onClick={() => downloadDailyReport(selectedClass.id, selectedDate)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              Export Roster (CSV)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {students.map((student) => (
              <div
                key={student.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{student.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{student.studentIdNumber}</div>
                    <div className="text-[11px] text-slate-400">{student.department}</div>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <div className="text-slate-600">{student.phone}</div>
                  <div className="text-[11px] text-slate-400">{student.parentPhone ? `Parent: ${student.parentPhone}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Anti-Proxy QR Code Modal */}
      <DynamicQRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />
    </div>
  );
};
