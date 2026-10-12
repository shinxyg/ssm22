import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  Users, 
  Shield, 
  FileText, 
  Check, 
  Printer, 
  Building2, 
  Pill, 
  Wallet,
  Eye,
  EyeOff
} from 'lucide-react';
import type { ApplicationRecord } from '../types';
import { maskIdNumber, maskName, maskPhoneNumber, logDataUnmaskEvent } from '../utils/masking';

interface AdminDisbursementViewProps {
  darkMode?: boolean;
  applications?: ApplicationRecord[];
  onUpdateStatus?: (refNo: string, newStatus: ApplicationRecord['status'], extraFields?: Record<string, any>) => void;
}

export const AdminDisbursementView: React.FC<AdminDisbursementViewProps> = ({ 
  darkMode = true,
  applications = [],
  onUpdateStatus
}) => {
  const getCurrentTimeString = (): string => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getCurrentDateString = (): string => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tabFilter, setTabFilter] = useState<'ALL' | 'PENDING' | 'RELEASED'>('ALL');
  const [releasingRecord, setReleasingRecord] = useState<ApplicationRecord | null>(null);
  const [releaseDate, setReleaseDate] = useState<string>(getCurrentDateString());
  const [releaseTime, setReleaseTime] = useState<string>(getCurrentTimeString());
  const [scheduledPayoutTimes, setScheduledPayoutTimes] = useState<Record<string, { date: string; time: string }>>({});
  const [unmaskedRefNos, setUnmaskedRefNos] = useState<Set<string>>(new Set());

  const toggleUnmaskDisbursement = (refNo: string, applicantName: string) => {
    setUnmaskedRefNos(prev => {
      const next = new Set(prev);
      if (next.has(refNo)) {
        next.delete(refNo);
      } else {
        next.add(refNo);
        logDataUnmaskEvent(
          'Financial Aid Disbursement',
          `Admin revealed payout ID and applicant name for citizen ${applicantName} (Ref: ${refNo})`
        );
      }
      return next;
    });
  };

  // Sync modal date & time to current real-time clock when modal is opened for a record
  React.useEffect(() => {
    if (releasingRecord) {
      const existing = scheduledPayoutTimes[releasingRecord.referenceNo] || ((releasingRecord as any).scheduledPayoutDate ? {
        date: (releasingRecord as any).scheduledPayoutDate,
        time: (releasingRecord as any).scheduledPayoutTime
      } : null);

      if (existing && existing.date && existing.time) {
        setReleaseDate(existing.date);
        setReleaseTime(existing.time);
      } else {
        setReleaseDate(getCurrentDateString());
        setReleaseTime(getCurrentTimeString());
      }
    }
  }, [releasingRecord]);

  // Helper to format 24-hour time string into 12-hour AM/PM format
  const formatTo12Hour = (timeStr?: string): string => {
    if (!timeStr) return '';
    if (timeStr.toUpperCase().includes('AM') || timeStr.toUpperCase().includes('PM')) {
      return timeStr;
    }
    try {
      const parts = timeStr.split(':');
      if (parts.length >= 2) {
        let hours = parseInt(parts[0], 10);
        const minutes = parts[1].padStart(2, '0');
        if (isNaN(hours)) return timeStr;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutes} ${ampm}`;
      }
    } catch (e) {
      return timeStr;
    }
    return timeStr;
  };

  // Filter approved/ready applications for financial disbursement (Step 5 Payout Masterlist)
  const disbursementRecords = useMemo(() => {
    return applications.filter((app) => {
      const isTrn = (app.category || '').toLowerCase() === 'training' || (app.serviceName || '').toLowerCase().includes('training') || (app.referenceNo || '').startsWith('TRN-');
      const isCwProtection = (app.referenceNo || '').startsWith('QC-CW-') || (app.referenceNo || '').startsWith('CW-PROT-') || (app.serviceName || '').toLowerCase() === 'child welfare services' || (app.serviceName || '').toLowerCase().includes('child protection');
      if (isTrn || isCwProtection) return false; // Non-financial programs have NO financial grant or payout!
      const st = (app.status || '').toUpperCase();
      // Exclude initial 'APPROVED BY ADMIN' step 2 applications until they complete Step 4 interview approval!
      return (
        st === 'APPROVED' ||
        st === 'READY FOR PAYOUT' || 
        st === 'PAYOUT SCHEDULED' ||
        st === 'RELEASED / COMPLETED' || 
        st === 'RELEASED & ARCHIVED' ||
        st === 'PENDING PAYOUT SCHEDULE' ||
        st === 'COMPLETED'
      );
    });
  }, [applications]);

  // Real-time interval check: Auto-release when set Date & Time is reached
  React.useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentDateStr = now.toISOString().split('T')[0];
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMins}`;

      disbursementRecords.forEach((app) => {
        if (app.status !== 'RELEASED / COMPLETED' && (app.status as string) !== 'Completed') {
          const rawDate = (app as any).scheduledPayoutDate || scheduledPayoutTimes[app.referenceNo]?.date;
          const rawTime = (app as any).scheduledPayoutTime || scheduledPayoutTimes[app.referenceNo]?.time;
          const schedDate = rawDate ? String(rawDate).split('T')[0] : null;
          const schedTime = rawTime ? String(rawTime).split('T')[0] : null;

          if (schedDate && schedTime) {
            if (schedDate < currentDateStr || (schedDate === currentDateStr && schedTime <= currentTimeStr)) {
              if (onUpdateStatus) {
                onUpdateStatus(app.referenceNo, 'RELEASED / COMPLETED' as any);
              }
            }
          }
        }
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [disbursementRecords, scheduledPayoutTimes, onUpdateStatus]);

  // Filtered by Search & Tab Filter
  const filteredRecords = useMemo(() => {
    return disbursementRecords.filter((app) => {
      // Tab Filter
      if (tabFilter === 'PENDING' && (app.status === 'RELEASED / COMPLETED' || (app.status as string) === 'Completed')) return false;
      if (tabFilter === 'RELEASED' && !(app.status === 'RELEASED / COMPLETED' || (app.status as string) === 'Completed')) return false;

      // Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const refMatch = app.referenceNo.toLowerCase().includes(q);
        const nameMatch = ((app as any).applicantName || app.details?.applicantName || '').toLowerCase().includes(q);
        const servMatch = app.serviceName.toLowerCase().includes(q);
        return refMatch || nameMatch || servMatch;
      }

      return true;
    });
  }, [disbursementRecords, tabFilter, searchQuery]);

  // Summary Metrics
  const pendingCount = disbursementRecords.filter((a) => a.status !== 'RELEASED / COMPLETED' && a.status !== 'RELEASED & ARCHIVED' && (a.status as string) !== 'Completed').length;
  const releasedCount = disbursementRecords.filter((a) => a.status === 'RELEASED / COMPLETED' || a.status === 'RELEASED & ARCHIVED' || (a.status as string) === 'Completed').length;

  const handleConfirmRelease = (immediate = false) => {
    if (releasingRecord && onUpdateStatus) {
      if (immediate) {
        onUpdateStatus(releasingRecord.referenceNo, 'RELEASED / COMPLETED' as any);
      } else {
        setScheduledPayoutTimes((prev) => ({
          ...prev,
          [releasingRecord.referenceNo]: { date: releaseDate, time: releaseTime }
        }));
        // Update status to Payout Scheduled with date & time!
        onUpdateStatus(releasingRecord.referenceNo, 'Payout Scheduled' as any, {
          scheduledPayoutDate: releaseDate,
          scheduledPayoutTime: releaseTime,
          payoutDate: releaseDate,
          payoutTime: releaseTime,
          payoutVenue: 'Quezon City Hall Cashier / SSDD Office'
        });
      }
      setReleasingRecord(null);
    }
  };

  return (
    <div className={`space-y-6 select-none font-['Plus_Jakarta_Sans',sans-serif] ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Financial Aid Disbursement & Releasing
          </h1>
        </div>
      </div>

      {/* SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`border rounded-2xl p-5 shadow-lg flex justify-between items-start ${
          darkMode ? 'bg-[#0e1726] border-slate-800/90 text-white' : 'bg-white border-slate-200/90 text-slate-900'
        }`}>
          <div>
            <span className={`text-[11px] font-bold tracking-wider uppercase block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>TOTAL RELEASED</span>
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight mt-2">{releasedCount}</div>
          </div>
          <div className={`p-2 rounded-full ${darkMode ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400' : 'bg-emerald-100 border border-emerald-200 text-emerald-600'}`}>
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className={`border rounded-2xl p-5 shadow-lg flex justify-between items-start ${
          darkMode ? 'bg-[#0e1726] border-slate-800/90 text-white' : 'bg-white border-slate-200/90 text-slate-900'
        }`}>
          <div>
            <span className={`text-[11px] font-bold tracking-wider uppercase block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>PENDING RELEASE</span>
            <div className="text-3xl font-extrabold text-amber-400 tracking-tight mt-2">{pendingCount}</div>
          </div>
          <div className={`p-2 rounded-full ${darkMode ? 'bg-amber-950/60 border border-amber-500/30 text-amber-400' : 'bg-amber-100 border border-amber-200 text-amber-600'}`}>
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className={`border rounded-2xl p-5 shadow-lg flex justify-between items-start ${
          darkMode ? 'bg-[#0e1726] border-slate-800/90 text-white' : 'bg-white border-slate-200/90 text-slate-900'
        }`}>
          <div>
            <span className={`text-[11px] font-bold tracking-wider uppercase block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>TOTAL MASTERLIST</span>
            <div className="text-3xl font-extrabold text-blue-400 tracking-tight mt-2">{disbursementRecords.length}</div>
          </div>
          <div className={`p-2 rounded-full ${darkMode ? 'bg-blue-950/60 border border-blue-500/30 text-blue-400' : 'bg-blue-100 border border-blue-200 text-blue-600'}`}>
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className={`border rounded-2xl p-5 shadow-lg flex justify-between items-start ${
          darkMode ? 'bg-[#0e1726] border-slate-800/90 text-white' : 'bg-white border-slate-200/90 text-slate-900'
        }`}>
          <div>
            <span className={`text-[11px] font-bold tracking-wider uppercase block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>AUTOMATIC ARCHIVE</span>
            <div className="text-sm font-extrabold text-blue-400 tracking-tight mt-2">RELEASED ➔ HISTORY</div>
            <span className={`text-[10px] font-medium mt-1 block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Auto-moves to Application History</span>
          </div>
          <div className={`p-2 rounded-full ${darkMode ? 'bg-purple-950/60 border border-purple-500/30 text-purple-400' : 'bg-purple-100 border border-purple-200 text-purple-600'}`}>
            <Shield className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className={`border rounded-2xl p-6 shadow-xl space-y-6 ${
        darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className={`text-sm font-bold tracking-wide flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <FileText className="w-4 h-4 text-blue-400" />
              Financial Aid Disbursement Records
            </h2>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Connected to Appointments & DB. Once marked RELEASED, records automatically archive to Application History.
            </p>
          </div>

          <div className="relative w-full lg:w-72">
            <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Search ID / Beneficiary name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full border rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
                darkMode ? 'bg-[#0b1220] border-slate-700/80 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
              }`}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button" 
            onClick={() => setTabFilter('ALL')} 
            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              tabFilter === 'ALL' 
                ? 'bg-[#1d4ed8] text-white shadow-md border border-blue-400/40' 
                : darkMode 
                ? 'bg-[#121c2e] text-slate-400 hover:text-slate-200 border border-slate-800' 
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 shadow-sm'
            }`}
          >
            ALL ({disbursementRecords.length})
          </button>
          <button 
            type="button" 
            onClick={() => setTabFilter('PENDING')} 
            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              tabFilter === 'PENDING' 
                ? 'bg-[#1d4ed8] text-white shadow-md border border-blue-400/40' 
                : darkMode 
                ? 'bg-[#121c2e] text-slate-400 hover:text-slate-200 border border-slate-800' 
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 shadow-sm'
            }`}
          >
            PENDING ({pendingCount})
          </button>
          <button 
            type="button" 
            onClick={() => setTabFilter('RELEASED')} 
            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              tabFilter === 'RELEASED' 
                ? 'bg-emerald-600 text-white shadow-md border border-emerald-400/40' 
                : darkMode 
                ? 'bg-[#121c2e] text-slate-400 hover:text-slate-200 border border-slate-800' 
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 shadow-sm'
            }`}
          >
            RELEASED ({releasedCount})
          </button>
        </div>

        <div className={`overflow-x-auto border rounded-xl ${darkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[10px] font-extrabold uppercase tracking-wider ${
                darkMode ? 'border-slate-800/80 bg-[#121c2e] text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}>
                <th className="py-3 px-4">DISBURSEMENT ID</th>
                <th className="py-3 px-4">APPLICANT NAME</th>
                <th className="py-3 px-4">ASSISTANCE TYPE</th>
                <th className="py-3 px-4">RELEASE BENEFIT</th>
                <th className="py-3 px-4">PAYOUT LOCATION</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-xs font-medium ${darkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((app) => {
                  const isReleased = app.status === 'RELEASED / COMPLETED' || (app.status as string) === 'Completed';
                  const name = (app as any).applicantName || app.details?.applicantName || 'Juan Dela Cruz';
                  const schedInfo = scheduledPayoutTimes[app.referenceNo];
                  const payoutDate = schedInfo?.date || (app as any).scheduledPayoutDate || (app as any).scheduled_payout_date;
                  const payoutTime = schedInfo?.time || (app as any).scheduledPayoutTime || (app as any).scheduled_payout_time;
                  const hasSchedule = !!(payoutDate && payoutTime);

                  let benefitText = 'Hospital Guarantee Letter (GL)';
                  let locationText = 'Quezon City General Hospital (QCGH)';

                  const s = app.serviceName.toLowerCase();
                  const cat = (app.category || '').toLowerCase();
                  const isEdu = s.includes('educational') || s.includes('indigent') || app.referenceNo.startsWith('QC-SP-EDU') || app.referenceNo.startsWith('QC-EDU') || app.referenceNo.startsWith('CW-');
                  if (s.includes('medicine')) {
                    benefitText = 'Pharmacy Voucher / Reseta Authorization';
                    locationText = 'Accredited Partner Pharmacy';
                  } else if (s.includes('funeral') || s.includes('burial')) {
                    benefitText = 'Up to ₱25,000 Funeral Guarantee';
                    locationText = 'Partner Funeral Parlor';
                  } else if (s.includes('pwd') || cat.includes('pwd')) {
                    benefitText = '₱1,500.00 Quarterly Pension & Financial Aid';
                    locationText = 'Quezon City Hall PDAO Room 102';
                  } else if (s.includes('senior') || cat.includes('senior')) {
                    benefitText = '₱3,000 Quarterly Social Pension';
                    locationText = 'OSCA Distribution Desk';
                  } else if (s.includes('livelihood') || cat.includes('livelihood') || app.referenceNo.startsWith('LVH-')) {
                    benefitText = '₱15,000.00 Livelihood Capital Grant';
                    locationText = 'Quezon City Hall Cashier / SSDD Office';
                  } else if (isEdu) {
                    benefitText = '₱5,000.00 Fixed Educational Grant';
                    locationText = 'Quezon City Hall Cashier / SSDD Office';
                  } else if (s.includes('solo') || s.includes('parent') || cat.includes('solo')) {
                    benefitText = '₱3,000.00 Fixed Cash Subsidy';
                    locationText = 'Quezon City Hall Cashier / SSDD Office';
                  }

                  const isUnmasked = unmaskedRefNos.has(app.referenceNo);
                  return (
                    <tr key={app.referenceNo} className={`transition-colors ${darkMode ? 'hover:bg-[#142036]' : 'hover:bg-slate-50'}`}>
                      <td className="py-3 px-4 font-mono font-bold text-blue-400">
                        <div className="flex items-center gap-1.5">
                          <span>{isUnmasked ? `DISB-${app.referenceNo}` : maskIdNumber(`DISB-${app.referenceNo}`, true)}</span>
                          <button
                            type="button"
                            onClick={() => toggleUnmaskDisbursement(app.referenceNo, name)}
                            className={`p-1 rounded-lg border transition-all cursor-pointer ${
                              isUnmasked
                                ? 'bg-blue-950/60 border-blue-700/80 text-blue-400'
                                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                            }`}
                            title={isUnmasked ? 'Click to mask payout details' : 'Click to unmask payout details'}
                          >
                            {isUnmasked ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>
                      <td className={`py-3 px-4 font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {isUnmasked ? name : maskName(name, true)}
                      </td>
                      <td className={`py-3 px-4 font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{app.serviceName}</td>
                      <td className="py-3 px-4 font-mono text-amber-500 font-bold text-[11px]">{benefitText}</td>
                      <td className={`py-3 px-4 text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{locationText}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border whitespace-nowrap ${
                          isReleased
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                            : hasSchedule
                            ? 'bg-amber-950/60 text-amber-400 border-amber-500/30'
                            : 'bg-blue-950/60 text-blue-300 border-blue-500/30'
                        }`}>
                          <span>
                            {isReleased
                              ? 'RELEASED / COMPLETED'
                              : hasSchedule
                              ? `PAYOUT SCHEDULED (${payoutDate} ${formatTo12Hour(payoutTime)})`
                              : 'READY FOR PAYOUT SCHEDULE'}
                          </span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {!isReleased ? (
                          hasSchedule ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-[11px] font-extrabold text-amber-500 italic whitespace-nowrap inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl">
                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>Payout Scheduled</span>
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setReleasingRecord(app)}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span>Set Payout Date & Time</span>
                            </button>
                          )
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-500 italic whitespace-nowrap">✓ Released & Archived</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className={`py-16 text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className={`w-8 h-8 stroke-[1.5] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                      <p className={`text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>No disbursement records found</p>
                      <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>There are currently no financial aid disbursements registered under this filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRMATION & PAYOUT DATE MODAL */}
      {releasingRecord && createPortal(
        <div className="fixed inset-0 z-[99999] bg-[#030712]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 font-sans ${
            darkMode ? 'bg-[#0e1726] border-slate-700/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <h3 className={`text-sm font-extrabold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <Clock className="w-4 h-4 text-blue-500" />
                Set Financial Aid Payout Schedule
              </h3>
              <button
                type="button"
                onClick={() => setReleasingRecord(null)}
                className={`transition-colors cursor-pointer ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className={`p-3 rounded-xl border space-y-1 ${
                darkMode ? 'bg-[#080f1e] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-[10px] block font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>BENEFICIARY:</span>
                <p className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {(releasingRecord as any).applicantName || releasingRecord.details?.applicantName || 'Juan Dela Cruz'}
                </p>
                <p className={`text-[11px] font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Ref: {releasingRecord.referenceNo}</p>
                <p className="text-amber-500 font-semibold">{releasingRecord.serviceName}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Scheduled Payout Date:
                  </label>
                  <input
                    type="date"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                      darkMode ? 'bg-[#080f1e] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Scheduled Payout Time:
                  </label>
                  <input
                    type="time"
                    value={releaseTime}
                    onChange={(e) => setReleaseTime(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                      darkMode ? 'bg-[#080f1e] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className={`p-3 border rounded-xl text-[11px] font-medium space-y-1 ${
                darkMode ? 'bg-blue-950/40 border-blue-500/30 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <p className={`font-bold flex items-center gap-1 ${darkMode ? 'text-white' : 'text-blue-900'}`}>
                  ⚡ Automatic Release Timer:
                </p>
                <p>
                  Status will stay <strong>PAYOUT SCHEDULED</strong>. When the real-time clock hits <strong>{releaseDate} at {releaseTime}</strong>, the system will automatically update the status to <strong>RELEASED / COMPLETED</strong> and move it to Application History!
                </p>
              </div>
            </div>

            <div className={`p-4 border-t flex items-center justify-between gap-2 flex-wrap rounded-b-2xl ${
              darkMode ? 'bg-[#0a1120] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setReleasingRecord(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleConfirmRelease(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
                  title="Force Release Immediately Now"
                >
                  Release Immediately
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmRelease(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all whitespace-nowrap cursor-pointer"
                >
                  Save Payout Schedule
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};


