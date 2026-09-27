import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Download, Printer, X, CheckCircle, FileText } from 'lucide-react';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({ isOpen, onClose }) => {
  const {
    classes,
    selectedClassId,
    selectedDate,
    getStudentsForClass,
    records,
    downloadDailyReport,
    downloadSemesterReport
  } = useAttendance();

  const [activeClassId, setActiveClassId] = useState(selectedClassId);
  const targetClass = classes.find(c => c.id === activeClassId) || classes[0];
  const students = getStudentsForClass(targetClass.id);

  if (!isOpen) return null;

  // Gather stats for the report
  const classRecords = records.filter(r => r.classId === targetClass.id);
  const uniqueDates = Array.from(new Set(classRecords.map(r => r.date))).sort();
  const totalLectures = Math.max(uniqueDates.length, 1);

  const studentSummary = students.map(student => {
    const studentRecords = classRecords.filter(r => r.studentId === student.id);
    const present = studentRecords.filter(r => r.status === 'present').length;
    const late = studentRecords.filter(r => r.status === 'late').length;
    const excused = studentRecords.filter(r => r.status === 'excused').length;
    const absent = studentRecords.filter(r => r.status === 'absent').length;
    const rate = Math.round(((present + (late * 0.75) + excused) / totalLectures) * 100);

    return {
      student,
      present,
      late,
      excused,
      absent,
      rate,
      status: rate >= 85 ? 'Good' : rate >= 75 ? 'Satisfactory' : 'Critical Warning'
    };
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Official Attendance Transcript & Summary
              </h2>
              <p className="text-xs text-slate-500">
                Print-ready official report card with instant PDF / CSV export
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={activeClassId}
              onChange={(e) => setActiveClassId(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-lg cursor-pointer text-slate-800"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.code}: {c.name}</option>
              ))}
            </select>

            <button
              onClick={() => downloadSemesterReport(targetClass.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-white print:p-0 print:overflow-visible">
          
          {/* Institution Header */}
          <div className="border-b-2 border-slate-800 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  UNIVERSITY DEPARTMENT OF ACADEMIC REGISTRY
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Official Course Attendance Audit & Eligibility Record • Fall Semester 2026
                </p>
              </div>
              <div className="text-right text-xs text-slate-500 font-mono">
                <div>Document ID: AP-REP-2026-F</div>
                <div>Generated: {new Date().toLocaleDateString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Course:</span>
                <span className="font-bold text-slate-900 text-sm">{targetClass.code} - {targetClass.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Faculty Instructor:</span>
                <span className="font-bold text-slate-900">{targetClass.teacherName || 'Prof. Sarah Connor'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Total Lectures Evaluated:</span>
                <span className="font-bold text-slate-900">{totalLectures} Class Sessions</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-400 bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Student ID</th>
                <th className="py-2.5 px-3">Student Full Name</th>
                <th className="py-2.5 px-3 text-center">Present</th>
                <th className="py-2.5 px-3 text-center">Late</th>
                <th className="py-2.5 px-3 text-center">Excused</th>
                <th className="py-2.5 px-3 text-center">Absent</th>
                <th className="py-2.5 px-3 text-center">Attendance %</th>
                <th className="py-2.5 px-3 text-right">Academic Standing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {studentSummary.map(({ student, present, late, excused, absent, rate, status }) => (
                <tr key={student.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-600">{student.studentIdNumber}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{student.name}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-emerald-700 font-bold">{present}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-amber-700">{late}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-sky-700">{excused}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-rose-700 font-bold">{absent}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`font-mono font-black ${rate < 75 ? 'text-rose-600' : 'text-slate-900'}`}>
                      {rate}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        status === 'Good'
                          ? 'bg-emerald-100 text-emerald-800'
                          : status === 'Satisfactory'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer & Signatures */}
          <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500">
            <div>
              <div className="border-b border-slate-400 w-48 mb-2"></div>
              <div>Faculty Instructor Signature</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Verified on {new Date().toLocaleDateString()}</div>
            </div>
            <div className="text-right">
              <div className="border-b border-slate-400 w-48 ml-auto mb-2"></div>
              <div>Dean of Academic Affairs Seal</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Electronic Record Archive Verified</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
