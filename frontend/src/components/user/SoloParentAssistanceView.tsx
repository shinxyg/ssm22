import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle2, 
  Upload, 
  ChevronRight, 
  ShieldCheck, 
  AlertCircle,
  Users,
  QrCode,
  Download,
  Info,
  X,
  Camera,
  Pencil,
  User,
  Briefcase,
  Building
} from 'lucide-react';
import type { ApplicationRecord } from '../../types';

interface SoloParentAssistanceViewProps {
  onBack: () => void;
  onAddApplication: (app: ApplicationRecord) => void;
  darkMode?: boolean;
  onNavigateToModule?: (tab: string) => void;
  applications?: ApplicationRecord[];
}

// Helper to calculate age from DOB YYYY-MM-DD
const calculateAgeFromDob = (dobString: string): string => {
  if (!dobString) return '';
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return '';
  const today = new Date();
  let calculatedAge = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    calculatedAge--;
  }
  return calculatedAge >= 0 ? String(calculatedAge) : '';
};

export const SoloParentAssistanceView: React.FC<SoloParentAssistanceViewProps> = ({
  onBack,
  onAddApplication,
  darkMode = true,
  onNavigateToModule,
  applications = [],
}) => {
  const { language, t } = useLanguage();
  const isTagalog = language === 'Tagalog';
  // Wizard Stepper State: 1 = COMPLETE CHECKLIST / VERIFICATION, 2 = APPLICATION FORM, 3 = UPLOAD DOCUMENTS, 4 = REVIEW & SUBMIT
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isEditingFromStep4, setIsEditingFromStep4] = useState<boolean>(false);
  const [showReqModal, setShowReqModal] = useState<boolean>(false);

  const handleNextStep = (nextDefaultStep: number) => {
    if (isEditingFromStep4) {
      setCurrentStep(4);
      setIsEditingFromStep4(false);
    } else {
      setCurrentStep(nextDefaultStep);
    }
  };

  const handleEditStepFromReview = (targetStep: number) => {
    setIsEditingFromStep4(true);
    setCurrentStep(targetStep);
  };

  // ----------------------------------------------------
  // STEP 1 STATE: Solo Parent ID Verification & Employment
  // ----------------------------------------------------
  const [soloParentIdNumber, setSoloParentIdNumber] = useState<string>('');
  const [isVerifyingId, setIsVerifyingId] = useState<boolean>(false);
  const [isSoloParentIdVerified, setIsSoloParentIdVerified] = useState<boolean>(false);
  const [soloParentStatus, setSoloParentStatus] = useState<string>('');
  const [employmentStatusStep1, setEmploymentStatusStep1] = useState<string>('');

  const handleVerifySoloParentId = () => {
    const idToVerify = soloParentIdNumber.trim() || 'SP-2026-88492';
    if (!soloParentIdNumber.trim()) {
      setSoloParentIdNumber(idToVerify);
    }
    setIsVerifyingId(true);
    setTimeout(() => {
      setIsVerifyingId(false);
      setIsSoloParentIdVerified(true);
      setSoloParentStatus('Active / Validated Solo Parent Identification Cardholder (SPIC)');
    }, 600);
  };

  const isStep1Valid = isSoloParentIdVerified && employmentStatusStep1 !== '';

  // ----------------------------------------------------
  // STEP 2 STATE: Application Information
  // ----------------------------------------------------
  // Applicant Information (Verified Profile Data - Disabled)
  const [applicantSpicNumber, setApplicantSpicNumber] = useState<string>('SP-2026-88492');
  const [firstName, setFirstName] = useState<string>('JEFFERSON');
  const [middleName, setMiddleName] = useState<string>('FERNANDO');
  const [lastName, setLastName] = useState<string>('LEE');
  const [suffix, setSuffix] = useState<string>('');
  const [nationality, setNationality] = useState<string>('FILIPINO');
  const [dob, setDob] = useState<string>('2004-09-27');
  const [age, setAge] = useState<string>('22');
  const [gender, setGender] = useState<string>('Male');
  const [civilStatus, setCivilStatus] = useState<string>('Single');

  const [houseNo, setHouseNo] = useState<string>('176');
  const [street, setStreet] = useState<string>('23');
  const [barangay, setBarangay] = useState<string>('Bagong Silangan');
  const [phone, setPhone] = useState<string>('09155582122');
  const [emailAddress, setEmailAddress] = useState<string>('jeffersonlee1234@gmail.com');

  // Solo Parent Information
  const [soloParentCategory, setSoloParentCategory] = useState<string>('');
  const [numDependents, setNumDependents] = useState<string>('');
  const [ageYoungestDependent, setAgeYoungestDependent] = useState<string>('');

  // Employment & Income Information
  const [employmentStatus, setEmploymentStatus] = useState<string>('');
  const [occupation, setOccupation] = useState<string>('');
  const [employerOrIncomeSource, setEmployerOrIncomeSource] = useState<string>('');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('');
  const [otherIncomeSource, setOtherIncomeSource] = useState<string>('');

  // Sync Solo Parent ID Number from step 1 to step 2
  useEffect(() => {
    setApplicantSpicNumber(soloParentIdNumber);
  }, [soloParentIdNumber]);

  // Other Government Assistance
  const [receivingGovAssistance, setReceivingGovAssistance] = useState<string>('');
  const [govProgramName, setGovProgramName] = useState<string>('');
  const [govAssistanceAmountFreq, setGovAssistanceAmountFreq] = useState<string>('');

  const [receivingPension, setReceivingPension] = useState<string>('');
  const [pensionType, setPensionType] = useState<string>('');

  // Auto age calculation
  useEffect(() => {
    if (dob) {
      const calc = calculateAgeFromDob(dob);
      if (calc) setAge(calc);
    }
  }, [dob]);

  const isStep2Valid = true;

  // ----------------------------------------------------
  // STEP 3 STATE: Upload Requirements & Camera Handling
  // ----------------------------------------------------
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File }>({});
  const [activeCameraKey, setActiveCameraKey] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const handleFileUpload = (reqKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFiles(prev => ({ ...prev, [reqKey]: file }));
    }
  };

  const handleRemoveFile = (reqKey: string) => {
    setUploadedFiles(prev => {
      const copy = { ...prev };
      delete copy[reqKey];
      return copy;
    });
  };

  const handleOpenCamera = async (key: string) => {
    setActiveCameraKey(key);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error", err);
      setCameraError("Camera access unavailable. Please use UPLOAD PHOTO to select an image.");
    }
  };

  const handleCloseCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setActiveCameraKey(null);
    setCameraError(null);
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current || !activeCameraKey) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `${activeCameraKey}_camera_photo.jpg`, { type: 'image/jpeg' });
          setUploadedFiles(prev => ({ ...prev, [activeCameraKey]: file }));
        }
        handleCloseCamera();
      }, 'image/jpeg', 0.9);
    }
  };

  const isStep3Valid = true;

  // ----------------------------------------------------
  // STEP 4 STATE: Review & Submission Result Modal
  // ----------------------------------------------------
  const [isTermsAccepted, setIsTermsAccepted] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedApp, setSubmittedApp] = useState<ApplicationRecord | null>(null);

  // Lock body scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = Boolean(showReqModal || submittedApp);
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showReqModal, submittedApp]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmitApplication = async () => {
    if (!isTermsAccepted) return;

    setIsSubmitting(true);
    try {
      const refNum = `SP-SUBSIDY-2026-${Math.floor(100000 + Math.random() * 900000)}`;

      // Convert uploaded photos to base64 data URLs
      const docsBase64: Record<string, { name: string; size: number; dataUrl: string }> = {};
      for (const [key, file] of Object.entries(uploadedFiles)) {
        try {
          const dataUrl = await fileToBase64(file);
          docsBase64[key] = {
            name: file.name,
            size: file.size,
            dataUrl
          };
        } catch (e) {
          console.error("Failed to convert photo", e);
        }
      }

      const payload = {
        referenceNo: refNum,
        applicantName: `${firstName} ${middleName} ${lastName} ${suffix}`.trim(),
        firstName,
        middleName,
        lastName,
        suffix,
        nationality,
        dob,
        age,
        gender,
        civilStatus,
        houseNo,
        streetName: street,
        barangay,
        phoneNumber: phone,
        emailAddress,
        soloParentIdNo: applicantSpicNumber || soloParentIdNumber || 'SP-2026-88492',
        soloParentStatus: soloParentStatus || 'Active / Validated SPIC',
        soloParentCategory,
        numDependents,
        ageYoungestDependent,
        employmentStatus,
        occupation,
        employerIncomeSource: employerOrIncomeSource,
        monthlyIncome,
        receivingGovAssistance,
        govProgramName,
        govAssistanceAmountFreq,
        receivingPension,
        pensionType,
        uploadedDocuments: docsBase64,
        status: 'Pending Document Validation',
        details: {
          applicantName: `${firstName} ${middleName} ${lastName} ${suffix}`.trim(),
          spicNumber: applicantSpicNumber || soloParentIdNumber,
          soloParentCategory,
          employmentStatus,
          monthlyIncome: `₱${monthlyIncome}`,
          dependentsCount: numDependents,
          youngestAge: ageYoungestDependent,
          uploadedDocsCount: Object.keys(uploadedFiles).length
        }
      };

      try {
        await fetch('http://localhost:5000/api/solo-parent/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn("Backend API save warning:", err);
      }

      const newApp: ApplicationRecord = {
        referenceNo: refNum,
        serviceName: 'Solo Parent Financial Subsidy Program',
        category: 'soloparent',
        dateSubmitted: `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
        status: 'Pending Document Validation',
        amountOrType: '₱3,000.00 Solo Parent Subsidy',
        assignedSocialWorker: 'Ms. Jocelyn Reyes, RSW (Solo Parent Welfare Division)',
        details: {
          applicantName: `${firstName} ${middleName} ${lastName} ${suffix}`.trim(),
          spicNumber: applicantSpicNumber || soloParentIdNumber,
          soloParentCategory,
          employmentStatus,
          monthlyIncome: `₱${monthlyIncome}`,
          dependentsCount: numDependents,
          youngestAge: ageYoungestDependent,
        }
      };

      onAddApplication(newApp);
      setSubmittedApp(newApp);
      setIsSubmitting(false);
    } catch (err) {
      console.error("Submission failed", err);
      setIsSubmitting(false);
    }
  };

  // Helper title for Step 3 Proof of Indigency / Income requirement label
  const getProofOfIncomeLabel = () => {
    if (employmentStatus === 'Unemployed') {
      return {
        title: 'Proof of Indigency / Non-Employment',
        requirement: 'Affidavit of No Employment / Non-Employment (Photocopy / Scanned PDF)',
        note: 'Required for unemployed Solo Parents seeking financial grant.'
      };
    } else if (employmentStatus === 'Employed') {
      return {
        title: 'Proof of Income (ITR or Payslip)',
        requirement: 'Latest Income Tax Return (ITR) or latest payslip covering one (1) month',
        note: 'Official employer payslip or BIR tax return copy.'
      };
    } else {
      return {
        title: 'Proof of Income / Indigency Certificate',
        requirement: 'Verifiable proof of income or Barangay Certificate of Indigency',
        note: 'Required for informal economy workers or self-employed solo parents.'
      };
    }
  };

  const proofLabel = getProofOfIncomeLabel();

  // Check if there is an active pending (ongoing) Solo Parent Financial Subsidy application
  const activePendingApp = applications?.find(app => {
    const isSubsidy = (app.referenceNo || '').startsWith('SP-SUBSIDY-') || 
      (app.referenceNo || '').startsWith('SP-') || 
      (app.serviceName || '').toLowerCase().includes('subsidy');
    if (!isSubsidy) return false;
    const st = (app.status || '').toUpperCase();
    const isFinished = 
      st.includes('RELEASED') || 
      st.includes('COMPLETED') || 
      st.includes('REJECTED') || 
      st.includes('DISAPPROVED');
    return !isFinished;
  });

  // Check if submittedApp has finished in global applications state
  const submittedAppInList = applications?.find(app => app.referenceNo === submittedApp?.referenceNo);
  const isSubmittedAppFinished = submittedAppInList ? (
    (submittedAppInList.status || '').toUpperCase().includes('RELEASED') ||
    (submittedAppInList.status || '').toUpperCase().includes('COMPLETED') ||
    (submittedAppInList.status || '').toUpperCase().includes('REJECTED') ||
    (submittedAppInList.status || '').toUpperCase().includes('DISAPPROVED')
  ) : false;

  const targetApp = isSubmittedAppFinished ? null : (submittedApp || activePendingApp || null);

  if (targetApp) {
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
              Your application for Solo Parent Financial Subsidy has been successfully submitted and is currently pending review. Please wait for a Social Worker's assessment.
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
              <span className="font-bold text-blue-400 text-xs sm:text-sm">{targetApp.referenceNo}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 pt-2.5 border-t border-slate-800/60">
              <span className={`text-[11px] font-sans font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Date Filed:
              </span>
              <span className={`font-bold text-xs ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {targetApp.dateSubmitted || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Full Width Primary Blue Action Button */}
          <button
            type="button"
            onClick={() => {
              if (onNavigateToModule) {
                onNavigateToModule('disbursements');
              } else {
                onBack();
              }
            }}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs tracking-wider uppercase rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>VIEW IN FINANCIAL AID DISBURSEMENTS</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300 font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Top Header & Navigation matching exact layout in screenshot */}
      <div className="space-y-4">
        <h1 className={`text-xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Solo Parent Financial Subsidy Program
        </h1>

        <div className="flex items-center">
          <button
            type="button"
            onClick={onBack}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all border ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-blue-400 hover:text-white hover:bg-slate-800'
                : 'bg-white border-slate-200 text-blue-600 hover:bg-slate-50'
            }`}
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span>BACK TO SOLO PARENT SERVICES</span>
          </button>
        </div>
      </div>

      {/* SINGLE UNIFIED MAIN CONTAINER CARD FOR ALL CONTENT MATCHING SCREENSHOT */}
      <div className={`rounded-2xl border overflow-hidden ${
        darkMode ? 'bg-[#0b1426] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Banner Header - show on Step 1 */}
        {currentStep === 1 && (
          <div className={`p-6 border-b flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
            darkMode ? 'bg-[#0f1b33] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-base sm:text-lg font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {isTagalog ? 'Pinansyal na Ayuda para sa Solo Parent — Pangunahing Kailangan' : 'Solo Parent Financial Subsidy — Primary Requirements'}
                </h2>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isTagalog ? 'Kumpletuhin ang mga pangunahing katanungan sa ibaba at ihanda ang mga kailangang dokumento upang magpatuloy sa iyong aplikasyon.' : 'Complete the primary qualification questions below and prepare the required documents to proceed with your application.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowReqModal(true)}
              className="px-4 py-2 border border-blue-500/40 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
            >
              <Info className="w-3.5 h-3.5" />
              <span>{isTagalog ? 'Tingnan ang mga Kailangan' : 'View Requirements'}</span>
            </button>
          </div>
        )}

        {/* 4-Step Stepper Progress Header matching screenshot */}
        <div className={`p-6 border-b ${darkMode ? 'bg-[#0c162b] border-slate-800' : 'bg-slate-100/70 border-slate-200'}`}>
          
          {/* Step Numbers Line */}
          <div className="relative flex justify-between items-center max-w-3xl mx-auto mb-6">
            <div className={`absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 z-0 ${
              darkMode ? 'bg-slate-800' : 'bg-slate-200'
            }`} />

            {[1, 2, 3, 4].map((stepNum) => {
              const isPassed = currentStep > stepNum;
              const isCurrent = currentStep === stepNum;
              return (
                <div key={stepNum} className="relative z-10 flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (stepNum < currentStep || isEditingFromStep4) {
                        setCurrentStep(stepNum);
                      }
                    }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-500/20'
                        : isPassed
                        ? 'bg-blue-600 text-white'
                        : darkMode
                        ? 'bg-slate-800 text-slate-500 border border-slate-700'
                        : 'bg-slate-100 text-slate-500 border border-slate-300'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-5 h-5 text-white" /> : stepNum}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pill Buttons directly matching reference screenshot */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-4xl mx-auto">
            {[
              { step: 1, label: isTagalog ? 'KOMPLETONG TSEKLIST' : 'COMPLETE CHECKLIST' },
              { step: 2, label: isTagalog ? 'PORMA NG APLIKASYON' : 'APPLICATION FORM' },
              { step: 3, label: isTagalog ? 'PAG-UPLOAD NG DOKUMENTO' : 'UPLOAD DOCUMENTS' },
              { step: 4, label: isTagalog ? 'PAGSUSURI AT PAG-SUBMIT' : 'REVIEW & SUBMIT' },
            ].map((tab) => {
              const isActive = currentStep === tab.step;
              return (
                <button
                  key={tab.step}
                  type="button"
                  onClick={() => {
                    if (tab.step < currentStep || isEditingFromStep4) {
                      setCurrentStep(tab.step);
                    }
                  }}
                  className={`py-3 px-2 text-[11px] font-extrabold tracking-wider rounded-xl transition-all uppercase text-center border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-500'
                      : darkMode
                      ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Body */}
        <div className="p-6 sm:p-8">

          {/* STEP 1: COMPLETE CHECKLIST */}
          {currentStep === 1 && (
            <div className="space-y-6">
              
              {/* SOLO PARENT SECTOR Banner matching exact screenshot text */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                darkMode ? 'bg-blue-950/60 border-blue-800/80 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}>
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-400 dark:text-blue-300">
                    {isTagalog ? 'SEKTOR NG SOLO PARENT: ANG MGA QUALIFIED NA APLIKANTE AY MAAARING MAKATANGGAP NG PINANSYAL NA AYUDA.' : 'SOLO PARENT SECTOR: QUALIFIED APPLICANTS MAY RECEIVE FINANCIAL SUBSIDY.'}
                  </h3>
                  <p className="text-xs leading-relaxed font-medium">
                    {isTagalog ? 'Para sa mga qualified na Solo Parent na nakakatugon sa mga kinakailangang pamantayan sa kita at programa. Ang pagiging kwalipikado ay nakasalalay sa beripikasyon ng mga dokumento at pagsusuri bago maaprubahan.' : 'For qualified Solo Parents who meet the applicable income and program requirements. Eligibility is subject to document verification and assessment before approval.'}
                  </p>
                </div>
              </div>

              {/* Qualification & Verification Section */}
              <div className="space-y-6 pt-2">
                <h2 className={`text-xs font-extrabold tracking-wider uppercase mb-3 ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                  {isTagalog ? 'BERIPIKASYON NG SOLO PARENT ID AT ESTADO NG TRABAHO' : 'SOLO PARENT ID VERIFICATION & EMPLOYMENT STATUS'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Solo Parent ID Number & Verify Button */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold tracking-wide uppercase text-slate-300 flex items-center gap-1">
                      {isTagalog ? 'NUMERO NG SOLO PARENT ID' : 'SOLO PARENT ID NUMBER'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={soloParentIdNumber}
                        onChange={(e) => {
                          setSoloParentIdNumber(e.target.value);
                          setIsSoloParentIdVerified(false);
                        }}
                        placeholder="SP-2026-88492"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all outline-none ${
                          darkMode 
                            ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500 placeholder-slate-500' 
                            : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500 placeholder-slate-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleVerifySoloParentId}
                        disabled={isVerifyingId}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl border border-blue-400/30 transition-all shrink-0 disabled:opacity-50"
                      >
                        {isVerifyingId ? (isTagalog ? 'TINUTUKOY...' : 'VERIFYING...') : (isTagalog ? 'I-VERIFY ANG SOLO PARENT ID' : 'VERIFY SOLO PARENT ID')}
                      </button>
                    </div>
                  </div>

                  {/* Solo Parent Status (Appears upon verification) */}
                  {isSoloParentIdVerified ? (
                    <div className="space-y-2 animate-fadeIn">
                      <label className="text-xs font-bold tracking-wide uppercase text-slate-300 flex items-center gap-1">
                        {isTagalog ? 'ESTADO NG SOLO PARENT ID' : 'SOLO PARENT STATUS'} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          value={soloParentStatus}
                          className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold cursor-not-allowed ${
                            darkMode 
                              ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300' 
                              : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          }`}
                        />
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute right-3 top-3" />
                      </div>
                      <p className="text-[11px] text-emerald-400 font-medium">
                        {isTagalog ? '✓ Na-verify kumpara sa opisyal na Solo Parent Registry database.' : '✓ Verified against official Solo Parent Registry database.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 opacity-60">
                      <label className="text-xs font-bold tracking-wide uppercase text-slate-400 flex items-center gap-1">
                        {isTagalog ? 'ESTADO NG SOLO PARENT ID' : 'SOLO PARENT STATUS'} <span className="text-rose-500">*</span>
                      </label>
                      <div className="w-full px-4 py-2.5 rounded-xl border border-dashed border-slate-700/80 bg-slate-900/30 text-xs text-slate-500 italic flex items-center justify-between">
                        <span>{isTagalog ? 'Kusa itong mapupunan pagkatapos i-verify ang Solo Parent ID...' : 'Will auto-fill upon Solo Parent ID verification...'}</span>
                      </div>
                    </div>
                  )}

                </div>

                {/* Employment Status Dropdown */}
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-wide uppercase text-slate-300 flex items-center gap-1">
                    {isTagalog ? 'ESTADO NG TRABAHO' : 'EMPLOYMENT STATUS'} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={employmentStatusStep1}
                    onChange={(e) => setEmploymentStatusStep1(e.target.value)}
                    className={`w-full max-w-md px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all outline-none ${
                      darkMode 
                        ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  >
                    <option value="">{isTagalog ? 'Pumili...' : 'Select...'}</option>
                    <option value="Employed">{isTagalog ? 'May Trabaho (Employed)' : 'Employed'}</option>
                    <option value="Unemployed">{isTagalog ? 'Walang Trabaho (Unemployed)' : 'Unemployed'}</option>
                    <option value="Informal Economy Worker">{isTagalog ? 'Nasa Informal Economy (Self-employed)' : 'Informal Economy Worker'}</option>
                  </select>
                </div>

              </div>

              {/* Bottom Next Step Button */}
              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleNextStep(2)}
                  disabled={!isStep1Valid}
                  className={`px-8 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all ${
                    isStep1Valid
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>{isTagalog ? 'KASUNOD' : 'NEXT'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* STEP 2: APPLICATION FORM */}
          {currentStep === 2 && (
            <div className="space-y-8">
              
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  {isTagalog ? 'Iminumungkahing Online Porma ng Aplikasyon sa Financial Subsidy' : 'Suggested Online Financial Subsidy Application Form'}
                </h2>
              </div>

              {/* Applicant Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
                  {isTagalog ? 'Impormasyon ng Aplikante' : 'Applicant Information'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Row 1: Existing Solo Parent ID Number (2 cols) & First name (1 col) */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold uppercase text-slate-400">
                      Existing Solo Parent ID Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={applicantSpicNumber || soloParentIdNumber || 'SP-2026-88492'}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold cursor-not-allowed opacity-75 ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-blue-400' : 'bg-slate-100 border-slate-300 text-blue-800'
                      }`}
                    />
                    <p className="text-[11px] text-slate-500">Verified Citizen Profile (Disabled for editing)</p>
                  </div>

                  {/* First name */}
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-xs font-bold uppercase text-slate-400">First name *</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={firstName || 'JEFFERSON'}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold cursor-not-allowed ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  {/* Middle name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-400">Middle name</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={middleName || 'FERNANDO'}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold cursor-not-allowed ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  {/* Last name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-400">Last name *</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={lastName || 'LEE'}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold cursor-not-allowed ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  {/* Suffix */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-400">Suffix (Jr., Sr., III, etc.)</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      placeholder="Suffix (Jr., Sr., III, etc.)"
                      value={suffix}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold cursor-not-allowed ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 placeholder-slate-600' : 'bg-slate-100 border-slate-300 text-slate-800 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  {/* Nationality */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-400">Nationality *</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={nationality}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold cursor-not-allowed ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
                      }`}
                    />
                  </div>

                  {/* Date of birth */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-400">Date of birth *</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={dob ? '27/09/2004' : '27/09/2004'}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold cursor-not-allowed ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  {/* Age */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-400">Age *</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={age || '22'}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold cursor-not-allowed ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-blue-400' : 'bg-slate-100 border-slate-300 text-blue-700'
                      }`}
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-400">Gender *</label>
                    <select
                      disabled
                      value={gender || 'Male'}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold cursor-not-allowed ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-800'
                      }`}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Civil status */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-400">Civil status *</label>
                    <select
                      disabled
                      value={civilStatus || 'Single'}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold cursor-not-allowed ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-800'
                      }`}
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                      <option value="Solo Parent">Solo Parent</option>
                    </select>
                  </div>

                  {/* House/Building number */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-400">House/Building number *</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={houseNo || '176'}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold cursor-not-allowed ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  {/* Street name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-400">Street name *</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={street || '23'}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold cursor-not-allowed ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  {/* Barangay */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-400">Barangay *</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={barangay || 'Bagong Silangan'}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold cursor-not-allowed ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  {/* Phone number */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-400">Phone number *</label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={phone || '09155582122'}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold cursor-not-allowed ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-400">Email Address *</label>
                    <input
                      type="email"
                      readOnly
                      disabled
                      value={emailAddress}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold cursor-not-allowed ${
                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                </div>
              </div>

              {/* Solo Parent Information */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
                  Solo Parent Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  <div className="space-y-1 md:col-span-3">
                    <label className="text-xs font-bold uppercase text-slate-400">
                      Solo Parent Category / Reason *
                    </label>
                    <select
                      value={soloParentCategory}
                      onChange={(e) => setSoloParentCategory(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="">Select...</option>
                      <option value="Unmarried parent">Unmarried parent</option>
                      <option value="Widow/Widower">Widow/Widower</option>
                      <option value="Abandoned by spouse">Abandoned by spouse</option>
                      <option value="Separated">Separated</option>
                      <option value="Spouse with disability/incapacity">Spouse with disability/incapacity</option>
                      <option value="Other qualified category">Other qualified category</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-400">{isTagalog ? 'Bilang ng mga Umaasa *' : 'Number of Dependents *'}</label>
                    <input
                      type="number"
                      min="1"
                      placeholder={isTagalog ? 'hal. 2' : 'e.g. 2'}
                      value={numDependents}
                      onChange={(e) => setNumDependents(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-400">{isTagalog ? 'Edad ng Pinakabatang Umaasa *' : 'Age of Youngest Dependent *'}</label>
                    <input
                      type="number"
                      min="0"
                      placeholder={isTagalog ? 'hal. 5' : 'e.g. 5'}
                      value={ageYoungestDependent}
                      onChange={(e) => setAgeYoungestDependent(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>

                </div>
              </div>

              {/* Employment & Income Information */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
                  {isTagalog ? 'Impormasyon sa Trabaho at Kita' : 'Employment & Income Information'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-400">{isTagalog ? 'Estado ng Trabaho *' : 'Employment Status *'}</label>
                    <select
                      value={employmentStatus}
                      onChange={(e) => setEmploymentStatus(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="">{isTagalog ? 'Pumili ng Estado ng Trabaho' : 'Select Employment Status'}</option>
                      <option value="Employed">{isTagalog ? 'May Trabaho (Employed)' : 'Employed'}</option>
                      <option value="Self-employed/informal worker">{isTagalog ? 'Nasa Informal Economy (Self-employed)' : 'Self-employed/informal worker'}</option>
                      <option value="Unemployed">{isTagalog ? 'Walang Trabaho (Unemployed)' : 'Unemployed'}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-400">{isTagalog ? 'Trabaho / Propesyon' : 'Occupation'}</label>
                    <input
                      type="text"
                      placeholder={isTagalog ? 'hal. Guro, Call Center Agent, Tindero/a' : 'e.g. Teacher, Call Center Agent, Vendor'}
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-400">{isTagalog ? 'Pinapasukan / Pinagmumulan ng Kita' : 'Employer / Source of Income'}</label>
                    <input
                      type="text"
                      placeholder={isTagalog ? 'hal. ABC Company / Sari-sari Store' : 'e.g. ABC Company / Sari-sari Store'}
                      value={employerOrIncomeSource}
                      onChange={(e) => setEmployerOrIncomeSource(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-400">{isTagalog ? 'Buwanang Kita (PHP)' : 'Monthly Income (PHP)'}</label>
                    <input
                      type="number"
                      placeholder={isTagalog ? 'hal. 15000' : 'e.g. 15000'}
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>

                </div>
              </div>

              {/* Other Government Assistance */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
                  Other Government Assistance
                </h3>

                <div className="space-y-4">
                  {/* Question 1: Currently receiving government assistance */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400 block">
                      Currently receiving government assistance? *
                    </label>
                    <select
                      value={receivingGovAssistance}
                      onChange={(e) => {
                        const val = e.target.value;
                        setReceivingGovAssistance(val);
                        if (val !== 'Yes') {
                          setGovProgramName('');
                          setGovAssistanceAmountFreq('');
                        }
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>

                    {receivingGovAssistance === 'Yes' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-slate-400 block">Program Name</label>
                          <input
                            type="text"
                            placeholder="e.g. 4Ps, TUPAD, DSWD AICS"
                            value={govProgramName}
                            onChange={(e) => setGovProgramName(e.target.value)}
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
                              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-slate-400 block">Amount / Frequency</label>
                          <input
                            type="text"
                            placeholder="e.g. ₱1,500 / monthly"
                            value={govAssistanceAmountFreq}
                            onChange={(e) => setGovAssistanceAmountFreq(e.target.value)}
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
                              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Question 2: Receiving pension */}
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-bold uppercase text-slate-400 block">
                      Receiving pension? *
                    </label>
                    <select
                      value={receivingPension}
                      onChange={(e) => {
                        const val = e.target.value;
                        setReceivingPension(val);
                        if (val !== 'Yes') {
                          setPensionType('');
                        }
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>

                    {receivingPension === 'Yes' && (
                      <div className="space-y-1 pt-1">
                        <label className="text-xs font-bold uppercase text-slate-400 block">Type of Pension</label>
                        <input
                          type="text"
                          placeholder="e.g. SSS Survivor Pension, GSIS, Private Pension"
                          value={pensionType}
                          onChange={(e) => setPensionType(e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
                            darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stepper Controls */}
              <div className="flex justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2.5 rounded-xl border border-slate-700 text-xs font-bold uppercase text-slate-300 hover:bg-slate-800"
                >
                  BACK
                </button>
                <button
                  type="button"
                  onClick={() => handleNextStep(3)}
                  disabled={!isStep2Valid}
                  className={`px-8 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all ${
                    isStep2Valid
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>NEXT</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* STEP 3: UPLOAD DOCUMENTS (Matching Pic 2 layout) */}
          {currentStep === 3 && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
              <div className="space-y-1 mb-6">
                <h3 className={`text-base sm:text-lg font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {isTagalog ? 'Pag-upload ng File' : 'File upload'}
                </h3>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isTagalog ? 'Tiyaking i-upload ang angkop na mga dokumento para sa bawat kategorya at beripikahin na ang lahat ng detalye—tulad ng buong pangalan at tirahan—ay tumutugma sa impormasyon sa iyong QC ID.' : 'Make sure to upload the appropriate documents for each category and verify that all details—such as your full name (first, middle, and last name) and address—match the information on your QC ID.'}
                </p>
                <p className={`text-xs leading-relaxed mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isTagalog ? 'Mag-upload ng malinaw at nababasang kopya ng mga kailangang dokumento (JPG, JPEG, PNG, WEBP, o PDF).' : 'Upload clear and legible copies of the required documents (JPG, JPEG, PNG, WEBP, or PDF).'}
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'proof_income', title: isTagalog ? 'ORIGINAL BARANGAY CERTIFICATE OF INDIGENCY *' : 'ORIGINAL BARANGAY CERTIFICATE OF INDIGENCY *' },
                  { key: 'qcid', title: isTagalog ? 'QCITIZEN ID (QC ID) *' : 'QCITIZEN ID *' },
                  { key: 'spic', title: isTagalog ? 'SOLO PARENT ID / CERTIFICATION *' : 'SOLO PARENT ID / CERTIFICATION *' },
                ].map((doc) => {
                  const uploaded = uploadedFiles[doc.key];
                  const previewUrl = uploaded ? URL.createObjectURL(uploaded) : null;
                  return (
                    <div
                      key={doc.key}
                      className={`p-5 rounded-2xl flex flex-col space-y-3 transition-all ${
                        uploaded
                          ? darkMode
                            ? 'bg-[#0d1c3a]/70 border-2 border-emerald-500/50 shadow-lg shadow-emerald-950/20'
                            : 'bg-emerald-50/80 border-2 border-emerald-500/60 shadow-md shadow-emerald-100'
                          : darkMode
                          ? 'bg-[#0e1933]/50 border border-slate-800/80 hover:bg-[#0e1933]/70'
                          : 'bg-slate-50/70 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-extrabold tracking-wide block uppercase ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {doc.title}
                          </span>
                          {uploaded && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/20 shrink-0" />
                          )}
                        </div>
                        <span className={`text-[11px] block mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {isTagalog ? 'Mga pinapahintulutang uri ng file: JPG, JPEG, PNG, WEBP (o kumuha gamit ang Kamera)' : 'Allowed file types: JPG, JPEG, PNG, WEBP (or capture using Camera)'}
                        </span>
                      </div>

                      {/* Always-visible action buttons */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <label className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold cursor-pointer inline-flex items-center gap-2 transition-all shadow-md">
                          <Upload className="w-4 h-4" />
                          <span>{isTagalog ? 'MAG-UPLOAD NG LARAWAN' : 'UPLOAD PHOTO'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(doc.key, e)}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => handleOpenCamera(doc.key)}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold cursor-pointer inline-flex items-center gap-2 transition-all shadow-md"
                        >
                          <Camera className="w-4 h-4" />
                          <span>{isTagalog ? 'KUMUHA NG LARAWAN (KAMERA)' : 'TAKE PHOTO (CAMERA)'}</span>
                        </button>
                      </div>

                      {/* Uploaded Card Thumbnail Preview */}
                      {uploaded && previewUrl && (
                        <div className="pt-2">
                          <div 
                            className={`relative w-36 border rounded-2xl p-2.5 flex flex-col items-center shadow-xl group transition-all ${
                              darkMode ? 'bg-[#091124] border-slate-700/90' : 'bg-white border-slate-200'
                            }`}
                          >
                            {/* Floating X Delete Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(doc.key);
                              }}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-slate-700 hover:bg-red-600 text-white rounded-full flex items-center justify-center border border-slate-600 shadow-md transition-all cursor-pointer z-10"
                              title="Remove photo"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>

                            {/* Square Thumbnail Image */}
                            <div className={`w-20 h-20 rounded-xl overflow-hidden border shrink-0 ${
                              darkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-100'
                            }`}>
                              <img
                                src={previewUrl}
                                alt={uploaded.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>

                            {/* Truncated Filename */}
                            <span className={`text-[10px] font-bold text-center truncate max-w-full mt-2 block px-1 group-hover:text-blue-400 ${
                              darkMode ? 'text-slate-200' : 'text-slate-800'
                            }`}>
                              {uploaded.name}
                            </span>

                            {/* File Size */}
                            <span className={`text-[9px] font-mono block text-center mt-0.5 ${
                              darkMode ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                              {(uploaded.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Stepper Navigation */}
              <div className="flex justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-2.5 rounded-xl border border-slate-700 text-xs font-bold uppercase text-slate-300 hover:bg-slate-800"
                >
                  {isTagalog ? 'BUMALIK' : 'BACK'}
                </button>
                <button
                  type="button"
                  onClick={() => handleNextStep(4)}
                  className="px-8 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-none transition-all"
                >
                  <span>{isTagalog ? 'KASUNOD' : 'NEXT'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* STEP 4: REVIEW & SUBMIT */}
          {currentStep === 4 && (
            <div className="space-y-6">
              
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  {isTagalog ? 'Hakbang 4: Pagsusuri at Pag-submit ng Aplikasyon' : 'Step 4: Review & Submit Application'}
                </h2>
              </div>

              <div className="space-y-4">
                {/* 1. Personal & Application Information Section Card (Step 2) */}
                <div className={`border rounded-2xl overflow-hidden ${darkMode ? 'bg-[#0e1933]/60 border-slate-800' : 'bg-slate-50/80 border-slate-200 shadow-sm'}`}>
                  <div className={`p-4 flex items-center justify-between border-b ${darkMode ? 'bg-[#101c38] border-slate-800/80' : 'bg-slate-100 border-slate-200'}`}>
                    <h4 className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {isTagalog ? 'Personal na Impormasyon at Aplikasyon' : 'Personal & Application Information'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleEditStepFromReview(2)}
                      className="text-xs font-extrabold text-blue-500 hover:text-blue-400 flex items-center gap-1.5 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>{isTagalog ? 'BAGUHIN' : 'EDIT'}</span>
                    </button>
                  </div>
                  <div className="p-5 space-y-6">
                    {/* 1. Applicant Information Grid */}
                    <div>
                      <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-3 pb-1 border-b ${darkMode ? 'text-blue-400 border-slate-800' : 'text-blue-600 border-slate-200'}`}>
                        {isTagalog ? '1. IMPORMASYON NG APLIKANTE' : '1. APPLICANT INFORMATION'}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>EXISTING SOLO PARENT ID NUMBER</span>
                          <span className="font-bold font-mono text-blue-400">{applicantSpicNumber || soloParentIdNumber || 'SP-2026-88492'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>FIRST NAME</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{firstName || 'JEFFERSON'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>MIDDLE NAME</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{middleName || 'FERNANDO'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>LAST NAME</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{lastName || 'LEE'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>SUFFIX</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{suffix || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>NATIONALITY</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{nationality || 'FILIPINO'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>DATE OF BIRTH</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{dob || '2004-09-27'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>AGE</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{age || '22'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>GENDER</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{gender || 'Male'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>CIVIL STATUS</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{civilStatus || 'Single'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>HOUSE / BUILDING NUMBER</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{houseNo || '176'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>STREET NAME</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{street || '23'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>BARANGAY</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{barangay || 'Bagong Silangan'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>PHONE NUMBER</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{phone || '09155582122'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>EMAIL ADDRESS</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{emailAddress || 'jeffersonlee1234@gmail.com'}</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Solo Parent Information */}
                    <div className={`pt-4 border-t ${darkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
                      <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-3 pb-1 border-b ${darkMode ? 'text-blue-400 border-slate-800' : 'text-blue-600 border-slate-200'}`}>
                        {isTagalog ? '2. IMPORMASYON BILANG SOLO PARENT' : '2. SOLO PARENT INFORMATION'}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>SOLO PARENT CATEGORY / REASON</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{soloParentCategory || 'Unmarried parent'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>NUMBER OF DEPENDENTS</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{numDependents || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>AGE OF YOUNGEST DEPENDENT</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{ageYoungestDependent ? `${ageYoungestDependent} yrs` : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Employment & Income Information */}
                    <div className={`pt-4 border-t ${darkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
                      <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-3 pb-1 border-b ${darkMode ? 'text-blue-400 border-slate-800' : 'text-blue-600 border-slate-200'}`}>
                        {isTagalog ? '3. IMPORMASYON SA TRABAHO AT KITA' : '3. EMPLOYMENT & INCOME INFORMATION'}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>EMPLOYMENT STATUS</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{employmentStatus || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>OCCUPATION</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{occupation || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>EMPLOYER / SOURCE OF INCOME</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{employerOrIncomeSource || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>MONTHLY INCOME (PHP)</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{monthlyIncome ? `₱${monthlyIncome}` : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* 4. Other Government Assistance */}
                    <div className={`pt-4 border-t ${darkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
                      <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-3 pb-1 border-b ${darkMode ? 'text-blue-400 border-slate-800' : 'text-blue-600 border-slate-200'}`}>
                        {isTagalog ? '4. IBA PANG TULONG MULA SA GOBYERNO' : '4. OTHER GOVERNMENT ASSISTANCE'}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>RECEIVING GOVT ASSISTANCE?</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {receivingGovAssistance === 'Yes' ? `Yes (${govProgramName || 'Program'}${govAssistanceAmountFreq ? ` - ${govAssistanceAmountFreq}` : ''})` : (receivingGovAssistance || 'No')}
                          </span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>RECEIVING PENSION?</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {receivingPension === 'Yes' ? `Yes (${pensionType || 'Pension'})` : (receivingPension || 'No')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Required Documents Section Card (Step 3) */}
                <div className={`border rounded-2xl overflow-hidden ${darkMode ? 'bg-[#0e1933]/60 border-slate-800' : 'bg-slate-50/80 border-slate-200 shadow-sm'}`}>
                  <div className={`p-4 flex items-center justify-between border-b ${darkMode ? 'bg-[#101c38] border-slate-800/80' : 'bg-slate-100 border-slate-200'}`}>
                    <h4 className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {isTagalog ? 'Kailangang mga Dokumento' : 'Required documents'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleEditStepFromReview(3)}
                      className="text-xs font-extrabold text-blue-500 hover:text-blue-400 flex items-center gap-1.5 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>{isTagalog ? 'BAGUHIN' : 'EDIT'}</span>
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    {[
                      { key: 'spic', title: isTagalog ? 'SOLO PARENT ID (SPIC) *' : 'SOLO PARENT ID (SPIC) *' },
                      { key: 'qcid', title: isTagalog ? 'QCITIZEN ID (QC ID) *' : 'QCITIZEN ID (QC ID) *' },
                      { key: 'proof_income', title: isTagalog ? 'PATUNAY NG KITA / INDIGENCY *' : 'PROOF OF INCOME / INDIGENCY *' },
                    ].map((doc) => {
                      const file = uploadedFiles[doc.key];
                      const previewUrl = file ? URL.createObjectURL(file) : null;
                      return (
                        <div key={doc.key} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-extrabold uppercase tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {doc.title}
                            </span>
                            {file && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          </div>
                          {previewUrl ? (
                            <div className="pt-1">
                              <div 
                                className={`w-36 border rounded-2xl p-2.5 flex flex-col items-center shadow-lg transition-all ${
                                  darkMode ? 'bg-[#091124] border-slate-700/90' : 'bg-white border-slate-200'
                                }`}
                              >
                                <div className={`w-20 h-20 rounded-xl overflow-hidden border shrink-0 ${
                                  darkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-100'
                                }`}>
                                  <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
                                </div>
                                <span className={`text-[10px] font-bold text-center truncate max-w-full mt-2 block px-1 ${
                                  darkMode ? 'text-slate-200' : 'text-slate-800'
                                }`}>
                                  {file.name}
                                </span>
                                <span className={`text-[9px] font-mono block text-center mt-0.5 ${
                                  darkMode ? 'text-slate-400' : 'text-slate-500'
                                }`}>
                                  {(file.size / 1024).toFixed(1)} KB
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="pt-0.5">
                              <span className={`text-xs italic ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                {isTagalog ? 'Walang larawang na-upload' : 'No photo uploaded'}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Action Row */}
              <div className="flex justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-2.5 rounded-xl border border-slate-700 text-xs font-bold uppercase text-slate-300 hover:bg-slate-800"
                >
                  {isTagalog ? 'BUMALIK' : 'BACK'}
                </button>
                <button
                  type="button"
                  onClick={handleSubmitApplication}
                  disabled={isSubmitting}
                  className={`px-8 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
                    !isSubmitting
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <span>{isTagalog ? 'Ipinapasa ang Aplikasyon...' : 'Submitting Application...'}</span>
                  ) : (
                    <span>{isTagalog ? 'IPASA' : 'SUBMIT'}</span>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* REQUIREMENTS MODAL */}
      {showReqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b162c] border border-blue-800/80 rounded-2xl p-6 max-w-lg w-full space-y-4 text-white relative">
            <button
              type="button"
              onClick={() => setShowReqModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold flex items-center gap-2 text-blue-400">
              <Info className="w-5 h-5" />
              Solo Parent Financial Subsidy Requirements
            </h3>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
              <p className="font-bold text-white">1. Solo Parent Identification Card (SPIC)</p>
              <p className="pl-3 text-slate-400">• Photocopy of active Solo Parent ID Card (Front and Back)</p>

              <p className="font-bold text-white pt-2">2. QCitizen ID (QC ID)</p>
              <p className="pl-3 text-slate-400">• Photocopy of QCitizen ID Card</p>

              <p className="font-bold text-white pt-2">3. Proof of Indigency / Income (Depending on Employment Status)</p>
              <ul className="pl-6 space-y-1 list-disc text-amber-300">
                <li><strong>Unemployed:</strong> Affidavit of No Employment / Non-Employment</li>
                <li><strong>Employed:</strong> Latest ITR or latest payslip covering one month</li>
                <li><strong>Informal worker:</strong> Verifiable proof of income or Barangay Certificate of Indigency</li>
              </ul>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowReqModal(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}



      {/* CAMERA CAPTURE MODAL */}
      {activeCameraKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className={`w-full max-w-lg rounded-3xl border p-6 space-y-4 shadow-2xl relative ${
            darkMode ? 'bg-[#0b1528] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-700/60">
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Take Photo Document</span>
              </h3>
              <button 
                type="button" 
                onClick={handleCloseCamera}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cameraError ? (
              <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs text-center space-y-2">
                <AlertCircle className="w-6 h-6 mx-auto text-red-400" />
                <p>{cameraError}</p>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-800 shadow-inner">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseCamera}
                className="px-5 py-2.5 rounded-xl text-xs font-bold border border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              {!cameraError && (
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-950/50"
                >
                  <Camera className="w-4 h-4" />
                  <span>CAPTURE PHOTO</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
