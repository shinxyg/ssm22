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
  Trash2
} from 'lucide-react';
import type { ApplicationRecord } from '../../types';

interface PwdAssistanceViewProps {
  onBack: () => void;
  onAddApplication: (app: ApplicationRecord) => void;
  darkMode?: boolean;
  onNavigateToModule?: (tab: string) => void;
  applications?: ApplicationRecord[];
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

export const PwdAssistanceView: React.FC<PwdAssistanceViewProps> = ({
  onBack,
  onAddApplication,
  darkMode = true,
  onNavigateToModule,
  applications,
}) => {
  const { language, t } = useLanguage();
  const isTagalog = language === 'Tagalog';

  const [submittedApp, setSubmittedApp] = useState<ApplicationRecord | null>(null);

  // Stepper state (1: COMPLETE CHECKLIST, 2: PERSONAL INFORMATION, 3: UPLOAD DOCUMENTS, 4: REVIEW & SUBMIT)
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

  // Step 1 Form States (Matching exact PWD screenshots 1, 2, 3)
  const [pwdIdNumber, setPwdIdNumber] = useState<string>('');
  const [isPwdIdVerified, setIsPwdIdVerified] = useState<boolean>(false);
  const [typeOfDisability, setTypeOfDisability] = useState<string>('Auto-filled upon PWD ID verification');
  const [swaCategory, setSwaCategory] = useState<string>('');
  const [showReqModal, setShowReqModal] = useState<boolean>(false);

  const handleVerifyPwdId = () => {
    if (pwdIdNumber.trim() !== '') {
      setIsPwdIdVerified(true);
      setTypeOfDisability('Physical / Mobility Disability (QC PWD Verified)');
    }
  };

  // Step 2 Form States - Section 1: Personal Information (Prefilled & Disabled Verified Profile)
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
  const [email, setEmail] = useState<string>('jeffersonlee1234@gmail.com');

  // Section 2: OCCUPATION / EMPLOYMENT
  const [employmentStatus, setEmploymentStatus] = useState<string>('Unemployed / Jobless');
  const [occupation, setOccupation] = useState<string>('');
  const [sourceOfIncome, setSourceOfIncome] = useState<string>('');
  const [approxMonthlyIncome, setApproxMonthlyIncome] = useState<string>('No Regular Income');

  // Section 3: EDUCATIONAL BACKGROUND
  const [highestEducation, setHighestEducation] = useState<string>('');
  const [otherEducationInfo, setOtherEducationInfo] = useState<string>('');

  // Section 4: FAMILY COMPOSITION
  const [familyMembers, setFamilyMembers] = useState<{ id: string; name: string; rel: string; age: string; occ: string }[]>([]);

  // Section 5: ESTIMATE MONTHLY EXPENSES
  const [monthlyExpenses, setMonthlyExpenses] = useState<string>('');

  // Section 6: ADDITIONAL INFORMATION & SWA CATEGORY
  const [reasonForAssistance, setReasonForAssistance] = useState<string>('');

  const handleAddFamilyMember = () => {
    setFamilyMembers((prev) => [
      ...prev,
      {
        id: `mem-${Date.now()}`,
        name: '',
        rel: '',
        age: '',
        occ: '',
      },
    ]);
  };

  const updateFamilyMember = (id: string, field: 'name' | 'rel' | 'age' | 'occ', value: string) => {
    setFamilyMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleRemoveFamilyMember = (id: string) => {
    setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
  };

  // Auto-calculate applicant age from DOB
  useEffect(() => {
    if (dob) {
      const calcAge = calculateAgeFromDob(dob);
      if (calcAge) setAge(calcAge);
    }
  }, [dob]);

  // Step 3 Document Upload States
  const [docPwdId, setDocPwdId] = useState<{ name: string; url?: string } | null>(null);
  const [docIndigency, setDocIndigency] = useState<{ name: string; url?: string } | null>(null);
  const [docMedical, setDocMedical] = useState<{ name: string; url?: string } | null>(null);
  const [docResidency, setDocResidency] = useState<{ name: string; url?: string } | null>(null);


  // Camera Capture Modal State
  const [activeCameraDocKey, setActiveCameraDocKey] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Step 4 Review & Certification State
  const [certifiedTrue, setCertifiedTrue] = useState<boolean>(false);

  // Success Confirmation Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [generatedRefNo, setGeneratedRefNo] = useState<string>('');

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
    const fakePhotoUrl = `https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?w=500&auto=format&fit=crop&q=80`;
    const photoDoc = { name: `camera_capture_${Date.now()}.jpg`, url: fakePhotoUrl };

    if (activeCameraDocKey === 'pwd') setDocPwdId(photoDoc);
    if (activeCameraDocKey === 'indigency') setDocIndigency(photoDoc);
    if (activeCameraDocKey === 'medical') setDocMedical(photoDoc);
    if (activeCameraDocKey === 'residency') setDocResidency(photoDoc);

    closeCameraModal();
  };

  // Submit Application Handler
  const handleSubmitApplication = async () => {
    const newRef = `QC-PWD-${Math.floor(100000 + Math.random() * 900000)}`;
    setGeneratedRefNo(newRef);

    const uploadedDocsPayload = {
      pwd_id: docPwdId ? { name: docPwdId.name, url: docPwdId.url } : null,
      indigency_cert: docIndigency ? { name: docIndigency.name, url: docIndigency.url } : null,
      medical_cert: docMedical ? { name: docMedical.name, url: docMedical.url } : null,
      disability_photo: docResidency ? { name: docResidency.name, url: docResidency.url } : null
    };

    const fullApplicantName = [firstName, middleName, lastName, suffix].filter(Boolean).join(' ').trim();

    const payload = {
      referenceNo: newRef,
      applicantName: fullApplicantName || 'Jefferson Fernando Lee',
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
      pwdIdNo: pwdIdNumber ? (pwdIdNumber.startsWith('PWD-') ? pwdIdNumber : `PWD-${pwdIdNumber}`) : 'PWD-13-7404-000-0012345',
      employmentStatus,
      occupation,
      sourceOfIncome,
      approxMonthlyIncome,
      educationalAttainment: highestEducation,
      otherEducationInfo,
      familyMembers,
      monthlyExpenses,
      disabilityType: typeOfDisability,
      swaQualifyingCategory: swaCategory,
      reasonForAssistance,
      uploadedDocuments: uploadedDocsPayload,
      serviceName: 'PWD Social Assistance Program',
      category: 'pwd',
      assistanceType: 'PWD Social Aid',
      amount: 5000.00,
      status: 'Pending Review'
    };

    try {
      await fetch(`${API_BASE_URL}/api/pwd/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn("Failed to persist PWD application to backend database:", err);
    }

    const newAppRecord: ApplicationRecord = {
      referenceNo: newRef,
      serviceName: 'PWD Social Assistance Program',
      category: 'PWD Services',
      dateSubmitted: `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
      status: 'PENDING (Pending Document Validation)',
      assignedSocialWorker: 'Maria Santos, RSW (QC Social Services)',
      amountOrType: '₱1,500.00 Quarterly Cash Pension',
      qrCodeData: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${newRef}`
    };

    onAddApplication(newAppRecord);
    setSubmittedApp(newAppRecord);
  };

  // Shared Theme Styling Tokens for High-Contrast Readability
  const cardClass = darkMode 
    ? 'bg-[#0f1b35] border-slate-800 text-white' 
    : 'bg-white border-slate-200 text-slate-900';

  const labelClass = darkMode 
    ? 'text-slate-300 font-semibold text-xs mb-1 block' 
    : 'text-slate-700 font-bold text-xs mb-1 block';

  const inputClass = darkMode 
    ? 'w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none' 
    : 'w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none';

  const bannerClass = darkMode 
    ? 'p-4 rounded-xl bg-blue-950/50 border border-blue-800/60 flex items-start gap-3' 
    : 'p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3';

  const bannerTitleClass = darkMode 
    ? 'text-xs font-extrabold text-blue-300 uppercase tracking-wider' 
    : 'text-xs font-extrabold text-blue-900 uppercase tracking-wider';

  const bannerTextClass = darkMode 
    ? 'text-xs text-slate-300 mt-0.5 leading-relaxed' 
    : 'text-xs text-slate-700 mt-0.5 leading-relaxed font-medium';

  const subHeaderClass = darkMode 
    ? 'text-xs font-extrabold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2' 
    : 'text-xs font-extrabold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2';

  const backBtnClass = darkMode 
    ? 'px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-extrabold tracking-wider uppercase border border-slate-700 transition-all' 
    : 'px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-extrabold tracking-wider uppercase border border-slate-300 transition-all';

  // Check if there is an active pending PWD application in global applications list
  const activePendingApp = applications?.find(app => {
    const isThisModule = (app.referenceNo || '').startsWith('QC-PWD-') || 
      (app.referenceNo || '').startsWith('PWD-') || 
      (app.serviceName || '').toLowerCase().includes('pwd');
    if (!isThisModule) return false;
    const st = (app.status || '').toUpperCase();
    const isFinished = 
      st.includes('RELEASED') || 
      st.includes('COMPLETED') || 
      st.includes('REJECTED') || 
      st.includes('DISAPPROVED');
    return !isFinished;
  });

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
              Your application for PWD Social Assistance Program has been successfully submitted and is currently pending review. Please wait for a Social Worker's assessment.
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
                onNavigateToModule('payout');
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Header & Navigation */}
      <div className="space-y-4">
        <h1 className={`text-xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          {isTagalog ? 'Serbisyo para sa PWD' : 'PWD Services'}
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
            <span>{isTagalog ? 'BUMALIK SA MGA SERBISYO NG PWD' : 'BACK TO PWD SERVICES'}</span>
          </button>
        </div>
      </div>

      {/* SINGLE UNIFIED MAIN CONTAINER CARD FOR ALL PWD CONTENT */}
      <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${cardClass}`}>
        {/* Stepper Progress Bar (4 Steps) */}
        <div className="pb-6 border-b border-slate-800/80 space-y-4">
          {/* Step Numbers Line */}
          <div className="relative flex justify-between items-center max-w-3xl mx-auto mb-2 px-4">
            <div className={`absolute top-1/2 left-8 right-8 h-0.5 -translate-y-1/2 z-0 ${
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
                        ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-500/20 scale-110'
                        : isPassed
                        ? 'bg-blue-600 text-white'
                        : darkMode
                        ? 'bg-slate-900 text-slate-500 border border-slate-800'
                        : 'bg-slate-100 text-slate-500 border border-slate-300'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-5 h-5 text-white" /> : stepNum}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Tab Buttons matching reference screenshot */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { step: 1, label: isTagalog ? 'KOMPLETONG TSEKLIST' : 'COMPLETE CHECKLIST' },
              { step: 2, label: isTagalog ? 'PERSONAL NA IMPORMASYON' : 'PERSONAL INFORMATION' },
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
                  className={`py-2.5 px-2 text-[11px] font-extrabold tracking-wider rounded-xl transition-all uppercase text-center border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md font-black'
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

        {/* STEP 1: SERVICE AND PRIMARY REQUIREMENTS (Matching Screenshots 1, 2, 3) */}
        {currentStep === 1 && (
          <div className="space-y-6 pt-2">
          <div>
            <h2 className={`text-xs font-extrabold tracking-wider uppercase mb-3 ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
              {isTagalog ? 'SERBISYO AT MGA UTANG NA KAILANGAN' : 'SERVICE AND PRIMARY REQUIREMENTS'}
            </h2>

            {/* Alert Banner */}
            <div className={bannerClass}>
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <h3 className={bannerTitleClass}>
                  {isTagalog ? 'Sektor ng PWD: Ang mga kwalipikadong benepisyaryo ay makatatanggap ng tulong.' : 'PWD Sector: Qualified beneficiaries may receive the assistance provided.'}
                </h3>
                <p className={bannerTextClass}>
                  {isTagalog
                    ? 'Eksklusibo para sa mga kapus-palad na Persons with Disabilities (PWD) na nakatutugon sa mga pamantayan sa kahinaan (hal. bedridden, malubhang kondisyon, solo parent, walang trabaho na may 2+ na dependents). Sakop ng opisyal na pagsusuri at Social Case Study bago aprubahan.'
                    : 'Exclusively for indigent Persons with Disabilities (PWD) who qualify under specific vulnerability categories (e.g., bedridden, severe medical condition, solo parent, jobless with 2+ minor dependents, living alone, or living with a Senior Citizen parent). Subject to official assessment and Social Case Study before approval.'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {/* PWD ID NUMBER with Prefix Box & Verify Button (Matching Screenshot 1 & 2) */}
            <div>
              <label className={labelClass}>
                {isTagalog ? 'NUMERO NG PWD ID' : 'PWD ID NUMBER'} <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className={`flex flex-1 items-center rounded-xl border overflow-hidden shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-600 ${
                  darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white'
                }`}>
                  <span className={`px-3.5 py-2.5 text-xs font-extrabold border-r select-none shrink-0 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-blue-400' : 'bg-slate-100 border-slate-300 text-blue-700'
                  }`}>
                    PWD-
                  </span>
                  <input
                    type="text"
                    value={pwdIdNumber}
                    onChange={(e) => setPwdIdNumber(e.target.value)}
                    placeholder="137404-2026-847708"
                    className={`w-full px-3.5 py-2.5 text-xs font-semibold outline-none border-none ${
                      darkMode ? 'bg-slate-900 text-white placeholder-slate-500' : 'bg-white text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleVerifyPwdId}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold tracking-wider uppercase border border-blue-500/40 shadow-sm transition-all shrink-0 cursor-pointer"
                >
                  {isTagalog ? 'I-VERIFY ANG PWD ID' : 'VERIFY PWD ID'}
                </button>
              </div>
            </div>

            {/* TYPE OF DISABILITY (Auto-filled upon PWD ID verification) */}
            <div>
              <label className={labelClass}>
                {isTagalog ? 'URI NG KAPANSANAN' : 'TYPE OF DISABILITY'} <span className="text-red-500">**</span>
              </label>
              <input
                type="text"
                value={typeOfDisability}
                readOnly
                placeholder={isTagalog ? "Kusang lalabas pagkatapos ma-verify ang PWD ID" : "Auto-filled upon PWD ID verification"}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border ${
                  darkMode ? 'bg-slate-900/60 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-800 shadow-sm'
                }`}
              />
            </div>

            {/* TYPE OF ASSISTANCE REQUESTED (SWA CATEGORY) (Matching Screenshot 3) */}
            <div>
              <label className={labelClass}>
                {isTagalog ? 'URI NG HINIHINGING TULONG (KATEGORYA NG SWA)' : 'TYPE OF ASSISTANCE REQUESTED (SWA CATEGORY)'} <span className="text-red-500">**</span>
              </label>
              <select
                value={swaCategory}
                onChange={(e) => setSwaCategory(e.target.value)}
                className={inputClass}
              >
                <option value="">{isTagalog ? 'Pumili...' : 'Select...'}</option>
                <option value="Bedridden">{isTagalog ? 'Nakatali sa Higaan (Bedridden)' : 'Bedridden'}</option>
                <option value="Severe Health Condition">{isTagalog ? 'Malubhang Kondisyon sa Kalusugan' : 'Severe Health Condition'}</option>
                <option value="Solo Parent">Solo Parent</option>
                <option value="Jobless with 2+ Minor Dependents">{isTagalog ? 'Walang Trabaho na may 2+ na Anak na Depende' : 'Jobless with 2+ Minor Dependents'}</option>
                <option value="Living Alone">{isTagalog ? 'Nang-iisang Namumuhay' : 'Living Alone'}</option>
                <option value="Living with Senior Citizen Parent">{isTagalog ? 'Kasama ang Magulang na Senior Citizen' : 'Living with Senior Citizen Parent'}</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={!pwdIdNumber || !swaCategory}
              onClick={() => handleNextStep(2)}
              className={`px-8 py-2.5 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all shadow-md ${
                pwdIdNumber && swaCategory
                  ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                  : darkMode
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
              }`}
            >
              {isTagalog ? 'KASUNOD' : 'NEXT'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PERSONAL INFORMATION & SECTIONS 1-6 (MATCHING SCREENSHOTS 1, 2, 3, 4) */}
      {currentStep === 2 && (
        <div className="space-y-6 pt-2">
          {/* Reminder Banner */}
          <div className={bannerClass}>
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h3 className={bannerTitleClass}>
                {isTagalog ? 'MAHALAGANG PAALALA' : 'IMPORTANT REMINDER'}
              </h3>
              <p className={bannerTextClass}>
                {isTagalog
                  ? 'Mangyaring siguraduhin na ang impormasyon sa inyong QCID ay tama at kumpleto. Kung may kulang o maling detalye, makipag-ugnayan sa QCID Team bago magpatuloy.'
                  : 'Please make sure the information on your QCID is correct and complete. If any detail is missing or incorrect, contact the QCID Team to update your QCID records before continuing your application. Accurate information is important for fast and smooth processing of your service.'}
              </p>
            </div>
          </div>

          {/* 1. PERSONAL INFORMATION (Prefilled & Disabled Verified Profile) */}
          <div className="space-y-4">
            <div>
              <h3 className={subHeaderClass}>
                {isTagalog ? '1. IMPORMASYON NG APLIKANTE' : '1. APPLICANT INFORMATION'}
              </h3>
              <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {isTagalog
                  ? 'Ang lahat ng patlang sa Impormasyon ng Aplikante ay read-only dahil napatunayan na ang mga ito mula sa inyong Profile.'
                  : 'All Applicant Information fields are disabled / read-only because they have been verified from your Citizen Profile.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div>
                <label className={labelClass}>{isTagalog ? 'Unang pangalan *' : 'First name *'}</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={firstName || 'JEFFERSON'}
                  className={`${inputClass} cursor-not-allowed select-none border-slate-700/50 opacity-90`}
                />
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Gitnang pangalan' : 'Middle name'}</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={middleName || 'FERNANDO'}
                  className={`${inputClass} cursor-not-allowed select-none border-slate-700/50 opacity-90`}
                />
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Apelyido *' : 'Last name *'}</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={lastName || 'LEE'}
                  className={`${inputClass} cursor-not-allowed select-none border-slate-700/50 opacity-90`}
                />
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Sufiks (Jr., Sr., III, atbp.)' : 'Suffix (Jr., Sr., III, etc.)'}</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  placeholder={isTagalog ? 'Sufiks (Jr., Sr., III, atbp.)' : 'Suffix (Jr., Sr., III, etc.)'}
                  value={suffix}
                  className={`${inputClass} cursor-not-allowed select-none border-slate-700/50 opacity-90`}
                />
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Nasyonalidad *' : 'Nationality *'}</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={nationality || 'FILIPINO'}
                  className={`${inputClass} cursor-not-allowed select-none border-slate-700/50 opacity-90`}
                />
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Petsa ng kapanganakan *' : 'Date of birth *'}</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value="27/09/2004"
                  className={`${inputClass} cursor-not-allowed select-none border-slate-700/50 opacity-90`}
                />
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Edad *' : 'Age *'}</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={age || '22'}
                  className={`${inputClass} cursor-not-allowed select-none border-slate-700/50 font-bold text-blue-400`}
                />
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Kasarian *' : 'Gender *'}</label>
                <select
                  disabled
                  value={gender || 'Male'}
                  className={`${inputClass} cursor-not-allowed select-none border-slate-700/50 opacity-90`}
                >
                  <option value="Male">{isTagalog ? 'Lalaki' : 'Male'}</option>
                  <option value="Female">{isTagalog ? 'Babae' : 'Female'}</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Katayuang sibil *' : 'Civil status *'}</label>
                <select
                  disabled
                  value={civilStatus || 'Single'}
                  className={`${inputClass} cursor-not-allowed select-none border-slate-700/50 opacity-90`}
                >
                  <option value="Single">{isTagalog ? 'Walang asawa (Single)' : 'Single'}</option>
                  <option value="Married">{isTagalog ? 'May asawa (Married)' : 'Married'}</option>
                  <option value="Widowed">{isTagalog ? 'Biyudo / Biyuda (Widowed)' : 'Widowed'}</option>
                  <option value="Separated">{isTagalog ? 'Hiwalay (Separated)' : 'Separated'}</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Numero ng Bahay/Gusali *' : 'House/Building number *'}</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={houseNo || '176'}
                  className={`${inputClass} cursor-not-allowed select-none border-slate-700/50 opacity-90`}
                />
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Pangalan ng Kalsada *' : 'Street name *'}</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={street || '23'}
                  className={`${inputClass} cursor-not-allowed select-none border-slate-700/50 opacity-90`}
                />
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Barangay *' : 'Barangay *'}</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={barangay || 'Bagong Silangan'}
                  className={`${inputClass} cursor-not-allowed select-none border-slate-700/50 opacity-90`}
                />
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Numero ng Telepono *' : 'Phone number *'}</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={phone || '09155582122'}
                  className={`${inputClass} cursor-not-allowed select-none border-slate-700/50 opacity-90`}
                />
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Umiiral na Numero ng PWD ID *' : 'Existing PWD ID Number *'}</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={pwdIdNumber ? (pwdIdNumber.startsWith('PWD-') ? pwdIdNumber : `PWD-${pwdIdNumber}`) : 'PWD-13-7404-000-0012345'}
                  className={`${inputClass} cursor-not-allowed select-none border-slate-700/50 opacity-90 font-mono`}
                />
              </div>
            </div>
          </div>

          {/* 2. OCCUPATION / EMPLOYMENT */}
          <div className="space-y-4 pt-4 border-t border-slate-700/40">
            <div>
              <h3 className={subHeaderClass}>
                {isTagalog ? '2. TRABAHO / EMPLEYO' : '2. OCCUPATION / EMPLOYMENT'}
              </h3>
              <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {isTagalog ? 'Impormasyon sa kasalukuyang katayuan sa trabaho at kita ng sambahayan' : 'Information regarding current employment status and household income'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{isTagalog ? 'Katayuan sa Trabaho *' : 'Employment Status *'}</label>
                <select
                  value={employmentStatus}
                  onChange={(e) => setEmploymentStatus(e.target.value)}
                  className={inputClass}
                >
                  <option value="Unemployed / Jobless">{isTagalog ? 'Walang Trabaho (Unemployed)' : 'Unemployed / Jobless'}</option>
                  <option value="Employed (Private)">{isTagalog ? 'Nagtatrabaho (Pribado)' : 'Employed (Private)'}</option>
                  <option value="Employed (Government)">{isTagalog ? 'Nagtatrabaho (Gobyerno)' : 'Employed (Government)'}</option>
                  <option value="Self-Employed / Freelance">{isTagalog ? 'Sariling Sikap / Freelance' : 'Self-Employed / Freelance'}</option>
                  <option value="Student">{isTagalog ? 'Estudyante' : 'Student'}</option>
                  <option value="Retired">{isTagalog ? 'Pansiyonado / Retired' : 'Retired'}</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Trabaho / Propesyon' : 'Occupation'}</label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder={isTagalog ? "hal. Tindero, Kasambahay, N/A" : "e.g. Helper, Vendor, N/A"}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Pinagmumulan ng Kita' : 'Source of Income'}</label>
                <input
                  type="text"
                  value={sourceOfIncome}
                  onChange={(e) => setSourceOfIncome(e.target.value)}
                  placeholder={isTagalog ? "hal. Tulong ng Pamilya, Remittance, Allowance, Wala" : "e.g. Family Support, Remittance, Allowance, None"}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Tinatayang Buwanang Kita *' : 'Approximate Monthly Income *'}</label>
                <select
                  value={approxMonthlyIncome}
                  onChange={(e) => setApproxMonthlyIncome(e.target.value)}
                  className={inputClass}
                >
                  <option value="No Regular Income">{isTagalog ? 'Walang Regular na Kita' : 'No Regular Income'}</option>
                  <option value="Below ₱10,000">{isTagalog ? 'Mabababa sa ₱10,000' : 'Below ₱10,000'}</option>
                  <option value="₱10,000 - ₱15,000">₱10,000 - ₱15,000</option>
                  <option value="₱15,000 - ₱20,000">₱15,000 - ₱20,000</option>
                  <option value="Above ₱20,000">{isTagalog ? 'Higit sa ₱20,000' : 'Above ₱20,000'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. EDUCATIONAL BACKGROUND */}
          <div className="space-y-4 pt-4 border-t border-slate-700/40">
            <div>
              <h3 className={subHeaderClass}>
                {isTagalog ? '3. PINAG-ARALAN' : '3. EDUCATIONAL BACKGROUND'}
              </h3>
              <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {isTagalog ? 'Antas ng pinag-aralan ng aplikante' : 'Educational attainment of the applicant'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{isTagalog ? 'Pinakamataas na Pinag-aralan *' : 'Highest Educational Attainment *'}</label>
                <select
                  value={highestEducation}
                  onChange={(e) => setHighestEducation(e.target.value)}
                  className={inputClass}
                >
                  <option value="">{isTagalog ? 'Pumili...' : 'Select...'}</option>
                  <option value="Elementary Level">{isTagalog ? 'Naka-elementarya' : 'Elementary Level'}</option>
                  <option value="Elementary Graduate">{isTagalog ? 'Nagtapos ng Elementarya' : 'Elementary Graduate'}</option>
                  <option value="High School Level">{isTagalog ? 'Naka-High School' : 'High School Level'}</option>
                  <option value="High School Graduate">{isTagalog ? 'Nagtapos ng High School' : 'High School Graduate'}</option>
                  <option value="Vocational / SPED">{isTagalog ? 'Bokasyonal / SPED' : 'Vocational / SPED'}</option>
                  <option value="College Level">{isTagalog ? 'Naka-Kolehiyo' : 'College Level'}</option>
                  <option value="College Graduate">{isTagalog ? 'Nagtapos ng Kolehiyo' : 'College Graduate'}</option>
                  <option value="Post Graduate">{isTagalog ? 'Post Graduate' : 'Post Graduate'}</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Iba pang Impormasyon sa Pag-aaral' : 'Other Relevant Education Information'}</label>
                <input
                  type="text"
                  value={otherEducationInfo}
                  onChange={(e) => setOtherEducationInfo(e.target.value)}
                  placeholder={isTagalog ? "hal. SPED, Vocational Training, o Wala" : "e.g. SPED, Vocational Training, or None"}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* 4. FAMILY COMPOSITION */}
          <div className="space-y-4 pt-4 border-t border-slate-700/40">
            <div className="flex justify-between items-center">
              <div>
                <h3 className={subHeaderClass}>
                  {isTagalog ? '4. MGA KASAMA SA PAMILYA' : '4. FAMILY COMPOSITION'}
                </h3>
                <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isTagalog ? 'Upang matukoy ang mga miyembro ng pamilya na kasama at nakadepende sa aplikante' : 'To identify family members living with and dependent on the applicant'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddFamilyMember}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>{isTagalog ? '+ Magdagdag ng Miyembro' : '+ Add Family Member'}</span>
              </button>
            </div>

            {familyMembers.length === 0 ? (
              <div className={`p-6 border-2 border-dashed rounded-2xl text-center space-y-3 ${
                darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isTagalog ? 'Walang nakalaang miyembro ng pamilya. Kung nag-iisa sa buhay, maaari itong iwang bakante o i-click ang button sa ibaba.' : 'No family members listed. If living alone, you may leave this blank or click the button below to add family members.'}
                </p>
                <button
                  type="button"
                  onClick={handleAddFamilyMember}
                  className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold border border-blue-500/30 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{isTagalog ? '+ Magdagdag ng Miyembro' : '+ Add Family Member'}</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b font-bold ${
                      darkMode ? 'border-slate-800 text-slate-400 bg-slate-900/80' : 'border-slate-200 text-slate-600 bg-slate-100'
                    }`}>
                      <th className="py-2.5 px-3 min-w-[150px]">{isTagalog ? 'Pangalan *' : 'Name *'}</th>
                      <th className="py-2.5 px-3 min-w-[120px]">{isTagalog ? 'Relasyon' : 'Relationship'}</th>
                      <th className="py-2.5 px-3 w-[80px]">{isTagalog ? 'Edad' : 'Age'}</th>
                      <th className="py-2.5 px-3 min-w-[130px]">{isTagalog ? 'Trabaho / Katayuan' : 'Occupation / Status'}</th>
                      <th className="py-2.5 px-3 text-right w-[60px]">{isTagalog ? 'Aksyon' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
                    {familyMembers.map((m) => (
                      <tr key={m.id} className="font-medium">
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={m.name}
                            onChange={(e) => updateFamilyMember(m.id, 'name', e.target.value)}
                            placeholder={isTagalog ? "Buong pangalan" : "Full name"}
                            className={inputClass}
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={m.rel}
                            onChange={(e) => updateFamilyMember(m.id, 'rel', e.target.value)}
                            placeholder={isTagalog ? "Anak / Asawa" : "Son / Daughter / Spouse"}
                            className={inputClass}
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={m.age}
                            onChange={(e) => updateFamilyMember(m.id, 'age', e.target.value.replace(/\D/g, '').slice(0, 2))}
                            maxLength={2}
                            placeholder={isTagalog ? "Edad" : "Age"}
                            className={inputClass}
                          />
                        </td>
                        <td className="py-2 px-2 space-y-1">
                          <select
                            value={['Unemployed', 'Employed', 'Self-Employed', 'Student', 'Retired', 'Housewife / Househusband', 'None / N/A'].includes(m.occ) ? m.occ : (m.occ ? 'Other' : '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'Other') {
                                updateFamilyMember(m.id, 'occ', 'Other');
                              } else {
                                updateFamilyMember(m.id, 'occ', val);
                              }
                            }}
                            className={inputClass}
                          >
                            <option value="">{isTagalog ? 'Pumili ng Trabaho / Katayuan' : 'Select Occupation / Status'}</option>
                            <option value="Unemployed">{isTagalog ? 'Walang Trabaho' : 'Unemployed'}</option>
                            <option value="Employed">{isTagalog ? 'May Trabaho' : 'Employed'}</option>
                            <option value="Self-Employed">{isTagalog ? 'Sariling Sikap' : 'Self-Employed'}</option>
                            <option value="Student">{isTagalog ? 'Estudyante' : 'Student'}</option>
                            <option value="Retired">{isTagalog ? 'Pansiyonado' : 'Retired'}</option>
                            <option value="Housewife / Househusband">{isTagalog ? 'May-bahay' : 'Housewife / Househusband'}</option>
                            <option value="None / N/A">{isTagalog ? 'Wala / N/A' : 'None / N/A'}</option>
                            <option value="Other">{isTagalog ? 'Iba pa (Tukuyin)' : 'Other (Specify)'}</option>
                          </select>
                          {(!['Unemployed', 'Employed', 'Self-Employed', 'Student', 'Retired', 'Housewife / Househusband', 'None / N/A'].includes(m.occ) && m.occ !== '') && (
                            <input
                              type="text"
                              value={m.occ === 'Other' ? '' : m.occ}
                              onChange={(e) => updateFamilyMember(m.id, 'occ', e.target.value || 'Other')}
                              placeholder={isTagalog ? "Tukuyin ang trabaho..." : "Specify occupation..."}
                              className={inputClass}
                            />
                          )}
                        </td>
                        <td className="py-2 px-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveFamilyMember(m.id)}
                            className="text-rose-500 hover:text-rose-400 p-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/10 transition-colors"
                            title={isTagalog ? "Alisin ang Miyembro" : "Remove Member"}
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

          {/* 5. ESTIMATE MONTHLY EXPENSES */}
          <div className="space-y-4 pt-4 border-t border-slate-700/40">
            <div>
              <h3 className={subHeaderClass}>
                {isTagalog ? '5. TINATAYANG BUWANANG GASTUSIN' : '5. ESTIMATE MONTHLY EXPENSES'}
              </h3>
              <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {isTagalog ? 'Tinatayang kabuuang buwanang gastusin sa bahay' : 'Estimated total monthly household expenses'}
              </p>
            </div>

            <div className="max-w-md">
              <label className={labelClass}>{isTagalog ? 'Tinatayang Buwanang Gastusin (₱) *' : 'Estimated Monthly Expenses (P) *'}</label>
              <div className={`flex items-center rounded-xl border overflow-hidden shadow-sm ${
                darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
              }`}>
                <span className={`px-3.5 py-2.5 text-xs font-extrabold select-none border-r ${
                  darkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}>
                  ₱
                </span>
                <input
                  type="text"
                  value={monthlyExpenses}
                  onChange={(e) => setMonthlyExpenses(e.target.value)}
                  placeholder="5000"
                  className={`w-full px-3.5 py-2.5 text-xs font-semibold outline-none border-none ${
                    darkMode ? 'bg-slate-900 text-white placeholder-slate-500' : 'bg-white text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
              <p className={`text-[11px] mt-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {isTagalog ? 'Kabuuang gastos sa kuryente, tubig, pagkain, gamot, atbp. (Numero lamang)' : 'Total monthly expenses for utilities, food, medicine, etc. (Number only, up to 5 digits only)'}
              </p>
            </div>
          </div>

          {/* 6. ADDITIONAL INFORMATION & SWA CATEGORY (AUTO-FILLED FROM STEP 1) */}
          <div className="space-y-4 pt-4 border-t border-slate-700/40">
            <div>
              <h3 className={subHeaderClass}>
                {isTagalog ? '6. KARAGDAGANG IMPORMASYON AT KATEGORYA NG SWA' : '6. ADDITIONAL INFORMATION & SWA CATEGORY'}
              </h3>
              <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {isTagalog ? 'Impormasyon para sa pagsusuri ng Social Worker at dahilan ng paghingi ng tulong' : 'Information needed to assess the applicant and reason for requesting assistance'}
              </p>
            </div>

            {/* QUALIFYING CATEGORY (PWD SWA) - AUTO-FILLED INPUT FROM STEP 1 */}
            <div className="space-y-2">
              <label className={labelClass}>
                {isTagalog ? 'KWALIPIKADONG KATEGORYA (PWD SWA) *' : 'QUALIFYING CATEGORY (PWD SWA) *'}
              </label>

              <input
                type="text"
                value={swaCategory || ''}
                readOnly
                placeholder={isTagalog ? "Kusang lalabas mula sa Hakbang 1" : "Auto-filled upon selecting SWA Category in Step 1"}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border select-none ${
                  darkMode 
                    ? 'bg-slate-900/90 border-slate-700 text-blue-400 cursor-not-allowed' 
                    : 'bg-slate-100 border-slate-300 text-blue-700 cursor-not-allowed shadow-sm'
                }`}
              />
            </div>

            {/* Reason for Assistance / Assessment Details */}
            <div className="space-y-2 pt-2">
              <label className={labelClass}>
                {isTagalog ? 'Dahilan ng Paghingi ng Tulong / Detalye ng Pagsusuri *' : 'Reason for Assistance / Assessment Details *'}
              </label>
              <textarea
                rows={3}
                value={reasonForAssistance}
                onChange={(e) => setReasonForAssistance(e.target.value)}
                placeholder={isTagalog ? "hal. Nangangailangan ng tulong pambili ng gamot at pang-araw-araw na gastusin dahil sa kawalan ng regular na kita..." : "e.g. In need of monthly assistance for medicine and basic living expenses due to lack of steady income..."}
                className={`w-full p-3.5 rounded-xl text-xs font-medium border outline-none transition-all ${
                  darkMode
                    ? 'bg-slate-900/90 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white shadow-sm'
                }`}
              />
              <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {isTagalog ? 'Ipaliwanag kung bakit nangangailangan ng tulong ang aplikante para sa pagsusuri ng Social Worker.' : 'Explain why the applicant needs assistance and any other relevant case details for the Social Worker\'s assessment.'}
              </p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={backBtnClass}
            >
              {isTagalog ? 'BUMALIK' : 'BACK'}
            </button>

            <button
              type="button"
              onClick={() => handleNextStep(3)}
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold tracking-wider uppercase shadow-lg transition-all"
            >
              {isTagalog ? 'KASUNOD' : 'NEXT'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: UPLOAD DOCUMENTS */}
      {currentStep === 3 && (
        <div className="space-y-6 pt-2">
          <div className="space-y-6">
            {[
              {
                key: 'indigency',
                title: isTagalog ? 'SERTIPIKASYON NG INDIGENCY MULA SA BARANGAY *' : 'BARANGAY CERTIFICATE OF INDIGENCY *',
                desc: isTagalog ? 'Ibinigay sa loob ng huling 6 na buwan, na may layuning "Para sa Social Welfare Assistance."' : 'Issued within 6 months, with purpose: "For Social Welfare Assistance."',
                doc: docIndigency,
                setDoc: setDocIndigency,
              },
              {
                key: 'medical',
                title: isTagalog ? 'SERTIPIKADONG MEDIKAL *' : 'MEDICAL CERTIFICATE *',
                desc: isTagalog ? 'Sertipikadong Medikal / Clinical Abstract mula sa lisensyadong doktor o ospital na nagpapatunay ng kondisyon.' : 'Medical Certificate / Clinical Abstract from a licensed physician or hospital certifying the medical condition or disability.',
                doc: docMedical,
                setDoc: setDocMedical,
              },
              {
                key: 'pwd',
                title: isTagalog ? 'QC PWD ID / ANUMANG KILALANG IDENTIPIKASYON *' : 'QC PWD ID / APPLICABLE IDENTIFICATION *',
                desc: isTagalog ? 'Malinaw na larawan ng iyong QCitizen PWD ID o anumang valid ID (harap at likod).' : 'Clear photo of your QCitizen PWD ID or any applicable identification card (front and back).',
                doc: docPwdId,
                setDoc: setDocPwdId,
              },
              {
                key: 'residency',
                title: isTagalog ? 'KAILANGANG LITRATO / DOKUMENTASYON DIPENDE SA KAPANSANAN *' : 'REQUIRED PHOTO / DOCUMENTATION DEPENDING ON DISABILITY *',
                desc: isTagalog ? 'Litrato/Dokumento depende sa disability (e.g., buong katawan na may kalendaryo para sa bedridden, Solo Parent ID/Cert, o patunay ng kahinaan).' : 'Litrato/Dokumento depende sa disability (e.g., whole-body photo with calendar for bedridden beneficiaries, Solo Parent ID/Cert, or proof of vulnerability).',
                alert: isTagalog ? 'Kung bedridden: Buong larawan ng katawan na may kalendaryo na nagpapakita ng kasalukuyang petsa.' : 'If bedridden: Whole-body photo with a calendar showing the current date.',
                doc: docResidency,
                setDoc: setDocResidency,
              },
            ].map((item) => (
              <div
                key={item.key}
                className={`p-5 rounded-2xl border transition-all ${
                  darkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-50/80 border-slate-200'
                }`}
              >
                <div>
                  <h4 className="text-xs font-extrabold tracking-wide uppercase text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {item.desc}
                  </p>

                  {item.alert && (
                    <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-semibold text-amber-800 dark:text-amber-300">
                      {item.alert}
                    </div>
                  )}

                  <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-3">
                    {isTagalog ? 'Pinapayagang uri ng file: JPG, JPEG, PNG, WEBP (o kumuha gamit ang Kamera)' : 'Allowed file types: JPG, JPEG, PNG, WEBP (or capture using Camera)'}
                  </p>

                  {item.doc && (
                    <div className="mt-3">
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
                          title={isTagalog ? "Alisin ang larawan" : "Remove photo"}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        {/* Square Thumbnail Image */}
                        <div className={`w-20 h-20 rounded-xl overflow-hidden border shrink-0 relative ${
                          darkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-100'
                        }`}>
                          <img
                            src={item.doc.url || 'https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?w=500&auto=format&fit=crop&q=80'}
                            alt={item.doc.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>

                        {/* Truncated Filename */}
                        <span className={`text-[10px] font-bold text-center truncate max-w-full mt-2 block px-1 group-hover:text-blue-400 ${
                          darkMode ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          {item.doc.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <label className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all shadow-sm uppercase tracking-wider">
                    <Upload className="w-4 h-4" />
                    <span>{isTagalog ? 'MAG-UPLOAD NG LITRATO' : 'UPLOAD PHOTO'}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const reader = new FileReader();
                          reader.onload = () => {
                            const base64Url = reader.result as string;
                            item.setDoc({ name: file.name, url: base64Url });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => openCameraModal(item.key)}
                    className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-extrabold flex items-center gap-2 transition-all shadow-sm uppercase tracking-wider"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isTagalog ? 'KUMUHA NG LITRATO (KAMERA)' : 'TAKE PHOTO (CAMERA)'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={backBtnClass}
            >
              {isTagalog ? 'BUMALIK' : 'BACK'}
            </button>

            <button
              type="button"
              onClick={() => handleNextStep(4)}
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold tracking-wider uppercase shadow-lg transition-all"
            >
              {isTagalog ? 'KASUNOD' : 'NEXT'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & SUBMIT */}
      {currentStep === 4 && (
        <div className="space-y-6 pt-2">
          <div className="space-y-1 mb-4">
            <h3 className={`text-base sm:text-lg font-extrabold tracking-wide uppercase ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {isTagalog ? 'SURIIN ANG IYONG APLIKASYON' : 'REVIEW YOUR APPLICATION'}
            </h3>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {isTagalog ? 'Mangyaring suriin nang mabuti ang lahat ng impormasyon bago ipasa ang aplikasyon. Maaari mong baguhin ang anumang bahagi sa pag-click ng "Baguhin".' : 'Please review all information carefully before submitting your application. You can edit any section by clicking the edit button.'}
            </p>
          </div>

          <div className="space-y-4">
            {/* 1. PWD & Assistance Category Section Card */}
            <div className={`border rounded-2xl overflow-hidden ${darkMode ? 'bg-[#0e1933]/60 border-slate-800' : 'bg-slate-50/80 border-slate-200 shadow-sm'}`}>
              <div className={`p-4 flex items-center justify-between border-b ${darkMode ? 'bg-[#101c38] border-slate-800/80' : 'bg-slate-100 border-slate-200'}`}>
                <div className="flex items-center gap-2">
                  <ChevronUp className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                  <h4 className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {isTagalog ? 'Kategorya ng PWD at Tulong' : 'PWD & Assistance Category'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => handleEditStepFromReview(1)}
                  className="text-xs font-extrabold text-blue-500 hover:text-blue-400 flex items-center gap-1.5 transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>{isTagalog ? 'BAGUHIN' : 'EDIT'}</span>
                </button>
              </div>
              <div className="p-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-3 gap-x-6">
                  <div>
                    <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isTagalog ? 'NUMERO NG PWD ID' : 'PWD ID NUMBER'}
                    </span>
                    <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{pwdIdNumber ? `PWD-${pwdIdNumber}` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isTagalog ? 'URI NG KAPANSANAN' : 'TYPE OF DISABILITY'}
                    </span>
                    <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{typeOfDisability || (isTagalog ? 'Kusang lalabas' : 'Auto-filled upon PWD ID verification')}</span>
                  </div>
                  <div>
                    <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isTagalog ? 'HINIHINGING KATEGORYA' : 'CATEGORY REQUESTED'}
                    </span>
                    <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{swaCategory || 'Bedridden'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Personal Information Section Card */}
            <div className={`border rounded-2xl overflow-hidden ${darkMode ? 'bg-[#0e1933]/60 border-slate-800' : 'bg-slate-50/80 border-slate-200 shadow-sm'}`}>
              <div className={`p-4 flex items-center justify-between border-b ${darkMode ? 'bg-[#101c38] border-slate-800/80' : 'bg-slate-100 border-slate-200'}`}>
                <div className="flex items-center gap-2">
                  <ChevronUp className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                  <h4 className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {isTagalog ? 'Personal na Impormasyon' : 'Personal information'}
                  </h4>
                </div>
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
                {/* Section 1: Primary Personal Information */}
                <div>
                  <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-3 pb-1 border-b ${darkMode ? 'text-blue-400 border-slate-800' : 'text-blue-600 border-slate-200'}`}>
                    {isTagalog ? 'PERSONAL NA IMPORMASYON' : 'PERSONAL INFORMATION'}
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'UNANG PANGALAN' : 'FIRST NAME'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{firstName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'GITNANG PANGALAN' : 'MIDDLE NAME'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{middleName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'APELYIDO' : 'LAST NAME'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{lastName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'SUFIKS' : 'SUFFIX'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{suffix || (isTagalog ? 'Wala' : 'None')}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'NASYONALIDAD' : 'NATIONALITY'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{nationality || 'FILIPINO'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'PETSA NG KAPANGANAKAN / EDAD' : 'DATE OF BIRTH / AGE'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{dob || 'N/A'} ({age ? `${age} ${isTagalog ? 'taon' : 'yrs'}` : 'N/A'})</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'KASARIAN' : 'GENDER / SEX'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{gender || 'Male'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'KATAYUANG SIBIL' : 'CIVIL STATUS'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{civilStatus || 'Single'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'NUMERO NG BAHAY AT KALSADA' : 'HOUSE / BUILDING NO. & STREET'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{houseNo || 'N/A'} {street}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'BARANGAY' : 'BARANGAY'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{barangay || 'N/A'}, Quezon City</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'NUMERO NG TELEPONO' : 'CONTACT / PHONE NUMBER'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'NAKATALA NA EMAIL ADDRESS' : 'REGISTERED EMAIL ADDRESS'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{email || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Occupation / Employment */}
                <div>
                  <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-3 pb-1 border-b ${darkMode ? 'text-blue-400 border-slate-800' : 'text-blue-600 border-slate-200'}`}>
                    {isTagalog ? 'TRABAHO / EMPLEYO' : 'OCCUPATION / EMPLOYMENT'}
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'KATAYUAN SA TRABAHO' : 'EMPLOYMENT STATUS'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{employmentStatus || 'Unemployed / Jobless'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'TRABAHO / PROPESYON' : 'OCCUPATION'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{occupation || 'N/A'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'PINAGMUMULAN NG KITA' : 'SOURCE OF INCOME'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{sourceOfIncome || 'N/A'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'TINATAYANG BUWANANG KITA' : 'APPROXIMATE MONTHLY INCOME'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{approxMonthlyIncome || 'No Regular Income'}</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Educational Background */}
                <div>
                  <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-3 pb-1 border-b ${darkMode ? 'text-blue-400 border-slate-800' : 'text-blue-600 border-slate-200'}`}>
                    {isTagalog ? 'PINAG-ARALAN' : 'EDUCATIONAL BACKGROUND'}
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'PINAKAMATAAS NA PINAG-ARALAN' : 'HIGHEST EDUCATIONAL ATTAINMENT'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{highestEducation || 'N/A'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'IBA PANG IMPORMASYON SA PAG-AARAL' : 'OTHER EDUCATION INFO'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{otherEducationInfo || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Section 4: Family Composition */}
                <div>
                  <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-3 pb-1 border-b ${darkMode ? 'text-blue-400 border-slate-800' : 'text-blue-600 border-slate-200'}`}>
                    {isTagalog ? 'MGA KASAMA SA PAMILYA' : 'FAMILY COMPOSITION'}
                  </h5>
                  {familyMembers.length > 0 ? (
                    <div className="space-y-2">
                      {familyMembers.map((m, idx) => (
                        <div key={m.id || idx} className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                          darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
                        }`}>
                          <div>
                            <span className={`font-bold block ${darkMode ? 'text-white' : 'text-slate-900'}`}>{m.name}</span>
                            <span className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              Rel: {m.rel} | {isTagalog ? 'Edad' : 'Age'}: {m.age} {isTagalog ? 'taon' : 'yrs'} | Trabaho: {m.occ}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-xs italic ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'Walang nakatalang miyembro ng pamilya.' : 'No family members listed.'}</p>
                  )}
                </div>

                {/* Section 5: Monthly Expenses */}
                <div>
                  <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-3 pb-1 border-b ${darkMode ? 'text-blue-400 border-slate-800' : 'text-blue-600 border-slate-200'}`}>
                    {isTagalog ? 'BUWANANG GASTUSIN' : 'MONTHLY EXPENSES'}
                  </h5>
                  <div className="text-xs">
                    <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'TINATAYANG BUWANANG GASTUSIN' : 'ESTIMATED MONTHLY EXPENSES'}</span>
                    <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {monthlyExpenses ? (monthlyExpenses.startsWith('₱') ? monthlyExpenses : `₱${!isNaN(Number(monthlyExpenses)) ? Number(monthlyExpenses).toLocaleString('en-US') : monthlyExpenses}`) : (isTagalog ? 'Hindi Tinukoy' : 'Not Specified')}
                    </span>
                  </div>
                </div>

                {/* Section 6: Additional Information & SWA Category */}
                <div>
                  <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-3 pb-1 border-b ${darkMode ? 'text-blue-400 border-slate-800' : 'text-blue-600 border-slate-200'}`}>
                    {isTagalog ? 'KARAGDAGANG IMPORMASYON AT KATEGORYA NG SWA' : 'ADDITIONAL INFORMATION & SWA CATEGORY'}
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'KWALIPIKADONG KATEGORYA (PWD SWA)' : 'QUALIFYING CATEGORY (PWD SWA)'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{swaCategory || 'N/A'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'DAHILAN NG PAGHINGI NG TULONG' : 'REASON FOR ASSISTANCE / ASSESSMENT'}</span>
                      <span className={`font-bold leading-relaxed ${darkMode ? 'text-white' : 'text-slate-900'}`}>{reasonForAssistance || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Required Documents Section Card */}
            <div className={`border rounded-2xl overflow-hidden ${darkMode ? 'bg-[#0e1933]/60 border-slate-800' : 'bg-slate-50/80 border-slate-200 shadow-sm'}`}>
              <div className={`p-4 flex items-center justify-between border-b ${darkMode ? 'bg-[#101c38] border-slate-800/80' : 'bg-slate-100 border-slate-200'}`}>
                <div className="flex items-center gap-2">
                  <ChevronUp className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                  <h4 className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {isTagalog ? 'Mga kailangang dokumento' : 'Required documents'}
                  </h4>
                </div>
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
                  { key: 'indigency', title: isTagalog ? 'SERTIPIKASYON NG INDIGENCY MULA SA BARANGAY *' : 'BARANGAY CERTIFICATE OF INDIGENCY *', doc: docIndigency },
                  { key: 'medical', title: isTagalog ? 'SERTIPIKADONG MEDIKAL *' : 'MEDICAL CERTIFICATE *', doc: docMedical },
                  { key: 'pwd', title: isTagalog ? 'QC PWD ID / ANUMANG KILALANG IDENTIPIKASYON *' : 'QC PWD ID / APPLICABLE IDENTIFICATION *', doc: docPwdId },
                  { key: 'residency', title: isTagalog ? 'KAILANGANG LITRATO / DOKUMENTASYON DIPENDE SA KAPANSANAN *' : 'REQUIRED PHOTO / DOCUMENTATION DEPENDING ON DISABILITY *', doc: docResidency },
                ].map((item) => {
                  return (
                    <div key={item.key} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-extrabold uppercase tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {item.title}
                        </span>
                        {item.doc && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                      {item.doc ? (
                        <div className="pt-1">
                          <div 
                            className={`w-36 border rounded-2xl p-2.5 flex flex-col items-center shadow-lg group transition-all ${
                              darkMode ? 'bg-[#091124] border-slate-700/90' : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className={`w-20 h-20 rounded-xl overflow-hidden border shrink-0 ${
                              darkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-100'
                            }`}>
                              <img
                                src={item.doc.url || 'https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?w=500&auto=format&fit=crop&q=80'}
                                alt={item.doc.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <span className={`text-[10px] font-bold text-center truncate max-w-full mt-2 block px-1 group-hover:text-blue-400 ${
                              darkMode ? 'text-slate-200' : 'text-slate-800'
                            }`}>
                              {item.doc.name}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-0.5">
                          <span className={`text-xs italic ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            {isTagalog ? 'Walang na-upload na larawan' : 'No photo uploaded'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className={`pt-6 border-t flex justify-between ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className={backBtnClass}
            >
              {isTagalog ? 'BUMALIK' : 'BACK'}
            </button>

            <button
              type="button"
              onClick={handleSubmitApplication}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all shadow-lg shadow-blue-600/30"
            >
              {isTagalog ? 'IPASA' : 'SUBMIT'}
            </button>
          </div>
        </div>
      )}
      </div>



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



      {/* Requirements Modal Overlay */}
      {showReqModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-xl w-full rounded-2xl border p-6 space-y-4 shadow-2xl ${
            darkMode ? 'bg-[#0f1b35] border-blue-900/60 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex justify-between items-center border-b pb-3 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <h3 className="text-sm font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                PWD Social Assistance Requirements
              </h3>
              <button type="button" onClick={() => setShowReqModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`space-y-3 text-xs max-h-96 overflow-y-auto pr-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <p><strong>Primary Qualification:</strong> Duly registered Person with Disability (PWD) residing in Quezon City qualifying under specific vulnerability categories.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Valid Quezon City PWD ID Card</li>
                <li>Barangay Certificate of Indigency (issued within last 6 months)</li>
                <li>Medical Certificate or Social Case Study Report</li>
                <li>Valid Government Photo ID or Proof of Residency</li>
              </ul>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowReqModal(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Family Member Modal */}

    </div>
  );
};
