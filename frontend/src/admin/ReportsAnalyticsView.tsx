import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  TrendingUp, 
  Clock, 
  Wallet, 
  Download, 
  ChevronDown,
  ShieldCheck,
  Award
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface ProgramStats {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
  barColor: string;
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  sharePercent: number;
  approvalPercent: number;
}

interface DisbursementSource {
  id: string;
  name: string;
  amount: number;
  color: string;
  isCashProgram: boolean;
}

interface NormalizedApp {
  id: string;
  referenceNo: string;
  applicantName: string;
  programId: 'aics' | 'senior' | 'pwd' | 'solo_parent' | 'cw_services' | 'cw_edu' | 'livelihood' | 'training';
  status: string;
  date: Date;
  dateSubmittedString: string;
  disbursedAmount: number;
}

interface ReportsAnalyticsViewProps {
  darkMode?: boolean;
  applications?: any[];
}

export const ReportsAnalyticsView: React.FC<ReportsAnalyticsViewProps> = ({ 
  darkMode = true,
  applications = []
}) => {
  // Dropdown Time Range state: 'All Time' | 'This Month' | 'This Quarter' | 'This Year'
  const [timeRange, setTimeRange] = useState<string>('All Time');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  // Live Database states
  const [dbAicsApps, setDbAicsApps] = useState<any[]>([]);
  const [dbSeniorApps, setDbSeniorApps] = useState<any[]>([]);
  const [dbPwdApps, setDbPwdApps] = useState<any[]>([]);
  const [dbSoloApps, setDbSoloApps] = useState<any[]>([]);
  const [dbEduApps, setDbEduApps] = useState<any[]>([]);
  const [dbChildWelfareApps, setDbChildWelfareApps] = useState<any[]>([]);
  const [dbLivelihoodApps, setDbLivelihoodApps] = useState<any[]>([]);
  const [dbTrainingApps, setDbTrainingApps] = useState<any[]>([]);
  const [dbDisbursements, setDbDisbursements] = useState<any[]>([]);

  // Fetch all endpoints
  const fetchAllData = async () => {
    try {
      const [
        aicsRes, seniorRes, pwdRes, soloRes, eduRes, cwRes, liveRes, trainRes, disbRes
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/aics/applications`).catch(() => null),
        fetch(`${API_BASE_URL}/api/senior/applications`).catch(() => null),
        fetch(`${API_BASE_URL}/api/pwd/applications`).catch(() => null),
        fetch(`${API_BASE_URL}/api/solo-parent/applications`).catch(() => null),
        fetch(`${API_BASE_URL}/api/educational/applications`).catch(() => null),
        fetch(`${API_BASE_URL}/api/child-welfare/applications`).catch(() => null),
        fetch(`${API_BASE_URL}/api/livelihood/applications`).catch(() => null),
        fetch(`${API_BASE_URL}/api/training/applications`).catch(() => null),
        fetch(`${API_BASE_URL}/api/financial-aid/disbursements`).catch(() => null),
      ]);

      if (aicsRes && aicsRes.ok) setDbAicsApps(await aicsRes.json());
      if (seniorRes && seniorRes.ok) setDbSeniorApps(await seniorRes.json());
      if (pwdRes && pwdRes.ok) setDbPwdApps(await pwdRes.json());
      if (soloRes && soloRes.ok) setDbSoloApps(await soloRes.json());
      if (eduRes && eduRes.ok) setDbEduApps(await eduRes.json());
      if (cwRes && cwRes.ok) setDbChildWelfareApps(await cwRes.json());
      if (liveRes && liveRes.ok) setDbLivelihoodApps(await liveRes.json());
      if (trainRes && trainRes.ok) setDbTrainingApps(await trainRes.json());
      if (disbRes && disbRes.ok) setDbDisbursements(await disbRes.json());
    } catch (e) {
      console.error('Error fetching analytics datasets:', e);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Helper to parse dates safely
  const parseAppDate = (dateVal?: any): Date => {
    if (!dateVal) return new Date();
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  // Helper status checkers
  const isPendingStatus = (s?: string) => {
    if (!s) return true;
    const st = s.toLowerCase();
    return st.includes('pending') || st.includes('review') || st.includes('submitted') || st.includes('evaluation') || st.includes('validation');
  };

  const isApprovedStatus = (s?: string) => {
    if (!s) return false;
    const st = s.toLowerCase();
    return (
      st.includes('approved') || 
      st.includes('released') || 
      st.includes('completed') || 
      st.includes('payout') || 
      st.includes('scheduled') ||
      st.includes('qualified') ||
      st.includes('enrolled')
    );
  };

  const isRejectedStatus = (s?: string) => {
    if (!s) return false;
    const st = s.toLowerCase();
    return st.includes('reject') || st.includes('declined') || st.includes('disqualified') || st.includes('disapproved');
  };

  // Combine and normalize all records from DB and Props
  const allNormalizedApps = useMemo(() => {
    const list: NormalizedApp[] = [];
    const seenRefs = new Set<string>();

    // 1. AICS (Indigent Guarantee Letters - strictly ₱0 cash disbursement)
    dbAicsApps.forEach(a => {
      const ref = a.reference_no || a.referenceNo || (a.id ? `QC-AICS-2026-${a.id}` : null);
      const isNonAics = ref && (
        ref.startsWith('QC-EDU-') || 
        ref.startsWith('QC-SP-EDU-') || 
        ref.startsWith('CW-') || 
        ref.startsWith('SP-') || 
        ref.startsWith('LVH-') || 
        ref.startsWith('TRN-') || 
        ref.startsWith('QC-PWD-') || 
        ref.startsWith('SENIOR-')
      );
      if (ref && !isNonAics && !seenRefs.has(ref)) {
        seenRefs.add(ref);
        list.push({
          id: `aics-${a.id || ref}`,
          referenceNo: ref,
          applicantName: a.applicant_name || a.applicantName || `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'AICS Beneficiary',
          programId: 'aics',
          status: a.status || 'Pending Review',
          date: parseAppDate(a.date_submitted || a.dateSubmitted || a.created_at),
          dateSubmittedString: a.created_at ? new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
          disbursedAmount: 0 // GL - No cash
        });
      }
    });

    // 2. Senior Citizens (₱3,000 Pension / Financial Aid)
    dbSeniorApps.forEach(s => {
      const ref = s.reference_no || s.application_no || `SENIOR-${s.id}`;
      if (!seenRefs.has(ref)) {
        seenRefs.add(ref);
        list.push({
          id: `senior-${s.id}`,
          referenceNo: ref,
          applicantName: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.applicant_name || 'Senior Citizen',
          programId: 'senior',
          status: s.status || 'Pending Verification',
          date: parseAppDate(s.date_submitted || s.created_at),
          dateSubmittedString: s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
          disbursedAmount: isApprovedStatus(s.status) ? 3000 : 0
        });
      }
    });

    // 3. PWD (₱3,000 Financial Subsidy)
    dbPwdApps.forEach(p => {
      const ref = p.reference_no || `QC-PWD-${p.id}`;
      if (!seenRefs.has(ref)) {
        seenRefs.add(ref);
        list.push({
          id: `pwd-${p.id}`,
          referenceNo: ref,
          applicantName: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.applicant_name || 'PWD Beneficiary',
          programId: 'pwd',
          status: p.status || 'Pending Verification',
          date: parseAppDate(p.date_submitted || p.created_at),
          dateSubmittedString: p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
          disbursedAmount: isApprovedStatus(p.status) ? 3000 : 0
        });
      }
    });

    // 4. Solo Parent (₱1,000 Subsidy)
    dbSoloApps.forEach(sp => {
      const ref = sp.reference_no || `SP-${sp.id}`;
      if (!seenRefs.has(ref)) {
        seenRefs.add(ref);
        list.push({
          id: `solo-${sp.id}`,
          referenceNo: ref,
          applicantName: `${sp.first_name || ''} ${sp.last_name || ''}`.trim() || sp.applicant_name || 'Solo Parent',
          programId: 'solo_parent',
          status: sp.status || 'Pending Document Verification',
          date: parseAppDate(sp.date_submitted || sp.created_at),
          dateSubmittedString: sp.created_at ? new Date(sp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
          disbursedAmount: isApprovedStatus(sp.status) ? (parseFloat(sp.amount) || 3000) : 0
        });
      }
    });

    // 5. Educational Applications (Solo Parent Edu or Child Welfare Educational Aid)
    dbEduApps.forEach(edu => {
      const ref = edu.reference_no || `QC-EDU-${edu.id}`;
      if (!seenRefs.has(ref)) {
        seenRefs.add(ref);
        const isSoloSubsidy = ref.startsWith('SP-') || ref.startsWith('SP-SUBSIDY-');
        const prog: 'cw_edu' | 'solo_parent' = isSoloSubsidy ? 'solo_parent' : 'cw_edu';
        list.push({
          id: `edu-${edu.id}`,
          referenceNo: ref,
          applicantName: `${edu.first_name || ''} ${edu.last_name || ''}`.trim() || edu.applicant_name || 'Student Grantee',
          programId: prog,
          status: edu.status || 'Pending Document Validation',
          date: parseAppDate(edu.date_submitted || edu.created_at),
          dateSubmittedString: edu.created_at ? new Date(edu.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
          disbursedAmount: isApprovedStatus(edu.status) ? 5000 : 0
        });
      }
    });

    // 6. Child Welfare Applications (Educational Aid vs Non-cash Services/Protection)
    dbChildWelfareApps.forEach(cw => {
      const ref = cw.reference_no || `CW-${cw.id}`;
      if (!seenRefs.has(ref)) {
        seenRefs.add(ref);
        const isChildWelfareService = ref.startsWith('QC-CW-') || ref.startsWith('CW-') || (cw.service_name || '').toLowerCase() === 'child welfare services';
        const prog: 'cw_edu' | 'cw_services' = isChildWelfareService ? 'cw_services' : 'cw_edu';
        list.push({
          id: `cw-${cw.id}`,
          referenceNo: ref,
          applicantName: `${cw.first_name || ''} ${cw.last_name || ''}`.trim() || cw.applicant_name || 'Child Welfare Beneficiary',
          programId: prog,
          status: cw.status || 'Pending Assessment',
          date: parseAppDate(cw.date_submitted || cw.created_at),
          dateSubmittedString: cw.created_at ? new Date(cw.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
          disbursedAmount: (prog === 'cw_edu' && isApprovedStatus(cw.status)) ? 5000 : 0
        });
      }
    });

    // 7. Livelihood Assistance (₱15,000 Capital Seed Grant)
    dbLivelihoodApps.forEach(liv => {
      const ref = liv.reference_no || `LVH-${liv.id}`;
      if (!seenRefs.has(ref)) {
        seenRefs.add(ref);
        list.push({
          id: `liv-${liv.id}`,
          referenceNo: ref,
          applicantName: `${liv.first_name || ''} ${liv.last_name || ''}`.trim() || liv.applicant_name || 'Livelihood Grantee',
          programId: 'livelihood',
          status: liv.status || 'Under Review',
          date: parseAppDate(liv.date_submitted || liv.created_at),
          dateSubmittedString: liv.created_at ? new Date(liv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
          disbursedAmount: isApprovedStatus(liv.status) ? 15000 : 0
        });
      }
    });

    // 8. Training Program (Vocational Skills Training - ₱0 non-cash)
    dbTrainingApps.forEach(tr => {
      const ref = tr.reference_no || `TRN-${tr.id}`;
      if (!seenRefs.has(ref)) {
        seenRefs.add(ref);
        list.push({
          id: `trn-${tr.id}`,
          referenceNo: ref,
          applicantName: `${tr.first_name || ''} ${tr.last_name || ''}`.trim() || tr.applicant_name || 'Training Enrollee',
          programId: 'training',
          status: tr.status || 'Pending Enrollment',
          date: parseAppDate(tr.date_submitted || tr.created_at),
          dateSubmittedString: tr.created_at ? new Date(tr.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
          disbursedAmount: 0 // Non-cash vocational course
        });
      }
    });

    return list;
  }, [
    dbAicsApps, dbSeniorApps, dbPwdApps, dbSoloApps, dbEduApps,
    dbChildWelfareApps, dbLivelihoodApps, dbTrainingApps
  ]);

  // Reactive Date Filtering based on Dropdown selection
  const filteredApps = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    const currentQuarter = Math.floor(currentMonth / 3); // 0 (Jan-Mar), 1 (Apr-Jun), 2 (Jul-Sep), 3 (Oct-Dec)

    return allNormalizedApps.filter(app => {
      if (timeRange === 'All Time') return true;
      const appYear = app.date.getFullYear();
      const appMonth = app.date.getMonth();

      if (timeRange === 'This Month') {
        return appYear === currentYear && appMonth === currentMonth;
      }
      if (timeRange === 'This Quarter') {
        const appQuarter = Math.floor(appMonth / 3);
        return appYear === currentYear && appQuarter === currentQuarter;
      }
      if (timeRange === 'This Year') {
        return appYear === currentYear;
      }
      return true;
    });
  }, [allNormalizedApps, timeRange]);

  // Overall KPI Metrics for Filtered Period
  const totalApplications = filteredApps.length;
  const pendingReviewCount = filteredApps.filter(a => isPendingStatus(a.status)).length;
  const approvedCount = filteredApps.filter(a => isApprovedStatus(a.status)).length;
  const rejectedCount = filteredApps.filter(a => isRejectedStatus(a.status)).length;
  const decidedCount = approvedCount + rejectedCount;
  const approvalRate = decidedCount > 0 ? Math.round((approvedCount / decidedCount) * 100) : 100;

  // -------------------------------------------------------------
  // BAHAGI 1: Applications by Program (Donut Chart & Program List)
  // Sinusukat: BILANG NG TAO / APLIKASYON (8 Programs)
  // -------------------------------------------------------------
  const getProgStats = (progId: NormalizedApp['programId']) => {
    const apps = filteredApps.filter(a => a.programId === progId);
    const total = apps.length;
    const pending = apps.filter(a => isPendingStatus(a.status)).length;
    const approved = apps.filter(a => isApprovedStatus(a.status)).length;
    const rejected = apps.filter(a => isRejectedStatus(a.status)).length;
    const sharePercent = totalApplications > 0 ? Math.round((total / totalApplications) * 100) : 0;
    const approvalPercent = (approved + rejected) > 0 ? Math.round((approved / (approved + rejected)) * 100) : 0;
    return { pending, approved, rejected, total, sharePercent, approvalPercent };
  };

  const aicsStats = getProgStats('aics');
  const seniorStats = getProgStats('senior');
  const pwdStats = getProgStats('pwd');
  const soloStats = getProgStats('solo_parent');
  const cwServicesStats = getProgStats('cw_services');
  const cwEduStats = getProgStats('cw_edu');
  const livelihoodStats = getProgStats('livelihood');
  const trainingStats = getProgStats('training');

  const programData: ProgramStats[] = [
    {
      id: 'aics',
      name: 'AICS (Indigent GL)',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 hover:bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      dotColor: '#3b82f6',
      barColor: 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]',
      ...aicsStats
    },
    {
      id: 'senior',
      name: 'Senior Citizens',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 hover:bg-purple-500/20',
      borderColor: 'border-purple-500/30',
      dotColor: '#a855f7',
      barColor: 'bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.5)]',
      ...seniorStats
    },
    {
      id: 'pwd',
      name: 'Persons with Disability (PWD)',
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 hover:bg-indigo-500/20',
      borderColor: 'border-indigo-500/30',
      dotColor: '#6366f1',
      barColor: 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]',
      ...pwdStats
    },
    {
      id: 'solo_parent',
      name: 'Solo Parent Services',
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10 hover:bg-pink-500/20',
      borderColor: 'border-pink-500/30',
      dotColor: '#f43f5e',
      barColor: 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]',
      ...soloStats
    },
    {
      id: 'cw_services',
      name: 'Child Welfare Services (Non-cash)',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 hover:bg-amber-500/20',
      borderColor: 'border-amber-500/30',
      dotColor: '#f59e0b',
      barColor: 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]',
      ...cwServicesStats
    },
    {
      id: 'cw_edu',
      name: 'Child Welfare — Educational Aid',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 hover:bg-cyan-500/20',
      borderColor: 'border-cyan-500/30',
      dotColor: '#06b6d4',
      barColor: 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]',
      ...cwEduStats
    },
    {
      id: 'livelihood',
      name: 'Livelihood Assistance',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20',
      borderColor: 'border-emerald-500/30',
      dotColor: '#10b981',
      barColor: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]',
      ...livelihoodStats
    },
    {
      id: 'training',
      name: 'Training Program',
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/10 hover:bg-teal-500/20',
      borderColor: 'border-teal-500/30',
      dotColor: '#14b8a6',
      barColor: 'bg-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.5)]',
      ...trainingStats
    },
  ];

  // -------------------------------------------------------------
  // BAHAGI 2: Disbursement by Funding Source (Pera / ₱ Lamang)
  // Sinusukat: HALAGA NG PERANG NAIPAMAHAGI (5 Programs Lamang)
  // -------------------------------------------------------------
  const getDisbursedForProgram = (progId: NormalizedApp['programId']) => {
    return filteredApps
      .filter(a => a.programId === progId && isApprovedStatus(a.status))
      .reduce((sum, a) => sum + (a.disbursedAmount || 0), 0);
  };

  const disbursementSources: DisbursementSource[] = [
    {
      id: 'senior',
      name: 'Senior Citizen Financial Assistance',
      amount: getDisbursedForProgram('senior'),
      color: 'bg-purple-500',
      isCashProgram: true
    },
    {
      id: 'pwd',
      name: 'PWD Financial Subsidy',
      amount: getDisbursedForProgram('pwd'),
      color: 'bg-indigo-500',
      isCashProgram: true
    },
    {
      id: 'solo',
      name: 'Solo Parent Subsidy & Grants',
      amount: getDisbursedForProgram('solo_parent'),
      color: 'bg-rose-500',
      isCashProgram: true
    },
    {
      id: 'cw_edu',
      name: 'Child Welfare — Educational Aid',
      amount: getDisbursedForProgram('cw_edu'),
      color: 'bg-cyan-500',
      isCashProgram: true
    },
    {
      id: 'livelihood',
      name: 'Livelihood Capital Grants',
      amount: getDisbursedForProgram('livelihood'),
      color: 'bg-emerald-500',
      isCashProgram: true
    },
  ];

  // Total Disbursed in the selected timeframe (Sum of 5 cash programs)
  const totalDisbursed = disbursementSources.reduce((sum, s) => sum + s.amount, 0);

  // Maximum value for proportional scale (avoiding overflow)
  const maxDisbursementAmount = Math.max(...disbursementSources.map(s => s.amount), 15000);

  // -------------------------------------------------------------
  // BAHAGI 3: Monthly Application Volume & Disbursement (Line & Bar Graph)
  // Light Blue Bars = All 8 Programs count
  // Dark Blue Line = 5 Cash Programs ₱ only
  // -------------------------------------------------------------
  const monthlyVolume = useMemo(() => {
    const monthsBack = 6;
    const result = [];
    const now = new Date();

    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mYear = d.getFullYear();
      const mMonth = d.getMonth();
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' });

      // Match applications submitted in this specific month
      const monthApps = allNormalizedApps.filter(app => {
        return app.date.getFullYear() === mYear && app.date.getMonth() === mMonth;
      });

      const appsCount = monthApps.length;

      // Calculate cash disbursed for this month (5 programs only)
      const disbursedCash = monthApps
        .filter(app => isApprovedStatus(app.status))
        .reduce((sum, app) => sum + (app.disbursedAmount || 0), 0);

      result.push({
        month: monthShort,
        year: mYear,
        applications: appsCount,
        disbursed: disbursedCash,
        isCurrentMonth: i === 0
      });
    }

    const maxMonthlyApps = Math.max(...result.map(r => r.applications), 5);
    return result.map(r => ({
      ...r,
      barHeight: r.applications > 0 ? Math.max(Math.round((r.applications / maxMonthlyApps) * 110), 16) : 0
    }));
  }, [allNormalizedApps]);

  // CSV Export Handler with updated filtered dataset
  const handleExportCSV = () => {
    const csvRows = [
      ['GovServe Social Services Admin - Reports & Analytics Export'],
      ['Generated On', new Date().toLocaleString()],
      ['Timeframe Filter', timeRange],
      [],
      ['KPI SUMMARY'],
      ['Total Applications', totalApplications],
      ['Approval Rate', `${approvalRate}%`],
      ['Pending Review', pendingReviewCount],
      ['Total Cash Disbursed', `PHP ${totalDisbursed.toLocaleString()}`],
      [],
      ['APPLICATIONS BY PROGRAM (VOLUME & DEMAND)'],
      ['Program Name', 'Pending', 'Approved', 'Rejected', 'Total Applications', 'Share %', 'Approval %'],
      ...programData.map(p => [p.name, p.pending, p.approved, p.rejected, p.total, `${p.sharePercent}%`, `${p.approvalPercent}%`]),
      [],
      ['CASH DISBURSEMENT BY FUNDING SOURCE (5 MONETARY PROGRAMS)'],
      ['Program Name', 'Cash Disbursed (PHP)'],
      ...disbursementSources.map(s => [s.name, s.amount]),
      ['Total Cash Disbursed', totalDisbursed],
      ['Non-Cash Services Note', 'AICS Guarantee Letters (GL), Training Courses, and Child Protection Services distribute ₱0 cash direct.'],
      [],
      ['MONTHLY APPLICATION VOLUME & DISBURSEMENT HISTORY'],
      ['Month', 'Total Applications Submitted', 'Cash Disbursed (PHP)'],
      ...monthlyVolume.map(m => [m.month, m.applications, m.disbursed])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GovServe_Reports_Analytics_${timeRange.replace(/\s+/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cardClass = darkMode 
    ? 'bg-[#0e1726] border-slate-800/90 text-white' 
    : 'bg-white border-slate-200/90 text-slate-900 shadow-sm';

  const selectClass = darkMode 
    ? 'bg-[#0f172a] hover:bg-[#16223b] text-slate-200 border-slate-700/80' 
    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300';

  const subTextClass = darkMode ? 'text-slate-400' : 'text-slate-500';

  // SVG Line Chart path generation for disbursed amount across 6 points in viewBox 0 0 500 160
  const maxDisbursedVal = Math.max(...monthlyVolume.map(m => m.disbursed), 30000);
  const svgPoints = monthlyVolume.map((item, idx) => {
    const x = 35 + idx * 86; // 35 (May), 121 (Jun), 207 (Jul), 293 (Aug), 379 (Sep), 465 (Oct)
    const yRatio = maxDisbursedVal > 0 ? (item.disbursed / maxDisbursedVal) : 0;
    const y = 145 - (yRatio * 115); // 145 at ₱0, 30 at max
    return { x, y, ...item };
  });

  const svgPathD = svgPoints.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[i - 1];
    const cpX = (prev.x + pt.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  return (
    <div className={`space-y-6 select-none font-['Plus_Jakarta_Sans',sans-serif] animate-in fade-in slide-in-from-bottom-3 duration-500 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* ------------------------------------------------------------- */}
      {/* HEADER WITH TIME RANGE DROPDOWN & EXPORT CSV */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight flex items-center gap-2.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Reports & Analytics
          </h1>
          <p className={`text-xs mt-1 font-medium ${subTextClass}`}>
            Comprehensive governance dashboard for social assistance volume and fund disbursements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Dropdown Filter */}
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className={`appearance-none rounded-xl px-4 py-2 pr-9 text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-colors border ${selectClass}`}
            >
              <option value="All Time">All Time</option>
              <option value="This Month">This Month</option>
              <option value="This Quarter">This Quarter (3 Months)</option>
              <option value="This Year">This Year (Annual)</option>
            </select>
            <ChevronDown className={`w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${subTextClass}`} />
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-[#1d4ed8] hover:bg-blue-600 text-white border border-blue-400/30 px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TOP KPI SUMMARY CARDS */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Applications */}
        <div className={`${cardClass} border rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all`}>
          <div className="flex items-start justify-between">
            <span className={`text-[11px] font-bold tracking-wider uppercase ${subTextClass}`}>
              TOTAL APPLICATIONS
            </span>
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-slate-800/80 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-3xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {totalApplications}
            </div>
          </div>
        </div>

        {/* Card 2: Approval Rate */}
        <div className={`${cardClass} border rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all`}>
          <div className="flex items-start justify-between">
            <span className={`text-[11px] font-bold tracking-wider uppercase ${subTextClass}`}>
              APPROVAL RATE
            </span>
            <div className={`p-2 rounded-full ${darkMode ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400' : 'bg-emerald-100 border border-emerald-200 text-emerald-600'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#00d285] tracking-tight">
              {approvalRate}%
            </div>
          </div>
        </div>

        {/* Card 3: Pending Review */}
        <div className={`${cardClass} border rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all`}>
          <div className="flex items-start justify-between">
            <span className={`text-[11px] font-bold tracking-wider uppercase ${subTextClass}`}>
              PENDING REVIEW
            </span>
            <div className={`p-2 rounded-full ${darkMode ? 'bg-amber-950/60 border border-amber-500/30 text-amber-400' : 'bg-amber-100 border border-amber-200 text-amber-600'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-orange-500 tracking-tight">
              {pendingReviewCount}
            </div>
          </div>
        </div>

        {/* Card 4: Total Cash Disbursed */}
        <div className={`${cardClass} border rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all`}>
          <div className="flex items-start justify-between">
            <span className={`text-[11px] font-bold tracking-wider uppercase ${subTextClass}`}>
              TOTAL DISBURSED
            </span>
            <div className={`p-2 rounded-full ${darkMode ? 'bg-blue-950/60 border border-blue-500/30 text-blue-400' : 'bg-blue-100 border border-blue-200 text-blue-600'}`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-3xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              ₱{totalDisbursed.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BAHAGI 1: APPLICATIONS BY PROGRAM (DONUT CHART & 8 PROGRAMS) */}
      {/* ------------------------------------------------------------- */}
      <div className={`${cardClass} border rounded-2xl p-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className={`text-sm font-bold tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Applications by program
            </h2>
            <p className={`text-xs mt-0.5 ${subTextClass}`}>
              Citizen demand and submission distribution across all 8 social service modules ({timeRange})
            </p>
          </div>
          <span className={`text-xs font-mono px-2.5 py-1 rounded-lg border ${darkMode ? 'bg-[#121c2e] border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            {totalApplications} Total Applicants
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Donut Chart */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center relative py-4">
            <div className="relative w-52 h-52 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke={darkMode ? "#1e293b" : "#e2e8f0"} strokeWidth="11" />
                {totalApplications > 0 && (() => {
                  let accumulatedOffset = 0;
                  const circumference = 2 * Math.PI * 38; // ~238.76

                  return programData.map((prog) => {
                    if (prog.total === 0) return null;
                    const strokeLen = (prog.total / totalApplications) * circumference;
                    const offset = circumference - strokeLen;
                    const rotateDeg = (accumulatedOffset / circumference) * 360;
                    accumulatedOffset += strokeLen;

                    return (
                      <circle
                        key={prog.id}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={prog.dotColor}
                        strokeWidth="11"
                        strokeDasharray={`${strokeLen} ${circumference - strokeLen}`}
                        strokeDashoffset="0"
                        transform={`rotate(${rotateDeg} 50 50)`}
                        className="transition-all duration-700 ease-out"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className={`text-3xl font-black leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>{totalApplications}</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider mt-1.5 ${subTextClass}`}>
                  Total Applications
                </span>
              </div>
            </div>
          </div>

          {/* Program Breakdown Rows */}
          <div className="lg:col-span-8 space-y-4">
            {programData.map((prog) => (
              <div key={prog.id} className="space-y-1.5 group">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border transition-colors ${prog.bgColor} ${prog.borderColor} ${prog.color}`}>
                      {prog.name}
                    </span>
                    <span className={`text-[11px] font-medium hidden sm:inline ${subTextClass}`}>
                      {prog.approved} approved
                    </span>
                  </div>
                  <div className={`text-[11px] font-medium ${subTextClass}`}>
                    <strong className={darkMode ? 'text-slate-200' : 'text-slate-800'}>{prog.total}</strong> total · {prog.sharePercent}% share · {prog.approvalPercent}% approval
                  </div>
                </div>

                <div className={`w-full rounded-full h-2 overflow-hidden border ${darkMode ? 'bg-[#162032] border-slate-800/60' : 'bg-slate-100 border-slate-200'}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      prog.sharePercent > 0 ? prog.barColor : (darkMode ? 'bg-slate-700/30' : 'bg-slate-300')
                    }`}
                    style={{ width: `${prog.sharePercent > 0 ? prog.sharePercent : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BAHAGI 2 & 3: BOTTOM SPLIT GRID */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ------------------------------------------------------------- */}
        {/* BAHAGI 2: DISBURSEMENT BY FUNDING SOURCE (PERA / ₱ LAMANG) */}
        {/* ------------------------------------------------------------- */}
        <div className={`${cardClass} border rounded-2xl p-6 flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className={`text-sm font-bold tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Disbursement by funding source
                </h2>
                <p className={`text-xs mt-0.5 ${subTextClass}`}>
                  Direct cash assistance released across the 5 monetary programs ({timeRange})
                </p>
              </div>
              <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-950/50 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600'}`}>
                <Award className="w-4 h-4" />
              </div>
            </div>

            {/* 5 Monetary Programs Bars */}
            <div className="space-y-4 my-5">
              {disbursementSources.map((source) => {
                const percent = source.amount > 0 ? Math.min(Math.round((source.amount / maxDisbursementAmount) * 100), 100) : 0;
                return (
                  <div 
                    key={source.id} 
                    className="space-y-1.5"
                    onMouseEnter={() => setHoveredBar(source.id)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    <div className="flex justify-between text-xs font-medium">
                      <span className={`text-[11px] font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {source.name}
                      </span>
                      <span className={`font-mono font-bold text-[11px] ${source.amount > 0 ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') : subTextClass}`}>
                        {source.amount > 0 ? `₱${source.amount.toLocaleString()}` : '₱0'}
                      </span>
                    </div>

                    <div className={`w-full rounded-full h-3 overflow-hidden relative border ${darkMode ? 'bg-[#162032] border-slate-800/60' : 'bg-slate-100 border-slate-200'}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${source.color} ${
                          hoveredBar === source.id ? 'brightness-125' : ''
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scale Indicator */}
            <div className={`border-t pt-2 flex justify-between text-[10px] font-mono ${darkMode ? 'border-slate-800/80 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
              <span>₱0</span>
              <span>₱{Math.round(maxDisbursementAmount * 0.25).toLocaleString()}</span>
              <span>₱{Math.round(maxDisbursementAmount * 0.50).toLocaleString()}</span>
              <span>₱{Math.round(maxDisbursementAmount * 0.75).toLocaleString()}</span>
              <span>₱{maxDisbursementAmount.toLocaleString()}</span>
            </div>

            {/* Non-Cash Programs Notice Box */}
            <div className={`mt-4 p-3 rounded-xl border text-[11px] flex items-start gap-2.5 ${
              darkMode ? 'bg-[#121c2e]/60 border-slate-800/80 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className={darkMode ? 'text-slate-300' : 'text-slate-700'}>Non-cash Services:</strong> AICS Guarantee Letters (GL), Skills Training, and Child Protection Case Services distribute <strong>₱0 direct cash</strong> and are excluded from funding outflows.
              </div>
            </div>
          </div>

          {/* Total Disbursed Footer */}
          <div className={`border-t pt-4 mt-5 flex justify-between items-center text-xs ${darkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
            <span className={`font-bold uppercase tracking-wider text-[11px] ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Total Cash Disbursed
            </span>
            <span className={`font-black text-base tracking-tight font-mono text-emerald-400`}>
              ₱{totalDisbursed.toLocaleString()}
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* BAHAGI 3: MONTHLY APPLICATION VOLUME (LINE & BAR GRAPH) */}
        {/* Light Blue Bars = Applications Count (All 8 Programs) */}
        {/* Dark Blue Curved Line = Disbursed Cash (5 Programs Only) */}
        {/* ------------------------------------------------------------- */}
        <div className={`${cardClass} border rounded-2xl p-6 flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className={`text-sm font-bold tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Monthly application volume
                </h2>
                <p className={`text-xs mt-0.5 ${subTextClass}`}>
                  6-month timeline: Application demand (bars) vs. Total cash disbursed (curved line)
                </p>
              </div>
            </div>

            <div className="relative h-48 w-full pt-4 pb-6 mt-2">
              {/* Background Grid Lines with Scale */}
              <div className={`absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] font-mono ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                <div className={`border-b pb-1 flex justify-between ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}><span>Max</span><span>₱{(maxDisbursedVal / 1000).toFixed(0)}k</span></div>
                <div className={`border-b pb-1 flex justify-between ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}><span>75%</span><span>₱{(maxDisbursedVal * 0.75 / 1000).toFixed(0)}k</span></div>
                <div className={`border-b pb-1 flex justify-between ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}><span>50%</span><span>₱{(maxDisbursedVal * 0.5 / 1000).toFixed(0)}k</span></div>
                <div className={`border-b pb-1 flex justify-between ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}><span>25%</span><span>₱{(maxDisbursedVal * 0.25 / 1000).toFixed(0)}k</span></div>
                <div className={`border-b pb-1 flex justify-between ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}><span>0</span><span>₱0</span></div>
              </div>

              {/* Chart Content */}
              <div className="relative h-full w-full px-4 flex items-end justify-between">
                {/* SVG Curved Line and Dots for Cash Disbursed */}
                <svg viewBox="0 0 500 160" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-10">
                  <path
                    d={svgPathD}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                  />
                  {svgPoints.map((pt, i) => (
                    <g key={`dot-${i}`}>
                      {pt.disbursed > 0 && (
                        <circle cx={pt.x} cy={pt.y} r="8" fill="#3b82f6" fillOpacity="0.25" className="animate-pulse" />
                      )}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={pt.disbursed > 0 ? "5" : "3.5"}
                        fill={pt.disbursed > 0 ? "#38bdf8" : "#3b82f6"}
                        stroke={darkMode ? "#0e1726" : "#ffffff"}
                        strokeWidth="2"
                        className="transition-transform duration-300"
                      />
                    </g>
                  ))}
                </svg>

                {/* Monthly Application Bars (Solidly grounded on baseline, no split!) */}
                {monthlyVolume.map((item, idx) => (
                  <div
                    key={`${item.month}-${idx}`}
                    className="relative flex flex-col items-center h-full justify-end group z-20 w-12 cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(idx)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* Hover Tooltip */}
                    {hoveredPoint === idx && (
                      <div className={`absolute -top-12 text-[10px] py-1.5 px-2.5 rounded-lg shadow-2xl whitespace-nowrap z-30 border ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}>
                        <div className="font-bold">{item.month} {item.year}</div>
                        <div className="text-blue-400">Applications: {item.applications}</div>
                        <div className="text-emerald-400">Disbursed: ₱{item.disbursed.toLocaleString()}</div>
                      </div>
                    )}

                    {/* Light Blue Application Bar - Grounded on baseline */}
                    {item.barHeight > 0 && (
                      <div
                        className="w-7 bg-blue-500/30 border border-blue-400/50 rounded-t-md transition-all duration-300 group-hover:bg-blue-500/50 group-hover:border-blue-300"
                        style={{ height: `${item.barHeight}px` }}
                      ></div>
                    )}

                    {/* Month Label */}
                    <span className={`absolute -bottom-5 text-[11px] font-semibold ${item.isCurrentMonth ? (darkMode ? 'text-blue-400 font-bold' : 'text-blue-600 font-bold') : subTextClass}`}>
                      {item.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-6 pt-3">
              <div className={`flex items-center gap-2 text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="w-3.5 h-3.5 bg-blue-500/40 border border-blue-400 rounded-sm"></span>
                <span>Applications (All 8 Programs)</span>
              </div>
              <div className={`flex items-center gap-2 text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="w-5 h-1 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]"></span>
                <span>Disbursed Cash (5 Programs Only)</span>
              </div>
            </div>
          </div>

          {/* Latest Month Snapshot */}
          <div className={`border-t pt-3 mt-4 text-[11px] font-medium flex items-center justify-between ${darkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
            <span>
              Latest month ({monthlyVolume[monthlyVolume.length - 1]?.month}): <strong className={darkMode ? 'text-slate-200' : 'text-slate-900'}>{monthlyVolume[monthlyVolume.length - 1]?.applications} apps</strong>
            </span>
            <span className="font-mono text-emerald-400 font-bold">
              ₱{monthlyVolume[monthlyVolume.length - 1]?.disbursed.toLocaleString()} disbursed
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
