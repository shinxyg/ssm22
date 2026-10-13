import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { API_BASE_URL } from '../config/api';
import { 
  Search, 
  Calendar, 
  ChevronDown, 
  Clock, 
  MapPin, 
  UserCheck, 
  Check, 
  X, 
  Printer, 
  Eye, 
  FileText, 
  Building2, 
  Pill,
  Send,
  Plus,
  ExternalLink
} from 'lucide-react';
import type { ApplicationRecord } from '../types';

interface AppointmentEntry {
  id?: number;
  referenceNo: string;
  moduleName: string;
  applicantName: string;
  appointmentDate: string;
  appointmentTime: string;
  venue: string;
  purpose: string;
  status: string;
  socialWorkerNotes?: string;
  serviceName?: string;
}

interface AdminAppointmentViewProps {
  darkMode?: boolean;
  applications?: ApplicationRecord[];
  onUpdateStatus?: (refNo: string, newStatus: ApplicationRecord['status'], extraFields?: Record<string, any>) => void;
}

export const AdminAppointmentView: React.FC<AdminAppointmentViewProps> = ({ 
  darkMode = true,
  applications = [],
  onUpdateStatus
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('All Modules');
  const [statusFilter, setStatusFilter] = useState<string>('All Statuses');

  // Appointments DB & State
  const [dbAppointments, setDbAppointments] = useState<AppointmentEntry[]>([]);
  const [schedulingApp, setSchedulingApp] = useState<ApplicationRecord | null>(null);
  const [assessmentApp, setAssessmentApp] = useState<ApplicationRecord | null>(null);
  const [printingGL, setPrintingGL] = useState<ApplicationRecord | null>(null);
  const [nowTick, setNowTick] = useState<number>(Date.now());

  // Timer tick to re-evaluate real-time schedule arrival every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 3000);
    return () => clearInterval(timer);
  }, []);

  // Helper to check if current date & time has reached or passed the appointment schedule
  const isScheduleTimeReached = (apptDate?: string, apptTime?: string) => {
    if (!apptDate) return true;
    try {
      let year: number, month: number, day: number;

      if (apptDate.includes('-')) {
        const parts = apptDate.split('-');
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else {
        const parsed = new Date(apptDate);
        if (isNaN(parsed.getTime())) return true;
        year = parsed.getFullYear();
        month = parsed.getMonth();
        day = parsed.getDate();
      }

      let hours = 0;
      let minutes = 0;

      if (apptTime) {
        const timeUpper = apptTime.toUpperCase().trim();
        const isPM = timeUpper.includes('PM');
        const isAM = timeUpper.includes('AM');
        const cleanTime = timeUpper.replace('AM', '').replace('PM', '').trim();
        const timeParts = cleanTime.split(':');
        
        if (timeParts.length >= 1) {
          hours = parseInt(timeParts[0], 10);
          if (isNaN(hours)) hours = 0;
        }
        if (timeParts.length >= 2) {
          minutes = parseInt(timeParts[1], 10);
          if (isNaN(minutes)) minutes = 0;
        }

        if (isPM && hours < 12) {
          hours += 12;
        } else if (isAM && hours === 12) {
          hours = 0;
        }
      }

      const targetDate = new Date(year, month, day, hours, minutes, 0, 0);
      if (isNaN(targetDate.getTime())) return true;

      return nowTick >= targetDate.getTime();
    } catch (e) {
      return true;
    }
  };

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
        return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
      }
    } catch (e) {
      return timeStr;
    }
    return timeStr;
  };

  const formatDateDisplay = (dateStr?: string): string => {
    if (!dateStr) return '';
    if (
      dateStr.includes(',') || 
      dateStr.includes('Jan') || dateStr.includes('Feb') || dateStr.includes('Mar') || 
      dateStr.includes('Apr') || dateStr.includes('May') || dateStr.includes('Jun') || 
      dateStr.includes('Jul') || dateStr.includes('Aug') || dateStr.includes('Sep') || 
      dateStr.includes('Oct') || dateStr.includes('Nov') || dateStr.includes('Dec')
    ) {
      return dateStr;
    }
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
      }
    } catch (e) {}
    return dateStr;
  };

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

  // Form state for scheduling modal
  const [schedDate, setSchedDate] = useState<string>(getCurrentDateString());
  const [schedTime, setSchedTime] = useState<string>(getCurrentTimeString());
  const [schedVenue] = useState<string>('SSDD Medical Assistance Desk, QC Hall');
  const [schedNotes] = useState<string>('Please bring original Statement of Account (SOA) and valid ID.');

  useEffect(() => {
    if (schedulingApp) {
      setSchedDate(getCurrentDateString());
      setSchedTime(getCurrentTimeString());
    }
  }, [schedulingApp]);

  // Fetch appointments from PostgreSQL Backend API on mount & interval
  const fetchAppointments = () => {
    fetch(`${API_BASE_URL}/api/appointments`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped: AppointmentEntry[] = data.map((item: any) => ({
            id: item.id,
            referenceNo: item.reference_no,
            moduleName: item.module_name,
            applicantName: item.applicant_name,
            appointmentDate: item.appointment_date,
            appointmentTime: item.appointment_time,
            venue: item.venue,
            purpose: item.purpose,
            status: item.status || 'Interview Scheduled',
            socialWorkerNotes: item.social_worker_notes
          }));
          setDbAppointments(mapped);
        }
      })
      .catch((err) => console.log('Notice: Backend API offline or fetching from local state', err));
  };

  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 3000);
    return () => clearInterval(interval);
  }, []);

  // Merge Applications from prop with DB appointments (exclude pending & rejected/disapproved apps)
  const combinedList = useMemo(() => {
    const approvedApps = applications.filter((app) => {
      const st = (app.status || '').toUpperCase();
      const isRejected = 
        st === 'REJECTED' || 
        st === 'DISAPPROVED' || 
        st === 'DISQUALIFIED' || 
        st.includes('REJECT') || 
        st.includes('DISAPPROV') || 
        st.includes('DISQUALIF');

      const isPendingDoc = 
        st.includes('PENDING DOCUMENT') ||
        st.includes('PENDING REVIEW') ||
        st.includes('PENDING VALIDATION') ||
        st.includes('UNDER REVIEW') ||
        st === 'PENDING' ||
        st === 'SUBMITTED' ||
        st === 'FOR VALIDATION';

      return !isPendingDoc && !isRejected;
    });

    const merged: (ApplicationRecord & { appointmentDetails?: AppointmentEntry })[] = approvedApps.map((app) => {
      const dbAppt = dbAppointments.find((a) => a.referenceNo === app.referenceNo);
      return {
        ...app,
        appointmentDetails: dbAppt
      };
    });

    // Also include any appointments from PostgreSQL database table that are not yet in merged array
    dbAppointments.forEach((appt) => {
      if (!merged.some(m => m.referenceNo === appt.referenceNo)) {
        merged.push({
          referenceNo: appt.referenceNo,
          applicantName: appt.applicantName,
          serviceName: appt.purpose || 'Livelihood & Enterprise Assistance Program',
          category: (appt.moduleName || 'LIVELIHOOD').toLowerCase(),
          assistanceType: appt.purpose || 'Livelihood Assessment',
          status: 'APPROVED BY ADMIN',
          dateSubmitted: 'Recent',
          amountOrType: 'Livelihood Assistance',
          assignedSocialWorker: 'Livelihood Social Worker Officer, RSW',
          appointmentDetails: appt
        });
      }
    });

    return merged;
  }, [applications, dbAppointments]);

  // Helper to check if application is approved by OSCA, payout-ready, or released/completed (excluding initial 'APPROVED BY ADMIN' which requires interview schedule)
  const isAppApproved = (status?: string) => {
    if (!status) return false;
    const s = status.toUpperCase();
    if (s === 'APPROVED BY ADMIN') return false;
    return s.includes('APPROVED BY OSCA') || s.includes('READY FOR PAYOUT') || s.includes('PAYOUT') || s.includes('RELEASED') || s.includes('COMPLETED') || s.includes('QUALIFIED') || s.includes('ENROLLED') || s === 'APPROVED';
  };

  const isAppRejected = (a: any) => {
    const st = (a.status || '').toUpperCase();
    const apptSt = (a.appointmentDetails?.status || '').toUpperCase();
    return st.includes('REJECT') || st.includes('DISQUALIF') || st.includes('DISAPPROV') || apptSt.includes('REJECT');
  };

  // Metrics Counters
  const totalCount = combinedList.length;
  const approvedCount = combinedList.filter((a) => isAppApproved(a.status) || isAppApproved(a.appointmentDetails?.status)).length;
  const rejectedCount = combinedList.filter((a) => isAppRejected(a)).length;

  const scheduledCount = combinedList.filter((a) => {
    if (isAppApproved(a.status) || isAppApproved(a.appointmentDetails?.status) || isAppRejected(a)) return false;
    const apptStatus = a.appointmentDetails?.status;
    const mainStatus = (a.status || '').toUpperCase();
    return apptStatus === 'Interview Scheduled' || apptStatus === 'Orientation Scheduled' || apptStatus === 'TRAINING SCHEDULED / ORIENTATION APPOINTED' || mainStatus.includes('SCHEDULED');
  }).length;

  const pendingSchedCount = combinedList.filter((a) => {
    if (isAppApproved(a.status) || isAppApproved(a.appointmentDetails?.status) || isAppRejected(a)) return false;
    const apptStatus = a.appointmentDetails?.status;
    const mainStatus = (a.status || '').toUpperCase();
    if (mainStatus.includes('SCHEDULED') || apptStatus === 'Interview Scheduled' || apptStatus === 'Orientation Scheduled') return false;
    return !a.appointmentDetails || apptStatus === 'Pending Schedule';
  }).length;

  // Filtered List
  const filteredList = useMemo(() => {
    return combinedList.filter((app) => {
      // Module Filter
      if (moduleFilter !== 'All Modules') {
        const cat = (app.category || '').toLowerCase();
        const serv = (app.serviceName || '').toLowerCase();
        const mod = moduleFilter.toLowerCase();

        if (mod.includes('aics') && !(cat.includes('aics') || serv.includes('aics') || serv.includes('medical') || serv.includes('funeral'))) return false;
        if (mod.includes('pwd') && !(cat.includes('pwd') || serv.includes('pwd'))) return false;
        if (mod.includes('senior') && !(cat.includes('senior') || serv.includes('senior'))) return false;
        if (mod.includes('solo parent') && !(cat.includes('solo') || serv.includes('solo'))) return false;
        if (mod.includes('livelihood') && !(cat.includes('livelihood') || serv.includes('livelihood'))) return false;
      }

      // Status Filter
      if (statusFilter !== 'All Statuses') {
        const st = statusFilter.toLowerCase();
        const isApproved = isAppApproved(app.status) || isAppApproved(app.appointmentDetails?.status);
        const isRejected = isAppRejected(app);
        const isScheduled = !isApproved && !isRejected && (app.appointmentDetails?.status === 'Interview Scheduled' || app.appointmentDetails?.status === 'Orientation Scheduled' || (app.status || '').toUpperCase().includes('SCHEDULED'));
        const isPending = !isApproved && !isRejected && !isScheduled;

        if (st.includes('pending') && !isPending) return false;
        if (st.includes('scheduled') && !isScheduled) return false;
        if (st.includes('approved') && !isApproved) return false;
      }

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
  }, [combinedList, moduleFilter, statusFilter, searchQuery]);

  // Open Schedule Modal with default prefilled exact real time and date
  const handleOpenScheduleModal = (app: ApplicationRecord) => {
    setSchedulingApp(app);
    const existingDate = (app as any).orientation_date || (app as any).orientationDate || app.appointmentDate || (app as any).appointment_date || app.appointmentDetails?.appointmentDate || '';
    const existingTime = (app as any).orientation_time || (app as any).orientationTime || app.appointmentTime || (app as any).appointment_time || app.appointmentDetails?.appointmentTime || '';

    if (existingDate && existingDate.includes('-')) {
      setSchedDate(existingDate);
    } else {
      setSchedDate(getCurrentDateString());
    }

    if (existingTime) {
      setSchedTime(existingTime.includes('AM') || existingTime.includes('PM') ? '09:00' : existingTime);
    } else {
      setSchedTime(getCurrentTimeString());
    }
  };

  // Save Schedule to PostgreSQL DB & Update Application Status to 'Interview Scheduled'
  const handleSaveSchedule = async () => {
    if (!schedulingApp) return;

    const isTrn = (schedulingApp.referenceNo || '').startsWith('TRN-') || schedulingApp.category === 'training' || (schedulingApp.serviceName || '').toLowerCase().includes('training') || (schedulingApp.serviceName || '').toLowerCase().includes('barista') || (schedulingApp.serviceName || '').toLowerCase().includes('hairdressing');

    const targetStatus = isTrn ? 'TRAINING SCHEDULED / ORIENTATION APPOINTED' : 'Interview Scheduled';
    const targetVenue = isTrn ? 'Quezon City Skills Development Center' : schedVenue;
    const targetPurpose = isTrn ? 'Skills Training Orientation & Initial Screening' : 'Verification & Social Worker Intake';

    const newAppt: AppointmentEntry = {
      referenceNo: schedulingApp.referenceNo,
      moduleName: isTrn ? 'TRAINING' : (schedulingApp.category || 'AICS'),
      applicantName: (schedulingApp as any).applicantName || schedulingApp.details?.applicantName || 'Applicant Name',
      appointmentDate: schedDate,
      appointmentTime: schedTime,
      venue: targetVenue,
      purpose: targetPurpose,
      status: isTrn ? ('Orientation Scheduled' as any) : 'Interview Scheduled',
      socialWorkerNotes: schedNotes
    };

    try {
      await fetch(`${API_BASE_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceNo: newAppt.referenceNo,
          moduleName: newAppt.moduleName,
          applicantName: newAppt.applicantName,
          appointmentDate: newAppt.appointmentDate,
          appointmentTime: newAppt.appointmentTime,
          venue: newAppt.venue,
          purpose: newAppt.purpose,
          socialWorkerNotes: newAppt.socialWorkerNotes
        })
      });
    } catch (e) {
      console.log('Saved to state (offline backend)');
    }

    setDbAppointments((prev) => [newAppt, ...prev.filter((a) => a.referenceNo !== newAppt.referenceNo)]);
    if (onUpdateStatus) {
      onUpdateStatus(schedulingApp.referenceNo, targetStatus as any, {
        appointmentDate: schedDate,
        appointmentTime: schedTime,
        orientationDate: schedDate,
        orientationTime: schedTime,
        orientationVenue: targetVenue,
        appointmentDetails: {
          appointmentDate: schedDate,
          appointmentTime: schedTime,
          venue: targetVenue,
          notes: schedNotes
        }
      });
    }
    setSchedulingApp(null);
  };

  return (
    <div className={`space-y-6 select-none font-['Plus_Jakarta_Sans',sans-serif] ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      <div>
        <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Appointments & Case Scheduling
        </h1>
      </div>

      {/* METRICS CARDS (Responsive 2-col on mobile, 5-col on desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
        <div className={`border rounded-2xl p-3 sm:p-4 shadow-lg ${darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90'}`}>
          <span className={`text-[10px] font-bold tracking-wider uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>TOTAL REQUESTS</span>
          <div className={`text-xl sm:text-2xl font-extrabold tracking-tight mt-1 sm:mt-1.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{totalCount}</div>
        </div>
        <div className={`border rounded-2xl p-3 sm:p-4 shadow-lg ${darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90'}`}>
          <span className={`text-[10px] font-bold tracking-wider uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>PENDING SCHEDULE</span>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-400 tracking-tight mt-1 sm:mt-1.5">{pendingSchedCount}</div>
        </div>
        <div className={`border rounded-2xl p-3 sm:p-4 shadow-lg ${darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90'}`}>
          <span className={`text-[10px] font-bold tracking-wider uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>SCHEDULED</span>
          <div className="text-xl sm:text-2xl font-extrabold text-blue-400 tracking-tight mt-1 sm:mt-1.5">{scheduledCount}</div>
        </div>
        <div className={`border rounded-2xl p-3 sm:p-4 shadow-lg ${darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90'}`}>
          <span className={`text-[10px] font-bold tracking-wider uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>APPROVED / ISSUED</span>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 tracking-tight mt-1 sm:mt-1.5">{approvedCount}</div>
        </div>
        <div className={`border rounded-2xl p-3 sm:p-4 shadow-lg col-span-2 sm:col-span-1 ${darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90'}`}>
          <span className={`text-[10px] font-bold tracking-wider uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>REJECTED</span>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-400 tracking-tight mt-1 sm:mt-1.5">{rejectedCount}</div>
        </div>
      </div>

      {/* FILTERS */}
      <div className={`border rounded-2xl p-5 space-y-4 shadow-xl ${darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90'}`}>
        <div className="relative w-full">
          <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
          <input
            type="text"
            placeholder="Search by name or reference number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
              darkMode ? 'bg-[#0b1220] border-slate-700/80 text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className={`text-[10px] font-extrabold tracking-wider uppercase block mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Module</label>
            <div className="relative">
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className={`w-full appearance-none border rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer ${
                  darkMode ? 'bg-[#0b1220] border-slate-700/80 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <option value="All Modules">All Modules</option>
                <option value="AICS">AICS (Medical / Funeral)</option>
                <option value="PWD">PWD Welfare</option>
                <option value="Senior Citizen">Senior Citizen</option>
                <option value="Solo Parent">Solo Parent</option>
                <option value="Livelihood Program">Livelihood Program</option>
              </select>
              <ChevronDown className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
            </div>
          </div>

          <div>
            <label className={`text-[10px] font-extrabold tracking-wider uppercase block mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Status</label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`w-full appearance-none border rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer ${
                  darkMode ? 'bg-[#0b1220] border-slate-700/80 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <option value="All Statuses">All Statuses</option>
                <option value="Pending">Pending Schedule</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Approved">Approved & GL Issued</option>
              </select>
              <ChevronDown className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* APPOINTMENTS TABLE */}
      <div className="space-y-3">
        <h3 className={`text-sm font-bold tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Appointments Registry <span className={`font-mono text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>({filteredList.length})</span>
        </h3>

        {filteredList.length > 0 ? (
          <div>
            {/* Mobile Appointment Cards View: Distinct floating cards with clean margins (md:hidden) */}
            <div className="md:hidden space-y-3.5">
              {filteredList.map((app) => {
                const name = (app as any).applicantName || app.details?.applicantName || 'Juan Dela Cruz';
                const appt = app.appointmentDetails;

                const isTrn = (app.referenceNo || '').startsWith('TRN-') || app.category === 'training' || (app.serviceName || '').toLowerCase().includes('training') || (app.serviceName || '').toLowerCase().includes('barista') || (app.serviceName || '').toLowerCase().includes('hairdressing') || (app.serviceName || '').toLowerCase().includes('pastry');
                const isCwProtection = (app.referenceNo || '').startsWith('QC-CW-') || (app.referenceNo || '').startsWith('CW-PROT-') || (app.serviceName || '').toLowerCase() === 'child welfare services' || (app.serviceName || '').toLowerCase().includes('child protection');

                const rawDate = isTrn 
                  ? ((app as any).orientation_date || (app as any).orientationDate || app.appointmentDate || (app as any).appointment_date || appt?.appointmentDate || '')
                  : (appt?.appointmentDate || (app as any).appointmentDate || (app as any).appointment_date || (app as any).scheduledPayoutDate || (app as any).payout_date || '');

                const rawTime = isTrn 
                  ? ((app as any).orientation_time || (app as any).orientationTime || app.appointmentTime || (app as any).appointment_time || appt?.appointmentTime || '')
                  : (appt?.appointmentTime || (app as any).appointmentTime || (app as any).appointment_time || (app as any).scheduledPayoutTime || (app as any).payout_time || '');

                const schedDate = rawDate ? formatDateDisplay(rawDate) : '';
                const schedTime = rawTime ? formatTo12Hour(rawTime) : '';

                const isAppFinalApproved = isAppApproved(app.status) || isAppApproved(appt?.status);
                const isScheduled = Boolean(
                  schedDate && 
                  schedDate !== 'Awaiting Schedule' && 
                  appt?.status !== 'Pending Schedule' && 
                  ((app.status || '').toUpperCase().includes('SCHEDULED') || appt?.status === 'Interview Scheduled' || appt?.status === 'Orientation Scheduled' || isAppFinalApproved)
                );
                const isGLPrintable = (app.serviceName.toLowerCase().includes('medical bill') || app.serviceName.toLowerCase().includes('hospital') || app.assistanceType?.toLowerCase().includes('medical bill') || app.serviceName.toLowerCase().includes('funeral') || app.serviceName.toLowerCase().includes('burial') || app.referenceNo.includes('FUN')) && !app.serviceName.toLowerCase().includes('medicine') && !(app.assistanceType || '').toLowerCase().includes('medicine');

                return (
                  <div 
                    key={app.referenceNo} 
                    className={`p-4 space-y-3 rounded-2xl border shadow-lg transition-all ${
                      darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    {/* Top Row: Ref No + Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-xs text-blue-400 block">
                          {app.referenceNo}
                        </span>
                        <h4 className={`text-sm font-extrabold mt-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {name}
                        </h4>
                      </div>

                      {/* Status Badge */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${
                        app.status === 'Rejected'
                          ? 'bg-rose-950/60 text-rose-300 border-rose-800/40'
                          : app.status === 'Referred to Partner Agency' || app.status === 'Referred'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800/40'
                          : isAppFinalApproved
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                          : isScheduled
                          ? 'bg-blue-950/60 text-blue-400 border-blue-500/30'
                          : 'bg-amber-950/60 text-amber-400 border-amber-500/30'
                      }`}>
                        {app.status === 'Rejected'
                          ? 'Rejected'
                          : app.status === 'Referred to Partner Agency' || app.status === 'Referred'
                          ? 'Referred'
                          : isAppFinalApproved
                          ? (isCwProtection ? 'Approved' : isTrn ? 'Enrolled' : 'Approved')
                          : isScheduled
                          ? (isTrn ? 'Orientation Set' : 'Interview Set')
                          : 'Pending Schedule'}
                      </span>
                    </div>

                    {/* Middle Info: Program & Schedule Details */}
                    <div className="bg-[#0b1220] p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-300 font-semibold">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500">Service</span>
                        <span className="text-right truncate max-w-[200px]">
                          {(app.referenceNo || '').startsWith('QC-CW') ? 'Child Welfare Services' : app.serviceName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500">Schedule</span>
                        {isScheduled ? (
                          <div className="text-right space-y-0.5">
                            <div className="flex items-center gap-1 font-bold text-slate-200 justify-end">
                              <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              <span>{schedDate}</span>
                            </div>
                            {schedTime && (
                              <div className="flex items-center gap-1 text-slate-400 text-[10px] justify-end">
                                <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                                <span>{formatTo12Hour(schedTime)}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-amber-400/90 italic text-[11px]">Pending Schedule</span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Buttons: Full Width on Mobile */}
                    <div className="pt-1">
                      {app.status === 'Rejected' ? (
                        <div className="w-full text-center text-rose-300 font-extrabold text-xs py-2 bg-rose-950/60 border border-rose-800/50 rounded-xl">
                          Rejected
                        </div>
                      ) : app.status === 'Referred to Partner Agency' || app.status === 'Referred' ? (
                        <div className="w-full text-center text-amber-300 font-extrabold text-xs py-2 bg-amber-950/60 border border-amber-800/50 rounded-xl">
                          Referred to Partner Agency
                        </div>
                      ) : isAppFinalApproved ? (
                        <div className="flex items-center gap-2">
                          <span className="flex-1 text-center text-emerald-400 font-extrabold text-xs py-2 bg-emerald-950/60 border border-emerald-700/40 rounded-xl inline-flex items-center justify-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Approved</span>
                          </span>
                          {isGLPrintable && (
                            <button
                              type="button"
                              onClick={() => setPrintingGL(app)}
                              className="px-4 py-2 bg-blue-950/80 hover:bg-blue-900 text-blue-300 rounded-xl text-xs font-bold border border-blue-800 transition-colors inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5 text-blue-400" />
                              <span>Print GL</span>
                            </button>
                          )}
                        </div>
                      ) : !isScheduled ? (
                        <button
                          type="button"
                          onClick={() => handleOpenScheduleModal(app)}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all text-center cursor-pointer"
                        >
                          Set Schedule
                        </button>
                      ) : (
                        <>
                          {isScheduleTimeReached(schedDate, schedTime) ? (
                            <button
                              type="button"
                              onClick={() => setAssessmentApp(app)}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all animate-pulse text-center cursor-pointer"
                            >
                              Conduct Assessment
                            </button>
                          ) : (
                            <div className="w-full text-center text-[11px] text-amber-300/90 font-mono font-semibold py-2 bg-amber-950/40 rounded-xl border border-amber-800/40 flex items-center justify-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span>Awaiting Schedule Time</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Data Table (Visible ONLY on desktop md:block) */}
            <div className={`hidden md:block border rounded-2xl overflow-hidden shadow-xl ${darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[11px] font-extrabold uppercase tracking-wider ${
                    darkMode ? 'border-slate-800/80 bg-[#121c2e] text-slate-400' : 'border-slate-200 bg-slate-100 text-slate-600'
                  }`}>
                    <th className="py-4 px-6">REFERENCE NO.</th>
                    <th className="py-4 px-6">APPLICANT NAME</th>
                    <th className="py-4 px-6">MODULE / SERVICE</th>
                    <th className="py-4 px-6">SCHEDULE DATE & TIME</th>
                    <th className="py-4 px-6">STATUS</th>
                    <th className="py-4 px-6 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-xs font-medium ${darkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                  {filteredList.map((app) => {
                    const name = (app as any).applicantName || app.details?.applicantName || 'Juan Dela Cruz';
                    const appt = app.appointmentDetails;

                    const isTrn = (app.referenceNo || '').startsWith('TRN-') || app.category === 'training' || (app.serviceName || '').toLowerCase().includes('training') || (app.serviceName || '').toLowerCase().includes('barista') || (app.serviceName || '').toLowerCase().includes('hairdressing') || (app.serviceName || '').toLowerCase().includes('pastry');
                    const isCwProtection = (app.referenceNo || '').startsWith('QC-CW-') || (app.referenceNo || '').startsWith('CW-PROT-') || (app.serviceName || '').toLowerCase() === 'child welfare services' || (app.serviceName || '').toLowerCase().includes('child protection');

                    const rawDate = isTrn 
                      ? ((app as any).orientation_date || (app as any).orientationDate || app.appointmentDate || (app as any).appointment_date || appt?.appointmentDate || '')
                      : (appt?.appointmentDate || (app as any).appointmentDate || (app as any).appointment_date || (app as any).scheduledPayoutDate || (app as any).payout_date || '');

                    const rawTime = isTrn 
                      ? ((app as any).orientation_time || (app as any).orientationTime || app.appointmentTime || (app as any).appointment_time || appt?.appointmentTime || '')
                      : (appt?.appointmentTime || (app as any).appointmentTime || (app as any).appointment_time || (app as any).scheduledPayoutTime || (app as any).payout_time || '');

                    const schedDate = rawDate ? formatDateDisplay(rawDate) : '';
                    const schedTime = rawTime ? formatTo12Hour(rawTime) : '';

                    const isAppFinalApproved = isAppApproved(app.status) || isAppApproved(appt?.status);
                    const isScheduled = Boolean(
                      schedDate && 
                      schedDate !== 'Awaiting Schedule' && 
                      appt?.status !== 'Pending Schedule' && 
                      ((app.status || '').toUpperCase().includes('SCHEDULED') || appt?.status === 'Interview Scheduled' || appt?.status === 'Orientation Scheduled' || isAppFinalApproved)
                    );
                    const isGLPrintable = (app.serviceName.toLowerCase().includes('medical bill') || app.serviceName.toLowerCase().includes('hospital') || app.assistanceType?.toLowerCase().includes('medical bill') || app.serviceName.toLowerCase().includes('funeral') || app.serviceName.toLowerCase().includes('burial') || app.referenceNo.includes('FUN')) && !app.serviceName.toLowerCase().includes('medicine') && !(app.assistanceType || '').toLowerCase().includes('medicine');

                    return (
                      <tr key={app.referenceNo} className={`transition-colors ${
                        darkMode ? 'hover:bg-[#142036]' : 'hover:bg-slate-50'
                      }`}>
                        <td className="py-4 px-6 font-mono font-bold text-blue-400">{app.referenceNo}</td>
                        <td className={`py-4 px-6 font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{name}</td>
                        <td className={`py-4 px-6 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          <span className="font-semibold">
                            {(app.referenceNo || '').startsWith('QC-CW') 
                              ? 'Child Welfare Services' 
                              : app.serviceName}
                          </span>
                        </td>
                        <td className={`py-4 px-6 font-mono text-[11px] ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          {isScheduled ? (
                            <div className="space-y-0.5">
                              <div className={`flex items-center gap-1 font-bold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                <span>{schedDate}</span>
                              </div>
                              {schedTime && (
                                <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  <span>{formatTo12Hour(schedTime)}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-amber-400/80 italic text-[11px]">Pending Schedule</span>
                          )}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold border whitespace-nowrap ${
                            app.status === 'Rejected'
                              ? 'bg-rose-950/60 text-rose-300 border-rose-800/40'
                              : app.status === 'Referred to Partner Agency' || app.status === 'Referred'
                              ? 'bg-amber-950/60 text-amber-300 border-amber-800/40'
                              : isAppApproved(app.status) || isAppApproved(appt?.status)
                              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                              : isScheduled
                              ? 'bg-blue-950/60 text-blue-400 border-blue-500/30'
                              : 'bg-amber-950/60 text-amber-400 border-amber-500/30'
                          }`}>
                            <span>
                              {app.status === 'Rejected'
                                ? 'Rejected'
                                : app.status === 'Referred to Partner Agency' || app.status === 'Referred'
                                ? 'Referred to Partner Agency'
                                : isAppApproved(app.status) || isAppApproved(appt?.status)
                                ? (app.status === 'RELEASED / COMPLETED' || app.status === 'RELEASED & ARCHIVED' || app.status === 'APPROVED / COMPLETED' || (app.status as string) === 'Completed' ? (isCwProtection ? 'Approved / Completed' : 'Released & Archived') : isTrn ? 'Qualified / Enrolled' : isCwProtection ? 'Approved / Completed' : 'Approved & Ready for Payout')
                                : isScheduled
                                ? (isTrn ? 'Orientation Scheduled' : 'Interview Scheduled')
                                : 'Pending Schedule'}
                            </span>
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          {app.status === 'Rejected' ? (
                            <span className="text-rose-300 font-extrabold text-xs inline-flex items-center gap-1 bg-rose-950/60 border border-rose-800/50 px-3 py-1.5 rounded-xl whitespace-nowrap">
                              <X className="w-3.5 h-3.5 text-rose-400" />
                              <span>Rejected</span>
                            </span>
                          ) : app.status === 'Referred to Partner Agency' || app.status === 'Referred' ? (
                            <span className="text-amber-300 font-extrabold text-xs inline-flex items-center gap-1 bg-amber-950/60 border border-amber-800/50 px-3 py-1.5 rounded-xl whitespace-nowrap">
                              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                              <span>Referred to Partner Agency</span>
                            </span>
                          ) : isAppApproved(app.status) || isAppApproved(appt?.status) ? (
                            <div className="inline-flex items-center justify-end gap-2 whitespace-nowrap">
                              <span className="text-emerald-400 font-extrabold text-xs inline-flex items-center gap-1 bg-emerald-950/60 border border-emerald-700/40 px-3 py-1.5 rounded-xl whitespace-nowrap">
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Approved</span>
                              </span>
                              {isGLPrintable && (
                                <button
                                  type="button"
                                  onClick={() => setPrintingGL(app)}
                                  className="px-3 py-1.5 bg-blue-950/80 hover:bg-blue-900 text-blue-300 rounded-xl text-xs font-bold border border-blue-800 transition-colors inline-flex items-center gap-1 shadow-md whitespace-nowrap"
                                  title="Print Official Guarantee Letter"
                                >
                                  <Printer className="w-3.5 h-3.5 text-blue-400" />
                                  <span>Print GL</span>
                                </button>
                              )}
                            </div>
                          ) : !isScheduled ? (
                            <button
                              type="button"
                              onClick={() => handleOpenScheduleModal(app)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all whitespace-nowrap"
                            >
                              Set Schedule
                            </button>
                          ) : (
                            <>
                              {isScheduleTimeReached(schedDate, schedTime) ? (
                                <button
                                  type="button"
                                  onClick={() => setAssessmentApp(app)}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all animate-pulse whitespace-nowrap"
                                >
                                  <span>Conduct Assessment</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-amber-300/90 font-mono font-semibold px-2.5 py-1 bg-amber-950/40 rounded-lg border border-amber-800/40 inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  <span>Awaiting Schedule Time</span>
                                </span>
                              )}
                            </>
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
          <div className="bg-[#0e1726] border border-slate-800/90 rounded-2xl p-16 text-center shadow-xl flex flex-col items-center justify-center">
            <div className="p-3.5 rounded-2xl bg-[#121c2e] border border-slate-800 text-slate-400 mb-3">
              <Calendar className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h4 className="text-base font-extrabold text-white">No appointments found</h4>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms or module filters.</p>
          </div>
        )}
      </div>

      {/* SCHEDULING MODAL */}
      {schedulingApp && createPortal(
        <div className="fixed inset-0 z-[99999] bg-[#030712]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 font-sans my-auto max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-[#131f37] shrink-0">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider">{schedulingApp.referenceNo}</span>
                <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                  {((schedulingApp as any)?.category === 'training' || schedulingApp.referenceNo.startsWith('TRN') || schedulingApp.serviceName.toLowerCase().includes('training') || schedulingApp.serviceName.toLowerCase().includes('pastry') || schedulingApp.serviceName.toLowerCase().includes('welding') || schedulingApp.serviceName.toLowerCase().includes('barista')) ? 'Schedule Training Orientation' : 'Set Appointment Schedule'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSchedulingApp(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">APPLICANT</span>
                  <span className="font-extrabold text-white text-sm">{(schedulingApp as any).applicantName || schedulingApp.details?.applicantName || 'Juan Dela Cruz'}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">MODULE</span>
                  <span className="font-bold text-blue-400">{schedulingApp.serviceName}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider block mb-1">
                    {((schedulingApp as any)?.category === 'training' || schedulingApp.referenceNo.startsWith('TRN') || schedulingApp.serviceName.toLowerCase().includes('training') || schedulingApp.serviceName.toLowerCase().includes('pastry') || schedulingApp.serviceName.toLowerCase().includes('welding') || schedulingApp.serviceName.toLowerCase().includes('barista')) ? 'Orientation Date' : 'Appointment Date'}
                  </label>
                  <input
                    type="date"
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className="w-full bg-[#0b1220] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider block mb-1">Time Slot (Real Clock)</label>
                  <input
                    type="time"
                    value={schedTime}
                    onChange={(e) => setSchedTime(e.target.value)}
                    className="w-full bg-[#0b1220] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider block mb-1">Venue / Office Desk</label>
                <input
                  type="text"
                  value={
                    ((schedulingApp as any)?.category === 'training' || schedulingApp.referenceNo.startsWith('TRN') || schedulingApp.serviceName.toLowerCase().includes('training') || schedulingApp.serviceName.toLowerCase().includes('pastry') || schedulingApp.serviceName.toLowerCase().includes('welding') || schedulingApp.serviceName.toLowerCase().includes('barista'))
                      ? 'Quezon City Skills Development Center, Kamuning Rd, QC'
                      : ((schedulingApp as any)?.category === 'soloparent' || schedulingApp.referenceNo.startsWith('SP') || schedulingApp.serviceName.toLowerCase().includes('solo'))
                      ? 'QC Hall SSDD Solo Parent Welfare Desk'
                      : ((schedulingApp as any)?.category === 'livelihood' || schedulingApp.referenceNo.startsWith('LVH') || schedulingApp.serviceName.toLowerCase().includes('livelihood'))
                      ? 'QC Hall SSDD Livelihood Division, Desk 2'
                      : 'SSDD Medical Assistance Desk, QC Hall'
                  }
                  disabled
                  readOnly
                  className="w-full bg-[#0b1220]/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 cursor-not-allowed select-none opacity-80"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider block mb-1">Instructions for Applicant</label>
                <textarea
                  rows={2}
                  value={
                    ((schedulingApp as any)?.category === 'training' || schedulingApp.referenceNo.startsWith('TRN') || schedulingApp.serviceName.toLowerCase().includes('training') || schedulingApp.serviceName.toLowerCase().includes('pastry') || schedulingApp.serviceName.toLowerCase().includes('welding') || schedulingApp.serviceName.toLowerCase().includes('barista'))
                      ? 'Please bring original Request Letter, QC ID/Proof of Residency, Barangay Indigency, and printed Orientation Slip.'
                      : ((schedulingApp as any)?.category === 'soloparent' || schedulingApp.referenceNo.startsWith('SP') || schedulingApp.serviceName.toLowerCase().includes('solo'))
                      ? 'Please bring original Solo Parent Booklet / ID, Affidavit, and valid Photo ID.'
                      : ((schedulingApp as any)?.category === 'livelihood' || schedulingApp.referenceNo.startsWith('LVH') || schedulingApp.serviceName.toLowerCase().includes('livelihood'))
                      ? 'Please bring valid Photo ID, Business Plan / Project Proposal, and Barangay Clearance.'
                      : 'Please bring original Statement of Account (SOA) and valid ID.'
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
                onClick={() => setSchedulingApp(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-colors"
              >
                Save Schedule & Send SMS
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* SOCIAL WORKER PHYSICAL ASSESSMENT & DECISION MODAL */}
      {assessmentApp && createPortal(
        <div className="fixed inset-0 z-[99999] bg-[#030712]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 font-sans my-auto max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-[#131f37] shrink-0">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">{assessmentApp.referenceNo}</span>
                <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                  {((assessmentApp as any)?.category === 'training' || assessmentApp.referenceNo.startsWith('TRN') || assessmentApp.serviceName.toLowerCase().includes('training') || assessmentApp.serviceName.toLowerCase().includes('pastry') || assessmentApp.serviceName.toLowerCase().includes('welding') || assessmentApp.serviceName.toLowerCase().includes('barista'))
                    ? 'Vocational Training Assessment & Enrollment'
                    : ((assessmentApp as any)?.category === 'soloparent' || assessmentApp.referenceNo.startsWith('SP') || assessmentApp.serviceName.toLowerCase().includes('solo'))
                    ? 'Solo Parent Physical Intake & Decision'
                    : ((assessmentApp as any)?.category === 'livelihood' || assessmentApp.referenceNo.startsWith('LVH') || assessmentApp.serviceName.toLowerCase().includes('livelihood'))
                    ? 'Livelihood Assessment & Decision'
                    : 'Social Worker Physical Assessment & Decision'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssessmentApp(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">APPLICANT NAME</span>
                  <span className="font-extrabold text-white text-sm">{(assessmentApp as any).applicantName || assessmentApp.details?.applicantName || 'Juan Dela Cruz'}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">SERVICE PROGRAM</span>
                  <span className="font-bold text-blue-400">{assessmentApp.serviceName}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                  {((assessmentApp as any)?.category === 'training' || assessmentApp.referenceNo.startsWith('TRN') || assessmentApp.serviceName.toLowerCase().includes('training') || assessmentApp.serviceName.toLowerCase().includes('pastry') || assessmentApp.serviceName.toLowerCase().includes('welding') || assessmentApp.serviceName.toLowerCase().includes('barista'))
                    ? 'TRAINING ORIENTATION & DOCUMENT VERIFICATION'
                    : ((assessmentApp as any)?.category === 'soloparent' || assessmentApp.referenceNo.startsWith('SP') || assessmentApp.serviceName.toLowerCase().includes('solo'))
                    ? 'SOLO PARENT BOOKLET & PHYSICAL VERIFICATION'
                    : ((assessmentApp as any)?.category === 'livelihood' || assessmentApp.referenceNo.startsWith('LVH') || assessmentApp.serviceName.toLowerCase().includes('livelihood'))
                    ? 'LIVELIHOOD PROJECT & DOCUMENT VERIFICATION'
                    : 'PHYSICAL INTAKE VERIFICATION'}
                </span>
                <p className="text-[11px]">
                  {((assessmentApp as any)?.category === 'training' || assessmentApp.referenceNo.startsWith('TRN') || assessmentApp.serviceName.toLowerCase().includes('training') || assessmentApp.serviceName.toLowerCase().includes('pastry') || assessmentApp.serviceName.toLowerCase().includes('welding') || assessmentApp.serviceName.toLowerCase().includes('barista'))
                    ? 'Vocational Training Officer verified original documents (Request Letter, QC Residency ID, Barangay Indigency) and orientation attendance. Choose final case assessment decision below:'
                    : ((assessmentApp as any)?.category === 'soloparent' || assessmentApp.referenceNo.startsWith('SP') || assessmentApp.serviceName.toLowerCase().includes('solo'))
                    ? 'Social Worker verified original Solo Parent Booklet / ID, affidavit, and indigency documents. Choose final case assessment decision below:'
                    : ((assessmentApp as any)?.category === 'livelihood' || assessmentApp.referenceNo.startsWith('LVH') || assessmentApp.serviceName.toLowerCase().includes('livelihood'))
                    ? 'Social Worker verified project proposal, business plan, and residency documents. Choose final case assessment decision below:'
                    : 'Social worker verified original documents (Statement of Account / Medical Certificate). Choose final case assessment decision below:'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#0a1120] border-t border-slate-800 flex justify-between items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setAssessmentApp(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {((assessmentApp as any)?.category === 'training' || assessmentApp.referenceNo.startsWith('TRN') || assessmentApp.serviceName.toLowerCase().includes('training') || assessmentApp.serviceName.toLowerCase().includes('pastry') || assessmentApp.serviceName.toLowerCase().includes('welding') || assessmentApp.serviceName.toLowerCase().includes('barista')) ? (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        const ref = assessmentApp.referenceNo;
                        const newStatus = 'Unqualified';
                        setDbAppointments((prev) =>
                          prev.map((item) => (item.referenceNo === ref ? { ...item, status: newStatus } : item))
                        );
                        try {
                          await fetch(`${API_BASE_URL}/api/appointments/${encodeURIComponent(ref)}/status`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: newStatus })
                          });
                          await fetch(`${API_BASE_URL}/api/training/applications/${encodeURIComponent(ref)}/status`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: newStatus, rejectionReason: 'Did not pass training orientation requirements' })
                          });
                        } catch (e) {
                          console.warn("API update warning:", e);
                        }
                        if (onUpdateStatus) onUpdateStatus(ref, newStatus);
                        setAssessmentApp(null);
                        setTimeout(fetchAppointments, 500);
                      }}
                      className="px-4 py-2 bg-rose-950/70 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-bold text-xs rounded-xl transition-colors"
                    >
                      ❌ Unqualified
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const ref = assessmentApp.referenceNo;
                        const newStatus = 'Qualified / Enrolled';
                        setDbAppointments((prev) =>
                          prev.map((item) => (item.referenceNo === ref ? { ...item, status: newStatus } : item))
                        );
                        try {
                          await fetch(`${API_BASE_URL}/api/appointments/${encodeURIComponent(ref)}/status`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: newStatus })
                          });
                          await fetch(`${API_BASE_URL}/api/training/applications/${encodeURIComponent(ref)}/status`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: newStatus })
                          });
                        } catch (e) {
                          console.warn("API update warning:", e);
                        }
                        if (onUpdateStatus) onUpdateStatus(ref, newStatus);
                        setAssessmentApp(null);
                        setTimeout(fetchAppointments, 500);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-colors"
                    >
                      ✅ Enroll Trainee
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        const ref = assessmentApp.referenceNo;
                        const newStatus = 'Rejected';
                        setDbAppointments((prev) =>
                          prev.map((item) => (item.referenceNo === ref ? { ...item, status: newStatus } : item))
                        );
                        try {
                          await fetch(`${API_BASE_URL}/api/appointments/${encodeURIComponent(ref)}/status`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: newStatus })
                          });
                        } catch (e) {
                          console.warn("API update warning:", e);
                        }
                        if (onUpdateStatus) onUpdateStatus(ref, newStatus);
                        setAssessmentApp(null);
                        setTimeout(fetchAppointments, 500);
                      }}
                      className="px-4 py-2 bg-rose-950/70 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-bold text-xs rounded-xl transition-colors"
                    >
                      Reject
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const ref = assessmentApp.referenceNo;
                        const isCwProt = ref.startsWith('QC-CW-') || ref.startsWith('CW-PROT-') || (assessmentApp.serviceName || '').toLowerCase() === 'child welfare services' || (assessmentApp.serviceName || '').toLowerCase().includes('child protection');
                        const newStatus = isCwProt ? 'APPROVED / COMPLETED' : 'APPROVED';
                        setDbAppointments((prev) =>
                          prev.map((item) => (item.referenceNo === ref ? { ...item, status: newStatus } : item))
                        );
                        try {
                          await fetch(`${API_BASE_URL}/api/appointments/${encodeURIComponent(ref)}/status`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: newStatus })
                          });
                        } catch (e) {
                          console.warn("API update warning:", e);
                        }
                        if (onUpdateStatus) onUpdateStatus(ref, newStatus);
                        setAssessmentApp(null);
                        setTimeout(fetchAppointments, 500);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-colors"
                    >
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* PRINTABLE OFFICIAL GUARANTEE LETTER (GL) MODAL PORTAL */}
      {printingGL && createPortal(
        <div 
          id="printable-gl-portal" 
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
              #printable-gl-portal {
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
              #printable-gl-card {
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

          {/* Centering & Scroll Inner Wrapper */}
          <div className="min-h-full w-full flex flex-col items-center justify-start p-2 sm:p-4 py-3 sm:py-6 pb-36 sm:pb-20">
            {/* Sticky Mobile/Desktop Top Action Bar (no-print) */}
            <div className="w-full max-w-2xl bg-[#0f172a] border border-slate-700/80 rounded-2xl p-3 sm:p-4 mb-3 flex items-center justify-between shadow-xl shrink-0 no-print sticky top-2 z-20 backdrop-blur-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                  <Printer className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-extrabold text-white truncate">Official Guarantee Letter (GL)</h3>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{printingGL.referenceNo}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 sm:px-4 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintingGL(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Close Preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div id="printable-gl-card" className="bg-white text-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl p-4 sm:p-8 font-sans border border-slate-300">
            {[
              printingGL.serviceName,
              printingGL.assistanceType,
              printingGL.category,
              (printingGL.details as any)?.category,
              (printingGL.details as any)?.assistanceType,
              (printingGL.details as any)?.serviceName
            ].some(str => typeof str === 'string' && (str.toLowerCase().includes('funeral') || str.toLowerCase().includes('burial'))) ? (
              /* OFFICIAL CERTIFICATE OF GUARANTEE FOR FUNERAL ASSISTANCE */
              <div>
                {/* HEADER */}
                <div className="text-center space-y-1 border-b pb-4 border-slate-300">
                  <div className="relative flex flex-col sm:flex-row items-center justify-center min-h-[56px] py-1">
                    <img src="/Government Service Integrity Seal.png" alt="QC Seal" className="w-12 h-12 sm:w-14 sm:h-14 object-contain sm:absolute sm:left-0 sm:top-1/2 sm:-translate-y-1/2 mx-auto sm:mx-0 mb-1 sm:mb-0" />
                    <div className="text-center w-full px-2 sm:px-16">
                      <h2 className="text-sm sm:text-base font-black tracking-tight uppercase text-slate-900">REPUBLIC OF THE PHILIPPINES</h2>
                      <h3 className="text-[11px] sm:text-xs font-bold text-slate-700">QUEZON CITY GOVERNMENT</h3>
                      <h4 className="text-[10px] sm:text-[11px] font-extrabold text-blue-900 uppercase">SOCIAL SERVICES AND DEVELOPMENT DEPARTMENT (SSDD)</h4>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">City Hall Compound, Elliptical Road, Quezon City</p>
                    </div>
                  </div>
                  <div className="pt-3">
                    <h1 className="text-base font-black text-slate-900 tracking-wider uppercase">CERTIFICATE OF GUARANTEE</h1>
                    <h2 className="text-xs font-extrabold text-blue-900 uppercase">(GUARANTEE LETTER)</h2>
                  </div>
                </div>

                {/* CONTROL NO & DATE */}
                <div className="flex justify-between items-center py-3 border-b border-slate-200 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">CONTROL NO. :</span>
                    <span className="font-black text-blue-900 text-sm">
                      {printingGL.referenceNo?.replace('REF-', 'QC-GL-2026-FUN-') || 'QC-GL-2026-FUN-8842'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 font-bold block text-[10px]">DATE:</span>
                    <span className="font-bold text-slate-800">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* PROGRAM & ORDINANCE */}
                <div className="py-2.5 px-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1 my-3">
                  <p><span className="font-bold text-slate-600 uppercase text-[10px]">PROGRAM     :</span> <span className="font-extrabold text-slate-900">QC AICS - Burial & Funeral Assistance Program</span></p>
                  <p><span className="font-bold text-slate-600 uppercase text-[10px]">ORDINANCE   :</span> <span className="font-semibold text-slate-800">QC Ordinance No. SP-2865, S-2019</span></p>
                </div>

                {/* TO THE MANAGEMENT OF */}
                <div className="py-2 text-xs space-y-1">
                  <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">TO THE MANAGEMENT OF:</p>
                  <div className="pl-4 border-l-2 border-blue-600 space-y-0.5">
                    <p><span className="font-bold text-slate-600">Partner Funeral Home :</span> <span className="font-extrabold text-slate-900 uppercase">{(((printingGL.details as any)?.funeralHomeName || (printingGL.details as any)?.hospital || printingGL.hospitalFacility || 'ACCREDITED PARTNER FUNERAL SERVICES') as string).replace(/Nieto\s*/gi, '')}</span></p>
                    <p><span className="font-bold text-slate-600">Address              :</span> <span className="font-medium text-slate-800">{(printingGL.details as any)?.funeralDistrict ? `${(printingGL.details as any)?.funeralDistrict}, Quezon City` : 'Novaliches, Quezon City, Metro Manila'}</span></p>
                  </div>
                </div>

                <div className="py-2 text-xs leading-relaxed">
                  <p className="font-bold text-slate-900 mb-2">GREETINGS:</p>
                  <p className="text-slate-700 text-justify">
                    This is to certify that the Quezon City Government, through the Social Services and Development Department (SSDD), guarantees financial assistance for the funeral and burial services rendered to:
                  </p>
                </div>

                {/* BENEFICIARY DETAILS */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 my-2 text-xs font-mono">
                  <p><span className="font-bold text-slate-600 uppercase">• NAME OF DECEASED     :</span> <span className="font-black text-slate-900">{(printingGL.details as any)?.patientFirstName ? `${(printingGL.details as any)?.patientFirstName} ${(printingGL.details as any)?.patientMiddleName || ''} ${(printingGL.details as any)?.patientLastName}`.toUpperCase() : 'MARIO FERNANDO LEE'}</span></p>
                  <p><span className="font-bold text-slate-600 uppercase">• NAME OF APPLICANT    :</span> <span className="font-extrabold text-slate-900">{(printingGL.applicantName || 'JEFFERSON FERNANDO LEE').toUpperCase()} ({(printingGL.details as any)?.patientRelationship || 'Son / Nearest Kin'})</span></p>
                  <p><span className="font-bold text-slate-600 uppercase">• ADDRESS              :</span> <span className="font-medium text-slate-900">{(printingGL.details as any)?.houseNo || '176'} {(printingGL.details as any)?.streetName || '23'}, Brgy. {(printingGL.details as any)?.barangay || 'Bagong Silangan'}, Quezon City</span></p>
                </div>

                {/* APPROVED FINANCIAL ASSISTANCE */}
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5 my-3">
                  <h4 className="text-[11px] font-black uppercase text-blue-900 tracking-wider text-center border-b border-blue-200 pb-1">APPROVED FINANCIAL ASSISTANCE</h4>
                  <div className="space-y-1 text-xs">
                    <p><span className="font-bold text-slate-700">• APPROVED AMOUNT      :</span> <span className="font-black text-sm text-blue-950">₱ _____________________________</span> <span className="text-[10px] text-slate-500 block italic pl-4">(Amount to be assigned after SSDD Social Worker Classification & Assessment)</span></p>
                    <p><span className="font-bold text-slate-700">• ASSISTANCE COVERAGE  :</span> <span className="font-medium text-slate-800">Standard Funeral Casket, Body Preparation, Embalming, Chapel Viewing, Hearse Transport & Burial Service Package (Up to ₱25,000 maximum)</span></p>
                  </div>
                </div>

                {/* TERMS AND CONDITIONS */}
                <div className="text-[10px] space-y-1 my-3 text-slate-700">
                  <p className="font-bold uppercase text-slate-900 text-[11px]">TERMS AND CONDITIONS:</p>
                  <ol className="list-decimal pl-4 space-y-0.5 leading-tight">
                    <li>This Certificate of Guarantee (GL) is non-transferable and shall be honored ONLY by accredited partner funeral service providers of Quezon City.</li>
                    <li>The accredited funeral service provider shall deduct the approved guarantee amount specified above from the total billing invoice of the beneficiary.</li>
                    <li>For billing reimbursement, the service provider must submit the following to the SSDD Main Office:
                      <ul className="list-alpha pl-4 font-mono text-[9px] text-slate-600">
                        <li>a. Original Copy of this Certificate of Guarantee (GL)</li>
                        <li>b. Statement of Account / Official Funeral Contract</li>
                        <li>c. Certified True Copy of Registered Death Certificate</li>
                        <li>d. Photocopy of Valid QC ID of the Applicant / Informant</li>
                      </ul>
                    </li>
                  </ol>
                </div>

                {/* SIGNATORIES */}
                <div className="grid grid-cols-2 gap-8 pt-12 text-xs">
                  <div>
                    <div className="border-b border-slate-800 w-full mb-1"></div>
                    <span className="text-[9px] text-slate-500 block font-bold text-center">Quezon City SSDD</span>
                  </div>
                  <div>
                    <div className="border-b border-slate-800 w-full mb-1"></div>
                    <span className="text-[9px] text-slate-500 block font-bold text-center">Social Services and Development Department</span>
                  </div>
                </div>

                <div className="text-center pt-4 border-t border-slate-200 mt-4">
                  <p className="text-[10px] font-bold italic text-slate-600">"Faithful Service for the Citizens of Quezon City"</p>
                </div>
              </div>
            ) : (
              /* STANDARD MEDICAL GUARANTEE LETTER */
              <div>
                {/* HEADER */}
                <div className="text-center space-y-1 border-b pb-4 border-slate-300">
                  <div className="relative flex flex-col sm:flex-row items-center justify-center min-h-[56px] py-1">
                    <img src="/Government Service Integrity Seal.png" alt="QC Seal" className="w-12 h-12 sm:w-14 sm:h-14 object-contain sm:absolute sm:left-0 sm:top-1/2 sm:-translate-y-1/2 mx-auto sm:mx-0 mb-1 sm:mb-0" />
                    <div className="text-center w-full px-2 sm:px-16">
                      <h2 className="text-sm sm:text-base font-black tracking-tight uppercase text-slate-900">REPUBLIC OF THE PHILIPPINES</h2>
                      <h3 className="text-[11px] sm:text-xs font-bold text-slate-700">QUEZON CITY GOVERNMENT</h3>
                      <h4 className="text-[10px] sm:text-[11px] font-extrabold text-blue-900 uppercase">SOCIAL SERVICES & DEVELOPMENT DEPARTMENT (SSDD)</h4>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">City Hall Compound, Elliptical Road, Quezon City</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <span className="inline-block px-4 py-1 bg-blue-50 border border-blue-300 text-blue-950 text-xs font-black rounded-lg tracking-widest uppercase">
                      OFFICIAL GUARANTEE LETTER (GL)
                    </span>
                  </div>
                </div>

                {/* CONTROL NO & DATE */}
                <div className="flex justify-between items-center py-3 border-b border-slate-200 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">GL CONTROL NO.:</span>
                    <span className="font-black text-blue-900 text-sm">GL-2026-99210</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 font-bold block text-[10px]">DATE ISSUED:</span>
                    <span className="font-bold text-slate-800">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* DETAILS CONTENT */}
                <div className="py-4 space-y-3.5 text-xs">
                  {/* PATIENT INFORMATION */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 print:bg-white print:border-slate-300">
                    <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">PATIENT INFORMATION (BENEFICIARY):</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block uppercase font-bold">• Patient / Applicant Name:</span>
                        <span className="font-extrabold text-slate-900 text-sm">{(printingGL as any).applicantName || printingGL.details?.applicantName || 'Jefferson Fernando Lee'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block uppercase font-bold">• Control / Reference No:</span>
                        <span className="font-bold font-mono text-blue-900">{printingGL.referenceNo}</span>
                      </div>
                    </div>
                  </div>

                  {/* ASSISTANCE DETAILS */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 print:bg-white print:border-slate-300">
                    <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">ASSISTANCE DETAILS:</h4>
                    <p className="text-[11px] text-slate-600 italic">This patient is hereby approved to receive assistance for:</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block uppercase font-bold">• TYPE OF ASSISTANCE:</span>
                        <span className="font-extrabold text-blue-900">{printingGL.serviceName || 'Medical Bill Assistance'}</span>
                      </div>
                      {!(printingGL.serviceName || '').toLowerCase().includes('medicine') && (
                        <div>
                          <span className="text-slate-500 text-[10px] block uppercase font-bold">• MEDICAL CONDITION / DIAGNOSIS:</span>
                          <span className="font-extrabold text-slate-900">
                            {(printingGL.details as any)?.medicalCondition || 
                             (printingGL.details as any)?.condition || 
                             (printingGL.details as any)?.reason || 
                             (printingGL.details as any)?.diagnosis || 
                             (printingGL.details as any)?.medicalDetails || 
                             'Medical Condition / Confinement'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AMOUNT OF ASSISTANCE */}
                  <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5 print:bg-white print:border-slate-300">
                    <h4 className="text-[11px] font-black uppercase text-amber-900 tracking-wider">AMOUNT OF ASSISTANCE:</h4>
                    <div className="space-y-1 font-mono text-xs">
                      <p><span className="font-bold">• Amount in Words:</span> _______________________________________________________</p>
                      <p><span className="font-bold">• Amount in Figures:</span> <span className="font-black text-sm text-slate-900">₱ __________________</span></p>
                    </div>
                  </div>

                  {/* SERVICE PROVIDER DETAILS */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 print:bg-white print:border-slate-300">
                    <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">SERVICE PROVIDER DETAILS:</h4>
                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase font-bold">• ACCREDITED PARTNER HOSPITAL / FACILITY:</span>
                      <span className="font-extrabold text-slate-900">
                        {(printingGL.details as any)?.hospital || 
                         (printingGL.details as any)?.healthFacility || 
                         (printingGL.details as any)?.facility || 
                         (printingGL.details as any)?.hospitalName || 
                         'East Avenue Medical Center'}
                      </span>
                    </div>
                  </div>

                  {/* SIGNATORIES (BLANK FOR WET SIGNATURE) */}
                  <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs">
                    <div>
                      <div className="border-b border-slate-800 w-full mb-1.5"></div>
                      <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">Prepared and Certified by (Social Worker)</span>
                    </div>
                    <div>
                      <div className="border-b border-slate-800 w-full mb-1.5"></div>
                      <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">Approved by (Authorized Signatory)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FOOTER BAR (HIDDEN IN PRINT) */}
            <div className="pt-4 border-t border-slate-200 flex justify-end items-center gap-2 no-print">
              <button
                type="button"
                onClick={() => setPrintingGL(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>PRINT OFFICIAL GL</span>
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
