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
import { EligibilityFinderModal, type AiAssessmentResult } from './components/modals/EligibilityFinderModal';
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
  ChevronRight,
  X,
  AlertTriangle,
  LogIn,
  ArrowRight
} from 'lucide-react';


const USER_TAB_TO_PATH: Record<string, string> = {
  'landing': '/',
  'login': '/login',
  'help-guide': '/portal/help-guide',
  'aics': '/portal/aics',
  'aics-medical': '/portal/aics/medical',
  'aics-funeral': '/portal/aics/funeral',
  'pwd': '/portal/pwd',
  'pwd-form': '/portal/pwd/apply',
  'senior': '/portal/senior-citizen',
  'senior-form': '/portal/senior-citizen/apply',
  'soloparent': '/portal/solo-parent',
  'soloparent-form': '/portal/solo-parent/subsidy',
  'soloparent-financial-form': '/portal/solo-parent/subsidy',
  'soloparent-edu-form': '/portal/solo-parent/educational',
  'childwelfare': '/portal/child-welfare',
  'childwelfare-form': '/portal/child-welfare/apply',
  'aics-educational': '/portal/child-welfare/educational',
  'livelihood': '/portal/livelihood',
  'livelihood-grants': '/portal/livelihood',
  'skills-training': '/portal/skills-training',
  'payout': '/portal/financial-aid',
  'disbursements': '/portal/financial-aid',
  'history': '/portal/application-history',
  'profile': '/portal/profile/account',
};

const PATH_TO_USER_TAB: Record<string, string> = {
  '/': 'landing',
  '/login': 'login',
  '/login/forgot-password': 'login',
  '/login/verify-code': 'login',
  '/login/reset-password': 'login',
  '/portal': 'help-guide',
  '/portal/help-guide': 'help-guide',
  '/portal/aics': 'aics',
  '/portal/aics/medical': 'aics-medical',
  '/portal/aics/funeral': 'aics-funeral',
  '/portal/pwd': 'pwd',
  '/portal/pwd/apply': 'pwd-form',
  '/portal/senior-citizen': 'senior',
  '/portal/senior-citizen/apply': 'senior-form',
  '/portal/solo-parent': 'soloparent',
  '/portal/solo-parent/subsidy': 'soloparent-financial-form',
  '/portal/solo-parent/educational': 'soloparent-edu-form',
  '/portal/child-welfare': 'childwelfare',
  '/portal/child-welfare/apply': 'childwelfare-form',
  '/portal/child-welfare/educational': 'aics-educational',
  '/portal/livelihood': 'livelihood',
  '/portal/skills-training': 'skills-training',
  '/portal/financial-aid': 'payout',
  '/portal/application-history': 'history',
  '/portal/profile': 'profile',
  '/portal/profile/account': 'profile',
  '/portal/profile/personal': 'profile',
  '/portal/profile/devices': 'profile',
  '/portal/profile/language': 'profile',
};

const ADMIN_TAB_TO_PATH: Record<string, string> = {
  'reports': '/admin/reports',
  'aics': '/admin/aics',
  'pwd-senior': '/admin/pwd-senior',
  'solo-child': '/admin/solo-child',
  'livelihood': '/admin/livelihood',
  'disbursement': '/admin/financial-aid',
  'beneficiaries': '/admin/beneficiaries',
  'appointments': '/admin/appointments',
  'activity': '/admin/activity-log',
  'users': '/admin/users',
  'profile': '/admin/profile/account',
};

const PATH_TO_ADMIN_TAB: Record<string, string> = {
  '/admin': 'reports',
  '/admin/reports': 'reports',
  '/admin/aics': 'aics',
  '/admin/pwd-senior': 'pwd-senior',
  '/admin/solo-child': 'solo-child',
  '/admin/livelihood': 'livelihood',
  '/admin/financial-aid': 'disbursement',
  '/admin/beneficiaries': 'beneficiaries',
  '/admin/appointments': 'appointments',
  '/admin/activity-log': 'activity',
  '/admin/users': 'users',
  '/admin/profile': 'profile',
  '/admin/profile/account': 'profile',
  '/admin/profile/personal': 'profile',
  '/admin/profile/devices': 'profile',
  '/admin/profile/language': 'profile',
};

