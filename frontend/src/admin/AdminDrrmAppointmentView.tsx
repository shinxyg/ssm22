import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { API_BASE_URL } from '../config/api';
import {
  Search,
  Calendar,
  ChevronDown,
  Clock,
  Check,
  X,
  Printer
} from 'lucide-react';

export type DrrmCaseType =
  | 'Fire'
  | 'Flood'
  | 'Earthquake'
  | 'Landslide'
  | 'Medical'
  | 'Search and Rescue'
  | 'Road Obstruction'
  | 'Vehicular Accident'
  | 'Electrical Hazard';

export interface DrrmAppointmentRecord {
  referenceNo: string;
  reporterName: string;
  reporterRole: string;
  caseType: DrrmCaseType;
  moduleService: string;
  appointmentDate: string;
  appointmentTime: string;
  venue: string;
  status: 'Pending Schedule' | 'Interview Scheduled' | 'Approved & Voucher Issued' | 'Rejected';
  notes?: string;
}

interface AdminDrrmAppointmentViewProps {
  darkMode?: boolean;
}

const INITIAL_DRRM_APPOINTMENTS: DrrmAppointmentRecord[] = [
  {
    referenceNo: 'DRRM-2026-8841',
    reporterName: 'Ramon Bautista',
    reporterRole: 'DRRM Reporter',
    caseType: 'Fire',
    moduleService: 'Medical Assistance',
    appointmentDate: '',
    appointmentTime: '',
    venue: 'SSDD Medical Assistance Desk, QC Hall',
    status: 'Pending Schedule',
    notes: 'Please bring original Statement of Account (SOA), Medical Abstract, and valid ID.'
  },
  {
    referenceNo: 'DRRM-2026-8842',
    reporterName: 'Maria Clara Santos',
    reporterRole: 'DRRM Reporter',
    caseType: 'Vehicular Accident',
    moduleService: 'Medical Assistance',
    appointmentDate: '2026-11-10',
    appointmentTime: '09:30',
    venue: 'SSDD Medical Assistance Desk, QC Hall',
    status: 'Interview Scheduled',
    notes: 'Please bring original Statement of Account (SOA), Medical Abstract, and valid ID.'
  },
  {
    referenceNo: 'DRRM-2026-8839',
    reporterName: 'Carlo Mendoza',
    reporterRole: 'DRRM Reporter',
    caseType: 'Flood',
    moduleService: 'Medical Assistance',
    appointmentDate: '2026-11-07',
    appointmentTime: '14:00',
    venue: 'SSDD Medical Assistance Desk, QC Hall',
    status: 'Approved & Voucher Issued',
    notes: 'Verified DRRM flood emergency medical referral.'
  },
  {
    referenceNo: 'DRRM-2026-8835',
    reporterName: 'Jerome Villanueva',
    reporterRole: 'DRRM Reporter',
    caseType: 'Electrical Hazard',
    moduleService: 'Medical Assistance',
    appointmentDate: '2026-11-06',
    appointmentTime: '11:00',
    venue: 'SSDD Medical Assistance Desk, QC Hall',
    status: 'Approved & Voucher Issued',
    notes: 'Verified DRRM electrical hazard medical referral.'
  }
];

const STORAGE_KEY = 'govserve_drrm_appointments_v1';

