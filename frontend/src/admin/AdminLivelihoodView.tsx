import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Filter, 
  Building2, 
  Briefcase, 
  DollarSign, 
  Package, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Calendar,
  AlertCircle,
  X,
  ExternalLink,
  ShieldCheck,
  Award,
  FileCheck2,
  Image as ImageIcon,
  Download
} from 'lucide-react';

export interface LivelihoodApplication {
  id: number;
  reference_no: string;
  applicant_name: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  suffix?: string;
  nationality?: string;
  dob?: string;
  age?: string;
  gender?: string;
  civil_status?: string;
  blood_type?: string;
  house_no?: string;
  street_name?: string;
  barangay?: string;
  phone_number?: string;
  email_address?: string;
  sector?: string;
  employment_status?: string;
  has_existing_business?: string;
  type_of_business?: string;
  specified_other_business?: string;
  assistance_type?: string;
  reason_for_assistance?: string;
  requested_materials_items?: any;
  uploaded_documents?: any;
  details?: any;
  amount?: number;
  status: string;
  disapproval_reason?: string;
  appointment_date?: string;
  appointment_time?: string;
  appointment_venue?: string;
  payout_date?: string;
  payout_time?: string;
  payout_venue?: string;
  date_submitted?: string;
  updated_at?: string;
}

