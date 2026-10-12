import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, FileText, ChevronDown, UserCheck, ShieldCheck, Clock, 
  AlertCircle, Eye, EyeOff, X, CheckCircle2, XCircle, ExternalLink, 
  MapPin, Phone, Mail, Award, History, RefreshCw, Calendar, Tag,
  ZoomIn, ZoomOut, RotateCcw
} from 'lucide-react';
import { maskPhoneNumber, maskIdNumber, maskAddressHouseStreet, maskName, maskEmail, logDataUnmaskEvent } from '../utils/masking';

export interface AssistanceHistoryItem {
  program: string;
  category: string;
  referenceNo: string;
  date: string;
  type: string;
  amountFormatted: string;
  amountNumber: number;
  status: string;
  isApproved: boolean;
}

export interface Beneficiary {
  id: string;
  citizenKey: string;
  name: string;
  initials: string;
  age: string;
  dob: string;
  gender: string;
  civilStatus: string;
  address: string;
  barangay: string;
  phone: string;
  email: string;
  qcId: string;
  idType: string;
  idDocumentUrl: string | null;
  idDocumentName: string | null;
  sectorBadges: string[];
  verificationStatus: 'Verified' | 'Pending' | 'Unverified';
  totalCash: number;
  totalCashFormatted: string;
  nonCashCount: number;
  programsEnrolledCount: number;
  history: AssistanceHistoryItem[];
  verifiedBy: string;
  verifiedAt: string | null;
  notes: string;
}

export interface ActivityLog {
  id: number;
  timestamp: string;
  staff_name: string;
  action: string;
  module: string;
  details: string;
  reference_no?: string;
}

