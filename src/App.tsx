import React, { useState } from 'react';
import { AttendanceProvider, useAttendance } from './context/AttendanceContext';
import { Navbar } from './components/Navbar';
import { TeacherDashboard } from './components/TeacherView/TeacherDashboard';
import { StudentPortal } from './components/StudentView/StudentPortal';
import { AdminDashboard } from './components/AdminView/AdminDashboard';
import { NotificationsModal } from './components/NotificationsModal';
import { PrintReportModal } from './components/PrintReportModal';
import { Download, CheckCircle2, ShieldCheck, Database, QrCode } from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentRole, downloadDailyReport, downloadSemesterReport, selectedDate } = useAttendance();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Navbar */}
      <Navbar
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenPrintReport={() => setIsPrintReportOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentRole === 'teacher' && (
          <TeacherDashboard
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenPrintReport={() => setIsPrintReportOpen(true)}
          />
        )}

        {currentRole === 'student' && <StudentPortal />}

        {currentRole === 'admin' && <AdminDashboard />}
      </main>

      {/* Floating Bottom Quick Download & Status Bar */}
      <div className="sticky bottom-4 max-w-xl mx-auto w-full px-4 z-30 pointer-events-none print:hidden">
        <div className="bg-slate-900/90 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700/80 flex items-center justify-between text-xs pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-slate-200">AttendPulse 2026 Core</span>
            <span className="text-slate-400 hidden sm:inline">• Live Attendance Engine</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadDailyReport()}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Download roll call CSV for today"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Today's CSV</span>
            </button>

            <button
              onClick={() => setIsPrintReportOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer"
            >
              Report Card
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-400 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-500 font-medium">
            <span>Dynamic Anti-Proxy QR</span>
            <span>•</span>
            <span>GPS Geofencing Verification</span>
            <span>•</span>
            <span>Automatic SMS & Email Alerts</span>
            <span>•</span>
            <span>On-Demand Excel/CSV Downloads</span>
          </div>
          <p>© 2026 AttendPulse • Built for modern campus classrooms and academic registry</p>
        </div>
      </footer>

      {/* Global Modals */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <PrintReportModal
        isOpen={isPrintReportOpen}
        onClose={() => setIsPrintReportOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AttendanceProvider>
      <MainApp />
    </AttendanceProvider>
  );
}
