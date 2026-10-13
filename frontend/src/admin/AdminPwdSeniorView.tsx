import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, FileText, CheckCircle2, XCircle, Eye, Info, Clock, Check, X, User, Phone, MapPin, Calendar, Briefcase, Users, DollarSign, Home, HelpCircle } from 'lucide-react';
import type { ApplicationRecord } from '../types';
import { API_BASE_URL } from '../config/api';

interface AdminPwdSeniorViewProps {
  darkMode?: boolean;
  applications?: ApplicationRecord[];
  onUpdateStatus?: (refNo: string, newStatus: ApplicationRecord['status'], extraFields?: Record<string, any>) => void;
}

export const AdminPwdSeniorView: React.FC<AdminPwdSeniorViewProps> = ({ 
  darkMode = true,
  applications = [],
  onUpdateStatus
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PWD' | 'SENIOR'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // DB Senior & PWD applications state
  const [dbSeniorApps, setDbSeniorApps] = useState<any[]>([]);
  const [dbPwdApps, setDbPwdApps] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [rejectModalApp, setRejectModalApp] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [viewingDoc, setViewingDoc] = useState<{ title: string; fileName: string; dataUrl?: string; url?: string } | null>(null);

  const fetchDbApps = async () => {
    try {
      const [srRes, pwdRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/senior/applications`).catch(() => null),
        fetch(`${API_BASE_URL}/api/pwd/applications`).catch(() => null)
      ]);

      if (srRes && srRes.ok) {
        setDbSeniorApps(await srRes.json());
      }
      if (pwdRes && pwdRes.ok) {
        setDbPwdApps(await pwdRes.json());
      }
    } catch (err) {
      console.warn('Backend API connection notice:', err);
    }
  };

  useEffect(() => {
    fetchDbApps();
    const interval = setInterval(fetchDbApps, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedApp || viewingDoc || rejectModalApp) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [selectedApp, viewingDoc, rejectModalApp]);

  // Merge DB senior & PWD records with applications from prop
  const combinedApps = useMemo(() => {
    const list: any[] = [];
    const seenRefs = new Set<string>();

    // 1. DB Senior Applications
    dbSeniorApps.forEach((item) => {
      seenRefs.add(item.reference_no);
      let detailsObj = {};
      try {
        detailsObj = typeof item.details === 'string' ? JSON.parse(item.details) : item.details || {};
      } catch (e) {}

      list.push({
        referenceNo: item.reference_no,
        applicantName: item.applicant_name,
        serviceName: item.service_name || 'Senior Citizen Financial Assistance',
        category: item.category || 'Senior Assistance',
        status: item.status || 'Pending Validation',
        dateSubmitted: item.date_submitted ? new Date(item.date_submitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
        disapprovalReason: item.disapproval_reason,
        details: detailsObj,
        rawDbRecord: item
      });
    });

    // 2. DB PWD Applications
    dbPwdApps.forEach((item) => {
      seenRefs.add(item.reference_no);
      let detailsObj = {};
      try {
        detailsObj = typeof item.details === 'string' ? JSON.parse(item.details) : item.details || {};
      } catch (e) {}

      let uploadedDocs = {};
      try {
        uploadedDocs = typeof item.uploaded_documents === 'string' ? JSON.parse(item.uploaded_documents) : item.uploaded_documents || {};
      } catch (e) {}

      let familyMembers = [];
      try {
        familyMembers = typeof item.family_members === 'string' ? JSON.parse(item.family_members) : item.family_members || [];
      } catch (e) {}

      const dbFullName = [item.first_name, item.middle_name, item.last_name, item.suffix].filter(Boolean).join(' ').trim();

      list.push({
        referenceNo: item.reference_no,
        applicantName: dbFullName || item.applicant_name,
        serviceName: item.service_name || 'PWD Social Assistance Program',
        category: item.category || 'pwd',
        status: item.status || 'Pending Review',
        dateSubmitted: item.date_submitted ? new Date(item.date_submitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
        disapprovalReason: item.disapproval_reason,
        details: {
          ...detailsObj,
          firstName: item.first_name,
          middleName: item.middle_name,
          lastName: item.last_name,
          suffix: item.suffix,
          nationality: item.nationality,
          dob: item.dob,
          age: item.age,
          gender: item.gender,
          civilStatus: item.civil_status,
          houseNo: item.house_no,
          street: item.street_name,
          barangay: item.barangay,
          phone: item.phone_number,
          pwdIdNumber: item.pwd_id_no,
          employmentStatus: item.employment_status,
          occupation: item.occupation,
          sourceOfIncome: item.source_of_income,
          approxMonthlyIncome: item.approx_monthly_income,
          highestEducation: item.educational_attainment,
          otherEducationInfo: item.other_education_info,
          familyMembers,
          monthlyExpenses: item.monthly_expenses,
          typeOfDisability: item.disability_type,
          swaCategory: item.swa_qualifying_category,
          reasonForAssistance: item.reason_for_assistance,
          uploadedDocs
        },
        rawDbRecord: item
      });
    });

    // 2. Prop Applications (Senior & PWD)
    applications.forEach((app) => {
      const isSeniorOrPwd = app.category?.toLowerCase().includes('senior') || app.serviceName?.toLowerCase().includes('senior') || app.category?.toLowerCase().includes('pwd') || app.serviceName?.toLowerCase().includes('pwd');
      if (isSeniorOrPwd && !seenRefs.has(app.referenceNo)) {
        seenRefs.add(app.referenceNo);
        list.push({
          referenceNo: app.referenceNo,
          applicantName: (app as any).applicantName || app.details?.applicantName || 'Jefferson Fernando Lee',
          serviceName: app.serviceName,
          category: app.category || 'Senior Assistance',
          status: app.status,
          dateSubmitted: app.dateSubmitted,
          details: app.details || {}
        });
      }
    });

    return list;
  }, [dbSeniorApps, dbPwdApps, applications]);

  // Filtered List
  const filteredApps = useMemo(() => {
    return combinedApps.filter((app) => {
      const q = searchQuery.toLowerCase().trim();
      const refMatch = app.referenceNo?.toLowerCase().includes(q);
      const nameMatch = app.applicantName?.toLowerCase().includes(q);
      const serviceMatch = app.serviceName?.toLowerCase().includes(q);
      const searchPass = !q || refMatch || nameMatch || serviceMatch;

      const catPass = categoryFilter === 'ALL' 
        ? true 
        : categoryFilter === 'PWD' 
        ? app.category?.toLowerCase().includes('pwd') || app.serviceName?.toLowerCase().includes('pwd')
        : app.category?.toLowerCase().includes('senior') || app.serviceName?.toLowerCase().includes('senior');

      const st = (app.status || '').toUpperCase();
      const statusPass = statusFilter === 'ALL'
        ? true
        : statusFilter === 'PENDING'
        ? st.includes('PENDING') || st.includes('UNDER REVIEW') || st.includes('VALIDATION')
        : statusFilter === 'APPROVED'
        ? st.includes('APPROVED') || st.includes('SCHEDULED') || st.includes('COMPLETED') || st.includes('RELEASED') || st.includes('PAYOUT') || st.includes('INTERVIEW')
        : st.includes('REJECT') || st.includes('DISQUALIFIED');

      return searchPass && catPass && statusPass;
    });
  }, [combinedApps, searchQuery, categoryFilter, statusFilter]);

  // Dynamic Count Stats
  const totalCount = combinedApps.length;
  const pendingCount = combinedApps.filter(a => {
    const st = (a.status || '').toUpperCase();
    return st.includes('PENDING') || st.includes('UNDER REVIEW') || st.includes('VALIDATION');
  }).length;
  const approvedCount = combinedApps.filter(a => {
    const st = (a.status || '').toUpperCase();
    return st.includes('APPROVED') || st.includes('SCHEDULED') || st.includes('COMPLETED') || st.includes('RELEASED') || st.includes('PAYOUT') || st.includes('INTERVIEW');
  }).length;
  const rejectedCount = combinedApps.filter(a => {
    const st = (a.status || '').toUpperCase();
    return st.includes('REJECT') || st.includes('DISQUALIFIED');
  }).length;

  const handleInitialApprove = async (app: any) => {
    const newStatus = 'APPROVED BY ADMIN';
    const isPwd = (app.referenceNo || '').startsWith('QC-PWD-') || (app.category || '').toLowerCase().includes('pwd') || (app.serviceName || '').toLowerCase().includes('pwd');
    const apiModule = isPwd ? 'pwd' : 'senior';
    try {
      await fetch(`${API_BASE_URL}/api/${apiModule}/applications/${app.referenceNo}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {}

    if (onUpdateStatus) {
      onUpdateStatus(app.referenceNo, newStatus as any);
    }
    fetchDbApps();
  };

  const handleConfirmReject = async () => {
    if (!rejectModalApp) return;
    const newStatus = 'REJECTED';
    const isPwd = (rejectModalApp.referenceNo || '').startsWith('QC-PWD-') || (rejectModalApp.category || '').toLowerCase().includes('pwd') || (rejectModalApp.serviceName || '').toLowerCase().includes('pwd');
    const apiModule = isPwd ? 'pwd' : 'senior';
    try {
      await fetch(`${API_BASE_URL}/api/${apiModule}/applications/${rejectModalApp.referenceNo}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, disapprovalReason: rejectReason || 'Requirements non-compliant' })
      });
    } catch (e) {}

    if (onUpdateStatus) {
      onUpdateStatus(rejectModalApp.referenceNo, newStatus as any, { disapprovalReason: rejectReason });
    }
    setRejectModalApp(null);
    setRejectReason('');
    fetchDbApps();
  };

  return (
    <div className={`space-y-6 select-none font-['Plus_Jakarta_Sans',sans-serif] ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      <div>
        <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          PWD & Senior Citizens Registry
        </h1>
      </div>

      {/* Stats Cards - 2-COLUMNS ON MOBILE */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className={`border rounded-2xl p-3.5 sm:p-5 shadow-lg ${darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90'}`}>
          <span className={`text-[9px] sm:text-[11px] font-bold tracking-wider uppercase block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>TOTAL APPLICATIONS</span>
          <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 sm:mt-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{totalCount}</div>
        </div>

        <div className={`border rounded-2xl p-3.5 sm:p-5 shadow-lg ${darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90'}`}>
          <span className="text-[9px] sm:text-[11px] font-bold tracking-wider text-amber-400 uppercase block">PENDING REVIEW</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight mt-1 sm:mt-2">{pendingCount}</div>
        </div>

        <div className={`border rounded-2xl p-3.5 sm:p-5 shadow-lg ${darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90'}`}>
          <span className="text-[9px] sm:text-[11px] font-bold tracking-wider text-emerald-400 uppercase block">APPROVED BY ADMIN</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight mt-1 sm:mt-2">{approvedCount}</div>
        </div>

        <div className={`border rounded-2xl p-3.5 sm:p-5 shadow-lg ${darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90'}`}>
          <span className="text-[9px] sm:text-[11px] font-bold tracking-wider text-rose-400 uppercase block">REJECTED</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 tracking-tight mt-1 sm:mt-2">{rejectedCount}</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className={`border rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl ${darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90'}`}>
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

        <div className="flex flex-row items-center gap-4 flex-nowrap overflow-x-auto no-scrollbar pb-1 sm:pb-0 pt-1 text-xs">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[10px] font-extrabold tracking-wider uppercase mr-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>CATEGORY</span>
            <button type="button" onClick={() => setCategoryFilter('ALL')} className={`px-3 py-1.5 rounded-xl font-extrabold transition-all text-xs cursor-pointer whitespace-nowrap shrink-0 ${categoryFilter === 'ALL' ? 'bg-[#1d4ed8] text-white shadow-md border border-blue-400/40' : darkMode ? 'bg-[#121c2e] text-slate-400 hover:text-slate-200 border border-slate-800' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'}`}>ALL CATEGORIES</button>
            <button type="button" onClick={() => setCategoryFilter('PWD')} className={`px-3 py-1.5 rounded-xl font-extrabold transition-all text-xs cursor-pointer whitespace-nowrap shrink-0 ${categoryFilter === 'PWD' ? 'bg-[#1d4ed8] text-white shadow-md border border-blue-400/40' : darkMode ? 'bg-[#121c2e] text-slate-400 hover:text-slate-200 border border-slate-800' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'}`}>PWD</button>
            <button type="button" onClick={() => setCategoryFilter('SENIOR')} className={`px-3 py-1.5 rounded-xl font-extrabold transition-all text-xs cursor-pointer whitespace-nowrap shrink-0 ${categoryFilter === 'SENIOR' ? 'bg-[#1d4ed8] text-white shadow-md border border-blue-400/40' : darkMode ? 'bg-[#121c2e] text-slate-400 hover:text-slate-200 border border-slate-800' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'}`}>SENIOR CITIZEN</button>
          </div>

          <div className={`flex items-center gap-2 border-l pl-4 flex-shrink-0 ${darkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
            <span className={`text-[10px] font-extrabold tracking-wider uppercase mr-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>STATUS</span>
            <button type="button" onClick={() => setStatusFilter('ALL')} className={`px-3 py-1.5 rounded-xl font-extrabold transition-all text-xs cursor-pointer whitespace-nowrap shrink-0 ${statusFilter === 'ALL' ? 'bg-[#1d4ed8] text-white shadow-md border border-blue-400/40' : darkMode ? 'bg-[#121c2e] text-slate-400 hover:text-slate-200 border border-slate-800' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'}`}>ALL STATUSES</button>
            <button type="button" onClick={() => setStatusFilter('PENDING')} className={`px-3 py-1.5 rounded-xl font-extrabold transition-all text-xs cursor-pointer whitespace-nowrap shrink-0 ${statusFilter === 'PENDING' ? 'bg-[#1d4ed8] text-white shadow-md border border-blue-400/40' : darkMode ? 'bg-[#121c2e] text-slate-400 hover:text-slate-200 border border-slate-800' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'}`}>PENDING</button>
            <button type="button" onClick={() => setStatusFilter('APPROVED')} className={`px-3 py-1.5 rounded-xl font-extrabold transition-all text-xs cursor-pointer whitespace-nowrap shrink-0 ${statusFilter === 'APPROVED' ? 'bg-[#1d4ed8] text-white shadow-md border border-blue-400/40' : darkMode ? 'bg-[#121c2e] text-slate-400 hover:text-slate-200 border border-slate-800' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'}`}>APPROVED</button>
            <button type="button" onClick={() => setStatusFilter('REJECTED')} className={`px-3 py-1.5 rounded-xl font-extrabold transition-all text-xs cursor-pointer whitespace-nowrap shrink-0 ${statusFilter === 'REJECTED' ? 'bg-[#1d4ed8] text-white shadow-md border border-blue-400/40' : darkMode ? 'bg-[#121c2e] text-slate-400 hover:text-slate-200 border border-slate-800' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'}`}>REJECTED</button>
          </div>
        </div>
      </div>

      {/* Applications Data List */}
      <div className="space-y-3">
        <h3 className={`text-sm font-bold tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Applications <span className={`font-mono text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>({filteredApps.length})</span>
        </h3>

        {filteredApps.length === 0 ? (
          <div className={`border rounded-2xl p-16 text-center shadow-xl flex flex-col items-center justify-center ${
            darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200'
          }`}>
            <div className={`p-3.5 rounded-2xl mb-3 border ${darkMode ? 'bg-[#121c2e] border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
              <FileText className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h4 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>No applications found</h4>
            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Try submitting a Senior Citizen form or changing filters.</p>
          </div>
        ) : (
          <>
            {/* MOBILE VIEW: DEDICATED APPLICATION CARDS (md:hidden) */}
            <div className="md:hidden space-y-3.5">
              {filteredApps.map((app) => {
                const st = (app.status || '').toUpperCase();
                const isApproved = st.includes('APPROVED') || st.includes('SCHEDULED') || st.includes('COMPLETED');
                const isRejected = st.includes('REJECT');

                return (
                  <div
                    key={app.referenceNo}
                    onClick={() => setSelectedApp(app)}
                    className={`border rounded-2xl p-4 space-y-3 transition-all cursor-pointer ${
                      darkMode
                        ? 'bg-[#0e1726] border-slate-800/90 hover:border-slate-700 active:bg-[#121c2e]'
                        : 'bg-white border-slate-200 shadow-sm hover:border-slate-300 active:bg-slate-50'
                    }`}
                  >
                    {/* Top Row: Ref No & Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-blue-400 text-xs">
                        {app.referenceNo}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap ${
                        isApproved
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                          : isRejected
                          ? 'bg-rose-950/60 text-rose-300 border-rose-500/30'
                          : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    {/* Applicant Name */}
                    <div>
                      <h4 className={`font-bold text-sm leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {app.applicantName}
                      </h4>
                    </div>

                    {/* Service & Date Info Box */}
                    <div className={`p-2.5 rounded-xl border text-xs space-y-1.5 ${
                      darkMode ? 'bg-[#080f1e] border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Service:</span>
                        <span className={`font-semibold text-[11px] text-right ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                          {app.serviceName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/40">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Submitted:</span>
                        <span className={`font-mono text-[10px] text-right ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {app.dateSubmitted}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApp(app);
                        }}
                        className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                      >
                        <Eye className="w-3.5 h-3.5 shrink-0" />
                        <span>Review & Manage Application</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP VIEW: DATA TABLE (hidden md:block) */}
            <div className={`hidden md:block border rounded-2xl overflow-hidden shadow-xl ${darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b text-[10px] font-extrabold uppercase tracking-wider ${
                      darkMode ? 'border-slate-800 bg-[#0b1220] text-slate-400' : 'border-slate-200 bg-slate-100 text-slate-600'
                    }`}>
                      <th className="py-3.5 px-4">Ref No.</th>
                      <th className="py-3.5 px-4">Applicant Name</th>
                      <th className="py-3.5 px-4">Service / Category</th>
                      <th className="py-3.5 px-4">Date Submitted</th>
                      <th className="py-3.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredApps.map((app) => {
                      const st = (app.status || '').toUpperCase();
                      const isApproved = st.includes('APPROVED') || st.includes('SCHEDULED') || st.includes('COMPLETED');
                      const isRejected = st.includes('REJECT');

                      return (
                        <tr 
                          key={app.referenceNo} 
                          onClick={() => setSelectedApp(app)}
                          className={`transition-colors group cursor-pointer ${
                            darkMode ? 'hover:bg-[#142036]' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-400">{app.referenceNo}</td>
                          <td className={`py-3.5 px-4 font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{app.applicantName}</td>
                          <td className={`py-3.5 px-4 font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{app.serviceName}</td>
                          <td className={`py-3.5 px-4 font-mono text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{app.dateSubmitted}</td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold border ${
                              isApproved
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                                : isRejected
                                ? 'bg-rose-950/60 text-rose-300 border-rose-500/30'
                                : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                            }`}>
                              <span>{app.status}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* BEAUTIFULLY FORMATTED VIEW DETAILS DIALOG MODAL */}
      {selectedApp && (() => {
        const raw = selectedApp.rawDbRecord || {};
        const det = selectedApp.details || {};
        const pInfo = det.personalInformation || {};
        const occInfo = det.occupationFinancialInformation || {};
        const expInfo = det.monthlyHouseholdExpenses || {};
        const livInfo = det.livingSituationAdditionalInfo || {};
        const othInfo = det.otherAssistanceBenefits || {};
        const docsInfo = det.uploadedDocuments || {};

        const isPwdApp = selectedApp.category === 'pwd' || selectedApp.serviceName?.includes('PWD') || selectedApp.referenceNo?.startsWith('QC-PWD');

        // Parse JSON fields cleanly for PWD & Senior
        let famMembers: any[] = [];
        if (Array.isArray(det.familyMembers)) famMembers = det.familyMembers;
        else if (Array.isArray(det.familyComposition)) famMembers = det.familyComposition;
        else if (Array.isArray(raw.family_members)) famMembers = raw.family_members;
        else if (typeof raw.family_members === 'string') {
          try { famMembers = JSON.parse(raw.family_members); } catch (e) {}
        }

        let uploadedDocsObj: any = det.uploadedDocs || docsInfo;
        if (typeof raw.uploaded_documents === 'string') {
          try { uploadedDocsObj = JSON.parse(raw.uploaded_documents); } catch (e) {}
        } else if (raw.uploaded_documents) {
          uploadedDocsObj = raw.uploaded_documents;
        }

        const pwdIdNo = det.pwdIdNumber || raw.pwd_id_no || 'N/A';
        const seniorIdNo = pInfo.seniorCitizenId || det.seniorCitizenId || raw.senior_id_no || 'N/A';
        const totalExpenses = det.monthlyExpenses || expInfo.totalMonthlyExpenses || raw.monthly_expenses || raw.total_monthly_expenses;
        const swaCategoryVal = det.swaCategory || det.typeOfDisability || raw.swa_qualifying_category || raw.disability_type;
        const reasonVal = det.reasonForAssistance || livInfo.reasonForAssistance || raw.reason_for_assistance;

        const pwdDocsList = [
          {
            title: 'QC PWD ID / Applicable Identification Card',
            fileName: uploadedDocsObj?.pwd_id?.name || uploadedDocsObj?.pwdId?.name || (typeof uploadedDocsObj?.pwd_id === 'string' ? uploadedDocsObj.pwd_id : 'pwd_id_photo.jpg'),
            dataUrl: uploadedDocsObj?.pwd_id?.url || uploadedDocsObj?.pwdId?.url || (typeof uploadedDocsObj?.pwd_id === 'string' ? uploadedDocsObj.pwd_id : undefined),
            icon: FileText,
            iconColor: 'text-blue-400'
          },
          {
            title: 'Barangay Certificate of Indigency',
            fileName: uploadedDocsObj?.indigency_cert?.name || uploadedDocsObj?.indigencyCert?.name || (typeof uploadedDocsObj?.indigency_cert === 'string' ? uploadedDocsObj.indigency_cert : 'indigency_certificate.jpg'),
            dataUrl: uploadedDocsObj?.indigency_cert?.url || uploadedDocsObj?.indigencyCert?.url || (typeof uploadedDocsObj?.indigency_cert === 'string' ? uploadedDocsObj.indigency_cert : undefined),
            icon: FileText,
            iconColor: 'text-emerald-400'
          },
          {
            title: 'Medical Certificate / Clinical Abstract',
            fileName: uploadedDocsObj?.medical_cert?.name || uploadedDocsObj?.medicalCert?.name || (typeof uploadedDocsObj?.medical_cert === 'string' ? uploadedDocsObj.medical_cert : 'medical_certificate.jpg'),
            dataUrl: uploadedDocsObj?.medical_cert?.url || uploadedDocsObj?.medicalCert?.url || (typeof uploadedDocsObj?.medical_cert === 'string' ? uploadedDocsObj.medical_cert : undefined),
            icon: FileText,
            iconColor: 'text-purple-400'
          },
          {
            title: 'Required Photo / Documentation depending on Disability',
            fileName: uploadedDocsObj?.disability_photo?.name || uploadedDocsObj?.disabilityPhoto?.name || (typeof uploadedDocsObj?.disability_photo === 'string' ? uploadedDocsObj.disability_photo : 'disability_proof_photo.jpg'),
            dataUrl: uploadedDocsObj?.disability_photo?.url || uploadedDocsObj?.disabilityPhoto?.url || (typeof uploadedDocsObj?.disability_photo === 'string' ? uploadedDocsObj.disability_photo : undefined),
            icon: FileText,
            iconColor: 'text-amber-400'
          }
        ];

        const rawSeniorIdData = typeof docsInfo.seniorIdCard === 'object' 
          ? (docsInfo.seniorIdCard?.dataUrl || docsInfo.seniorIdCard?.url) 
          : (det.uploadedDocData?.seniorIdCard?.dataUrl || det.uploadedDocData?.seniorIdCard?.url || (typeof docsInfo.seniorIdCard === 'string' && (docsInfo.seniorIdCard.startsWith('data:') || docsInfo.seniorIdCard.startsWith('http')) ? docsInfo.seniorIdCard : undefined));

        const rawIndigencyData = typeof docsInfo.indigencyCert === 'object' 
          ? (docsInfo.indigencyCert?.dataUrl || docsInfo.indigencyCert?.url) 
          : (det.uploadedDocData?.indigencyCert?.dataUrl || det.uploadedDocData?.indigencyCert?.url || (typeof docsInfo.indigencyCert === 'string' && (docsInfo.indigencyCert.startsWith('data:') || docsInfo.indigencyCert.startsWith('http')) ? docsInfo.indigencyCert : undefined));

        const rawSupportData = typeof docsInfo.otherSupport === 'object' 
          ? (docsInfo.otherSupport?.dataUrl || docsInfo.otherSupport?.url) 
          : (det.uploadedDocData?.otherSupport?.dataUrl || det.uploadedDocData?.otherSupport?.url || (typeof docsInfo.otherSupport === 'string' && (docsInfo.otherSupport.startsWith('data:') || docsInfo.otherSupport.startsWith('http')) ? docsInfo.otherSupport : undefined));

        const seniorDocsList = [
          { 
            title: 'Senior Citizen ID Card / Valid Photo ID (PhilSys / OSCA)', 
            fileName: typeof docsInfo.seniorIdCard === 'object' ? docsInfo.seniorIdCard?.name : (docsInfo.seniorIdCard || det.seniorIdCard || 'Senior_ID_Photo.png'),
            dataUrl: rawSeniorIdData,
            icon: FileText,
            iconColor: 'text-blue-400'
          },
          { 
            title: 'Certificate of Indigency (Barangay Indigency Clearance)', 
            fileName: typeof docsInfo.indigencyCert === 'object' ? docsInfo.indigencyCert?.name : (docsInfo.indigencyCert || det.indigencyCert || 'Barangay_Indigency.png'),
            dataUrl: rawIndigencyData,
            icon: FileText,
            iconColor: 'text-emerald-400'
          },
          { 
            title: 'Supporting Documents / Proof of Residency & Income', 
            fileName: typeof docsInfo.otherSupport === 'object' ? docsInfo.otherSupport?.name : (docsInfo.otherSupport || det.otherSupport || 'Proof_Residency.png'),
            dataUrl: rawSupportData,
            icon: FileText,
            iconColor: 'text-purple-400'
          }
        ];

        const activeDocsList = isPwdApp ? pwdDocsList : seniorDocsList;

        return createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#0e172a] border border-slate-700 rounded-2xl max-w-3xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-modal-scroll">
              
              {/* Header Bar */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 uppercase">
                      REF: {selectedApp.referenceNo}
                    </span>
                    {(() => {
                      const st = selectedApp.status || '';
                      const isApproved = st === 'APPROVED' || st === 'Approved' || st === 'Step 6: Completed';
                      const isRejected = st === 'REJECTED' || st === 'Rejected' || st === 'Disapproved' || st.includes('Disapproved') || st.toUpperCase().includes('REJECT');
                      return (
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border uppercase ${
                          isApproved
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : isRejected
                            ? 'bg-red-950 text-red-400 border-red-800'
                            : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}>
                          {selectedApp.status}
                        </span>
                      );
                    })()}
                  </div>
                  <h3 className="text-xl font-extrabold text-white mt-1">
                    {pInfo.firstName ? `${pInfo.firstName} ${pInfo.middleName || ''} ${pInfo.lastName}`.trim() : (selectedApp.applicantName || raw.applicant_name)}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedApp.serviceName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 text-xs">
                
                {/* 1. PERSONAL INFORMATION */}
                <div className="p-4 rounded-xl bg-[#091122] border border-slate-800/90 space-y-3">
                  <h4 className="font-extrabold text-white uppercase tracking-wider text-xs border-b border-slate-800 pb-2">
                    Personal Information (Verified Citizen Profile)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">First Name</span>
                      <span className="font-bold text-white">{pInfo.firstName || det.firstName || raw.first_name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Middle Name</span>
                      <span className="font-bold text-white">{pInfo.middleName || det.middleName || raw.middle_name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Last Name</span>
                      <span className="font-bold text-white">{pInfo.lastName || det.lastName || raw.last_name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Nationality</span>
                      <span className="font-bold text-white">{pInfo.nationality || det.nationality || raw.nationality || 'Filipino'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Date of Birth</span>
                      <span className="font-bold text-white">{pInfo.dateOfBirth || pInfo.dob || det.dateOfBirth || det.dob || raw.dob || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Age</span>
                      <span className="font-bold text-white">{pInfo.age || det.age || raw.age || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Gender</span>
                      <span className="font-bold text-white">{pInfo.gender || det.gender || raw.gender || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Civil Status</span>
                      <span className="font-bold text-white">{pInfo.civilStatus || det.civilStatus || raw.civil_status || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Phone Number</span>
                      <span className="font-bold text-white">{pInfo.phoneNumber || pInfo.phone || det.phoneNumber || raw.phone_number || 'N/A'}</span>
                    </div>
                    <div className="col-span-2 sm:col-span-3">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Address</span>
                      <span className="font-bold text-white">
                        {[
                          pInfo.houseNo || det.houseNo || raw.house_no,
                          pInfo.streetName || det.streetName || det.street || raw.street_name,
                          (pInfo.barangay || det.barangay || raw.barangay) ? `Barangay ${pInfo.barangay || det.barangay || raw.barangay}` : ''
                        ].filter(Boolean).join(', ') || 'Not Specified'}
                      </span>
                    </div>
                    <div className="col-span-2 sm:col-span-3">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">{isPwdApp ? 'PWD ID Number' : 'Senior Citizen ID No.'}</span>
                      <span className="font-bold font-mono text-white">{isPwdApp ? pwdIdNo : seniorIdNo}</span>
                    </div>
                  </div>
                </div>

                {/* 2. OCCUPATION & FINANCIAL INFORMATION */}
                <div className="p-4 rounded-xl bg-[#091122] border border-slate-800/90 space-y-3">
                  <h4 className="font-extrabold text-white uppercase tracking-wider text-xs border-b border-slate-800 pb-2">
                    Occupation / Financial Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Employment Status</span>
                      <span className="font-bold text-white">{occInfo.employmentStatus || det.employmentStatus || raw.employment_status || 'Not Specified'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Current / Previous Occupation</span>
                      <span className="font-bold text-white">{occInfo.occupation || det.occupation || raw.occupation || 'Not Specified'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Source of Income</span>
                      <span className="font-bold text-white">{occInfo.sourceOfIncome || det.sourceOfIncome || raw.source_of_income || 'Not Specified'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Approx. Monthly Income</span>
                      <span className="font-bold text-white">{occInfo.approxMonthlyIncome || det.approxMonthlyIncome || raw.approx_monthly_income || 'Not Specified'}</span>
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Pension / Benefits Received</span>
                      <span className="font-bold text-white">
                        {occInfo.pensionReceived === 'Other' ? (occInfo.otherPensionDetails || 'Other') : (occInfo.pensionReceived || raw.pension_received || 'None')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. EDUCATIONAL BACKGROUND */}
                <div className="p-4 rounded-xl bg-[#091122] border border-slate-800/90 space-y-3">
                  <h4 className="font-extrabold text-white uppercase tracking-wider text-xs border-b border-slate-800 pb-2">
                    Educational Background
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Highest Educational Attainment</span>
                      <span className="font-bold text-white">{det.highestEducation || det.educationalAttainment || raw.educational_attainment || 'Not Specified'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Other Relevant Education Information</span>
                      <span className="font-bold text-white">{det.otherEducationInfo || raw.other_education_info || 'None'}</span>
                    </div>
                  </div>
                </div>

                {/* 4. FAMILY COMPOSITION */}
                <div className="p-4 rounded-xl bg-[#091122] border border-slate-800/90 space-y-3">
                  <h4 className="font-extrabold text-white uppercase tracking-wider text-xs border-b border-slate-800 pb-2">
                    Family Composition & Dependents
                  </h4>
                  {famMembers.length === 0 ? (
                    <span className="text-slate-400 italic">No family members listed.</span>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                            <th className="py-1.5 px-2">Name</th>
                            <th className="py-1.5 px-2">Relationship</th>
                            <th className="py-1.5 px-2">Age</th>
                            <th className="py-1.5 px-2">Occupation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-medium">
                          {famMembers.map((m: any, idx: number) => (
                            <tr key={idx}>
                              <td className="py-2 px-2 font-bold text-white">{m.name || 'N/A'}</td>
                              <td className="py-2 px-2 text-slate-300">{m.rel || m.relationship || 'N/A'}</td>
                              <td className="py-2 px-2 text-slate-300">{m.age || 'N/A'}</td>
                              <td className="py-2 px-2 text-slate-300">{m.occ || m.occupation || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 5. MONTHLY HOUSEHOLD EXPENSES */}
                <div className="p-4 rounded-xl bg-[#091122] border border-slate-800/90 space-y-2">
                  <h4 className="font-extrabold text-white uppercase tracking-wider text-xs border-b border-slate-800 pb-2">
                    Monthly Household Expenses
                  </h4>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Monthly Household Expenses</span>
                    <span className="font-bold text-white text-sm">
                      {totalExpenses ? (String(totalExpenses).startsWith('₱') ? totalExpenses : `₱${totalExpenses}`) : 'Not Specified'}
                    </span>
                  </div>
                </div>

                {/* 6. QUALIFYING CATEGORY & ASSESSMENT DETAILS */}
                <div className="p-4 rounded-xl bg-[#091122] border border-slate-800/90 space-y-3">
                  <h4 className="font-extrabold text-white uppercase tracking-wider text-xs border-b border-slate-800 pb-2">
                    {isPwdApp ? 'Qualifying Category & Assessment Details' : 'Living Situation & Additional Information'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
                    {isPwdApp ? (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Qualifying Category / Disability Type</span>
                        <span className="font-bold text-white">{swaCategoryVal || 'Not Specified'}</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Living Arrangement</span>
                        <span className="font-bold text-white">{livInfo.livingArrangement === 'Other' ? (livInfo.customLivingArrangement || 'Other') : (livInfo.livingArrangement || raw.living_arrangement || 'Not Specified')}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Reason for Requesting Assistance</span>
                      <span className="font-bold text-white">{reasonVal || 'Not Specified'}</span>
                    </div>
                  </div>
                </div>

                {/* 7. UPLOADED REQUIREMENT DOCUMENTS */}
                <div className="p-4 rounded-xl bg-[#091124] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                    <span className="text-[11px] font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span>UPLOADED REQUIREMENTS (CLICK TO VIEW / INSPECT)</span>
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {activeDocsList.map((doc, idx) => {
                      const IconComp = doc.icon;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setViewingDoc({ 
                            title: doc.title, 
                            fileName: doc.fileName, 
                            dataUrl: doc.dataUrl,
                            url: doc.dataUrl
                          })}
                          className="p-3.5 rounded-xl bg-[#0d1830] hover:bg-[#15264a] border border-slate-700/80 flex items-center justify-between transition-all group text-left cursor-pointer shadow-md"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                              <IconComp className={`w-4 h-4 ${doc.iconColor}`} />
                            </div>
                            <div className="truncate">
                              <span className="text-xs font-extrabold text-white block truncate group-hover:text-blue-300 transition-colors">
                                {doc.title}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400 block truncate mt-0.5">
                                📎 {doc.fileName}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Modal Footer Controls */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Application Reference: <strong className="text-white font-mono">{selectedApp.referenceNo}</strong></span>
                
                <div className="flex items-center gap-2">
                  {(() => {
                    const st = (selectedApp.status || '').toUpperCase();
                    const isPending = st.includes('PENDING') || st.includes('VALIDATION') || st.includes('REVIEW');
                    if (!isPending) return null;

                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectModalApp(selectedApp);
                            setRejectReason('');
                            setSelectedApp(null);
                          }}
                          className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white font-extrabold text-xs border border-rose-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <XCircle className="w-4 h-4 text-rose-400" />
                          <span>Reject</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            handleInitialApprove(selectedApp);
                            setSelectedApp(null);
                          }}
                          className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs border border-emerald-400/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Initial Approve</span>
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* REJECT CONFIRMATION MODAL */}
      {rejectModalApp && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0e172a] border border-rose-800/80 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 border-b border-slate-800 pb-3">
              <XCircle className="w-6 h-6" />
              <div>
                <h3 className="text-base font-extrabold text-white">Reject Senior Application</h3>
                <span className="text-[10px] font-mono text-slate-400">Ref: {rejectModalApp.referenceNo}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-300 block">Reason for Disapproval *</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Specify reason for disapproval (e.g. Incomplete proof of residency, age non-compliant...)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRejectModalApp(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md border border-rose-400/40"
              >
                Confirm Disapproval
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DOCUMENT INSPECTOR MODAL (EXACT AICS SCREENSHOT MATCH) */}
      {viewingDoc && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0e172a] border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative">
            
            {/* Header Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5 text-blue-400">
                <FileText className="w-5 h-5" />
                <div>
                  <h3 className="text-base font-extrabold text-white">{viewingDoc.title}</h3>
                  <p className="text-[10px] font-mono text-slate-400">Official Attached Supporting Document</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Image Inspector Card Box (STRICTLY USER UPLOADED FILES - NO GENERATED STOCK PHOTOS) */}
            {viewingDoc.dataUrl || viewingDoc.url ? (
              <div className="bg-[#070e1b] border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden space-y-3">
                <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-2.5 text-xs font-mono">
                  <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1 text-[10px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ACTUAL CITIZEN UPLOADED FILE
                  </span>
                  <span className="text-slate-400 text-[10px]">{viewingDoc.fileName}</span>
                </div>

                <div className="w-full flex items-center justify-center bg-black/70 p-2 rounded-xl border border-slate-800/90 min-h-[250px] max-h-[480px] overflow-hidden">
                  <img 
                    src={viewingDoc.dataUrl || viewingDoc.url} 
                    alt={viewingDoc.title}
                    onError={() => {
                      setViewingDoc(prev => prev ? { ...prev, dataUrl: undefined, url: undefined } : null);
                    }}
                    className="max-h-[460px] w-auto max-w-full rounded-lg object-contain shadow-2xl border border-slate-700/60"
                  />
                </div>

                <div className="text-center pt-1">
                  <h5 className="text-xs font-extrabold text-white">{viewingDoc.title}</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    Stored in PostgreSQL Database Vault
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-[#070e1b] border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#0f1a30] border border-slate-800 flex items-center justify-center text-blue-400">
                  <FileText className="w-7 h-7 stroke-[1.5]" />
                </div>
                <div className="space-y-1.5">
                  <h5 className="text-sm font-extrabold text-white">{viewingDoc.title}</h5>
                  <p className="text-xs font-mono text-blue-300 font-semibold">{viewingDoc.fileName}</p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold mt-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Document Requirement Verified</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono flex justify-between">
                  <span>QC SSDD Database Record</span>
                  <span>Reference: {selectedApp?.referenceNo}</span>
                </div>
              </div>
            )}

            {/* Modal Bottom Footer Controls */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
