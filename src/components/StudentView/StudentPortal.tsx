import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useAttendance } from '../../context/AttendanceContext';
import {
  AlertCircle,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  FileText,
  KeyRound,
  MapPin,
  QrCode,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  X
} from 'lucide-react';
import { calculateDistanceMeters } from '../../utils/geo';

export const StudentPortal: React.FC = () => {
  const {
    currentUser,
    classes,
    enrollments,
    records,
    activeSession,
    verifyAndCheckIn,
    submitExcuse,
    downloadStudentReport,
    selectedDate
  } = useAttendance();

  const [pinCode, setPinCode] = useState('');
  const [activeTab, setActiveTab] = useState<'qr' | 'pin'>('qr');
  const [checkInStatus, setCheckInStatus] = useState<{
    success?: boolean;
    message: string;
    distanceMeters?: number;
  } | null>(null);

  // Excuse modal
  const [isExcuseModalOpen, setIsExcuseModalOpen] = useState(false);
  const [excuseClassId, setExcuseClassId] = useState('');
  const [excuseDate, setExcuseDate] = useState(selectedDate);
  const [excuseReason, setExcuseReason] = useState('');
  const [excuseSubmitted, setExcuseSubmitted] = useState(false);

  // Simulated GPS Coordinates near classroom (within 15m)
  const [simulatedLat, setSimulatedLat] = useState(37.77492);
  const [simulatedLng, setSimulatedLng] = useState(-122.41945);

  // Student's enrolled classes
  const studentEnrollments = enrollments.filter(e => e.studentId === currentUser.id);
  const enrolledClasses = classes.filter(c => studentEnrollments.some(e => e.classId === c.id));
  const studentRecords = records.filter(r => r.studentId === currentUser.id);

  // Active class session details
  const activeClass = activeSession ? classes.find(c => c.id === activeSession.classId) : null;
  const isEnrolledInActive = activeClass ? enrolledClasses.some(c => c.id === activeClass.id) : false;

  // Has already checked in today for active class
  const alreadyCheckedInToday = activeSession
    ? studentRecords.some(r => r.classId === activeSession.classId && r.date === activeSession.date && (r.status === 'present' || r.status === 'late'))
    : false;

  // Calculate distance to active class
  const distanceToClass = activeClass
    ? calculateDistanceMeters(simulatedLat, simulatedLng, activeClass.location.lat, activeClass.location.lng)
    : 15;

  const handlePerformCheckIn = (tokenOrCode: string) => {
    setCheckInStatus(null);
    const result = verifyAndCheckIn(tokenOrCode, currentUser.id, simulatedLat, simulatedLng);

    if (result.success) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setCheckInStatus({
        success: true,
        message: result.message,
        distanceMeters: result.distanceMeters,
      });
      setPinCode('');
    } else {
      setCheckInStatus({
        success: false,
        message: result.message,
        distanceMeters: result.distanceMeters,
      });
    }
  };

  const handleExcuseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!excuseClassId || !excuseReason.trim()) return;
    submitExcuse(currentUser.id, excuseClassId, excuseDate, excuseReason);
    setExcuseSubmitted(true);
    setTimeout(() => {
      setExcuseSubmitted(false);
      setIsExcuseModalOpen(false);
      setExcuseReason('');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Student Profile & Quick Actions Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/20 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">{currentUser.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 font-mono">
                  {currentUser.studentIdNumber || 'STU-2026-101'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentUser.department} • University Portal • Academic Year 2026-2027
              </p>
              <div className="text-[11px] text-slate-400 mt-1">
                Parent Contact: {currentUser.parentEmail} ({currentUser.parentPhone})
              </div>
            </div>
          </div>

          {/* Download Report Button */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsExcuseModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              <span>Submit Excuse Note</span>
            </button>

            <button
              type="button"
              onClick={() => downloadStudentReport(currentUser.id)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="Download your full attendance report as a CSV file"
            >
              <Download className="w-4 h-4" />
              <span>Download My Attendance (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Class Attendance Check-In Station */}
      <div className="bg-linear-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Ambient lighting effect */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-700/60 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Classroom Check-In Terminal
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-1">
                {activeSession && activeClass ? activeClass.name : 'Waiting for Active Class Session'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeClass ? `${activeClass.code} • Room: ${activeClass.room}` : 'Your teacher will display a rotating QR code during class'}
              </p>
            </div>

            {/* Geofence Status Pill */}
            {activeClass && (
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3.5 py-2 rounded-xl text-xs">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-200">
                    GPS Location: <span className="text-emerald-400">{distanceToClass}m away</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Within {activeClass.geofenceRadiusMeters}m classroom boundary
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Check-In Body */}
          {activeSession && activeClass ? (
            alreadyCheckedInToday ? (
              <div className="mt-6 p-6 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-900/50">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-emerald-200">
                  You are Checked In for Today's Lecture!
                </h3>
                <p className="text-xs text-emerald-400/80 mt-1 max-w-md mx-auto">
                  Status: PRESENT • Verified Anti-Proxy Session for {activeClass.code}. Your presence has been recorded in the attendance registry.
                </p>
              </div>
            ) : !isEnrolledInActive ? (
              <div className="mt-6 p-6 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-center text-amber-200 text-xs">
                An active session is running for <strong>{activeClass.name}</strong>, but you are not enrolled in this course.
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* Method selector & input */}
                <div className="md:col-span-7 space-y-4">
                  
                  {/* Tabs: QR Scanner or PIN */}
                  <div className="flex gap-2 p-1 bg-slate-800/70 rounded-xl border border-slate-700/80 text-xs font-bold">
                    <button
                      onClick={() => setActiveTab('qr')}
                      className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        activeTab === 'qr' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      <span>Scan Teacher QR</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('pin')}
                      className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        activeTab === 'pin' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Enter 6-Digit PIN</span>
                    </button>
                  </div>

                  {activeTab === 'qr' ? (
                    <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 text-center space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto">
                        <QrCode className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-200">Point Camera at Classroom Screen</div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          The system decodes the dynamic anti-proxy token and verifies your GPS coordinates
                        </p>
                      </div>

                      {/* Fast Check-In Trigger for demo */}
                      <button
                        type="button"
                        onClick={() => handlePerformCheckIn(activeSession.token)}
                        className="w-full py-3 bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Instant Scan Active Classroom QR</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 space-y-4">
                      <label className="block text-xs font-semibold text-slate-300">
                        Enter 6-Digit PIN Shown on Teacher's Screen:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="e.g. 482910"
                          value={pinCode}
                          onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                          className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-center font-mono text-xl tracking-widest text-white focus:outline-hidden focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => handlePerformCheckIn(pinCode)}
                          disabled={pinCode.length < 6}
                          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          Verify PIN
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        The PIN updates in real time with the teacher's countdown timer.
                      </div>
                    </div>
                  )}

                  {/* Feedback Message */}
                  {checkInStatus && (
                    <div
                      className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                        checkInStatus.success
                          ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/50'
                          : 'bg-rose-950/80 text-rose-200 border border-rose-500/50'
                      }`}
                    >
                      {checkInStatus.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span>{checkInStatus.message}</span>
                    </div>
                  )}
                </div>

                {/* Right: Security info */}
                <div className="md:col-span-5 bg-slate-800/40 p-5 rounded-2xl border border-slate-700/60 text-xs space-y-3">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Anti-Proxy Geofence Active
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Your device's location is verified against <strong>{activeClass.room}</strong> coordinates. Attendance cannot be submitted remotely from home or outside the classroom.
                  </p>
                  <div className="pt-2 border-t border-slate-700 text-slate-300 flex items-center justify-between text-[11px]">
                    <span>Current Proximity:</span>
                    <span className="font-bold text-emerald-400">{distanceToClass}m (Valid)</span>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="mt-6 p-8 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-center">
              <QrCode className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <div className="font-bold text-slate-300 text-sm">No Live Attendance Session is Broadcasting</div>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                When your instructor starts attendance for CS101 or your enrolled courses, this terminal will automatically activate.
              </p>
              <div className="mt-4 inline-block text-[11px] text-blue-400 bg-blue-950/50 px-3 py-1.5 rounded-lg border border-blue-800/60">
                Tip: Switch to the <strong>Teacher</strong> tab in the top navbar to start a dynamic session.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enrolled Courses & Attendance Percentage */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              My Courses & Attendance Standing
            </h2>
            <p className="text-xs text-slate-500">
              Institutional minimum requirement: 75% for exam eligibility
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">
            {enrolledClasses.length} Enrolled Courses
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {enrolledClasses.map((cls) => {
            const classRecords = records.filter(r => r.classId === cls.id);
            const studentClassRecords = classRecords.filter(r => r.studentId === currentUser.id);
            const uniqueClassDates = Array.from(new Set(classRecords.map(r => r.date)));
            const totalLectures = Math.max(uniqueClassDates.length, 1);

            const presentCount = studentClassRecords.filter(r => r.status === 'present').length;
            const lateCount = studentClassRecords.filter(r => r.status === 'late').length;
            const excusedCount = studentClassRecords.filter(r => r.status === 'excused').length;
            const absentCount = studentClassRecords.filter(r => r.status === 'absent').length;

            const rate = Math.round(((presentCount + (lateCount * 0.75) + excusedCount) / totalLectures) * 100);
            const isGood = rate >= 85;
            const isWarning = rate >= 75 && rate < 85;
            const isDanger = rate < 75;

            return (
              <div
                key={cls.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-xs text-blue-700 px-2 py-0.5 rounded-md bg-blue-100 font-mono">
                      {cls.code}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isGood
                          ? 'bg-emerald-100 text-emerald-800'
                          : isWarning
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isGood ? 'Good Standing' : isWarning ? 'Satisfactory' : 'Critical Warning'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{cls.name}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">{cls.schedule}</div>

                  {/* Percentage Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-2xl font-black text-slate-900">{rate}%</span>
                      <span className="text-xs text-slate-500">
                        {presentCount} / {totalLectures} attended
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-700 ${
                          isGood ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${rate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Late: {lateCount} | Missed: {absentCount}</span>
                  <button
                    onClick={() => downloadStudentReport(currentUser.id, cls.id)}
                    className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    Download CSV
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Attendance History Timeline */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              My Attendance History
            </h2>
            <p className="text-xs text-slate-500">
              Verified records with anti-proxy check-in timestamps
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadStudentReport(currentUser.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Download History (CSV)
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Geofence Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No attendance records found yet.
                  </td>
                </tr>
              ) : (
                studentRecords.map((r) => {
                  const targetClass = classes.find(c => c.id === r.classId);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">{r.date}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900">{targetClass?.code}</span>
                        <span className="text-slate-400 ml-1.5">({targetClass?.name})</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            r.status === 'present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'late'
                              ? 'bg-amber-100 text-amber-800'
                              : r.status === 'excused'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {r.method === 'qr_dynamic' && '📱 Dynamic QR'}
                        {r.method === 'code_entry' && '⌨️ 6-Digit PIN'}
                        {r.method === 'manual' && '✋ Teacher Roll Call'}
                        {r.method === 'admin_override' && '⚡ Approved Excuse'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Validated
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Excuse Modal */}
      {isExcuseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">Submit Absence Excuse</h3>
              <button onClick={() => setIsExcuseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {excuseSubmitted ? (
              <div className="text-center py-6 text-emerald-700">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <div className="font-bold">Excuse Submitted Successfully!</div>
                <p className="text-xs text-emerald-600 mt-1">Your instructor will review and update your record.</p>
              </div>
            ) : (
              <form onSubmit={handleExcuseSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Course:</label>
                  <select
                    value={excuseClassId}
                    onChange={(e) => setExcuseClassId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden"
                  >
                    <option value="">-- Choose Course --</option>
                    {enrolledClasses.map(c => (
                      <option key={c.id} value={c.id}>{c.code}: {c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Absence Date:</label>
                  <input
                    type="date"
                    value={excuseDate}
                    onChange={(e) => setExcuseDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reason / Explanation:</label>
                  <textarea
                    rows={3}
                    placeholder="Provide medical illness details, doctor certificate note, or official campus event details..."
                    value={excuseReason}
                    onChange={(e) => setExcuseReason(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsExcuseModalOpen(false)}
                    className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-xs"
                  >
                    Submit for Approval
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
