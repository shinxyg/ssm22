import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE_URL } from '../../config/api';
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle2, 
  Upload, 
  ShieldCheck, 
  QrCode,
  Info,
  X,
  Camera,
  Pencil,
  UserCheck,
  ChevronUp,
  ChevronRight,
  Plus,
  Trash2,
  Printer,
  Download,
  Eye,
  AlertCircle
} from 'lucide-react';
import type { ApplicationRecord } from '../../types';

interface SeniorCitizenAssistanceViewProps {
  onBack: () => void;
  onAddApplication: (app: ApplicationRecord) => void;
  darkMode?: boolean;
  onNavigateToModule?: (tab: string) => void;
  applications?: ApplicationRecord[];
}

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  age: string;
  occupation: string;
  incomeSource: string;
  otherInfo: string;
}

// Utility to calculate age from Date of Birth string
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

export const SeniorCitizenAssistanceView: React.FC<SeniorCitizenAssistanceViewProps> = ({
  onBack,
  onAddApplication,
  darkMode = true,
  onNavigateToModule,
  applications = [],
}) => {
  const { language, t } = useLanguage();
  const isTagalog = language === 'Tagalog';

  // Dynamic light/dark mode helper classes for clean UX
  const labelClass = `text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`;
  const inputClass = `w-full px-3.5 py-2 rounded-xl text-xs font-semibold border focus:border-blue-500 focus:outline-none transition-colors ${
    darkMode 
      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
  }`;
  const subCardClass = darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200';
  const dividerClass = darkMode ? 'border-slate-800' : 'border-slate-200';

  // Stepper state (1: COMPLETE CHECKLIST, 2: INFORMATION, 3: UPLOAD REQUIREMENTS, 4: REVIEW & SUBMIT)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isEditingFromStep4, setIsEditingFromStep4] = useState<boolean>(false);

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

  // STEP 1 States
  const [seniorIdNumber, setSeniorIdNumber] = useState<string>('');
  const [isSeniorIdVerified, setIsSeniorIdVerified] = useState<boolean>(false);
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [showReqModal, setShowReqModal] = useState<boolean>(false);

  const handleVerifySeniorId = () => {
    if (seniorIdNumber.trim() !== '') {
      setIsSeniorIdVerified(true);
    }
  };

  // STEP 2 States — 1. Personal Information (Prefilled & Disabled Verified Profile)
  const [qcId, setQcId] = useState<string>('110000262304143');
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
  const [seniorIdDetails, setSeniorIdDetails] = useState<string>('');

  // STEP 2 States — 2. Occupation / Financial Information
  const [employmentStatus, setEmploymentStatus] = useState<string>('');
  const [occupation, setOccupation] = useState<string>('');
  const [sourceOfIncome, setSourceOfIncome] = useState<string>('');
  const [approxMonthlyIncome, setApproxMonthlyIncome] = useState<string>('');
  const [pensionsReceived, setPensionsReceived] = useState<string>('');
  const [otherPensionDetails, setOtherPensionDetails] = useState<string>('');

  // STEP 2 States — 3. Family Composition
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);
  const [memName, setMemName] = useState<string>('');
  const [memRel, setMemRel] = useState<string>('');
  const [memAge, setMemAge] = useState<string>('');
  const [memOcc, setMemOcc] = useState<string>('');
  const [memIncome, setMemIncome] = useState<string>('');
  const [memOtherInfo, setMemOtherInfo] = useState<string>('');

  // STEP 2 States — 4. Monthly Household Expenses
  const [totalMonthlyExpenses, setTotalMonthlyExpenses] = useState<string>('');

  // STEP 2 States — 5. Living Situation / Additional Information (Selections)
  const [livingArrangement, setLivingArrangement] = useState<string>('');
  const [customLivingArrangement, setCustomLivingArrangement] = useState<string>('');
  
  const [financialSupportSource, setFinancialSupportSource] = useState<string>('');
  const [customFinancialSupport, setCustomFinancialSupport] = useState<string>('');

  const [reasonForAssistance, setReasonForAssistance] = useState<string>('');
  const [customReasonForAssistance, setCustomReasonForAssistance] = useState<string>('');

  // STEP 2 States — 6. Other Assistance / Benefits Received
  const [otherBenefitsReceived, setOtherBenefitsReceived] = useState<string>('');
  const [customOtherBenefit, setCustomOtherBenefit] = useState<string>('');

  // STEP 3 Upload States
  const [docSeniorId, setDocSeniorId] = useState<{ name: string; url?: string; dataUrl?: string } | null>(null);
  const [docIndigency, setDocIndigency] = useState<{ name: string; url?: string; dataUrl?: string } | null>(null);
  const [docOtherSupport, setDocOtherSupport] = useState<{ name: string; url?: string; dataUrl?: string } | null>(null);

  // Step 4 Collapsible Accordion State
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({});
  const toggleSection = (key: string) => setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Image Preview Modal State

  // Camera Capture Modal State
  const [activeCameraDocKey, setActiveCameraDocKey] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Camera functions
  const openCameraModal = async (docKey: string) => {
    setActiveCameraDocKey(docKey);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera access failed or unavailable, using simulation mode", err);
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
    let capturedUrl = 'https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?w=500&auto=format&fit=crop&q=80';
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          capturedUrl = canvas.toDataURL('image/jpeg', 0.85);
        }
      } catch (e) {
        console.warn('Canvas camera capture notice:', e);
      }
    }
    const photoDoc = { name: `camera_capture_${Date.now()}.jpg`, url: capturedUrl, dataUrl: capturedUrl };

    if (activeCameraDocKey === 'seniorId') setDocSeniorId(photoDoc);
    if (activeCameraDocKey === 'indigency') setDocIndigency(photoDoc);
    if (activeCameraDocKey === 'otherSupport') setDocOtherSupport(photoDoc);

    closeCameraModal();
  };

  // Submission success state
  const [submittedAppRecord, setSubmittedAppRecord] = useState<ApplicationRecord | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  // Auto-calculate applicant age from DOB
  useEffect(() => {
    if (dob) {
      const calcAge = calculateAgeFromDob(dob);
      if (calcAge) setAge(calcAge);
    }
  }, [dob]);

  const handleAddFamilyMember = () => {
    setFamilyMembers((prev) => [
      ...prev,
      {
        id: `mem-${Date.now()}`,
        name: '',
        relationship: '',
        age: '',
        occupation: '',
        incomeSource: '',
        otherInfo: '',
      },
    ]);
  };

  const updateFamilyMember = (id: string, field: keyof FamilyMember, value: string) => {
    setFamilyMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleRemoveFamilyMember = (id: string) => {
    setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
  };

  // File Upload Handler with compressed persistent Base64 dataUrl conversion
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setDoc: React.Dispatch<React.SetStateAction<{ name: string; url?: string; dataUrl?: string } | null>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawDataUrl = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          try {
            const maxDim = 1200;
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, w, h);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
              setDoc({ name: file.name, url: compressedDataUrl, dataUrl: compressedDataUrl });
              return;
            }
          } catch (err) {
            console.warn('Canvas compression notice:', err);
          }
          setDoc({ name: file.name, url: rawDataUrl, dataUrl: rawDataUrl });
        };
        img.onerror = () => {
          setDoc({ name: file.name, url: rawDataUrl, dataUrl: rawDataUrl });
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinalSubmit = async () => {
    const refNo = `SENIOR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullApplicantName = `${firstName || 'Senior'} ${middleName ? middleName + ' ' : ''}${lastName || 'Citizen'} ${suffix}`.trim();

    const fullPayload = {
      referenceNo: refNo,
      applicantName: fullApplicantName,
      firstName,
      middleName,
      lastName,
      suffix,
      dob,
      age,
      gender,
      civilStatus,
      houseNo,
      streetName: street,
      barangay,
      phoneNumber: phone,
      seniorIdNo: seniorIdNumber || qcId || 'QC-SR-2026-88192',
      status: 'Pending Validation',
      details: {
        personalInformation: {
          firstName,
          middleName,
          lastName,
          suffix,
          nationality,
          dateOfBirth: dob,
          age,
          gender,
          civilStatus,
          houseNo,
          streetName: street,
          barangay,
          phoneNumber: phone,
          seniorCitizenId: seniorIdNumber || qcId
        },
        occupationFinancialInformation: {
          employmentStatus,
          occupation,
          sourceOfIncome,
          approxMonthlyIncome,
          pensionReceived: pensionsReceived,
          otherPensionDetails
        },
        familyComposition: familyMembers,
        monthlyHouseholdExpenses: {
          totalMonthlyExpenses
        },
        livingSituationAdditionalInfo: {
          livingArrangement,
          customLivingArrangement,
          financialSupportSource,
          customFinancialSupport,
          reasonForAssistance,
          customReasonForAssistance
        },
        otherAssistanceBenefits: {
          benefitReceived: otherBenefitsReceived,
          customBenefitReceived: customOtherBenefit
        },
        uploadedDocuments: {
          seniorIdCard: docSeniorId?.name || null,
          indigencyCert: docIndigency?.name || null,
          otherSupport: docOtherSupport?.name || null
        },
        uploadedDocData: {
          seniorIdCard: docSeniorId ? { name: docSeniorId.name, url: docSeniorId.dataUrl || docSeniorId.url, dataUrl: docSeniorId.dataUrl || docSeniorId.url } : null,
          indigencyCert: docIndigency ? { name: docIndigency.name, url: docIndigency.dataUrl || docIndigency.url, dataUrl: docIndigency.dataUrl || docIndigency.url } : null,
          otherSupport: docOtherSupport ? { name: docOtherSupport.name, url: docOtherSupport.dataUrl || docOtherSupport.url, dataUrl: docOtherSupport.dataUrl || docOtherSupport.url } : null
        }
      }
    };

    try {
      await fetch(`${API_BASE_URL}/api/senior/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullPayload)
      });
    } catch (err) {
      console.warn('Backend API submission notice, saving locally:', err);
    }

    const newApp: ApplicationRecord = {
      referenceNo: refNo,
      serviceName: 'Senior Citizen Financial Assistance',
      category: 'Senior Assistance',
      dateSubmitted: `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
      status: 'Pending Validation',
      assignedSocialWorker: 'Maria Santos, RSW (Senior Sector Dept)',
      amountOrType: '₱3,000.00 Financial Assistance',
      details: fullPayload.details
    };

    onAddApplication(newApp);
    setSubmittedAppRecord(newApp);
  };

  // Check if there is an active pending (ongoing) Senior Citizen application
  const activePendingApp = applications?.find(app => {
    const cat = (app.category || '').toLowerCase();
    const isSenior = cat.includes('senior') || (app.serviceName || '').toLowerCase().includes('senior');
    if (!isSenior) return false;
    const st = (app.status || '').toUpperCase();
    const isFinished = 
      st.includes('RELEASED') || 
      st.includes('COMPLETED') || 
      st.includes('REJECTED') || 
      st.includes('DISAPPROVED');
    return !isFinished;
  });

  // Check if submittedAppRecord has finished in global applications state
  const submittedAppInList = applications?.find(app => app.referenceNo === submittedAppRecord?.referenceNo);
  const isSubmittedAppFinished = submittedAppInList ? (
    (submittedAppInList.status || '').toUpperCase().includes('RELEASED') ||
    (submittedAppInList.status || '').toUpperCase().includes('COMPLETED') ||
    (submittedAppInList.status || '').toUpperCase().includes('REJECTED') ||
    (submittedAppInList.status || '').toUpperCase().includes('DISAPPROVED')
  ) : false;

  const targetApp = isSubmittedAppFinished ? null : (activePendingApp || (submittedAppRecord && !isSubmittedAppFinished ? submittedAppRecord : null));

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
              Your application for Senior Citizen Social Assistance has been successfully submitted and is currently pending review. Please wait for a Social Worker's assessment.
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
    <div className={`space-y-5 max-w-4xl mx-auto pb-12 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Top Header & Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Services</span>
        </button>

        <div className="text-right">
          <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400 font-bold block">
            OFFICIAL CITIZEN PORTAL
          </span>
          <h2 className="text-lg font-extrabold tracking-tight">Social Welfare Assistance (SWA)</h2>
        </div>
      </div>

      {/* SINGLE UNIFIED MAIN CONTAINER CARD FOR ALL CONTENT */}
      <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 transition-colors ${
        darkMode ? 'bg-[#0e172a] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* 1. HEADER & INFORMATION BOX SECTION */}
        <div className={`space-y-4 pb-6 border-b ${darkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl shrink-0 border ${
              darkMode ? 'bg-blue-600/20 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'
            }`}>
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                SOCIAL WELFARE ASSISTANCE (SWA) — SENIOR CITIZEN SECTOR
              </h1>
              <p className={`text-xs sm:text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Quezon City Social Services & Development Department • Senior Citizen Sector
              </p>
            </div>
          </div>

          {/* Information Box */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            darkMode ? 'bg-blue-950/60 border-blue-800/50 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}>
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm leading-relaxed font-medium">
              <strong className={darkMode ? 'text-white' : 'text-slate-900'}>Senior Citizen Sector:</strong> Qualified indigent Senior Citizens aged 60 and above may receive the assistance, subject to validation and assessment.
            </div>
          </div>
        </div>

        {/* 2. STEP PROGRESS BAR SECTION */}
        <div className={`p-6 rounded-2xl border mb-6 ${darkMode ? 'bg-[#0c162b] border-slate-800' : 'bg-slate-100/70 border-slate-200'}`}>
          {/* Step Numbers Connected Line */}
          <div className="relative flex justify-between items-center max-w-3xl mx-auto mb-6">
            <div className={`absolute top-1/2 left-4 right-4 h-0.5 -translate-y-1/2 z-0 ${
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
                    disabled={!isPassed && !isCurrent && !isEditingFromStep4}
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-500/20'
                        : isPassed
                        ? 'bg-blue-600 text-white cursor-pointer'
                        : darkMode
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        : 'bg-slate-100 text-slate-500 border border-slate-300 cursor-not-allowed'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-5 h-5 text-white" /> : stepNum}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Tab Buttons Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-4xl mx-auto">
            {[
              { num: 1, label: isTagalog ? 'KOMPLETONG TSEKLIST' : 'COMPLETE CHECKLIST' },
              { num: 2, label: isTagalog ? 'PERSONAL NA IMPORMASYON' : 'PERSONAL INFORMATION' },
              { num: 3, label: isTagalog ? 'PAG-UPLOAD NG DOKUMENTO' : 'UPLOAD DOCUMENTS' },
              { num: 4, label: isTagalog ? 'PAGSUSURI AT PAG-SUBMIT' : 'REVIEW & SUBMIT' },
            ].map((tab) => {
              const isActive = currentStep === tab.num;
              const isPassed = currentStep > tab.num;
              return (
                <button
                  key={tab.num}
                  type="button"
                  onClick={() => {
                    if (isPassed || isEditingFromStep4) {
                      setCurrentStep(tab.num);
                    }
                  }}
                  disabled={!isPassed && !isActive && !isEditingFromStep4}
                  className={`py-3 px-2 text-[11px] font-extrabold tracking-wider rounded-xl transition-all uppercase text-center border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                      : isPassed || isEditingFromStep4
                      ? darkMode
                        ? 'bg-slate-900/80 text-blue-400 border-slate-800 hover:text-white hover:bg-slate-800 cursor-pointer'
                        : 'bg-slate-50 text-blue-600 border-slate-200 hover:bg-slate-100 cursor-pointer'
                      : darkMode
                      ? 'bg-slate-900/40 text-slate-500 border-slate-800/60 cursor-not-allowed'
                      : 'bg-slate-100/50 text-slate-400 border-slate-200/60 cursor-not-allowed'
                  }`}
                >
                  <span className="truncate block">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. STEP CONTENT AREA */}
        {currentStep === 1 && (
          <div className="space-y-6 pt-2">
            {/* 1. Required Documentary Requirements Section FIRST */}
            <div className="space-y-4">
              <div className={`flex items-center justify-between border-b pb-3 ${darkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
                <h3 className={`text-base font-extrabold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  <FileText className="w-5 h-5 text-blue-500" />
                  Required Documentary Requirements
                </h3>
                <button
                  type="button"
                  onClick={() => setShowReqModal(true)}
                  className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1"
                >
                  <Info className="w-4 h-4" />
                  <span>View Guidelines</span>
                </button>
              </div>

              <ul className="space-y-2 text-xs py-1">
                <li className={`flex items-start gap-2.5 py-1.5 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className={darkMode ? 'text-white' : 'text-slate-900'}>QCitizen ID / Senior Citizen ID:</strong> Valid ID card issued by Quezon City OSCA / LGU.
                  </div>
                </li>
                <li className={`flex items-start gap-2.5 py-1.5 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className={darkMode ? 'text-white' : 'text-slate-900'}>Certificate of Indigency:</strong> Issued by Barangay with purpose specified as <em>"For Social Welfare Assistance"</em>.
                  </div>
                </li>
                <li className={`flex items-start gap-2.5 py-1.5 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className={darkMode ? 'text-white' : 'text-slate-900'}>Other Supporting Documents:</strong> Any medical prescription, utility bill, or case summary if applicable based on circumstances.
                  </div>
                </li>
              </ul>
            </div>

            {/* 2. Senior Citizen ID Verification Section SECOND */}
            <div className={`pt-4 border-t space-y-4 ${darkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
              <h3 className={`text-base font-extrabold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                Senior Citizen ID Verification
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2 space-y-1.5">
                  <label className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Senior Citizen ID *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={seniorIdNumber}
                    onChange={(e) => setSeniorIdNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 34234324"
                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold border focus:outline-none focus:border-blue-500 ${
                      darkMode 
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleVerifySeniorId}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify Senior ID</span>
                </button>
              </div>

              {isSeniorIdVerified && (
                <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  darkMode ? 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>QC Senior Citizen ID Verified — Qualified Senior Citizen Sector Beneficiary</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    darkMode ? 'bg-emerald-900/60 text-emerald-200 border-emerald-700' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    Status: VERIFIED
                  </span>
                </div>
              )}
            </div>

            {/* 3. NEXT Button INSIDE the Card Box (bottom-right, turns blue when ID is inputted) */}
            <div className={`pt-4 border-t flex justify-end ${darkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => handleNextStep(2)}
                disabled={!seniorIdNumber.trim()}
                className={`py-2.5 px-8 text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  seniorIdNumber.trim()
                    ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                    : darkMode
                    ? 'bg-slate-800 border border-slate-700/60 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-200 border border-slate-300 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>NEXT</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      {/* ========================================================================= */}
      {/* STEP 2: INFORMATION (SENIOR CITIZEN SWA APPLICATION FORM)                 */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="space-y-6 pt-2">
          <h2 className={`text-xl font-black tracking-tight border-b pb-4 mb-6 ${darkMode ? 'text-white border-slate-800' : 'text-slate-900 border-slate-200'}`}>
            Senior Citizen SWA Application Form
          </h2>

            {/* IMPORTANT REMINDER Box */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 mb-6 ${
              darkMode ? 'bg-[#0e1d3d] border-blue-800/60 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}>
              <Info className={`w-5 h-5 shrink-0 mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <div>
                <h4 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                  IMPORTANT REMINDER
                </h4>
                <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Please make sure the information on your QCID is correct and complete. If any detail is missing or incorrect, contact the QCID Team to update your QCID records before continuing your application.
                </p>
              </div>
            </div>

            {/* SECTION 1: PERSONAL INFORMATION (Prefilled & Disabled Verified Profile) */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm font-extrabold text-blue-500 uppercase tracking-wider">
                <span>Personal Information (Verified Citizen Profile - Read Only)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className={labelClass}>First name *</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={firstName || 'JEFFERSON'}
                    className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                  />
                </div>

                <div>
                  <label className={labelClass}>Middle name</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={middleName || 'FERNANDO'}
                    className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                  />
                </div>

                <div>
                  <label className={labelClass}>Last name *</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={lastName || 'LEE'}
                    className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                  />
                </div>

                <div>
                  <label className={labelClass}>Suffix (Jr., Sr., III, etc.)</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    placeholder="Suffix (Jr., Sr., III, etc.)"
                    value={suffix}
                    className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                  />
                </div>

                <div>
                  <label className={labelClass}>Nationality *</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={nationality || 'FILIPINO'}
                    className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                  />
                </div>

                <div>
                  <label className={labelClass}>Date of birth *</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value="27/09/2004"
                    className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                  />
                </div>

                <div>
                  <label className={labelClass}>Age *</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={age || '22'}
                    className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 font-bold text-blue-400`}
                  />
                </div>

                <div>
                  <label className={labelClass}>Gender *</label>
                  <select
                    disabled
                    value={gender || 'Male'}
                    className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Civil status *</label>
                  <select
                    disabled
                    value={civilStatus || 'Single'}
                    className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>House/Building number *</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={houseNo || '176'}
                    className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                  />
                </div>

                <div>
                  <label className={labelClass}>Street name *</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={street || '23'}
                    className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                  />
                </div>

                <div>
                  <label className={labelClass}>Barangay *</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={barangay || 'Bagong Silangan'}
                    className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                  />
                </div>

                <div>
                  <label className={labelClass}>Phone number *</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={phone || '09155582122'}
                    className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                  />
                </div>

                <div>
                  <label className={labelClass}>Senior Citizen ID *</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={seniorIdNumber || qcId || 'QC-SR-2026-88192'}
                    className={`${inputClass} cursor-not-allowed select-none border-slate-700/50 opacity-90 font-mono`}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: OCCUPATION / FINANCIAL INFORMATION */}
            <div className="mt-8 pt-8 border-t border-slate-800 space-y-6">
              <div className="flex items-center gap-2 text-sm font-extrabold text-blue-400 uppercase tracking-wider">
                <span>Occupation / Financial Information</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelClass}>Employment Status *</label>
                  <select
                    value={employmentStatus}
                    onChange={(e) => setEmploymentStatus(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select Employment Status</option>
                    <option value="Retired / Unemployed">Retired / Unemployed</option>
                    <option value="Self-Employed / Informal Worker">Self-Employed / Informal Worker</option>
                    <option value="Employed (Part-Time)">Employed (Part-Time)</option>
                    <option value="Employed (Full-Time)">Employed (Full-Time)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Current / Previous Occupation</label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="e.g. Laundry Worker, Driver, Vendor, N/A"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Source of Income</label>
                  <input
                    type="text"
                    value={sourceOfIncome}
                    onChange={(e) => setSourceOfIncome(e.target.value)}
                    placeholder="e.g. Children support, Small vending, Pension"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Approximate Monthly Income (₱)</label>
                  <select
                    value={approxMonthlyIncome}
                    onChange={(e) => setApproxMonthlyIncome(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select Monthly Income</option>
                    <option value="No Regular Income">No Regular Income (₱0)</option>
                    <option value="Below ₱3,000">Below ₱3,000</option>
                    <option value="₱3,000 - ₱5,000">₱3,000 - ₱5,000</option>
                    <option value="₱5,000 - ₱10,000">₱5,000 - ₱10,000</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className={labelClass}>Pension / Benefits Received, if any:</label>
                  <select
                    value={pensionsReceived}
                    onChange={(e) => setPensionsReceived(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select Pension / Benefit</option>
                    <option value="None">None</option>
                    <option value="SSS Pension">SSS Pension</option>
                    <option value="GSIS Pension">GSIS Pension</option>
                    <option value="Other">Other</option>
                  </select>
                  {pensionsReceived === 'Other' && (
                    <input
                      type="text"
                      value={otherPensionDetails}
                      onChange={(e) => setOtherPensionDetails(e.target.value)}
                      placeholder="Specify pension/benefit details..."
                      className={`w-full mt-2 ${inputClass}`}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3: FAMILY COMPOSITION */}
            <div className={`mt-8 pt-8 border-t ${dividerClass} space-y-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-extrabold text-blue-500 uppercase tracking-wider">
                    <span>Family Composition</span>
                  </div>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Para malaman kung sino ang kasama at sumusuporta sa senior
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddFamilyMember}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl border border-blue-400/40 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Family Member</span>
                </button>
              </div>

              {familyMembers.length === 0 ? (
                <div className={`p-4 rounded-xl border border-dashed text-center text-xs ${
                  darkMode ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-300 text-slate-500'
                }`}>
                  No family members added yet. Click "+ Add Family Member" to insert a blank row.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-b font-bold ${
                        darkMode ? 'border-slate-800 text-slate-400 bg-slate-900/80' : 'border-slate-200 text-slate-600 bg-slate-100'
                      }`}>
                        <th className="py-2.5 px-3 min-w-[150px]">Name *</th>
                        <th className="py-2.5 px-3 min-w-[120px]">Relationship</th>
                        <th className="py-2.5 px-3 w-[80px]">Age</th>
                        <th className="py-2.5 px-3 min-w-[130px]">Occupation</th>
                        <th className="py-2.5 px-3 min-w-[140px]">Income / Support</th>
                        <th className="py-2.5 px-3 text-right w-[60px]">Action</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${dividerClass}`}>
                      {familyMembers.map((mem) => (
                        <tr key={mem.id} className="font-medium">
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={mem.name}
                              onChange={(e) => updateFamilyMember(mem.id, 'name', e.target.value)}
                              placeholder="Full name"
                              className={inputClass}
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={mem.relationship}
                              onChange={(e) => updateFamilyMember(mem.id, 'relationship', e.target.value)}
                              placeholder="Son / Daughter"
                              className={inputClass}
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={mem.age}
                              onChange={(e) => updateFamilyMember(mem.id, 'age', e.target.value.replace(/\D/g, '').slice(0, 2))}
                              maxLength={2}
                              placeholder="Age"
                              className={inputClass}
                            />
                          </td>
                          <td className="py-2 px-2 space-y-1">
                            <select
                              value={['Unemployed', 'Employed', 'Self-Employed', 'Student', 'Retired', 'Housewife / Househusband', 'None / N/A'].includes(mem.occupation) ? mem.occupation : (mem.occupation ? 'Other' : '')}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'Other') {
                                  updateFamilyMember(mem.id, 'occupation', 'Other');
                                } else {
                                  updateFamilyMember(mem.id, 'occupation', val);
                                }
                              }}
                              className={inputClass}
                            >
                              <option value="">Select Occupation</option>
                              <option value="Unemployed">Unemployed</option>
                              <option value="Employed">Employed</option>
                              <option value="Self-Employed">Self-Employed</option>
                              <option value="Student">Student</option>
                              <option value="Retired">Retired</option>
                              <option value="Housewife / Househusband">Housewife / Househusband</option>
                              <option value="None / N/A">None / N/A</option>
                              <option value="Other">Other (Specify)</option>
                            </select>
                            {(!['Unemployed', 'Employed', 'Self-Employed', 'Student', 'Retired', 'Housewife / Househusband', 'None / N/A'].includes(mem.occupation) && mem.occupation !== '') && (
                              <input
                                type="text"
                                value={mem.occupation === 'Other' ? '' : mem.occupation}
                                onChange={(e) => updateFamilyMember(mem.id, 'occupation', e.target.value || 'Other')}
                                placeholder="Specify occupation..."
                                className={inputClass}
                              />
                            )}
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={mem.incomeSource}
                              onChange={(e) => updateFamilyMember(mem.id, 'incomeSource', e.target.value.replace(/\D/g, '').slice(0, 5))}
                              maxLength={5}
                              placeholder="Income / Support"
                              className={inputClass}
                            />
                          </td>
                          <td className="py-2 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveFamilyMember(mem.id)}
                              className="text-rose-500 hover:text-rose-400 p-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/10 transition-colors"
                              title="Remove Member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SECTION 4: MONTHLY HOUSEHOLD EXPENSES */}
            <div className={`mt-8 pt-8 border-t ${dividerClass} space-y-4`}>
              <div className="flex items-center gap-2 text-sm font-extrabold text-blue-500 uppercase tracking-wider">
                <span>Monthly Household Expenses</span>
              </div>

              <div className="max-w-md space-y-1">
                <label className={labelClass}>Total Monthly Household Expenses (₱) *</label>
                <input
                  type="text"
                  value={totalMonthlyExpenses}
                  onChange={(e) => setTotalMonthlyExpenses(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  maxLength={5}
                  placeholder="e.g. 3500"
                  className={inputClass}
                />
              </div>
            </div>

            {/* SECTION 5: LIVING SITUATION & ADDITIONAL SELECTIONS */}
            <div className={`mt-8 pt-8 border-t ${dividerClass} space-y-4`}>
              <div className="flex items-center gap-2 text-sm font-extrabold text-blue-500 uppercase tracking-wider">
                <span>Living Situation & Additional Information</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Living Arrangement Selection */}
                <div className="space-y-1">
                  <label className={labelClass}>Living Arrangement *</label>
                  <select
                    value={livingArrangement}
                    onChange={(e) => setLivingArrangement(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select Living Arrangement</option>
                    <option value="Living Alone">Living Alone</option>
                    <option value="Living with Spouse">Living with Spouse</option>
                    <option value="Living with Children">Living with Children</option>
                    <option value="Living with Relatives">Living with Relatives</option>
                    <option value="Other">Other</option>
                  </select>
                  {livingArrangement === 'Other' && (
                    <input
                      type="text"
                      value={customLivingArrangement}
                      onChange={(e) => setCustomLivingArrangement(e.target.value)}
                      placeholder="Specify living arrangement..."
                      className={`w-full mt-2 ${inputClass}`}
                    />
                  )}
                </div>

                {/* Source of Financial Support Selection */}
                <div className="space-y-1">
                  <label className={labelClass}>Source of Financial Support *</label>
                  <select
                    value={financialSupportSource}
                    onChange={(e) => setFinancialSupportSource(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select Financial Support</option>
                    <option value="Own Income">Own Income</option>
                    <option value="Children/Family">Children / Family</option>
                    <option value="Pension">Pension</option>
                    <option value="Other">Other</option>
                  </select>
                  {financialSupportSource === 'Other' && (
                    <input
                      type="text"
                      value={customFinancialSupport}
                      onChange={(e) => setCustomFinancialSupport(e.target.value)}
                      placeholder="Specify support source..."
                      className={`w-full mt-2 ${inputClass}`}
                    />
                  )}
                </div>

                {/* Reason for Requesting Assistance Selection */}
                <div className="space-y-1">
                  <label className={labelClass}>Reason for Requesting Assistance *</label>
                  <select
                    value={reasonForAssistance}
                    onChange={(e) => setReasonForAssistance(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select Reason for Assistance</option>
                    <option value="Insufficient Income">Insufficient Income</option>
                    <option value="No Regular Income">No Regular Income</option>
                    <option value="High Household Expenses">High Household Expenses</option>
                    <option value="Medical/Medication Expenses">Medical / Medication Expenses</option>
                    <option value="Food/Basic Needs">Food / Basic Needs</option>
                    <option value="Other">Other</option>
                  </select>
                  {reasonForAssistance === 'Other' && (
                    <input
                      type="text"
                      value={customReasonForAssistance}
                      onChange={(e) => setCustomReasonForAssistance(e.target.value)}
                      placeholder="Specify reason..."
                      className={`w-full mt-2 ${inputClass}`}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 6: OTHER ASSISTANCE / BENEFITS RECEIVED */}
            <div className={`mt-8 pt-8 border-t ${dividerClass} space-y-4`}>
              <div className="flex items-center gap-2 text-sm font-extrabold text-blue-500 uppercase tracking-wider">
                <span>Other Assistance / Benefits Received</span>
              </div>

              <div className="space-y-3">
                <label className={labelClass}>Select benefit received (or select None):</label>
                <select
                  value={otherBenefitsReceived}
                  onChange={(e) => setOtherBenefitsReceived(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select Benefit Received</option>
                  <option value="None">None</option>
                  <option value="DSWD Social Pension">DSWD Social Pension</option>
                  <option value="SSS Pension">SSS Pension</option>
                  <option value="GSIS Pension">GSIS Pension</option>
                  <option value="Other">Other</option>
                </select>
                {otherBenefitsReceived === 'Other' && (
                  <input
                    type="text"
                    value={customOtherBenefit}
                    onChange={(e) => setCustomOtherBenefit(e.target.value)}
                    placeholder="Specify other benefit received..."
                    className={`w-full mt-2 ${inputClass}`}
                  />
                )}
              </div>
            </div>

            <div className={`flex justify-between pt-4 border-t ${dividerClass}`}>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`py-3 px-6 text-xs font-bold rounded-xl border transition-all ${
                  darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                BACK
              </button>
              <button
                type="button"
                onClick={() => handleNextStep(3)}
                className="py-3 px-8 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center gap-2"
              >
                <span>NEXT</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      {/* ========================================================================= */}
      {/* STEP 3: UPLOAD REQUIREMENTS                                               */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="space-y-6 pt-2">
          <div>
            <h2 className={`text-xl font-black tracking-tight mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              File upload
            </h2>
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Make sure to upload the appropriate documents for each category and verify that all details—such as your full name (first, middle, and last name) and address—match the information on your QC ID.<br />
              Upload clear and legible copies of the required documents (JPG, JPEG, PNG, WEBP, or PDF).
            </p>
          </div>

          <div className="space-y-4">
            {[
              { key: 'seniorId', title: 'SENIOR CITIZEN / QCITIZEN ID *', doc: docSeniorId, setDoc: setDocSeniorId },
              { key: 'indigency', title: 'BARANGAY CERTIFICATE OF INDIGENCY *', doc: docIndigency, setDoc: setDocIndigency },
              { key: 'otherSupport', title: 'OTHER SUPPORTING DOCUMENTS (OPTIONAL)', doc: docOtherSupport, setDoc: setDocOtherSupport },
            ].map((item) => {
              const uploaded = item.doc;
              return (
                <div
                  key={item.key}
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
                        {item.title}
                      </span>
                      {uploaded && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/20 shrink-0" />
                      )}
                    </div>
                    <span className={`text-[11px] block mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Allowed file types: JPG, JPEG, PNG, WEBP (or capture using Camera)
                    </span>
                  </div>

                  {/* Action buttons matching Medical Assistance */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <label className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold cursor-pointer inline-flex items-center gap-2 transition-all shadow-md">
                      <Upload className="w-4 h-4" />
                      <span>UPLOAD PHOTO</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, item.setDoc)}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => openCameraModal(item.key)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold cursor-pointer inline-flex items-center gap-2 transition-all shadow-md"
                    >
                      <Camera className="w-4 h-4" />
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
                        {/* Floating X Delete Button */}
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

                        {/* Square Thumbnail Image */}
                        <div className={`w-20 h-20 rounded-xl overflow-hidden border shrink-0 ${
                          darkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-100'
                        }`}>
                          <img
                            src={uploaded.url || 'https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?w=500&auto=format&fit=crop&q=80'}
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
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className={`flex justify-between pt-4 border-t ${dividerClass}`}>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={`py-3 px-6 text-xs font-bold rounded-xl border transition-all ${
                darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              BACK
            </button>
            <button
              type="button"
              onClick={() => handleNextStep(4)}
              className="py-3 px-8 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <span>NEXT</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: REVIEW & SUBMIT APPLICATION SUMMARY                               */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div className="space-y-6 pt-2">
          <h2 className={`text-xl font-black tracking-tight border-b ${dividerClass} pb-4 mb-6 ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Step 4: Review & Finalize Application
          </h2>

          {/* SUMMARY CARDS */}
          <div className="space-y-4">
            {/* Unified Personal & Application Information Card */}
            <div className={`border rounded-2xl overflow-hidden ${darkMode ? 'bg-[#0e1933]/60 border-slate-800' : 'bg-slate-50/80 border-slate-200 shadow-sm'}`}>
              <div className={`p-4 flex items-center justify-between border-b ${darkMode ? 'bg-[#101c38] border-slate-800/80' : 'bg-slate-100 border-slate-200'}`}>
                <h4 className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Personal & Application Information</h4>
                <button
                  type="button"
                  onClick={() => handleEditStepFromReview(2)}
                  className="text-xs font-extrabold text-blue-500 hover:text-blue-400 flex items-center gap-1.5 transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>EDIT</span>
                </button>
              </div>

              <div className="p-5 space-y-6">
                {/* 1. Personal Information */}
                <div>
                  <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-3 pb-1 border-b ${darkMode ? 'text-blue-400 border-slate-800' : 'text-blue-600 border-slate-200'}`}>
                    1. PERSONAL INFORMATION
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
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
                    <div className="col-span-1 sm:col-span-3">
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>SENIOR CITIZEN ID</span>
                      <span className={`font-bold font-mono ${darkMode ? 'text-white' : 'text-slate-900'}`}>{seniorIdDetails || seniorIdNumber || qcId || 'QC-SR-2026-88192'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Occupation / Financial Information */}
                <div className={`pt-4 border-t ${darkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
                  <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-3 pb-1 border-b ${darkMode ? 'text-blue-400 border-slate-800' : 'text-blue-600 border-slate-200'}`}>
                    2. OCCUPATION / FINANCIAL INFORMATION
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>EMPLOYMENT STATUS</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{employmentStatus || 'Not Specified'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>CURRENT / PREVIOUS OCCUPATION</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{occupation || 'Not Specified'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>SOURCE OF INCOME</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{sourceOfIncome || 'Not Specified'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>APPROX. MONTHLY INCOME</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{approxMonthlyIncome || 'Not Specified'}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Family Composition & Dependents */}
                <div className={`pt-4 border-t ${darkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
                  <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-3 pb-1 border-b ${darkMode ? 'text-blue-400 border-slate-800' : 'text-blue-600 border-slate-200'}`}>
                    3. FAMILY COMPOSITION & DEPENDENTS
                  </h5>
                  {familyMembers.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No family members added / specified.</span>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className={`border-b text-[10px] uppercase font-bold ${darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                            <th className="py-1.5 px-2">Name</th>
                            <th className="py-1.5 px-2">Relationship</th>
                            <th className="py-1.5 px-2">Age</th>
                            <th className="py-1.5 px-2">Occupation</th>
                            <th className="py-1.5 px-2">Income / Support</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                          {familyMembers.map((mem) => (
                            <tr key={mem.id} className="font-medium">
                              <td className={`py-2 px-2 font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{mem.name || 'N/A'}</td>
                              <td className="py-2 px-2 text-slate-400">{mem.relationship || 'N/A'}</td>
                              <td className="py-2 px-2 text-slate-400">{mem.age || 'N/A'}</td>
                              <td className="py-2 px-2 text-slate-400">{mem.occupation || 'N/A'}</td>
                              <td className={`py-2 px-2 font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                {mem.incomeSource
                                  ? (mem.incomeSource.startsWith('₱')
                                      ? mem.incomeSource
                                      : (!isNaN(Number(mem.incomeSource)) ? `₱${Number(mem.incomeSource).toLocaleString('en-US')}` : mem.incomeSource))
                                  : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 4. Monthly Household Expenses */}
                <div className={`pt-4 border-t ${darkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
                  <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-3 pb-1 border-b ${darkMode ? 'text-blue-400 border-slate-800' : 'text-blue-600 border-slate-200'}`}>
                    4. MONTHLY HOUSEHOLD EXPENSES
                  </h5>
                  <div className="text-xs">
                    <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>TOTAL MONTHLY HOUSEHOLD EXPENSES</span>
                    <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {totalMonthlyExpenses
                        ? (totalMonthlyExpenses.startsWith('₱')
                            ? totalMonthlyExpenses
                            : `₱${!isNaN(Number(totalMonthlyExpenses)) ? Number(totalMonthlyExpenses).toLocaleString('en-US') : totalMonthlyExpenses}`)
                        : 'Not Specified'}
                    </span>
                  </div>
                </div>

                {/* 5. Living Situation & Additional Information */}
                <div className={`pt-4 border-t ${darkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
                  <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-3 pb-1 border-b ${darkMode ? 'text-blue-400 border-slate-800' : 'text-blue-600 border-slate-200'}`}>
                    5. LIVING SITUATION & ADDITIONAL INFORMATION
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>LIVING ARRANGEMENT</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{livingArrangement === 'Other' ? customLivingArrangement : (livingArrangement || 'Not Specified')}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>SOURCE OF FINANCIAL SUPPORT</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{financialSupportSource === 'Other' ? customFinancialSupport : (financialSupportSource || 'Not Specified')}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>REASON FOR REQUESTING ASSISTANCE</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{reasonForAssistance === 'Other' ? customReasonForAssistance : (reasonForAssistance || 'Not Specified')}</span>
                    </div>
                  </div>
                </div>

                {/* 6. Other Assistance / Benefits Received */}
                <div className={`pt-4 border-t ${darkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
                  <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-3 pb-1 border-b ${darkMode ? 'text-blue-400 border-slate-800' : 'text-blue-600 border-slate-200'}`}>
                    6. OTHER ASSISTANCE / BENEFITS RECEIVED
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>PENSION / BENEFITS RECEIVED</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {pensionsReceived === 'Other' ? (otherPensionDetails || 'Other') : (pensionsReceived || 'None')}
                      </span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>OTHER BENEFITS RECORDED</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {otherBenefitsReceived === 'Other' ? (customOtherBenefit || 'Other') : (otherBenefitsReceived || 'None')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Required Documents Section Card */}
            <div className={`border rounded-2xl overflow-hidden ${darkMode ? 'bg-[#0e1933]/60 border-slate-800' : 'bg-slate-50/80 border-slate-200 shadow-sm'}`}>
              <div 
                onClick={() => toggleSection('documents')}
                className={`p-4 flex items-center justify-between cursor-pointer border-b ${darkMode ? 'bg-[#101c38] border-slate-800/80' : 'bg-slate-100 border-slate-200'}`}
              >
                <div className="flex items-center gap-2">
                  {collapsedSections['documents'] ? (
                    <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                  ) : (
                    <ChevronUp className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                  )}
                  <h4 className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Required documents</h4>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleEditStepFromReview(3); }}
                  className="text-xs font-extrabold text-blue-500 hover:text-blue-400 flex items-center gap-1.5 transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>EDIT</span>
                </button>
              </div>

              {!collapsedSections['documents'] && (
                <div className="p-5 space-y-4">
                  {[
                    { key: 'senior_id', title: 'SENIOR CITIZEN / QCITIZEN ID *', doc: docSeniorId },
                    { key: 'indigency', title: 'CERTIFICATE OF INDIGENCY (ORIHINAL NA KOPYA) *', doc: docIndigency },
                    { key: 'other', title: 'OTHER SUPPORTING DOCUMENTS (OPTIONAL)', doc: docOtherSupport },
                  ].map((item) => {
                    const file = item.doc;
                    return (
                      <div key={item.key} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-extrabold uppercase tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {item.title}
                          </span>
                          {file && <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/20" />}
                        </div>
                        {file ? (
                          <div className="pt-1">
                            <div 
                              className={`w-36 border rounded-2xl p-2.5 flex flex-col items-center shadow-lg transition-all ${
                                darkMode ? 'bg-[#091124] border-slate-700/90' : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className={`w-20 h-20 rounded-xl overflow-hidden border shrink-0 ${
                                darkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-100'
                              }`}>
                                <img src={file.url || 'https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?w=500&auto=format&fit=crop&q=80'} alt={file.name} className="w-full h-full object-cover" />
                              </div>
                              <span className={`text-[10px] font-bold text-center truncate max-w-full mt-2 block px-1 ${
                                darkMode ? 'text-slate-200' : 'text-slate-800'
                              }`}>
                                {file.name}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className={`text-xs italic block ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            No photo uploaded
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className={`flex justify-between pt-4 border-t ${dividerClass}`}>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className={`py-3 px-6 text-xs font-bold rounded-xl border transition-all ${
                darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              BACK
            </button>
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="py-3.5 px-10 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all shadow-lg shadow-blue-950/20"
            >
              SUBMIT
            </button>
          </div>
        </div>
      )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD FAMILY MEMBER                                                  */}
      {/* ========================================================================= */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className={`w-full max-w-md border rounded-2xl p-6 space-y-4 ${
            darkMode ? 'bg-[#0e172a] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex justify-between items-center border-b ${dividerClass} pb-3`}>
              <h3 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Add Family Member</h3>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className={`p-1 ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={labelClass}>Full Name *</label>
                <input
                  type="text"
                  value={memName}
                  onChange={(e) => setMemName(e.target.value)}
                  placeholder="e.g. Juan Dela Cruz Jr."
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Relationship *</label>
                  <input
                    type="text"
                    value={memRel}
                    onChange={(e) => setMemRel(e.target.value)}
                    placeholder="e.g. Son / Daughter"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Age *</label>
                  <input
                    type="text"
                    value={memAge}
                    onChange={(e) => setMemAge(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    maxLength={2}
                    placeholder="e.g. 35"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Occupation</label>
                <input
                  type="text"
                  value={memOcc}
                  onChange={(e) => setMemOcc(e.target.value)}
                  placeholder="e.g. Sales Associate / Unemployed"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Income / Source of Support</label>
                <input
                  type="text"
                  value={memIncome}
                  onChange={(e) => setMemIncome(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  maxLength={5}
                  placeholder="e.g. 8000"
                  className={inputClass}
                />
              </div>
            </div>

            <div className={`flex justify-end gap-3 pt-2 border-t ${dividerClass}`}>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className={`px-4 py-2 text-xs font-bold ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddFamilyMember}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition-all"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* MODAL: APPLICATION SUBMISSION SUCCESS & QR Payout Voucher                 */}
      {/* ========================================================================= */}


      {/* ========================================================================= */}
      {/* MODAL: DOCUMENTARY REQUIREMENTS GUIDELINES                                */}
      {/* ========================================================================= */}
      {showReqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className={`w-full max-w-lg border rounded-2xl p-6 space-y-4 ${
            darkMode ? 'bg-[#0e172a] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex justify-between items-center border-b ${dividerClass} pb-3`}>
              <h3 className={`text-base font-extrabold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <Info className="w-5 h-5 text-blue-500" />
                Documentary Guidelines — Senior Sector SWA
              </h3>
              <button
                type="button"
                onClick={() => setShowReqModal(false)}
                className={`p-1 ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`space-y-3 text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <p>
                Ang Social Welfare Assistance (SWA) para sa Senior Citizen Sector ay naglalayong magbigay ng suportang pampinansyal at pangkalusugan sa mga indigent Senior Citizens (60 taong gulang pataas).
              </p>
              <div className={`p-3 rounded-xl border space-y-1.5 ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <strong className={`block ${darkMode ? 'text-white' : 'text-slate-900'}`}>Mga kinakailangang dokumento:</strong>
                <ul className={`list-disc list-inside space-y-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  <li>Senior Citizen ID / QCitizen Card</li>
                  <li>Barangay Certificate of Indigency (Purpose: For Social Welfare Assistance)</li>
                  <li>Karagdagang resibo ng gamot o reseta (kung kinakailangan)</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowReqModal(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl"
              >
                Naintindihan Ko
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      {activeCameraDocKey && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-md w-full rounded-2xl border p-6 space-y-4 shadow-2xl ${
            darkMode ? 'bg-[#0f1b35] border-blue-900/60 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-500" />
                Capture Document Photo
              </h3>
              <button type="button" onClick={closeCameraModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-4 border-2 border-dashed border-cyan-400/60 rounded-lg pointer-events-none" />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeCameraModal}
                className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCapturePhoto}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Take Photo
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};
