import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { UserRole } from '../types/attendance';
import {
  Calendar,
  CheckCircle2,
  Download,
  GraduationCap,
  Layers,
  QrCode,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  UserCheck,
  Users,
  Bell,
  FileSpreadsheet
} from 'lucide-react';

interface NavbarProps {
  onOpenNotifications: () => void;
  onOpenPrintReport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNotifications, onOpenPrintReport }) => {
  const {
    currentUser,
    switchRole,
    currentRole,
    classes,
    selectedClassId,
    setSelectedClassId,
    selectedDate,
    setSelectedDate,
    downloadDailyReport,
    downloadSemesterReport,
    downloadFullBackupJSON,
    resetToSampleData,
    notifications,
    activeSession
  } = useAttendance();

  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Attend<span className="text-blue-600">Pulse</span>
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  2026 Core
                </span>
                {activeSession && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Live QR Session Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Smart Class Attendance & Anti-Proxy System</p>
            </div>
          </div>

          {/* Center Class & Date Pickers (Visible when in Teacher / Admin view) */}
          <div className="hidden md:flex items-center gap-3">
            {currentRole !== 'student' && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1 text-sm">
                <Layers className="w-4 h-4 text-slate-500 ml-2" />
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="bg-transparent font-medium text-slate-800 text-sm focus:outline-hidden pr-2 cursor-pointer"
                  aria-label="Select Active Class"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.code}: {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-sm">
              <Calendar className="w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-medium text-slate-800 text-sm focus:outline-hidden cursor-pointer"
                aria-label="Select Date"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Always Available Download Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
                title="Download Attendance Records"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Download Data</span>
              </button>

              {downloadMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-sm"
                  onMouseLeave={() => setDownloadMenuOpen(false)}
                >
                  <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Instant Downloads
                  </div>
                  <button
                    onClick={() => {
                      downloadDailyReport();
                      setDownloadMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-medium">Today's Roll Call (CSV)</div>
                      <div className="text-xs text-slate-400">Class sheet with check-in timestamps</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      downloadSemesterReport();
                      setDownloadMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-medium">Semester Summary (CSV)</div>
                      <div className="text-xs text-slate-400">Student attendance % and standing</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onOpenPrintReport();
                      setDownloadMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="font-medium">Printable Report Card</div>
                      <div className="text-xs text-slate-400">Preview & print / PDF download</div>
                    </div>
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={() => {
                      downloadFullBackupJSON();
                      setDownloadMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700"
                  >
                    <Layers className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="font-medium">Full System Backup (JSON)</div>
                      <div className="text-xs text-slate-400">Classes, students & attendance logs</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Notification logs button */}
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Absence Alerts & SMS Logs"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Role Switcher Pill */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => switchRole('teacher')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  currentRole === 'teacher'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Teacher</span>
              </button>
              <button
                type="button"
                onClick={() => switchRole('student')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  currentRole === 'student'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => switchRole('admin')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  currentRole === 'admin'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            </div>

            {/* User Profile Avatar */}
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-100"
              />
              <div className="hidden lg:block text-left text-xs">
                <div className="font-semibold text-slate-800 leading-tight">{currentUser.name}</div>
                <div className="text-slate-400 capitalize">{currentUser.role}</div>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={resetToSampleData}
              title="Reset Sample Data"
              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
