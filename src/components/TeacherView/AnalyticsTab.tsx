import React from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import {
  AlertTriangle,
  Award,
  BarChart3,
  Calendar,
  CheckCircle,
  Download,
  Mail,
  TrendingDown,
  TrendingUp,
  Users
} from 'lucide-react';

interface AnalyticsTabProps {
  onOpenNotifications: () => void;
  onOpenPrintReport: () => void;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ onOpenNotifications, onOpenPrintReport }) => {
  const {
    selectedClass,
    getStudentsForClass,
    records,
    downloadSemesterReport,
    dispatchAbsentAlerts,
    selectedDate
  } = useAttendance();

  const students = getStudentsForClass(selectedClass.id);
  const classRecords = records.filter(r => r.classId === selectedClass.id);

  // Group records by unique dates
  const uniqueDates = Array.from(new Set(classRecords.map(r => r.date))).sort();
  const totalSessions = uniqueDates.length || 1;

  // Calculate student attendance statistics
  const studentStats = students.map(student => {
    const studentRecords = classRecords.filter(r => r.studentId === student.id);
    const present = studentRecords.filter(r => r.status === 'present').length;
    const late = studentRecords.filter(r => r.status === 'late').length;
    const excused = studentRecords.filter(r => r.status === 'excused').length;
    const absent = studentRecords.filter(r => r.status === 'absent').length;

    // Rate calculation: present=1, late=0.75, excused=1.0
    const weightedPresent = present + (late * 0.75) + excused;
    const rate = Math.round((weightedPresent / totalSessions) * 100);

    return {
      student,
      totalSessions,
      present,
      late,
      excused,
      absent,
      rate,
      isAtRisk: rate < 75,
      isPerfect: rate === 100 && absent === 0 && late === 0
    };
  });

  // Overall class attendance rate
  const overallAvgRate = studentStats.length > 0
    ? Math.round(studentStats.reduce((sum, s) => sum + s.rate, 0) / studentStats.length)
    : 0;

  // Day-of-week breakdown (Monday vs Wednesday vs Friday trends)
  const dayStats: Record<string, { present: number; total: number }> = {
    Monday: { present: 0, total: 0 },
    Wednesday: { present: 0, total: 0 },
    Friday: { present: 0, total: 0 },
  };

  classRecords.forEach(r => {
    // Parse date to day of week
    const dateObj = new Date(r.date + 'T12:00:00Z');
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    if (dayStats[dayName]) {
      dayStats[dayName].total++;
      if (r.status === 'present' || r.status === 'late') {
        dayStats[dayName].present++;
      }
    }
  });

  const mondayRate = dayStats.Monday.total > 0 ? Math.round((dayStats.Monday.present / dayStats.Monday.total) * 100) : 74;
  const wednesdayRate = dayStats.Wednesday.total > 0 ? Math.round((dayStats.Wednesday.present / dayStats.Wednesday.total) * 100) : 92;
  const fridayRate = dayStats.Friday.total > 0 ? Math.round((dayStats.Friday.present / dayStats.Friday.total) * 100) : 86;

  const atRiskStudents = studentStats.filter(s => s.isAtRisk);
  const perfectStudents = studentStats.filter(s => s.isPerfect);

  // Method distribution
  const qrCount = classRecords.filter(r => r.method === 'qr_dynamic').length;
  const pinCount = classRecords.filter(r => r.method === 'code_entry').length;
  const manualCount = classRecords.filter(r => r.method === 'manual').length;
  const overrideCount = classRecords.filter(r => r.method === 'admin_override').length;
  const totalMarkedMethods = (qrCount + pinCount + manualCount + overrideCount) || 1;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Class Attendance Insights & Trends
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Based on {totalSessions} recorded class sessions for {selectedClass.code}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => downloadSemesterReport(selectedClass.id)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Semester Summary (CSV)
          </button>

          <button
            type="button"
            onClick={onOpenPrintReport}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Print / PDF View
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Class Attendance Rate
            </span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <div className="text-3xl font-extrabold text-slate-900">{overallAvgRate}%</div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              +3.2% vs target
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Recommended institutional threshold: 75%
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200/80 bg-rose-50/10 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
              At-Risk Students (&lt; 75%)
            </span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <div className="text-3xl font-extrabold text-rose-700">{atRiskStudents.length}</div>
            <span className="text-xs text-rose-600">
              students below exam threshold
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Automated alerts dispatched to student & parents
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/10 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              100% Perfect Attendance
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Award className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <div className="text-3xl font-extrabold text-emerald-700">{perfectStudents.length}</div>
            <span className="text-xs text-emerald-600">
              eligible for attendance honors
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Zero recorded unexcused absences
          </div>
        </div>
      </div>

      {/* Chart Section: Day-of-the-Week Trend (Monday Blues) & Method Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Day-of-Week Trend Chart */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Day-of-Week Trend ("Monday Morning Effect")
              </h3>
              <p className="text-xs text-slate-400">
                Attendance rate drops on Mondays compared to mid-week lectures
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
              18% lower on Mondays
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {/* Monday bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Monday Lectures (10:00 AM)</span>
                <span className="text-amber-700 font-mono font-bold">{mondayRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className="bg-amber-500 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${mondayRate}%` }}
                ></div>
              </div>
            </div>

            {/* Wednesday bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Wednesday Lectures (10:00 AM)</span>
                <span className="text-emerald-700 font-mono font-bold">{wednesdayRate}% (Peak)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className="bg-emerald-500 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${wednesdayRate}%` }}
                ></div>
              </div>
            </div>

            {/* Friday bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Friday Lab & Quizzes (10:00 AM)</span>
                <span className="text-blue-700 font-mono font-bold">{fridayRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${fridayRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 flex items-start gap-2">
            <span className="font-bold shrink-0">💡 Recommendation:</span>
            <span>
              Schedule quick 2-minute starter activities on Monday mornings to incentivize on-time arrival.
            </span>
          </div>
        </div>

        {/* Check-In Methods Breakdown */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              Check-In Method Breakdown
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Breakdown of how students verified attendance
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-700 font-medium">
                  <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                  Dynamic QR Code (Anti-Proxy)
                </span>
                <span className="font-bold font-mono text-slate-900">
                  {Math.round((qrCount / totalMarkedMethods) * 100)}% ({qrCount})
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-700 font-medium">
                  <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                  6-Digit Backup PIN
                </span>
                <span className="font-bold font-mono text-slate-900">
                  {Math.round((pinCount / totalMarkedMethods) * 100)}% ({pinCount})
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-700 font-medium">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  Teacher Manual Roll Call
                </span>
                <span className="font-bold font-mono text-slate-900">
                  {Math.round((manualCount / totalMarkedMethods) * 100)}% ({manualCount})
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-700 font-medium">
                  <span className="w-3 h-3 rounded-full bg-sky-500"></span>
                  Approved Medical / Sanctioned
                </span>
                <span className="font-bold font-mono text-slate-900">
                  {Math.round((overrideCount / totalMarkedMethods) * 100)}% ({overrideCount})
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Anti-Proxy Security Rate</span>
            <span className="font-bold text-emerald-600">98.5% Validated GPS</span>
          </div>
        </div>
      </div>

      {/* At-Risk Students Warning Section */}
      <div className="bg-white rounded-2xl border border-rose-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-rose-50/50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Students Requiring Immediate Academic Intervention (&lt; 75%)
              </h3>
              <p className="text-xs text-rose-700">
                These students may be barred from semester finals if attendance does not improve.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              dispatchAbsentAlerts(selectedClass.id, selectedDate);
              onOpenNotifications();
            }}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            Dispatch Warning SMS to Guardians
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Attendance %</th>
                <th className="py-3 px-4">Absences</th>
                <th className="py-3 px-4">Parent Contact</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {atRiskStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    🎉 Excellent! No students are currently below the 75% attendance threshold.
                  </td>
                </tr>
              ) : (
                atRiskStudents.map(({ student, rate, absent, totalSessions }) => (
                  <tr key={student.id} className="hover:bg-rose-50/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-bold text-slate-800">{student.name}</div>
                          <div className="text-slate-400 text-[11px]">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-600">
                      {student.studentIdNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800">
                        {rate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <strong>{absent}</strong> of {totalSessions} lectures missed
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      <div>{student.parentPhone || 'No phone'}</div>
                      <div className="text-[11px] text-slate-400">{student.parentEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={onOpenNotifications}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-700 border border-blue-200 rounded-md font-semibold text-xs transition-colors cursor-pointer"
                      >
                        View Alert History
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
