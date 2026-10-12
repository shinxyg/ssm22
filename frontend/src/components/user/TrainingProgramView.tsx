import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { API_BASE_URL } from '../../config/api';
import { 
  BookOpen, 
  FileEdit, 
  Calendar, 
  Clock, 
  AlertCircle,
  MapPin,
  Coffee, 
  Monitor, 
  Scissors, 
  Sparkles, 
  Shirt, 
  Home, 
  Heart, 
  Flame, 
  Utensils, 
  ArrowRight,
  UserCheck,
  Lock,
  Upload,
  Camera,
  CheckCircle2,
  X,
  FileCheck,
  FileText,
  Printer,
  Download,
  ChevronRight,
  ChevronUp,
  GraduationCap,
  Target,
  History,
  Search,
  Filter,
  Users,
  Building,
  Award,
  Info,
  ExternalLink
} from 'lucide-react';
import type { ApplicationRecord } from '../../types';

interface TrainingCourse {
  id: string;
  title: string;
  slots: string;
  duration: string;
  description: string;
  batch: string;
  opens: string;
  deadline: string;
  starts: string;
  icon: any;
  schedule?: string;
  venue?: string;
  address?: string;
  syllabus?: string[];
}

interface TrainingProgramViewProps {
  onApplyCourse?: (courseTitle: string) => void;
  onAddApplication?: (app: ApplicationRecord) => void;
  darkMode?: boolean;
  onNavigateToModule?: (tab: string) => void;
  applications?: ApplicationRecord[];
}

export const getBatchTimelineInfo = (durationStr?: string, customDate?: Date) => {
  const now = customDate || new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const is30Days = (durationStr || '').includes('30');

  let batchName = `4th Batch ${year}`;
  let opensDateStr = `October 1, ${year}`;
  let deadlineDateStr = `October 15, ${year}`;
  let startsDateStr = `November 3, ${year}`;
  let endDateStr = is30Days ? `December 3, ${year}` : `November 20, ${year}`;
  
  let opensDateObj = new Date(year, 9, 1);
  let deadlineDateObj = new Date(year, 9, 15, 23, 59, 59);
  let startDateObj = new Date(year, 10, 3);
  let endDateObj = is30Days ? new Date(year, 11, 3) : new Date(year, 10, 20);

  if (month < 3) {
    batchName = `1st Batch ${year}`;
    opensDateStr = `January 15, ${year}`;
    deadlineDateStr = `January 30, ${year}`;
    startsDateStr = `February 1, ${year}`;
    endDateStr = is30Days ? `March 3, ${year}` : `February 18, ${year}`;
    opensDateObj = new Date(year, 0, 15);
    deadlineDateObj = new Date(year, 0, 30, 23, 59, 59);
    startDateObj = new Date(year, 1, 1);
    endDateObj = is30Days ? new Date(year, 2, 3) : new Date(year, 1, 18);
  } else if (month < 6) {
    batchName = `2nd Batch ${year}`;
    opensDateStr = `April 1, ${year}`;
    deadlineDateStr = `April 15, ${year}`;
    startsDateStr = `May 1, ${year}`;
    endDateStr = is30Days ? `May 30, ${year}` : `May 18, ${year}`;
    opensDateObj = new Date(year, 3, 1);
    deadlineDateObj = new Date(year, 3, 15, 23, 59, 59);
    startDateObj = new Date(year, 4, 1);
    endDateObj = is30Days ? new Date(year, 4, 30) : new Date(year, 4, 18);
  } else if (month < 9) {
    batchName = `3rd Batch ${year}`;
    opensDateStr = `July 1, ${year}`;
    deadlineDateStr = `July 15, ${year}`;
    startsDateStr = `August 1, ${year}`;
    endDateStr = is30Days ? `August 30, ${year}` : `August 18, ${year}`;
    opensDateObj = new Date(year, 6, 1);
    deadlineDateObj = new Date(year, 6, 15, 23, 59, 59);
    startDateObj = new Date(year, 7, 1);
    endDateObj = is30Days ? new Date(year, 7, 30) : new Date(year, 7, 18);
  } else {
    batchName = `4th Batch ${year}`;
    opensDateStr = `October 1, ${year}`;
    deadlineDateStr = `October 15, ${year}`;
    startsDateStr = `November 3, ${year}`;
    endDateStr = is30Days ? `December 3, ${year}` : `November 20, ${year}`;
    opensDateObj = new Date(year, 9, 1);
    deadlineDateObj = new Date(year, 9, 15, 23, 59, 59);
    startDateObj = new Date(year, 10, 3);
    endDateObj = is30Days ? new Date(year, 11, 3) : new Date(year, 10, 20);
  }

  const isRegistrationOpen = now >= opensDateObj && now <= deadlineDateObj;
  const isTrainingInSession = now >= startDateObj && now <= endDateObj;
  const isTrainingFinished = now > endDateObj;

  return {
    batchName,
    opensDateStr,
    deadlineDateStr,
    startsDateStr,
    endDateStr,
    isRegistrationOpen,
    isTrainingInSession,
    isTrainingFinished,
    startsFormatted: `${startsDateStr.split(',')[0]} - ${endDateStr}`
  };
};

