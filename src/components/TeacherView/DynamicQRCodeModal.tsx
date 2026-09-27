import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useAttendance } from '../../context/AttendanceContext';
import {
  Clock,
  Download,
  Maximize2,
  Minimize2,
  Navigation,
  QrCode,
  ShieldCheck,
  StopCircle,
  Users,
  X,
  CheckCircle,
  Sparkles,
  MapPin
} from 'lucide-react';

interface DynamicQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DynamicQRCodeModal: React.FC<DynamicQRCodeModalProps> = ({ isOpen, onClose }) => {
  const {
    activeSession,
    startQRSession,
    stopQRSession,
    sessionRemainingSeconds,
    selectedClass,
    selectedDate,
    getStudentsForClass,
    records,
    downloadDailyReport,
    updateClass
  } = useAttendance();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [geofenceEnabled, setGeofenceEnabled] = useState(true);
  const [radius, setRadius] = useState(selectedClass.geofenceRadiusMeters || 75);

  // Auto start session if not already active
  useEffect(() => {
    if (isOpen && !activeSession) {
      startQRSession(selectedClass.id, 25, geofenceEnabled);
    }
  }, [isOpen, activeSession, selectedClass.id, startQRSession, geofenceEnabled]);

  // Render QR code onto canvas
  useEffect(() => {
    if (activeSession && canvasRef.current) {
      const qrData = JSON.stringify({
        app: 'AttendPulse',
        classId: activeSession.classId,
        date: activeSession.date,
        token: activeSession.token,
        code6Digit: activeSession.code6Digit,
        expiresAt: activeSession.expiresAt,
        lat: selectedClass.location.lat,
        lng: selectedClass.location.lng,
        radius: activeSession.geofenceRequired ? radius : 0
      });

      QRCode.toCanvas(canvasRef.current, qrData, {
        width: isFullscreen ? 360 : 260,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      }, (err) => {
        if (err) console.error('Failed to generate QR code canvas:', err);
      });
    }
  }, [activeSession, isFullscreen, selectedClass, radius]);

  if (!isOpen) return null;

  const enrolledStudents = getStudentsForClass(selectedClass.id);
  const todayRecords = records.filter(r => r.classId === selectedClass.id && r.date === selectedDate);
  const presentRecords = todayRecords.filter(r => r.status === 'present');
  const recentCheckins = [...presentRecords].reverse();

  const progressPercent = activeSession
    ? ((activeSession.intervalSeconds - sessionRemainingSeconds) / activeSession.intervalSeconds) * 100
    : 0;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-all ${isFullscreen ? 'p-0' : ''}`}>
      <div className={`bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'w-screen h-screen rounded-none' : 'w-full max-w-4xl max-h-[92vh]'
      }`}>
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Live Attendance Check-In
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Dynamic Anti-Proxy Active
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {selectedClass.code}: {selectedClass.name} • Room: {selectedClass.room}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors"
              title={isFullscreen ? 'Exit Projector Mode' : 'Classroom Projector Mode'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50/50">
          
          {/* Left Column: QR Code + Countdown + 6-digit Code */}
          <div className="md:col-span-7 flex flex-col items-center justify-center bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-center">
            
            {/* Dynamic Countdown Bar */}
            <div className="w-full max-w-sm mb-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Code expires in:
                </span>
                <span className="text-blue-600 font-mono text-sm font-bold">
                  {sessionRemainingSeconds}s
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-linear-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${Math.max(0, 100 - progressPercent)}%` }}
                ></div>
              </div>
            </div>

            {/* QR Canvas Container with Scanning Target frame */}
            <div className="relative p-4 bg-white rounded-2xl border-2 border-dashed border-blue-300 shadow-md">
              <canvas ref={canvasRef} className="rounded-xl mx-auto shadow-xs" />
              
              {/* Subtle Corner Brackets for authentic scanner vibe */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-500"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-500"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-500"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-500"></div>
            </div>

            {/* 6-Digit PIN Backup */}
            <div className="mt-4 p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 w-full max-w-sm">
              <div className="text-xs text-blue-900 font-semibold mb-1">
                Student Camera Issue? Use 6-Digit PIN:
              </div>
              <div className="text-2xl font-black font-mono tracking-widest text-blue-700">
                {activeSession?.code6Digit ? `${activeSession.code6Digit.slice(0, 3)} ${activeSession.code6Digit.slice(3)}` : '------'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Students can type this code directly into the Student Portal
              </div>
            </div>

            {/* Geofence Status Badge */}
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Geofence: <strong className="text-slate-800">{radius}m radius</strong> around {selectedClass.room}
              </span>
            </div>
          </div>

          {/* Right Column: Live Attendees + Settings */}
          <div className="md:col-span-5 flex flex-col gap-4">
            
            {/* Live Count Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Live Attendance Roll
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {presentRecords.length} / {enrolledStudents.length} Checked In
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(presentRecords.length / Math.max(enrolledStudents.length, 1)) * 100}%` }}
                ></div>
              </div>

              {/* Live check-in list */}
              <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Live Feed (Real-time):
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {recentCheckins.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Waiting for students to scan QR code...
                  </div>
                ) : (
                  recentCheckins.map((rec) => {
                    const student = enrolledStudents.find(s => s.id === rec.studentId);
                    return (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/70 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={student?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={student?.name}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-semibold text-slate-800 text-xs">{student?.name || 'Student'}</div>
                            <div className="text-[10px] text-slate-400">
                              {rec.method === 'qr_dynamic' ? '📱 QR Code' : '⌨️ Code Entry'} • {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          {rec.distanceMeters !== undefined ? `${rec.distanceMeters}m Verified` : 'Verified'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Geofence & Anti-Proxy Controls */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Anti-Proxy Security Rules
              </h3>
              
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">Enforce Classroom Geofence</div>
                    <div className="text-slate-400 text-[11px]">Reject check-ins from outside classroom</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={geofenceEnabled}
                    onChange={(e) => {
                      setGeofenceEnabled(e.target.checked);
                      if (activeSession) {
                        startQRSession(selectedClass.id, activeSession.intervalSeconds, e.target.checked);
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {geofenceEnabled && (
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Maximum Distance Allowed:</span>
                      <span className="font-bold text-slate-800">{radius} meters</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={200}
                      step={5}
                      value={radius}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setRadius(val);
                        updateClass(selectedClass.id, { geofenceRadiusMeters: val });
                      }}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => downloadDailyReport(selectedClass.id, selectedDate)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                Download Today's CSV
              </button>

              <button
                type="button"
                onClick={() => {
                  stopQRSession();
                  onClose();
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <StopCircle className="w-4 h-4 text-rose-600" />
                End Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
