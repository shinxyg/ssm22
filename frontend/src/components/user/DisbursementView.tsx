import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { API_BASE_URL } from '../../config/api';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  UserCheck, 
  FileText, 
  Download, 
  Eye,
  X, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Pill,
  ShieldCheck,
  ChevronRight,
  Filter,
  Printer,
  History,
  Award,
  CreditCard,
  QrCode
} from 'lucide-react';
import type { ApplicationRecord } from '../../types';

interface DisbursementViewProps {
  darkMode?: boolean;
  onNavigateToModule?: (tab: string) => void;
  applications?: ApplicationRecord[];
}

const formatTo12Hour = (timeStr: string) => {
  if (!timeStr) return '';
  const [hoursStr, minutesStr] = timeStr.split(':');
  let hours = parseInt(hoursStr, 10);
  if (isNaN(hours)) return timeStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutes = minutesStr ? minutesStr.padStart(2, '0') : '00';
  return `${hours}:${minutes} ${ampm}`;
};

const getDynamicDocumentsList = (app: ApplicationRecord): string[] => {
  if (!app) return [];

  const rawDocs = 
    (app as any).uploadedDocuments ||
    (app as any).uploaded_documents ||
    (app as any).uploadedDocData ||
    (app as any).uploadedFiles ||
    app.details?.uploadedDocuments ||
    app.details?.uploaded_documents ||
    app.details?.uploadedDocData ||
    app.details?.uploadedFiles;

  const docKeyMap: Record<string, string> = {
    // PWD
    pwd_id: 'Original PWD ID Card / Valid Photo ID',
    pwdId: 'Original PWD ID Card / Valid Photo ID',
    indigency_cert: 'Barangay Certificate of Indigency',
    medical_cert: 'Original Medical Certificate',
    medicalCert: 'Original Medical Certificate',
    disability_photo: 'Proof of Disability / Residency Document',
    docResidency: 'Barangay Certificate of Residency',

    // Senior
    senior_id: 'Original Senior Citizen ID / OSCA Booklet',
    seniorId: 'Original Senior Citizen ID / OSCA Booklet',
    other_support: 'Supporting Document / Certificate of Non-Employment',
    otherSupport: 'Supporting Document / Certificate of Non-Employment',

    // Solo Parent
    soloParentId: 'Original Solo Parent ID / Booklet',
    solo_parent_id: 'Original Solo Parent ID / Booklet',
    birthCert: 'PSA / Birth Certificate ng mga Anak',
    birth_cert: 'PSA / Birth Certificate ng mga Anak',
    affidavit: 'Sworn Affidavit of Solo Parent',
    indigency: 'Barangay Certificate of Indigency',
    incomeProof: 'Proof of Income / Certificate of Non-Employment',
    income_proof: 'Proof of Income / Certificate of Non-Employment',
    supportingDoc: 'Supporting Document',
    supporting_doc: 'Supporting Document',

    // Medical & Funeral (AICS)
    'Doctor Prescription': 'Original Doctor\'s Prescription',
    'Medical Certificate': 'Original Medical Certificate / Clinical Abstract',
    'Indigency Certificate': 'Barangay Certificate of Indigency',
    'PhilSys ID': 'Valid Government Photo ID (PhilSys / QC ID)',
    clinicalAbstract: 'Clinical Abstract / Medical Certificate',
    hospitalBill: 'Hospital Statement of Account / Billing Statement',
    deathCert: 'Registered Death Certificate',
    death_cert: 'Registered Death Certificate',
    funeralContract: 'Notarized Funeral Contract mula sa partner funeral home',
    funeral_contract: 'Notarized Funeral Contract mula sa partner funeral home',

    // Livelihood
    validId: 'Valid Government Issued Photo ID',
    docValidId: 'Valid Government Issued Photo ID',
    residencyCert: 'Barangay Certificate of Residency & Indigency',
    businessProposal: 'Simple Business Proposal / Plan',
    docOther: 'Livelihood Workshop Clearance / Supporting Document',

    // Training
    requestLetter: 'Original Request Letter / Letter of Intent',
    request_letter: 'Original Request Letter / Letter of Intent',
    highSchoolDiploma: 'High School Diploma / ALS Certificate',
    idPhotos: '2x2 ID Photos (2 Copies)',

    // Educational
    enrollmentCert: 'Certificate of Enrollment / Registration Form',
    reportCard: 'School Report Card / Form 138'
  };

  const detectedItems: string[] = [];

  if (Array.isArray(rawDocs)) {
    rawDocs.forEach((item) => {
      if (typeof item === 'string') {
        const cleanName = docKeyMap[item] || item;
        if (!detectedItems.includes(cleanName)) detectedItems.push(cleanName);
      } else if (item && typeof item === 'object') {
        const title = item.name || item.label || item.key;
        if (title) {
          const cleanName = docKeyMap[title] || title;
          if (!detectedItems.includes(cleanName)) detectedItems.push(cleanName);
        }
      }
    });
  } else if (rawDocs && typeof rawDocs === 'object') {
    Object.entries(rawDocs).forEach(([key, val]) => {
      if (val && (typeof val === 'string' ? val.trim() !== '' : (val as any).name || (val as any).url || (val as any).dataUrl)) {
        const mappedName = docKeyMap[key] || (typeof (val as any).name === 'string' && !(val as any).name.startsWith('camera_capture_') ? (val as any).name : docKeyMap[key]) || key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');
        const cleanName = mappedName.charAt(0).toUpperCase() + mappedName.slice(1);
        if (!detectedItems.includes(cleanName)) detectedItems.push(cleanName);
      }
    });
  }

  // Fallback defaults if application has no uploaded documents object
  if (detectedItems.length === 0) {
    const cat = (app.category || '').toLowerCase();
    const serv = (app.serviceName || '').toLowerCase();
    const ref = (app.referenceNo || '').toUpperCase();

    if (ref.startsWith('TRN-') || cat.includes('training') || serv.includes('training')) {
      detectedItems.push(
        'Original Request Letter / Letter of Intent',
        'Valid Photo ID / QC ID (Proof of Residency)',
        'Barangay Certificate of Residency or Indigency'
      );
    } else if (ref.startsWith('QC-PWD-') || ref.startsWith('PWD-') || cat.includes('pwd')) {
      detectedItems.push(
        'Original PWD ID Card o Medical Certificate',
        'Valid Government Photo ID',
        'Barangay Certificate of Indigency'
      );
    } else if (ref.startsWith('SENIOR-') || cat.includes('senior')) {
      detectedItems.push(
        'Original Senior Citizen ID / OSCA Booklet',
        'Barangay Certificate of Indigency',
        'Valid Government Photo ID'
      );
    } else if (ref.startsWith('QC-AICS-') || ref.startsWith('AICS-') || serv.includes('medical') || serv.includes('funeral')) {
      if (serv.includes('funeral') || serv.includes('burial')) {
        detectedItems.push(
          'Original Registered Death Certificate',
          'Notarized Funeral Contract mula sa partner funeral home',
          'Barangay Certificate of Indigency & Valid ID'
        );
      } else {
        detectedItems.push(
          'Original Medical Abstract / Doctor\'s Prescription',
          'Hospital Statement of Account / Billing Statement',
          'Barangay Certificate of Indigency & Valid ID'
        );
      }
    } else if (ref.startsWith('LVH-') || cat.includes('livelihood')) {
      detectedItems.push(
        'Barangay Business Clearance / Endorsement',
        'Simple Business Proposal / Plan',
        'Valid Government Photo ID'
      );
    } else if (ref.startsWith('QC-EDU-') || ref.startsWith('QC-SP-EDU-') || serv.includes('educational')) {
      detectedItems.push(
        'Certificate of Enrollment / School Registration Form',
        'Valid Photo ID ng Magulang o Guardian',
        'Barangay Certificate of Indigency'
      );
    } else if (ref.startsWith('QC-CW-') || ref.startsWith('CW-PROT-') || serv.includes('child')) {
      detectedItems.push(
        'PSA / Barangay Birth Certificate ng Bata',
        'Valid Photo ID ng Magulang o Guardian',
        'Barangay Certificate of Residency'
      );
    } else {
      detectedItems.push(
        'Original Solo Parent ID / Booklet',
        'Valid Photo ID (PhilSys / Comelec / UMID)',
        'Barangay Certificate of Indigency'
      );
    }
  }

  const formattedDocs = detectedItems.map((doc) => {
    if (doc.toLowerCase().startsWith('original') || doc.toLowerCase().startsWith('valid') || doc.toLowerCase().startsWith('barangay') || doc.toLowerCase().startsWith('proof') || doc.toLowerCase().startsWith('certificate')) {
      return doc;
    }
    return `Original / Hardcopy ng ${doc}`;
  });

  formattedDocs.push('Printed Copy ng Official Slip na ito');
  return formattedDocs;
};