export const AdminLivelihoodView: React.FC<{ darkMode?: boolean }> = ({ darkMode = true }) => {
  const [applications, setApplications] = useState<LivelihoodApplication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'FINANCIAL' | 'MATERIALS' | 'TRAINING'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Selected application for Detail/Inspection Modal
  const [selectedApp, setSelectedApp] = useState<LivelihoodApplication | null>(null);
  const [inspectingDoc, setInspectingDoc] = useState<{ title: string; filename: string; url?: string } | null>(null);

  // Reject Modal State
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [appToReject, setAppToReject] = useState<LivelihoodApplication | null>(null);

  useEffect(() => {
    if (selectedApp || inspectingDoc || showRejectModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [selectedApp, inspectingDoc, showRejectModal]);

  const fetchApplications = async () => {
    try {
      const [resLvh, resTrn] = await Promise.all([
        fetch('http://localhost:5000/api/livelihood/applications').catch(() => null),
        fetch('http://localhost:5000/api/training/applications').catch(() => null)
      ]);
      const lvhData = (resLvh && resLvh.ok) ? await resLvh.json() : [];
      const trnData = (resTrn && resTrn.ok) ? await resTrn.json() : [];

      const mappedTrn: LivelihoodApplication[] = (Array.isArray(trnData) ? trnData : []).map(row => ({
        id: row.id,
        reference_no: row.reference_no,
        applicant_name: row.applicant_name,
        first_name: row.first_name,
        middle_name: row.middle_name,
        last_name: row.last_name,
        suffix: row.suffix,
        nationality: row.nationality,
        dob: row.dob,
        age: row.age,
        gender: row.gender,
        civil_status: row.civil_status,
        house_no: row.house_no,
        street_name: row.street_name,
        barangay: row.barangay,
        phone_number: row.phone_number,
        email_address: row.email_address || 'jeffersonlee1234@gmail.com',
        sector: 'Skills Training',
        employment_status: row.highest_edu,
        assistance_type: row.course_title || 'Skills Training Program',
        reason_for_assistance: row.training_purpose,
        uploaded_documents: {
          docRequestLetter: row.doc_request_letter,
          docQcId: row.doc_qc_id,
          docIndigency: row.doc_indigency
        },
        details: row,
        amount: 0,
        status: row.status,
        disapproval_reason: row.rejection_reason,
        appointment_date: row.orientation_date,
        appointment_time: row.orientation_time,
        appointment_venue: row.orientation_venue,
        date_submitted: row.date_submitted ? new Date(row.date_submitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'
      }));

      const merged = [...(Array.isArray(lvhData) ? lvhData : []), ...mappedTrn];
      setApplications(merged);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    const interval = setInterval(fetchApplications, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (app: LivelihoodApplication, newStatus: string, reason?: string) => {
    const isTrn = app.reference_no.startsWith('TRN-') || app.sector === 'Skills Training';
    const endpoint = isTrn 
      ? `http://localhost:5000/api/training/applications/${app.reference_no}/status`
      : `http://localhost:5000/api/livelihood/applications/${app.reference_no}/status`;

    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          rejectionReason: reason || null,
          disapprovalReason: reason || null
        })
      });
      if (res.ok) {
        fetchApplications();
        if (selectedApp && selectedApp.reference_no === app.reference_no) {
          setSelectedApp(prev => prev ? { ...prev, status: newStatus, disapproval_reason: reason } : null);
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleConfirmReject = () => {
    if (appToReject && rejectReason.trim()) {
      handleUpdateStatus(appToReject, 'REJECTED', rejectReason.trim());
      setShowRejectModal(false);
      setRejectReason('');
      setAppToReject(null);
    }
  };

  // Metrics counters
  const totalCount = applications.length;
  const pendingCount = useMemo(() => {
    return applications.filter(a => {
      const st = (a.status || '').toUpperCase();
      return st.includes('PENDING') || st.includes('EVALUATION') || st === 'SUBMITTED';
    }).length;
  }, [applications]);

  const approvedCount = useMemo(() => {
    return applications.filter(a => {
      const st = (a.status || '').toUpperCase();
      return st.includes('APPROV') || st.includes('SCHEDULED') || st.includes('RELEASED') || st.includes('COMPLETED') || st.includes('QUALIFIED') || st.includes('ENROLLED') || st.includes('VALIDATED') || st.includes('ORIENT');
    }).length;
  }, [applications]);

  const rejectedCount = useMemo(() => {
    return applications.filter(a => {
      const st = (a.status || '').toUpperCase();
      return st.includes('REJECT') || st.includes('DISAPPROV');
    }).length;
  }, [applications]);

  // Filtered List
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      // Category Filter (Financial vs Materials vs Training)
      const typeStr = (app.assistance_type || app.details?.assistanceNeeded || '').toLowerCase();
      const isTrnApp = app.sector === 'Skills Training' || app.reference_no.startsWith('TRN-');

      if (categoryFilter === 'FINANCIAL' && (!typeStr.includes('financial') || isTrnApp)) return false;
      if (categoryFilter === 'MATERIALS' && (!typeStr.includes('material') || isTrnApp)) return false;
      if (categoryFilter === 'TRAINING' && !isTrnApp) return false;

      // Status Filter
      const st = (app.status || '').toUpperCase();
      const isApproved = st.includes('APPROV') || st.includes('SCHEDULED') || st.includes('RELEASED') || st.includes('COMPLETED') || st.includes('VALIDATED') || st.includes('ENROLLED');
      const isPending = st.includes('PENDING') || st.includes('EVALUATION') || st === 'SUBMITTED';
      const isRejected = st.includes('REJECT') || st.includes('DISAPPROV') || st.includes('UNQUALIFIED');

      if (statusFilter === 'pending' && !isPending) return false;
      if (statusFilter === 'approved' && !isApproved) return false;
      if (statusFilter === 'rejected' && !isRejected) return false;

      // Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const refMatch = (app.reference_no || '').toLowerCase().includes(q);
        const nameMatch = (app.applicant_name || '').toLowerCase().includes(q);
        const brgyMatch = (app.barangay || '').toLowerCase().includes(q);
        const sectorMatch = (app.sector || '').toLowerCase().includes(q);
        return refMatch || nameMatch || brgyMatch || sectorMatch;
      }

      return true;
    });
  }, [applications, categoryFilter, statusFilter, searchQuery]);

  return (
    <div className={`space-y-6 select-none font-['Plus_Jakarta_Sans',sans-serif] ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Page Title Header */}
      <div>
        <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Livelihood & Grants Services
        </h1>
      </div>

      {/* KPI Stats Cards Grid (Matching AICS Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`border rounded-2xl p-5 shadow-lg ${darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90'}`}>
          <span className={`text-[11px] font-bold tracking-wider uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>TOTAL APPLICATIONS</span>
          <div className={`text-3xl font-extrabold tracking-tight mt-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{totalCount}</div>
        </div>

        <div className={`border rounded-2xl p-5 shadow-lg ${darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90'}`}>
          <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase">PENDING REVIEW</span>
          <div className="text-3xl font-extrabold text-amber-400 tracking-tight mt-2">{pendingCount}</div>
        </div>

        <div className={`border rounded-2xl p-5 shadow-lg ${darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90'}`}>
          <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase">APPROVED</span>
          <div className="text-3xl font-extrabold text-emerald-400 tracking-tight mt-2">{approvedCount}</div>
        </div>

        <div className={`border rounded-2xl p-5 shadow-lg ${darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90'}`}>
          <span className="text-[11px] font-bold tracking-wider text-rose-400 uppercase">REJECTED</span>
          <div className="text-3xl font-extrabold text-rose-400 tracking-tight mt-2">{rejectedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar (Matching AICS Layout) */}
      <div className={`border rounded-2xl p-5 space-y-4 shadow-xl ${darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90'}`}>
        <div className="relative w-full">
          <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
          <input
            type="text"
            placeholder="Search by name, reference number, barangay, or sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
              darkMode ? 'bg-[#0b1220] border-slate-700/80 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
            }`}
          />
        </div>

        <div className="flex flex-row items-center gap-4 flex-nowrap overflow-x-auto pt-1 text-xs">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[10px] font-extrabold tracking-wider uppercase mr-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>CATEGORY</span>
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-extrabold transition-all text-xs cursor-pointer ${
                categoryFilter === 'ALL'
                  ? 'bg-[#1d4ed8] text-white shadow-md border border-blue-400/40'
                  : darkMode ? 'bg-[#121c2e] text-slate-400 hover:text-slate-200 border border-slate-800' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 shadow-sm'
              }`}
            >
              ALL CATEGORIES
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('TRAINING')}
              className={`px-3 py-1.5 rounded-xl font-extrabold transition-all text-xs cursor-pointer ${
                categoryFilter === 'TRAINING'
                  ? 'bg-[#1d4ed8] text-white shadow-md border border-blue-400/40'
                  : darkMode ? 'bg-[#121c2e] text-slate-400 hover:text-slate-200 border border-slate-800' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 shadow-sm'
              }`}
            >
              SKILLS TRAINING
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('FINANCIAL')}
              className={`px-3 py-1.5 rounded-xl font-extrabold transition-all text-xs cursor-pointer ${
                categoryFilter === 'FINANCIAL'
                  ? 'bg-[#1d4ed8] text-white shadow-md border border-blue-400/40'
                  : darkMode ? 'bg-[#121c2e] text-slate-400 hover:text-slate-200 border border-slate-800' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 shadow-sm'
              }`}
            >
              FINANCIAL
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('MATERIALS')}
              className={`px-3 py-1.5 rounded-xl font-extrabold transition-all text-xs cursor-pointer ${
                categoryFilter === 'MATERIALS'
                  ? 'bg-[#1d4ed8] text-white shadow-md border border-blue-400/40'
                  : darkMode ? 'bg-[#121c2e] text-slate-400 hover:text-slate-200 border border-slate-800' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 shadow-sm'
              }`}
            >
              MATERIALS / SUPPLIES
            </button>
          </div>

          <div className={`flex items-center gap-2 border-l pl-4 flex-shrink-0 ${darkMode ? 'border-slate-800/80' : 'border-slate-300'}`}>
            <span className={`text-[10px] font-extrabold tracking-wider uppercase mr-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>STATUS</span>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-extrabold transition-all text-xs cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#1d4ed8] text-white shadow-md border border-blue-400/40'
                  : darkMode ? 'bg-[#121c2e] text-slate-400 hover:text-slate-200 border border-slate-800' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 shadow-sm'
              }`}
            >
              ALL STATUSES
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-xl font-extrabold transition-all text-xs cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-[#1d4ed8] text-white shadow-md border border-blue-400/40'
                  : darkMode ? 'bg-[#121c2e] text-slate-400 hover:text-slate-200 border border-slate-800' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 shadow-sm'
              }`}
            >
              PENDING
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 rounded-xl font-extrabold transition-all text-xs cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-[#1d4ed8] text-white shadow-md border border-blue-400/40'
                  : darkMode ? 'bg-[#121c2e] text-slate-400 hover:text-slate-200 border border-slate-800' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 shadow-sm'
              }`}
            >
              APPROVED
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 rounded-xl font-extrabold transition-all text-xs cursor-pointer ${
                statusFilter === 'rejected'
                  ? 'bg-[#1d4ed8] text-white shadow-md border border-blue-400/40'
                  : darkMode ? 'bg-[#121c2e] text-slate-400 hover:text-slate-200 border border-slate-800' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 shadow-sm'
              }`}
            >
              REJECTED
            </button>
          </div>
        </div>
      </div>

      {/* Applications Table View (Matching AICS Table Layout) */}
      <div className="space-y-3">
        <h3 className={`text-sm font-bold tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Applications <span className={`font-mono text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>({filteredApps.length})</span>
        </h3>

        {isLoading ? (
          <div className={`border rounded-2xl p-12 text-center text-xs ${darkMode ? 'bg-[#0e1726] border-slate-800/90 text-slate-400' : 'bg-white border-slate-200/90 text-slate-500 shadow-sm'}`}>
            Loading Livelihood records from PostgreSQL database...
          </div>
        ) : filteredApps.length > 0 ? (
          <div className={`border rounded-2xl overflow-hidden shadow-xl ${darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90 shadow-sm'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[11px] font-extrabold uppercase tracking-wider ${
                    darkMode ? 'border-slate-800/80 bg-[#121c2e] text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}>
                    <th className="py-4 px-6">REFERENCE NO.</th>
                    <th className="py-4 px-6">APPLICANT NAME</th>
                    <th className="py-4 px-6">ASSISTANCE TYPE</th>
                    <th className="py-4 px-6">DATE FILED</th>
                    <th className="py-4 px-6">CURRENT STATUS</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-xs font-medium ${darkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                  {filteredApps.map((app) => {
                    const st = (app.status || '').toUpperCase();
                    const isApproved = st.includes('APPROV') || st.includes('RELEASED') || st.includes('COMPLETED') || st.includes('PAYOUT') || st.includes('SCHEDULED') || st.includes('QUALIFIED') || st.includes('ENROLLED') || st.includes('VALIDATED') || st.includes('ORIENT');
                    const isPending = st.includes('PENDING') || st.includes('EVALUATION') || st === 'SUBMITTED';

                    return (
                      <tr 
                        key={app.reference_no}
                        className={`transition-colors group cursor-pointer ${darkMode ? 'hover:bg-[#142036]' : 'hover:bg-slate-50'}`}
                        onClick={() => setSelectedApp(app)}
                      >
                        <td className="py-4 px-6 font-mono font-bold text-blue-400">{app.reference_no}</td>
                        <td className={`py-4 px-6 font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {app.applicant_name}
                        </td>
                        <td className="py-4 px-6 font-bold">
                          <span className={app.sector === 'Skills Training' || app.reference_no.startsWith('TRN-') ? 'text-blue-500 font-extrabold' : app.assistance_type === 'Materials / Supplies' ? (darkMode ? 'text-slate-200' : 'text-slate-700') : (darkMode ? 'text-white' : 'text-slate-900')}>
                            {app.assistance_type || 'Financial / Capital Assistance'}
                          </span>
                          {(app.reference_no.startsWith('TRN-') || app.sector === 'Skills Training') ? (
                            <span className="block text-[10px] text-blue-500 font-extrabold">
                              Free Skills Training Program
                            </span>
                          ) : app.assistance_type !== 'Materials / Supplies' && (
                            <span className={`block text-[10px] font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              ₱{(app.amount || 15000).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </td>
                        <td className={`py-4 px-6 font-mono text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {app.date_submitted ? new Date(app.date_submitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold border ${
                            isApproved
                              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                              : isPending
                              ? 'bg-amber-950/60 text-amber-400 border-amber-500/30'
                              : 'bg-rose-950/60 text-rose-400 border-rose-500/30'
                          }`}>
                            {app.status || 'Pending Document Validation'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={`border rounded-2xl p-16 text-center shadow-xl flex flex-col items-center justify-center ${
            darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90 shadow-sm'
          }`}>
            <div className={`p-3.5 rounded-2xl mb-3 border ${darkMode ? 'bg-[#121c2e] border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
              <FileText className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h4 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>No applications found</h4>
            <p className="text-xs text-slate-400 mt-1">Try a different search term or filter.</p>
          </div>
        )}
      </div>

      {/* MANAGE APPLICATION MODAL (MATCHING AICS INSPECTION MODAL LAYOUT) */}
      {selectedApp && createPortal(
        <div className="fixed inset-0 z-[99999] bg-[#030712]/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#0e172a] text-slate-100 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-800 my-auto">
            {/* Header */}
            <div className="p-5 bg-[#121e36] border-b border-slate-800 flex justify-between items-center shrink-0">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider">{selectedApp.reference_no}</span>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  {selectedApp.reference_no.startsWith('TRN-') || selectedApp.sector === 'Skills Training' ? 'Skills & Vocational Training Program' : 'Livelihood & Enterprise Assistance Program'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs overflow-y-auto flex-1 custom-modal-scroll">
              {selectedApp.reference_no.startsWith('TRN-') || selectedApp.sector === 'Skills Training' ? (
                <>
                  {/* STEP 1: SELECTED COURSE DETAILS (MATCHING PIC 2) */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 space-y-3">
                    <span className="text-[11px] font-extrabold text-slate-200 uppercase tracking-wider block border-b border-slate-800 pb-1.5 flex items-center justify-between">
                      <span>SELECTED COURSE DETAILS</span>
                      <span className="text-[9px] font-mono text-slate-400">INPUTTED BY USER</span>
                    </span>

                    <div className="bg-[#0b1324] p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold uppercase block">SELECTED TRAINING COURSE</span>
                        <div className="font-black text-white text-sm mt-0.5">{selectedApp.assistance_type || selectedApp.details?.course_title || selectedApp.details?.courseTitle || 'Barista'}</div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-slate-300 font-medium text-[11px]">
                        <div>
                          <span className="text-slate-400 text-[9px] font-semibold uppercase block">Training Duration</span>
                          <span className="font-bold text-white">18 - 30 working days</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[9px] font-semibold uppercase block">Batch</span>
                          <span className="font-bold text-white">{selectedApp.details?.batch_name || selectedApp.details?.batchName || '3rd Batch 2026'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[9px] font-semibold uppercase block">Application Period</span>
                          <span className="font-bold text-white">July 1 - July 15, 2026</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[9px] font-semibold uppercase block">Target Starts</span>
                          <span className="font-bold text-white">August 1, 2026</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* STEP 2: APPLICANT PERSONAL INFO, EDUCATION & TRAINING PURPOSE (MATCHING PIC 3 & 4) */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 space-y-4">
                    <span className="text-[11px] font-extrabold text-slate-200 uppercase tracking-wider block border-b border-slate-800 pb-1.5 flex items-center justify-between">
                      <span>APPLICANT PERSONAL INFORMATION & TRAINING DETAILS</span>
                      <span className="text-[9px] font-mono text-slate-400">VERIFIED QCITIZEN PROFILE</span>
                    </span>

                    {/* Applicant Information Grid (Pic 3) */}
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider block mb-2">APPLICANT INFORMATION</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-[#0b1324] p-3 rounded-xl border border-slate-800">
                        <div>
                          <span className="text-slate-400 text-[10px] font-semibold uppercase block">First Name</span>
                          <div className="font-bold text-white text-xs mt-0.5">{selectedApp.first_name || selectedApp.details?.first_name || selectedApp.applicant_name.split(' ')[0]}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] font-semibold uppercase block">Middle Name</span>
                          <div className="font-bold text-white text-xs mt-0.5">{selectedApp.middle_name || selectedApp.details?.middle_name || 'FERNANDO'}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] font-semibold uppercase block">Last Name</span>
                          <div className="font-bold text-white text-xs mt-0.5">{selectedApp.last_name || selectedApp.details?.last_name || selectedApp.applicant_name.split(' ').pop()}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] font-semibold uppercase block">Suffix</span>
                          <div className="font-semibold text-white text-xs mt-0.5">{selectedApp.suffix || selectedApp.details?.suffix || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] font-semibold uppercase block">Nationality</span>
                          <div className="font-semibold text-white text-xs mt-0.5">{selectedApp.nationality || selectedApp.details?.nationality || 'FILIPINO'}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] font-semibold uppercase block">Date of Birth</span>
                          <div className="font-mono text-white text-xs mt-0.5">{selectedApp.dob || selectedApp.details?.dob || '27/09/2004'}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] font-semibold uppercase block">Age</span>
                          <div className="font-bold text-white text-xs mt-0.5">{selectedApp.age || selectedApp.details?.age || '22'} yrs old</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] font-semibold uppercase block">Gender</span>
                          <div className="font-semibold text-white text-xs mt-0.5">{selectedApp.gender || selectedApp.details?.gender || 'Male'}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] font-semibold uppercase block">Civil Status</span>
                          <div className="font-semibold text-white text-xs mt-0.5">{selectedApp.civil_status || selectedApp.details?.civil_status || 'Single'}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] font-semibold uppercase block">House / Bldg No.</span>
                          <div className="font-semibold text-white text-xs mt-0.5">{selectedApp.house_no || selectedApp.details?.house_no || '176'}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] font-semibold uppercase block">Street Name</span>
                          <div className="font-semibold text-white text-xs mt-0.5">{selectedApp.street_name || selectedApp.details?.street_name || '23'}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] font-semibold uppercase block">Barangay</span>
                          <div className="font-bold text-white text-xs mt-0.5">{selectedApp.barangay || selectedApp.details?.barangay || 'Bagong Silangan'}</div>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-slate-400 text-[10px] font-semibold uppercase block">Phone Number</span>
                          <div className="font-mono font-bold text-white text-xs mt-0.5">{selectedApp.phone_number || selectedApp.details?.phone_number || '09155582122'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Educational Background (Pic 3 & 4) */}
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider block mb-2">EDUCATIONAL BACKGROUND</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0b1324] p-3 rounded-xl border border-slate-800">
                        <div>
                          <span className="text-slate-400 text-[10px] font-semibold uppercase block">Highest Educational Attainment</span>
                          <div className="font-extrabold text-white text-xs mt-0.5">{selectedApp.details?.highest_edu || selectedApp.details?.highestEdu || selectedApp.employment_status || 'Elementary Level'}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] font-semibold uppercase block">School / Institution Name</span>
                          <div className="font-bold text-white text-xs mt-0.5">{selectedApp.details?.school_name || selectedApp.details?.schoolName || 'Batasan Hills National High School'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Training Purpose (Pic 4) */}
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider block mb-2">TRAINING PURPOSE</span>
                      <div className="space-y-2.5 bg-[#0b1324] p-3 rounded-xl border border-slate-800">
                        <div>
                          <span className="text-slate-400 text-[10px] font-semibold uppercase block">Why are you applying for the training?</span>
                          <div className="font-bold text-white text-xs mt-0.5">{selectedApp.details?.training_purpose || selectedApp.details?.trainingPurpose || selectedApp.reason_for_assistance || 'Employment / Skill Upgrade'}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] font-semibold uppercase block">Briefly state your reason for applying</span>
                          <div className="text-white text-xs italic bg-slate-900/90 p-2 rounded-lg border border-slate-800 mt-1">
                            "{selectedApp.details?.purpose_reason || selectedApp.details?.purposeReason || selectedApp.reason_for_assistance || 'Gusto ko pong matuto ng barista skills para makakuha ng magandang trabaho sa coffee shop.'}"
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Previous Training / Experience (Pic 4) */}
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider block mb-2">PREVIOUS TRAINING / EXPERIENCE</span>
                      <div className="bg-[#0b1324] p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[10px] font-semibold uppercase block">Have you attended a similar skills training before?</span>
                        <div className="font-bold text-white text-xs mt-0.5">{selectedApp.details?.previous_training || selectedApp.details?.previousTraining || 'No'}</div>
                      </div>
                    </div>
                  </div>

                  {/* STEP 3: UPLOADED REQUIREMENTS / SUPPORTING DOCUMENTS (MATCHING PIC 5) */}
                  <div className="p-4 rounded-xl bg-[#091124] border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="text-[11px] font-extrabold text-slate-200 uppercase tracking-wider">
                        REQUIREMENTS / SUPPORTING DOCUMENTS (CLICK TO INSPECT)
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {/* Doc 1: Request Letter */}
                      <button
                        type="button"
                        onClick={() => {
                          const docUrl = selectedApp.details?.doc_request_letter || selectedApp.uploaded_documents?.docRequestLetter || selectedApp.uploaded_documents?.proof_of_residency?.url;
                          setInspectingDoc({
                            title: "Request Letter (Addressed to SSDD / City Mayor)",
                            filename: "formal_request_letter.jpg",
                            url: docUrl
                          });
                        }}
                        className="p-3 rounded-xl bg-[#0d1830] hover:bg-[#15264a] border border-slate-700/80 flex items-center justify-between transition-all group text-left cursor-pointer shadow-md"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <FileText className="w-4 h-4 text-slate-300 shrink-0" />
                          <div className="truncate">
                            <span className="text-[11px] font-extrabold text-white block truncate">
                              REQUEST LETTER *
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono block">
                              Attached formal request letter addressed to SSDD / City Mayor
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-white flex items-center gap-1 shrink-0">
                          <span>View Document</span>
                          <ExternalLink className="w-3 h-3 text-slate-300" />
                        </span>
                      </button>

                      {/* Doc 2: QC ID / Proof of QC Residency */}
                      <button
                        type="button"
                        onClick={() => {
                          const docUrl = selectedApp.details?.doc_qc_id || selectedApp.uploaded_documents?.docQcId || selectedApp.uploaded_documents?.valid_id?.url;
                          setInspectingDoc({
                            title: "QC ID / Proof of QC Residency",
                            filename: "qcitizen_residency_card.jpg",
                            url: docUrl
                          });
                        }}
                        className="p-3 rounded-xl bg-[#0d1830] hover:bg-[#15264a] border border-slate-700/80 flex items-center justify-between transition-all group text-left cursor-pointer shadow-md"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <FileCheck2 className="w-4 h-4 text-slate-300 shrink-0" />
                          <div className="truncate">
                            <span className="text-[11px] font-extrabold text-white block truncate">
                              QC ID / PROOF OF QC RESIDENCY *
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono block">
                              Clear photo of your QCitizen ID, Barangay Certificate of Residency, or Valid ID
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-white flex items-center gap-1 shrink-0">
                          <span>View Document</span>
                          <ExternalLink className="w-3 h-3 text-slate-300" />
                        </span>
                      </button>

                      {/* Doc 3: Indigency of Barangay */}
                      <button
                        type="button"
                        onClick={() => {
                          const docUrl = selectedApp.details?.doc_indigency || selectedApp.uploaded_documents?.docIndigency || selectedApp.uploaded_documents?.other_documents?.url;
                          setInspectingDoc({
                            title: "Indigency of Barangay (Optional Supporting Document)",
                            filename: "barangay_indigency_cert.jpg",
                            url: docUrl
                          });
                        }}
                        className="p-3 rounded-xl bg-[#0d1830] hover:bg-[#15264a] border border-slate-700/80 flex items-center justify-between transition-all group text-left cursor-pointer shadow-md"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <Building2 className="w-4 h-4 text-slate-300 shrink-0" />
                          <div className="truncate">
                            <span className="text-[11px] font-extrabold text-white block truncate">
                              INDIGENCY OF BARANGAY (OPTIONAL)
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono block">
                              Barangay Certificate of Indigency (optional supporting document)
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-white flex items-center gap-1 shrink-0">
                          <span>View Document</span>
                          <ExternalLink className="w-3 h-3 text-slate-300" />
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* STEP 1: SECTOR / COURSE VERIFICATION (LIVELIHOOD) */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 space-y-3">
                    <span className="text-[11px] font-extrabold text-slate-200 uppercase tracking-wider block border-b border-slate-800 pb-1.5 flex items-center justify-between">
                      <span>LIVELIHOOD SECTOR & BUSINESS VERIFICATION</span>
                      <span className="text-[9px] font-mono text-slate-400">INPUTTED BY USER</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold uppercase block">Sector Classification</span>
                        <div className="font-extrabold text-white mt-0.5 text-xs">{selectedApp.sector || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold uppercase block">Employment Status</span>
                        <div className="font-bold text-white mt-0.5 text-xs">{selectedApp.employment_status || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold uppercase block">Has Existing Business?</span>
                        <div className="font-bold text-white mt-0.5 text-xs">{selectedApp.has_existing_business || 'No'}</div>
                      </div>
                      {selectedApp.has_existing_business === 'Yes' && (
                        <>
                          <div>
                            <span className="text-slate-400 text-[10px] font-semibold uppercase block">Type of Business</span>
                            <div className="font-bold text-white mt-0.5 text-xs">{selectedApp.type_of_business || 'N/A'}</div>
                          </div>
                          {selectedApp.type_of_business === 'Other' && (
                            <div className="sm:col-span-2">
                              <span className="text-slate-400 text-[10px] font-semibold uppercase block text-amber-400">Specified Other Business</span>
                              <div className="font-bold text-amber-300 mt-0.5 text-xs">{selectedApp.specified_other_business || 'N/A'}</div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* STEP 2: APPLICANT PERSONAL INFORMATION & ASSISTANCE DETAILS (LIVELIHOOD) */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 space-y-4">
                    <span className="text-[11px] font-extrabold text-slate-200 uppercase tracking-wider block border-b border-slate-800 pb-1.5 flex items-center justify-between">
                      <span>APPLICANT PERSONAL INFORMATION & ASSISTANCE TYPE</span>
                      <span className="text-[9px] font-mono text-slate-400">VERIFIED QCITIZEN PROFILE</span>
                    </span>

                    {/* Personal Profile Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold uppercase block">First Name</span>
                        <div className="font-bold text-white text-xs mt-0.5">{selectedApp.first_name || selectedApp.applicant_name.split(' ')[0]}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold uppercase block">Middle Name</span>
                        <div className="font-bold text-white text-xs mt-0.5">{selectedApp.middle_name || 'FERNANDO'}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold uppercase block">Last Name</span>
                        <div className="font-bold text-white text-xs mt-0.5">{selectedApp.last_name || selectedApp.applicant_name.split(' ').pop()}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold uppercase block">Suffix</span>
                        <div className="font-semibold text-slate-300 text-xs mt-0.5">{selectedApp.suffix || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold uppercase block">Nationality</span>
                        <div className="font-semibold text-slate-300 text-xs mt-0.5">{selectedApp.nationality || 'FILIPINO'}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold uppercase block">Date of Birth</span>
                        <div className="font-mono text-slate-200 text-xs mt-0.5">{selectedApp.dob || '2004-09-27'}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold uppercase block">Age</span>
                        <div className="font-bold text-slate-200 text-xs mt-0.5">{selectedApp.age || '22'} yrs old</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold uppercase block">Gender</span>
                        <div className="font-semibold text-slate-300 text-xs mt-0.5">{selectedApp.gender || 'Male'}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold uppercase block">Civil Status</span>
                        <div className="font-semibold text-slate-300 text-xs mt-0.5">{selectedApp.civil_status || 'Single'}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold uppercase block">Blood Type</span>
                        <div className="font-semibold text-slate-300 text-xs mt-0.5">{selectedApp.blood_type || 'O+'}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold uppercase block">House / Bldg No.</span>
                        <div className="font-semibold text-slate-300 text-xs mt-0.5">{selectedApp.house_no || '176'}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold uppercase block">Barangay</span>
                        <div className="font-bold text-slate-200 text-xs mt-0.5">{selectedApp.barangay || 'Bagong Silangan'}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold uppercase block">Phone Number</span>
                        <div className="font-mono font-bold text-slate-200 text-xs mt-0.5">{selectedApp.phone_number || '09155582122'}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold uppercase block">Email Address</span>
                        <div className="font-mono text-slate-300 text-xs mt-0.5 truncate">{selectedApp.email_address || 'jeffersonlee1234@gmail.com'}</div>
                      </div>
                    </div>

                    {/* Assistance Sub-Card */}
                    <div className="pt-3 border-t border-slate-800/80 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-slate-400 text-[9px] uppercase font-semibold block">Requested Assistance Type:</span>
                          <div className="font-bold text-white text-xs mt-0.5">{selectedApp.assistance_type || 'Financial / Capital Assistance'}</div>
                        </div>
                        {selectedApp.assistance_type !== 'Materials / Supplies' && (
                          <div>
                            <span className="text-slate-400 text-[9px] uppercase font-semibold block">Approved Capital Grant:</span>
                            <div className="font-black text-white text-xs mt-0.5">₱{(selectedApp.amount || 15000).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                          </div>
                        )}
                      </div>

                      {selectedApp.assistance_type === 'Materials / Supplies' && selectedApp.requested_materials_items && (
                        <div className="pt-2 border-t border-slate-800/80">
                          <span className="text-slate-400 text-[9px] uppercase font-semibold block mb-1">Itemized Materials & Supplies List:</span>
                          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pb-1.5 mb-1 border-b border-slate-800/80">
                              <span>Item Name / Description</span>
                              <span>Quantity / Set</span>
                            </div>
                            {Array.isArray(selectedApp.requested_materials_items) && selectedApp.requested_materials_items.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-xs text-slate-200 py-0.5">
                                <span>{item.name || item.item || 'Item'}</span>
                                <span className="font-semibold text-slate-300">{item.quantity || '1 set'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-800/80">
                        <span className="text-slate-400 text-[9px] uppercase font-semibold block mb-1">Reason / Purpose of Assistance:</span>
                        <p className="text-slate-200 text-xs italic bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                          "{selectedApp.reason_for_assistance || selectedApp.details?.reasonPurpose || 'To support micro-enterprise business capital expansion.'}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* STEP 3: UPLOADED DOCUMENTS INSPECTION (LIVELIHOOD) */}
                  <div className="p-4 rounded-xl bg-[#091124] border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="text-[11px] font-extrabold text-slate-200 uppercase tracking-wider">
                        UPLOADED REQUIREMENTS (CLICK TO INSPECT)
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {/* Doc 1: Valid ID / QCID */}
                      <button
                        type="button"
                        onClick={() => {
                          const doc = selectedApp.uploaded_documents?.valid_id;
                          setInspectingDoc({
                            title: "Valid Government ID / QCID Card",
                            filename: doc?.name || "qcid_identity_proof.jpg",
                            url: doc?.url
                          });
                        }}
                        className="p-3 rounded-xl bg-[#0d1830] hover:bg-[#15264a] border border-slate-700/80 flex items-center justify-between transition-all group text-left cursor-pointer shadow-md"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div className="truncate">
                            <span className="text-[11px] font-extrabold text-white block truncate">
                              Valid Government ID / QCitizen Card *
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono block">
                              {selectedApp.uploaded_documents?.valid_id
                                ? `✓ Uploaded: ${selectedApp.uploaded_documents.valid_id.name || 'Photo Attached'}`
                                : '✓ Default Valid QC ID Attached'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-blue-400 group-hover:text-blue-300 flex items-center gap-1 shrink-0">
                          <span>View Document</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </button>

                      {/* Doc 2: Proof of Residency */}
                      <button
                        type="button"
                        onClick={() => {
                          const doc = selectedApp.uploaded_documents?.proof_of_residency;
                          setInspectingDoc({
                            title: "Proof of Residency (Barangay Clearance / Utility Bill)",
                            filename: doc?.name || "barangay_residency_cert.pdf",
                            url: doc?.url
                          });
                        }}
                        className="p-3 rounded-xl bg-[#0d1830] hover:bg-[#15264a] border border-slate-700/80 flex items-center justify-between transition-all group text-left cursor-pointer shadow-md"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                          <div className="truncate">
                            <span className="text-[11px] font-extrabold text-white block truncate">
                              Proof of Residency (Barangay Clearance) *
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono block">
                              {selectedApp.uploaded_documents?.proof_of_residency
                                ? `✓ Uploaded: ${selectedApp.uploaded_documents.proof_of_residency.name || 'Photo Attached'}`
                                : '✓ Default Barangay Clearance Attached'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-blue-400 group-hover:text-blue-300 flex items-center gap-1 shrink-0">
                          <span>View Document</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </button>

                      {/* Doc 3: Other Supporting Documents */}
                      <button
                        type="button"
                        onClick={() => {
                          const doc = selectedApp.uploaded_documents?.other_documents;
                          setInspectingDoc({
                            title: "Other Supporting Documents (Permits / Quotations)",
                            filename: doc?.name || "business_permit_quotation.jpg",
                            url: doc?.url
                          });
                        }}
                        className="p-3 rounded-xl bg-[#0d1830] hover:bg-[#15264a] border border-slate-700/80 flex items-center justify-between transition-all group text-left cursor-pointer shadow-md"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                          <div className="truncate">
                            <span className="text-[11px] font-extrabold text-white block truncate">
                              Other Supporting Documents (Business Permit / Quotations)
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono block">
                              {selectedApp.uploaded_documents?.other_documents
                                ? `✓ Uploaded: ${selectedApp.uploaded_documents.other_documents.name || 'Photo Attached'}`
                                : 'Optional Document / Uploaded'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-blue-400 group-hover:text-blue-300 flex items-center gap-1 shrink-0">
                          <span>View Document</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-5 bg-[#121e36] border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
              {(() => {
                const st = (selectedApp.status || '').toUpperCase();
                const isApproved = st.includes('APPROV') || st.includes('SCHEDULED') || st.includes('RELEASED') || st.includes('COMPLETED') || st.includes('QUALIFIED') || st.includes('ENROLLED') || st.includes('ORIENT');
                const isRejected = st.includes('REJECT') || st.includes('DISAPPROV') || st.includes('UNQUALIFIED');

                if (isApproved) {
                  return (
                    <span className="px-4 py-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-extrabold text-xs rounded-xl inline-flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Approved (Forwarded to Appointments Module)</span>
                    </span>
                  );
                }

                if (isRejected) {
                  return (
                    <span className="px-4 py-2 bg-rose-950/80 border border-rose-500/40 text-rose-300 font-extrabold text-xs rounded-xl inline-flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Application Disapproved</span>
                    </span>
                  );
                }

                return (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAppToReject(selectedApp);
                        setShowRejectModal(true);
                      }}
                      className="px-4 py-2.5 bg-rose-950 hover:bg-rose-900 text-rose-300 text-xs font-bold rounded-xl border border-rose-800 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Disapprove Application</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateStatus(selectedApp, 'APPROVED BY ADMIN');
                        setSelectedApp(null);
                      }}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-md uppercase tracking-wider"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Initial Approve & Schedule Interview</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DOCUMENT INSPECTOR PREVIEW SUB-MODAL */}
      {inspectingDoc && createPortal(
        <div className="fixed inset-0 z-[100000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full rounded-3xl border border-slate-800 bg-[#0e172a] text-white p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-blue-400">{inspectingDoc.title}</h3>
                <span className="text-xs font-mono text-slate-400">{inspectingDoc.filename}</span>
              </div>
              <button
                type="button"
                onClick={() => setInspectingDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-center min-h-[300px] max-h-[500px] overflow-hidden">
              {inspectingDoc.url && (inspectingDoc.url.startsWith('http') || inspectingDoc.url.startsWith('data:') || inspectingDoc.url.startsWith('blob:')) ? (
                <img
                  src={inspectingDoc.url}
                  alt={inspectingDoc.title}
                  className="max-h-[460px] w-auto object-contain rounded-xl shadow-md"
                />
              ) : (
                <div className="text-center space-y-3 p-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto shadow-md">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-sm font-extrabold text-white block">{inspectingDoc.title}</span>
                    <span className="text-xs font-mono text-slate-400 block mt-1">{inspectingDoc.filename}</span>
                  </div>
                  <span className="inline-block text-[11px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-full">
                    ✓ Verified QCitizen Document Submitted
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Original document copy archived and verified by QC SSDD System
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 font-mono">QCitizen Document Verification System</span>
              <button
                type="button"
                onClick={() => setInspectingDoc(null)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* REJECT REASON MODAL */}
      {showRejectModal && appToReject && createPortal(
        <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-[#0d1627] text-white p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-rose-400 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                <span>Disapprove Livelihood Application</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Please state the specific reason for rejecting the Livelihood application of <strong>{appToReject.applicant_name}</strong>:
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Incomplete Barangay Clearance, blurry Valid ID attachment, or unqualified business proposal..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-[#0b1220] border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!rejectReason.trim()}
                onClick={handleConfirmReject}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${
                  rejectReason.trim()
                    ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                Confirm Disapproval
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