export default function App() {
  const { language, t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem('govserve_theme_mode');
      if (savedTheme !== null) {
        return savedTheme === 'dark';
      }
      return false; // Default to White / Light Mode on first visit
    } catch {
      return false;
    }
  });

  // Tab & role state persisted in sessionStorage & synced with URL pathname
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      if (localStorage.getItem('govserve_session_expired') === 'true') {
        return 'login';
      }
      const currentPath = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
      if (currentPath === '/login' || currentPath.startsWith('/login/')) {
        return 'login';
      }
      const hasSession = Boolean(localStorage.getItem('currentUser') || sessionStorage.getItem('activeTab'));
      if (hasSession && PATH_TO_USER_TAB[currentPath] && currentPath !== '/') {
        return PATH_TO_USER_TAB[currentPath];
      }
      if (hasSession && currentPath.startsWith('/admin')) {
        return 'help-guide';
      }
      return sessionStorage.getItem('activeTab') || 'landing';
    } catch {
      return 'landing';
    }
  });

  // 5-Minute Inactivity Session Expired Modal State
  const [isSessionExpiredModalOpen, setIsSessionExpiredModalOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('govserve_session_expired') === 'true';
    } catch {
      return false;
    }
  });

  const handleLogInAgain = () => {
    setIsSessionExpiredModalOpen(false);
    try {
      localStorage.removeItem('govserve_session_expired');
      localStorage.removeItem('govserve_last_activity');
    } catch {}
    setActiveTab('login');
    setTimeout(() => {
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      if (emailInput) emailInput.focus();
    }, 150);
  };

  const [userRole, setUserRole] = useState<'user' | 'admin'>(() => {
    try {
      return (sessionStorage.getItem('userRole') as 'user' | 'admin') || 'user';
    } catch {
      return 'user';
    }
  });

  const [adminTab, setAdminTab] = useState<string>(() => {
    try {
      const currentPath = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
      if (PATH_TO_ADMIN_TAB[currentPath]) {
        return PATH_TO_ADMIN_TAB[currentPath];
      }
      return sessionStorage.getItem('adminTab') || 'reports';
    } catch {
      return 'reports';
    }
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [savedAiAssessment, setSavedAiAssessment] = useState<AiAssessmentResult | null>(() => {
    try {
      const raw = sessionStorage.getItem('govserve_ai_assessment');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const handleSaveAiAssessment = (result: AiAssessmentResult | null) => {
    setSavedAiAssessment(result);
    try {
      if (result) {
        sessionStorage.setItem('govserve_ai_assessment', JSON.stringify(result));
      } else {
        sessionStorage.removeItem('govserve_ai_assessment');
      }
    } catch {}
  };

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

  // Sync activeTab, adminTab, and userRole to browser URL address bar
  useEffect(() => {
    try {
      const currentPath = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
      if (activeTab === 'landing') {
        if (currentPath !== '/') {
          window.history.pushState(null, '', '/');
        }
        return;
      }
      if (activeTab === 'login') {
        if (!currentPath.startsWith('/login')) {
          window.history.pushState(null, '', '/login');
        }
        return;
      }
      if (userRole === 'admin') {
        if (adminTab === 'profile' && currentPath.startsWith('/admin/profile/')) {
          return;
        }
        const targetAdminPath = ADMIN_TAB_TO_PATH[adminTab] || '/admin/reports';
        if (currentPath !== targetAdminPath) {
          window.history.pushState(null, '', targetAdminPath);
        }
      } else {
        if (activeTab === 'profile' && currentPath.startsWith('/portal/profile/')) {
          return;
        }
        const targetUserPath = USER_TAB_TO_PATH[activeTab] || '/portal/help-guide';
        if (currentPath !== targetUserPath) {
          window.history.pushState(null, '', targetUserPath);
        }
      }
    } catch (e) {}
  }, [activeTab, adminTab, userRole]);

  // Listen to browser Back / Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const currentPath = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
      if (currentPath === '/') {
        setActiveTab('landing');
        return;
      }
      if (currentPath === '/login' || currentPath.startsWith('/login/')) {
        setActiveTab('login');
        return;
      }
      if (currentPath.startsWith('/admin')) {
        const mappedAdmin = PATH_TO_ADMIN_TAB[currentPath];
        if (mappedAdmin) {
          setUserRole('admin');
          setActiveTab('help-guide');
          setAdminTab(mappedAdmin);
        }
        return;
      }
      if (currentPath.startsWith('/portal')) {
        const mappedUser = PATH_TO_USER_TAB[currentPath];
        if (mappedUser) {
          setUserRole('user');
          setActiveTab(mappedUser);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Persistent Theme Mode (White / Dark) via localStorage
  useEffect(() => {
    try {
      localStorage.setItem('govserve_theme_mode', darkMode ? 'dark' : 'light');
    } catch (e) {}
  }, [darkMode]);

  // Session Heartbeat Listener: Instant Auto-kickout if remote session is revoked
  useEffect(() => {
    if (activeTab === 'landing' || activeTab === 'login') return;

    let token = '';
    try {
      const savedUserStr = localStorage.getItem('currentUser');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        token = u.session_token || '';
      }
    } catch {}

    if (!token) return;

    const checkSession = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/user/sessions/verify?session_token=${encodeURIComponent(token)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.active === false) {
            localStorage.removeItem('currentUser');
            sessionStorage.removeItem('activeTab');
            sessionStorage.removeItem('userRole');
            alert('Your session has been logged out from another device.');
            setActiveTab('login');
          }
        }
      } catch (err) {
        // silent network error
      }
    };

    const intervalId = setInterval(checkSession, 4000);
    return () => clearInterval(intervalId);
  }, [activeTab]);

  // 5-Minute Inactivity Session Timeout Tracker (Persistent across page reloads)
  useEffect(() => {
    if (activeTab === 'landing' || activeTab === 'login') return;

    const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

    // Initialize activity timestamp if not yet set
    if (!localStorage.getItem('govserve_last_activity')) {
      try {
        localStorage.setItem('govserve_last_activity', Date.now().toString());
      } catch {}
    }

    let throttleTimer = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - throttleTimer > 1500) {
        throttleTimer = now;
        try {
          localStorage.setItem('govserve_last_activity', now.toString());
        } catch {}
      }
    };

    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    activityEvents.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));

    const checkTimeoutInterval = setInterval(() => {
      try {
        const lastActiveStr = localStorage.getItem('govserve_last_activity');
        if (!lastActiveStr) return;

        const lastActive = parseInt(lastActiveStr, 10);
        const elapsed = Date.now() - lastActive;

        if (elapsed >= INACTIVITY_TIMEOUT_MS) {
          // 5-minute timeout reached! Trigger secure kickout
          let token = '';
          try {
            const savedUserStr = localStorage.getItem('currentUser');
            if (savedUserStr) {
              const u = JSON.parse(savedUserStr);
              token = u.session_token || '';
            }
          } catch {}

          if (token) {
            fetch(`${API_BASE_URL}/api/user/sessions/logout-device`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session_token: token })
            }).catch(() => {});
          }

          localStorage.removeItem('currentUser');
          sessionStorage.removeItem('activeTab');
          sessionStorage.removeItem('userRole');
          localStorage.setItem('govserve_session_expired', 'true');
          localStorage.removeItem('govserve_last_activity');

          setActiveTab('login');
          setIsSessionExpiredModalOpen(true);
        }
      } catch {}
    }, 1000);

    return () => {
      activityEvents.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
      clearInterval(checkTimeoutInterval);
    };
  }, [activeTab]);

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

      const soloApps: ApplicationRecord[] = (Array.isArray(soloRaw) ? soloRaw : []).map(row => {
        const isEdu = (row.reference_no || '').startsWith('QC-SP-EDU') || ((row.service_name || '').toLowerCase().includes('educational'));
        return {
          referenceNo: row.reference_no,
          applicantName: row.applicant_name,
          serviceName: isEdu ? 'Solo Parent Educational Assistance Program' : (row.service_name || 'Solo Parent Financial Subsidy Program'),
          category: isEdu ? 'Solo Parent Services' : (row.category || 'soloparent'),
          assistanceType: isEdu ? 'Solo Parent Educational Grant' : (row.assistance_type || 'Solo Parent Welfare Grant'),
          status: row.status || 'Pending Document Validation',
          dateSubmitted: row.date_submitted ? new Date(row.date_submitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
          amountOrType: isEdu ? '₱5,000.00 Fixed Solo Parent Educational Grant' : '₱3,000.00 Fixed Solo Parent Cash Subsidy',
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
        };
      });

      const eduApps: ApplicationRecord[] = (Array.isArray(eduRaw) ? eduRaw : []).map(row => ({
        referenceNo: row.reference_no,
        applicantName: row.applicant_name,
        serviceName: (row.reference_no || '').startsWith('QC-SP-EDU')
          ? 'Solo Parent Educational Assistance Program'
          : (row.reference_no || '').startsWith('QC-CW')
          ? 'Child Welfare Services'
          : 'Educational Assistance for Indigent Children & Youth',
        category: (row.reference_no || '').startsWith('QC-SP-EDU')
          ? 'soloparent'
          : (row.reference_no || '').startsWith('QC-CW')
          ? 'child_welfare'
          : 'educational',
        assistanceType: (row.reference_no || '').startsWith('QC-SP-EDU')
          ? 'Solo Parent Educational Grant'
          : (row.reference_no || '').startsWith('QC-CW')
          ? 'Child Welfare Case Intake'
          : 'Educational Cash Grant',
        status: row.status || 'Pending Document Validation',
        dateSubmitted: row.date_submitted ? new Date(row.date_submitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
        amountOrType: (row.reference_no || '').startsWith('QC-CW')
          ? 'Child Protection & Case Intake Services (Non-Financial)'
          : '₱5,000.00 Educational Grant',
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
    const isEdu = (refNo || '').startsWith('QC-EDU-');
    const isCw = (refNo || '').startsWith('QC-CW-') || (refNo || '').startsWith('CW-');
    const isLvh = (refNo || '').startsWith('LVH-');
    const isTrn = (refNo || '').startsWith('TRN-');

    const endpointsToTry: string[] = [];
    if (isEdu) {
      endpointsToTry.push(
        `${API_BASE_URL}/api/educational/applications/${encodeURIComponent(refNo)}/status`,
        `${API_BASE_URL}/api/child-welfare/applications/${encodeURIComponent(refNo)}/status`
      );
    } else if (isCw) {
      endpointsToTry.push(
        `${API_BASE_URL}/api/child-welfare/applications/${encodeURIComponent(refNo)}/status`,
        `${API_BASE_URL}/api/educational/applications/${encodeURIComponent(refNo)}/status`
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
    } else if (isLvh) {
      endpointsToTry.push(`${API_BASE_URL}/api/livelihood/applications/${encodeURIComponent(refNo)}/status`);
    } else if (isTrn) {
      endpointsToTry.push(`${API_BASE_URL}/api/training/applications/${encodeURIComponent(refNo)}/status`);
    } else {
      endpointsToTry.push(`${API_BASE_URL}/api/aics/applications/${encodeURIComponent(refNo)}/status`);
    }

    try {
      for (const ep of endpointsToTry) {
        await fetch(ep, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, ...(extraFields || {}) })
        }).catch(() => null);
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

    // 3. Check Solo Parent
    if (titleLower.includes('solo parent') || titleLower.includes('soloparent')) {
      if (titleLower.includes('educational') || titleLower.includes('edu') || titleLower.includes('edukasyon') || titleLower.includes('anak')) {
        setActiveTab('soloparent-edu-form');
      } else {
        setActiveTab('soloparent-financial-form');
      }
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
      <>
        <LoginView
          onLoginSuccess={(role) => {
            setUserRole(role);
            setActiveTab('help-guide');
            try {
              localStorage.removeItem('govserve_session_expired');
              localStorage.setItem('govserve_last_activity', Date.now().toString());
            } catch {}
            setIsSessionExpiredModalOpen(false);
          }}
          onBackToHome={() => {
            try {
              localStorage.removeItem('govserve_session_expired');
            } catch {}
            setIsSessionExpiredModalOpen(false);
            setActiveTab('landing');
          }}
          darkMode={darkMode}
        />

        {/* 5-Minute Inactivity Session Expired Dialog Box */}
        {isSessionExpiredModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`w-full max-w-md rounded-2xl p-6 sm:p-7 shadow-2xl border text-center transition-all scale-100 ${
              darkMode 
                ? 'bg-[#0f172a] border-slate-700/80 text-white shadow-black/80' 
                : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <h3 className={`text-xl font-bold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Session Expired
              </h3>

              <p className={`text-sm leading-relaxed mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Your session has expired due to inactivity. Please sign in again to continue.
              </p>

              <button
                type="button"
                onClick={handleLogInAgain}
                className="w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In Again</span>
              </button>
            </div>
          </div>
        )}
      </>
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
        {/* Mobile Backdrop for Admin */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 md:hidden transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile Slide-out Drawer for Admin */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 max-w-[85vw] border-r border-slate-800/80 bg-[#070e1b] flex flex-col shadow-2xl select-none md:hidden transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Header inside Mobile Admin Sidebar */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/60 shrink-0">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src="/Government Service Integrity Seal.png"
                alt="Government Service Integrity Seal"
                className="w-8 h-8 object-contain shrink-0"
              />
              <div className="flex flex-col justify-center truncate">
                <h1 className="font-extrabold text-sm tracking-tight leading-none text-white">GovServe</h1>
                <span className="text-[10px] font-bold tracking-wide text-purple-400 uppercase mt-0.5">Admin Portal</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors shrink-0 cursor-pointer"
              title="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin Navigation Menu for Mobile */}
          <div className="p-3 space-y-4 overflow-y-auto flex-1 text-slate-100">
            <div className="px-3 text-[10px] font-extrabold tracking-wider uppercase text-slate-500">
              OPERATIONS
            </div>
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
                    onClick={() => {
                      setAdminTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 justify-start rounded-2xl text-[13px] font-semibold transition-all border ${
                      isActive
                        ? 'bg-[#152747] text-white border-blue-500/30 shadow-md'
                        : 'bg-transparent text-[#94a3b8] hover:text-white hover:bg-[#101e38] border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-[#94a3b8]'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800/60 space-y-1">
              <div className="px-3 text-[10px] font-bold tracking-wider uppercase mb-1.5 text-slate-500">
                BENEFICIARY & OTHERS
              </div>
              <button
                onClick={() => {
                  setAdminTab('beneficiaries');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 justify-start rounded-2xl text-[13px] font-semibold transition-all border ${
                  adminTab === 'beneficiaries'
                    ? 'bg-[#152747] text-white border-blue-500/30 shadow-md'
                    : 'bg-transparent text-[#94a3b8] hover:text-white hover:bg-[#101e38] border-transparent'
                }`}
              >
                <Contact2 className={`w-4 h-4 shrink-0 ${adminTab === 'beneficiaries' ? 'text-blue-400' : 'text-[#94a3b8]'}`} />
                <span className="truncate">Beneficiary Management</span>
              </button>
              <button
                onClick={() => {
                  setAdminTab('appointments');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 justify-start rounded-2xl text-[13px] font-semibold transition-all border ${
                  adminTab === 'appointments'
                    ? 'bg-[#152747] text-white border-blue-500/30 shadow-md'
                    : 'bg-transparent text-[#94a3b8] hover:text-white hover:bg-[#101e38] border-transparent'
                }`}
              >
                <Calendar className={`w-4 h-4 shrink-0 ${adminTab === 'appointments' ? 'text-blue-400' : 'text-[#94a3b8]'}`} />
                <span className="truncate">Appointments</span>
              </button>
              <button
                onClick={() => {
                  setAdminTab('activity');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 justify-start rounded-2xl text-[13px] font-semibold transition-all border ${
                  adminTab === 'activity'
                    ? 'bg-[#152747] text-white border-blue-500/30 shadow-md'
                    : 'bg-transparent text-[#94a3b8] hover:text-white hover:bg-[#101e38] border-transparent'
                }`}
              >
                <History className={`w-4 h-4 shrink-0 ${adminTab === 'activity' ? 'text-blue-400' : 'text-[#94a3b8]'}`} />
                <span className="truncate">Activity Log</span>
              </button>
              <button
                onClick={() => {
                  setAdminTab('users');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 justify-start rounded-2xl text-[13px] font-semibold transition-all border ${
                  adminTab === 'users'
                    ? 'bg-[#152747] text-white border-blue-500/30 shadow-md'
                    : 'bg-transparent text-[#94a3b8] hover:text-white hover:bg-[#101e38] border-transparent'
                }`}
              >
                <UserCheck className={`w-4 h-4 shrink-0 ${adminTab === 'users' ? 'text-blue-400' : 'text-[#94a3b8]'}`} />
                <span className="truncate">User Management</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Desktop Left Sidebar (hidden on mobile, visible on md: and up) */}
        <aside className={`border-r border-slate-800/80 bg-[#070e1b] flex-col h-screen shrink-0 select-none transition-all duration-300 hidden md:flex ${
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
            onToggleSidebar={() => setSidebarOpen(prev => !prev)}
            isSidebarOpen={sidebarOpen}
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

          {/* Admin Main Content Area (With bottom safe-scroll clearance for mobile browser navigation bars) */}
          <main className={`flex-1 px-3 sm:px-6 pt-3 sm:pt-6 pb-28 sm:pb-8 overflow-y-auto transition-colors duration-200 ${
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
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          isSidebarOpen={sidebarOpen}
          onNavigateToProfile={() => setActiveTab('profile')}
          onNavigateToLogin={() => setActiveTab('login')}
          userRole="user"
          applications={applications}
        />

        {/* Main Content Area (Independent Viewport Scroll with GPU Acceleration and mobile safe bottom padding) */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 lg:pt-8 pb-28 sm:pb-12 space-y-6 sm:space-y-8 [transform:translateZ(0)]">
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

              {savedAiAssessment && savedAiAssessment.recommendedPrograms && savedAiAssessment.recommendedPrograms.length > 0 && (
                <section
                  className={`rounded-2xl border p-5 sm:p-6 shadow-lg transition-all ${
                    darkMode
                      ? 'bg-gradient-to-br from-[#0d1b33] via-[#0e172a] to-[#0a1222] border-emerald-500/40 text-slate-100'
                      : 'bg-gradient-to-br from-emerald-50/70 via-white to-blue-50/40 border-emerald-300 text-slate-900 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/40">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                            savedAiAssessment.eligibilityStatus === 'HIGHLY_ELIGIBLE'
                              ? darkMode
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : darkMode
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {savedAiAssessment.eligibilityStatus === 'HIGHLY_ELIGIBLE' ? 'ELIGIBLE' : 'CONDITIONALLY ELIGIBLE'}
                        </span>
                        <span className={`text-xs font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                          {savedAiAssessment.statusBadge}
                        </span>
                      </div>
                      <h3 className={`text-base sm:text-lg font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Recommended Assistance For You
                      </h3>
                      <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {savedAiAssessment.aiAssessmentSummary}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsEligibilityModalOpen(true)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          darkMode
                            ? 'bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border-blue-500/40'
                            : 'bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border-blue-300'
                        }`}
                      >
                        Re-assess
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveAiAssessment(null)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                          darkMode
                            ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300'
                        }`}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {savedAiAssessment.recommendedPrograms.map((prog, idx) => (
                      <div
                        key={prog.tabKey + idx}
                        className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                          darkMode
                            ? 'bg-[#0b1324]/90 border-slate-700/80 hover:border-emerald-500/50'
                            : 'bg-white border-slate-200 hover:border-emerald-400 shadow-sm'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span
                              className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                idx === 0
                                  ? darkMode
                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : darkMode
                                    ? 'bg-blue-950 text-blue-300 border-blue-500/40'
                                    : 'bg-blue-100 text-blue-800 border-blue-300'
                              }`}
                            >
                              {idx === 0 ? 'Primary Recommendation' : 'Secondary Recommendation'} • {prog.moduleLabel}
                            </span>
                            <span className={`text-xs font-extrabold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                              {prog.matchConfidence}% Match
                            </span>
                          </div>

                          <h4 className={`text-sm sm:text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {prog.programName}
                          </h4>

                          <div className="text-xs font-bold text-amber-500 mt-1">
                            {prog.benefitAmount}
                          </div>

                          <p className={`text-xs mt-2 leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {prog.matchReason}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/40 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => setActiveTab(prog.tabKey)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                          >
                            <span>Apply Now</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <HowItWorks darkMode={darkMode} />

              <ServiceCatalog
                services={filteredServices}
                darkMode={darkMode}
                recommendedPrograms={savedAiAssessment?.recommendedPrograms || []}
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
        onNavigateToProgram={(tabKey) => {
          setActiveTab(tabKey);
          setIsEligibilityModalOpen(false);
        }}
        onSaveAssessmentResult={handleSaveAiAssessment}
        darkMode={darkMode}
      />

      {/* 5-Minute Inactivity Session Expired Dialog Box */}
      {isSessionExpiredModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-2xl p-6 sm:p-7 shadow-2xl border text-center transition-all scale-100 ${
            darkMode 
              ? 'bg-[#0f172a] border-slate-700/80 text-white shadow-black/80' 
              : 'bg-white border-slate-200 text-slate-900 shadow-xl'
          }`}>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className={`text-xl font-bold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Session Expired
            </h3>

            <p className={`text-sm leading-relaxed mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Your session has expired due to inactivity. Please sign in again to continue.
            </p>

            <button
              type="button"
              onClick={handleLogInAgain}
              className="w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In Again</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