const getSlipConfig = (app: ApplicationRecord) => {
  const ref = (app.referenceNo || '').toUpperCase();
  const cat = (app.category || '').toLowerCase();
  const serv = (app.serviceName || '').toLowerCase();
  const st = (app.status || '').toUpperCase();
  const isPayout = st === 'PAYOUT SCHEDULED' || st === 'READY FOR PAYOUT';

  let title = 'OFFICIAL APPOINTMENT SLIP';
  let division = 'QC SOCIAL SERVICES & DEVELOPMENT DEPARTMENT';
  let buttonLabel = 'Appointment Slip';
  let refLabel = 'APPOINTMENT REF NO:';
  let dateLabel = isPayout ? 'PETSA NG CLAIM / PAYOUT:' : 'PETSA NG INTERVIEW / ASSESSMENT:';
  let venueLabel = isPayout ? 'LUGAR NG CLAIM / PAYOUT:' : 'LUGAR NG INTERVIEW / ASSESSMENT:';
  let venue = 'Quezon City Hall SSDD Office, Assessment Desk 3';

  if (ref.startsWith('TRN-') || cat.includes('training') || serv.includes('training')) {
    title = 'OFFICIAL ORIENTATION SLIP';
    division = 'QC SSDD SKILLS TRAINING DIVISION';
    buttonLabel = 'Orientation Slip';
    refLabel = 'ORIENTATION REF NO:';
    dateLabel = 'PETSA NG ORIENTATION:';
    venueLabel = 'LUGAR NG ORIENTATION:';
    venue = 'Quezon City Skills Development Center, Kamuning Road, Diliman, QC';
  } else if (ref.startsWith('QC-PWD-') || ref.startsWith('PWD-') || cat.includes('pwd')) {
    title = isPayout ? 'OFFICIAL PWD PENSION CLAIM SLIP' : 'OFFICIAL PWD ASSESSMENT & CLAIM SLIP';
    division = 'QC PERSONS WITH DISABILITY AFFAIRS OFFICE (PDAO)';
    buttonLabel = 'PWD Claim / Appointment Slip';
    refLabel = isPayout ? 'PENSION CLAIM REF NO:' : 'PWD APPOINTMENT REF NO:';
    venue = 'PDAO Action Center, QC Hall Complex / Assessment Desk 4';
  } else if (ref.startsWith('SENIOR-') || cat.includes('senior')) {
    title = isPayout ? 'OFFICIAL SENIOR CITIZEN CASH GRANT CLAIM SLIP' : 'OFFICIAL SENIOR CITIZEN CLAIM SLIP';
    division = 'OFFICE FOR THE SENIOR CITIZENS\' AFFAIRS (OSCA)';
    buttonLabel = 'Senior Citizen Claim Slip';
    refLabel = isPayout ? 'SENIOR CLAIM REF NO:' : 'OSCA APPOINTMENT REF NO:';
    venue = 'OSCA Building / QC Hall Cashier & Assessment Center';
  } else if (ref.startsWith('QC-AICS-') || ref.startsWith('AICS-') || serv.includes('medical') || serv.includes('funeral') || serv.includes('burial') || serv.includes('guarantee letter')) {
    title = 'OFFICIAL GUARANTEE LETTER (GL) CLAIM SLIP';
    division = 'QC SSDD CRISIS INTERVENTION & MEDICAL AID DIVISION';
    buttonLabel = 'Guarantee Letter (GL) Claim Slip';
    refLabel = 'GL TRANSACTION REF NO:';
    dateLabel = 'PETSA NG RELEASING:';
    venueLabel = 'LUGAR NG RELEASING:';
    venue = 'SSDD Crisis Intervention Center, Ground Floor, QC Hall';
  } else if (ref.startsWith('LVH-') || cat.includes('livelihood')) {
    title = isPayout ? 'OFFICIAL LIVELIHOOD GRANT RELEASE SLIP' : 'OFFICIAL LIVELIHOOD EVALUATION SLIP';
    division = 'QC SSDD LIVELIHOOD & ENTERPRISE DIVISION';
    buttonLabel = 'Livelihood Evaluation Slip';
    refLabel = 'LIVELIHOOD REF NO:';
    venue = 'Quezon City Small Business & Livelihood Development Center';
  } else if (ref.startsWith('QC-CW-') || ref.startsWith('CW-PROT-') || serv.includes('child welfare') || serv.includes('child protection')) {
    title = 'OFFICIAL CASE INTAKE & ASSESSMENT SLIP';
    division = 'QC SSDD CHILD & YOUTH WELFARE DIVISION';
    buttonLabel = 'Case Assessment Slip';
    refLabel = 'CASE INTAKE REF NO:';
    venue = 'QC Social Services & Development Dept., Child Welfare Section';
  } else if (ref.startsWith('QC-EDU-') || ref.startsWith('QC-SP-EDU-') || serv.includes('educational')) {
    title = isPayout ? 'OFFICIAL EDUCATIONAL GRANT CLAIM SLIP' : 'OFFICIAL EDUCATIONAL ASSESSMENT SLIP';
    division = ref.startsWith('QC-SP-EDU-') ? 'QC SSDD SOLO PARENT DIVISION' : 'QC SSDD EDUCATIONAL ASSISTANCE DIVISION';
    buttonLabel = 'Educational Grant Claim Slip';
    refLabel = 'GRANT REF NO:';
    venue = 'Quezon City Hall SSDD Office, Assessment Desk 3';
  } else if (ref.startsWith('SP-') || cat.includes('solo') || serv.includes('solo')) {
    title = isPayout ? 'OFFICIAL SOLO PARENT SUBSIDY CLAIM SLIP' : 'OFFICIAL SOLO PARENT APPOINTMENT SLIP';
    division = 'QC SSDD SOLO PARENT DIVISION';
    buttonLabel = 'Solo Parent Appointment Slip';
    refLabel = 'APPOINTMENT REF NO:';
    venue = 'Quezon City Hall SSDD Office, Assessment Desk 3';
  }

  const schedDate = 
    (app as any).appointmentDate || 
    (app as any).appointment_date || 
    (app as any).scheduledPayoutDate || 
    (app as any).scheduled_payout_date || 
    (app as any).payout_date || 
    'Oct 8, 2026';

  const schedTime = 
    (app as any).appointmentTime || 
    (app as any).appointment_time || 
    (app as any).scheduledPayoutTime || 
    (app as any).scheduled_payout_time || 
    (app as any).payout_time || 
    '09:00 AM';

  return {
    title,
    division,
    buttonLabel,
    refLabel,
    dateLabel,
    venueLabel,
    venue,
    schedDate,
    schedTime
  };
};

