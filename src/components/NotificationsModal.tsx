import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  Bell,
  CheckCircle2,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Smartphone,
  X
} from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { notifications, dispatchAbsentAlerts, selectedClassId, selectedDate } = useAttendance();
  const [selectedNotifId, setSelectedNotifId] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeNotif = notifications.find(n => n.id === selectedNotifId) || notifications[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Automated Absence Notifications & SMS Log
              </h2>
              <p className="text-xs text-slate-500">
                Powered by simulated Twilio SMS & Resend automated notification webhooks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatchAbsentAlerts(selectedClassId, selectedDate)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Dispatch Today's Alerts
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50/50">
          
          {/* Left Column: Notification feed */}
          <div className="md:col-span-6 space-y-2 max-h-[500px] overflow-y-auto pr-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Sent Alert Logs ({notifications.length})
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No alerts dispatched yet. Click "Dispatch Today's Alerts" or mark a student absent to trigger alerts.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => setSelectedNotifId(notif.id)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    (activeNotif?.id === notif.id)
                      ? 'bg-blue-50/80 border-blue-300 shadow-2xs ring-1 ring-blue-400'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5 font-bold text-slate-800">
                      {notif.type === 'sms' ? (
                        <Phone className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      <span>{notif.channel} Notice</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(notif.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="font-semibold text-slate-900">{notif.studentName}</div>
                  <div className="text-slate-500 truncate text-[11px] mt-0.5">{notif.message}</div>
                </div>
              ))
            )}
          </div>

          {/* Right Column: Live Message Preview */}
          <div className="md:col-span-6">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Device Preview Simulator
            </div>

            {activeNotif ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                    {activeNotif.type === 'sms' ? 'SMS' : '@'}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">
                      {activeNotif.channel} Notification ({activeNotif.type.toUpperCase()})
                    </div>
                    <div className="text-[11px] text-slate-400">To: {activeNotif.recipient}</div>
                  </div>
                </div>

                {/* Message Bubble */}
                <div className="bg-slate-100/90 rounded-2xl p-4 text-xs text-slate-800 leading-relaxed font-sans shadow-2xs border border-slate-200/60">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    AttendPulse Automated System
                  </div>
                  {activeNotif.message}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Status: Delivered (Carrier ACK: 200 OK)</span>
                  <span className="text-emerald-600 font-bold">Live Synced</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
                Select an alert from the left to view device dispatch preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