export const TrainingProgramView: React.FC<TrainingProgramViewProps> = ({ 
  onApplyCourse, 
  onAddApplication,
  darkMode = true,
  onNavigateToModule,
  applications
}) => {
  const [submittedApp, setSubmittedApp] = useState<ApplicationRecord | null>(null);
  // Active Applications Tracking State
  const [existingApplications, setExistingApplications] = useState<any[]>([]);

  const fetchExistingApplications = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/training/applications`);
      if (res.ok) {
        const data = await res.json();
        setExistingApplications(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Error fetching training applications:', err);
    }
  };

  useEffect(() => {
    fetchExistingApplications();
    const interval = setInterval(fetchExistingApplications, 3000);
    return () => clearInterval(interval);
  }, []);

  const completedAppTitles = useMemo(() => {
    return existingApplications
      .filter(a => {
        const st = (a.status || '').toUpperCase();
        return st.includes('GRADUAT') || st.includes('COMPLET') || st === 'COURSE COMPLETED';
      })
      .map(a => (a.course_title || a.assistance_type || '').toLowerCase());
  }, [existingApplications]);

  const activeApp = useMemo(() => {
    return existingApplications.find((a) => {
      const st = (a.status || '').toUpperCase();
      return !st.includes('REJECT') && 
             !st.includes('DISAPPROV') && 
             !st.includes('UNQUALIFIED') && 
             !st.includes('GRADUAT') && 
             !st.includes('COMPLET') && 
             st !== 'COURSE COMPLETED';
    });
  }, [existingApplications]);

  // Helper to dynamically calculate remaining slots for any course based on active DB applications
  const getCourseSlotData = (courseTitle: string) => {
    const TOTAL_SLOTS = 25;
    const cleanTarget = (courseTitle || '').toLowerCase().trim();

    const courseApplicants = existingApplications.filter(a => {
      const appCourse = (a.course_title || a.assistance_type || a.serviceName || a.title || '').toLowerCase().trim();
      if (!appCourse) return false;

      const isMatch = appCourse === cleanTarget || 
                      appCourse.includes(cleanTarget) || 
                      cleanTarget.includes(appCourse);
      if (!isMatch) return false;

      const st = (a.status || '').toUpperCase();
      const isRejected = st.includes('REJECT') || st.includes('DISAPPROV') || st.includes('UNQUALIFIED');
      return !isRejected;
    });

    const enrolledCount = courseApplicants.length;
    const remainingSlots = Math.max(0, TOTAL_SLOTS - enrolledCount);
    const isFull = remainingSlots === 0;

    return {
      totalSlots: TOTAL_SLOTS,
      enrolledCount,
      remainingSlots,
      isFull,
      badgeText: isFull ? 'Full / 0 slots' : `${remainingSlots} slots left`
    };
  };

  // Navigation Tabs State (1: Available Training, 2: Apply for Training, 3: Schedule, 4: History)
  const [activeTab, setActiveTab] = useState<number>(1);

  // Application Step inside Tab 2 (1: Complete Checklist, 2: Applicant Info, 3: Upload Documents, 4: Review & Submit)
  const [applyStep, setApplyStep] = useState<number>(1);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState<string>('Bread and Pastry Making');
  const [isEditingFromStep4, setIsEditingFromStep4] = useState<boolean>(false);

  // Step 2 Form States — Educational Background, Purpose, Experience
  const [highestEdu, setHighestEdu] = useState<string>('');
  const [schoolName, setSchoolName] = useState<string>('');
  const [trainingPurpose, setTrainingPurpose] = useState<string>('');
  const [purposeReason, setPurposeReason] = useState<string>('');
  const [previousTraining, setPreviousTraining] = useState<string>('');

  // Step 3 Document Upload States
  const [docIndigency, setDocIndigency] = useState<{ name: string; url?: string } | null>(null);
  const [docQcId, setDocQcId] = useState<{ name: string; url?: string } | null>(null);
  const [docPhotoId, setDocPhotoId] = useState<{ name: string; url?: string } | null>(null);

  // Step completion criteria
  const isStep1Complete = Boolean(selectedCourseTitle);
  const isStep2Complete = Boolean(highestEdu && trainingPurpose && previousTraining);
  const isStep3Complete = Boolean(docIndigency && docQcId);
  // Sample Letter Modal State
  const [showSampleLetterModal, setShowSampleLetterModal] = useState<boolean>(false);

  // Camera Capture Modal State
  const [activeCameraDocKey, setActiveCameraDocKey] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Submission Success State
  const [submittedRecord, setSubmittedRecord] = useState<ApplicationRecord | null>(null);

  // Tab 3 Schedule Filter & Syllabus Modal State
  const [scheduleSearch, setScheduleSearch] = useState<string>('');
  const [scheduleVenueFilter, setScheduleVenueFilter] = useState<string>('All');
  const [selectedScheduleModal, setSelectedScheduleModal] = useState<any | null>(null);

  // Lock background body scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = Boolean(showSampleLetterModal || activeCameraDocKey || selectedScheduleModal);
    if (isAnyModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showSampleLetterModal, activeCameraDocKey, selectedScheduleModal]);

  const trainingCourses: TrainingCourse[] = [
    {
      id: 'bread-pastry',
      title: 'Bread and Pastry Making',
      slots: '25 slots',
      duration: '18 working days',
      description: 'Learn commercial bread and pastry production, baking techniques, measuring and mixing, pastry decorating, oven management, and food safety standards.',
      batch: '3rd Batch 2026',
      opens: 'July 1, 2026',
      deadline: 'July 15, 2026',
      starts: 'August 1 - 18, 2026',
      icon: Utensils
    },
    {
      id: 'barista',
      title: 'Barista',
      slots: '25 slots',
      duration: '18 working days',
      description: 'Master espresso extraction, milk steaming, latte art, coffee brewing methods, equipment maintenance, and coffee shop customer service.',
      batch: '3rd Batch 2026',
      opens: 'July 1, 2026',
      deadline: 'July 15, 2026',
      starts: 'August 1 - 18, 2026',
      icon: Coffee
    },
    {
      id: 'call-center',
      title: 'Basic Computer Literacy & Call Center Service',
      slots: '25 slots',
      duration: '18 working days',
      description: 'Practical training in computer operations, Microsoft Office tools, typing speed, English communication skills, call handling techniques, and BPO job...',
      batch: '3rd Batch 2026',
      opens: 'July 1, 2026',
      deadline: 'July 15, 2026',
      starts: 'August 1 - 18, 2026',
      icon: Monitor
    },
    {
      id: 'hairdressing',
      title: 'Hairdressing',
      slots: '25 slots',
      duration: '30 working days',
      description: 'Hands-on training in hair cutting, hair styling, hair coloring, blowdrying, hair rebonding/perming, and salon sanitation management.',
      batch: '3rd Batch 2026',
      opens: 'July 1, 2026',
      deadline: 'July 15, 2026',
      starts: 'August 1 - 30, 2026',
      icon: Scissors
    },
    {
      id: 'beauty-care',
      title: 'Beauty Care',
      slots: '25 slots',
      duration: '30 working days',
      description: 'Learn manicure, pedicure, nail art application, basic facial treatments, day/evening makeup, and home-service/salon business management.',
      batch: '3rd Batch 2026',
      opens: 'July 1, 2026',
      deadline: 'July 15, 2026',
      starts: 'August 1 - 30, 2026',
      icon: Sparkles
    },
    {
      id: 'dressmaking',
      title: 'Dressmaking / Sewing Craft',
      slots: '25 slots',
      duration: '30 working days',
      description: 'Learn body measurement, pattern drafting, fabric cutting, high-speed sewing machine operation, garment assembly, and sewing craft creation.',
      batch: '3rd Batch 2026',
      opens: 'July 1, 2026',
      deadline: 'July 15, 2026',
      starts: 'August 1 - 30, 2026',
      icon: Shirt
    },
    {
      id: 'housekeeping',
      title: 'Basic Housekeeping',
      slots: '25 slots',
      duration: '30 working days',
      description: 'Professional training in room cleaning, bed making, linen and laundry management, cleaning chemicals and sanitization, and hospitality guest...',
      batch: '3rd Batch 2026',
      opens: 'July 1, 2026',
      deadline: 'July 15, 2026',
      starts: 'August 1 - 30, 2026',
      icon: Home
    },
    {
      id: 'healthcare',
      title: 'Health Care Provider',
      slots: '25 slots',
      duration: '30 working days',
      description: 'Foundational caregiving skills, patient vital signs measurement, elderly care, personal hygiene assistance, patient mobility, first aid, and emergency care...',
      batch: '3rd Batch 2026',
      opens: 'July 1, 2026',
      deadline: 'July 15, 2026',
      starts: 'August 1 - 30, 2026',
      icon: Heart
    },
    {
      id: 'welding',
      title: 'Basic Welding',
      slots: '25 slots',
      duration: '30 working days',
      description: 'Fundamental Shielded Metal Arc Welding (SMAW), welding safety standards, metal cutting, joint preparation, welding positions, and metal fabrication.',
      batch: '3rd Batch 2026',
      opens: 'July 1, 2026',
      deadline: 'July 15, 2026',
      starts: 'August 1 - 30, 2026',
      icon: Flame
    },
    {
      id: 'catering',
      title: 'Food, Beverage & Catering Services',
      slots: '25 slots',
      duration: '30 working days',
      description: 'Comprehensive training in food dining service, table setting, banquet catering operations, food safety standards, bar service, and catering event...',
      batch: '3rd Batch 2026',
      opens: 'July 1, 2026',
      deadline: 'July 15, 2026',
      starts: 'August 1 - 30, 2026',
      icon: Utensils
    }
  ];

  const handleStartApply = (courseTitle: string) => {
    const slotData = getCourseSlotData(courseTitle);
    if (slotData.isFull) {
      alert(`Puno na po ang lahat ng ${slotData.totalSlots} slots para sa ${courseTitle} sa batch na ito.`);
      return;
    }
    setSelectedCourseTitle(courseTitle);
    setActiveTab(2);
    setApplyStep(2);
  };

  // Camera Functions
  const openCameraModal = async (docKey: string) => {
    setActiveCameraDocKey(docKey);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera unavailable, simulating capture mode", err);
    }
  };

  const closeCameraModal = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    setCameraStream(null);
    setActiveCameraDocKey(null);
  };

  const handleCapturePhoto = () => {
    const fakePhotoUrl = `https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?w=500&auto=format&fit=crop&q=80`;
    const photoDoc = { name: `camera_capture_${Date.now()}.jpg`, url: fakePhotoUrl };

    if (activeCameraDocKey === 'indigency') setDocIndigency(photoDoc);
    if (activeCameraDocKey === 'qcid') setDocQcId(photoDoc);
    if (activeCameraDocKey === 'photoId') setDocPhotoId(photoDoc);

    closeCameraModal();
  };

  const handleFinalSubmit = async () => {
    const refNo = `TRN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const appData = {
      referenceNo: refNo,
      courseTitle: selectedCourseTitle || 'Bread and Pastry Making',
      batchName: '3rd Batch 2026',
      applicantName: 'JEFFERSON FERNANDO LEE',
      firstName: 'JEFFERSON',
      middleName: 'FERNANDO',
      lastName: 'LEE',
      suffix: '',
      nationality: 'FILIPINO',
      dob: '27/09/2004',
      age: '22',
      gender: 'Male',
      civilStatus: 'Single',
      houseNo: '176',
      streetName: '23',
      barangay: 'Bagong Silangan',
      phoneNumber: '09155582122',
      emailAddress: 'jeffersonlee1234@gmail.com',
      highestEdu: highestEdu || 'College Level',
      schoolName: schoolName || 'Batasan Hills National High School',
      trainingPurpose: trainingPurpose || 'Employment / Job Application',
      purposeReason: purposeReason || 'Skills enhancement and employment opportunity',
      previousTraining: previousTraining || 'Yes - TESDA Accredited Course',
      docRequestLetter: docIndigency?.url || docIndigency?.name || 'https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?w=500&auto=format&fit=crop&q=80',
      docQcId: docQcId?.url || docQcId?.name || 'https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?w=500&auto=format&fit=crop&q=80',
      docIndigency: docPhotoId?.url || docPhotoId?.name || 'https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?w=500&auto=format&fit=crop&q=80',
      status: 'Pending Document Validation'
    };

    try {
      await fetch(`${API_BASE_URL}/api/training/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData)
      });
    } catch (e) {
      console.warn("API post warning:", e);
    }

    const newRecord: ApplicationRecord = {
      referenceNo: refNo,
      applicantName: 'JEFFERSON FERNANDO LEE',
      serviceName: selectedCourseTitle || 'Bread and Pastry Making',
      category: 'training',
      assistanceType: 'Skills Training Program',
      status: 'Pending Document Validation',
      dateSubmitted: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      amountOrType: 'Free Vocational Training & Orientation',
      assignedSocialWorker: 'Vocational Training Officer, SSDD',
      details: {
        courseTitle: selectedCourseTitle,
        highestEdu,
        trainingPurpose
      }
    };

    if (onAddApplication) {
      onAddApplication(newRecord);
    }

    setSubmittedApp(newRecord);
    setApplyStep(1);
    setIsEditingFromStep4(false);
  };

  const labelClass = `text-[10px] font-extrabold uppercase tracking-wider block mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`;
  const readOnlyBoxClass = `w-full px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center justify-between ${
    darkMode 
      ? 'bg-slate-900/80 border-slate-800 text-slate-200' 
      : 'bg-slate-100 border-slate-300 text-slate-800'
  }`;

  if (submittedApp) {
    return (
      <div className="max-w-md mx-auto my-12 animate-in fade-in zoom-in-95 duration-300 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className={`p-6 sm:p-8 rounded-3xl border text-center space-y-6 shadow-2xl ${
          darkMode ? 'bg-[#0b1426] border-slate-800/90 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          {/* Top Info Icon */}
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Info className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-extrabold tracking-tight text-white">
              Application Successfully Submitted
            </h3>
            <p className={`text-xs max-w-sm mx-auto leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Your application for {submittedApp.serviceName || 'Skills Training Program'} has been successfully submitted and is currently pending review. Please wait for a Social Worker's assessment.
            </p>
          </div>

          {/* Details Container with Ref No & Date Filed */}
          <div className={`p-4 rounded-2xl border text-left space-y-3 font-mono text-xs ${
            darkMode ? 'bg-[#060c18] border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
              <span className={`text-[11px] font-sans font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Application Reference No.:
              </span>
              <span className="font-bold text-blue-400 text-xs sm:text-sm">{submittedApp.referenceNo}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 pt-2.5 border-t border-slate-800/60">
              <span className={`text-[11px] font-sans font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Date Filed:
              </span>
              <span className={`font-bold text-xs ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {submittedApp.dateSubmitted || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                if (onNavigateToModule) {
                  onNavigateToModule('history');
                } else {
                  setSubmittedApp(null);
                  setActiveTab(1);
                }
              }}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs tracking-wider uppercase rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>VIEW IN APPLICATION HISTORY</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSubmittedApp(null);
                setActiveTab(1);
              }}
              className="w-full py-2.5 bg-transparent hover:bg-slate-800/40 text-slate-400 hover:text-white font-semibold text-xs rounded-xl transition-all"
            >
              Back to Training Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* TAB 1: AVAILABLE TRAINING PROGRAMS GRID                                    */}
      {/* ========================================================================= */}
      {activeTab === 1 && (
        <div className="space-y-6">
          {/* Active Application Notice Banner */}
          {activeApp && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-3 shadow-lg">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-extrabold text-amber-300 block">Existing Active Training Application ({activeApp.reference_no})</span>
                <span>You currently have an active application for <strong>{activeApp.course_title || activeApp.assistance_type || 'Skills Training'}</strong> with status <strong className="text-amber-300">{activeApp.status}</strong>. Only 1 active training program application is allowed per resident at a time.</span>
              </div>
            </div>
          )}

          {/* Sub-header Title Row */}
          <div className="flex justify-between items-center">
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Choose a training program suited to your interest and schedule before applying.
            </p>

            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
              darkMode 
                ? 'text-blue-300 bg-blue-950/80 border-blue-800' 
                : 'text-blue-700 bg-blue-50 border-blue-200'
            }`}>
              10 Open Programs
            </span>
          </div>

          {/* Training Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {trainingCourses.map((course) => {
              const Icon = course.icon;
              return (
                <div
                  key={course.id}
                  className={`rounded-2xl border p-5 transition-all flex flex-col justify-between space-y-4 group ${
                    darkMode 
                      ? 'bg-[#0e1930] border-slate-800/80 hover:border-blue-500/40' 
                      : 'bg-white border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <div>
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                          darkMode ? 'bg-blue-600/10 border-blue-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className={`text-base font-extrabold transition-colors ${
                            darkMode ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-600'
                          }`}>
                            {course.title}
                          </h4>
                          <span className={`text-[11px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {course.duration}
                          </span>
                        </div>
                      </div>

                      {(() => {
                        const slotData = getCourseSlotData(course.title);
                        return (
                          <span className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full shrink-0 transition-all ${
                            slotData.isFull
                              ? (darkMode ? 'text-rose-400 bg-rose-950/60 border-rose-700/50' : 'text-rose-700 bg-rose-50 border-rose-200')
                              : slotData.remainingSlots <= 5
                              ? (darkMode ? 'text-amber-400 bg-amber-950/60 border-amber-700/50' : 'text-amber-700 bg-amber-50 border-amber-200')
                              : (darkMode ? 'text-emerald-400 bg-emerald-950/60 border-emerald-700/50' : 'text-emerald-700 bg-emerald-50 border-emerald-200')
                          }`}>
                            {slotData.badgeText}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Description */}
                    <p className={`text-xs leading-relaxed line-clamp-3 mb-4 ${
                      darkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {course.description}
                    </p>

                    {/* Metadata List */}
                    {(() => {
                      const batchInfo = getBatchTimelineInfo(course.duration);
                      const courseTitleLower = course.title.toLowerCase();
                      const isCompletedCourse = completedAppTitles.some(t => t.includes(courseTitleLower) || courseTitleLower.includes(t));
                      const activeCourseTitle = (activeApp?.course_title || activeApp?.assistance_type || '').toLowerCase();
                      const isAppliedCourse = activeApp && (activeCourseTitle.includes(courseTitleLower) || courseTitleLower.includes(activeCourseTitle));
                      const isEnrolled = isAppliedCourse && (activeApp?.status || '').toUpperCase().includes('QUALIFIED');
                      const slotData = getCourseSlotData(course.title);

                      return (
                        <>
                          <div className={`space-y-2 text-xs p-3 rounded-xl border ${
                            darkMode ? 'bg-slate-900/60 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}>
                            <div className="flex items-center gap-2.5">
                              <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                              <span className={`font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>Training Batch:</span>
                              <span className="font-bold text-white">{batchInfo.batchName}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span className={`font-semibold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>Application Opens:</span>
                              <span>{batchInfo.opensDateStr}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                              <span className={`font-semibold ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>Application Deadline:</span>
                              <span>{batchInfo.deadlineDateStr}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                              <span className={`font-semibold ${darkMode ? 'text-rose-400' : 'text-rose-700'}`}>Training Starts:</span>
                              <span>{batchInfo.startsFormatted}</span>
                            </div>
                          </div>

                          {/* Action Buttons Row */}
                          <div className="pt-3 flex gap-3">
                            <button
                              type="button"
                              onClick={() => setSelectedScheduleModal({
                                course: course.title,
                                category: 'Livelihood & Skills Training',
                                batch: batchInfo.batchName,
                                venue: course.venue || 'Quezon City Skills Development Center',
                                address: course.address || 'Kamuning Road, Diliman, Quezon City',
                                schedule: course.schedule || 'Monday to Friday (8:00 AM - 12:00 PM)',
                                duration: course.duration,
                                startsDateStr: batchInfo.startsDateStr,
                                endDateStr: batchInfo.endDateStr,
                                syllabus: course.syllabus || [
                                  'Orientation, Hygiene & Safety Standards',
                                  'Basic Principles & Practical Hands-on Operations',
                                  'Equipment Handling & Tools Management',
                                  'Assessment & Practical Certification Exam'
                                ]
                              })}
                              className={`flex-1 py-2.5 text-xs font-bold rounded-xl border transition-colors flex items-center justify-center gap-1.5 ${
                                darkMode 
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                              }`}
                            >
                              <Calendar className="w-3.5 h-3.5 text-blue-400" />
                              <span>{isEnrolled ? 'View Class Schedule' : 'View Orientation'}</span>
                            </button>

                            {isCompletedCourse ? (
                              <button
                                type="button"
                                disabled
                                className="flex-1 py-2.5 bg-emerald-950/50 border border-emerald-600/50 text-emerald-300 text-xs font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Course Completed (Graduated)</span>
                              </button>
                            ) : isAppliedCourse ? (
                              <button
                                type="button"
                                disabled
                                className="flex-1 py-2.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-xs font-extrabold rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Applied ({activeApp.status})</span>
                              </button>
                            ) : activeApp ? (
                              <button
                                type="button"
                                disabled
                                className="flex-1 py-2.5 bg-slate-900/80 border border-slate-800 text-slate-500 text-xs font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Active Application Exists</span>
                              </button>
                            ) : slotData.isFull ? (
                              <button
                                type="button"
                                disabled
                                className="flex-1 py-2.5 bg-rose-950/60 border border-rose-700/50 text-rose-300 text-xs font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5"
                              >
                                <Lock className="w-3.5 h-3.5 text-rose-400" />
                                <span>Batch Full (0 Slots Left)</span>
                              </button>
                            ) : !batchInfo.isRegistrationOpen ? (
                              <button
                                type="button"
                                disabled
                                className="flex-1 py-2.5 bg-slate-900/80 border border-slate-800 text-amber-400/90 text-[11px] font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5"
                              >
                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                <span>Waiting for Registration (Opens: {batchInfo.opensDateStr})</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStartApply(course.title)}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <span>Apply Now</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: APPLY FOR TRAINING (4-STEP APPLICATION WORKFLOW)                    */}
      {/* ========================================================================= */}
      {activeTab === 2 && (
        <div className={`max-w-4xl mx-auto rounded-3xl border overflow-hidden ${
          darkMode ? 'bg-[#0d162a] border-slate-800' : 'bg-white border-slate-200 shadow-xl'
        }`}>
          {activeApp ? (
            <div className="p-10 text-center space-y-4 max-w-xl mx-auto my-8">
              <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-white">Active Application Already Exists</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                You have an active training application for <strong className="text-blue-400">{activeApp.course_title || activeApp.assistance_type}</strong> (Ref: <span className="font-mono text-blue-400 font-bold">{activeApp.reference_no}</span>) with current status <strong className="text-amber-400">{activeApp.status}</strong>.
              </p>
              <p className="text-xs text-slate-400">
                Quezon City SSDD regulations permit one (1) active training application per resident at a time. Please wait for document validation and orientation schedule updates.
              </p>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => setActiveTab(1)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Return to Available Programs
                </button>
              </div>
            </div>
          ) : (
            <div>
          {/* Header Title Bar */}
          <div className="p-6 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800">
            <div>
              <h2 className={`text-xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Apply for Training Program
              </h2>
              <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Complete applicant details and requirements for skills training.
              </p>
            </div>

            <div className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              darkMode ? 'bg-blue-950/60 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span>Course: <strong>{selectedCourseTitle}</strong></span>
            </div>
          </div>

          {/* 4-Step Stepper Progress Header */}
          <div className={`p-6 border-b ${darkMode ? 'bg-[#0c162b] border-slate-800' : 'bg-slate-100/70 border-slate-200'}`}>
            {/* Step circles & progress line */}
            <div className="max-w-3xl mx-auto mb-6 relative">
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-700 -z-0">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${((applyStep - 1) / 3) * 100}%` }}
                />
              </div>

              <div className="flex justify-between items-center relative z-10">
                {[1, 2, 3, 4].map((stepNum) => {
                  const isActive = applyStep === stepNum;
                  const isPassed = applyStep > stepNum;
                  return (
                    <button
                      key={stepNum}
                      type="button"
                      onClick={() => {
                        if (stepNum === 1) {
                          setApplyStep(1);
                        } else if (stepNum === 2 && isStep1Complete) {
                          setApplyStep(2);
                        } else if (stepNum === 3 && isStep1Complete && isStep2Complete) {
                          setApplyStep(3);
                        } else if (stepNum === 4 && isStep1Complete && isStep2Complete && isStep3Complete) {
                          setApplyStep(4);
                        }
                      }}
                      className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : isPassed
                          ? 'bg-blue-900 text-blue-300 border border-blue-500/60'
                          : darkMode ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-200 text-slate-600 border border-slate-300'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4 text-blue-400" /> : stepNum}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stepper Tabs Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center max-w-4xl mx-auto">
              {[
                { num: 1, label: 'COMPLETE CHECKLIST' },
                { num: 2, label: 'APPLICATION FORM' },
                { num: 3, label: 'UPLOAD DOCUMENTS' },
                { num: 4, label: 'REVIEW & SUBMIT' },
              ].map((step) => {
                const isActive = applyStep === step.num;
                return (
                  <button
                    key={step.num}
                    type="button"
                    onClick={() => {
                      if (step.num === 1) {
                        setApplyStep(1);
                      } else if (step.num === 2 && isStep1Complete) {
                        setApplyStep(2);
                      } else if (step.num === 3 && isStep1Complete && isStep2Complete) {
                        setApplyStep(3);
                      } else if (step.num === 4 && isStep1Complete && isStep2Complete && isStep3Complete) {
                        setApplyStep(4);
                      }
                    }}
                    className={`py-3 px-2 rounded-xl text-[11px] font-extrabold tracking-wider transition-all border cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-400'
                        : darkMode
                        ? 'bg-[#101b33] text-slate-400 border-slate-800 hover:text-slate-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {step.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6 sm:p-7 space-y-6">
            {/* ----------------------------------------------------------------------- */}
            {/* APPLY STEP 1: COMPLETE CHECKLIST / COURSE SELECTION                     */}
            {/* ----------------------------------------------------------------------- */}
            {applyStep === 1 && (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    <BookOpen className="w-5 h-5 text-blue-400" />
                    <h3 className="text-sm font-black tracking-wider uppercase text-white">
                      STEP 1 — SELECTED COURSE & PRE-REQUISITE CHECKLIST
                    </h3>
                  </div>

                  <div className={`p-5 rounded-2xl border space-y-3 ${
                    darkMode ? 'bg-[#091124] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Selected Training Course</span>
                        <h4 className="text-base font-extrabold text-white">{selectedCourseTitle}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab(1)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 transition-all cursor-pointer"
                      >
                        Change Course
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-800/80">
                      <div>
                        <span className="text-slate-400 font-bold">Training Duration:</span>
                        <span className="text-white ml-2">18 - 30 working days</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold">Batch:</span>
                        <span className="text-white ml-2">3rd Batch 2026</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold">Application Period:</span>
                        <span className="text-white ml-2">July 1 - July 15, 2026</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold">Target Starts:</span>
                        <span className="text-white ml-2">August 1, 2026</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-extrabold uppercase text-slate-300">QUALIFICATION & ENTRY REQUIREMENTS</h4>
                    <div className="space-y-2 text-xs">
                      {[
                        'Quezon City Resident (with QC ID or Barangay Certificate of Residency)',
                        'At least 18 years old and physically fit to undergo skills training',
                        'Willing to complete the required training duration and assessment',
                        'Must submit formal Request Letter / Letter of Intent addressed to SSDD'
                      ].map((req, idx) => (
                        <div key={idx} className={`p-3 rounded-xl border flex items-center gap-3 ${
                          darkMode ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="font-semibold">{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end items-center pt-6 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditingFromStep4) {
                        setIsEditingFromStep4(false);
                        setApplyStep(4);
                      } else {
                        setApplyStep(2);
                      }
                    }}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------------------- */}
            {/* APPLY STEP 2: APPLICANT INFO & BACKGROUND FORM                          */}
            {/* ----------------------------------------------------------------------- */}
            {applyStep === 2 && (
              <div className="space-y-6 pt-2">
                {/* SECTION 1: APPLICANT INFORMATION (DISABLED / READ-ONLY) */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-400" />
                      <h3 className={`text-xs font-black tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        APPLICANT INFORMATION
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className={`text-[11px] font-extrabold block mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        First name *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800/90 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        JEFFERSON
                      </div>
                    </div>

                    <div>
                      <label className={`text-[11px] font-extrabold block mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Middle name
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800/90 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        FERNANDO
                      </div>
                    </div>

                    <div>
                      <label className={`text-[11px] font-extrabold block mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Last name *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800/90 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        LEE
                      </div>
                    </div>

                    <div>
                      <label className={`text-[11px] font-extrabold block mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Suffix (Jr., Sr., III, etc.)
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800/90 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-500'
                      }`}>
                        Suffix (Jr., Sr., III, etc.)
                      </div>
                    </div>

                    <div>
                      <label className={`text-[11px] font-extrabold block mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Nationality *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800/90 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        FILIPINO
                      </div>
                    </div>

                    <div>
                      <label className={`text-[11px] font-extrabold block mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Date of birth *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800/90 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        27/09/2004
                      </div>
                    </div>

                    <div>
                      <label className={`text-[11px] font-extrabold block mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Age *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800/90 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        22
                      </div>
                    </div>

                    <div>
                      <label className={`text-[11px] font-extrabold block mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Gender *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800/90 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        Male
                      </div>
                    </div>

                    <div>
                      <label className={`text-[11px] font-extrabold block mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Civil status *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800/90 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        Single
                      </div>
                    </div>

                    <div>
                      <label className={`text-[11px] font-extrabold block mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        House/Building number *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800/90 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        176
                      </div>
                    </div>

                    <div>
                      <label className={`text-[11px] font-extrabold block mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Street name *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800/90 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        23
                      </div>
                    </div>

                    <div>
                      <label className={`text-[11px] font-extrabold block mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Barangay *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800/90 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        Bagong Silangan
                      </div>
                    </div>

                    <div>
                      <label className={`text-[11px] font-extrabold block mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Phone number *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800/90 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        09155582122
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: EDUCATIONAL BACKGROUND */}
                <div className="pt-4 border-t border-slate-800/80 space-y-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-400" />
                    <h3 className={`text-xs font-black tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      EDUCATIONAL BACKGROUND
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-400 block">HIGHEST EDUCATIONAL ATTAINMENT *</label>
                      <select
                        value={highestEdu}
                        onChange={(e) => setHighestEdu(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:border-blue-500 focus:outline-none ${
                          darkMode ? 'bg-[#131f37] border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="">Select Option</option>
                        <option value="Elementary Level">Elementary Level</option>
                        <option value="Elementary Graduate">Elementary Graduate</option>
                        <option value="High School Level">High School Level</option>
                        <option value="High School Graduate">High School Graduate</option>
                        <option value="Senior High School">Senior High School</option>
                        <option value="College Level">College Level</option>
                        <option value="College Graduate">College Graduate</option>
                        <option value="Vocational / Technical">Vocational / Technical</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-400 block">SCHOOL / INSTITUTION</label>
                      <input
                        type="text"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="e.g. Batasan Hills National High School"
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:border-blue-500 focus:outline-none ${
                          darkMode ? 'bg-[#131f37] border-slate-800 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: TRAINING PURPOSE */}
                <div className="pt-4 border-t border-slate-800/80 space-y-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-400" />
                    <h3 className={`text-xs font-black tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      TRAINING PURPOSE
                    </h3>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-400 block">WHY ARE YOU APPLYING FOR THE TRAINING? *</label>
                      <select
                        value={trainingPurpose}
                        onChange={(e) => setTrainingPurpose(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:border-blue-500 focus:outline-none ${
                          darkMode ? 'bg-[#131f37] border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="">Select Option</option>
                        <option value="Skills Development">Skills Development</option>
                        <option value="Employment / Job Application">Employment / Job Application</option>
                        <option value="Business / Livelihood Setup">Business / Livelihood Setup</option>
                        <option value="Career Shift / Promotion">Career Shift / Promotion</option>
                        <option value="Personal Interest / Hobby">Personal Interest / Hobby</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-400 block">BRIEFLY STATE YOUR REASON FOR APPLYING:</label>
                      <textarea
                        rows={3}
                        value={purposeReason}
                        onChange={(e) => setPurposeReason(e.target.value)}
                        placeholder="Provide brief details about your motivation or livelihood plans..."
                        className={`w-full p-3.5 rounded-xl text-xs font-bold border focus:border-blue-500 focus:outline-none ${
                          darkMode ? 'bg-[#131f37] border-slate-800 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 4: PREVIOUS TRAINING / EXPERIENCE */}
                <div className="pt-4 border-t border-slate-800/80 space-y-4">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-400" />
                    <h3 className={`text-xs font-black tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      PREVIOUS TRAINING / EXPERIENCE
                    </h3>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <label className="text-[11px] font-extrabold text-slate-400 block">HAVE YOU ATTENDED A SIMILAR SKILLS TRAINING BEFORE? *</label>
                    <select
                      value={previousTraining}
                      onChange={(e) => setPreviousTraining(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:border-blue-500 focus:outline-none ${
                        darkMode ? 'bg-[#131f37] border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="">Select Option</option>
                      <option value="No">No</option>
                      <option value="Yes - TESDA Accredited Course">Yes - TESDA Accredited Course</option>
                      <option value="Yes - LGU / Barangay Training">Yes - LGU / Barangay Training</option>
                      <option value="Yes - Private Seminar / Workshop">Yes - Private Seminar / Workshop</option>
                    </select>
                  </div>
                </div>

                {/* Bottom Nav Action Bar */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setApplyStep(1)}
                    className={`px-6 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    disabled={!isStep2Complete}
                    onClick={() => {
                      if (isStep2Complete) {
                        if (isEditingFromStep4) {
                          setIsEditingFromStep4(false);
                          setApplyStep(4);
                        } else {
                          setApplyStep(3);
                        }
                      }
                    }}
                    className={`px-6 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                      isStep2Complete
                        ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-md'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                    }`}
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------------------- */}
            {/* APPLY STEP 3: DOCUMENTARY REQUIREMENTS                                  */}
            {/* ----------------------------------------------------------------------- */}
            {applyStep === 3 && (
              <div className="space-y-6 pt-2">
                {/* Header Title Row */}
                <div className="pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-blue-400" />
                    <h3 className={`text-xs font-black tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      REQUIREMENTS / SUPPORTING DOCUMENTS
                    </h3>
                  </div>
                </div>

                {/* Upload Items List */}
                <div className="space-y-4">
                  {[
                    {
                      key: 'requestLetter',
                      title: 'REQUEST LETTER *',
                      desc: 'Attached formal request letter addressed to SSDD / City Mayor.',
                      doc: docIndigency,
                      setDoc: setDocIndigency,
                    },
                    {
                      key: 'qcIdResidency',
                      title: 'QC ID / PROOF OF QC RESIDENCY *',
                      desc: 'Clear photo of your QCitizen ID, Barangay Certificate of Residency, or Valid ID (front and back).',
                      doc: docQcId,
                      setDoc: setDocQcId,
                    },
                    {
                      key: 'indigencyBarangay',
                      title: 'INDIGENCY OF BARANGAY (OPTIONAL)',
                      desc: 'Barangay Certificate of Indigency (optional supporting document).',
                      doc: docPhotoId,
                      setDoc: setDocPhotoId,
                    },
                  ].map((item) => {
                    const uploaded = item.doc;
                    return (
                      <React.Fragment key={item.key}>
                        {item.key === 'requestLetter' && (
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <button
                              type="button"
                              onClick={() => setShowSampleLetterModal(true)}
                              className="px-3.5 py-1.5 bg-blue-950/80 hover:bg-blue-900 text-blue-400 border border-blue-800 text-[11px] font-bold rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                              title="Click to view Sample Letter of Intent"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>SAMPLE DOCUMENT</span>
                            </button>
                          </div>
                        )}

                        <div
                          className={`p-5 rounded-2xl border space-y-3 transition-all ${
                            uploaded
                              ? darkMode
                                ? 'bg-[#0d1c3a]/70 border-2 border-emerald-500/50 shadow-lg'
                                : 'bg-emerald-50/80 border-2 border-emerald-500/60 shadow-md'
                              : darkMode
                              ? 'bg-[#0b1326] border-slate-800/80'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-black tracking-wide uppercase ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                {item.title}
                              </span>
                              {uploaded && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/20 shrink-0" />
                              )}
                            </div>
                            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              {item.desc}
                            </p>
                            <span className={`text-[11px] block mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                              Allowed file types: JPG, JPEG, PNG, WEBP (or take photo using Camera)
                            </span>
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            <label className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 transition-all">
                              <Upload className="w-3.5 h-3.5" />
                              <span>UPLOAD PHOTO</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    item.setDoc({ name: file.name, url: URL.createObjectURL(file) });
                                  }
                                }}
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => openCameraModal(item.key)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 transition-all"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>TAKE PHOTO (CAMERA)</span>
                            </button>
                          </div>

                          {/* Uploaded Card Thumbnail Preview */}
                          {uploaded && (
                            <div className="pt-2">
                              <div 
                                className={`relative w-36 border rounded-2xl p-2.5 flex flex-col items-center shadow-xl group transition-all ${
                                  darkMode ? 'bg-[#091124] border-slate-700/90' : 'bg-white border-slate-200'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    item.setDoc(null);
                                  }}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-slate-700 hover:bg-red-600 text-white rounded-full flex items-center justify-center border border-slate-600 shadow-md transition-all cursor-pointer z-10"
                                  title="Remove photo"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>

                                <div className={`w-20 h-20 rounded-xl overflow-hidden border shrink-0 ${
                                  darkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-100'
                                }`}>
                                  <img
                                    src={uploaded.url || 'https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?w=500&auto=format&fit=crop&q=80'}
                                    alt={uploaded.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                </div>

                                <span className={`text-[10px] font-bold text-center truncate max-w-full mt-2 block px-1 group-hover:text-blue-400 ${
                                  darkMode ? 'text-slate-200' : 'text-slate-800'
                                }`}>
                                  {uploaded.name}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Bottom Nav Action Bar */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setApplyStep(2)}
                    className={`px-5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    disabled={!isStep3Complete}
                    onClick={() => {
                      if (isStep3Complete) {
                        if (isEditingFromStep4) {
                          setIsEditingFromStep4(false);
                          setApplyStep(4);
                        } else {
                          setApplyStep(4);
                        }
                      }
                    }}
                    className={`px-6 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                      isStep3Complete
                        ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-md'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                    }`}
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------------------- */}
            {/* APPLY STEP 4: REVIEW & SUBMIT APPLICATION                                */}
            {/* ----------------------------------------------------------------------- */}
            {applyStep === 4 && (
              <div className="space-y-6 max-w-4xl mx-auto">

                {/* CARD 1: SELECTED COURSE DETAILS */}
                <div className={`p-6 rounded-2xl border space-y-4 ${
                  darkMode ? 'bg-[#0b1426] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                      <h3 className="text-sm font-extrabold text-white">Selected Course Details</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingFromStep4(true);
                        setApplyStep(1);
                      }}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>EDIT</span>
                    </button>
                  </div>

                  <div>
                    <span className="text-xs font-black tracking-wider text-blue-400 uppercase block mb-3">
                      COURSE & TRAINING INFORMATION
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 block uppercase">COURSE TITLE</span>
                        <span className="text-white font-extrabold text-sm">{selectedCourseTitle}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 block uppercase">TRAINING BATCH</span>
                        <span className="text-white font-extrabold">3rd Batch 2026</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 block uppercase">APPLICATION PERIOD</span>
                        <span className="text-white font-extrabold">July 1, 2026 - July 15, 2026</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 block uppercase">TRAINING SCHEDULE</span>
                        <span className="text-white font-extrabold">August 1 - 18, 2026</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD 2: PERSONAL INFORMATION & APPLICANT DETAILS */}
                <div className={`p-6 rounded-2xl border space-y-6 ${
                  darkMode ? 'bg-[#0b1426] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                      <h3 className="text-sm font-extrabold text-white">Personal Information</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingFromStep4(true);
                        setApplyStep(2);
                      }}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>EDIT</span>
                    </button>
                  </div>

                  {/* Section 1: Personal Information (Pic 1 Style) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">FIRST NAME</span>
                      <span className="text-white font-extrabold text-xs block mt-0.5">JEFFERSON</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">MIDDLE NAME</span>
                      <span className="text-white font-extrabold text-xs block mt-0.5">FERNANDO</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">LAST NAME</span>
                      <span className="text-white font-extrabold text-xs block mt-0.5">LEE</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">SUFFIX</span>
                      <span className="text-white font-extrabold text-xs block mt-0.5">N/A</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">NATIONALITY</span>
                      <span className="text-white font-extrabold text-xs block mt-0.5">FILIPINO</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">DATE OF BIRTH</span>
                      <span className="text-white font-extrabold text-xs block mt-0.5">2004-09-27</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">AGE</span>
                      <span className="text-white font-extrabold text-xs block mt-0.5">22</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">GENDER</span>
                      <span className="text-white font-extrabold text-xs block mt-0.5">Male</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">CIVIL STATUS</span>
                      <span className="text-white font-extrabold text-xs block mt-0.5">Single</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">HOUSE / BUILDING NUMBER</span>
                      <span className="text-white font-extrabold text-xs block mt-0.5">176</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">STREET NAME</span>
                      <span className="text-white font-extrabold text-xs block mt-0.5">23</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">BARANGAY</span>
                      <span className="text-white font-extrabold text-xs block mt-0.5">Bagong Silangan</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">PHONE NUMBER</span>
                      <span className="text-white font-extrabold text-xs block mt-0.5">0915582122</span>
                    </div>
                  </div>

                  {/* Section 2: Educational Background */}
                  <div className="pt-4 border-t border-slate-800/80 space-y-3">
                    <span className="text-xs font-black tracking-wider text-blue-400 uppercase block">
                      EDUCATIONAL BACKGROUND
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 block uppercase">HIGHEST EDUCATIONAL ATTAINMENT</span>
                        <span className="text-white font-extrabold">{highestEdu || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 block uppercase">SCHOOL / INSTITUTION</span>
                        <span className="text-white font-extrabold">{schoolName || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Training Purpose */}
                  <div className="pt-4 border-t border-slate-800/80 space-y-3">
                    <span className="text-xs font-black tracking-wider text-blue-400 uppercase block">
                      TRAINING PURPOSE
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 block uppercase">WHY ARE YOU APPLYING FOR THE TRAINING?</span>
                        <span className="text-white font-extrabold">{trainingPurpose || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 block uppercase">BRIEFLY STATE YOUR REASON FOR APPLYING</span>
                        <span className="text-white font-extrabold">{purposeReason || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Previous Training / Experience */}
                  <div className="pt-4 border-t border-slate-800/80 space-y-3">
                    <span className="text-xs font-black tracking-wider text-blue-400 uppercase block">
                      PREVIOUS TRAINING / EXPERIENCE
                    </span>
                    <div className="text-xs">
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase">HAVE YOU ATTENDED A SIMILAR SKILLS TRAINING BEFORE?</span>
                      <span className="text-white font-extrabold">{previousTraining || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* CARD 3: REQUIRED DOCUMENTS */}
                <div className={`p-6 rounded-2xl border space-y-5 ${
                  darkMode ? 'bg-[#0b1426] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                      <h3 className="text-sm font-extrabold text-white">Required documents</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingFromStep4(true);
                        setApplyStep(3);
                      }}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>EDIT</span>
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    {[
                      { title: 'REQUEST LETTER *', doc: docIndigency },
                      { title: 'QC ID / PROOF OF QC RESIDENCY *', doc: docQcId },
                      { title: 'INDIGENCY OF BARANGAY (OPTIONAL)', doc: docPhotoId }
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-200 block">{item.title}</span>
                        {item.doc ? (
                          <div className="pt-1">
                            <div className="relative w-36 border border-slate-700/80 rounded-2xl p-2.5 bg-[#0e1933] flex flex-col items-center shadow-lg">
                              <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shrink-0">
                                <img src={item.doc.url || 'https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?w=500&auto=format&fit=crop&q=80'} alt={item.doc.name} className="w-full h-full object-cover" />
                              </div>
                              <span className="text-[10px] font-bold text-slate-200 mt-2 truncate max-w-full text-center px-1">{item.doc.name}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No photo uploaded</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* BOTTOM ACTION BAR */}
                <div className="flex justify-between items-center pt-6 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setApplyStep(3)}
                    className="px-8 py-2.5 rounded-full border border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    BACK
                  </button>

                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    className="px-10 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-blue-600/30"
                  >
                    SUBMIT
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )}

      {/* ========================================================================= */}
      {/* TAB 3: TRAINING SCHEDULE                                                   */}
      {/* ========================================================================= */}
      {activeTab === 3 && (
        <div className={`rounded-3xl border p-12 text-center space-y-5 ${
          darkMode ? 'bg-[#0e172a] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
            <Calendar className="w-8 h-8 text-blue-400" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className={`text-lg font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              No Approved Training Schedule Yet
            </h3>
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              You currently have no active or confirmed training schedule. Once your application is reviewed and approved by the social worker, your assigned official schedule, venue pass, and timetable will appear here.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setActiveTab(1)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Browse Available Training Courses</span>
            </button>
          </div>
        </div>
      )}





      {/* ========================================================================= */}
      {/* MODAL: SAMPLE LETTER OF INTENT PREVIEW                                    */}
      {/* ========================================================================= */}
      {showSampleLetterModal && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-[#030712]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowSampleLetterModal(false)}
        >
          <div 
            className={`max-w-xl w-full flex flex-col rounded-2xl border p-5 space-y-4 shadow-2xl relative overflow-hidden ${
              darkMode ? 'bg-[#0d1627] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base sm:text-lg font-bold">
                  Sample Request Letter
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Sample Request Letter / Letter of Intent
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowSampleLetterModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Preview Box */}
            <div className="rounded-xl bg-[#070d19] border border-slate-800/80 p-3 flex items-center justify-center overflow-hidden min-h-[160px]">
              <img 
                src="/LETTER OF INTENT - Copy.png" 
                alt="Sample Request Letter" 
                className="max-h-[300px] sm:max-h-[340px] w-auto h-auto object-contain rounded-md shadow-md"
              />
            </div>

            {/* Modal Action Buttons */}
            <div className="flex justify-end items-center pt-2">
              <a
                href="/LETTER OF INTENT - Copy.png"
                download="LETTER_OF_INTENT_SAMPLE.png"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample</span>
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* MODAL: CAMERA CAPTURE SIMULATION                                          */}
      {/* ========================================================================= */}
      {activeCameraDocKey && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className={`relative w-full max-w-md border rounded-3xl p-6 space-y-4 ${
            darkMode ? 'bg-[#0e172a] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Camera Document Capture</h3>
              <button
                type="button"
                onClick={closeCameraModal}
                className={`p-1 rounded-lg ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
              {cameraStream ? (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <Camera className="w-12 h-12 text-blue-500 mx-auto mb-2 animate-pulse" />
                  <span className="text-xs font-bold text-slate-300 block">Live Camera Stream Active</span>
                  <span className="text-[10px] text-slate-500 block mt-1">Position document within camera view</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeCameraModal}
                className={`px-4 py-2 text-xs font-bold rounded-xl border ${
                  darkMode ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-700'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCapturePhoto}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-lg flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Capture & Save</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* MODAL: APPLICATION SUBMITTED SUCCESS                                      */}
      {/* ========================================================================= */}


      {/* MODAL: SYLLABUS & VENUE DETAIL MODAL                                        */}
      {selectedScheduleModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className={`relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
            darkMode ? 'bg-[#0f192e] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Sticky Header with Always-Visible Close Button */}
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-[#0f192e]/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">{selectedScheduleModal.course}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold text-blue-400">{selectedScheduleModal.category} • {selectedScheduleModal.batch}</span>
                    {(() => {
                      const sData = getCourseSlotData(selectedScheduleModal.course);
                      return (
                        <span className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full ${
                          sData.isFull
                            ? 'text-rose-400 bg-rose-950/60 border-rose-700/50'
                            : sData.remainingSlots <= 5
                            ? 'text-amber-400 bg-amber-950/60 border-amber-700/50'
                            : 'text-emerald-400 bg-emerald-950/60 border-emerald-700/50'
                        }`}>
                          {sData.badgeText}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedScheduleModal(null)}
                className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition-all cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Content Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-modal-scroll">
              {/* Venue & Time Overview */}
              <div className={`p-4 rounded-2xl border space-y-2.5 text-xs ${
                darkMode ? 'bg-slate-900/80 border-slate-800/90' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className={`font-bold block ${darkMode ? 'text-white' : 'text-slate-900'}`}>{selectedScheduleModal.venue}</span>
                    <span className="text-slate-400 block text-[11px]">{selectedScheduleModal.address}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                  <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{selectedScheduleModal.schedule} • ({selectedScheduleModal.duration})</span>
                </div>
              </div>

            {/* Active Application Status & Orientation Details (If User Applied) */}
            {activeApp && (activeApp.course_title === selectedScheduleModal.course || activeApp.assistance_type === selectedScheduleModal.course || (activeApp.serviceName || '').toLowerCase().includes(selectedScheduleModal.course.toLowerCase())) && (() => {
              const st = (activeApp.status || '').toUpperCase();
              const isScheduled = st.includes('SCHEDULED') || st.includes('APPOINTED');
              const isEnrolled = st.includes('QUALIFIED') || st.includes('ENROLLED');
              const isUnqualified = st.includes('UNQUALIFIED');
              const isSsddVal = st.includes('SSDD VALIDATED') || st.includes('VALIDATED');

              const rawDate = activeApp.orientation_date || activeApp.orientationDate || activeApp.appointment_date || activeApp.appointmentDate || '';
              const rawTime = activeApp.orientation_time || activeApp.orientationTime || activeApp.appointment_time || activeApp.appointmentTime || '';
              const venueVal = activeApp.orientation_venue || activeApp.orientationVenue || activeApp.appointment_venue || activeApp.appointmentVenue || selectedScheduleModal.venue || 'Quezon City Skills Development Center';

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

              const dateVal = formatDateDisplay(rawDate);
              const timeVal = formatTo12Hour(rawTime);

              return (
                <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/40 space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-900/60 pb-2">
                    <span className="text-xs font-black uppercase text-blue-300 tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-blue-400" />
                      <span>{isEnrolled ? 'YOUR CLASS ENROLLMENT & BATCH SCHEDULE' : 'YOUR ORIENTATION & APPLICATION STATUS'}</span>
                    </span>
                    <span className="font-mono text-xs font-bold text-blue-300 bg-blue-900/60 px-2.5 py-0.5 rounded-lg">
                      REF: {activeApp.reference_no || activeApp.referenceNo}
                    </span>
                  </div>

                  {isEnrolled ? (
                    <div className="space-y-2 text-xs">
                      <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300">
                        <div className="font-extrabold text-sm mb-1 text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>QUALIFIED / ENROLLED</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          Congratulations! You are officially Qualified and Enrolled in {selectedScheduleModal.course}!
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                        <span className="text-[10px] font-extrabold uppercase text-amber-400 block tracking-wider">OFFICIAL CLASS PASS & BATCH SCHEDULE</span>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-200">
                          <div>
                            <span className="text-slate-400 block text-[10px]">TRAINING BATCH:</span>
                            <strong className="text-white">{selectedScheduleModal.batch || '4th Batch 2026'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">TRAINING VENUE:</span>
                            <strong className="text-white">{selectedScheduleModal.venue || 'QC Skills Development Center'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">CLASS START DATE:</span>
                            <strong className="text-emerald-400">{selectedScheduleModal.startsDateStr || 'November 3, 2026'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">EXPECTED GRADUATION:</span>
                            <strong className="text-amber-400">{selectedScheduleModal.endDateStr || 'November 20, 2026'}</strong>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 space-y-1">
                          <span className="text-[10px] font-extrabold uppercase text-blue-400 block">NOTICE OF ADMISSION & CLASS RULES</span>
                          <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5">
                            <li>A minimum of 80% attendance is required for live training modules.</li>
                            <li>Follow proper dress code and safety guidelines of Quezon City Skills Development Center.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : isUnqualified ? (
                    <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs space-y-1">
                      <div className="font-extrabold text-sm flex items-center gap-1.5">
                        <X className="w-4 h-4 text-rose-400" />
                        <span>UNQUALIFIED</span>
                      </div>
                      <p className="text-[11px]">Sorry, you were Unqualified during the Orientation Assessment.</p>
                    </div>
                  ) : isScheduled ? (
                    <div className="space-y-2 text-xs">
                      <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-500/50 text-blue-200 space-y-2">
                        <div className="font-extrabold text-sm text-blue-300 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span>TRAINING SCHEDULED / ORIENTATION APPOINTED</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-200">
                          Training Orientation has been set at <strong className="text-white">{venueVal}</strong>.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-blue-900/60 font-mono text-[11px]">
                          <div>
                            <span className="text-slate-400 text-[10px] block font-sans">DATE:</span>
                            <span className="font-bold text-amber-300">{dateVal}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block font-sans">TIME:</span>
                            <span className="font-bold text-amber-300">{timeVal}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block font-sans">VENUE:</span>
                            <span className="font-bold text-slate-200 truncate block">{venueVal}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 italic block pt-0.5">
                          (Pure Text Info — No Download Button)
                        </span>
                      </div>
                    </div>
                  ) : isSsddVal ? (
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-600/40 text-emerald-300 text-xs space-y-1">
                      <div className="font-extrabold text-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>SSDD VALIDATED</span>
                      </div>
                      <p className="text-[11px]">Your documents and qualification form have been validated. Moved to Stage 2 (Scheduling).</p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-300 text-xs space-y-1">
                      <div className="font-extrabold text-sm flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>PENDING (Pending SSDD Validation)</span>
                      </div>
                      <p className="text-[11px]">Admin is reviewing your Barangay Clearance, Valid ID, and Qualification Form.</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Syllabus Topics */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Course Syllabus & Training Breakdown</h4>
              <div className="space-y-2">
                {selectedScheduleModal.syllabus.map((topic: string, idx: number) => (
                  <div key={idx} className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                    darkMode ? 'bg-slate-900/50 border-slate-800/60' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{topic}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Bottom Actions */}
          <div className="p-4 border-t border-slate-800 flex justify-end items-center gap-3 shrink-0 bg-[#0f192e]/95 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setSelectedScheduleModal(null)}
              className={`px-5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Close
            </button>

            {activeApp ? (
              activeApp.course_title === selectedScheduleModal.course || activeApp.assistance_type === selectedScheduleModal.course ? (
                <button
                  type="button"
                  disabled
                  className="px-5 py-2.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-xs font-extrabold rounded-xl cursor-not-allowed flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Applied ({activeApp.status})</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="px-5 py-2.5 bg-slate-900/80 border border-slate-800 text-slate-500 text-xs font-bold rounded-xl cursor-not-allowed flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Active Application Exists</span>
                </button>
              )
            ) : (() => {
              const modalSlotData = getCourseSlotData(selectedScheduleModal.course);
              if (modalSlotData.isFull) {
                return (
                  <button
                    type="button"
                    disabled
                    className="px-6 py-2.5 bg-rose-950/60 border border-rose-700/50 text-rose-300 text-xs font-bold rounded-xl cursor-not-allowed flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4 text-rose-400" />
                    <span>Batch Full (0 Slots Left)</span>
                  </button>
                );
              }
              return (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCourseTitle(selectedScheduleModal.course);
                    setSelectedScheduleModal(null);
                    setApplyStep(2);
                    setActiveTab(2);
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  <span>Apply for this Training</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              );
            })()}
          </div>
        </div>
      </div>,
      document.body
    )}
    </div>
  );
};
