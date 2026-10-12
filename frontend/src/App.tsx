import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from './context/LanguageContext';
import { API_BASE_URL } from './config/api';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { HeroBanner } from './components/user/HeroBanner';
import { HowItWorks } from './components/user/HowItWorks';
import { ServiceCatalog } from './components/user/ServiceCatalog';
import { ModuleCardGrid } from './components/user/ModuleCardGrid';
import { LivelihoodProgramView } from './components/user/LivelihoodProgramView';
import { TrainingProgramView } from './components/user/TrainingProgramView';
import { DisbursementView } from './components/user/DisbursementView';
import { TrackApplicationsModal } from './components/modals/TrackApplicationsModal';
import { EligibilityFinderModal } from './components/modals/EligibilityFinderModal';
import { ServiceDetailModal } from './components/modals/ServiceDetailModal';
import { MedicalAssistanceView } from './components/user/MedicalAssistanceView';
import { FuneralAssistanceView } from './components/user/FuneralAssistanceView';
import { EducationalAssistanceView } from './components/user/EducationalAssistanceView';
import { PwdAssistanceView } from './components/user/PwdAssistanceView';
import { SeniorCitizenAssistanceView } from './components/user/SeniorCitizenAssistanceView';
import { SoloParentAssistanceView } from './components/user/SoloParentAssistanceView';
import { UserProfileView } from './components/user/UserProfileView';
import { LoginView } from './components/login/LoginView';
import { LandingView } from './components/landing';
import { 
  AdminAicsView, 
  AdminPwdSeniorView, 
  AdminSoloChildView, 
  AdminLivelihoodView, 
  AdminDisbursementView, 
  AdminBeneficiaryView, 
  AdminAppointmentView, 
  AdminActivityView, 
  AdminUserView, 
  ReportsAnalyticsView 
} from './admin';

