import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { API_BASE_URL } from '../config/api';
import {
  Search,
  Calendar,
  ChevronDown,
  Clock,
  Check,
  X
} from 'lucide-react';

export type ConsultStatus =
  | 'Pending Consultation'
  | 'Consultation Scheduled'
  | 'Consultation Completed'
  | 'Rejected';

export interface ConsultAppointmentRecord {
  referenceNo: string;
  applicantName: string;
  serviceType: string;
  preferredDate: string;
  appointmentTime: string;
  reasonSymptoms: string;
  status: ConsultStatus;
  notes?: string;
}

interface AdminConsultAppointmentViewProps {
  darkMode?: boolean;
}

const STORAGE_KEY = 'govserve_consult_appointments_v1';

export const AdminConsultAppointmentView: React.FC<AdminConsultAppointmentViewProps> = ({
  darkMode = true
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('General Consultation');
  const [statusFilter, setStatusFilter] = useState<string>('All Statuses');

  const [records, setRecords] = useState<ConsultAppointmentRecord[]>([]);
  const [activeRecord, setActiveRecord] = useState<ConsultAppointmentRecord | null>(null);

  const getCurrentDateString = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getCurrentTimeString = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  const [schedDate, setSchedDate] = useState<string>(() => getCurrentDateString());
  const [schedTime, setSchedTime] = useState<string>(() => getCurrentTimeString());
  const [schedNotes, setSchedNotes] = useState<string>('');

  const normalizeStatus = (raw?: string): ConsultStatus => {
    const s = (raw || '').trim().toLowerCase();
    if (s.includes('reject')) return 'Rejected';
    if (s.includes('complet') || s.includes('approv') || s.includes('issued')) {
      return 'Consultation Completed';
    }
    if (s.includes('schedul')) return 'Consultation Scheduled';
    return 'Pending Consultation';
  };

  useEffect(() => {
    const fetchConsultAppointments = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/consult-appointments`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const mapped: ConsultAppointmentRecord[] = data.map((row: any) => ({
              referenceNo: row.reference_no || row.referenceNo || 'CONSULT-2026-0000',
              applicantName: (row.applicant_name || row.applicantName || 'CITIZEN APPLICANT').toUpperCase(),
              serviceType: row.service_type || row.serviceType || 'General Consultation',
              preferredDate: row.preferred_date || row.preferredDate || '',
              appointmentTime: row.appointment_time || row.appointmentTime || '',
              reasonSymptoms:
                row.reason_symptoms ||
                row.reasonSymptoms ||
                'General medical consultation request',
              status: normalizeStatus(row.status),
              notes: row.notes || ''
            }));
            setRecords(mapped);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
            } catch {}
          }
        }
      } catch {}
    };

    fetchConsultAppointments();
    const interval = setInterval(fetchConsultAppointments, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeRecord) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [activeRecord]);

  const formatTo12Hour = (timeStr?: string): string => {
    if (!timeStr) return '';
    if (timeStr.toUpperCase().includes('AM') || timeStr.toUpperCase().includes('PM')) {
      return timeStr;
    }
    try {
      const parts = timeStr.split(':');
      if (parts.length >= 2) {
        let hours = parseInt(parts[0], 10);
        const minutes = parts[1];
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

  const totalCount = records.length;
  const pendingCount = records.filter((r) => r.status === 'Pending Consultation').length;
  const scheduledCount = records.filter((r) => r.status === 'Consultation Scheduled').length;
  const approvedCount = records.filter((r) => r.status === 'Consultation Completed').length;
  const rejectedCount = records.filter((r) => r.status === 'Rejected').length;

  const serviceTypeOptions = useMemo(() => {
    const types = new Set<string>(['General Consultation']);
    records.forEach((r) => {
      if (r.serviceType) types.add(r.serviceType);
    });
    return ['All Service Types', ...Array.from(types)];
  }, [records]);

  const filteredList = useMemo(() => {
    return records.filter((rec) => {
      if (
        serviceTypeFilter !== 'All Service Types' &&
        rec.serviceType.toLowerCase() !== serviceTypeFilter.toLowerCase()
      ) {
        return false;
      }

      if (statusFilter !== 'All Statuses') {
        if (statusFilter === 'Pending Consultation' && rec.status !== 'Pending Consultation')
          return false;
        if (statusFilter === 'Consultation Scheduled' && rec.status !== 'Consultation Scheduled')
          return false;
        if (statusFilter === 'Consultation Completed' && rec.status !== 'Consultation Completed')
          return false;
        if (statusFilter === 'Rejected' && rec.status !== 'Rejected') return false;
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const refMatch = rec.referenceNo.toLowerCase().includes(q);
        const nameMatch = rec.applicantName.toLowerCase().includes(q);
        const serviceMatch = rec.serviceType.toLowerCase().includes(q);
        const symptomMatch = (rec.reasonSymptoms || '').toLowerCase().includes(q);
        return refMatch || nameMatch || serviceMatch || symptomMatch;
      }

      return true;
    });
  }, [records, serviceTypeFilter, statusFilter, searchQuery]);

  const handleOpenConsultModal = (rec: ConsultAppointmentRecord) => {
    setActiveRecord(rec);
    let initialDate = rec.preferredDate || getCurrentDateString();
    if (initialDate.includes(',')) {
      const parsed = new Date(initialDate);
      if (!isNaN(parsed.getTime())) {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const d = String(parsed.getDate()).padStart(2, '0');
        initialDate = `${y}-${m}-${d}`;
      }
    }
    setSchedDate(initialDate);
    setSchedTime(rec.appointmentTime || '09:30');
    setSchedNotes(rec.notes || '');
  };

  const handleUpdateConsult = async (newStatus: ConsultStatus) => {
    if (!activeRecord) return;

    const updatedRec: ConsultAppointmentRecord = {
      ...activeRecord,
      preferredDate: schedDate,
      appointmentTime: schedTime,
      status: newStatus,
      notes: schedNotes
    };

    setRecords((prev) =>
      prev.map((item) => (item.referenceNo === activeRecord.referenceNo ? updatedRec : item))
    );

    try {
      await fetch(
        `${API_BASE_URL}/api/consult-appointments/${encodeURIComponent(activeRecord.referenceNo)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preferred_date: schedDate,
            appointment_time: schedTime,
            status: newStatus,
            notes: schedNotes
          })
        }
      );
    } catch {}

    setActiveRecord(null);
  };

  return (
    <div className="space-y-6 pb-8 font-sans">
      {/* HEADER */}
      <div>
        <h2
          className={`text-xl font-extrabold tracking-tight ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}
        >
          Consult Appointments &amp; Case Scheduling
        </h2>
      </div>

      {/* 5 SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
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
            APPROVED / ISSUED
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
            placeholder="Search by name or reference number..."
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
              SERVICE TYPE
            </label>
            <div className="relative">
              <select
                value={serviceTypeFilter}
                onChange={(e) => setServiceTypeFilter(e.target.value)}
                className={`w-full appearance-none border rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer ${
                  darkMode
                    ? 'bg-[#0b1220] border-slate-700/80 text-slate-200'
                    : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                {serviceTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <ChevronDown
                className={`w-3.5 h-3.5 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
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
              STATUS
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
                <option value="Pending Consultation">Pending Consultation</option>
                <option value="Consultation Scheduled">Consultation Scheduled</option>
                <option value="Consultation Completed">Consultation Completed</option>
                <option value="Rejected">Rejected</option>
              </select>
              <ChevronDown
                className={`w-3.5 h-3.5 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
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
          className={`text-sm font-extrabold tracking-tight ${
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
                const dateFormatted = rec.preferredDate
                  ? formatDateDisplay(rec.preferredDate)
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
                          {rec.applicantName}
                        </h4>
                      </div>

                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${
                          rec.status === 'Rejected'
                            ? darkMode
                              ? 'bg-rose-950/60 text-rose-300 border-rose-800/40'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                            : rec.status === 'Consultation Completed'
                            ? darkMode
                              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : rec.status === 'Consultation Scheduled'
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
                          Service Type
                        </span>
                        <span className="font-semibold">{rec.serviceType}</span>
                      </div>

                      <div
                        className={`pt-1.5 border-t ${
                          darkMode ? 'border-slate-800/60' : 'border-slate-200'
                        }`}
                      >
                        <span
                          className={`text-[10px] uppercase tracking-wider block mb-0.5 ${
                            darkMode ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          Reason for Visit / Symptoms
                        </span>
                        <p className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                          {rec.reasonSymptoms || 'No symptoms specified'}
                        </p>
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
                          Preferred Date
                        </span>
                        {dateFormatted ? (
                          <span className="font-mono font-bold">
                            {dateFormatted} {timeFormatted ? `· ${timeFormatted}` : ''}
                          </span>
                        ) : (
                          <span className="text-amber-400 italic text-[11px]">
                            Pending Date
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-1">
                      {rec.status === 'Pending Consultation' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenConsultModal(rec)}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                        >
                          Schedule Consult
                        </button>
                      ) : rec.status === 'Consultation Scheduled' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenConsultModal(rec)}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            darkMode
                              ? 'bg-blue-950/50 hover:bg-blue-900/70 text-blue-300 border-blue-500/40'
                              : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300'
                          }`}
                        >
                          Manage Consult
                        </button>
                      ) : rec.status === 'Consultation Completed' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenConsultModal(rec)}
                          className={`w-full text-center font-extrabold text-xs py-2 rounded-xl border inline-flex items-center justify-center gap-1 cursor-pointer ${
                            darkMode
                              ? 'text-emerald-400 bg-emerald-950/60 border-emerald-700/40'
                              : 'text-emerald-800 bg-emerald-100 border-emerald-300'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approved</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenConsultModal(rec)}
                          className={`w-full text-center font-extrabold text-xs py-2 rounded-xl border cursor-pointer ${
                            darkMode
                              ? 'text-rose-300 bg-rose-950/60 border-rose-800/50'
                              : 'text-rose-800 bg-rose-100 border-rose-300'
                          }`}
                        >
                          Rejected
                        </button>
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
                      <th className="py-4 px-5 whitespace-nowrap">APPLICANT NAME</th>
                      <th className="py-4 px-5 whitespace-nowrap">SERVICE TYPE</th>
                      <th className="py-4 px-5 whitespace-nowrap">REASON FOR VISIT / SYMPTOMS</th>
                      <th className="py-4 px-5 whitespace-nowrap">PREFERRED DATE</th>
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
                      const dateFormatted = rec.preferredDate
                        ? formatDateDisplay(rec.preferredDate)
                        : '';
                      const timeFormatted = rec.appointmentTime
                        ? formatTo12Hour(rec.appointmentTime)
                        : '';

                      return (
                        <tr
                          key={rec.referenceNo}
                          className={`transition-colors ${
                            darkMode ? 'hover:bg-[#142036]' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-4 px-5 font-mono font-bold text-blue-400 whitespace-nowrap">
                            {rec.referenceNo}
                          </td>

                          <td className="py-4 px-5 whitespace-nowrap">
                            <div
                              className={`font-bold ${
                                darkMode ? 'text-white' : 'text-slate-900'
                              }`}
                            >
                              {rec.applicantName}
                            </div>
                          </td>

                          <td
                            className={`py-4 px-5 font-semibold whitespace-nowrap ${
                              darkMode ? 'text-slate-200' : 'text-slate-800'
                            }`}
                          >
                            {rec.serviceType}
                          </td>

                          <td
                            className={`py-4 px-5 max-w-[260px] ${
                              darkMode ? 'text-slate-300' : 'text-slate-700'
                            }`}
                          >
                            <div className="line-clamp-2 leading-relaxed">
                              {rec.reasonSymptoms || 'General consultation request'}
                            </div>
                          </td>

                          <td
                            className={`py-4 px-5 font-mono text-[11px] whitespace-nowrap ${
                              darkMode ? 'text-slate-200' : 'text-slate-800'
                            }`}
                          >
                            {dateFormatted ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 font-bold">
                                  <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                  <span>{dateFormatted}</span>
                                </div>
                                {timeFormatted && (
                                  <div
                                    className={`flex items-center gap-1.5 text-[10.5px] ${
                                      darkMode ? 'text-slate-400' : 'text-slate-500'
                                    }`}
                                  >
                                    <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                                    <span>{timeFormatted}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-amber-400/80 italic text-[11px]">
                                Pending Date
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
                                  : rec.status === 'Consultation Completed'
                                  ? darkMode
                                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : rec.status === 'Consultation Scheduled'
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
                            {rec.status === 'Pending Consultation' ? (
                              <button
                                type="button"
                                onClick={() => handleOpenConsultModal(rec)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                              >
                                Schedule Consult
                              </button>
                            ) : rec.status === 'Consultation Scheduled' ? (
                              <button
                                type="button"
                                onClick={() => handleOpenConsultModal(rec)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                  darkMode
                                    ? 'bg-blue-950/50 hover:bg-blue-900/70 text-blue-300 border-blue-500/40'
                                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300'
                                }`}
                              >
                                Manage Consult
                              </button>
                            ) : rec.status === 'Consultation Completed' ? (
                              <button
                                type="button"
                                onClick={() => handleOpenConsultModal(rec)}
                                className={`font-extrabold text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border cursor-pointer ${
                                  darkMode
                                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-700/40'
                                    : 'text-emerald-800 bg-emerald-100 border-emerald-300'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approved</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenConsultModal(rec)}
                                className={`font-extrabold text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border cursor-pointer ${
                                  darkMode
                                    ? 'text-rose-300 bg-rose-950/60 border-rose-800/50'
                                    : 'text-rose-800 bg-rose-100 border-rose-300'
                                }`}
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Rejected</span>
                              </button>
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
              No consultation appointments found
            </h4>
            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Try adjusting your search terms or status filters.
            </p>
          </div>
        )}
      </div>

      {/* SCHEDULE / MANAGE CONSULTATION MODAL */}
      {activeRecord &&
        createPortal(
          <div className="fixed inset-0 z-[99999] bg-[#030712]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div
              className={`border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 font-sans my-auto max-h-[92vh] flex flex-col ${
                darkMode
                  ? 'bg-[#0f172a] border-slate-700/80 text-white'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div
                className={`p-4 sm:p-5 border-b flex justify-between items-center shrink-0 ${
                  darkMode
                    ? 'border-slate-800 bg-[#131f37]'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-500 uppercase tracking-wider">
                    {activeRecord.referenceNo}
                  </span>
                  <h3
                    className={`text-sm sm:text-base font-extrabold mt-0.5 ${
                      darkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Manage Consultation Appointment
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveRecord(null)}
                  className={`p-1.5 rounded-lg cursor-pointer ${
                    darkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
                <div
                  className={`p-3.5 rounded-xl border flex justify-between items-center ${
                    darkMode
                      ? 'bg-slate-900/60 border-slate-800'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <span
                      className={`text-[10px] block font-semibold uppercase ${
                        darkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      APPLICANT NAME
                    </span>
                    <span
                      className={`font-extrabold text-sm ${
                        darkMode ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {activeRecord.applicantName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] block font-semibold uppercase ${
                        darkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      SERVICE TYPE
                    </span>
                    <span className="font-bold text-blue-500">
                      {activeRecord.serviceType}
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    className={`text-[10px] font-extrabold uppercase tracking-wider block mb-1 ${
                      darkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    Reason for Visit / Symptoms
                  </label>
                  <div
                    className={`w-full border rounded-xl p-3 text-xs leading-relaxed ${
                      darkMode
                        ? 'bg-[#0b1220] border-slate-800 text-slate-200'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    {activeRecord.reasonSymptoms || 'No symptoms specified'}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label
                      className={`text-[10px] font-extrabold uppercase tracking-wider block mb-1 ${
                        darkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      Preferred Consultation Date
                    </label>
                    <input
                      type="date"
                      value={schedDate}
                      onChange={(e) => setSchedDate(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                        darkMode
                          ? 'bg-[#0b1220] border-slate-700/80 text-white'
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`text-[10px] font-extrabold uppercase tracking-wider block mb-1 ${
                        darkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      Consultation Time
                    </label>
                    <input
                      type="time"
                      value={schedTime}
                      onChange={(e) => setSchedTime(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                        darkMode
                          ? 'bg-[#0b1220] border-slate-700/80 text-white'
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className={`text-[10px] font-extrabold uppercase tracking-wider block mb-1 ${
                      darkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    Admin Remarks / Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Add consultation instructions or assessment remarks..."
                    value={schedNotes}
                    onChange={(e) => setSchedNotes(e.target.value)}
                    className={`w-full border rounded-xl p-3 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                      darkMode
                        ? 'bg-[#0b1220] border-slate-700/80 text-white placeholder-slate-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div
                className={`p-4 border-t flex flex-wrap justify-between items-center gap-2 ${
                  darkMode
                    ? 'bg-[#0a1120] border-slate-800'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveRecord(null)}
                  className={`px-4 py-2 font-bold text-xs rounded-xl transition-colors cursor-pointer ${
                    darkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                >
                  Cancel
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateConsult('Rejected')}
                    className={`px-3.5 py-2 border font-bold text-xs rounded-xl transition-colors cursor-pointer ${
                      darkMode
                        ? 'bg-rose-950/70 hover:bg-rose-900 border-rose-700/60 text-rose-300'
                        : 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-700'
                    }`}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateConsult('Consultation Scheduled')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    Save Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateConsult('Consultation Completed')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    ✓ Approve / Complete
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
