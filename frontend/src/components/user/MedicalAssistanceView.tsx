import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle2, 
  Upload, 
  ChevronRight, 
  ShieldCheck, 
  AlertCircle,
  Building2,
  Stethoscope,
  QrCode,
  Download,
  Info,
  X,
  Camera,
  Pencil,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import type { ApplicationRecord } from '../../types';

interface MedicalAssistanceViewProps {
  onBack: () => void;
  onAddApplication: (app: ApplicationRecord) => void;
  darkMode?: boolean;
  applications?: ApplicationRecord[];
  onNavigateToModule?: (tab: string) => void;
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

export const MedicalAssistanceView: React.FC<MedicalAssistanceViewProps> = ({
  onBack,
  onAddApplication,
  darkMode = true,
  applications = [],
  onNavigateToModule,
}) => {
  const { language, t } = useLanguage();
  const isTagalog = language === 'Tagalog';

  // Stepper state (1: COMPLETE CHECKLIST, 2: PERSONAL INFORMATION, 3: UPLOAD DOCUMENTS, 4: REVIEW & SUBMIT)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isEditingFromStep4, setIsEditingFromStep4] = useState<boolean>(false);
  const [submittedAppRecord, setSubmittedAppRecord] = useState<ApplicationRecord | null>(null);

  // Check if citizen has an active pending application
  const activePendingApp = useMemo(() => {
    return applications.find((app) => {
      const isMedical = ((app.serviceName || '').toLowerCase().includes('medical') || 
        (app.serviceName || '').toLowerCase().includes('medicine') || 
        (app.serviceName || '').toLowerCase().includes('hospital') ||
        (app.referenceNo || '').startsWith('QC-MED-')) &&
        !(app.serviceName || '').toLowerCase().includes('funeral') && 
        !(app.serviceName || '').toLowerCase().includes('burial');
      const isNotFinished = app.status !== 'RELEASED / COMPLETED' && (app.status as string) !== 'Completed' && (app.status as string) !== 'Rejected' && (app.status as string) !== 'Disqualified';
      return isMedical && isNotFinished;
    });
  }, [applications]);

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

  // Step 1 Form States
  const [assistanceType, setAssistanceType] = useState<string>('');
  const [hospitalFacility, setHospitalFacility] = useState<string>('');
  const [otherHospitalFacility, setOtherHospitalFacility] = useState<string>('');
  const [medicalCondition, setMedicalCondition] = useState<string>('');
  const [showReqModal, setShowReqModal] = useState<boolean>(false);

  // Step 2 Form States (Prefilled & Disabled Verified QCitizen Profile)
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

  // Patient States
  const [isApplicantPatient, setIsApplicantPatient] = useState<boolean>(false);
  const [isSameAddress, setIsSameAddress] = useState<boolean>(false);

  const [patientRelation, setPatientRelation] = useState<string>('Select');
  const [patientFirstName, setPatientFirstName] = useState<string>('');
  const [patientMiddleName, setPatientMiddleName] = useState<string>('');
  const [patientLastName, setPatientLastName] = useState<string>('');
  const [patientSuffix, setPatientSuffix] = useState<string>('');
  const [patientGender, setPatientGender] = useState<string>('Please choose');
  const [patientDob, setPatientDob] = useState<string>('');
  const [patientAge, setPatientAge] = useState<string>('');

  const [patientHouseNo, setPatientHouseNo] = useState<string>('');
  const [patientStreet, setPatientStreet] = useState<string>('');
  const [patientBarangay, setPatientBarangay] = useState<string>('');

  // Auto-calculate applicant age from DOB
  useEffect(() => {
    if (dob) {
      const calcAge = calculateAgeFromDob(dob);
      if (calcAge) setAge(calcAge);
    }
  }, [dob]);

  // Auto-calculate patient age from patient DOB
  useEffect(() => {
    if (patientDob) {
      const calcAge = calculateAgeFromDob(patientDob);
      if (calcAge) setPatientAge(calcAge);
    }
  }, [patientDob]);

  const handleToggleApplicantPatient = (checked: boolean) => {
    setIsApplicantPatient(checked);
    if (checked) {
      setPatientRelation('Self');
      setPatientFirstName(firstName);
      setPatientMiddleName(middleName);
      setPatientLastName(lastName);
      setPatientSuffix(suffix);
      setPatientGender(gender);
      setPatientDob(dob);
      setPatientAge(age);
      setIsSameAddress(true);
      setPatientHouseNo(houseNo);
      setPatientStreet(street);
      setPatientBarangay(barangay);
    }
  };

  const handleToggleSameAddress = (checked: boolean) => {
    setIsSameAddress(checked);
    if (checked) {
      setPatientHouseNo(houseNo);
      setPatientStreet(street);
      setPatientBarangay(barangay);
    }
  };

  // Auto-fill address reactively whenever isSameAddress is active
  useEffect(() => {
    if (isSameAddress) {
      setPatientHouseNo(houseNo);
      setPatientStreet(street);
      setPatientBarangay(barangay);
    }
  }, [isSameAddress, houseNo, street, barangay]);

  // Step 3 Form States & Camera Modal State
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File }>({});
  const [uploadedDocData, setUploadedDocData] = useState<{ [key: string]: { name: string; size: string; type: string; dataUrl: string } }>({});

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
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const fileName = `${activeCameraKey}_camera_photo.jpg`;
      setUploadedDocData(prev => ({
        ...prev,
        [activeCameraKey]: {
          name: fileName,
          size: '450.0 KB',
          type: 'image/jpeg',
          dataUrl: dataUrl
        }
      }));
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          setUploadedFiles(prev => ({ ...prev, [activeCameraKey]: file }));
        }
        handleCloseCamera();
      }, 'image/jpeg', 0.9);
    }
  };

  // Step 4 Form States
  const [isCertified, setIsCertified] = useState<boolean>(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  // 2 Types of Medical Assistance Options (matching exact UI reference)
  const assistanceTypeOptions = [
    { value: 'Medicines / Medical Supplies', label: 'Medicines / Medical Supplies' },
    { value: 'Medical Bill Assistance', label: 'Medical Bill Assistance' },
  ];

  // Accredited Hospitals List (matching screenshot 4)
  const accreditedHospitals = [
    'Quezon City General Hospital (QCGH)',
    'Lung Center of the Philippines',
    'National Children\'s Hospital',
    'National Kidney and Transplant Institute (NKTI)',
    'Heart Center of the Philippines',
    'East Avenue Medical Center',
    'Philippine Children\'s Medical Center (PCMC)',
    'Quirino Memorial Medical Center (QMMC)',
    'St. Luke\'s Medical Center – Quezon City',
    'Other Health Facility'
  ];

  const handleFileUpload = (reqKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFiles(prev => ({ ...prev, [reqKey]: file }));
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setUploadedDocData(prev => ({
            ...prev,
            [reqKey]: {
              name: file.name,
              size: `${(file.size / 1024).toFixed(1)} KB`,
              type: file.type || 'image/jpeg',
              dataUrl: evt.target!.result as string
            }
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = (reqKey: string) => {
    setUploadedFiles(prev => {
      const copy = { ...prev };
      delete copy[reqKey];
      return copy;
    });
    setUploadedDocData(prev => {
      const copy = { ...prev };
      delete copy[reqKey];
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRefNo = `QC-AICS-2026-MED-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullName = [firstName, middleName, lastName, suffix].filter(Boolean).join(' ') || 'JEFFERSON FERNANDO LEE';
    const isMedicalBill = assistanceType === 'Medical Bill Assistance';
    const selectedHospital = isMedicalBill
      ? (hospitalFacility === 'Other Health Facility' ? (otherHospitalFacility || 'Other Health Facility') : (hospitalFacility || 'Quezon City General Hospital (QCGH)'))
      : undefined;
    const selectedMedicalCondition = isMedicalBill ? (medicalCondition || 'Medical Assistance Request') : undefined;

    const appDetails = {
      category: 'AICS Assistance Services',
      assistanceType: assistanceType || 'Medicines / Medical Supplies',
      hospitalFacility: selectedHospital,
      medicalCondition: selectedMedicalCondition,

      // Step 2 Applicant
      qcId,
      applicantName: fullName,
      firstName: firstName || 'JEFFERSON',
      middleName: middleName || 'FERNANDO',
      lastName: lastName || 'LEE',
      suffix,
      nationality,
      dob: dob || '2004-09-27',
      age: age || calculateAgeFromDob(dob) || '22',
      gender: gender || 'Male',
      civilStatus: civilStatus || 'Single',
      houseNo: houseNo || '176',
      street: street || '23',
      barangay: barangay || 'Bagong Silangan',
      fullAddress: [houseNo, street, barangay, 'Quezon City'].filter(Boolean).join(', ') || '176, 23, Brgy. Bagong Silangan, Quezon City',
      phone: phone || '09155582122',

      // Step 2 Patient Beneficiary
      isApplicantPatient,
      patientRelation: isApplicantPatient ? 'Self' : (patientRelation !== 'Select' ? patientRelation : 'Relative'),
      patientName: isApplicantPatient ? fullName : ([patientFirstName, patientMiddleName, patientLastName, patientSuffix].filter(Boolean).join(' ') || fullName),
      patientFirstName: isApplicantPatient ? (firstName || 'JEFFERSON') : (patientFirstName || firstName || 'JEFFERSON'),
      patientMiddleName: isApplicantPatient ? (middleName || 'FERNANDO') : (patientMiddleName || middleName || 'FERNANDO'),
      patientLastName: isApplicantPatient ? (lastName || 'LEE') : (patientLastName || lastName || 'LEE'),
      patientSuffix: isApplicantPatient ? suffix : (patientSuffix || suffix),
      patientGender: isApplicantPatient ? gender : (patientGender !== 'Please choose' ? patientGender : gender),
      patientDob: isApplicantPatient ? dob : (patientDob || dob),
      patientAge: isApplicantPatient ? age : (patientAge || calculateAgeFromDob(patientDob) || age),
      patientHouseNo: isApplicantPatient || isSameAddress ? (houseNo || '176') : (patientHouseNo || houseNo || '176'),
      patientStreet: isApplicantPatient || isSameAddress ? (street || '23') : (patientStreet || street || '23'),
      patientBarangay: isApplicantPatient || isSameAddress ? (barangay || 'Bagong Silangan') : (patientBarangay || barangay || 'Bagong Silangan'),
      patientAddress: isApplicantPatient || isSameAddress 
        ? ([houseNo, street, barangay, 'Quezon City'].filter(Boolean).join(', ') || '176, 23, Brgy. Bagong Silangan, Quezon City')
        : ([patientHouseNo, patientStreet, patientBarangay, 'Quezon City'].filter(Boolean).join(', ') || '176, 23, Brgy. Bagong Silangan, Quezon City'),

      // Step 3 Uploads
      uploadedFiles: Object.keys(uploadedFiles).length > 0 ? Object.keys(uploadedFiles) : ['Doctor Prescription', 'Medical Certificate', 'Indigency Certificate', 'PhilSys ID'],
      uploadedDocData: uploadedDocData
    };

    const newApp: ApplicationRecord = {
      referenceNo: newRefNo,
      applicantName: fullName,
      serviceName: `QC Medical Assistance — ${assistanceType || 'Medicines / Medical Supplies'}`,
      category: 'AICS',
      assistanceType: assistanceType || 'Medicines / Medical Supplies',
      hospitalFacility: selectedHospital,
      medicalCondition: selectedMedicalCondition,
      dateSubmitted: `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
      status: 'Under Review',
      amountOrType: 'Guarantee Letter / Financial Subsidy',
      assignedSocialWorker: 'Social Worker Maria Santos, RSW (QC CSWDO)',
      details: appDetails
    };

    onAddApplication(newApp);
    setSubmittedAppRecord(newApp);
  };

  const targetApp = submittedAppRecord || activePendingApp;

  if (targetApp) {
    const isJustSubmitted = Boolean(submittedAppRecord);
    return (
      <div className="max-w-md mx-auto my-6 animate-in fade-in zoom-in-95 duration-300">
        <div className={`p-5 sm:p-6 rounded-2xl border text-center space-y-4 ${
          darkMode ? 'bg-[#0b1426] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className={`w-12 h-12 rounded-full border flex items-center justify-center mx-auto ${
            isJustSubmitted 
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
              : 'bg-amber-500/20 border-amber-500 text-amber-400'
          }`}>
            {isJustSubmitted ? <CheckCircle2 className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
          </div>

          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">
              {isJustSubmitted ? 'Application Successfully Submitted' : 'Active Application Pending'}
            </h3>
            <p className={`text-xs max-w-sm mx-auto leading-normal ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {isJustSubmitted ? (
                <>Your application for <span className="font-bold text-blue-400">{targetApp.assistanceType || 'QC Medical Assistance'}</span> has been successfully submitted.</>
              ) : (
                <>You currently have an active application for <span className="font-bold text-blue-400">{targetApp.serviceName}</span>. You cannot submit a new application until your current request is completed.</>
              )}
            </p>
          </div>

          <div className={`p-4 rounded-xl border text-left space-y-2.5 font-mono ${
            darkMode ? 'bg-[#060c18] border-slate-800/90' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-xs">
              <span className={`text-[11px] font-sans font-medium uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Application Reference No.:
              </span>
              <span className="font-bold text-blue-400 text-xs sm:text-sm">{targetApp.referenceNo}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-xs pt-2 border-t border-slate-800/60">
              <span className={`text-[11px] font-sans font-medium uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Date Filed:
              </span>
              <span className={`font-bold text-xs ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {targetApp.dateSubmitted || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onNavigateToModule) {
                onNavigateToModule('payout');
              } else {
                onBack();
              }
            }}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-colors cursor-pointer"
          >
            VIEW IN FINANCIAL AID DISBURSEMENTS
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Sub-Header Back Button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all ${
            darkMode
              ? 'bg-[#182642] text-blue-400 border border-blue-500/30 hover:bg-[#203359] hover:text-blue-300'
              : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to AICS Programs</span>
        </button>
      </div>

      {/* Main Container Card */}
      <div className={`rounded-2xl border overflow-hidden ${
        darkMode ? 'bg-[#0b1426] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        
        {/* Banner Header - only show on Step 1 */}
        {currentStep === 1 && (
          <div className={`p-6 border-b flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
            darkMode ? 'bg-[#0f1b33] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className={`text-base sm:text-lg font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {isTagalog ? 'Mga Kailangan sa Aplikasyon ng QC Medical Assistance' : 'Requirements for Application of QC Medical Assistance'}
                  </h2>
                  <span className="px-2.5 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono rounded-full font-semibold">
                    newApplication
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isTagalog ? 'Opisyal na serbisyo para sa QC AICS Crisis Assistance.' : 'Official service for QC AICS Crisis Assistance.'}
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
                      if (stepNum < currentStep || (stepNum === 2 && assistanceType)) {
                        setCurrentStep(stepNum);
                      }
                    }}
                    className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
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
              { num: 1, label: isTagalog ? 'KOMPLETONG TSEKLIST' : 'COMPLETE CHECKLIST' },
              { num: 2, label: isTagalog ? 'PERSONAL NA IMPORMASYON' : 'PERSONAL INFORMATION' },
              { num: 3, label: isTagalog ? 'PAG-UPLOAD NG DOKUMENTO' : 'UPLOAD DOCUMENTS' },
              { num: 4, label: isTagalog ? 'PAGSUSURI AT PAG-SUBMIT' : 'REVIEW & SUBMIT' },
            ].map((step) => {
              const isActive = currentStep === step.num;
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => {
                    if (step.num < currentStep || (step.num === 2 && assistanceType)) {
                      setCurrentStep(step.num);
                    }
                  }}
                  className={`py-3 px-2 rounded-xl text-[11px] font-extrabold tracking-wider transition-all border ${
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

        {/* Step Body */}
        <div className="p-6 sm:p-8">

          {/* SUCCESS SUBMITTED VIEW */}
          {currentStep === 1 ? (
            /* STEP 1: COMPLETE CHECKLIST */
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-extrabold tracking-wider uppercase text-blue-400 block flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-500" />
                  {isTagalog ? 'I-CLICK ANG URI NG TULONG' : 'CLICK THE TYPE OF ASSISTANCE'}
                </label>

                {/* Dropdown 1: Assistance Type */}
                <select
                  value={assistanceType}
                  onChange={(e) => setAssistanceType(e.target.value)}
                  className={`w-full px-4 py-3.5 rounded-xl border text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    darkMode
                      ? 'bg-[#0f1c38] border-slate-700 text-white focus:border-blue-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                >
                  <option value="">{isTagalog ? 'Pumili ng Uri ng Tulong' : 'Select Type of Assistance'}</option>
                  {assistanceTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditional Fields: Hospital & Diagnosis appear for Medical Bill Assistance */}
              {assistanceType === 'Medical Bill Assistance' && (
                <div className="space-y-5 pt-2 animate-in fade-in duration-300">
                  {/* Field 1: Accredited Partner Hospital */}
                  <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase tracking-wide block ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {isTagalog ? 'Kasamang Ospital / Pasilidad sa Kalusugan *' : 'Partner Hospital / Healthcare Facility *'}
                    </label>
                    <select
                      value={hospitalFacility}
                      onChange={(e) => setHospitalFacility(e.target.value)}
                      className={`w-full px-4 py-3.5 rounded-xl border text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        darkMode
                          ? 'bg-[#0f1c38] border-slate-700 text-white focus:border-blue-500'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                      }`}
                    >
                      <option value="">{isTagalog ? 'Pumili ng Kasamang Ospital / Pasilidad' : 'Select Partner Hospital / Healthcare Facility'}</option>
                      {accreditedHospitals.map((hosp) => (
                        <option key={hosp} value={hosp}>
                          {hosp}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Field 1b: Specify Other Health Facility Name */}
                  {hospitalFacility === 'Other Health Facility' && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      <label className={`text-xs font-bold uppercase tracking-wide block ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {isTagalog ? 'Tukuyin ang Pangalan ng Ospital / Pasilidad *' : 'Specify Health Facility / Hospital Name *'}
                      </label>
                      <input
                        type="text"
                        value={otherHospitalFacility}
                        onChange={(e) => setOtherHospitalFacility(e.target.value)}
                        placeholder="e.g. FEU-NRMF Medical Center / Capitol Medical Center"
                        className={`w-full px-4 py-3.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                          darkMode
                            ? 'bg-[#0f1c38] border-slate-700 text-white focus:border-blue-500 placeholder-slate-500'
                            : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 placeholder-slate-400'
                        }`}
                      />
                    </div>
                  )}

                  {/* Field 2: Medical Condition / Diagnosis */}
                  <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase tracking-wide block ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {isTagalog ? 'Kondisyong Medikal / Sakit (Diagnosis) *' : 'Medical Condition / Diagnosis *'}
                    </label>
                    <input
                      type="text"
                      value={medicalCondition}
                      onChange={(e) => setMedicalCondition(e.target.value)}
                      placeholder={isTagalog ? "hal. Dialysis / Chemotherapy / Pagkakaospital / Operasyon" : "e.g. Dialysis / Chemotherapy / Confinement / Surgery"}
                      className={`w-full px-4 py-3.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        darkMode
                          ? 'bg-[#0f1c38] border-slate-700 text-white focus:border-blue-500 placeholder-slate-500'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Bottom Action Bar */}
              <div className={`pt-6 border-t flex justify-end ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  disabled={!assistanceType}
                  onClick={() => handleNextStep(2)}
                  className={`px-8 py-3 rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all ${
                    assistanceType
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : darkMode
                      ? 'bg-[#18243c] text-slate-500 cursor-not-allowed border border-slate-800'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  }`}
                >
                  {isTagalog ? 'KASUNOD' : 'NEXT'}
                </button>
              </div>
            </div>
          ) : currentStep === 2 ? (
            /* STEP 2: PERSONAL INFORMATION (Matching exact QCID Screenshots 1 & 2) */
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
              
              {/* IMPORTANT REMINDER Box */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                darkMode ? 'bg-[#0e1d3d] border-blue-800/60 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}>
                <Info className={`w-5 h-5 shrink-0 mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                    {isTagalog ? 'MAHALAGANG PAALALA' : 'IMPORTANT REMINDER'}
                  </h4>
                  <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {isTagalog 
                      ? 'Mangyaring siguraduhin na ang impormasyon sa inyong QCID ay tama at kumpleto. Kung may kulang o maling detalye, makipag-ugnayan sa QCID Team bago magpatuloy.' 
                      : 'Please make sure the information on your QCID is correct and complete. If any detail is missing or incorrect, contact the QCID Team to update your QCID records before continuing your application. Accurate information is important for fast and smooth processing of your service.'}
                  </p>
                </div>
              </div>

              {/* Applicant Fields Grid (Prefilled & Disabled Verified Profile) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{isTagalog ? 'Unang pangalan *' : 'First name *'}</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={firstName || 'JEFFERSON'}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-not-allowed ${
                      darkMode ? 'bg-slate-950 border border-slate-800 text-slate-300' : 'bg-slate-100 border border-slate-300 text-slate-800'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{isTagalog ? 'Gitnang pangalan' : 'Middle name'}</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={middleName || 'FERNANDO'}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-not-allowed ${
                      darkMode ? 'bg-slate-950 border border-slate-800 text-slate-300' : 'bg-slate-100 border border-slate-300 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{isTagalog ? 'Apelyido *' : 'Last name *'}</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={lastName || 'LEE'}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-not-allowed ${
                      darkMode ? 'bg-slate-950 border border-slate-800 text-slate-300' : 'bg-slate-100 border border-slate-300 text-slate-800'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{isTagalog ? 'Sufiks (Jr., Sr., III, atbp.)' : 'Suffix (Jr., Sr., III, etc.)'}</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    placeholder={isTagalog ? "Sufiks (Jr., Sr., III, atbp.)" : "Suffix (Jr., Sr., III, etc.)"}
                    value={suffix}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-not-allowed ${
                      darkMode ? 'bg-slate-950 border border-slate-800 text-slate-300 placeholder-slate-600' : 'bg-slate-100 border border-slate-300 text-slate-800 placeholder-slate-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{isTagalog ? 'Nasyonalidad *' : 'Nationality *'}</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value="FILIPINO"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-not-allowed ${
                      darkMode ? 'bg-slate-950 border border-slate-800 text-slate-300' : 'bg-slate-100 border border-slate-300 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{isTagalog ? 'Petsa ng kapanganakan *' : 'Date of birth *'}</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value="27/09/2004"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-not-allowed ${
                      darkMode ? 'bg-slate-950 border border-slate-800 text-slate-300' : 'bg-slate-100 border border-slate-300 text-slate-800'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{isTagalog ? 'Edad *' : 'Age *'}</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={age || '22'}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold cursor-not-allowed ${
                      darkMode ? 'bg-slate-950 border border-slate-800 text-blue-400' : 'bg-slate-100 border border-slate-300 text-blue-700'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{isTagalog ? 'Kasarian *' : 'Gender *'}</label>
                  <select
                    disabled
                    value={gender || 'Male'}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold cursor-not-allowed ${
                      darkMode ? 'bg-slate-950 border border-slate-800 text-slate-300' : 'bg-slate-100 border border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="Male">{isTagalog ? 'Lalaki' : 'Male'}</option>
                    <option value="Female">{isTagalog ? 'Babae' : 'Female'}</option>
                  </select>
                </div>

                <div>
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{isTagalog ? 'Katayuang sibil *' : 'Civil status *'}</label>
                  <select
                    disabled
                    value={civilStatus || 'Single'}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold cursor-not-allowed ${
                      darkMode ? 'bg-slate-950 border border-slate-800 text-slate-300' : 'bg-slate-100 border border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="Single">{isTagalog ? 'Walang asawa (Single)' : 'Single'}</option>
                    <option value="Married">{isTagalog ? 'May asawa (Married)' : 'Married'}</option>
                    <option value="Widowed">{isTagalog ? 'Biyudo / Biyuda (Widowed)' : 'Widowed'}</option>
                    <option value="Separated">{isTagalog ? 'Hiwalay (Separated)' : 'Separated'}</option>
                  </select>
                </div>
                <div>
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{isTagalog ? 'Numero ng Bahay/Gusali *' : 'House/Building number *'}</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={houseNo || '176'}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-not-allowed ${
                      darkMode ? 'bg-slate-950 border border-slate-800 text-slate-300' : 'bg-slate-100 border border-slate-300 text-slate-800'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{isTagalog ? 'Pangalan ng Kalsada *' : 'Street name *'}</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={street || '23'}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-not-allowed ${
                      darkMode ? 'bg-slate-950 border border-slate-800 text-slate-300' : 'bg-slate-100 border border-slate-300 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{isTagalog ? 'Barangay *' : 'Barangay *'}</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={barangay || 'Bagong Silangan'}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-not-allowed ${
                      darkMode ? 'bg-slate-950 border border-slate-800 text-slate-300' : 'bg-slate-100 border border-slate-300 text-slate-800'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{isTagalog ? 'Numero ng Telepono *' : 'Phone number *'}</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={phone || '09155582122'}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-not-allowed ${
                      darkMode ? 'bg-slate-950 border border-slate-800 text-slate-300' : 'bg-slate-100 border border-slate-300 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* Checkbox: I am the patient applying for myself */}
              <label className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer ${
                darkMode ? 'bg-[#0d172e] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <input
                  type="checkbox"
                  checked={isApplicantPatient}
                  onChange={(e) => handleToggleApplicantPatient(e.target.checked)}
                  className={`w-4 h-4 text-blue-600 rounded ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                />
                <span className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  {isTagalog ? 'Ako ang pasyenteng nag-a-apply para sa aking sarili' : 'I am the patient applying for myself'}
                </span>
              </label>

              {/* Patient Information Section */}
              <div className={`space-y-4 pt-2 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <h3 className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {isTagalog ? 'Impormasyon ng Pasyente (Benepisyaryo ng Gamot)' : 'Patient Information (Medicine Beneficiary)'}
                </h3>

                <div className="space-y-2">
                  <label className={`text-xs font-bold block ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{isTagalog ? 'Relasyon sa Pasyente *' : 'Relationship to Patient *'}</label>
                  <select
                    value={patientRelation}
                    onChange={(e) => setPatientRelation(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                      darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white' : 'bg-white border border-slate-300 text-slate-900 shadow-sm'
                    }`}
                  >
                    <option value="Select">{isTagalog ? 'Pumili ng Relasyon' : 'Select Relationship'}</option>
                    <option value="Self">{isTagalog ? 'Sarili (Aplikante ang Pasyente)' : 'Self (Patient is Applicant)'}</option>
                    <option value="Spouse">{isTagalog ? 'Asawa' : 'Spouse'}</option>
                    <option value="Child">{isTagalog ? 'Anak' : 'Child'}</option>
                    <option value="Parent">{isTagalog ? 'Magulang' : 'Parent'}</option>
                    <option value="Sibling">{isTagalog ? 'Kapatid' : 'Sibling'}</option>
                    <option value="Other">{isTagalog ? 'Iba pa' : 'Other'}</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{isTagalog ? 'Unang pangalan *' : 'First name *'}</label>
                    <input
                      type="text"
                      value={patientFirstName}
                      onChange={(e) => setPatientFirstName(e.target.value)}
                      placeholder={isTagalog ? "Unang pangalan" : "First name"}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                        darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white placeholder-slate-500' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{isTagalog ? 'Gitnang pangalan' : 'Middle name'}</label>
                    <input
                      type="text"
                      value={patientMiddleName}
                      onChange={(e) => setPatientMiddleName(e.target.value)}
                      placeholder={isTagalog ? "Gitnang pangalan" : "Middle name"}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                        darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white placeholder-slate-500' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{isTagalog ? 'Apelyido *' : 'Last name *'}</label>
                    <input
                      type="text"
                      value={patientLastName}
                      onChange={(e) => setPatientLastName(e.target.value)}
                      placeholder={isTagalog ? "Apelyido" : "Last name"}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                        darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white placeholder-slate-500' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{isTagalog ? 'Sufiks (Jr., Sr., III, atbp.)' : 'Suffix (Jr., Sr., III, etc.)'}</label>
                    <input
                      type="text"
                      value={patientSuffix}
                      onChange={(e) => setPatientSuffix(e.target.value)}
                      placeholder={isTagalog ? "Sufiks (Jr., Sr., III, atbp.)" : "Suffix (Jr., Sr., III, etc.)"}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                        darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white placeholder-slate-500' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{isTagalog ? 'Kasarian *' : 'Gender *'}</label>
                    <select
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs ${
                        darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white' : 'bg-white border border-slate-300 text-slate-900 shadow-sm'
                      }`}
                    >
                      <option value="Please choose">{isTagalog ? 'Pumili ng kasarian' : 'Please choose'}</option>
                      <option value="Male">{isTagalog ? 'Lalaki' : 'Male'}</option>
                      <option value="Female">{isTagalog ? 'Babae' : 'Female'}</option>
                    </select>
                  </div>
                  <div>
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{isTagalog ? 'Petsa ng kapanganakan *' : 'Date of birth *'}</label>
                    <input
                      type="date"
                      value={patientDob}
                      onChange={(e) => setPatientDob(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs ${
                        darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white' : 'bg-white border border-slate-300 text-slate-900 shadow-sm'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{isTagalog ? 'Edad *' : 'Age *'}</label>
                    <input
                      type="text"
                      value={patientAge}
                      readOnly
                      placeholder={isTagalog ? "Kusang kompyuted" : "Auto-computed"}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold select-none cursor-not-allowed ${
                        darkMode ? 'bg-slate-900/80 border border-slate-700 text-slate-400 placeholder-slate-500' : 'bg-slate-100 border border-slate-300 text-slate-500 placeholder-slate-400 shadow-sm'
                      }`}
                    />
                  </div>
                </div>

                {/* Checkbox: Same as applicant's address */}
                <label className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer ${
                  darkMode ? 'bg-[#0d172e] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <input
                    type="checkbox"
                    checked={isSameAddress}
                    onChange={(e) => handleToggleSameAddress(e.target.checked)}
                    className={`w-4 h-4 text-blue-600 rounded ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                  />
                  <span className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    {isTagalog ? 'Pareho ng tirahan ng aplikante' : "Same as applicant's address"}
                  </span>
                </label>

                {/* Patient Address Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{isTagalog ? 'Numero ng Bahay/Gusali *' : 'House/Building number *'}</label>
                    <input
                      type="text"
                      value={patientHouseNo}
                      onChange={(e) => setPatientHouseNo(e.target.value)}
                      placeholder={isTagalog ? "Numero ng Bahay/Gusali" : "House/Building number"}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                        darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white placeholder-slate-500' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{isTagalog ? 'Pangalan ng Kalsada *' : 'Street name *'}</label>
                    <input
                      type="text"
                      value={patientStreet}
                      onChange={(e) => setPatientStreet(e.target.value)}
                      placeholder={isTagalog ? "Pangalan ng Kalsada" : "Street name"}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                        darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white placeholder-slate-500' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{isTagalog ? 'Barangay *' : 'Barangay *'}</label>
                    <input
                      type="text"
                      value={patientBarangay}
                      onChange={(e) => setPatientBarangay(e.target.value)}
                      placeholder="Barangay"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                        darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white placeholder-slate-500' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`pt-6 border-t flex justify-between ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className={`px-6 py-3 rounded-xl font-extrabold text-xs uppercase border transition-all ${
                    darkMode ? 'bg-[#18243c] hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {isTagalog ? 'BUMALIK' : 'BACK'}
                </button>
                <button
                  type="button"
                  onClick={() => handleNextStep(3)}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl uppercase"
                >
                  {isTagalog ? 'KASUNOD' : 'NEXT'}
                </button>
              </div>
            </div>
          ) : currentStep === 3 ? (
            /* STEP 3: UPLOAD DOCUMENTS */
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
              <div className="space-y-1 mb-6">
                <h3 className={`text-base sm:text-lg font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{isTagalog ? 'Pag-upload ng file' : 'File upload'}</h3>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isTagalog 
                    ? 'Siguraduhing i-upload ang naaangkop na dokumento sa bawat kategorya at tiyaking nagtutugma ang iyong pangalan at tirahan sa iyong QC ID.' 
                    : 'Make sure to upload the appropriate documents for each category and verify that all details—such as your full name (first, middle, and last name) and address—match the information on your QC ID.'}
                </p>
                <p className={`text-xs leading-relaxed mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isTagalog 
                    ? 'Mag-upload ng malinaw na kopya ng mga kailangang dokumento (JPG, JPEG, PNG, WEBP, o PDF).' 
                    : 'Upload clear and legible copies of the required documents (JPG, JPEG, PNG, WEBP, or PDF).'}
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'med_cert', title: isTagalog ? 'SERTIPIKADONG MEDIKAL / CLINICAL ABSTRACT *' : 'MEDICAL CERTIFICATE / CLINICAL ABSTRACT *' },
                  { 
                    key: 'reseta', 
                    title: (assistanceType.toLowerCase().includes('bill') || assistanceType.toLowerCase().includes('hospital'))
                      ? (isTagalog ? 'BILL SA OSPITAL / SOA *' : 'HOSPITAL BILL / SOA *') 
                      : (isTagalog ? 'RESETA NG DOKTOR / RESETA NG GAMOT *' : 'DOCTOR PRESCRIPTION / MEDICINE PRESCRIPTION *') 
                  },
                  { key: 'indigency', title: isTagalog ? 'SERTIPIKASYON NG INDIGENCY MULA SA BARANGAY *' : 'BARANGAY CERTIFICATE OF INDIGENCY *' },
                  { key: 'qcid_patient', title: isTagalog ? 'QC ID NG PASYENTE *' : 'PATIENT QC ID *' },
                  { key: 'authorization', title: isTagalog ? 'SULAT NG OTORISASYON / PERSONAL NA SULAT *' : 'AUTHORIZATION / PERSONAL LETTER *' },
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
                          {isTagalog ? 'Pinapayagang uri ng file: JPG, JPEG, PNG, WEBP (o kumuha gamit ang Kamera)' : 'Allowed file types: JPG, JPEG, PNG, WEBP (or capture using Camera)'}
                        </span>
                      </div>

                      {/* Always-visible action buttons */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <label className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold cursor-pointer inline-flex items-center gap-2 transition-all shadow-md">
                          <Upload className="w-4 h-4" />
                          <span>{isTagalog ? 'MAG-UPLOAD NG LITRATO' : 'UPLOAD PHOTO'}</span>
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
                          <span>{isTagalog ? 'KUMUHA NG LITRATO (KAMERA)' : 'TAKE PHOTO (CAMERA)'}</span>
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
                              title={isTagalog ? "Alisin ang larawan" : "Remove photo"}
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

              {/* Navigation Action Buttons */}
              <div className={`pt-6 border-t flex justify-between ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className={`px-6 py-3 rounded-xl font-extrabold text-xs uppercase border transition-all ${
                    darkMode ? 'bg-[#18243c] hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {isTagalog ? 'BUMALIK' : 'BACK'}
                </button>
                <button
                  type="button"
                  onClick={() => handleNextStep(4)}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl uppercase"
                >
                  {isTagalog ? 'KASUNOD' : 'NEXT'}
                </button>
              </div>
            </div>
          ) : (
            /* STEP 4: REVIEW & SUBMIT */
            <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
              <div className="space-y-1 mb-4">
                <h3 className={`text-base sm:text-lg font-extrabold tracking-wide uppercase ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {isTagalog ? 'SURIIN ANG IYONG APLIKASYON' : 'REVIEW YOUR APPLICATION'}
                </h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isTagalog ? 'Mangyaring suriin nang mabuti ang lahat ng impormasyon bago ipasa ang aplikasyon. Maaari mong baguhin ang anumang bahagi sa pag-click ng "Baguhin".' : 'Please review all information carefully before submitting your application. You can edit any section by clicking the edit button.'}
                </p>
              </div>

              <div className="space-y-4">
                {/* 1. Requirements Section Card */}
                <div className={`border rounded-2xl overflow-hidden ${darkMode ? 'bg-[#0e1933]/60 border-slate-800' : 'bg-slate-50/80 border-slate-200 shadow-sm'}`}>
                  <div className={`p-4 flex items-center justify-between border-b ${darkMode ? 'bg-[#101c38] border-slate-800/80' : 'bg-slate-100 border-slate-200'}`}>
                    <div className="flex items-center gap-2">
                      <ChevronUp className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                      <h4 className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {isTagalog ? 'Mga Kailangan (Requirements)' : 'Requirements'}
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
                  <div className="p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                        {isTagalog ? 'Uri ng Tulong:' : 'Type of Assistance:'} <span className={`font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{assistanceType || 'Medicines / Medical Supplies'}</span>
                      </span>
                    </div>
                    {assistanceType === 'Medical Bill Assistance' && (
                      <>
                        {hospitalFacility && (
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                              {isTagalog ? 'Ospital / Pasilidad:' : 'Hospital / Health Facility:'} <span className={`font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                {hospitalFacility === 'Other Health Facility' && otherHospitalFacility ? `${otherHospitalFacility} (Other Health Facility)` : hospitalFacility}
                              </span>
                            </span>
                          </div>
                        )}
                        {medicalCondition && (
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                              {isTagalog ? 'Kondisyong Medikal / Diagnosis:' : 'Medical Condition / Diagnosis:'} <span className={`font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{medicalCondition}</span>
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                        {isTagalog ? 'Kailangang Dokumento:' : 'Required Documents:'} <span className={`font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          Medical Certificate / Abstract at {(assistanceType.toLowerCase().includes('bill') || assistanceType.toLowerCase().includes('hospital')) ? 'Hospital Bill / SOA' : 'Doctor Prescription'}
                        </span>
                      </span>
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
                    {/* Applicant Information Grid */}
                    {/* Applicant Information Grid (Broken down fields) */}
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
                    </div>

                    {/* Patient Information Sub-section */}
                    <div className={`pt-4 border-t space-y-4 ${darkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
                      <h5 className={`text-xs font-extrabold tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Patient Information ({assistanceType.toLowerCase().includes('bill') ? 'Medical Bill Beneficiary' : 'Medicine Beneficiary'})
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>RELATIONSHIP TO PATIENT</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{patientRelation || 'Self'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>FIRST NAME</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{patientFirstName || firstName || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>MIDDLE NAME</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{patientMiddleName || middleName || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>LAST NAME</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{patientLastName || lastName || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>GENDER</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{patientGender || gender || 'Male'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>DATE OF BIRTH</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{patientDob || dob || '2004-09-27'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>AGE</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{patientAge || age || '22'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>HOUSE / BUILDING NUMBER</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{patientHouseNo || houseNo || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>STREET NAME</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{patientStreet || street || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>BARANGAY</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{patientBarangay || barangay || 'N/A'}</span>
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
                        {isTagalog ? 'Kailangang mga Dokumento' : 'Required documents'}
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
                      { key: 'med_cert', title: isTagalog ? 'MEDICAL CERTIFICATE / CLINICAL ABSTRACT *' : 'MEDICAL CERTIFICATE / CLINICAL ABSTRACT *' },
                      { 
                        key: 'reseta', 
                        title: (assistanceType.toLowerCase().includes('bill') || assistanceType.toLowerCase().includes('hospital'))
                          ? (isTagalog ? 'HOSPITAL BILL / SOA *' : 'HOSPITAL BILL / SOA *')
                          : (isTagalog ? 'RESETA NG DOKTOR / RESETA NG GAMOT *' : 'DOCTOR PRESCRIPTION / MEDICINE PRESCRIPTION *')
                      },
                      { key: 'indigency', title: isTagalog ? 'BARANGAY CERTIFICATE OF INDIGENCY *' : 'BARANGAY CERTIFICATE OF INDIGENCY *' },
                      { key: 'qcid_patient', title: isTagalog ? 'QC ID NG PASYENTE *' : 'PATIENT QC ID *' },
                      { key: 'authorization', title: isTagalog ? 'AUTHORIZATION / LIHAM NG PAHINTULOT *' : 'AUTHORIZATION / PERSONAL LETTER *' },
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
                                className={`w-36 border rounded-2xl p-2.5 flex flex-col items-center shadow-lg group transition-all ${
                                  darkMode ? 'bg-[#091124] border-slate-700/90' : 'bg-white border-slate-200'
                                }`}
                              >
                                <div className={`w-20 h-20 rounded-xl overflow-hidden border shrink-0 ${
                                  darkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-100'
                                }`}>
                                  <img src={previewUrl} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                </div>
                                <span className={`text-[10px] font-bold text-center truncate max-w-full mt-2 block px-1 group-hover:text-blue-400 ${
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

              {/* Step Navigation Action Buttons */}
              <div className={`pt-6 border-t flex justify-between ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className={`px-6 py-3 rounded-xl font-extrabold text-xs uppercase border transition-all ${
                    darkMode ? 'bg-[#18243c] hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {isTagalog ? 'BUMALIK' : 'BACK'}
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all"
                >
                  {isTagalog ? 'IPASA' : 'SUBMIT'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* View Requirements Modal */}
      {showReqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className={`relative w-full max-w-lg border rounded-2xl p-6 shadow-2xl space-y-4 ${
            darkMode ? 'bg-[#0e172a] border-slate-700' : 'bg-white border-slate-200 shadow-xl'
          }`}>
            <div className={`flex justify-between items-center border-b pb-3 ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <h3 className={`text-sm font-extrabold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <FileText className="w-4 h-4 text-blue-500" />
                QC Medical Assistance Guidelines & Requirements
              </h3>
              <button onClick={() => setShowReqModal(false)} className={`${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className={`space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <p className="leading-relaxed">
                The QC Crisis Assistance (AICS) Medical Program offers financial aid and Certificates of Guarantee to indigent residents seeking hospital care, laboratory procedures, and maintenance medicines.
              </p>
              <div className="space-y-2 pt-2">
                <span className={`font-bold uppercase tracking-wider block ${darkMode ? 'text-white' : 'text-slate-900'}`}>Standard Requirements:</span>
                <ul className={`list-disc list-inside space-y-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  <li>Official Medical Abstract / Clinical Summary (Issued within 3 months)</li>
                  <li>Original Hospital Statement of Account (SOA) or Pharmacy Prescription</li>
                  <li>Barangay Certificate of Indigency of Applicant</li>
                  <li>Valid Government Photo ID (PhilSys ID, Comelec, Senior ID, PWD ID)</li>
                  <li>Authorization Letter (if applicant is not the patient)</li>
                </ul>
              </div>
            </div>

            <div className={`pt-3 border-t flex justify-end ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setShowReqModal(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl"
              >
                Close Guidelines
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Live Camera Capture Modal */}
      {activeCameraKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#0e172a] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                Capture Document Photo
              </h3>
              <button type="button" onClick={handleCloseCamera} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {cameraError ? (
              <div className="p-6 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-xs space-y-3">
                <p>{cameraError}</p>
                <label className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-2 transition-all">
                  <Upload className="w-4 h-4" />
                  <span>Choose File from Device</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (activeCameraKey) {
                        handleFileUpload(activeCameraKey, e);
                        handleCloseCamera();
                      }
                    }}
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-xl bg-black border border-slate-800 aspect-video flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleCloseCamera}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase border border-slate-700"
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold uppercase inline-flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>CAPTURE PHOTO</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