import { initialServices, initialApplications } from './data/servicesData';
import type { ServiceItem, ApplicationRecord } from './types';
import { 
  History, 
  ShieldCheck, 
  QrCode, 
  LayoutDashboard, 
  FileText as FileTextIcon, 
  Users as UsersIcon, 
  LogOut, 
  Sparkles,
  BarChart3,
  ShieldAlert,
  Users,
  Baby,
  GraduationCap,
  Wallet,
  Contact2,
  FolderKanban,
  Calendar,
  UserCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function App() {
  const { language, t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Tab & role state persisted in sessionStorage (retains on page refresh, resets on new tab/window)
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      return sessionStorage.getItem('activeTab') || 'landing';
    } catch {
      return 'landing';
    }
  });

  const [userRole, setUserRole] = useState<'user' | 'admin'>(() => {
    try {
      return (sessionStorage.getItem('userRole') as 'user' | 'admin') || 'user';
    } catch {
      return 'user';
    }
  });

  const [adminTab, setAdminTab] = useState<string>(() => {
    try {
      return sessionStorage.getItem('adminTab') || 'reports';
    } catch {
      return 'reports';
    }
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Sync tab and role states to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('activeTab', activeTab);
    } catch (e) {}
  }, [activeTab]);

  useEffect(() => {
    try {
      sessionStorage.setItem('userRole', userRole);
    } catch (e) {}
  }, [userRole]);

  useEffect(() => {
    try {
      sessionStorage.setItem('adminTab', adminTab);
    } catch (e) {}
  }, [adminTab]);

  // Modals
  const [isTrackModalOpen, setIsTrackModalOpen] = useState<boolean>(false);
  const [isEligibilityModalOpen, setIsEligibilityModalOpen] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  // Dynamic application state
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);

  // Fetch applications from PostgreSQL DB with fast O(1) state comparison
  const fetchDBApplications = async () => {
    try {
      const [resAics, resSenior, resPwd, resSolo, resEdu, resChildWelfare, resLivelihood, resTraining] = await Promise.all([
        fetch(`${API_BASE_URL}/api/aics/applications`).catch(() => null),
        fetch(`${API_BASE_URL}/api/senior/applications`).catch(() => null),
        fetch(`${API_BASE_URL}/api/pwd/applications`).catch(() => null),
        fetch(`${API_BASE_URL}/api/solo-parent/applications`).catch(() => null),
        fetch(`${API_BASE_URL}/api/educational/applications`).catch(() => null),
        fetch(`${API_BASE_URL}/api/child-welfare/applications`).catch(() => null),
        fetch(`${API_BASE_URL}/api/livelihood/applications`).catch(() => null),
        fetch(`${API_BASE_URL}/api/training/applications`).catch(() => null)
      ]);

      const aicsApps: ApplicationRecord[] = (resAics && resAics.ok) ? await resAics.json() : [];
      const seniorRaw: any[] = (resSenior && resSenior.ok) ? await resSenior.json() : [];
      const pwdRaw: any[] = (resPwd && resPwd.ok) ? await resPwd.json() : [];
      const soloRaw: any[] = (resSolo && resSolo.ok) ? await resSolo.json() : [];
      const eduRaw: any[] = (resEdu && resEdu.ok) ? await resEdu.json() : [];
      const cwRaw: any[] = (resChildWelfare && resChildWelfare.ok) ? await resChildWelfare.json() : [];
      const lvhRaw: any[] = (resLivelihood && resLivelihood.ok) ? await resLivelihood.json() : [];
      const trnRaw: any[] = (resTraining && resTraining.ok) ? await resTraining.json() : [];

      const seniorApps: ApplicationRecord[] = (Array.isArray(seniorRaw) ? seniorRaw : []).map(row => ({
        referenceNo: row.reference_no,
        applicantName: row.applicant_name,
        serviceName: row.service_name || 'Senior Citizen Financial Assistance',
        category: row.category || 'Senior Assistance',
        assistanceType: row.assistance_type || 'Senior Cash Grant',
        status: row.status || 'Pending Validation',
        dateSubmitted: row.date_submitted ? new Date(row.date_submitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
        amountOrType: '₱3,000.00 Cash Grant',
        assignedSocialWorker: 'Social Worker Maria Santos, RSW (OSCA Desk)',
        scheduledPayoutDate: row.payout_date || row.scheduled_payout_date,
        scheduledPayoutTime: row.payout_time || row.scheduled_payout_time,
        appointmentDate: row.appointment_date,
        appointmentTime: row.appointment_time,
        appointmentDetails: {
          appointmentDate: row.appointment_date,
          appointmentTime: row.appointment_time,
          venue: row.appointment_venue || 'QC Hall OSCA Desk',
          assignedWorker: 'OSCA Evaluator, RSW'
        },
        disapprovalReason: row.disapproval_reason,
        details: row.details
      }));

      const pwdApps: ApplicationRecord[] = (Array.isArray(pwdRaw) ? pwdRaw : []).map(row => ({
        referenceNo: row.reference_no,
        applicantName: row.applicant_name,
        serviceName: row.service_name || 'PWD Social Assistance Program',
        category: row.category || 'pwd',
        assistanceType: row.assistance_type || 'PWD Social Aid',
        status: row.status || 'Pending Review',
        dateSubmitted: row.date_submitted ? new Date(row.date_submitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
        amountOrType: '₱1,500.00 Quarterly Cash Pension',
        assignedSocialWorker: 'Maria Santos, RSW (QC Social Services)',
        scheduledPayoutDate: row.payout_date || row.scheduled_payout_date,
        scheduledPayoutTime: row.payout_time || row.scheduled_payout_time,
        appointmentDate: row.appointment_date,
        appointmentTime: row.appointment_time,
        appointmentDetails: {
          appointmentDate: row.appointment_date,
          appointmentTime: row.appointment_time,
          venue: row.appointment_venue || 'Quezon City Hall PDAO Room 102',
          assignedWorker: 'PDAO Evaluator, RSW'
        },
        disapprovalReason: row.disapproval_reason,
        details: row.details
      }));

      const soloApps: ApplicationRecord[] = (Array.isArray(soloRaw) ? soloRaw : []).map(row => ({
        referenceNo: row.reference_no,
        applicantName: row.applicant_name,
        serviceName: row.service_name || 'Solo Parent Financial Subsidy Program',
        category: row.category || 'soloparent',
        assistanceType: row.assistance_type || 'Solo Parent Welfare Grant',
        status: row.status || 'Pending Document Validation',
        dateSubmitted: row.date_submitted ? new Date(row.date_submitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
        amountOrType: '₱3,000.00 Fixed Solo Parent Cash Subsidy',
        assignedSocialWorker: 'Ms. Jocelyn Reyes, RSW (Solo Parent Welfare Division)',
        scheduledPayoutDate: row.payout_date || row.scheduled_payout_date,
        scheduledPayoutTime: row.payout_time || row.scheduled_payout_time,
        appointmentDate: row.appointment_date,
        appointmentTime: row.appointment_time,
        appointmentDetails: {
          appointmentDate: row.appointment_date,
          appointmentTime: row.appointment_time,
          venue: row.appointment_venue || 'Quezon City Hall SSDD Office',
          assignedWorker: 'SSDD Social Worker, RSW'
        },
        disapprovalReason: row.disapproval_reason,
        details: row.details
      }));

      const eduApps: ApplicationRecord[] = (Array.isArray(eduRaw) ? eduRaw : []).map(row => ({
        referenceNo: row.reference_no,
        applicantName: row.applicant_name,
        serviceName: (row.reference_no || '').startsWith('QC-CW')
          ? 'Child Welfare Services'
          : row.service_name || 'Educational Assistance for Indigent Children & Youth',
        category: row.category || 'educational',
        assistanceType: row.assistance_type || 'Educational Cash Grant',
        status: row.status || 'Pending Document Validation',
        dateSubmitted: row.date_submitted ? new Date(row.date_submitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
        amountOrType: '₱5,000.00 Educational Grant',
        assignedSocialWorker: 'Ms. Corazon Mendoza, RSW (Child & Youth Welfare)',
        scheduledPayoutDate: row.payout_date || row.scheduled_payout_date,
        scheduledPayoutTime: row.payout_time || row.scheduled_payout_time,
        appointmentDate: row.appointment_date,
        appointmentTime: row.appointment_time,
        appointmentDetails: {
          appointmentDate: row.appointment_date,
          appointmentTime: row.appointment_time,
          venue: row.appointment_venue || 'Quezon City Hall SSDD Desk 4',
          assignedWorker: 'Educational Grant Evaluator, RSW'
        },
        disapprovalReason: row.disapproval_reason,
        details: row.details
      }));

      const cwApps: ApplicationRecord[] = (Array.isArray(cwRaw) ? cwRaw : []).map(row => ({
        referenceNo: row.reference_no,
        applicantName: row.applicant_name,
        serviceName: (row.reference_no || '').startsWith('QC-CW') ? 'Child Welfare Services' : (row.service_name || 'Child Welfare Services'),
        category: row.category || 'Child Welfare',
        assistanceType: row.assistance_type || 'Child Welfare Services',
        status: row.status || 'Pending Assessment',
        dateSubmitted: row.date_submitted ? new Date(row.date_submitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
        amountOrType: 'Child Protection & Intake Services',
        assignedSocialWorker: 'Ms. Corazon Mendoza, RSW (Child & Youth Welfare)',
        scheduledPayoutDate: row.payout_date || row.scheduled_payout_date,
        scheduledPayoutTime: row.payout_time || row.scheduled_payout_time,
        appointmentDate: row.appointment_date,
        appointmentTime: row.appointment_time,
        appointmentDetails: {
          appointmentDate: row.appointment_date,
          appointmentTime: row.appointment_time,
          venue: row.appointment_venue || 'Quezon City Hall SSDD Desk 4',
          assignedWorker: 'Child Welfare Officer, RSW'
        },
        disapprovalReason: row.disapproval_reason,
        details: row.details
      }));

      const lvhApps: ApplicationRecord[] = (Array.isArray(lvhRaw) ? lvhRaw : []).map(row => ({
        referenceNo: row.reference_no,
        applicantName: row.applicant_name,
        serviceName: row.service_name || 'Livelihood & Enterprise Assistance Program',
        category: 'livelihood',
        assistanceType: row.assistance_type || 'Livelihood Capital Grant',
        status: row.status || 'Pending Document Validation',
        dateSubmitted: row.date_submitted ? new Date(row.date_submitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
        amountOrType: row.assistance_type === 'Materials / Supplies' ? 'Materials / Starter Kit' : '₱15,000.00 Capital Grant',
        assignedSocialWorker: 'Social Worker Officer (Livelihood Division)',
        scheduledPayoutDate: row.payout_date,
        scheduledPayoutTime: row.payout_time,
        appointmentDate: row.appointment_date,
        appointmentTime: row.appointment_time,
        appointmentDetails: {
          appointmentDate: row.appointment_date,
          appointmentTime: row.appointment_time,
          venue: row.appointment_venue || 'Quezon City Hall SSDD Livelihood Desk',
          assignedWorker: 'Livelihood Evaluator, RSW'
        },
        disapprovalReason: row.disapproval_reason,
        details: row.details
      }));

      const trnApps: ApplicationRecord[] = (Array.isArray(trnRaw) ? trnRaw : []).map(row => ({
        referenceNo: row.reference_no,
        applicantName: row.applicant_name,
        serviceName: row.course_title || 'Skills & Vocational Training Program',
        category: 'training',
        assistanceType: 'Skills Training Program',
        status: row.status || 'Pending Document Validation',
        dateSubmitted: row.date_submitted ? new Date(row.date_submitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
        amountOrType: 'Free Vocational Training & Orientation',
        assignedSocialWorker: 'Vocational Training Officer, SSDD',
        appointmentDate: row.orientation_date,
        appointmentTime: row.orientation_time,
        appointmentDetails: {
          appointmentDate: row.orientation_date,
          appointmentTime: row.orientation_time,
          venue: row.orientation_venue || 'Quezon City SSDD Training Center',
          assignedWorker: 'Training Evaluator, RSW'
        },
        disapprovalReason: row.rejection_reason,
        details: {
          courseTitle: row.course_title,
          highestEdu: row.highest_edu,
          schoolName: row.school_name,
          trainingPurpose: row.training_purpose,
          purposeReason: row.purpose_reason,
          previousTraining: row.previous_training,
          docRequestLetter: row.doc_request_letter,
          docQcId: row.doc_qc_id,
          docIndigency: row.doc_indigency
        }
      }));

      // Filter out non-AICS records from aicsApps list so module-specific tables take precedence
      const cleanAicsApps = (Array.isArray(aicsApps) ? aicsApps : []).filter(item => {
        const ref = item?.referenceNo || '';
        return !ref.startsWith('QC-PWD-') && !ref.startsWith('SENIOR-') && !ref.startsWith('SP-') && !ref.startsWith('LVH-') && !ref.startsWith('TRN-') && !ref.startsWith('QC-EDU-') && !ref.startsWith('CW-');
      });

      const allDbApps = [
        ...pwdApps,
        ...seniorApps,
        ...soloApps,
        ...eduApps,
        ...cwApps,
        ...lvhApps,
        ...trnApps,
        ...cleanAicsApps
      ];

      const uniqueMap = new Map<string, ApplicationRecord>();
      allDbApps.forEach(item => {
        if (item && item.referenceNo && !uniqueMap.has(item.referenceNo)) {
          uniqueMap.set(item.referenceNo, item);
        }
      });

      setApplications(Array.from(uniqueMap.values()));
    } catch (err) {
      console.log('Notice: Backend API offline or error fetching DB apps:', err);
    }
  };

  useEffect(() => {
    fetchDBApplications();
    const interval = setInterval(fetchDBApplications, 3000);
    window.addEventListener('focus', fetchDBApplications);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchDBApplications);
    };
  }, []);

  const handleAddApplication = async (newApp: ApplicationRecord) => {
    // Update local state immediately
    setApplications((prev) => [newApp, ...prev.filter(a => a.referenceNo !== newApp.referenceNo)]);

    const isPwd = (newApp.category || '').toLowerCase().includes('pwd') || (newApp.serviceName || '').toLowerCase().includes('pwd') || (newApp.referenceNo || '').startsWith('QC-PWD-');
    const isSenior = (newApp.category || '').toLowerCase().includes('senior') || (newApp.serviceName || '').toLowerCase().includes('senior') || (newApp.referenceNo || '').startsWith('SENIOR-');
    const isSolo = (newApp.category || '').toLowerCase() === 'soloparent' || (newApp.referenceNo || '').startsWith('SP-SUBSIDY-') || (newApp.referenceNo || '').startsWith('SP-');
    const isEdu = (newApp.category || '').toLowerCase().includes('educational') || (newApp.category || '').toLowerCase().includes('child') || (newApp.serviceName || '').toLowerCase().includes('child') || (newApp.referenceNo || '').startsWith('QC-SP-EDU-') || (newApp.referenceNo || '').startsWith('QC-EDU-') || (newApp.referenceNo || '').startsWith('CW-');
    const isLvh = (newApp.category || '').toLowerCase() === 'livelihood' || (newApp.referenceNo || '').startsWith('LVH-');
    const isTrn = (newApp.category || '').toLowerCase() === 'training' || (newApp.referenceNo || '').startsWith('TRN-');

    if (isPwd || isSenior || isSolo || isEdu || isLvh || isTrn) {
      return;
    }

    // Persist AICS to PostgreSQL database with retry logic
    let success = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/aics/applications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newApp)
        });
        if (res.ok) {
          const saved = await res.json();
          console.log('✅ Successfully persisted application to PostgreSQL DB:', saved);
          success = true;
          break;
        }
      } catch (err) {
        console.warn(`Attempt ${attempt} to save application failed:`, err);
        if (attempt < 3) await new Promise(r => setTimeout(r, 800));
      }
    }
    if (!success) {
      console.error('❌ Failed to save application to PostgreSQL DB after 3 attempts');
    }
  };

  const handleUpdateStatus = async (refNo: string, newStatus: ApplicationRecord['status'], extraFields?: Record<string, any>) => {
    setApplications(prev => prev.map(app => app.referenceNo === refNo ? { ...app, status: newStatus, ...(extraFields || {}) } : app));
    const isSenior = (refNo || '').startsWith('SENIOR-');
    const isPwd = (refNo || '').startsWith('QC-PWD-') || (refNo || '').includes('PWD');
    const isSolo = (refNo || '').startsWith('SP-') || (refNo || '').startsWith('QC-SP-') || (refNo || '').includes('SOLO');
    const isCw = (refNo || '').startsWith('QC-CW-') || (refNo || '').startsWith('QC-EDU-');
    const isEdu = (refNo || '').startsWith('QC-EDU-');
    const isLvh = (refNo || '').startsWith('LVH-');
    const isTrn = (refNo || '').startsWith('TRN-');

    const endpointsToTry: string[] = [];
    if (isCw) {
      endpointsToTry.push(
        `${API_BASE_URL}/api/child-welfare/applications/${encodeURIComponent(refNo)}/status`,
        `${API_BASE_URL}/api/educational/applications/${encodeURIComponent(refNo)}/status`,
        `${API_BASE_URL}/api/solo-parent/applications/${encodeURIComponent(refNo)}/status`
      );
    } else if (isSenior) {
      endpointsToTry.push(`${API_BASE_URL}/api/senior/applications/${encodeURIComponent(refNo)}/status`);
    } else if (isPwd) {
      endpointsToTry.push(`${API_BASE_URL}/api/pwd/applications/${encodeURIComponent(refNo)}/status`);
    } else if (isSolo) {
      endpointsToTry.push(
        `${API_BASE_URL}/api/solo-parent/applications/${encodeURIComponent(refNo)}/status`,
        `${API_BASE_URL}/api/educational/applications/${encodeURIComponent(refNo)}/status`
      );
    } else if (isEdu) {
      endpointsToTry.push(
        `${API_BASE_URL}/api/educational/applications/${encodeURIComponent(refNo)}/status`,
        `${API_BASE_URL}/api/child-welfare/applications/${encodeURIComponent(refNo)}/status`
      );
    } else if (isLvh) {
      endpointsToTry.push(`${API_BASE_URL}/api/livelihood/applications/${encodeURIComponent(refNo)}/status`);
    } else if (isTrn) {
      endpointsToTry.push(`${API_BASE_URL}/api/training/applications/${encodeURIComponent(refNo)}/status`);
    } else {
      endpointsToTry.push(`${API_BASE_URL}/api/aics/applications/${encodeURIComponent(refNo)}/status`);
    }

    try {
      for (const ep of endpointsToTry) {
        const res = await fetch(ep, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, ...(extraFields || {}) })
        });
        if (res.ok) break;
      }
    } catch (err) {
      console.error('Error updating status in DB:', err);
    }
  };

  const handleNavigateToFormDirect = (title: string, description?: string) => {
    const titleLower = title.toLowerCase();

    // 1. Check PWD first
    if (titleLower.includes('pwd') || titleLower.includes('disabilit') || titleLower.includes('kapansanan')) {
      setActiveTab('pwd-form');
      return;
    }

    // 2. Check Senior Citizen next
    if (titleLower.includes('senior') || titleLower.includes('nakatatanda') || titleLower.includes('elderly') || titleLower.includes('osca')) {
      setActiveTab('senior-form');
      return;
    }

    // 3. Check Solo Parent (Strictly Financial Subsidy)
    if (titleLower.includes('solo parent') || titleLower.includes('soloparent')) {
      setActiveTab('soloparent-financial-form');
      return;
    }

    // 4. Check Child Welfare Services (non-cash)
    if (titleLower.includes('child welfare services') || titleLower.includes('kalinga at proteksyon') || titleLower.includes('proteksyon ng bata')) {
      setActiveTab('childwelfare-form');
      return;
    }

    // 5. Check Educational Assistance
    if (
      titleLower.includes('educational assistance for indigent') ||
      titleLower.includes('tulong sa edukasyon para sa mga bata') ||
      titleLower.includes('educational') ||
      titleLower.includes('education') ||
      titleLower.includes('edukasyon')
    ) {
      setActiveTab('aics-educational');
      return;
    }

    // 6. Check Medical
    if (titleLower.includes('medical') || titleLower.includes('medikal') || titleLower.includes('hospital')) {
      setActiveTab('aics-medical');
      return;
    }

    // 7. Check Funeral / Burial
    if (titleLower.includes('burial') || titleLower.includes('funeral') || titleLower.includes('pagpapalibing')) {
      setActiveTab('aics-funeral');
      return;
    }

    // 8. Check Livelihood / Skills
    if (titleLower.includes('livelihood') || titleLower.includes('pangkabuhayan') || titleLower.includes('puhunan')) {
      setActiveTab('livelihood');
      return;
    }
    if (titleLower.includes('training') || titleLower.includes('skills') || titleLower.includes('pagsasanay') || titleLower.includes('bokasyonal')) {
      setActiveTab('skills-training');
      return;
    }

    // Fallback using description
    const t = (title + ' ' + (description || '')).toLowerCase();
    if (t.includes('pwd') || t.includes('disabilit') || t.includes('kapansanan')) {
      setActiveTab('pwd-form');
      return;
    }
    if (t.includes('senior') || t.includes('nakatatanda') || t.includes('elderly')) {
      setActiveTab('senior-form');
      return;
    }
    if (t.includes('medical') || t.includes('medikal') || t.includes('hospital')) {
      setActiveTab('aics-medical');
      return;
    }
    if (t.includes('burial') || t.includes('funeral') || t.includes('pagpapalibing')) {
      setActiveTab('aics-funeral');
      return;
    }
    if (t.includes('child welfare') || t.includes('childwelfare') || t.includes('kalinga') || t.includes('proteksyon')) {
      setActiveTab('childwelfare-form');
      return;
    }
    if (t.includes('educational') || t.includes('education') || t.includes('edukasyon')) {
      setActiveTab('aics-educational');
      return;
    }
    if (t.includes('livelihood') || t.includes('pangkabuhayan') || t.includes('puhunan')) {
      setActiveTab('livelihood');
      return;
    }
    if (t.includes('training') || t.includes('skills') || t.includes('pagsasanay')) {
      setActiveTab('skills-training');
      return;
    }

    setActiveTab('aics-educational');
  };

  const handleApplyFromModule = (title: string, description: string) => {
    if (activeTab === 'pwd') {
      setActiveTab('pwd-form');
      return;
    }
    if (activeTab === 'senior') {
      setActiveTab('senior-form');
      return;
    }
    if (activeTab === 'soloparent') {
      const lower = title.toLowerCase();
      if (lower.includes('educational') || lower.includes('edu') || lower.includes('edukasyon') || lower.includes('anak')) {
        setActiveTab('soloparent-edu-form');
      } else {
        setActiveTab('soloparent-financial-form');
      }
      return;
    }
    if (activeTab === 'childwelfare') {
      const lower = title.toLowerCase();
      if (lower.includes('educational') || lower.includes('edu') || lower.includes('edukasyon')) {
        setActiveTab('aics-educational');
      } else {
        setActiveTab('childwelfare-form');
      }
      return;
    }
    handleNavigateToFormDirect(title, description);
  };

  // Filtered Services Logic for Help Guide Search
  const filteredServices = useMemo(() => {
    return initialServices.filter((service) => {
      // Hero Banner Filter Pills
      if (activeFilter === 'aics' && service.category !== 'aics') return false;
      if (activeFilter === 'pwd_senior' && service.category !== 'pwd' && service.category !== 'senior') return false;
      if (activeFilter === 'solo_child' && service.category !== 'soloparent' && service.category !== 'child') return false;
      if (activeFilter === 'livelihood_payout' && service.category !== 'livelihood') return false;

      // Search Query Filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesTitle = service.title.toLowerCase().includes(query);
        const matchesDesc = service.description.toLowerCase().includes(query);
        const matchesReqs = service.requirements.some((r) => r.toLowerCase().includes(query));
        return matchesTitle || matchesDesc || matchesReqs;
      }

      return true;
    });
  }, [activeFilter, searchQuery]);

  // Dynamic Header Section Name (Matching Screenshots)
  const sectionTitleMap: Record<string, string> = {
    'help-guide': t('nav.guide'),
    'aics': t('nav.aics'),
    'aics-medical': t('nav.aics'),
    'aics-funeral': t('nav.aics'),
    'aics-educational': t('nav.child_welfare'),
    'pwd': t('nav.pwd'),
    'pwd-form': t('nav.pwd'),
    'senior': t('nav.senior'),
    'senior-form': t('nav.senior'),
    'soloparent': t('nav.solo_parent'),
    'soloparent-form': t('nav.solo_parent'),
    'soloparent-financial-form': t('nav.solo_parent'),
    'soloparent-edu-form': t('nav.solo_parent'),
    'childwelfare': t('nav.child_welfare'),
    'livelihood': `${t('nav.livelihood')} — ${language === 'Tagalog' ? 'Programa sa Pangkabuhayan' : 'Livelihood Program'}`,
    'livelihood-grants': `${t('nav.livelihood')} — ${language === 'Tagalog' ? 'Programa sa Pangkabuhayan' : 'Livelihood Program'}`,
    'skills-training': `${t('nav.livelihood')} — ${language === 'Tagalog' ? 'Programa sa Pagsasanay' : 'Training Program'}`,
    'payout': t('nav.disbursement'),
    'history': t('nav.history'),
    'profile': t('nav.profile'),
  };

  if (activeTab === 'landing') {
    return (
      <LandingView
        onAccessPortal={() => setActiveTab('login')}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />
    );
  }

  if (activeTab === 'login') {
    return (
      <LoginView
        onLoginSuccess={(role) => {
          setUserRole(role);
          setActiveTab('help-guide');
        }}
        onBackToHome={() => setActiveTab('landing')}
        darkMode={darkMode}
      />
    );
  }

  if (userRole === 'admin') {
    const adminTabTitles: Record<string, string> = {
      'profile': 'Administrator Profile',
      'reports': 'Reports & Analytics',
      'aics': 'AICS Applications Management',
      'pwd-senior': 'PWD & Senior Citizens Registry',
      'solo-child': 'Solo Parent & Child Welfare',
      'livelihood': 'Livelihood & Grants Management',
      'disbursement': 'Disbursement & Financial Aid Payouts',
      'beneficiaries': 'Beneficiary Master Registry',
      'appointments': 'Citizen Appointments Calendar',
      'activity': 'System Security & Activity Log',
      'users': 'User & Access Control Management',
    };

    return (
      <div className={`h-screen max-h-screen overflow-hidden flex flex-row font-['Plus_Jakarta_Sans',sans-serif] ${
        darkMode ? 'bg-[#070e1b] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}>
        {/* Left Sidebar (Full Height from Top to Bottom with Collapse Support) */}
        <aside className={`border-r border-slate-800/80 bg-[#070e1b] flex flex-col h-screen shrink-0 select-none transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}>
          {/* Top Header inside Sidebar with Seal Logo & Collapse Button */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/60 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src="/Government Service Integrity Seal.png"
                alt="Government Service Integrity Seal"
                className="w-9 h-9 object-contain shrink-0"
              />
              {sidebarOpen && (
                <div className="flex flex-col justify-center truncate">
                  <h1 className="font-extrabold text-base tracking-tight leading-none text-white">GovServe</h1>
                  <span className="text-[10px] font-bold tracking-wide text-purple-400 uppercase mt-0.5">Admin Portal</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 text-slate-400 hover:text-white transition-colors shrink-0 ml-1 cursor-pointer"
              title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Admin Navigation Menu (Matching Reference Screenshot) */}
          <div className="p-3 space-y-4 overflow-y-auto flex-1 text-slate-100">
            
            {/* Top Main Section */}
            <div className="space-y-1">
              {[
                { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
                { id: 'aics', label: 'Assistance to Individuals in Crisis', icon: ShieldAlert },
                { id: 'pwd-senior', label: 'PWD & Senior Citizens', icon: Users },
                { id: 'solo-child', label: 'Solo Parent & Child Welfare', icon: Baby },
                { id: 'livelihood', label: 'Livelihood & Training Grants', icon: GraduationCap },
                { id: 'disbursement', label: 'Financial Aid Disbursement', icon: Wallet },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = adminTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setAdminTab(item.id)}
                    className={`w-full flex items-center ${
                      sidebarOpen ? 'gap-3.5 px-4 py-3 justify-start' : 'justify-center p-3'
                    } rounded-2xl text-[13px] font-semibold transition-all duration-150 border group cursor-pointer ${
                      isActive
                        ? 'bg-[#152747] text-white border-blue-500/30 shadow-md'
                        : 'bg-transparent text-[#94a3b8] hover:text-white hover:bg-[#101e38] border-transparent'
                    }`}
                    title={sidebarOpen ? undefined : item.label}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-blue-400' : 'text-[#94a3b8] group-hover:text-white'
                    }`} />
                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>

            {/* BENEFICIARY Section */}
            <div className="pt-2 border-t border-slate-800/60 space-y-1">
              {sidebarOpen && (
                <div className="px-4 text-[10px] font-bold tracking-wider uppercase mb-1.5 text-slate-500">
                  BENEFICIARY
                </div>
              )}
              <button
                onClick={() => setAdminTab('beneficiaries')}
                className={`w-full flex items-center ${
                  sidebarOpen ? 'gap-3.5 px-4 py-3 justify-start' : 'justify-center p-3'
                } rounded-2xl text-[13px] font-semibold transition-all duration-150 border group cursor-pointer ${
                  adminTab === 'beneficiaries'
                    ? 'bg-[#152747] text-white border-blue-500/30 shadow-md'
                    : 'bg-transparent text-[#94a3b8] hover:text-white hover:bg-[#101e38] border-transparent'
                }`}
                title={sidebarOpen ? undefined : "Beneficiary Management"}
              >
                <Contact2 className={`w-4 h-4 shrink-0 transition-colors ${
                  adminTab === 'beneficiaries' ? 'text-blue-400' : 'text-[#94a3b8] group-hover:text-white'
                }`} />
                {sidebarOpen && <span className="truncate">Beneficiary Management</span>}
              </button>
            </div>



            {/* SCHEDULING Section */}
            <div className="pt-2 border-t border-slate-800/60 space-y-1">
              {sidebarOpen && (
                <div className="px-4 text-[10px] font-bold tracking-wider uppercase mb-1.5 text-slate-500">
                  SCHEDULING
                </div>
              )}
              <button
                onClick={() => setAdminTab('appointments')}
                className={`w-full flex items-center ${
                  sidebarOpen ? 'gap-3.5 px-4 py-3 justify-start' : 'justify-center p-3'
                } rounded-2xl text-[13px] font-semibold transition-all duration-150 border group cursor-pointer ${
                  adminTab === 'appointments'
                    ? 'bg-[#152747] text-white border-blue-500/30 shadow-md'
                    : 'bg-transparent text-[#94a3b8] hover:text-white hover:bg-[#101e38] border-transparent'
                }`}
                title={sidebarOpen ? undefined : "Appointments"}
              >
                <Calendar className={`w-4 h-4 shrink-0 transition-colors ${
                  adminTab === 'appointments' ? 'text-blue-400' : 'text-[#94a3b8] group-hover:text-white'
                }`} />
                {sidebarOpen && <span className="truncate">Appointments</span>}
              </button>
            </div>

            {/* MONITORING Section */}
            <div className="pt-2 border-t border-slate-800/60 space-y-1">
              {sidebarOpen && (
                <div className="px-4 text-[10px] font-bold tracking-wider uppercase mb-1.5 text-slate-500">
                  MONITORING
                </div>
              )}
              <button
                onClick={() => setAdminTab('activity')}
                className={`w-full flex items-center ${
                  sidebarOpen ? 'gap-3.5 px-4 py-3 justify-start' : 'justify-center p-3'
                } rounded-2xl text-[13px] font-semibold transition-all duration-150 border group cursor-pointer ${
                  adminTab === 'activity'
                    ? 'bg-[#152747] text-white border-blue-500/30 shadow-md'
                    : 'bg-transparent text-[#94a3b8] hover:text-white hover:bg-[#101e38] border-transparent'
                }`}
                title={sidebarOpen ? undefined : "Activity Log"}
              >
                <History className={`w-4 h-4 shrink-0 transition-colors ${
                  adminTab === 'activity' ? 'text-blue-400' : 'text-[#94a3b8] group-hover:text-white'
                }`} />
                {sidebarOpen && <span className="truncate">Activity Log</span>}
              </button>
            </div>

            {/* ADMINISTRATION Section */}
            <div className="pt-2 border-t border-slate-800/60 space-y-1">
              {sidebarOpen && (
                <div className="px-4 text-[10px] font-bold tracking-wider uppercase mb-1.5 text-slate-500">
                  ADMINISTRATION
                </div>
              )}
              <button
                onClick={() => setAdminTab('users')}
                className={`w-full flex items-center ${
                  sidebarOpen ? 'gap-3.5 px-4 py-3 justify-start' : 'justify-center p-3'
                } rounded-2xl text-[13px] font-semibold transition-all duration-150 border group cursor-pointer ${
                  adminTab === 'users'
                    ? 'bg-[#152747] text-white border-blue-500/30 shadow-md'
                    : 'bg-transparent text-[#94a3b8] hover:text-white hover:bg-[#101e38] border-transparent'
                }`}
                title={sidebarOpen ? undefined : "User Management"}
              >
                <UserCheck className={`w-4 h-4 shrink-0 transition-colors ${
                  adminTab === 'users' ? 'text-blue-400' : 'text-[#94a3b8] group-hover:text-white'
                }`} />
                {sidebarOpen && <span className="truncate">User Management</span>}
              </button>
            </div>

          </div>
        </aside>

        {/* Right Main Container: Top Header Navbar + Active View */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Top Navbar */}
          <Navbar
            activeSection={adminTabTitles[adminTab] || 'Admin Management'}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            onNavigateToProfile={() => setAdminTab('profile')}
            onNavigateToLogin={() => {
              setUserRole('user');
              setActiveTab('login');
            }}
            userRole="admin"
            userName="System Admin"
            userSubtitle="Administrator"
            userInitials="AD"
            applications={applications}
          />

          {/* Admin Main Content Area */}
          <main className={`flex-1 p-6 overflow-y-auto transition-colors duration-200 ${
            darkMode ? 'bg-[#070e1b] text-slate-100' : 'bg-slate-100 text-slate-900'
          }`}>
            {adminTab === 'profile' ? (
              <UserProfileView darkMode={darkMode} userRole="admin" />
            ) : adminTab === 'reports' ? (
              <ReportsAnalyticsView darkMode={darkMode} applications={applications} />
            ) : adminTab === 'aics' ? (
              <AdminAicsView darkMode={darkMode} applications={applications} onUpdateStatus={handleUpdateStatus} />
            ) : adminTab === 'pwd-senior' ? (
              <AdminPwdSeniorView darkMode={darkMode} applications={applications} onUpdateStatus={handleUpdateStatus} />
            ) : adminTab === 'solo-child' ? (
              <AdminSoloChildView darkMode={darkMode} />
            ) : adminTab === 'livelihood' ? (
              <AdminLivelihoodView darkMode={darkMode} />
            ) : adminTab === 'disbursement' ? (
              <AdminDisbursementView 
                darkMode={darkMode} 
                applications={applications} 
                onUpdateStatus={handleUpdateStatus}
              />
            ) : adminTab === 'beneficiaries' ? (
              <AdminBeneficiaryView darkMode={darkMode} />
            ) : adminTab === 'appointments' ? (
              <AdminAppointmentView 
                darkMode={darkMode} 
                applications={applications} 
                onUpdateStatus={handleUpdateStatus}
              />
            ) : adminTab === 'activity' ? (
              <AdminActivityView darkMode={darkMode} />
            ) : (
              <AdminUserView darkMode={darkMode} />
            )}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen max-h-screen overflow-hidden flex flex-row font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-200 ${
      darkMode ? 'dark bg-[#0b1220] text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Left Sidebar (Full height from top to bottom) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        darkMode={darkMode}
      />

      {/* Main Right Column: Top Header Navbar + Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          activeSection={sectionTitleMap[activeTab] || 'Help & Service Guide'}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onNavigateToProfile={() => setActiveTab('profile')}
          onNavigateToLogin={() => setActiveTab('login')}
          userRole="user"
          applications={applications}
        />

        {/* Main Content Area (Independent Viewport Scroll with GPU Acceleration) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 [transform:translateZ(0)]">
          {activeTab === 'help-guide' ? (
            /* Help & Service Guide Main Overview Page */
            <>
              <HeroBanner
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                onOpenTrackModal={() => setIsTrackModalOpen(true)}
                onOpenEligibilityModal={() => setIsEligibilityModalOpen(true)}
                darkMode={darkMode}
              />

              <HowItWorks darkMode={darkMode} />

              <ServiceCatalog
                services={filteredServices}
                darkMode={darkMode}
                onSelectService={(service) => {
                  handleNavigateToFormDirect(service.title, service.description);
                }}
                filterTitle="Available Social Services Programs"
              />
            </>
          ) : activeTab === 'aics-medical' ? (
            /* Dedicated QC Medical Assistance 4-Step Form View */
            <MedicalAssistanceView
              onBack={() => setActiveTab('aics')}
              onAddApplication={handleAddApplication}
              darkMode={darkMode}
              applications={applications}
              onNavigateToModule={(tab) => setActiveTab(tab)}
            />
          ) : activeTab === 'aics-funeral' ? (
            /* Dedicated QC Funeral Assistance 4-Step Form View */
            <FuneralAssistanceView
              onBack={() => setActiveTab('aics')}
              onAddApplication={handleAddApplication}
              darkMode={darkMode}
              applications={applications}
              onNavigateToModule={(tab) => setActiveTab(tab)}
            />
          ) : activeTab === 'aics-educational' ? (
            /* Dedicated QC Educational Assistance 4-Step Form View */
            <EducationalAssistanceView
              mode="educational"
              onBack={() => setActiveTab('childwelfare')}
              onAddApplication={handleAddApplication}
              darkMode={darkMode}
              onNavigateToModule={(tab) => setActiveTab(tab)}
              applications={applications}
            />
          ) : activeTab === 'childwelfare-form' ? (
            /* Dedicated QC Child Welfare Services 4-Step Form View */
            <EducationalAssistanceView
              mode="childwelfare"
              onBack={() => setActiveTab('childwelfare')}
              onAddApplication={handleAddApplication}
              darkMode={darkMode}
              onNavigateToModule={(tab) => setActiveTab(tab)}
              applications={applications}
            />
          ) : activeTab === 'pwd-form' ? (
            /* Dedicated PWD Social Assistance 4-Step Form View */
            <PwdAssistanceView
              onBack={() => setActiveTab('pwd')}
              onAddApplication={handleAddApplication}
              darkMode={darkMode}
              onNavigateToModule={(tab) => setActiveTab(tab)}
              applications={applications}
            />
          ) : activeTab === 'senior-form' ? (
            /* Dedicated Senior Citizen Social Welfare Assistance 4-Step Form View */
            <SeniorCitizenAssistanceView
              onBack={() => setActiveTab('senior')}
              onAddApplication={handleAddApplication}
              darkMode={darkMode}
              onNavigateToModule={(tab) => setActiveTab(tab)}
              applications={applications}
            />
          ) : activeTab === 'soloparent-form' || activeTab === 'soloparent-financial-form' ? (
            /* Dedicated Solo Parent Financial Subsidy 4-Step Form View */
            <SoloParentAssistanceView
              onBack={() => setActiveTab('soloparent')}
              onAddApplication={handleAddApplication}
              darkMode={darkMode}
              onNavigateToModule={(tab) => setActiveTab(tab)}
              applications={applications}
            />
          ) : activeTab === 'soloparent-edu-form' ? (
            /* Dedicated QC Solo Parent Educational Assistance 4-Step Form View */
            <EducationalAssistanceView
              mode="soloparent"
              onBack={() => setActiveTab('soloparent')}
              onAddApplication={handleAddApplication}
              darkMode={darkMode}
              onNavigateToModule={(tab) => setActiveTab(tab)}
              applications={applications}
            />
          ) : activeTab === 'profile' ? (
            /* Dedicated User Profile Content View */
            <UserProfileView darkMode={darkMode} />
          ) : activeTab === 'livelihood' || activeTab === 'livelihood-grants' ? (
            /* Livelihood Program View */
            <LivelihoodProgramView
              onBack={() => setActiveTab('help-guide')}
              onAddApplication={handleAddApplication}
              darkMode={darkMode}
              onNavigateToModule={(tab) => setActiveTab(tab)}
              applications={applications}
            />
          ) : activeTab === 'skills-training' ? (
            /* Training Program View */
            <TrainingProgramView
              onApplyCourse={(courseTitle) => handleApplyFromModule(courseTitle, `Free skills and vocational training course for ${courseTitle}.`)}
              onAddApplication={handleAddApplication}
              darkMode={darkMode}
              onNavigateToModule={(tab) => setActiveTab(tab)}
              applications={applications}
            />
          ) : activeTab === 'payout' || activeTab === 'disbursements' ? (
            /* Dedicated Financial Aid Disbursement View connecting all 4 Modules */
            <DisbursementView
              darkMode={darkMode}
              onNavigateToModule={(tabKey) => setActiveTab(tabKey)}
              applications={applications}
            />
          ) : activeTab === 'history' ? (
            /* Application History View */
            <section className={`border rounded-2xl p-6 shadow-xl space-y-6 ${
              darkMode ? 'bg-[#0e172a]/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`text-xl font-extrabold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    <History className="w-5 h-5 text-blue-500" />
                    Application History & Disbursement Records
                  </h3>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Official log of applications filed under Citizen Jefferson Lee (PhilSys Verified)
                  </p>
                </div>
                <button
                  onClick={() => setIsTrackModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl border border-blue-400/40"
                >
                  Track Status
                </button>
              </div>

              <div className="space-y-4">
                {applications.map((app) => (
                  <div
                    key={app.referenceNo}
                    className={`p-5 border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
                      darkMode 
                        ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700' 
                        : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
                          darkMode ? 'text-blue-400 bg-blue-950 border-blue-800' : 'text-blue-700 bg-blue-50 border-blue-200'
                        }`}>
                          {app.referenceNo}
                        </span>
                        <span className={`text-[10px] font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {app.category}
                        </span>
                      </div>
                      <h4 className={`text-base font-bold mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {app.serviceName}
                      </h4>
                      <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Assigned: {app.assignedSocialWorker} • Submitted {app.dateSubmitted}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right">
                        <div className="text-xs font-bold text-amber-500">{app.amountOrType}</div>
                        <span className="text-[10px] text-emerald-600 font-semibold">{app.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            /* Module Card Views for AICS, PWD, Senior, Solo Parent, Child Welfare */
            <ModuleCardGrid
              activeTab={activeTab}
              onApply={handleApplyFromModule}
              darkMode={darkMode}
            />
          )}


        </main>
      </div>

      {/* Modals */}
      <TrackApplicationsModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
        applications={applications}
        darkMode={darkMode}
      />

      <EligibilityFinderModal
        isOpen={isEligibilityModalOpen}
        onClose={() => setIsEligibilityModalOpen(false)}
        onApplyCategoryFilter={(category) => {
          setActiveFilter(category);
          setActiveTab('help-guide');
        }}
        darkMode={darkMode}
      />
    </div>
  );
}