export const AdminDrrmAppointmentView: React.FC<AdminDrrmAppointmentViewProps> = ({
  darkMode = true
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('Medical Assistance');
  const [statusFilter, setStatusFilter] = useState<string>('All Statuses');

  const [records, setRecords] = useState<DrrmAppointmentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_DRRM_APPOINTMENTS;
  });

  const [schedulingRecord, setSchedulingRecord] = useState<DrrmAppointmentRecord | null>(null);
  const [assessmentRecord, setAssessmentRecord] = useState<DrrmAppointmentRecord | null>(null);
  const [printingVoucher, setPrintingVoucher] = useState<DrrmAppointmentRecord | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {}
  }, [records]);

  // Sync DRRM appointments from Railway PostgreSQL drrm_appointments table
  useEffect(() => {
    const fetchBackendDrrm = () => {
      fetch(`${API_BASE_URL}/api/drrm/appointments`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const mappedFromDb: DrrmAppointmentRecord[] = data.map((dbItem: any) => {
              const rawStatus = String(dbItem.status || '');
              const mappedStatus: DrrmAppointmentRecord['status'] =
                rawStatus.toUpperCase().includes('APPROV') ||
                rawStatus.toUpperCase().includes('VOUCHER')
                  ? 'Approved & Voucher Issued'
                  : rawStatus.toUpperCase().includes('REJECT')
                  ? 'Rejected'
                  : rawStatus.toUpperCase().includes('SCHED')
                  ? 'Interview Scheduled'
                  : 'Pending Schedule';

              return {
                referenceNo: dbItem.reference_no || dbItem.referenceNo,
                reporterName: dbItem.reporter_name || dbItem.reporterName || 'DRRM Citizen',
                reporterRole: 'DRRM Reporter',
                caseType: ((dbItem.case_type || dbItem.caseType) as DrrmCaseType) || 'Medical',
                moduleService: 'Medical Assistance',
                appointmentDate: dbItem.appointment_date || dbItem.appointmentDate || '',
                appointmentTime: dbItem.appointment_time || dbItem.appointmentTime || '',
                venue: 'SSDD Medical Assistance Desk, QC Hall',
                status: mappedStatus,
                notes: 'Verified DRRM referral for medical assistance.'
              };
            });
            setRecords(mappedFromDb);
          }
        })
        .catch(() => {});
    };

    fetchBackendDrrm();
    const timer = setInterval(fetchBackendDrrm, 5000);
    return () => clearInterval(timer);
  }, []);

  const getCurrentDateString = (): string => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  const getCurrentTimeString = (): string => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [schedDate, setSchedDate] = useState<string>(getCurrentDateString());
  const [schedTime, setSchedTime] = useState<string>(getCurrentTimeString());

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
        return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
      }
    } catch {}
    return timeStr;
  };

  const formatDateDisplay = (dateStr?: string): string => {
    if (!dateStr) return '';
    if (dateStr.includes(',')) return dateStr;
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
          });
        }
      }
    } catch {}
    return dateStr;
  };

  const getCaseTypeBadge = (caseType: DrrmCaseType) => {
    switch (caseType) {
      case 'Fire':
        return {
          emoji: '🔥',
          cls: darkMode
            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
            : 'bg-rose-50 text-rose-700 border-rose-300'
        };
      case 'Vehicular Accident':
        return {
          emoji: '🚗',
          cls: darkMode
            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            : 'bg-emerald-50 text-emerald-700 border-emerald-300'
        };
      case 'Flood':
        return {
          emoji: '💧',
          cls: darkMode
            ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
            : 'bg-sky-50 text-sky-700 border-sky-300'
        };
      case 'Electrical Hazard':
        return {
          emoji: '🗼',
          cls: darkMode
            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            : 'bg-amber-50 text-amber-700 border-amber-300'
        };
      case 'Earthquake':
        return {
          emoji: '⚡',
          cls: darkMode
            ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
            : 'bg-yellow-50 text-yellow-700 border-yellow-300'
        };
      case 'Landslide':
        return {
          emoji: '⛰️',
          cls: darkMode
            ? 'bg-stone-500/15 text-stone-300 border-stone-500/30'
            : 'bg-stone-100 text-stone-700 border-stone-300'
        };
      case 'Search and Rescue':
        return {
          emoji: '🔍',
          cls: darkMode
            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
            : 'bg-purple-50 text-purple-700 border-purple-300'
        };
      case 'Road Obstruction':
        return {
          emoji: '⚠️',
          cls: darkMode
            ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
            : 'bg-orange-50 text-orange-700 border-orange-300'
        };
      case 'Medical':
      default:
        return {
          emoji: '💓',
          cls: darkMode
            ? 'bg-pink-500/15 text-pink-300 border-pink-500/30'
            : 'bg-pink-50 text-pink-700 border-pink-300'
        };
    }
  };

  // Metrics
  const totalCount = records.length;
  const pendingCount = records.filter((r) => r.status === 'Pending Schedule').length;
  const scheduledCount = records.filter((r) => r.status === 'Interview Scheduled').length;
  const approvedCount = records.filter((r) => r.status === 'Approved & Voucher Issued').length;
  const rejectedCount = records.filter((r) => r.status === 'Rejected').length;

  const filteredList = useMemo(() => {
    return records.filter((rec) => {
      if (statusFilter !== 'All Statuses') {
        if (statusFilter === 'Pending Schedule' && rec.status !== 'Pending Schedule') return false;
        if (statusFilter === 'Scheduled' && rec.status !== 'Interview Scheduled') return false;
        if (
          statusFilter === 'Approved & Voucher Issued' &&
          rec.status !== 'Approved & Voucher Issued'
        )
          return false;
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const refMatch = rec.referenceNo.toLowerCase().includes(q);
        const nameMatch = rec.reporterName.toLowerCase().includes(q);
        const caseMatch = rec.caseType.toLowerCase().includes(q);
        return refMatch || nameMatch || caseMatch;
      }

      return true;
    });
  }, [records, statusFilter, searchQuery]);

  const handleOpenScheduleModal = (rec: DrrmAppointmentRecord) => {
    setSchedulingRecord(rec);
    setSchedDate(rec.appointmentDate || getCurrentDateString());
    setSchedTime(rec.appointmentTime || getCurrentTimeString());
  };

  const handleSaveSchedule = async () => {
    if (!schedulingRecord) return;

    const updatedRec: DrrmAppointmentRecord = {
      ...schedulingRecord,
      appointmentDate: schedDate,
      appointmentTime: schedTime,
      status: 'Interview Scheduled'
    };

    setRecords((prev) =>
      prev.map((item) => (item.referenceNo === schedulingRecord.referenceNo ? updatedRec : item))
    );

    try {
      await fetch(
        `${API_BASE_URL}/api/drrm/appointments/${encodeURIComponent(updatedRec.referenceNo)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointmentDate: updatedRec.appointmentDate,
            appointmentTime: updatedRec.appointmentTime,
            status: 'Interview Scheduled'
          })
        }
      );
    } catch {}

    setSchedulingRecord(null);
  };

  const handleDecision = async (
    rec: DrrmAppointmentRecord,
    newStatus: 'Approved & Voucher Issued' | 'Rejected'
  ) => {
    setRecords((prev) =>
      prev.map((item) =>
        item.referenceNo === rec.referenceNo ? { ...item, status: newStatus } : item
      )
    );

    try {
      await fetch(
        `${API_BASE_URL}/api/drrm/appointments/${encodeURIComponent(rec.referenceNo)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            voucherNo:
              newStatus === 'Approved & Voucher Issued' ? `VCH-${rec.referenceNo}` : null
          })
        }
      );
    } catch {}

    setAssessmentRecord(null);
  };

  return (
    <div
      className={`space-y-6 select-none font-['Plus_Jakarta_Sans',sans-serif] ${
        darkMode ? 'text-slate-100' : 'text-slate-900'
      }`}
    >
      {/* Header */}
      <div>
        <h1
          className={`text-2xl font-extrabold tracking-tight ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}
        >
          DRRM Integration Appointments &amp; Scheduling
        </h1>
        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Medical Assistance referrals &amp; appointments mula sa DRRM (Disaster Risk Reduction and Management)
        </p>
      </div>

      {/* 5 METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
        <div
          className={`border rounded-2xl p-3 sm:p-4 shadow-lg ${
            darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90'
          }`}
        >
          <span
            className={`text-[10px] font-bold tracking-wider uppercase ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            TOTAL REQUESTS
          </span>
          <div
            className={`text-xl sm:text-2xl font-extrabold tracking-tight mt-1 sm:mt-1.5 ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            {totalCount}
          </div>
        </div>

        <div
          className={`border rounded-2xl p-3 sm:p-4 shadow-lg ${
            darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90'
          }`}
        >
          <span
            className={`text-[10px] font-bold tracking-wider uppercase ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            PENDING SCHEDULE
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-400 tracking-tight mt-1 sm:mt-1.5">
            {pendingCount}
          </div>
        </div>

        <div
          className={`border rounded-2xl p-3 sm:p-4 shadow-lg ${
            darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90'
          }`}
        >
          <span
            className={`text-[10px] font-bold tracking-wider uppercase ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            SCHEDULED
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-blue-400 tracking-tight mt-1 sm:mt-1.5">
            {scheduledCount}
          </div>
        </div>

        <div
          className={`border rounded-2xl p-3 sm:p-4 shadow-lg ${
            darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90'
          }`}
        >
          <span
            className={`text-[10px] font-bold tracking-wider uppercase ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            APPROVED / VOUCHER
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 tracking-tight mt-1 sm:mt-1.5">
            {approvedCount}
          </div>
        </div>

        <div
          className={`border rounded-2xl p-3 sm:p-4 shadow-lg col-span-2 sm:col-span-1 ${
            darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90'
          }`}
        >
          <span
            className={`text-[10px] font-bold tracking-wider uppercase ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            REJECTED
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-400 tracking-tight mt-1 sm:mt-1.5">
            {rejectedCount}
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div
        className={`border rounded-2xl p-5 space-y-4 shadow-xl ${
          darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90'
        }`}
      >
        <div className="relative w-full">
          <Search
            className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          />
          <input
            type="text"
            placeholder="Search by reporter/client name or DRRM reference number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
              darkMode
                ? 'bg-[#0b1220] border-slate-700/80 text-slate-200 placeholder-slate-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label
              className={`text-[10px] font-extrabold tracking-wider uppercase block mb-1.5 ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Module / Service
            </label>
            <div className="relative">
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className={`w-full appearance-none border rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer ${
                  darkMode
                    ? 'bg-[#0b1220] border-slate-700/80 text-slate-200'
                    : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <option value="Medical Assistance">Medical Assistance</option>
              </select>
              <ChevronDown
                className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              />
            </div>
          </div>

          <div>
            <label
              className={`text-[10px] font-extrabold tracking-wider uppercase block mb-1.5 ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Status
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`w-full appearance-none border rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer ${
                  darkMode
                    ? 'bg-[#0b1220] border-slate-700/80 text-slate-200'
                    : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <option value="All Statuses">All Statuses</option>
                <option value="Pending Schedule">Pending Schedule</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Approved & Voucher Issued">Approved &amp; Voucher Issued</option>
              </select>
              <ChevronDown
                className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* APPOINTMENTS REGISTRY */}
      <div className="space-y-3">
        <h3
          className={`text-sm font-bold tracking-wide ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}
        >
          Appointments Registry{' '}
          <span className={`font-mono text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            ({filteredList.length})
          </span>
        </h3>

        {filteredList.length > 0 ? (
          <div>
            {/* Mobile Cards View */}
            <div className="md:hidden space-y-3.5">
              {filteredList.map((rec) => {
                const badge = getCaseTypeBadge(rec.caseType);
                const dateFormatted = rec.appointmentDate
                  ? formatDateDisplay(rec.appointmentDate)
                  : '';
                const timeFormatted = rec.appointmentTime
                  ? formatTo12Hour(rec.appointmentTime)
                  : '';

                return (
                  <div
                    key={rec.referenceNo}
                    className={`p-4 space-y-3 rounded-2xl border shadow-lg transition-all ${
                      darkMode
                        ? 'bg-[#0e1726] border-slate-800/90'
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-xs text-blue-400 block">
                          {rec.referenceNo}
                        </span>
                        <h4
                          className={`text-sm font-extrabold mt-0.5 ${
                            darkMode ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {rec.reporterName}
                        </h4>
                        <span
                          className={`text-[11px] block ${
                            darkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          {rec.reporterRole}
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${
                          rec.status === 'Rejected'
                            ? darkMode
                              ? 'bg-rose-950/60 text-rose-300 border-rose-800/40'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                            : rec.status === 'Approved & Voucher Issued'
                            ? darkMode
                              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : rec.status === 'Interview Scheduled'
                            ? darkMode
                              ? 'bg-blue-950/60 text-blue-400 border-blue-500/30'
                              : 'bg-blue-100 text-blue-800 border-blue-300'
                            : darkMode
                            ? 'bg-amber-950/60 text-amber-400 border-amber-500/30'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-xl border space-y-2 text-xs ${
                        darkMode
                          ? 'bg-[#0b1220] border-slate-800/80'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] uppercase tracking-wider ${
                            darkMode ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          Case Type
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border font-bold text-xs ${badge.cls}`}
                        >
                          <span>{badge.emoji}</span>
                          <span>{rec.caseType}</span>
                        </span>
                      </div>

                      <div
                        className={`flex items-center justify-between pt-1.5 border-t ${
                          darkMode ? 'border-slate-800/60' : 'border-slate-200'
                        }`}
                      >
                        <span
                          className={`text-[10px] uppercase tracking-wider ${
                            darkMode ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          Module / Service
                        </span>
                        <span className="font-semibold">{rec.moduleService}</span>
                      </div>

                      <div
                        className={`flex items-center justify-between pt-1.5 border-t ${
                          darkMode ? 'border-slate-800/60' : 'border-slate-200'
                        }`}
                      >
                        <span
                          className={`text-[10px] uppercase tracking-wider ${
                            darkMode ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          Schedule
                        </span>
                        {rec.status !== 'Pending Schedule' && dateFormatted ? (
                          <span className="font-mono font-bold">
                            📅 {dateFormatted} {timeFormatted ? `· ${timeFormatted}` : ''}
                          </span>
                        ) : (
                          <span className="text-amber-400 italic text-[11px]">
                            Pending Schedule
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-1">
                      {rec.status === 'Pending Schedule' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenScheduleModal(rec)}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                        >
                          Set Schedule
                        </button>
                      ) : rec.status === 'Interview Scheduled' ? (
                        <button
                          type="button"
                          onClick={() => setAssessmentRecord(rec)}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                        >
                          Conduct Assessment
                        </button>
                      ) : rec.status === 'Approved & Voucher Issued' ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex-1 text-center font-extrabold text-xs py-2 rounded-xl border inline-flex items-center justify-center gap-1 ${
                              darkMode
                                ? 'text-emerald-400 bg-emerald-950/60 border-emerald-700/40'
                                : 'text-emerald-800 bg-emerald-100 border-emerald-300'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approved</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setPrintingVoucher(rec)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors inline-flex items-center gap-1.5 shadow-md cursor-pointer ${
                              darkMode
                                ? 'bg-blue-950/80 hover:bg-blue-900 text-blue-300 border-blue-800'
                                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300'
                            }`}
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Voucher</span>
                          </button>
                        </div>
                      ) : (
                        <div
                          className={`w-full text-center font-extrabold text-xs py-2 rounded-xl border ${
                            darkMode
                              ? 'text-rose-300 bg-rose-950/60 border-rose-800/50'
                              : 'text-rose-800 bg-rose-100 border-rose-300'
                          }`}
                        >
                          Rejected
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop 7-Column Table */}
            <div
              className={`hidden md:block border rounded-2xl overflow-hidden shadow-xl ${
                darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200'
              }`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr
                      className={`border-b text-[11px] font-extrabold uppercase tracking-wider whitespace-nowrap ${
                        darkMode
                          ? 'border-slate-800/80 bg-[#121c2e] text-slate-400'
                          : 'border-slate-200 bg-slate-100 text-slate-600'
                      }`}
                    >
                      <th className="py-4 px-5 whitespace-nowrap">REFERENCE NO.</th>
                      <th className="py-4 px-5 whitespace-nowrap">REPORTED BY / CLIENT</th>
                      <th className="py-4 px-5 whitespace-nowrap">CASE TYPE</th>
                      <th className="py-4 px-5 whitespace-nowrap">MODULE / SERVICE</th>
                      <th className="py-4 px-5 whitespace-nowrap">SCHEDULE DATE &amp; TIME</th>
                      <th className="py-4 px-5 whitespace-nowrap">STATUS</th>
                      <th className="py-4 px-5 text-right whitespace-nowrap">ACTION</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y text-xs font-medium ${
                      darkMode ? 'divide-slate-800/60' : 'divide-slate-200'
                    }`}
                  >
                    {filteredList.map((rec) => {
                      const badge = getCaseTypeBadge(rec.caseType);
                      const dateFormatted = rec.appointmentDate
                        ? formatDateDisplay(rec.appointmentDate)
                        : '';
                      const timeFormatted = rec.appointmentTime
                        ? formatTo12Hour(rec.appointmentTime)
                        : '';

                      return (
                        <tr
                          key={rec.referenceNo}
                          className={`transition-colors whitespace-nowrap ${
                            darkMode ? 'hover:bg-[#142036]' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-4 px-5 font-mono font-bold text-blue-400">
                            {rec.referenceNo}
                          </td>

                          <td className="py-4 px-5">
                            <div
                              className={`font-bold ${
                                darkMode ? 'text-white' : 'text-slate-900'
                              }`}
                            >
                              {rec.reporterName}
                            </div>
                            <span
                              className={`inline-block mt-0.5 text-[11px] ${
                                darkMode ? 'text-slate-400' : 'text-slate-500'
                              }`}
                            >
                              {rec.reporterRole}
                            </span>
                          </td>

                          <td className="py-4 px-5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold text-xs ${badge.cls}`}
                            >
                              <span>{badge.emoji}</span>
                              <span>{rec.caseType}</span>
                            </span>
                          </td>

                          <td
                            className={`py-4 px-5 font-semibold ${
                              darkMode ? 'text-slate-300' : 'text-slate-700'
                            }`}
                          >
                            {rec.moduleService}
                          </td>

                          <td
                            className={`py-4 px-5 font-mono text-[11px] ${
                              darkMode ? 'text-slate-200' : 'text-slate-800'
                            }`}
                          >
                            {rec.status !== 'Pending Schedule' && dateFormatted ? (
                              <div className="font-bold">
                                📅 {dateFormatted}{' '}
                                {timeFormatted ? `· ${timeFormatted}` : ''}
                              </div>
                            ) : (
                              <span className="text-amber-400/80 italic text-[11px]">
                                Pending Schedule
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold border whitespace-nowrap ${
                                rec.status === 'Rejected'
                                  ? darkMode
                                    ? 'bg-rose-950/60 text-rose-300 border-rose-800/40'
                                    : 'bg-rose-100 text-rose-800 border-rose-300'
                                  : rec.status === 'Approved & Voucher Issued'
                                  ? darkMode
                                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : rec.status === 'Interview Scheduled'
                                  ? darkMode
                                    ? 'bg-blue-950/60 text-blue-400 border-blue-500/30'
                                    : 'bg-blue-100 text-blue-800 border-blue-300'
                                  : darkMode
                                  ? 'bg-amber-950/60 text-amber-400 border-amber-500/30'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}
                            >
                              {rec.status}
                            </span>
                          </td>

                          <td className="py-4 px-5 text-right whitespace-nowrap">
                            {rec.status === 'Pending Schedule' ? (
                              <button
                                type="button"
                                onClick={() => handleOpenScheduleModal(rec)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                              >
                                Set Schedule
                              </button>
                            ) : rec.status === 'Interview Scheduled' ? (
                              <button
                                type="button"
                                onClick={() => setAssessmentRecord(rec)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                              >
                                Conduct Assessment
                              </button>
                            ) : rec.status === 'Approved & Voucher Issued' ? (
                              <div className="inline-flex items-center justify-end gap-2">
                                <span
                                  className={`font-extrabold text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border ${
                                    darkMode
                                      ? 'text-emerald-400 bg-emerald-950/60 border-emerald-700/40'
                                      : 'text-emerald-800 bg-emerald-100 border-emerald-300'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approved</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setPrintingVoucher(rec)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors inline-flex items-center gap-1.5 shadow-md cursor-pointer ${
                                    darkMode
                                      ? 'bg-blue-950/80 hover:bg-blue-900 text-blue-300 border-blue-800'
                                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300'
                                  }`}
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Print Voucher</span>
                                </button>
                              </div>
                            ) : (
                              <span
                                className={`font-extrabold text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border ${
                                  darkMode
                                    ? 'text-rose-300 bg-rose-950/60 border-rose-800/50'
                                    : 'text-rose-800 bg-rose-100 border-rose-300'
                                }`}
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Rejected</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`border rounded-2xl p-16 text-center shadow-xl flex flex-col items-center justify-center ${
              darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200'
            }`}
          >
            <div
              className={`p-3.5 rounded-2xl border mb-3 ${
                darkMode
                  ? 'bg-[#121c2e] border-slate-800 text-slate-400'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
            >
              <Calendar className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h4 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              No DRRM appointments found
            </h4>
            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Try adjusting your search terms or status filters.
            </p>
          </div>
        )}
      </div>

      {/* SET SCHEDULE MODAL */}
      {schedulingRecord &&
        createPortal(
          <div className="fixed inset-0 z-[99999] bg-[#030712]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 font-sans my-auto max-h-[92vh] flex flex-col">
              <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-[#131f37] shrink-0">
                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider">
                    {schedulingRecord.referenceNo}
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                    Set Appointment Schedule
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSchedulingRecord(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-semibold uppercase">
                      REPORTED BY / CLIENT
                    </span>
                    <span className="font-extrabold text-white text-sm">
                      {schedulingRecord.reporterName}
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      {schedulingRecord.reporterRole}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block font-semibold uppercase">
                      CASE TYPE
                    </span>
                    <span className="font-bold text-blue-400">
                      {getCaseTypeBadge(schedulingRecord.caseType).emoji}{' '}
                      {schedulingRecord.caseType}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider block mb-1">
                      Appointment Date
                    </label>
                    <input
                      type="date"
                      value={schedDate}
                      onChange={(e) => setSchedDate(e.target.value)}
                      className="w-full bg-[#0b1220] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider block mb-1">
                      Time Slot (Real Clock)
                    </label>
                    <input
                      type="time"
                      value={schedTime}
                      onChange={(e) => setSchedTime(e.target.value)}
                      className="w-full bg-[#0b1220] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider block mb-1">
                    Venue / Office Desk
                  </label>
                  <input
                    type="text"
                    value={schedulingRecord.venue}
                    disabled
                    readOnly
                    className="w-full bg-[#0b1220]/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 cursor-not-allowed select-none opacity-80"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider block mb-1">
                    Instructions for Client / Reporter
                  </label>
                  <textarea
                    rows={2}
                    value={
                      schedulingRecord.notes ||
                      'Please bring original Statement of Account (SOA), DRRM Incident Referral Slip, and valid ID.'
                    }
                    disabled
                    readOnly
                    className="w-full bg-[#0b1220]/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 cursor-not-allowed select-none opacity-80 resize-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-[#0a1120] border-t border-slate-800 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setSchedulingRecord(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-colors cursor-pointer"
                >
                  Save Schedule &amp; Send SMS
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ASSESSMENT & DECISION MODAL */}
      {assessmentRecord &&
        createPortal(
          <div className="fixed inset-0 z-[99999] bg-[#030712]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 font-sans my-auto max-h-[92vh] flex flex-col">
              <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-[#131f37] shrink-0">
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    {assessmentRecord.referenceNo}
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                    DRRM Medical Referral Assessment &amp; Decision
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAssessmentRecord(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-semibold uppercase">
                      REPORTED BY / CLIENT
                    </span>
                    <span className="font-extrabold text-white text-sm">
                      {assessmentRecord.reporterName}
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      {assessmentRecord.reporterRole}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block font-semibold uppercase">
                      CASE TYPE / MODULE
                    </span>
                    <span className="font-bold text-blue-400 block">
                      {getCaseTypeBadge(assessmentRecord.caseType).emoji}{' '}
                      {assessmentRecord.caseType}
                    </span>
                    <span className="text-[11px] text-slate-300">
                      {assessmentRecord.moduleService}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                    DRRM REFERRAL &amp; MEDICAL VOUCHER VERIFICATION
                  </span>
                  <p className="text-[11px]">
                    Social Worker verified the DRRM incident report, medical abstract, and valid identification. Choose the final assessment decision below to issue the Official Medical Assistance Voucher:
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#0a1120] border-t border-slate-800 flex justify-between items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setAssessmentRecord(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDecision(assessmentRecord, 'Rejected')}
                    className="px-4 py-2 bg-rose-950/70 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDecision(assessmentRecord, 'Approved & Voucher Issued')
                    }
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-colors cursor-pointer"
                  >
                    Approve &amp; Issue Voucher
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* PRINTABLE OFFICIAL MEDICAL ASSISTANCE VOUCHER MODAL */}
      {printingVoucher &&
        createPortal(
          <div
            id="printable-drrm-voucher-portal"
            className="fixed inset-0 z-[99999] bg-[#030712]/90 backdrop-blur-md overflow-y-auto overscroll-contain"
          >
            <style>{`
              @media print {
                #root, nav, sidebar, header, .no-print {
                  display: none !important;
                }
                html, body {
                  background: #ffffff !important;
                  color: #000000 !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
                  height: auto !important;
                  overflow: visible !important;
                }
                #printable-drrm-voucher-portal {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  height: auto !important;
                  background: #ffffff !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  display: block !important;
                  overflow: visible !important;
                }
                #printable-drrm-voucher-card {
                  position: static !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  background: #ffffff !important;
                  color: #000000 !important;
                  padding: 20px !important;
                  margin: 0 !important;
                  box-shadow: none !important;
                  border: none !important;
                  border-radius: 0 !important;
                  display: block !important;
                  overflow: visible !important;
                }
              }
            `}</style>

            <div className="min-h-full w-full flex flex-col items-center justify-start p-2 sm:p-4 py-3 sm:py-6 pb-36 sm:pb-20">
              {/* Top Action Bar */}
              <div className="w-full max-w-2xl bg-[#0f172a] border border-slate-700/80 rounded-2xl p-3 sm:p-4 mb-3 flex items-center justify-between shadow-xl shrink-0 no-print sticky top-2 z-20 backdrop-blur-md">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                    <Printer className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-extrabold text-white truncate">
                      Official Medical Assistance Voucher
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {printingVoucher.referenceNo}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 sm:px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintingVoucher(null)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Close Preview"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Printable Voucher Card */}
              <div
                id="printable-drrm-voucher-card"
                className="bg-white text-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl p-4 sm:p-8 font-sans border border-slate-300"
              >
                <div className="text-center space-y-1 border-b pb-4 border-slate-300">
                  <div className="relative flex flex-col sm:flex-row items-center justify-center min-h-[56px] py-1">
                    <img
                      src="/Government Service Integrity Seal.png"
                      alt="QC Seal"
                      className="w-12 h-12 sm:w-14 sm:h-14 object-contain sm:absolute sm:left-0 sm:top-1/2 sm:-translate-y-1/2 mx-auto sm:mx-0 mb-1 sm:mb-0"
                    />
                    <div className="text-center w-full px-2 sm:px-16">
                      <h2 className="text-sm sm:text-base font-black tracking-tight uppercase text-slate-900">
                        REPUBLIC OF THE PHILIPPINES
                      </h2>
                      <h3 className="text-[11px] sm:text-xs font-bold text-slate-700">
                        QUEZON CITY GOVERNMENT
                      </h3>
                      <h4 className="text-[10px] sm:text-[11px] font-extrabold text-blue-900 uppercase">
                        SOCIAL SERVICES &amp; DEVELOPMENT DEPARTMENT (SSDD) — DRRM INTEGRATION
                      </h4>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">
                        City Hall Compound, Elliptical Road, Quezon City
                      </p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <span className="inline-block px-4 py-1 bg-blue-50 border border-blue-300 text-blue-950 text-xs font-black rounded-lg tracking-widest uppercase">
                      OFFICIAL MEDICAL ASSISTANCE VOUCHER
                    </span>
                  </div>
                </div>

                {/* VOUCHER CONTROL NO & DATE */}
                <div className="flex justify-between items-center py-3 border-b border-slate-200 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">
                      VOUCHER CONTROL NO.:
                    </span>
                    <span className="font-black text-blue-900 text-sm">
                      VCH-{printingVoucher.referenceNo}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 font-bold block text-[10px]">
                      DATE ISSUED:
                    </span>
                    <span className="font-bold text-slate-800">
                      {new Date().toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                <div className="py-4 space-y-3.5 text-xs">
                  {/* REPORTER / CLIENT INFORMATION */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
                      REPORTED BY / CLIENT INFORMATION:
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block uppercase font-bold">
                          • Reported By / Client Name:
                        </span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          {printingVoucher.reporterName}
                        </span>
                        <span className="block text-[10px] text-slate-500 font-semibold">
                          ({printingVoucher.reporterRole})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block uppercase font-bold">
                          • DRRM Reference No.:
                        </span>
                        <span className="font-bold font-mono text-blue-900">
                          {printingVoucher.referenceNo}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CASE TYPE & SERVICE DETAILS */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
                      DRRM CASE &amp; ASSISTANCE DETAILS:
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block uppercase font-bold">
                          • CASE TYPE:
                        </span>
                        <span className="font-extrabold text-slate-900">
                          {printingVoucher.caseType}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block uppercase font-bold">
                          • MODULE / SERVICE:
                        </span>
                        <span className="font-extrabold text-blue-900">
                          {printingVoucher.moduleService}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* VOUCHER AMOUNT */}
                  <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5">
                    <h4 className="text-[11px] font-black uppercase text-amber-900 tracking-wider">
                      APPROVED VOUCHER AMOUNT:
                    </h4>
                    <div className="space-y-1 font-mono text-xs">
                      <p>
                        <span className="font-bold">• Amount in Words:</span>{' '}
                        _______________________________________________________
                      </p>
                      <p>
                        <span className="font-bold">• Amount in Figures:</span>{' '}
                        <span className="font-black text-sm text-slate-900">
                          ₱ __________________
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* SIGNATORIES */}
                  <div className="grid grid-cols-2 gap-8 pt-10 text-xs">
                    <div>
                      <div className="border-b border-slate-800 w-full mb-1"></div>
                      <span className="text-[9px] text-slate-500 block font-bold text-center">
                        Assessed By: SSDD Medical Assistance Officer
                      </span>
                    </div>
                    <div>
                      <div className="border-b border-slate-800 w-full mb-1"></div>
                      <span className="text-[9px] text-slate-500 block font-bold text-center">
                        Approved By: Department Head, SSDD
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
