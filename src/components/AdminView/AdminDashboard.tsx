import React, { useState } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import {
  Building2,
  CheckCircle2,
  Database,
  Download,
  GraduationCap,
  Layers,
  MapPin,
  Plus,
  RefreshCw,
  ShieldAlert,
  Users,
  X
} from 'lucide-react';
import { ClassItem } from '../../types/attendance';

export const AdminDashboard: React.FC = () => {
  const {
    classes,
    availableUsers,
    records,
    addClass,
    downloadFullBackupJSON,
    downloadSemesterReport,
    resetToSampleData
  } = useAttendance();

  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newTeacherId, setNewTeacherId] = useState('teacher-1');
  const [newSchedule, setNewSchedule] = useState('Mon, Wed • 11:00 AM - 12:30 PM');
  const [newRoom, setNewRoom] = useState('Hall C-102');
  const [newDepartment, setNewDepartment] = useState('Computer Science');
  const [newRadius, setNewRadius] = useState(75);

  const students = availableUsers.filter(u => u.role === 'student');
  const teachers = availableUsers.filter(u => u.role === 'teacher');

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) return;

    const teacher = teachers.find(t => t.id === newTeacherId);

    addClass({
      code: newCode.toUpperCase(),
      name: newName,
      teacherId: newTeacherId,
      teacherName: teacher?.name || 'Faculty Member',
      schedule: newSchedule,
      room: newRoom,
      department: newDepartment,
      semester: 'Fall 2026',
      geofenceRadiusMeters: newRadius,
      color: '#3b82f6',
      location: {
        lat: 37.7749,
        lng: -122.4194,
        name: newRoom,
      },
    });

    setIsAddClassModalOpen(false);
    setNewCode('');
    setNewName('');
  };

  return (
    <div className="space-y-6">
      
      {/* Admin Campus Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 uppercase tracking-wide">
              Academic Administration
            </span>
            <span className="text-xs text-slate-400">System Control Plane</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2">
            Campus Attendance Administration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage course registries, faculty assignments, geofencing coordinates, and global data downloads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAddClassModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Course</span>
          </button>

          <button
            type="button"
            onClick={downloadFullBackupJSON}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Download full database as JSON"
          >
            <Download className="w-4 h-4" />
            <span>Download All Data (JSON)</span>
          </button>
        </div>
      </div>

      {/* Campus Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">Active Courses</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{classes.length}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">Registered Students</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{students.length}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">Faculty Members</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{teachers.length}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Check-In Logs</div>
          <div className="text-3xl font-extrabold text-blue-600 mt-2">{records.length}</div>
        </div>
      </div>

      {/* Course Management Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Department Class Registry
            </h2>
            <p className="text-xs text-slate-500">
              Configured courses and physical classroom geofences
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Course Name</th>
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4">Schedule</th>
                <th className="py-3 px-4">Room & Geofence</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.map((cls) => {
                const teacher = teachers.find(t => t.id === cls.teacherId);
                return (
                  <tr key={cls.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{cls.code}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{cls.name}</div>
                      <div className="text-slate-400 text-[11px]">{cls.department}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {teacher?.name || cls.teacherName || 'Faculty'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{cls.schedule}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{cls.room}</div>
                      <div className="text-[11px] text-emerald-600 font-semibold">
                        Radius: {cls.geofenceRadiusMeters}m
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => downloadSemesterReport(cls.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md font-bold transition-colors cursor-pointer"
                        title="Download semester CSV for this class"
                      >
                        <Download className="w-3.5 h-3.5" />
                        CSV
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Class Modal */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">Add New Course</h3>
              <button onClick={() => setIsAddClassModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Course Code:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS301"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department:</label>
                  <input
                    type="text"
                    required
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems & Distributed Architecture"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign Faculty:</label>
                  <select
                    value={newTeacherId}
                    onChange={(e) => setNewTeacherId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50"
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Geofence Radius (meters):</label>
                  <input
                    type="number"
                    min={20}
                    max={200}
                    value={newRadius}
                    onChange={(e) => setNewRadius(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room / Hall:</label>
                  <input
                    type="text"
                    required
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Schedule:</label>
                  <input
                    type="text"
                    required
                    value={newSchedule}
                    onChange={(e) => setNewSchedule(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-xs"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