export const DisbursementView: React.FC<DisbursementViewProps> = ({
  darkMode = true,
  onNavigateToModule,
  applications = [],
}) => {
  const [activeViewTab, setActiveViewTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('ALL');
  const [expandedRef, setExpandedRef] = useState<string | null>(null);
  const [dbAppointments, setDbAppointments] = useState<any[]>([]);

  // Modal states for downloadable / viewable slips and certificates
  const [modalApptSlip, setModalApptSlip] = useState<ApplicationRecord | null>(null);
  const [modalSoloParentId, setModalSoloParentId] = useState<ApplicationRecord | null>(null);
  const [modalSubsidyCert, setModalSubsidyCert] = useState<ApplicationRecord | null>(null);

  // Fetch appointments registry from PostgreSQL DB
  React.useEffect(() => {
    const fetchAppts = () => {
      fetch(`${API_BASE_URL}/api/appointments`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setDbAppointments(data);
          }
        })
        .catch(() => {});
    };
    fetchAppts();
    const interval = setInterval(fetchAppts, 3000);
    return () => clearInterval(interval);
  }, []);

  // Categorize Applications into Active vs History (Ensure records NEVER disappear!)
  const { activeApplications, historyApplications } = useMemo(() => {
    const activeMap = new Map<string, ApplicationRecord>();
    const historyMap = new Map<string, ApplicationRecord>();

    applications.forEach((app) => {
      if (!app || !app.referenceNo) return;
      const st = (app.status || '').toUpperCase();
      const isRejected = st === 'REJECTED' || st === 'DISAPPROVED' || st === 'DISQUALIFIED' || st.includes('REJECT') || st.includes('DISAPPROV');
      const isTrn = (app.category || '').toLowerCase() === 'training' || (app.serviceName || '').toLowerCase().includes('training') || app.referenceNo.startsWith('TRN-');
      const isCwProtection = app.referenceNo.startsWith('QC-CW-') || app.referenceNo.startsWith('CW-PROT-') || (app.serviceName || '').toLowerCase() === 'child welfare services' || (app.serviceName || '').toLowerCase().includes('child protection');

      // History tab keeps all records permanently
      if (!historyMap.has(app.referenceNo)) {
        historyMap.set(app.referenceNo, app);
      }

      // Active tab keeps all non-rejected & non-training & non-cw-protection applications (Non-financial programs have NO financial payout)
      if (!isRejected && !isTrn && !isCwProtection && !activeMap.has(app.referenceNo)) {
        activeMap.set(app.referenceNo, app);
      }
    });

    return { 
      activeApplications: Array.from(activeMap.values()), 
      historyApplications: Array.from(historyMap.values()) 
    };
  }, [applications]);

  // Current working list based on tab
  const currentList = activeViewTab === 'ACTIVE' ? activeApplications : historyApplications;

  // Filtered by Category / Module Pill
  const filteredApps = useMemo(() => {
    return currentList.filter((app) => {
      if (selectedModuleFilter === 'ALL') return true;
      const cat = (app.category || '').toLowerCase();
      const serv = (app.serviceName || '').toLowerCase();
      const filter = selectedModuleFilter.toLowerCase();

      if (filter === 'aics') return cat.includes('aics') || serv.includes('aics') || serv.includes('medical') || serv.includes('funeral');
      if (filter === 'pwd') return cat.includes('pwd') || serv.includes('pwd') || (app.referenceNo || '').startsWith('QC-PWD') || (app.referenceNo || '').startsWith('PWD-');
      if (filter === 'senior') return cat.includes('senior') || serv.includes('senior') || (app.referenceNo || '').startsWith('SENIOR-');
      if (filter === 'educational') return cat.includes('educational') || serv.includes('educational') || serv.includes('indigent') || (app.referenceNo || '').startsWith('QC-EDU') || (app.referenceNo || '').startsWith('QC-SP-EDU');
      if (filter === 'soloparent') return (cat.includes('solo') || serv.includes('solo')) && !(app.referenceNo || '').startsWith('QC-EDU');
      if (filter === 'livelihood') return cat.includes('livelihood') || serv.includes('livelihood') || (app.referenceNo || '').startsWith('LVH-');
      return true;
    });
  }, [currentList, selectedModuleFilter]);

  const handlePrintModal = () => {
    window.print();
  };

  return (
    <div className={`space-y-6 sm:space-y-8 select-none font-['Plus_Jakarta_Sans',sans-serif] ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* HEADER BANNER */}
      <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border shadow-xl transition-all ${
        darkMode 
          ? 'bg-gradient-to-r from-[#0d1d3a] via-[#0f2752] to-[#141d33] border-blue-900/50' 
          : 'bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white border-blue-800'
      }`}>
        <div className="relative z-10 max-w-3xl space-y-2 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
            <span>Active Financial Aid & Payout Tracking</span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
            My Financial Aid & Subsidy Status
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium line-clamp-2 sm:line-clamp-none">
            Track real-time status updates for Solo Parent Cash Subsidies and Financial Aid, view appointment schedules, download official ID cards/slips, and monitor release schedules.
          </p>
        </div>
      </div>

      {/* VIEW TABS: ACTIVE FINANCIAL AID */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
        <div className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 bg-blue-600 text-white shadow-xl border border-blue-400/40">
          <Clock className="w-4 h-4" />
          <span>Active Financial Aid ({activeApplications.length})</span>
        </div>
      </div>

      {/* MODULE FILTER PILLS (Smooth horizontal swipe on mobile) */}
      <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar pb-1.5 -mx-1 px-1 flex-nowrap md:flex-wrap">
        <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mr-1 flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </span>
        <button
          type="button"
          onClick={() => setSelectedModuleFilter('ALL')}
          className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
            selectedModuleFilter === 'ALL'
              ? 'bg-blue-600 text-white shadow-lg border border-blue-400/40'
              : 'bg-[#0e1726] text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          ALL ({currentList.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedModuleFilter('soloparent')}
          className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
            selectedModuleFilter === 'soloparent'
              ? 'bg-blue-600 text-white shadow-lg border border-blue-400/40'
              : 'bg-[#0e1726] text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          SOLO PARENT SUBSIDY
        </button>
        <button
          type="button"
          onClick={() => setSelectedModuleFilter('educational')}
          className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
            selectedModuleFilter === 'educational'
              ? 'bg-blue-600 text-white shadow-lg border border-blue-400/40'
              : 'bg-[#0e1726] text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          EDUCATIONAL GRANT
        </button>
        <button
          type="button"
          onClick={() => setSelectedModuleFilter('pwd')}
          className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
            selectedModuleFilter === 'pwd'
              ? 'bg-blue-600 text-white shadow-lg border border-blue-400/40'
              : 'bg-[#0e1726] text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          PWD ASSISTANCE
        </button>
        <button
          type="button"
          onClick={() => setSelectedModuleFilter('aics')}
          className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
            selectedModuleFilter === 'aics'
              ? 'bg-blue-600 text-white shadow-lg border border-blue-400/40'
              : 'bg-[#0e1726] text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          AICS ASSISTANCE
        </button>
        <button
          type="button"
          onClick={() => setSelectedModuleFilter('senior')}
          className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
            selectedModuleFilter === 'senior'
              ? 'bg-blue-600 text-white shadow-lg border border-blue-400/40'
              : 'bg-[#0e1726] text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          SENIOR CITIZEN
        </button>
        <button
          type="button"
          onClick={() => setSelectedModuleFilter('livelihood')}
          className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
            selectedModuleFilter === 'livelihood'
              ? 'bg-blue-600 text-white shadow-lg border border-blue-400/40'
              : 'bg-[#0e1726] text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          LIVELIHOOD PROGRAM
        </button>
      </div>

      {/* APPLICATIONS LIST */}
      <div className="space-y-4">
        <h3 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center justify-between">
          <span>{activeViewTab === 'ACTIVE' ? 'Active Requests' : 'Archived History'} ({filteredApps.length})</span>
          <span className="text-[10px] text-slate-400 font-mono normal-case">Live DB Synchronization</span>
        </h3>

        {filteredApps.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredApps.map((app, idx) => {
              const statusText = (app.status as string) || 'Pending';
              const name = (app as any).applicantName || app.details?.applicantName || 'Juan Dela Cruz';
              const isCwProtection = app.referenceNo.startsWith('QC-CW-') || app.referenceNo.startsWith('CW-PROT-') || (app.serviceName || '').toLowerCase() === 'child welfare services' || (app.serviceName || '').toLowerCase().includes('child protection');
              const isChildEdu = (app.referenceNo.startsWith('QC-EDU-') || (app.serviceName || '').toLowerCase().includes('indigent children') || (app.serviceName || '').toLowerCase().includes('children & youth') || (app.serviceName || '').toLowerCase().includes('children and youth')) && !isCwProtection;
              const isSoloParentEdu = (app.referenceNo.startsWith('QC-SP-EDU') || ((app.serviceName || '').toLowerCase().includes('solo parent') && (app.serviceName || '').toLowerCase().includes('educational'))) && !isCwProtection && !isChildEdu;
              const isSoloParent = ((app.category || '').toLowerCase().includes('solo') || (app.serviceName || '').toLowerCase().includes('solo') || app.referenceNo.startsWith('SP-')) && !isSoloParentEdu && !isCwProtection && !isChildEdu;
              const isTrn = (app.category || '').toLowerCase() === 'training' || (app.serviceName || '').toLowerCase().includes('training') || app.referenceNo.startsWith('TRN-');
              const isLivelihood = app.referenceNo.startsWith('LVH-') || (app.category || '').toLowerCase().includes('livelihood') || (app.serviceName || '').toLowerCase().includes('livelihood');
              const isPwd = app.referenceNo.startsWith('QC-PWD-') || app.referenceNo.startsWith('PWD-') || (app.category || '').toLowerCase().includes('pwd') || (app.serviceName || '').toLowerCase().includes('pwd');
              const isSenior = app.referenceNo.startsWith('SENIOR-') || (app.category || '').toLowerCase().includes('senior') || (app.serviceName || '').toLowerCase().includes('senior');
              const isAics = app.referenceNo.startsWith('QC-AICS-') || 
                app.referenceNo.startsWith('AICS-') || 
                (app.serviceName || '').toLowerCase().includes('guarantee letter') || 
                (app.serviceName || '').toLowerCase().includes('funeral') || 
                (app.serviceName || '').toLowerCase().includes('burial') || 
                (app.serviceName || '').toLowerCase().includes('medical') || 
                (app.category || '').toLowerCase().includes('aics');

              const appt = (app as any).appointmentDetails;
              const dbAppt = dbAppointments.find((a) => (a.reference_no || a.referenceNo) === app.referenceNo);

              // Dates & Times
              const rawPayoutDate = (app as any).scheduledPayoutDate || (app as any).scheduled_payout_date || (app as any).payout_date;
              const rawPayoutTime = (app as any).scheduledPayoutTime || (app as any).scheduled_payout_time || (app as any).payout_time;

              const rawInterviewDate = (app as any).appointmentDate || (app as any).appointment_date || appt?.appointmentDate || dbAppt?.appointment_date || dbAppt?.appointmentDate;
              const rawInterviewTime = (app as any).appointmentTime || (app as any).appointment_time || appt?.appointmentTime || dbAppt?.appointment_time || dbAppt?.appointmentTime;

              const hasExplicitPayoutSched = !!(rawPayoutDate || rawPayoutTime) || statusText === 'PAYOUT SCHEDULED' || statusText === 'Payout Scheduled';
              const isPayoutScheduled = statusText === 'PAYOUT SCHEDULED' || statusText === 'Payout Scheduled' || (hasExplicitPayoutSched && (statusText.includes('Approved') || statusText.includes('Ready for Payout')));
              const isApprovedByAdmin = statusText === 'APPROVED BY ADMIN' || statusText === 'Approved by Admin';
              const isInterviewScheduled = statusText === 'INTERVIEW SCHEDULED' || statusText === 'Interview Scheduled' || statusText === 'Approved for Orientation';
              const isApproved = statusText === 'APPROVED' || statusText === 'Approved' || statusText === 'Approved by Social Worker' || statusText === 'Approved & Ready for Payout' || statusText.includes('Ready for Payout');
              const isReleased = statusText === 'RELEASED / COMPLETED' || statusText === 'COMPLETED' || statusText === 'Completed' || statusText === 'Released' || (isCwProtection && (statusText.includes('APPROVED') || statusText.includes('COMPLETED')));
              const isRejected = statusText === 'REJECTED' || statusText === 'Rejected' || statusText === 'Disapproved' || statusText === 'DISAPPROVED';

              const formatScheduleDate = (dStr?: string) => {
                if (!dStr) return '';
                if (dStr.includes('•')) return dStr;
                try {
                  const parts = dStr.split('-');
                  if (parts.length === 3) {
                    const y = parseInt(parts[0], 10);
                    const m = parseInt(parts[1], 10) - 1;
                    const d = parseInt(parts[2], 10);
                    const dt = new Date(y, m, d);
                    if (!isNaN(dt.getTime())) {
                      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    }
                  }
                } catch (e) {}
                return dStr;
              };

              const payoutDateFormatted = formatScheduleDate(rawPayoutDate) || 'Oct 10, 2026';
              const payoutTimeFormatted = rawPayoutTime ? formatTo12Hour(rawPayoutTime) : '09:00 AM';

              const interviewDateFormatted = formatScheduleDate(rawInterviewDate) || 'Oct 8, 2026';
              const interviewTimeFormatted = rawInterviewTime ? formatTo12Hour(rawInterviewTime) : '09:00 AM';

              const isSsddValidated = statusText === 'SSDD VALIDATED' || statusText === 'APPROVED BY ADMIN' || statusText === 'Approved for Orientation';
              const isTrnScheduled = statusText === 'TRAINING SCHEDULED / ORIENTATION APPOINTED' || statusText === 'TRAINING SCHEDULED' || statusText === 'ORIENTATION APPOINTED' || statusText === 'INTERVIEW SCHEDULED' || statusText === 'Interview Scheduled';
              const isTrnEnrolled = statusText === 'QUALIFIED / ENROLLED' || statusText === 'QUALIFIED' || statusText === 'ENROLLED';
              const isTrnUnqualified = statusText === 'UNQUALIFIED' || statusText === 'Unqualified';

              let statusBadge = (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 border border-amber-500/30 text-amber-400 inline-block">
                  {isTrn ? 'PENDING (Pending SSDD Validation)' : 'PENDING (Pending Document Validation)'}
                </span>
              );

              let processExplanation = isTrn
                ? "Sinusuri ng Admin ang Barangay Clearance, Valid ID, at Qualification Form."
                : isAics
                ? "Sinusuri ng Social Worker ang mga isinumiteng dokumento at Certificate of Indigency para sa Guarantee Letter (GL)."
                : isLivelihood
                ? "Sinusuri ng Livelihood Division ang inyong Business Proposal, Barangay Endorsement, at mga dokumento. Hintayin ang aksyon."
                : isPwd
                ? "Sinusuri ng PDAO / Social Services ang PWD ID, Medical Certificate, at mga dokumento. Hintayin ang aksyon."
                : isSenior
                ? "Sinusuri ng OSCA / Social Services ang Senior Citizen ID, Indigency Certificate, at mga dokumento. Hintayin ang aksyon."
                : isChildEdu
                ? "Sinusuri ng Social Services ang Certificate of Enrollment, Indigency, at mga dokumento ng bata/kabataan. Hintayin ang aksyon."
                : "Sinusuri ng Admin ang Solo Parent Booklet / ID / Affidavit. Hintayin ang aksyon.";

              if (isTrn && isTrnUnqualified) {
                statusBadge = (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/10 border border-rose-500/30 text-rose-400 inline-block">
                    UNQUALIFIED
                  </span>
                );
                processExplanation = "Pasensya na, ikaw ay Unqualified sa Orientation Assessment.";
              } else if (isTrn && isTrnEnrolled) {
                statusBadge = (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 inline-block">
                    QUALIFIED / ENROLLED
                  </span>
                );
                processExplanation = "Binabati kita! Qualified at Enrolled ka na sa Training Program! Class Batch Number: Batch 3 (2026). (Non-Financial Program — Walang Financial Payout / Disbursement).";
              } else if (isTrn && isTrnScheduled) {
                statusBadge = (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/10 border border-blue-500/30 text-blue-400 inline-block">
                    TRAINING SCHEDULED / ORIENTATION APPOINTED
                  </span>
                );
                processExplanation = `Naitakda ang Training Orientation sa Quezon City Skills Development Center sa ${interviewDateFormatted} sa ganap na ${interviewTimeFormatted || '09:00 AM'}.`;
              } else if (isTrn && isSsddValidated) {
                statusBadge = (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 inline-block">
                    SSDD VALIDATED
                  </span>
                );
                processExplanation = "Validated na ang inyong qualification at mga dokumento. Inilipat sa Stage 2 (Scheduling).";
              } else if (isApprovedByAdmin) {
                statusBadge = (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 inline-block">
                    APPROVED BY ADMIN
                  </span>
                );
                processExplanation = "Nakalinya na sa interview schedule. Inilipat ang inyong record sa SSDD Appointments.";
              } else if (isInterviewScheduled) {
                statusBadge = (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/10 border border-blue-500/30 text-blue-400 inline-block">
                    INTERVIEW SCHEDULED
                  </span>
                );
                processExplanation = `Naitakda ang interview sa Quezon City Hall SSDD Office sa ${interviewDateFormatted} sa ganap na ${interviewTimeFormatted || '09:00 AM'}.`;
              } else if (isApproved) {
                statusBadge = (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 inline-block">
                    {statusText.includes('Ready for Payout') ? 'APPROVED & READY FOR PAYOUT' : 'APPROVED'}
                  </span>
                );
                processExplanation = isAics
                  ? "Aprubado na ang inyong aplikasyon para sa Guarantee Letter (GL). Inihahanda na ang official documentation."
                  : isLivelihood
                  ? "Nakalipas sa Assessment! Inaprubahan ang inyong ₱15,000 Livelihood Capital Assistance Grant. Awtomatikong pumasok sa Financial Aid Masterlist."
                  : isPwd
                  ? "Nakalipas sa Verification! Inaprubahan ang inyong PWD Social Assistance Program. Awtomatikong pumasok sa PWD Pension Masterlist na may Fixed Amount: ₱1,500.00."
                  : isSenior
                  ? "Nakalipas sa Verification! Inaprubahan ang inyong Senior Citizen Financial Assistance. Awtomatikong pumasok sa Senior Cash Grant Masterlist na may Fixed Amount: ₱3,000.00."
                  : isChildEdu
                  ? "Nakalipas sa Assessment! Inaprubahan ang ₱5,000 Educational Grant para sa Bata at Kabataan. Awtomatikong pumasok sa Financial Aid Masterlist na may Fixed Amount: ₱5,000.00."
                  : isSoloParentEdu
                  ? "Nakalipas sa Physical Interview! Inisyu na ang Official Solo Parent ID Card at ₱5,000 Educational Grant Certificate. Awtomatikong pumasok sa Financial Aid Masterlist na may Fixed Amount: ₱5,000.00."
                  : "Nakalipas sa Physical Interview! Inisyu na ang Official Solo Parent ID Card at ₱3,000 Cash Subsidy Certificate. Awtomatikong pumasok sa Financial Aid Masterlist na may Fixed Amount: ₱3,000.00.";
              } else if (isPayoutScheduled) {
                statusBadge = (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500/10 border border-purple-500/30 text-purple-400 inline-block">
                    {isAics ? 'GL READY FOR RELEASE' : 'PAYOUT SCHEDULED'}
                  </span>
                );
                processExplanation = isAics
                  ? `Naitakda ang release ng inyong Guarantee Letter (GL) sa ${payoutDateFormatted} sa ${payoutTimeFormatted}.`
                  : isLivelihood
                  ? `Naitakda ang release ng inyong ₱15,000 Livelihood Capital Assistance Grant sa ${payoutDateFormatted} sa ${payoutTimeFormatted}.`
                  : isPwd
                  ? `Naitakda ang ₱1,500 PWD Quarterly Cash Pension payout release date sa ${payoutDateFormatted} sa ${payoutTimeFormatted}.`
                  : isSenior
                  ? `Naitakda ang ₱3,000 Senior Citizen Cash Grant payout release date sa ${payoutDateFormatted} sa ${payoutTimeFormatted}.`
                  : isChildEdu
                  ? `Naitakda ang ₱5,000 Educational Grant (Children & Youth) payout release date sa ${payoutDateFormatted} sa ${payoutTimeFormatted}.`
                  : isSoloParentEdu
                  ? `Naitakda ang ₱5,000 Solo Parent Educational Grant payout release date sa ${payoutDateFormatted} sa ${payoutTimeFormatted}.`
                  : `Naitakda ang ₱3,000 Solo Parent Payout release date sa ${payoutDateFormatted} sa ${payoutTimeFormatted}.`;
              } else if (isReleased) {
                statusBadge = (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 inline-block">
                    COMPLETED ({isAics ? 'GL Released' : isCwProtection ? 'Child Protection / Case Services Completed' : (isSoloParentEdu || isChildEdu) ? '₱5,000 Educational Grant Release Completed' : isLivelihood ? '₱15,000 Livelihood Grant Released' : isPwd ? '₱1,500 PWD Pension Released' : isSenior ? '₱3,000 Senior Cash Grant Released' : isTrn ? 'Training Completed' : '₱3,000 Cash Subsidy Release Completed'})
                  </span>
                );
                processExplanation = isAics
                  ? ((app.serviceName || '').toLowerCase().includes('funeral') || (app.serviceName || '').toLowerCase().includes('burial')
                    ? "Nailabas na ang inyong Official Funeral Guarantee Letter (GL). Maaari na po itong i-presenta sa accredited partner funeral home. Maraming salamat!"
                    : (app.serviceName || '').toLowerCase().includes('medical')
                    ? "Nailabas na ang inyong Official Medical Guarantee Letter (GL). Maaari na po itong i-presenta sa accredited partner hospital / healthcare facility. Maraming salamat!"
                    : "Nailabas na ang inyong Official Guarantee Letter (GL). Maraming salamat!")
                  : isLivelihood
                  ? "Nailabas na ang inyong ₱15,000.00 Livelihood Capital Assistance Grant. Maraming salamat at hangad ng Lungsod Quezon ang tagumpay ng inyong kabuhayan!"
                  : isPwd
                  ? "Nailabas na ang inyong ₱1,500.00 PWD Quarterly Cash Pension. Maraming salamat!"
                  : isSenior
                  ? "Nailabas na ang inyong ₱3,000.00 Senior Citizen Financial Assistance / Cash Grant. Maraming salamat!"
                  : isChildEdu
                  ? "Nailabas na ang inyong ₱5,000.00 Educational Assistance Grant para sa mga Bata at Kabataan. Maraming salamat!"
                  : isCwProtection
                  ? "Binabati kita! Aprubado at nakalipas sa Case Assessment ang inyong Child Protection / Case Intake Services. (Non-Financial Program — Walang Financial Payout)."
                  : isSoloParentEdu
                  ? "Nailabas na ang inyong ₱5,000 Solo Parent Educational Grant. Maraming salamat!"
                  : isTrn
                  ? "Nakatapos sa Skills Training Program. Maraming salamat!"
                  : "Nailabas na ang inyong ₱3,000 Solo Parent Subsidy. Maraming salamat!";
              } else if (isRejected) {
                statusBadge = (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/10 border border-rose-500/30 text-rose-400 inline-block">
                    REJECTED
                  </span>
                );
                processExplanation = `Disapproved ang request. Dahilan: ${app.disapprovalReason || 'Documents or qualifications failed verification.'}`;
              }

              const isExpanded = expandedRef === app.referenceNo;

              return (
                <div
                  key={`${app.referenceNo}-${idx}`}
                  className="bg-[#0e1726] border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 hover:border-slate-700 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-400 tracking-wider uppercase block">
                        REF NO: {app.referenceNo}
                      </span>
                      <h4 className="text-base font-extrabold text-white mt-0.5">{isSoloParentEdu ? 'Solo Parent Educational Assistance Program' : (app.serviceName || '').replace(/\bNieto\s*/gi, '')}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {statusBadge}
                    </div>
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 rounded-xl bg-[#080f1e] border border-slate-800 space-y-1">
                      <span className="text-slate-400 text-[10px] font-semibold uppercase block">Applicant Info</span>
                      <div className="font-bold text-white">{name}</div>
                      <div className="text-slate-400 text-[11px] font-mono space-y-0.5">
                        <div>Filed: {app.dateSubmitted}</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#080f1e] border border-slate-800 space-y-1">
                      <span className="text-slate-400 text-[10px] font-semibold uppercase block">Processing Office</span>
                      <div className="font-bold text-slate-200">
                        Quezon City Social Services Development Department
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        QC Hall Building
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#080f1e] border border-slate-800 space-y-1">
                      <span className="text-slate-400 text-[10px] font-semibold uppercase block">Benefit Entitlement</span>
                      <div className="font-bold text-amber-400">
                        {isCwProtection
                          ? 'Child Protection & Case Intake Services (Non-Financial)'
                          : isChildEdu
                          ? '₱5,000.00 Educational Grant (Children & Youth)'
                          : isSoloParentEdu
                          ? '₱5,000.00 Fixed Solo Parent Educational Grant'
                          : isSoloParent 
                          ? '₱3,000.00 Fixed Solo Parent Cash Subsidy' 
                          : isPwd
                          ? '₱1,500.00 Quarterly Cash Pension'
                          : isSenior
                          ? '₱3,000.00 Cash Grant'
                          : isLivelihood
                          ? (app.assistanceType === 'Materials / Supplies' ? 'Materials & Starter Kit' : '₱15,000.00 Livelihood Capital Grant')
                          : isTrn
                          ? 'Free Vocational Training & Orientation'
                          : (app.amountOrType || 'Financial Assistance Grant')}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        {isAics ? 'Official Guarantee Letter (Non-Cash)' : 'Official City Welfare Assistance'}
                      </div>
                    </div>
                  </div>

                  {/* ACTIVE PAYOUT CARD (STEP 5) */}
                  {isPayoutScheduled && (isSoloParent || isSoloParentEdu || isChildEdu || isLivelihood || isPwd || isSenior) && (
                    <div className="p-5 rounded-2xl bg-purple-950/40 border border-purple-500/50 space-y-3 shadow-lg">
                      <div className="flex items-center justify-between border-b border-purple-800/60 pb-2">
                        <span className="text-xs font-black uppercase text-purple-300 tracking-wider flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-purple-400" />
                          <span>ACTIVE PAYOUT CARD ({isChildEdu ? 'FIXED ₱5,000 EDUCATIONAL GRANT (CHILDREN & YOUTH)' : isSoloParentEdu ? 'FIXED SOLO PARENT EDUCATIONAL GRANT' : isLivelihood ? '₱15,000 LIVELIHOOD CAPITAL GRANT' : isPwd ? '₱1,500 PWD QUARTERLY CASH PENSION' : isSenior ? '₱3,000 SENIOR CITIZEN CASH GRANT' : 'FIXED SOLO PARENT CASH SUBSIDY'})</span>
                        </span>
                        <span className="font-mono text-xs font-bold text-purple-400 bg-purple-900/60 px-2.5 py-0.5 rounded-lg">
                          STATUS: PAYOUT SCHEDULED
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">MATATANGGAP:</span>
                          <span className="text-base font-extrabold text-emerald-400">{(isSoloParentEdu || isChildEdu) ? '₱5,000.00 FIXED' : isLivelihood ? '₱15,000.00 FIXED' : isPwd ? '₱1,500.00 FIXED' : isSenior ? '₱3,000.00 FIXED' : '₱3,000.00 FIXED'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">PETSA & ORAS:</span>
                          <span className="font-extrabold text-white">{payoutDateFormatted} • {payoutTimeFormatted}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">LUGAR NG CLAIM:</span>
                          <span className="font-bold text-slate-200">
                            {isSenior ? 'OSCA Desk / QC Hall Cashier' : isPwd ? 'PDAO Desk / QC Hall Cashier' : 'Quezon City Hall Cashier / SSDD Area'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">DADALHIN:</span>
                          <span className="font-bold text-amber-300">
                            {isChildEdu
                              ? 'School ID / Enrollment Certificate & Parent Valid ID'
                              : isPwd 
                              ? 'PWD ID Card & Valid ID'
                              : isSenior
                              ? 'Senior Citizen ID Card & Valid ID'
                              : isLivelihood
                              ? 'Valid ID & Business Documents'
                              : 'Solo Parent ID Card & Valid ID'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#0e1726] border border-slate-800/90 rounded-2xl p-16 text-center shadow-xl flex flex-col items-center justify-center space-y-3">
            <div className="p-3.5 rounded-2xl bg-[#121c2e] border border-slate-800 text-slate-400">
              <FileText className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h4 className="text-base font-extrabold text-white">
              {activeViewTab === 'ACTIVE' ? 'No active financial aid applications' : 'No application history found'}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm">
              {activeViewTab === 'ACTIVE'
                ? 'Applications currently being reviewed or scheduled will appear here.'
                : 'Completed or archived financial subsidy applications will be stored here.'}
            </p>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: DOWNLOADABLE / PRINTABLE APPOINTMENT SLIP */}
      {/* ---------------------------------------------------- */}
      {modalApptSlip && (() => {
        const slipConfig = getSlipConfig(modalApptSlip);
        const dynamicDocs = getDynamicDocumentsList(modalApptSlip);
        return createPortal(
          <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#0b1329] border border-blue-500/50 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-6 text-white space-y-5 relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <img src="/Government Service Integrity Seal.png" alt="QC Seal" className="w-9 h-9 object-contain" />
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider">
                      {slipConfig.title}
                    </h3>
                    <span className="text-[10px] text-blue-400 font-mono">
                      {slipConfig.division}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalApptSlip(null)}
                  className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-[#0e1b36] border border-blue-900/60 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">
                    {slipConfig.refLabel}
                  </span>
                  <span className="font-mono font-extrabold text-blue-400 text-sm">{modalApptSlip.referenceNo}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">APPLICANT NAME:</span>
                  <span className="font-extrabold text-white text-sm">{(modalApptSlip as any).applicantName || modalApptSlip.details?.applicantName || 'JEFFERSON FERNANDO LEE'}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">
                      {slipConfig.dateLabel}
                    </span>
                    <span className="font-extrabold text-amber-400">
                      {slipConfig.schedDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">ORAS:</span>
                    <span className="font-extrabold text-amber-400">
                      {slipConfig.schedTime}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">
                    {slipConfig.venueLabel}
                  </span>
                  <span className="font-bold text-slate-200">
                    {slipConfig.venue}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">MGA DADALHING DOKUMENTO:</span>
                  <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1">
                    {dynamicDocs.map((doc, dIdx) => (
                      <li key={dIdx} className="leading-relaxed">
                        {doc}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span>QC Social Services & Development Dept.</span>
                  <span className="font-mono text-emerald-400 font-bold">OFFICIAL SLIP</span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalApptSlip(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handlePrintModal}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: OFFICIAL SOLO PARENT ID CARD */}
      {/* ---------------------------------------------------- */}
      {modalSoloParentId && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#081024] border border-emerald-500/50 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 text-white space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">OFFICIAL SOLO PARENT ID CARD</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalSoloParentId(null)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ID CARD GRAPHIC */}
            <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 border-2 border-emerald-400/60 rounded-2xl p-5 space-y-4 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-start border-b border-blue-700/50 pb-3">
                <div className="flex items-center gap-2.5">
                  <img src="/Government Service Integrity Seal.png" alt="QC Seal" className="w-10 h-10 object-contain" />
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-emerald-400 block uppercase">REPUBLIC OF THE PHILIPPINES</span>
                    <h4 className="text-xs font-black text-white tracking-wider uppercase">QUEZON CITY GOVERNMENT</h4>
                    <span className="text-[9px] font-bold text-blue-300 block">SOCIAL SERVICES & DEVELOPMENT DEPT.</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                  VALID SPIC
                </span>
              </div>

              <div className="flex gap-4 items-center">
                <div className="w-20 h-24 bg-slate-800 border-2 border-emerald-400/40 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-cover bg-center">
                  <span className="font-extrabold text-2xl text-emerald-400">SP</span>
                </div>

                <div className="space-y-1.5 text-xs flex-1">
                  <div>
                    <span className="text-slate-400 text-[8px] font-bold uppercase block">ID CONTROL NO.</span>
                    <span className="font-mono font-black text-emerald-300 text-sm">SP-2026-88492</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[8px] font-bold uppercase block">SOLO PARENT CARDHOLDER</span>
                    <span className="font-extrabold text-white">{(modalSoloParentId as any).applicantName || 'JEFFERSON FERNANDO LEE'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div>
                      <span className="text-slate-400 text-[8px] block">CATEGORY:</span>
                      <span className="font-bold text-slate-200">Unmarried</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[8px] block">BARANGAY:</span>
                      <span className="font-bold text-slate-200">Bagong Silangan</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-blue-700/50 flex justify-between items-center text-[9px] font-mono text-slate-300">
                <span>ISSUED: OCT 2026</span>
                <span>EXPIRY: OCT 2027</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalSoloParentId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrintModal}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-lg flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Solo Parent ID</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: ₱3,000 CASH SUBSIDY CERTIFICATE */}
      {/* ---------------------------------------------------- */}
      {modalSubsidyCert && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0b1329] border border-amber-500/50 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-6 text-white space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">SOLO PARENT SUBSIDY CERTIFICATE</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalSubsidyCert(null)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CERTIFICATE GRAPHIC */}
            <div className="bg-[#080e1c] border-2 border-amber-400/50 rounded-2xl p-6 space-y-4 text-center relative overflow-hidden">
              <div className="flex justify-center mb-2">
                <img src="/Government Service Integrity Seal.png" alt="QC Seal" className="w-14 h-14 object-contain" />
              </div>

              <div>
                <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase block">QUEZON CITY GOVERNMENT</span>
                <h4 className="text-base font-black text-white tracking-wider uppercase mt-0.5">CERTIFICATE OF SUBSIDY ENTITLEMENT</h4>
                <span className="text-[10px] text-slate-400 block mt-1">ISSUED PURSUANT TO R.A. 11861 (EXPANDED SOLO PARENTS WELFARE ACT)</span>
              </div>

              <div className="py-3 border-y border-amber-500/30 space-y-2 text-xs">
                <p className="text-slate-300">
                  This is to certify that <strong className="text-white font-extrabold text-sm font-mono">{(modalSubsidyCert as any).applicantName || 'JEFFERSON FERNANDO LEE'}</strong> with Solo Parent ID Control No. <strong className="text-amber-400 font-mono">SP-2026-88492</strong> is an officially approved beneficiary entitled to receive the:
                </p>

                <div className="py-2.5 px-4 bg-amber-500/10 border border-amber-500/40 rounded-xl">
                  <span className="text-lg font-black text-amber-400 tracking-tight block">₱3,000.00 FIXED SOLO PARENT CASH SUBSIDY</span>
                  <span className="text-[10px] text-slate-300 font-medium">Quezon City Social Services & Development Department Grant</span>
                </div>
              </div>

              <div className="flex justify-between items-end pt-4 text-left text-[10px]">
                <div>
                  <span className="text-slate-400 block font-bold">CERTIFICATE REF:</span>
                  <span className="font-mono text-amber-300 font-extrabold">{modalSubsidyCert.referenceNo}</span>
                </div>

                <div className="text-right">
                  <span className="font-bold text-white block">MS. JOCELYN REYES, RSW</span>
                  <span className="text-slate-400 block">Head, Solo Parent Welfare Division</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalSubsidyCert(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrintModal}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold rounded-xl shadow-lg flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Certificate</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
