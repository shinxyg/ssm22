import React, { useEffect } from 'react';
import { X, Search, CheckCircle2, Clock, FileCheck, QrCode, Download, ShieldCheck, XCircle } from 'lucide-react';
import type { ApplicationRecord } from '../../types';

interface TrackApplicationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: ApplicationRecord[];
  darkMode?: boolean;
}

export const TrackApplicationsModal: React.FC<TrackApplicationsModalProps> = ({
  isOpen,
  onClose,
  applications,
  darkMode = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  const citizenName = (() => {
    try {
      const saved = localStorage.getItem('currentUser');
      if (saved) {
        const u = JSON.parse(saved);
        const fn = (u.first_name || '').trim();
        const ln = (u.last_name || '').trim();
        if (fn || ln) {
          return `${fn} ${ln}`.split(/\s+/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        }
      }
    } catch {}
    return 'Jefferson Lee';
  })();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className={`relative w-full max-w-2xl border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
        darkMode ? 'bg-[#0e172a] border-slate-700' : 'bg-white border-slate-300 shadow-slate-300'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center ${
          darkMode ? 'bg-[#111d38] border-slate-700/80' : 'bg-slate-100 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              darkMode ? 'bg-blue-600/20 border border-blue-500/40 text-blue-400' : 'bg-blue-100 border border-blue-200 text-blue-600'
            }`}>
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Track My Applications</h3>
              <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{citizenName} • Real-Time Status Tracker</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Ref No */}
        <div className={`p-4 border-b ${
          darkMode ? 'bg-[#0d162a] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by Reference Number or Service Name..."
              className={`w-full pl-9 pr-4 py-2 border rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>
        </div>

        {/* Application List */}
        <div className="p-6 overflow-y-auto space-y-4">
          {applications.map((app) => (
            <div
              key={app.referenceNo}
              className={`border rounded-xl p-4 shadow-md space-y-3 ${
                darkMode ? 'bg-[#121e38] border-slate-800' : 'bg-slate-50/70 border-slate-200'
              }`}
            >
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    darkMode ? 'text-blue-400 bg-blue-950/60 border-blue-800' : 'text-blue-700 bg-blue-100 border-blue-200'
                  }`}>
                    Ref: {app.referenceNo}
                  </span>
                  <h4 className={`text-sm font-bold mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{(app.serviceName || '').replace(/\bNieto\s*/gi, '')}</h4>
                  <span className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Category: {app.category}</span>
                </div>

                <div className="text-right">
                  {(() => {
                    const st = (app.status as string) || '';
                    const isRejected = st === 'Rejected' || st === 'Disapproved' || st === 'REJECTED' || st === 'DISAPPROVED' || st.toLowerCase().includes('reject') || st.toLowerCase().includes('disapprov');
                    return (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          isRejected
                            ? darkMode ? 'bg-red-950/80 text-red-300 border-red-600/50' : 'bg-red-100 text-red-800 border-red-300'
                            : app.status === 'Ready for Payout' || app.status === 'RELEASED / COMPLETED' || app.status === 'Completed'
                            ? darkMode ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : app.status === 'Approved'
                            ? darkMode ? 'bg-blue-950/80 text-blue-300 border-blue-600/50' : 'bg-blue-100 text-blue-800 border-blue-300'
                            : darkMode ? 'bg-amber-950/80 text-amber-300 border-amber-600/50' : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {isRejected ? (
                          <XCircle className="w-3 h-3 text-red-500" />
                        ) : app.status === 'Ready for Payout' || app.status === 'Approved' || app.status === 'RELEASED / COMPLETED' || app.status === 'Completed' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-500" />
                        )}
                        {app.status}
                      </span>
                    );
                  })()}
                  <div className={`text-[10px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Submitted: {app.dateSubmitted}</div>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className={`pt-2 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className={`flex items-center justify-between text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span>Assigned Worker: <strong className={darkMode ? 'text-slate-200' : 'text-slate-800'}>{app.assignedSocialWorker}</strong></span>
                  <span>Amount / Type: <strong className={darkMode ? 'text-amber-300' : 'text-amber-600 font-bold'}>{app.amountOrType}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={`px-6 py-3 border-t flex justify-end ${
          darkMode ? 'bg-[#111d38] border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border ${
              darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