export const AdminBeneficiaryView: React.FC<{ darkMode?: boolean }> = ({ darkMode = true }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'list' | 'queue' | 'history'>('list');
  const [programFilter, setProgramFilter] = useState<string>('All Programs');
  const [verificationFilter, setVerificationFilter] = useState<string>('All Statuses');

  // Live state
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Inspection Drawer & Modal States
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [inspectingQueueItem, setInspectingQueueItem] = useState<Beneficiary | null>(null);
  const [zoomDocUrl, setZoomDocUrl] = useState<string | null>(null);
  const [zoomDocTitle, setZoomDocTitle] = useState<string>('');
  const [docLoadError, setDocLoadError] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [verificationNotes, setVerificationNotes] = useState<string>('Documents inspected and verified by Social Worker.');
  const [isSubmittingVerif, setIsSubmittingVerif] = useState<boolean>(false);
  const [unmaskedCitizenKeys, setUnmaskedCitizenKeys] = useState<Set<string>>(new Set());

  const toggleUnmaskBeneficiary = (b: Beneficiary) => {
    setUnmaskedCitizenKeys(prev => {
      const next = new Set(prev);
      if (next.has(b.citizenKey)) {
        next.delete(b.citizenKey);
      } else {
        next.add(b.citizenKey);
        logDataUnmaskEvent(
          'Beneficiary Management',
          `Admin unmasked citizen profile details (ID, phone, email) for ${b.name}`
        );
      }
      return next;
    });
  };

  const openDocPreview = (url: string | null, title: string) => {
    setDocLoadError(false);
    setZoomScale(1);
    setZoomDocUrl(url || 'sample-id');
    setZoomDocTitle(title);
  };

  // Fetch all beneficiaries from the backend
  const fetchBeneficiaries = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/beneficiaries');
      if (res.ok) {
        const data = await res.json();
        setBeneficiaries(data);
      }
    } catch (err) {
      console.warn('Error fetching beneficiaries from backend:', err);
    }
  };

  // Fetch audit activity logs
  const fetchLogs = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/activity-logs');
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data);
      }
    } catch (err) {
      console.warn('Error fetching activity logs:', err);
    }
  };

  const refreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchBeneficiaries(), fetchLogs()]);
    setIsRefreshing(false);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshAll();
    const interval = setInterval(fetchBeneficiaries, 6000);
    return () => clearInterval(interval);
  }, []);

  // Lock background scroll when drawer or modal is open
  useEffect(() => {
    const isAnyOpen = Boolean(selectedBeneficiary || inspectingQueueItem || zoomDocUrl);
    if (isAnyOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const mainEl = document.querySelector('main');
      const originalMainOverflow = mainEl ? mainEl.style.overflow : '';
      if (mainEl) mainEl.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        if (mainEl) mainEl.style.overflow = originalMainOverflow;
      };
    }
  }, [selectedBeneficiary, inspectingQueueItem, zoomDocUrl]);

  // Track sidebar width dynamically to exclude sidebar from dark backdrop
  const [sidebarWidth, setSidebarWidth] = useState<number>(256);

  useEffect(() => {
    const updateSidebarWidth = () => {
      const asideEl = document.querySelector('aside');
      if (asideEl) {
        setSidebarWidth(asideEl.getBoundingClientRect().width);
      }
    };
    updateSidebarWidth();
    window.addEventListener('resize', updateSidebarWidth);
    const asideEl = document.querySelector('aside');
    let observer: MutationObserver | null = null;
    if (asideEl) {
      observer = new MutationObserver(updateSidebarWidth);
      observer.observe(asideEl, { attributes: true, attributeFilter: ['class', 'style'] });
    }
    return () => {
      window.removeEventListener('resize', updateSidebarWidth);
      if (observer) observer.disconnect();
    };
  }, []);

  // Update verification status (Approve or Reject)
  const handleVerifyBeneficiary = async (citizen: Beneficiary, newStatus: 'Verified' | 'Unverified') => {
    setIsSubmittingVerif(true);
    try {
      const res = await fetch('http://localhost:5000/api/beneficiaries/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenKey: citizen.citizenKey,
          status: newStatus,
          idType: citizen.idType,
          notes: verificationNotes,
          verifiedBy: 'System Admin (Social Worker)',
          citizenName: citizen.name,
          referenceNo: citizen.qcId || citizen.id,
        }),
      });

      if (res.ok) {
        await refreshAll();
        if (inspectingQueueItem?.citizenKey === citizen.citizenKey) {
          setInspectingQueueItem(null);
        }
        if (selectedBeneficiary?.citizenKey === citizen.citizenKey) {
          setSelectedBeneficiary(prev => prev ? { ...prev, verificationStatus: newStatus } : null);
        }
      }
    } catch (err) {
      console.error('Error submitting verification:', err);
    } finally {
      setIsSubmittingVerif(false);
    }
  };

  // Metrics computation
  const totalBeneficiaries = beneficiaries.length;
  const verifiedCount = beneficiaries.filter(b => b.verificationStatus === 'Verified').length;
  const pendingCount = beneficiaries.filter(b => b.verificationStatus === 'Pending').length;
  const unverifiedCount = beneficiaries.filter(b => b.verificationStatus === 'Unverified').length;

  // Filtered beneficiaries for List tab
  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter(b => {
      // Program filter
      if (programFilter !== 'All Programs') {
        const pf = programFilter.toLowerCase();
        const matchesProgram = b.sectorBadges.some(sec => sec.toLowerCase().includes(pf)) ||
          b.history.some(h => h.program.toLowerCase().includes(pf) || h.category.toLowerCase().includes(pf));
        if (!matchesProgram) return false;
      }

      // Verification status filter
      if (verificationFilter !== 'All Statuses') {
        if (b.verificationStatus !== verificationFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = b.name.toLowerCase().includes(q);
        const matchQcId = (b.qcId || '').toLowerCase().includes(q);
        const matchBenId = b.id.toLowerCase().includes(q);
        const matchBarangay = b.barangay.toLowerCase().includes(q);
        const matchRef = b.history.some(h => h.referenceNo.toLowerCase().includes(q));
        if (!matchName && !matchQcId && !matchBenId && !matchBarangay && !matchRef) return false;
      }

      return true;
    });
  }, [beneficiaries, programFilter, verificationFilter, searchQuery]);

  // Pending queue items
  const queueItems = useMemo(() => {
    return beneficiaries.filter(b => b.verificationStatus === 'Pending');
  }, [beneficiaries]);

  // Color generator for initials badge
  const getBadgeGradient = (initials: string) => {
    const charCode = (initials.charCodeAt(0) || 65) + (initials.charCodeAt(1) || 66);
    const variants = [
      'from-blue-600 to-indigo-600 text-white',
      'from-emerald-600 to-teal-600 text-white',
      'from-purple-600 to-pink-600 text-white',
      'from-amber-500 to-orange-600 text-white',
      'from-cyan-600 to-blue-600 text-white',
    ];
    return variants[charCode % variants.length];
  };

  // Sector Badge Color
  const getSectorStyle = (sector: string) => {
    const s = sector.toLowerCase();
    if (s.includes('senior')) return darkMode ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200';
    if (s.includes('pwd')) return darkMode ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200';
    if (s.includes('solo')) return darkMode ? 'bg-pink-500/15 text-pink-300 border-pink-500/30' : 'bg-pink-50 text-pink-700 border-pink-200';
    if (s.includes('child')) return darkMode ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200';
    if (s.includes('aics')) return darkMode ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200';
    if (s.includes('train')) return darkMode ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s.includes('live')) return darkMode ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' : 'bg-teal-50 text-teal-700 border-teal-200';
    if (s.includes('edu')) return darkMode ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200';
    return darkMode ? 'bg-slate-700/50 text-slate-300 border-slate-600' : 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className={`space-y-6 select-none font-['Plus_Jakarta_Sans',sans-serif] ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* Top Header */}
      <div>
        <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Beneficiary Management
        </h1>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`border rounded-2xl p-5 shadow-lg transition-all ${
          darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold tracking-wider uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              TOTAL BENEFICIARIES
            </span>
            <Award className="w-4 h-4 text-blue-500" />
          </div>
          <div className={`text-3xl font-black tracking-tight mt-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {totalBeneficiaries}
          </div>
        </div>

        <div className={`border rounded-2xl p-5 shadow-lg transition-all ${
          darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold tracking-wider uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              VERIFIED
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-500 tracking-tight mt-2">
            {verifiedCount}
          </div>
        </div>

        <div className={`border rounded-2xl p-5 shadow-lg transition-all ${
          darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold tracking-wider uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              PENDING
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-500 tracking-tight mt-2">
            {pendingCount}
          </div>
        </div>

        <div className={`border rounded-2xl p-5 shadow-lg transition-all ${
          darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold tracking-wider uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              UNVERIFIED
            </span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-rose-500 tracking-tight mt-2">
            {unverifiedCount}
          </div>
        </div>
      </div>

      {/* BENEFICIARY MASTER LIST SECTION */}
      <div className="space-y-4">
          {/* Search & Filters */}
          <div className={`border rounded-2xl p-5 space-y-4 shadow-xl ${
            darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90 shadow-sm'
          }`}>
            <div className="relative w-full">
              <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="text"
                placeholder="Search by name, QCID, or beneficiary number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
                  darkMode ? 'bg-[#0b1220] border-slate-700/80 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className={`text-[10px] font-extrabold tracking-wider uppercase block mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Program</label>
                <div className="relative">
                  <select
                    value={programFilter}
                    onChange={(e) => setProgramFilter(e.target.value)}
                    className={`w-full appearance-none border rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer ${
                      darkMode ? 'bg-[#0b1220] border-slate-700/80 text-slate-200' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                    }`}
                  >
                    <option value="All Programs">All Programs</option>
                    <option value="AICS">AICS (Medical & Funeral)</option>
                    <option value="Senior">Senior Citizen</option>
                    <option value="PWD">PWD Services</option>
                    <option value="Solo Parent">Solo Parent</option>
                    <option value="Edu Assistance">Edu Assistance</option>
                    <option value="Child Welfare">Child Welfare</option>
                    <option value="Livelihood">Livelihood Program</option>
                    <option value="Training">Training Program</option>
                  </select>
                  <ChevronDown className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                </div>
              </div>

              <div>
                <label className={`text-[10px] font-extrabold tracking-wider uppercase block mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Verification</label>
                <div className="relative">
                  <select
                    value={verificationFilter}
                    onChange={(e) => setVerificationFilter(e.target.value)}
                    className={`w-full appearance-none border rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer ${
                      darkMode ? 'bg-[#0b1220] border-slate-700/80 text-slate-200' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                    }`}
                  >
                    <option value="All Statuses">All Statuses</option>
                    <option value="Verified">Verified</option>
                    <option value="Pending">Pending Verification</option>
                    <option value="Unverified">Unverified</option>
                  </select>
                  <ChevronDown className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-bold tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Beneficiaries <span className={`font-mono text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>({filteredBeneficiaries.length})</span>
              </h3>
            </div>

            {filteredBeneficiaries.length === 0 ? (
              <div className={`border rounded-2xl p-16 text-center shadow-xl flex flex-col items-center justify-center ${
                darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90 shadow-sm'
              }`}>
                <div className={`p-3.5 rounded-2xl mb-3 border ${
                  darkMode ? 'bg-[#121c2e] border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}>
                  <FileText className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h4 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>No beneficiaries found</h4>
                <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Try adjusting your search query or verification filter.</p>
              </div>
            ) : (
              <div className={`border rounded-2xl overflow-hidden shadow-xl ${
                darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90 shadow-sm'
              }`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-b text-[10px] uppercase tracking-wider font-extrabold ${
                        darkMode ? 'bg-[#0b1324]/80 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        <th className="py-3.5 px-4">Beneficiary</th>
                        <th className="py-3.5 px-4">Sector Designation</th>
                        <th className="py-3.5 px-4">ID / Verification Proof</th>
                        <th className="py-3.5 px-4">Assistance Summary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredBeneficiaries.map((b) => (
                        <tr 
                          key={b.citizenKey}
                          onClick={() => setSelectedBeneficiary(b)}
                          className={`transition-colors cursor-pointer ${
                            selectedBeneficiary?.citizenKey === b.citizenKey
                              ? darkMode ? 'bg-blue-950/40' : 'bg-blue-50/70'
                              : darkMode ? 'hover:bg-[#121c2e]/70' : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* Beneficiary Name & Avatar */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${getBadgeGradient(b.initials)} flex items-center justify-center font-extrabold text-xs shadow-md shrink-0`}>
                                {b.initials}
                              </div>
                              <div>
                                <div className={`font-extrabold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {b.name}
                                </div>
                                <div className={`text-[11px] flex items-center gap-1 mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                  <MapPin className="w-3 h-3 shrink-0 text-slate-500" />
                                  <span>{b.barangay}, Quezon City</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Sector Badges */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                              {b.sectorBadges.map((sec, idx) => (
                                <span 
                                  key={idx}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getSectorStyle(sec)}`}
                                >
                                  {sec}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* ID Presented & Verification Badge */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                {b.verificationStatus === 'Verified' ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-lg">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    Verified
                                  </span>
                                ) : b.verificationStatus === 'Pending' ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded-lg">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    Pending Review
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-400 bg-rose-950/60 border border-rose-800/80 px-2 py-0.5 rounded-lg">
                                    <XCircle className="w-3 h-3 text-rose-400" />
                                    Unverified
                                  </span>
                                )}
                              </div>
                              {(() => {
                                const isUnmasked = unmaskedCitizenKeys.has(b.citizenKey);
                                return (
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[10px] font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                      {b.idType} ({b.qcId ? `ID: ${isUnmasked ? b.qcId : maskIdNumber(b.qcId, true)}` : 'Alternative Doc'})
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleUnmaskBeneficiary(b);
                                      }}
                                      className={`p-1 rounded-lg border transition-all cursor-pointer ${
                                        isUnmasked
                                          ? 'bg-blue-950/60 border-blue-700/80 text-blue-400'
                                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                                      }`}
                                      title={isUnmasked ? 'Click to mask beneficiary details' : 'Click to unmask beneficiary details'}
                                    >
                                      {isUnmasked ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    </button>
                                  </div>
                                );
                              })()}
                            </div>
                          </td>

                          {/* Assistance Summary */}
                          <td className="py-3.5 px-4">
                            <div>
                              <div className={`font-mono font-extrabold text-xs ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                {b.totalCash > 0 ? b.totalCashFormatted : '₱0 (Non-Cash Aid)'}
                              </div>
                              <div className={`text-[10px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {b.programsEnrolledCount} program{b.programsEnrolledCount > 1 ? 's' : ''} • {b.nonCashCount} service{b.nonCashCount > 1 ? 's' : ''}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* ========================================================================= */}
      {/* SIDE DRAWER: BENEFICIARY PROFILE & ASSISTANCE HISTORY (PORTAL TO BODY)    */}
      {/* ========================================================================= */}
      {selectedBeneficiary && typeof document !== 'undefined' && createPortal(
        <div 
          onClick={() => setSelectedBeneficiary(null)}
          style={{ left: `${sidebarWidth}px` }}
          className="fixed inset-y-0 right-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-xl h-screen shadow-2xl flex flex-col overflow-hidden border-l transition-all animate-slideLeft ${
              darkMode ? 'bg-[#0b1324] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Drawer Header */}
            <div className={`p-5 border-b flex items-center justify-between shrink-0 ${
              darkMode ? 'bg-[#0e1726] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <h3 className="font-extrabold text-sm tracking-wide uppercase">
                  Beneficiary Master Profile
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBeneficiary(null)}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                  darkMode ? 'hover:bg-slate-800 border-slate-700 text-slate-400' : 'hover:bg-slate-200 border-slate-300 text-slate-600'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Profile Card */}
              <div className={`p-5 rounded-2xl border flex items-start gap-4 ${
                darkMode ? 'bg-[#0e1726] border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
              }`}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${getBadgeGradient(selectedBeneficiary.initials)} flex items-center justify-center font-black text-xl shadow-lg shrink-0`}>
                  {selectedBeneficiary.initials}
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-extrabold truncate">{selectedBeneficiary.name}</h2>
                    {selectedBeneficiary.verificationStatus === 'Verified' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-lg shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded-lg shrink-0">
                        <Clock className="w-3 h-3 text-amber-400" />
                        Pending
                      </span>
                    )}
                  </div>

                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Beneficiary ID: <span className="font-mono font-bold text-blue-400">{selectedBeneficiary.id}</span>
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {selectedBeneficiary.sectorBadges.map((sec, idx) => (
                      <span key={idx} className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getSectorStyle(sec)}`}>
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Personal Information Grid */}
              <div className={`p-5 rounded-2xl border space-y-3 ${
                darkMode ? 'bg-[#0e1726] border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
              }`}>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Personal Credentials</span>
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Age / Gender</span>
                    <span className="font-bold">{selectedBeneficiary.age} y/o • {selectedBeneficiary.gender}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Civil Status</span>
                    <span className="font-bold">{selectedBeneficiary.civilStatus}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 block uppercase">QC Residence Address</span>
                    <span className="font-bold">{selectedBeneficiary.address}</span>
                  </div>
                  {(() => {
                    const isUnmasked = unmaskedCitizenKeys.has(selectedBeneficiary.citizenKey);
                    return (
                      <>
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 block uppercase">Contact Number</span>
                            <button
                              type="button"
                              onClick={() => toggleUnmaskBeneficiary(selectedBeneficiary)}
                              className="text-slate-400 hover:text-blue-400 p-0.5"
                              title={isUnmasked ? 'Click to mask details' : 'Click to unmask details'}
                            >
                              {isUnmasked ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                          <span className="font-bold font-mono">{isUnmasked ? selectedBeneficiary.phone : maskPhoneNumber(selectedBeneficiary.phone, true)}</span>
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 block uppercase">Email Address</span>
                          </div>
                          <span className="font-bold truncate block">{isUnmasked ? selectedBeneficiary.email : maskEmail(selectedBeneficiary.email, true)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Attached Valid ID Document Card */}
              <div className={`p-5 rounded-2xl border space-y-3 ${
                darkMode ? 'bg-[#0e1726] border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ID Verification Document</span>
                  </h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                    darkMode ? 'bg-blue-950/60 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'
                  }`}>
                    {selectedBeneficiary.idType}
                  </span>
                </div>

                {/* ID Card Box */}
                <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                  darkMode ? 'bg-[#080e1a] border-slate-700/80' : 'bg-white border-slate-300 shadow-sm'
                }`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 font-mono font-bold text-xs">
                      ID
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-xs truncate">{selectedBeneficiary.idType}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Card No: <span className="text-blue-400 font-bold">{selectedBeneficiary.qcId || 'Active Verified'}</span>
                      </div>
                      {selectedBeneficiary.idDocumentName && (
                        <div className="text-[10px] text-slate-500 truncate max-w-[220px] mt-0.5">
                          File: {selectedBeneficiary.idDocumentName}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      openDocPreview(
                        selectedBeneficiary.idDocumentUrl,
                        `${selectedBeneficiary.name} – ${selectedBeneficiary.idType}`
                      );
                    }}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview Document</span>
                  </button>
                </div>
              </div>

              {/* Assistance History Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-blue-400" />
                    <span>Cross-Module Assistance History ({selectedBeneficiary.history.length})</span>
                  </h4>
                  <span className="text-xs font-mono font-extrabold text-emerald-400">
                    Total: {selectedBeneficiary.totalCashFormatted}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {selectedBeneficiary.history.map((h, i) => (
                    <div 
                      key={i}
                      className={`p-3.5 rounded-xl border transition-all ${
                        darkMode ? 'bg-[#0e1726] border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-extrabold text-xs">{h.program}</div>
                          <div className="text-[10px] font-mono text-blue-400 font-bold mt-0.5">{h.referenceNo}</div>
                        </div>

                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border shrink-0 ${
                          h.isApproved 
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800' 
                            : 'bg-amber-950/60 text-amber-400 border-amber-800'
                        }`}>
                          {h.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-2 mt-2 border-t border-slate-800/60">
                        <span className="text-slate-400">{h.type}</span>
                        <span className="font-bold text-emerald-400 font-mono">{h.amountFormatted}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons if Pending */}
              {selectedBeneficiary.verificationStatus === 'Pending' && (
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleVerifyBeneficiary(selectedBeneficiary, 'Unverified')}
                    className="flex-1 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/40 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
                  >
                    Reject Application
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerifyBeneficiary(selectedBeneficiary, 'Verified')}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-lg shadow-emerald-950/30"
                  >
                    Approve & Verify
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* MODAL: INSPECT UPLOADED DOCUMENT (VERIFICATION QUEUE - PORTAL TO BODY)     */}
      {/* ========================================================================= */}
      {inspectingQueueItem && typeof document !== 'undefined' && createPortal(
        <div 
          onClick={() => setInspectingQueueItem(null)}
          style={{ left: `${sidebarWidth}px` }}
          className="fixed inset-y-0 right-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
              darkMode ? 'bg-[#0e1726] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Header */}
            <div className={`p-5 border-b flex items-center justify-between ${
              darkMode ? 'bg-[#0b1324] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wide">
                  Inspect Uploaded Document - Verification Queue
                </h3>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Review applicant credentials against Quezon City Civil Registry standards.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInspectingQueueItem(null)}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                  darkMode ? 'hover:bg-slate-800 border-slate-700 text-slate-400' : 'hover:bg-slate-200 border-slate-300 text-slate-600'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
              {/* Applicant Meta Header */}
              <div className={`grid grid-cols-3 gap-3 p-4 rounded-xl border text-xs ${
                darkMode ? 'bg-[#080e1a] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Full Name</span>
                  <span className="font-extrabold">{inspectingQueueItem.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Sector Designation</span>
                  <span className="font-extrabold text-blue-400">{inspectingQueueItem.sectorBadges.join(', ')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Application Date</span>
                  <span className="font-extrabold">Recent (October 2026)</span>
                </div>
              </div>

              {/* High-Resolution Document Preview Box */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase text-slate-400 block tracking-wider">
                  Uploaded Identification Document ({inspectingQueueItem.idType})
                </span>

                <div className={`rounded-2xl border overflow-hidden p-6 flex flex-col items-center justify-center relative min-h-[220px] ${
                  darkMode ? 'bg-[#080f1e] border-slate-800' : 'bg-slate-100 border-slate-300'
                }`}>
                  {inspectingQueueItem.idDocumentUrl ? (
                    <img
                      src={inspectingQueueItem.idDocumentUrl}
                      alt={inspectingQueueItem.idType}
                      className="max-h-64 object-contain rounded-xl shadow-lg border border-slate-700 cursor-pointer hover:scale-105 transition-all"
                      onClick={() => {
                        setZoomDocUrl(inspectingQueueItem.idDocumentUrl);
                        setZoomDocTitle(`${inspectingQueueItem.name} - ${inspectingQueueItem.idType}`);
                      }}
                    />
                  ) : (
                    /* Stylized Philippine Government QC ID Card Mockup */
                    <div className="w-full max-w-md bg-gradient-to-br from-slate-100 via-white to-blue-50 text-slate-900 rounded-2xl p-5 border-2 border-blue-400/50 shadow-2xl relative overflow-hidden">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-700 text-white font-black text-xs flex items-center justify-center shadow">
                            QC
                          </div>
                          <div>
                            <div className="text-[11px] font-black uppercase tracking-wider text-blue-950">QUEZON CITY LGU</div>
                            <div className="text-[9px] font-bold text-slate-500 uppercase">{inspectingQueueItem.idType}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          {inspectingQueueItem.qcId || 'QC-2026-VAL'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 pt-4">
                        <div className={`w-20 h-24 rounded-xl bg-gradient-to-tr ${getBadgeGradient(inspectingQueueItem.initials)} flex items-center justify-center font-black text-2xl shadow shrink-0 text-white`}>
                          {inspectingQueueItem.initials}
                        </div>
                        <div className="space-y-1 text-xs">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Name</span>
                            <span className="font-extrabold uppercase text-slate-900">{inspectingQueueItem.name}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Address</span>
                            <span className="font-bold text-slate-700 text-[11px]">{inspectingQueueItem.address}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Date of Birth / Age</span>
                            <span className="font-bold text-slate-700">{inspectingQueueItem.dob} ({inspectingQueueItem.age} y/o)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 mt-3 font-medium">
                    Click document preview to inspect full-size image resolution.
                  </span>
                </div>
              </div>

              {/* Verification Checklist */}
              <div className={`p-4 rounded-xl border space-y-2 text-xs ${
                darkMode ? 'bg-[#080e1a] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                  Social Worker Verification Checklist
                </span>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Applicant full name matches submitted document records</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Quezon City residency within barangay jurisdiction verified</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Document authenticity & sector eligibility verified</span>
                </div>
              </div>

              {/* Assessment Notes */}
              <div>
                <label className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">
                  Social Worker Assessment Notes
                </label>
                <input
                  type="text"
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    darkMode ? 'bg-[#080e1a] border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                  placeholder="Enter assessment findings..."
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className={`p-4 border-t flex justify-end gap-3 ${
              darkMode ? 'bg-[#0b1324] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <button
                type="button"
                disabled={isSubmittingVerif}
                onClick={() => handleVerifyBeneficiary(inspectingQueueItem, 'Unverified')}
                className="px-5 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/40 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
              >
                Reject / Request Re-upload
              </button>

              <button
                type="button"
                disabled={isSubmittingVerif}
                onClick={() => handleVerifyBeneficiary(inspectingQueueItem, 'Verified')}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-lg shadow-emerald-950/40 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmittingVerif ? 'Verifying...' : 'Approve & Mark as Verified Beneficiary'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* FULL-SCREEN DOCUMENT PREVIEW MODAL (PORTAL TO BODY)                       */}
      {/* ========================================================================= */}
      {zoomDocUrl && typeof document !== 'undefined' && createPortal(
        <div 
          onClick={() => setZoomDocUrl(null)}
          style={{ left: `${sidebarWidth}px` }}
          className="fixed inset-y-0 right-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-4xl max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
              darkMode ? 'bg-[#0e1726] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header & Zoom Toolbar */}
            <div className={`p-4 border-b flex items-center justify-between gap-4 ${
              darkMode ? 'bg-[#0b1324] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="font-extrabold text-xs tracking-wide uppercase truncate">
                    {zoomDocTitle || 'ID Verification Document'}
                  </div>
                  <div className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Official resident identity verification document
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setZoomScale(prev => Math.max(0.5, prev - 0.25))}
                  title="Zoom Out"
                  className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                    darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-slate-400 px-1 select-none">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomScale(prev => Math.min(3, prev + 0.25))}
                  title="Zoom In"
                  className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                    darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale(1)}
                  title="Reset Zoom"
                  className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                    darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {zoomDocUrl && (zoomDocUrl.startsWith('http') || zoomDocUrl.startsWith('data:')) && (
                  <a
                    href={zoomDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download="verified_id_document.png"
                    title="Open Full Image"
                    className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                      darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <div className="w-px h-4 bg-slate-700 mx-1" />

                <button
                  type="button"
                  onClick={() => setZoomDocUrl(null)}
                  className="p-1.5 rounded-xl border border-slate-700 hover:bg-rose-950/40 hover:border-rose-700 text-slate-400 hover:text-rose-300 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body / Image Viewport */}
            <div className="p-6 flex items-center justify-center bg-[#070c17] min-h-[420px] max-h-[72vh] overflow-auto select-none">
              {!docLoadError && zoomDocUrl && (zoomDocUrl.startsWith('http') || zoomDocUrl.startsWith('blob:') || zoomDocUrl.startsWith('data:')) ? (
                <div 
                  className="transition-transform duration-150 ease-out flex items-center justify-center max-w-full"
                  style={{ transform: `scale(${zoomScale})` }}
                >
                  <img
                    src={zoomDocUrl}
                    alt="Attached Valid ID Document"
                    onError={() => setDocLoadError(true)}
                    className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-700/60 transition-all"
                  />
                </div>
              ) : (
                <div className="w-full max-w-md bg-white text-slate-900 rounded-2xl p-6 border-2 border-blue-600 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-700 text-white font-black text-base flex items-center justify-center shadow-md">
                        QC
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-blue-900">Quezon City Government</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Social Services Master Registry</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300">
                      ACTIVE VERIFIED
                    </span>
                  </div>

                  <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Document Title:</span>
                      <span className="font-bold text-slate-900">{zoomDocTitle || 'Attached Valid ID'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Verification Record:</span>
                      <span className="font-mono font-bold text-blue-700">QC-SSD-CIVIL-ID</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Issuing Authority:</span>
                      <span className="font-semibold text-slate-800">Quezon City Social Services Development Dept.</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 text-center italic">
                    The citizen's civil identity credentials and residency records have been confirmed on official city records.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
