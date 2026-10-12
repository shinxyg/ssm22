import React, { useState, useRef } from 'react';
import { API_BASE_URL } from '../../config/api';
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle2, 
  Upload, 
  ChevronRight, 
  ShieldCheck, 
  AlertCircle,
  Building2,
  Briefcase,
  QrCode,
  Download,
  Info,
  X,
  Camera,
  Pencil,
  ArrowRight,
  ChevronUp,
  UserCheck,
  FileCheck,
  Package,
  Trash2
} from 'lucide-react';
import type { ApplicationRecord } from '../../types';

interface LivelihoodProgramViewProps {
  onBack?: () => void;
  onAddApplication?: (app: ApplicationRecord) => void;
  darkMode?: boolean;
  onNavigateToModule?: (tab: string) => void;
  applications?: ApplicationRecord[];
}

export const LivelihoodProgramView: React.FC<LivelihoodProgramViewProps> = ({ 
  onBack, 
  onAddApplication, 
  darkMode = true,
  onNavigateToModule,
  applications
}) => {
  // State to toggle between 1 Livelihood Module Card (false) and 4-Step Application Form (true)
  const [isApplying, setIsApplying] = useState<boolean>(false);
  // Stepper state (1: COMPLETE CHECKLIST, 2: APPLICATION FORM, 3: UPLOAD DOCUMENTS, 4: REVIEW & SUBMIT)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isEditingFromStep4, setIsEditingFromStep4] = useState<boolean>(false);

  // Step 1 Form States — Pre-Qualification Checklist & Sector Verification
  const [isResident, setIsResident] = useState<boolean>(true);
  const [isApplyingForLivelihood, setIsApplyingForLivelihood] = useState<boolean>(true);
  const [isBeneficiaryInNeed, setIsBeneficiaryInNeed] = useState<boolean>(true);

  const [sectorClassification, setSectorClassification] = useState<string>('');
  const [employmentStatus, setEmploymentStatus] = useState<string>('');
  const [existingBusiness, setExistingBusiness] = useState<string>('');

  const [servicesRequested, setServicesRequested] = useState<string[]>([
    'Micro-Enterprise Assistance',
    'Livelihood Capital Grant'
  ]);

  // Step 2 Form States — Verified QCitizen Profile Data
  const [qcId, setQcId] = useState<string>('110000262304143');
  const [firstName, setFirstName] = useState<string>('JEFFERSON');
  const [middleName, setMiddleName] = useState<string>('FERNANDO');
  const [lastName, setLastName] = useState<string>('LEE');
  const [suffix, setSuffix] = useState<string>('');
  const [nationality, setNationality] = useState<string>('FILIPINO');
  const [dob, setDob] = useState<string>('SEPTEMBER 27, 2004');
  const [age, setAge] = useState<string>('22');
  const [gender, setGender] = useState<string>('Male');
  const [civilStatus, setCivilStatus] = useState<string>('Single');
  const [bloodType, setBloodType] = useState<string>('O+');
  const [houseNo, setHouseNo] = useState<string>('176');
  const [street, setStreet] = useState<string>('23');
  const [barangay, setBarangay] = useState<string>('Bagong Silangan');
  const [phone, setPhone] = useState<string>('09155582122');
  const [email, setEmail] = useState<string>('jeffersonlee1234@gmail.com');

  // Step 1 Form States — Existing Business Type & Spec
  const [typeOfBusiness, setTypeOfBusiness] = useState<string>('');
  const [otherBusinessSpecification, setOtherBusinessSpecification] = useState<string>('');

  // Step 2 Form States — Assistance Needed & Reason & Dynamic Materials List
  const [assistanceNeeded, setAssistanceNeeded] = useState<string>('');
  const [reasonPurpose, setReasonPurpose] = useState<string>('');
  const [materialItems, setMaterialItems] = useState<{ id: string; name: string; quantity: string }[]>([
    { id: '1', name: '', quantity: '' }
  ]);

  // Step 3 Upload Document States
  const [docValidId, setDocValidId] = useState<{ name: string; url?: string; size?: number } | null>(null);
  const [docResidency, setDocResidency] = useState<{ name: string; url?: string; size?: number } | null>(null);
  const [docOther, setDocOther] = useState<{ name: string; url?: string; size?: number } | null>(null);

  // Camera States & Refs
  const [activeCameraKey, setActiveCameraKey] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

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
          const fileName = `${activeCameraKey}_camera_photo.jpg`;
          const url = URL.createObjectURL(blob);
          const size = blob.size;
          if (activeCameraKey === 'validId') setDocValidId({ name: fileName, url, size });
          else if (activeCameraKey === 'residency') setDocResidency({ name: fileName, url, size });
          else if (activeCameraKey === 'other') setDocOther({ name: fileName, url, size });
        }
        handleCloseCamera();
      }, 'image/jpeg', 0.9);
    }
  };

  // Requirement Modal State
  const [showReqModal, setShowReqModal] = useState<boolean>(false);

  // Submission Success State
  const [submittedApp, setSubmittedApp] = useState<ApplicationRecord | null>(null);

  const handleStartApply = () => {
    setSectorClassification('');
    setEmploymentStatus('');
    setExistingBusiness('');
    setTypeOfBusiness('');
    setOtherBusinessSpecification('');
    setAssistanceNeeded('');
    setReasonPurpose('');
    setMaterialItems([{ id: '1', name: '', quantity: '' }]);
    setDocValidId(null);
    setDocResidency(null);
    setDocOther(null);
    setIsSubmitting(false);
    setIsEditingFromStep4(false);
    setIsApplying(true);
    setCurrentStep(1);
  };

  const toggleServiceRequested = (service: string) => {
    setServicesRequested(prev => 
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const isStep1Complete = 
    Boolean(sectorClassification) &&
    Boolean(employmentStatus) &&
    Boolean(existingBusiness) &&
    (existingBusiness !== 'Yes' || (Boolean(typeOfBusiness) && (typeOfBusiness !== 'Other' || Boolean(otherBusinessSpecification.trim()))));

  const isStep2Complete = 
    Boolean(assistanceNeeded) &&
    (assistanceNeeded !== 'Materials / Supplies' || materialItems.some(i => i.name.trim())) &&
    Boolean(reasonPurpose.trim());

  const isStep3Complete = Boolean(docValidId) && Boolean(docResidency);

  const handleEditStepFromReview = (targetStep: number) => {
    setIsEditingFromStep4(true);
    setCurrentStep(targetStep);
  };

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const refNo = `LVH-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const payload = {
      referenceNo: refNo,
      applicantName: `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim(),
      firstName,
      middleName,
      lastName,
      suffix,
      nationality,
      dob,
      age,
      gender,
      civilStatus,
      bloodType,
      houseNo,
      streetName: street,
      barangay,
      phoneNumber: phone,
      emailAddress: email,
      sector: sectorClassification,
      employmentStatus,
      hasExistingBusiness: existingBusiness,
      typeOfBusiness,
      specifiedOtherBusiness: otherBusinessSpecification,
      assistanceType: assistanceNeeded,
      reasonForAssistance: reasonPurpose,
      requestedMaterialsItems: assistanceNeeded === 'Materials / Supplies' ? materialItems.filter(i => i.name.trim()) : null,
      uploadedDocuments: {
        valid_id: docValidId,
        proof_of_residency: docResidency,
        other_documents: docOther
      },
      details: {
        sectorClassification,
        employmentStatus,
        existingBusiness,
        typeOfBusiness,
        otherBusinessSpecification,
        assistanceNeeded,
        reasonPurpose,
        materialItems
      },
      amount: assistanceNeeded === 'Materials / Supplies' ? 0.00 : 15000.00
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/livelihood/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const savedData = await res.json();
      const newRecord = {
        id: savedData.reference_no || refNo,
        referenceNo: savedData.reference_no || refNo,
        serviceName: 'Livelihood Capital Assistance Grant',
        applicantName: `${firstName} ${lastName}`,
        category: 'livelihood',
        status: 'Pending Document Validation',
        dateSubmitted: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        details: payload.details
      } as any;
      if (onAddApplication) {
        onAddApplication(newRecord);
      }
      setSubmittedApp(newRecord);
    } catch (err) {
      console.error('Error submitting livelihood application:', err);
    }

    setIsApplying(false);
  };

  // Check if there is an active pending Livelihood application in global applications list
  const activePendingApp = applications?.find(app => {
    const isThisModule = (app.referenceNo || '').startsWith('LVH-') || 
      (app.serviceName || '').toLowerCase().includes('livelihood') ||
      (app.category || '').toLowerCase().includes('livelihood');
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
              Your application for Livelihood Capital Assistance Grant has been successfully submitted and is currently pending review. Please wait for a Social Worker's assessment.
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
              } else if (onBack) {
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ----------------------------------------------------------------------- */}
      {/* VIEW MODE 1: SINGLE LIVELIHOOD MODULE CARD                              */}
      {/* ----------------------------------------------------------------------- */}
      {!isApplying && (
        <div className="py-8 px-2">
          <div className="max-w-2xl mx-auto">
            <div className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-300 group ${
              darkMode 
                ? 'bg-[#0f1b35] border-blue-900/40 hover:border-blue-500/50' 
                : 'bg-white border-slate-300 hover:border-blue-500 shadow-slate-200/80'
            }`}>
              <div>
                {/* Top Banner Header of Card */}
                <div className={`border-b px-5 py-4 text-center ${
                  darkMode ? 'bg-[#1b345d] border-blue-800/40' : 'bg-blue-50/90 border-blue-200'
                }`}>
                  <h3 className={`text-base sm:text-lg font-extrabold leading-snug tracking-wide ${
                    darkMode ? 'text-white' : 'text-blue-950'
                  }`}>
                    Gov Service Livelihood Program
                  </h3>
                </div>

                {/* Card Body Text */}
                <div className="p-8 text-center">
                  <p className={`text-xs sm:text-sm leading-relaxed font-medium ${
                    darkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Official government service for Livelihood and Enterprise Assistance of Gov Service.
                  </p>
                </div>
              </div>

              {/* Bottom Centered APPLY NOW Button */}
              <div className="pb-8 pt-2 text-center">
                <button
                  type="button"
                  onClick={handleStartApply}
                  className={`font-extrabold text-xs sm:text-sm tracking-wider uppercase inline-flex items-center justify-center gap-2 hover:underline transition-all cursor-pointer ${
                    darkMode ? 'text-cyan-400 group-hover:text-cyan-300' : 'text-blue-600 group-hover:text-blue-800'
                  }`}
                >
                  <span>APPLY NOW</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* VIEW MODE 2: MAIN LIVELIHOOD PROGRAM 4-STEP WIZARD                      */}
      {/* ----------------------------------------------------------------------- */}
      {isApplying && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Top Sub-Header Back Button */}
          <div>
            <button
              type="button"
              onClick={() => {
                if (onBack) onBack();
                else setIsApplying(false);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer ${
                darkMode
                  ? 'bg-[#182642] text-blue-400 border border-blue-500/30 hover:bg-[#203359] hover:text-blue-300'
                  : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Livelihood Programs</span>
            </button>
          </div>

          {/* Main Card Container */}
          <div className={`rounded-2xl border overflow-hidden ${
            darkMode ? 'bg-[#0b1426] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            
            {/* Banner Header - shown on Step 1 */}
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
                      Livelihood & Training — Primary Requirements
                    </h2>
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Complete the primary qualification questions below and prepare the required documents to proceed with your application.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReqModal(true)}
                  className="px-4 py-2 border border-blue-500/40 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>View Requirements</span>
                </button>
              </div>
            )}

            {/* 4-Step Stepper Progress Header */}
            <div className={`p-6 border-b ${darkMode ? 'bg-[#0c162b] border-slate-800' : 'bg-slate-100/70 border-slate-200'}`}>
              {/* Step circles & progress line */}
              <div className="max-w-3xl mx-auto mb-6 relative">
                <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-700 -z-0">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                  />
                </div>

                <div className="flex justify-between items-center relative z-10">
                  {[1, 2, 3, 4].map((stepNum) => {
                    const isActive = currentStep === stepNum;
                    const isPassed = currentStep > stepNum;
                    return (
                      <button
                        key={stepNum}
                        type="button"
                        onClick={() => {
                          if (stepNum === 1) {
                            setCurrentStep(1);
                          } else if (stepNum === 2 && isStep1Complete) {
                            setCurrentStep(2);
                          } else if (stepNum === 3 && isStep1Complete && isStep2Complete) {
                            setCurrentStep(3);
                          } else if (stepNum === 4 && isStep1Complete && isStep2Complete && isStep3Complete) {
                            setCurrentStep(4);
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
                  const isActive = currentStep === step.num;
                  return (
                    <button
                      key={step.num}
                      type="button"
                      onClick={() => {
                        if (step.num === 1) {
                          setCurrentStep(1);
                        } else if (step.num === 2 && isStep1Complete) {
                          setCurrentStep(2);
                        } else if (step.num === 3 && isStep1Complete && isStep2Complete) {
                          setCurrentStep(3);
                        } else if (step.num === 4 && isStep1Complete && isStep2Complete && isStep3Complete) {
                          setCurrentStep(4);
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

            {/* Stepper Body Content */}
            <div className="p-6 sm:p-8">

              {/* ========================================================================= */}
              {/* STEP 1: COMPLETE CHECKLIST (LIVELIHOOD SECTOR VERIFICATION ONLY)          */}
              {/* ========================================================================= */}
              {currentStep === 1 && (
                <div className="space-y-6 max-w-3xl mx-auto">
                  {/* LIVELIHOOD SECTOR VERIFICATION */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-blue-400" />
                      <h3 className="text-sm font-black tracking-wider uppercase text-white">
                        LIVELIHOOD SECTOR VERIFICATION
                      </h3>
                    </div>

                    <div className="space-y-4 text-xs">
                      {/* SECTOR */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-extrabold text-slate-300 block">
                          SECTOR *
                        </label>
                        <select
                          value={sectorClassification}
                          onChange={(e) => setSectorClassification(e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:border-blue-500 focus:outline-none ${
                            darkMode ? 'bg-[#131f37] border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        >
                          <option value="">Select...</option>
                          <option value="Solo Parent">Solo Parent</option>
                          <option value="Person with Disability (PWD)">Person with Disability (PWD)</option>
                          <option value="OFW / OFW Family">OFW / OFW Family</option>
                          <option value="Person Deprived of Liberty (PDL)">Person Deprived of Liberty (PDL)</option>
                          <option value="Family of CICL">Family of CICL</option>
                          <option value="Women in Especially Difficult Circumstances (WEDC)">Women in Especially Difficult Circumstances (WEDC)</option>
                          <option value="Daycare Parent">Daycare Parent</option>
                          <option value="Livelihood Training Graduate">Livelihood Training Graduate</option>
                          <option value="Informal Worker">Informal Worker</option>
                          <option value="Indigent Individual / Family">Indigent Individual / Family</option>
                          <option value="Small Business / Microentrepreneur">Small Business / Microentrepreneur</option>
                        </select>
                      </div>

                      {/* EMPLOYMENT STATUS */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-extrabold text-slate-300 block">
                          EMPLOYMENT STATUS *
                        </label>
                        <select
                          value={employmentStatus}
                          onChange={(e) => setEmploymentStatus(e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:border-blue-500 focus:outline-none ${
                            darkMode ? 'bg-[#131f37] border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        >
                          <option value="">Select...</option>
                          <option value="Employed">Employed</option>
                          <option value="Unemployed">Unemployed</option>
                        </select>
                      </div>

                      {/* EXISTING BUSINESS */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-extrabold text-slate-300 block">
                          EXISTING BUSINESS *
                        </label>
                        <select
                          value={existingBusiness}
                          onChange={(e) => setExistingBusiness(e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:border-blue-500 focus:outline-none ${
                            darkMode ? 'bg-[#131f37] border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        >
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      {/* TYPE OF BUSINESS (Shown only if EXISTING BUSINESS is Yes) */}
                      {existingBusiness === 'Yes' && (
                        <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-extrabold text-slate-300 block">
                              TYPE OF BUSINESS *
                            </label>
                            <select
                              value={typeOfBusiness}
                              onChange={(e) => setTypeOfBusiness(e.target.value)}
                              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:border-blue-500 focus:outline-none ${
                                darkMode ? 'bg-[#131f37] border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            >
                              <option value="">Select...</option>
                              <option value="Sari-Sari Store">Sari-Sari Store</option>
                              <option value="Food / Food Stall">Food / Food Stall</option>
                              <option value="Retail / Selling">Retail / Selling</option>
                              <option value="Services">Services</option>
                              <option value="Agriculture / Livestock">Agriculture / Livestock</option>
                              <option value="Dressmaking / Sewing">Dressmaking / Sewing</option>
                              <option value="Hairdressing / Beauty Services">Hairdressing / Beauty Services</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          {/* DYNAMIC INPUT WHEN OTHER IS SELECTED */}
                          {typeOfBusiness === 'Other' && (
                            <div className="space-y-1.5 animate-in fade-in duration-200">
                              <label className="text-[11px] font-extrabold text-blue-400 block">
                                PLEASE SPECIFY OTHER TYPE OF BUSINESS *
                              </label>
                              <input
                                type="text"
                                value={otherBusinessSpecification}
                                onChange={(e) => setOtherBusinessSpecification(e.target.value)}
                                placeholder="e.g. Mobile Phone Repair & E-Loading Station"
                                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:border-blue-500 focus:outline-none ${
                                  darkMode ? 'bg-[#131f37] border-blue-500/50 text-white placeholder-slate-500' : 'bg-white border-blue-400 text-slate-900'
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 1 Action Bar */}
                  <div className="flex justify-end items-center pt-6 border-t border-slate-800">
                    <button
                      type="button"
                      disabled={!isStep1Complete}
                      onClick={() => {
                        if (isStep1Complete) {
                          if (isEditingFromStep4) {
                            setIsEditingFromStep4(false);
                            setCurrentStep(4);
                          } else {
                            setCurrentStep(2);
                          }
                        }
                      }}
                      className={`px-6 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                        isStep1Complete
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

              {/* ========================================================================= */}
              {/* STEP 2: APPLICATION FORM (VERIFIED PROFILE + LIVELIHOOD DETAILS)          */}
              {/* ========================================================================= */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {/* Blue Notice Reminder Box */}
                  <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                    darkMode ? 'bg-[#0e2142] border-blue-600/40 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}>
                    <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-extrabold text-blue-300 block mb-0.5">Important Reminder:</strong>
                      <span>Please make sure that your personal information is correct and complete before continuing with your Livelihood Program application.</span>
                    </div>
                  </div>

                  {/* Verified Profile Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="text-[11px] font-extrabold block mb-1.5 text-slate-300">
                        QC ID *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        {qcId}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-extrabold block mb-1.5 text-slate-300">
                        First name *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        {firstName}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-extrabold block mb-1.5 text-slate-300">
                        Middle name
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        {middleName}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-extrabold block mb-1.5 text-slate-300">
                        Last name *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        {lastName}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-extrabold block mb-1.5 text-slate-300">
                        Suffix (Jr., Sr., III, etc.)
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-500'
                      }`}>
                        {suffix || 'Suffix (Jr., Sr., III, etc.)'}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-extrabold block mb-1.5 text-slate-300">
                        Nationality *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        {nationality}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-extrabold block mb-1.5 text-slate-300">
                        Date of birth *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        {dob}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-extrabold block mb-1.5 text-slate-300">
                        Age *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        {age}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-extrabold block mb-1.5 text-slate-300">
                        Gender *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        {gender}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-extrabold block mb-1.5 text-slate-300">
                        Civil status *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        {civilStatus}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-extrabold block mb-1.5 text-slate-300">
                        Blood type *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        {bloodType}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-extrabold block mb-1.5 text-slate-300">
                        House/Building number *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        {houseNo}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-extrabold block mb-1.5 text-slate-300">
                        Street name *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        {street}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-extrabold block mb-1.5 text-slate-300">
                        Barangay *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        {barangay}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-extrabold block mb-1.5 text-slate-300">
                        Phone number *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        {phone}
                      </div>
                    </div>

                    <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                      <label className="text-[11px] font-extrabold block mb-1.5 text-slate-300">
                        Email *
                      </label>
                      <div className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border truncate ${
                        darkMode ? 'bg-[#131f37] border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        {email}
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Assistance Needed & Reason/Purpose */}
                  <div className="pt-4 border-t border-slate-800 space-y-5 text-xs">
                    {/* ASSISTANCE NEEDED */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-extrabold text-slate-300 block uppercase tracking-wider">
                        ASSISTANCE NEEDED *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          'Financial / Capital Assistance',
                          'Materials / Supplies'
                        ].map((item) => {
                          const checked = assistanceNeeded === item;
                          return (
                            <label
                              key={item}
                              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                                checked
                                  ? darkMode ? 'bg-[#0e2142] border-blue-500/60 text-white' : 'bg-blue-50 border-blue-300 text-blue-900'
                                  : darkMode ? 'bg-[#0f1c38] border-slate-800 text-slate-300 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name="assistanceNeededRadio"
                                checked={checked}
                                onChange={() => setAssistanceNeeded(item)}
                                className="rounded-full border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                              />
                              <span className="text-xs font-bold">{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* DYNAMIC MATERIALS / SUPPLIES LIST (Shown if Materials / Supplies is selected) */}
                    {assistanceNeeded === 'Materials / Supplies' && (
                      <div className="p-5 rounded-2xl bg-[#091224] border border-blue-500/40 space-y-4 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-400 shrink-0" />
                            <div>
                              <h4 className="text-xs font-black tracking-wider uppercase text-white">
                                REQUESTED MATERIALS / SUPPLIES (ITEM & QUANTITY)
                              </h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                List down the specific goods or materials you wish to receive as a starter kit.
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setMaterialItems(prev => [
                                ...prev,
                                { id: Date.now().toString(), name: '', quantity: '' }
                              ]);
                            }}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md transition-all shrink-0"
                          >
                            <span>+ Add Item</span>
                          </button>
                        </div>

                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2.5 px-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            <span className="flex-1">Item Name / Description</span>
                            <span className="w-28 text-center">Quantity / Set</span>
                            {materialItems.length > 1 && <span className="w-8"></span>}
                          </div>
                          {materialItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-2.5">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setMaterialItems(prev => prev.map(m => m.id === item.id ? { ...m, name: val } : m));
                                }}
                                placeholder="Item Name (e.g. Sinandomeng Rice 50kg, Canned Goods Pack)"
                                className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:border-blue-500 focus:outline-none ${
                                  darkMode ? 'bg-[#131f37] border-slate-800 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900'
                                }`}
                              />

                              <input
                                type="text"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setMaterialItems(prev => prev.map(m => m.id === item.id ? { ...m, quantity: val } : m));
                                }}
                                placeholder="1 set"
                                className={`w-28 px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:border-blue-500 focus:outline-none ${
                                  darkMode ? 'bg-[#131f37] border-slate-800 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900'
                                }`}
                              />

                              {materialItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMaterialItems(prev => prev.filter(m => m.id !== item.id));
                                  }}
                                  className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer shrink-0"
                                  title="Delete item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* REASON / PURPOSE OF ASSISTANCE */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-extrabold text-slate-300 block uppercase tracking-wider">
                        REASON / PURPOSE OF ASSISTANCE *
                      </label>
                      <textarea
                        rows={4}
                        value={reasonPurpose}
                        onChange={(e) => setReasonPurpose(e.target.value)}
                        placeholder="Briefly explain how the assistance will be used for your livelihood"
                        className={`w-full p-3.5 rounded-xl text-xs font-bold border focus:border-blue-500 focus:outline-none ${
                          darkMode ? 'bg-[#131f37] border-slate-800 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Step 2 Action Bar */}
                  <div className="flex justify-between items-center pt-5 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
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
                            setCurrentStep(4);
                          } else {
                            setCurrentStep(3);
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

              {/* ========================================================================= */}
              {/* STEP 3: UPLOAD SUPPORTING REQUIREMENTS                                    */}
              {/* ========================================================================= */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                      Upload Supporting Requirements
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      Ensure each photo or scanned document copy is clear before proceeding to review and submission.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        key: 'validId',
                        title: 'VALID ID / QCID *',
                        desc: 'Any valid government ID or QCID.',
                        allowed: 'Allowed file types: JPG, JPEG, PNG, WEBP, PDF (or capture using Camera)',
                        doc: docValidId,
                        setDoc: setDocValidId,
                      },
                      {
                        key: 'residency',
                        title: 'PROOF OF RESIDENCY *',
                        desc: 'Barangay Certificate of Residency or Utility Bill.',
                        allowed: 'Allowed file types: JPG, JPEG, PNG, WEBP, PDF (or capture using Camera)',
                        doc: docResidency,
                        setDoc: setDocResidency,
                      },
                      {
                        key: 'other',
                        title: 'OTHER SUPPORTING DOCUMENTS',
                        desc: 'Any supporting documents (Barangay Permit, DTI registration, price quotations, store photos, etc.).',
                        allowed: 'Allowed file types: JPG, JPEG, PNG, WEBP, PDF (or capture using Camera)',
                        doc: docOther,
                        setDoc: setDocOther,
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className={`p-5 rounded-2xl border space-y-3 transition-all ${
                          item.doc
                            ? 'bg-[#0d1c3a]/70 border-2 border-emerald-500/50'
                            : 'bg-[#0b1326] border-slate-800/80'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black tracking-wide uppercase text-white">
                                {item.title}
                              </span>
                              {item.doc && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                            </div>
                            {item.doc && (
                              <span className="text-[11px] font-bold text-emerald-400">
                                1 file(s) uploaded
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-1 text-slate-300 font-medium">{item.desc}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{item.allowed}</p>
                        </div>

                        <div className="flex items-center gap-3 pt-1 flex-wrap">
                          <label className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 transition-all shadow-sm">
                            <Upload className="w-3.5 h-3.5" />
                            <span>UPLOAD PHOTO</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  item.setDoc({ name: file.name, url: URL.createObjectURL(file), size: file.size });
                                }
                              }}
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => handleOpenCamera(item.key)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>TAKE PHOTO (CAMERA)</span>
                          </button>
                        </div>

                        {item.doc && item.doc.url && (
                          <div className="pt-2">
                            <div className="relative w-44 border border-slate-700/80 bg-[#0c162b] rounded-2xl p-2.5 flex flex-col items-center group">
                              <button
                                type="button"
                                onClick={() => item.setDoc(null)}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-slate-700 hover:bg-rose-600 text-white rounded-full flex items-center justify-center border border-slate-500 shadow-md transition-all cursor-pointer z-10"
                                title="Remove photo"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <div className="w-full h-24 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 shrink-0 flex items-center justify-center">
                                {item.doc.url.startsWith('blob:') || item.doc.url.match(/\.(jpg|jpeg|png|webp)/i) ? (
                                  <img src={item.doc.url} alt={item.doc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                ) : (
                                  <FileText className="w-8 h-8 text-blue-400" />
                                )}
                              </div>
                              <span className="text-xs font-bold text-center truncate max-w-full mt-2 block px-1 text-slate-200 group-hover:text-blue-400">
                                {item.doc.name}
                              </span>
                              <span className="text-[10px] font-mono block text-center mt-0.5 text-slate-400">
                                {item.doc.size ? `${(item.doc.size / 1024).toFixed(1)} KB` : '18.1 KB'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Step 3 Action Bar */}
                  <div className="flex justify-between items-center pt-5 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className={`px-6 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
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
                          setIsEditingFromStep4(false);
                          setCurrentStep(4);
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

              {/* ========================================================================= */}
              {/* STEP 4: REVIEW & FINAL SUBMIT                                             */}
              {/* ========================================================================= */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="space-y-4 text-xs">
                    {/* 1. STEP 1 SECTOR VERIFICATION CARD */}
                    <div className="border rounded-2xl overflow-hidden bg-[#0e1933]/60 border-slate-800">
                      <div className="p-4 flex items-center justify-between border-b bg-[#101c38] border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                          <h4 className="text-sm font-extrabold text-white uppercase tracking-wide">
                            STEP 1 — SECTOR VERIFICATION
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEditStepFromReview(1)}
                          className="text-xs font-extrabold text-blue-500 hover:text-blue-400 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>EDIT</span>
                        </button>
                      </div>

                      <div className="p-5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                          <div>
                            <span className="text-[10px] font-extrabold block uppercase tracking-wider text-slate-400">SECTOR CLASSIFICATION</span>
                            <span className="font-bold text-white block mt-0.5">{sectorClassification || 'Not specified'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold block uppercase tracking-wider text-slate-400">EMPLOYMENT STATUS</span>
                            <span className="font-bold text-white block mt-0.5">{employmentStatus || 'Not specified'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold block uppercase tracking-wider text-slate-400">EXISTING BUSINESS</span>
                            <span className="font-bold text-white block mt-0.5">
                              {existingBusiness}
                              {existingBusiness === 'Yes' && typeOfBusiness ? ` (${typeOfBusiness === 'Other' && otherBusinessSpecification ? otherBusinessSpecification : typeOfBusiness})` : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. APPLICANT INFORMATION & ASSISTANCE DETAILS CARD */}
                    <div className="border rounded-2xl overflow-hidden bg-[#0e1933]/60 border-slate-800">
                      <div className="p-4 flex items-center justify-between border-b bg-[#101c38] border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                          <h4 className="text-sm font-extrabold text-white uppercase tracking-wide">
                            A. APPLICANT INFORMATION
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEditStepFromReview(2)}
                          className="text-xs font-extrabold text-blue-500 hover:text-blue-400 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>EDIT</span>
                        </button>
                      </div>

                      <div className="p-5 space-y-6">
                        {/* Applicant Personal & Address Details Grid (Pic 1 Style) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                          <div>
                            <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">FIRST NAME</span>
                            <span className="text-white font-extrabold text-xs block mt-0.5">{firstName || 'JEFFERSON'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">MIDDLE NAME</span>
                            <span className="text-white font-extrabold text-xs block mt-0.5">{middleName || 'FERNANDO'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">LAST NAME</span>
                            <span className="text-white font-extrabold text-xs block mt-0.5">{lastName || 'LEE'}</span>
                          </div>

                          <div>
                            <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">SUFFIX</span>
                            <span className="text-white font-extrabold text-xs block mt-0.5">{suffix || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">NATIONALITY</span>
                            <span className="text-white font-extrabold text-xs block mt-0.5">{nationality || 'FILIPINO'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">DATE OF BIRTH</span>
                            <span className="text-white font-extrabold text-xs block mt-0.5">{dob || '2004-09-27'}</span>
                          </div>

                          <div>
                            <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">AGE</span>
                            <span className="text-white font-extrabold text-xs block mt-0.5">{age || '22'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">GENDER</span>
                            <span className="text-white font-extrabold text-xs block mt-0.5">{gender || 'Male'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">CIVIL STATUS</span>
                            <span className="text-white font-extrabold text-xs block mt-0.5">{civilStatus || 'Single'}</span>
                          </div>

                          <div>
                            <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">HOUSE / BUILDING NUMBER</span>
                            <span className="text-white font-extrabold text-xs block mt-0.5">{houseNo || '176'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">STREET NAME</span>
                            <span className="text-white font-extrabold text-xs block mt-0.5">{street || '23'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">BARANGAY</span>
                            <span className="text-white font-extrabold text-xs block mt-0.5">{barangay || 'Bagong Silangan'}</span>
                          </div>

                          <div>
                            <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">PHONE NUMBER</span>
                            <span className="text-white font-extrabold text-xs block mt-0.5">{phone || '0915582122'}</span>
                          </div>
                        </div>

                        {/* Assistance Request Details Sub-section (Pic 1) */}
                        <div className="pt-4 border-t border-slate-800/80 space-y-4 text-xs">
                          <h5 className="text-xs font-extrabold tracking-wide text-white uppercase">
                            Assistance Request Details
                          </h5>
                          <div className="space-y-3">
                            <div>
                              <span className="text-[10px] font-extrabold block uppercase tracking-wider text-slate-400">ASSISTANCE NEEDED</span>
                              <span className="font-extrabold text-blue-300 block mt-0.5 text-sm">{assistanceNeeded || 'Financial / Capital Assistance'}</span>
                            </div>

                            {assistanceNeeded === 'Materials / Supplies' && materialItems.length > 0 && (
                              <div className="p-3.5 bg-[#0d1830] rounded-xl border border-slate-800 space-y-1.5">
                                <span className="text-[11px] font-extrabold text-slate-300 block uppercase tracking-wide">Requested Items List:</span>
                                <ul className="list-disc pl-4 space-y-1 text-slate-200 text-xs">
                                  {materialItems.filter(i => i.name.trim()).map((i, idx) => (
                                    <li key={idx}>
                                      <strong className="text-white">{i.name}</strong> {i.quantity ? `— Qty: ${i.quantity}` : ''}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {reasonPurpose && (
                              <div>
                                <span className="text-[10px] font-extrabold block uppercase tracking-wider text-slate-400 mb-1">REASON / PURPOSE OF ASSISTANCE</span>
                                <p className="text-slate-200 font-medium italic bg-[#0c162b] p-3 rounded-xl border border-slate-800/80">
                                  "{reasonPurpose}"
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. REQUIRED DOCUMENTS CARD (Pic 1) */}
                    <div className="border rounded-2xl overflow-hidden bg-[#0e1933]/60 border-slate-800">
                      <div className="p-4 flex items-center justify-between border-b bg-[#101c38] border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                          <h4 className="text-sm font-extrabold text-white uppercase tracking-wide">REQUIRED DOCUMENTS</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEditStepFromReview(3)}
                          className="text-xs font-extrabold text-blue-500 hover:text-blue-400 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>EDIT</span>
                        </button>
                      </div>

                      <div className="p-5 space-y-5">
                        {[
                          { key: 'validId', title: 'VALID ID / QCID *', doc: docValidId },
                          { key: 'residency', title: 'PROOF OF RESIDENCY *', doc: docResidency },
                          { key: 'other', title: 'OTHER SUPPORTING DOCUMENTS (OPTIONAL)', doc: docOther },
                        ].map((item) => (
                          <div key={item.key} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold uppercase tracking-wide text-white">
                                {item.title}
                              </span>
                              {item.doc && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            </div>

                            {item.doc && item.doc.url ? (
                              <div className="pt-1">
                                <div className="w-36 border border-slate-700/90 bg-[#091124] rounded-2xl p-2.5 flex flex-col items-center shadow-lg transition-all group">
                                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shrink-0 flex items-center justify-center">
                                    {item.doc.url.startsWith('blob:') || item.doc.url.match(/\.(jpg|jpeg|png|webp)/i) ? (
                                      <img src={item.doc.url} alt={item.doc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    ) : (
                                      <FileText className="w-8 h-8 text-blue-400" />
                                    )}
                                  </div>
                                  <span className="text-[10px] font-bold text-center truncate max-w-full mt-2 block px-1 text-slate-200 group-hover:text-blue-400">
                                    {item.doc.name}
                                  </span>
                                  <span className="text-[9px] font-mono block text-center mt-0.5 text-slate-400">
                                    {item.doc.size ? `${(item.doc.size / 1024).toFixed(1)} KB` : '18.1 KB'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="pt-0.5">
                                <span className="text-xs italic text-slate-500">No photo uploaded</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Step 4 Action Bar */}
                  <div className="flex justify-between items-center pt-5 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className={`px-6 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={handleFinalSubmit}
                      className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-md uppercase tracking-wider"
                    >
                      <span>SUBMIT</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CAMERA CAPTURE MODAL */}
      {activeCameraKey && (
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-3xl border border-slate-800 bg-[#0d1627] p-6 text-white space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-emerald-400 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                <span>Camera Capture</span>
              </h3>
              <button
                type="button"
                onClick={handleCloseCamera}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cameraError ? (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs text-center space-y-2">
                <p>{cameraError}</p>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-slate-800 flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseCamera}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              {!cameraError && (
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  Capture Photo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REQUIREMENT MODAL */}
      {showReqModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-2xl border border-slate-800 bg-[#0d1627] p-6 text-white space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-blue-400">Livelihood Assistance Requirements</h3>
              <button
                type="button"
                onClick={() => setShowReqModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ul className="text-xs space-y-2 text-slate-300 list-disc pl-5">
              <li>Quezon City Resident with Valid QCitizen ID</li>
              <li>Barangay Certificate of Indigency / Residency</li>
              <li>Livelihood Sector Classification (Indigent, Displaced Worker, Solo Parent, PWD, Senior Citizen)</li>
              <li>Simple Business Proposal / Itemized Capital Breakdown</li>
            </ul>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowReqModal(false)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
