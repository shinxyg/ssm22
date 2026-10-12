import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE_URL } from '../../config/api';
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle2, 
  Upload, 
  ChevronRight, 
  ShieldCheck, 
  AlertCircle,
  GraduationCap,
  QrCode,
  Download,
  Info,
  X,
  Camera,
  Pencil,
  User,
  Users,
  ChevronUp,
  Eye
} from 'lucide-react';
import type { ApplicationRecord } from '../../types';

interface EducationalAssistanceViewProps {
  onBack: () => void;
  onAddApplication: (app: ApplicationRecord) => void;
  darkMode?: boolean;
  mode?: 'educational' | 'childwelfare' | 'soloparent';
  onNavigateToModule?: (tab: string) => void;
  applications?: ApplicationRecord[];
}

// Utility to calculate age from Date of Birth string (YYYY-MM-DD or MM/DD/YYYY)
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

export const EducationalAssistanceView: React.FC<EducationalAssistanceViewProps> = ({
  onBack,
  onAddApplication,
  darkMode = true,
  mode = 'childwelfare',
  onNavigateToModule,
  applications = [],
}) => {
  const { language } = useLanguage();
  const isTagalog = language === 'Tagalog';
  // Stepper state (1: COMPLETE CHECKLIST, 2: APPLICATION FORM, 3: UPLOAD DOCUMENTS, 4: REVIEW & SUBMIT)
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

  // Step 1 Form States (Child Welfare, Educational & Solo Parent Assistance Checklist)
  const [reqResidentQC, setReqResidentQC] = useState<boolean>(false);
  const [reqEducational, setReqEducational] = useState<boolean>(false);
  const [reqEnrolled, setReqEnrolled] = useState<boolean>(false);
  const [selectedSector, setSelectedSector] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showReqModal, setShowReqModal] = useState<boolean>(false);

  // Solo Parent Specific Step 1 States
  const [soloParentIdNumber, setSoloParentIdNumber] = useState<string>('');
  const [isSoloParentIdVerified, setIsSoloParentIdVerified] = useState<boolean>(false);
  const [soloParentIdDetails, setSoloParentIdDetails] = useState<string>('');

  const isStep1Complete = mode === 'childwelfare'
    ? reqResidentQC && reqEducational && reqEnrolled && selectedSector.length > 0 && selectedServices.length > 0
    : mode === 'soloparent'
    ? reqResidentQC && reqEducational && reqEnrolled && isSoloParentIdVerified
    : reqResidentQC && reqEducational && reqEnrolled && selectedSector.length > 0;

  // Step 2 Form States - Applicant / Parent / Guardian Information (Prefilled & Disabled Verified Profile)
  const [applicantFirstName, setApplicantFirstName] = useState<string>('JEFFERSON');
  const [applicantMiddleName, setApplicantMiddleName] = useState<string>('FERNANDO');
  const [applicantLastName, setApplicantLastName] = useState<string>('LEE');
  const [applicantSuffix, setApplicantSuffix] = useState<string>('');
  const [applicantNationality, setApplicantNationality] = useState<string>('FILIPINO');
  const [applicantDob, setApplicantDob] = useState<string>('2004-09-27');
  const [applicantAge, setApplicantAge] = useState<string>('22');
  const [applicantGender, setApplicantGender] = useState<string>('Male');
  const [applicantCivilStatus, setApplicantCivilStatus] = useState<string>(mode === 'soloparent' ? 'Solo Parent' : 'Single');
  const [applicantHouseNo, setApplicantHouseNo] = useState<string>('176');
  const [applicantStreet, setApplicantStreet] = useState<string>('23');
  const [applicantBarangay, setApplicantBarangay] = useState<string>('Bagong Silangan');
  const [contactNumber, setContactNumber] = useState<string>('09155582122');
  const [emailAddress, setEmailAddress] = useState<string>('jeffersonlee1234@gmail.com');
  const [relationToChild, setRelationToChild] = useState<string>('Select Relationship');

  const applicantFullName = `${applicantFirstName} ${applicantMiddleName} ${applicantLastName}`.trim();
  const completeAddress = `${applicantHouseNo} ${applicantStreet}`.trim();

  // Step 2 Form States - Child / Beneficiary Information
  const [childFullName, setChildFullName] = useState<string>('');
  const [childDob, setChildDob] = useState<string>('');
  const [childAge, setChildAge] = useState<string>('');
  const [childSex, setChildSex] = useState<string>('Select Sex');
  const [schoolName, setSchoolName] = useState<string>('');
  const [gradeLevel, setGradeLevel] = useState<string>('');
  const [typeOfSchool, setTypeOfSchool] = useState<string>('Select Type of School');
  const [lrnNumber, setLrnNumber] = useState<string>('');
  const [otherEnrollmentInfo, setOtherEnrollmentInfo] = useState<string>('');
  const [schoolAddress, setSchoolAddress] = useState<string>('');

  // Step 2 Form States - Family Information
  const [numChildrenInFamily, setNumChildrenInFamily] = useState<string>('');
  const [numChildrenStudying, setNumChildrenStudying] = useState<string>('');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('Select Monthly Income');
  const [is4psBeneficiary, setIs4psBeneficiary] = useState<string>('Select Option');
  const [isSoloParentBeneficiary, setIsSoloParentBeneficiary] = useState<string>(mode === 'soloparent' ? 'Yes' : 'Select Option');
  const [isPwdBeneficiary, setIsPwdBeneficiary] = useState<string>('Select Option');

  // Child Welfare Specific States (mode === 'childwelfare')
  const [qcitizenId, setQcitizenId] = useState<string>('110008262304143');
  const [childAddress, setChildAddress] = useState<string>('');
  const [concernDescription, setConcernDescription] = useState<string>('');
  const [incidentDate, setIncidentDate] = useState<string>('');
  const [incidentLocation, setIncidentLocation] = useState<string>('');

  // Auto-calculate applicant age from DOB
  useEffect(() => {
    if (applicantDob) {
      const calcAge = calculateAgeFromDob(applicantDob);
      if (calcAge) setApplicantAge(calcAge);
    }
  }, [applicantDob]);

  // Auto-calculate child age from DOB
  useEffect(() => {
    if (childDob) {
      const calcAge = calculateAgeFromDob(childDob);
      if (calcAge) setChildAge(calcAge);
    }
  }, [childDob]);

  const isStep2Complete =
    childFullName.trim() !== '' &&
    schoolName.trim() !== '';

  // Step 3 Document Upload States
  const [docIndigency, setDocIndigency] = useState<{ name: string; url?: string } | null>(null);
  const [docEnrollment, setDocEnrollment] = useState<{ name: string; url?: string } | null>(null);
  const [docSchoolId, setDocSchoolId] = useState<{ name: string; url?: string } | null>(null);
  const [docGovId, setDocGovId] = useState<{ name: string; url?: string } | null>(null);

  // Solo Parent Specific Document States (mode === 'soloparent')
  const [docQcitizenId, setDocQcitizenId] = useState<{ name: string; url?: string } | null>(null);
  const [docSoloParentId, setDocSoloParentId] = useState<{ name: string; url?: string } | null>(null);

  // Child Welfare Specific Documents (mode === 'childwelfare')
  const [docAvailable, setDocAvailable] = useState<{ name: string; url?: string } | null>(null);
  const [docReferral, setDocReferral] = useState<{ name: string; url?: string } | null>(null);
  const [docBirthCert, setDocBirthCert] = useState<{ name: string; url?: string } | null>(null);
  const [docMedicalPoliceBarangay, setDocMedicalPoliceBarangay] = useState<{ name: string; url?: string } | null>(null);

  const isStep3Complete = true;


  // Camera Capture Modal State
  const [activeCameraDocKey, setActiveCameraDocKey] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Step 4 Review & Certification State
  const [certifiedTrue, setCertifiedTrue] = useState<boolean>(false);

  // Success Confirmation Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [generatedRefNo, setGeneratedRefNo] = useState<string>('');
  const [submittedAppRecord, setSubmittedAppRecord] = useState<ApplicationRecord | null>(null);

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
    // Generate a high quality canvas Data URL for simulated camera capture
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('QC GOVSERVE DOCUMENT CAPTURE', 320, 220);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Doc: ${activeCameraDocKey?.toUpperCase()} | ${new Date().toLocaleString()}`, 320, 260);
    }
    const fakePhotoUrl = canvas.toDataURL('image/jpeg', 0.85);
    const photoDoc = { name: `camera_capture_${Date.now()}.jpg`, url: fakePhotoUrl };

    if (activeCameraDocKey === 'indigency') setDocIndigency(photoDoc);
    if (activeCameraDocKey === 'enrollment') setDocEnrollment(photoDoc);
    if (activeCameraDocKey === 'schoolId') setDocSchoolId(photoDoc);
    if (activeCameraDocKey === 'govId') setDocGovId(photoDoc);
    if (activeCameraDocKey === 'qcitizenId') setDocQcitizenId(photoDoc);
    if (activeCameraDocKey === 'soloParentId') setDocSoloParentId(photoDoc);

    if (activeCameraDocKey === 'available') setDocAvailable(photoDoc);
    if (activeCameraDocKey === 'referral') setDocReferral(photoDoc);
    if (activeCameraDocKey === 'birthCert') setDocBirthCert(photoDoc);
    if (activeCameraDocKey === 'medicalPoliceBarangay') setDocMedicalPoliceBarangay(photoDoc);

    closeCameraModal();
  };

  // Submit Application Handler
  const handleSubmitApplication = async () => {
    const newRef = mode === 'soloparent'
      ? `QC-SP-EDU-${Math.floor(100000 + Math.random() * 900000)}`
      : mode === 'childwelfare'
      ? `QC-CW-${Math.floor(100000 + Math.random() * 900000)}`
      : `QC-EDU-${Math.floor(100000 + Math.random() * 900000)}`;
    setGeneratedRefNo(newRef);

    const uploadedDocsObj: Record<string, { name: string; url?: string }> = {};
    if (docIndigency) uploadedDocsObj['indigency'] = docIndigency;
    if (docEnrollment) uploadedDocsObj['enrollment'] = docEnrollment;
    if (docQcitizenId) uploadedDocsObj['qcitizenId'] = docQcitizenId;
    if (docSoloParentId) uploadedDocsObj['soloParentId'] = docSoloParentId;
    if (docSchoolId) uploadedDocsObj['schoolId'] = docSchoolId;
    if (docGovId) uploadedDocsObj['govId'] = docGovId;
    if (docAvailable) uploadedDocsObj['available_docs'] = docAvailable;
    if (docReferral) uploadedDocsObj['referral_letter'] = docReferral;
    if (docBirthCert) uploadedDocsObj['birth_certificate'] = docBirthCert;
    if (docMedicalPoliceBarangay) uploadedDocsObj['medical_police_brgy'] = docMedicalPoliceBarangay;

    const payload = {
      referenceNo: newRef,
      serviceName: mode === 'soloparent'
        ? 'Solo Parent Educational Assistance Program'
        : mode === 'childwelfare'
        ? 'Child Welfare Services'
        : 'Educational Assistance for Indigent Children & Youth',
      category: mode === 'soloparent'
        ? 'soloparent'
        : mode === 'childwelfare'
        ? 'child_welfare'
        : 'educational',
      applicantName: `${applicantFirstName} ${applicantMiddleName} ${applicantLastName} ${applicantSuffix}`.trim(),
      firstName: applicantFirstName,
      middleName: applicantMiddleName,
      lastName: applicantLastName,
      suffix: applicantSuffix,
      nationality: applicantNationality,
      dob: applicantDob,
      age: applicantAge,
      gender: applicantGender,
      civilStatus: applicantCivilStatus,
      houseNo: applicantHouseNo,
      streetName: applicantStreet,
      barangay: applicantBarangay,
      phoneNumber: contactNumber,
      emailAddress,
      soloParentIdNo: soloParentIdNumber || 'SP-23123',
      relationshipToChild: relationToChild,
      childFullName,
      childDob,
      childAge,
      childSex,
      childAddress,
      schoolName,
      gradeLevel,
      lrnNumber,
      typeOfSchool,
      otherEnrollmentInfo: schoolAddress || otherEnrollmentInfo,
      concernDescription,
      incidentDate,
      incidentLocation,
      numChildrenInFamily,
      numChildrenStudying,
      monthlyFamilyIncome: monthlyIncome,
      is4psBeneficiary,
      isSoloEducationalBeneficiary: isSoloParentBeneficiary,
      isPwdEducationalBeneficiary: isPwdBeneficiary,
      selectedSectors: selectedSector,
      selectedServices: selectedServices,
      uploadedDocuments: uploadedDocsObj,
      status: 'Pending Document Validation',
      details: {
        applicantName: `${applicantFirstName} ${applicantMiddleName} ${applicantLastName}`.trim(),
        spicNumber: soloParentIdNumber || 'SP-we432432',
        relationshipToChild: relationToChild,
        childFullName,
        childDob,
        childAge,
        childSex,
        childAddress,
        schoolName,
        gradeLevel,
        lrnNumber,
        typeOfSchool,
        schoolAddress,
        otherEnrollmentInfo: schoolAddress || otherEnrollmentInfo,
        selectedSectors: selectedSector,
        selectedServices: selectedServices,
        concernDescription,
        incidentDate,
        incidentLocation,
        numChildrenInFamily,
        numChildrenStudying,
        monthlyFamilyIncome: monthlyIncome,
        is4psBeneficiary,
        isSoloEducationalBeneficiary: isSoloParentBeneficiary,
        isPwdEducationalBeneficiary: isPwdBeneficiary,
      }
    };

    try {
      const targetEndpoint = mode === 'soloparent'
        ? `${API_BASE_URL}/api/solo-parent/applications`
        : mode === 'childwelfare'
        ? `${API_BASE_URL}/api/child-welfare/applications`
        : `${API_BASE_URL}/api/educational/applications`;

      const response = await fetch(targetEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({ error: response.statusText }));
        console.error("API post failed:", response.status, errJson);
        alert(isTagalog 
          ? `Hindi nai-save sa database: ${errJson.error || response.statusText || 'Server Error'}` 
          : `Failed to save in database: ${errJson.error || response.statusText || 'Server Error'}`);
        return;
      }
    } catch (err: any) {
      console.error("Educational Assistance API post error:", err);
      alert(isTagalog 
        ? `Hindi makakonekta sa server: ${err?.message || 'Network error'}` 
        : `Could not connect to server: ${err?.message || 'Network error'}`);
      return;
    }

    const newAppRecord: ApplicationRecord = {
      referenceNo: newRef,
      serviceName: mode === 'soloparent'
        ? 'Solo Parent Educational Assistance Program'
        : mode === 'childwelfare'
        ? 'Child Welfare Services'
        : 'Educational Assistance for Indigent Children & Youth',
      category: mode === 'soloparent' ? 'Solo Parent Services' : (mode === 'childwelfare' ? 'Child Welfare Services' : 'Educational Assistance'),
      dateSubmitted: `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
      status: 'Pending Document Validation',
      assignedSocialWorker: mode === 'soloparent' ? 'Ms. Jocelyn Reyes, RSW (Solo Parent Welfare Division)' : 'Maria Santos, RSW (QC Social Services)',
      amountOrType: '₱5,000 Educational Grant',
      details: payload.details
    };

    onAddApplication(newAppRecord);
    setSubmittedAppRecord(newAppRecord);
  };

  // Check if there is an active pending (ongoing) application for this mode
  const activePendingApp = applications?.find(app => {
    const isTarget = mode === 'soloparent' 
      ? ((app.referenceNo || '').startsWith('QC-SP-EDU-') || (app.serviceName || '').toLowerCase().includes('solo parent educational'))
      : mode === 'childwelfare'
      ? ((app.referenceNo || '').startsWith('QC-CW-') || (app.serviceName || '').toLowerCase() === 'child welfare services' || (app.serviceName || '').toLowerCase().includes('child protection'))
      : ((app.referenceNo || '').startsWith('QC-EDU-') || ((app.serviceName || '').toLowerCase().includes('educational') && !(app.referenceNo || '').startsWith('QC-SP-EDU-')));
    if (!isTarget) return false;
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

  const targetApp = isSubmittedAppFinished ? null : (submittedAppRecord || activePendingApp || null);

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
              Your application for {mode === 'soloparent' ? 'Solo Parent Educational Assistance Grant (₱5,000.00)' : mode === 'childwelfare' ? 'Child Protection / Foster Care' : 'Educational Assistance'} has been successfully submitted and is currently pending review. Please wait for a Social Worker's assessment.
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
                onNavigateToModule(mode === 'childwelfare' ? 'history' : 'disbursements');
              } else {
                onBack();
              }
            }}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs tracking-wider uppercase rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{mode === 'childwelfare' ? 'VIEW IN APPLICATION HISTORY' : 'VIEW IN FINANCIAL AID DISBURSEMENTS'}</span>
          </button>
        </div>
      </div>
    );
  }


  // Shared Theme Styling Tokens for Crisp Contrast
  const cardClass = darkMode 
    ? 'bg-[#0f1b35] border-blue-900/40 text-white shadow-xl' 
    : 'bg-white border-slate-200 text-slate-900 shadow-md';

  const labelClass = darkMode 
    ? 'text-slate-300 font-semibold text-xs mb-1 block' 
    : 'text-slate-700 font-bold text-xs mb-1 block';

  const inputClass = darkMode 
    ? 'w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border bg-slate-900/80 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none' 
    : 'w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border bg-slate-50/80 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none shadow-sm';

  const bannerClass = darkMode 
    ? 'p-4 rounded-xl bg-blue-950/50 border border-blue-800/60 flex items-start gap-3' 
    : 'p-4 rounded-xl bg-blue-50/90 border border-blue-200 flex items-start gap-3 shadow-sm';

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
    : 'px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-extrabold tracking-wider uppercase border border-slate-300 transition-all shadow-sm';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Header & Navigation */}
      <div className="space-y-4">
        <h1 className={`text-xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          {mode === 'soloparent'
            ? (isTagalog ? 'Programa sa Tulong sa Edukasyon para sa Solo Parent' : 'Solo Parent Educational Assistance Program')
            : mode === 'educational'
            ? (isTagalog ? 'Tulong sa Edukasyon para sa mga Kapus-Palad na Bata at Kabataan' : 'Educational Assistance for Indigent Children & Youth')
            : (isTagalog ? 'Kalinga at Proteksyon ng Bata (Child Welfare Services)' : 'Child Welfare Services')}
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
            <span>
              {mode === 'soloparent'
                ? (isTagalog ? 'BUMALIK SA MGA SERBISYO NG SOLO PARENT' : 'BACK TO SOLO PARENT SERVICES')
                : (isTagalog ? 'BUMALIK SA MGA SERBISYO NG KALINGA SA BATA' : 'BACK TO CHILD WELFARE SERVICES')}
            </span>
          </button>
        </div>
      </div>

      {/* SINGLE UNIFIED MAIN CONTAINER CARD FOR ALL CONTENT */}
      <div className={`rounded-2xl border overflow-hidden ${
        darkMode ? 'bg-[#0b1426] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
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
                <h2 className={`text-base sm:text-lg font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {mode === 'soloparent'
                    ? (isTagalog ? 'Tulong sa Edukasyon para sa Solo Parent — Pangunahing Kailangan' : 'Solo Parent Educational Assistance — Primary Requirements')
                    : mode === 'educational'
                    ? (isTagalog ? 'Tulong sa Edukasyon — Pangunahing Kailangan' : 'Educational Assistance — Primary Requirements')
                    : (isTagalog ? 'Mga Serbisyo sa Kapakanan ng Bata — Pangunahing Kailangan' : 'Child Welfare Services — Primary Requirements')}
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

        {/* 4-Step Stepper Progress Header */}
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

          {/* Tab Buttons */}
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
              {mode === 'soloparent' ? (
                <>
                  {/* SOLO PARENT SECTOR Banner */}
                  <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                    darkMode ? 'bg-blue-950/60 border-blue-800/80 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}>
                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-400 dark:text-blue-300">
                        {isTagalog ? 'SEKTOR NG SOLO PARENT: ANG MGA QUALIFIED NA BENEPISYARYO AY MAAARING MAKATANGGAP NG TULONG SA EDUKASYON.' : 'SOLO PARENT SECTOR: Qualified beneficiaries may receive educational assistance.'}
                      </h3>
                      <p className="text-xs leading-relaxed font-medium">
                        {isTagalog ? 'Para sa mga kwalipikadong bata / benepisyaryo ng Solo Parent. Nakasalalay sa beripikasyon ng kwalipikasyon, beripikasyon ng dokumento, at pagsusuri bago maaprubahan.' : 'For qualified children/beneficiaries of Solo Parents. Subject to eligibility verification, document validation, and assessment before approval.'}
                      </p>
                    </div>
                  </div>

                  {/* Qualification Checklist (FIRST) */}
                  <div>
                    <h2 className={`text-xs font-extrabold tracking-wider uppercase mb-3 ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                      {isTagalog ? 'PANGUNAHING TSEKLIST NG KWALIPIKASYON' : 'PRIMARY ELIGIBILITY CHECKLIST'}
                    </h2>
                    <div className={`p-4 rounded-xl border space-y-3 ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50/80 border-slate-200'}`}>
                      {[
                        {
                          id: 'resident',
                          state: reqResidentQC,
                          setState: setReqResidentQC,
                          text: isTagalog ? 'Ikaw ba ay lehitimong residente ng Lungsod Quezon na may hawak na lehitimong Solo Parent ID / Sertipikasyon? *' : 'Are you a legitimate resident of Quezon City holding a valid Solo Parent ID / Certification? *',
                        },
                        {
                          id: 'educational',
                          state: reqEducational,
                          setState: setReqEducational,
                          text: isTagalog ? 'Nag-aapply ka ba para sa tulong pinansyal sa edukasyon para sa isang qualified na bata / dependent na benepisyaryo? *' : 'Are you applying for educational financial assistance for a qualified child / dependent beneficiary? *',
                        },
                        {
                          id: 'enrolled',
                          state: reqEnrolled,
                          setState: setReqEnrolled,
                          text: isTagalog ? 'Ang bata / benepisyaryo ba ay kasalukuyang nakatala sa paaralan? *' : 'Is the child / beneficiary currently enrolled in school? *',
                        },
                      ].map((item) => (
                        <label key={item.id} className="flex items-center gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={item.state}
                            onChange={(e) => item.setState(e.target.checked)}
                            className="w-4 h-4 accent-blue-600 rounded cursor-pointer shrink-0"
                          />
                          <span className={`text-xs font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                            {item.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* FINANCIAL SUBSIDY & SOLO PARENT ID VERIFICATION (SECOND) */}
                  <div className={`p-5 rounded-2xl border space-y-4 ${
                    darkMode ? 'bg-[#0f1b35] border-blue-900/40' : 'bg-slate-50 border-slate-200 shadow-sm'
                  }`}>
                    <div className="flex items-center justify-between border-b pb-3 border-slate-800 dark:border-slate-800 border-slate-200">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-500 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-400" />
                        ITO SA FINANCIAL SUBSIDY
                      </h3>
                      {isSoloParentIdVerified && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> VERIFIED
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* SOLO PARENT ID NUMBER */}
                      <div>
                        <label className={labelClass}>SOLO PARENT ID NUMBER *</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3.5 top-2.5 text-xs font-bold text-blue-400 select-none">
                              SP-
                            </span>
                            <input
                              type="text"
                              value={soloParentIdNumber ? soloParentIdNumber.replace(/^SP-?\s*/i, '') : ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val) {
                                  setSoloParentIdNumber(`SP-${val}`);
                                } else {
                                  setSoloParentIdNumber('');
                                  setIsSoloParentIdVerified(false);
                                }
                                if (val.trim().length < 4) setIsSoloParentIdVerified(false);
                              }}
                              placeholder="2026-88192"
                              className={`${inputClass} pl-10`}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (soloParentIdNumber.trim().length > 3) {
                                setIsSoloParentIdVerified(true);
                                setSoloParentIdDetails(`${soloParentIdNumber} (QC Social Services Dept Registered Solo Parent)`);
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition-all border border-blue-400/30"
                          >
                            [VERIFY SOLO PARENT ID]
                          </button>
                        </div>
                      </div>

                      {/* SOLO PARENT STATUS */}
                      <div>
                        <label className={labelClass}>SOLO PARENT STATUS *</label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={isSoloParentIdVerified ? 'VERIFIED - ACTIVE SOLO PARENT ID' : 'Auto-filled upon Solo Parent ID verification'}
                          className={`${inputClass} select-none cursor-not-allowed ${
                            isSoloParentIdVerified 
                              ? 'text-emerald-400 font-bold bg-emerald-950/30 border-emerald-800/60' 
                              : 'text-amber-400 font-bold bg-amber-950/30 border-amber-800/60'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h2 className={`text-xs font-extrabold tracking-wider uppercase mb-4 ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                      {isTagalog ? 'MGA SERBISYO AT PANGUNAHING KAILANGAN' : 'SERVICE AND PRIMARY REQUIREMENTS'}
                    </h2>

                    <div className="space-y-4 py-1">
                      {[
                        {
                          id: 'resident',
                          state: reqResidentQC,
                          setState: setReqResidentQC,
                          text: isTagalog ? 'Ikaw ba ay lehitimong residente ng Lungsod Quezon? *' : 'Are you a legitimate resident of Quezon City? *',
                        },
                        {
                          id: 'educational',
                          state: reqEducational,
                          setState: setReqEducational,
                          text: mode === 'educational'
                            ? (isTagalog ? 'Nag-aapply ka ba para sa tulong sa edukasyon para sa isang kapus-palad na bata o kabataan? *' : 'Are you applying for educational assistance for an indigent child or youth? *')
                            : (isTagalog ? 'Nag-aapply ka ba para sa tulong sa kapakanan (welfare assistance) para sa isang bata o kabataan? *' : 'Are you applying for welfare assistance for a child or youth? *'),
                        },
                        {
                          id: 'enrolled',
                          state: reqEnrolled,
                          setState: setReqEnrolled,
                          text: mode === 'educational'
                            ? (isTagalog ? 'Ang benepisyaryo ba ay kasalukuyang nakatala o nangangailangan ng tulong sa edukasyon? *' : 'Is the beneficiary currently enrolled or in need of educational assistance? *')
                            : (isTagalog ? 'Ang benepisyaryo ba ay nangangailangan ng suporta sa kapakanan ng bata at mga serbisyong panlipunan? *' : 'Is the beneficiary in need of child welfare support and social services? *'),
                        },
                      ].map((item) => (
                        <label
                          key={item.id}
                          className="flex items-center gap-3 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={item.state}
                            onChange={(e) => item.setState(e.target.checked)}
                            className="w-4 h-4 accent-blue-600 rounded cursor-pointer shrink-0"
                          />
                          <span className={`text-xs font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                            {item.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* SECTOR */}
                  <div>
                    <h3 className={`text-xs font-extrabold tracking-wider uppercase mb-3 ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                      {isTagalog ? 'SEKTOR *' : 'SECTOR *'}
                    </h3>
                    <div className={`p-4 rounded-xl border space-y-3 ${
                      darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50/80 border-slate-200'
                    }`}>
                      {[
                        { raw: 'Children & Youth', label: isTagalog ? 'Mga Bata at Kabataan (Children & Youth)' : 'Children & Youth' },
                        { raw: "Solo Parent's Child/Beneficiary", label: isTagalog ? 'Anak/Benepisyaryo ng Solo Parent' : "Solo Parent's Child/Beneficiary" },
                        { raw: 'Child with Disability (CWD)', label: isTagalog ? 'Batang May Kapansanan (CWD)' : 'Child with Disability (CWD)' },
                      ].map((sec) => (
                        <label
                          key={sec.raw}
                          className="flex items-center gap-3 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSector.includes(sec.raw)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSector((prev) => [...prev, sec.raw]);
                              } else {
                                setSelectedSector((prev) => prev.filter((s) => s !== sec.raw));
                              }
                            }}
                            className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                          />
                          <span className={`text-xs font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                            {sec.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* SERVICE REQUESTED (Child Welfare Only) */}
                  {mode === 'childwelfare' && (
                    <div>
                      <h3 className={`text-xs font-extrabold tracking-wider uppercase mb-3 ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                        {isTagalog ? 'HINILING NA SERBISYO *' : 'SERVICE REQUESTED *'}
                      </h3>
                      <div className={`p-4 rounded-xl border space-y-3 ${
                        darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50/80 border-slate-200'
                      }`}>
                        {[
                          { raw: 'Child Protection', label: isTagalog ? 'Proteksyon sa Bata (Child Protection)' : 'Child Protection' },
                          { raw: 'Alternative Child Care', label: isTagalog ? 'Alternatibong Pag-aaruga sa Bata (Alternative Child Care)' : 'Alternative Child Care' },
                          { raw: 'Rehabilitative Counseling', label: isTagalog ? 'Rehabilitative Counseling' : 'Rehabilitative Counseling' },
                          { raw: 'Educational Financial Aid', label: isTagalog ? 'Tulong Pinansyal sa Edukasyon' : 'Educational Financial Aid' },
                        ].map((srv) => (
                          <label
                            key={srv.raw}
                            className="flex items-center gap-3 cursor-pointer select-none"
                          >
                            <input
                              type="checkbox"
                              checked={selectedServices.includes(srv.raw)}
                              onChange={() => setSelectedServices([srv.raw])}
                              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                            />
                            <span className={`text-xs font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                              {srv.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  disabled={!isStep1Complete}
                  onClick={() => handleNextStep(2)}
                  className={`px-8 py-3 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all ${
                    isStep1Complete
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
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

      {/* STEP 2: APPLICATION FORM */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className={bannerClass}>
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h3 className={bannerTitleClass}>
                {mode === 'soloparent'
                  ? (isTagalog ? 'PROGRAMA SA TULONG SA EDUKASYON PARA SA SOLO PARENT — PORMA NG APLIKASYON' : 'SOLO PARENT EDUCATIONAL ASSISTANCE PROGRAM — APPLICATION FORM')
                  : mode === 'educational' 
                  ? (isTagalog ? 'TULONG SA EDUKASYON PARA SA MGA KAPUS-PALAD NA BATA AT KABATAAN — PORMA NG APLIKASYON' : 'EDUCATIONAL ASSISTANCE FOR INDIGENT CHILDREN & YOUTH — APPLICATION FORM') 
                  : (isTagalog ? 'SERBISYO SA KAPAKANAN NG BATA — PORMA NG APLIKASYON' : 'CHILD WELFARE SERVICES — APPLICATION FORM')}
              </h3>
              <p className={bannerTextClass}>
                {mode === 'soloparent'
                  ? (isTagalog ? 'Mangyaring kumpletuhin ang impormasyon para sa Solo Parent Aplikante at Mag-aaral/Anak na Benepisyaryo. Ang mga patlang na may (*) ay kinakailangan.' : 'Please complete the information for Solo Parent Applicant and Student/Child Beneficiary. Fields marked with (*) are required.')
                  : (isTagalog ? 'Mangyaring kumpletuhin ang impormasyon para sa Aplikante/Magulang, Benepisyaryong Bata, at Pamilya. Ang mga patlang na may (*) ay kinakailangan.' : 'Please complete the information for Applicant/Parent, Child Beneficiary, and Family. Fields marked with (*) are required.')}
              </p>
            </div>
          </div>

          {/* SECTION: APPLICANT / PARENT / GUARDIAN INFORMATION */}
          <div className="space-y-4">
            <div>
              <h3 className={`text-xs font-extrabold tracking-wider uppercase ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {isTagalog 
                  ? 'IMPORMASYON NG APLIKANTE / MAGULANG / TAGAPANGALAGA'
                  : 'APPLICANT / PARENT / GUARDIAN INFORMATION'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>{isTagalog ? 'Unang pangalan *' : 'First name *'}</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={applicantFirstName || 'JEFFERSON'}
                  className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                />
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Gitnang pangalan' : 'Middle name'}</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={applicantMiddleName || 'FERNANDO'}
                  className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                />
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Apelyido *' : 'Last name *'}</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={applicantLastName || 'LEE'}
                  className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                />
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Dugtong sa Pangalan (Jr., Sr., III, atbp.)' : 'Suffix (Jr., Sr., III, etc.)'}</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  placeholder={isTagalog ? 'Dugtong sa Pangalan (Jr., Sr., III, atbp.)' : 'Suffix (Jr., Sr., III, etc.)'}
                  value={applicantSuffix}
                  className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                />
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Nasyonalidad *' : 'Nationality *'}</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={applicantNationality || 'FILIPINO'}
                  className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                />
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Petsa ng Kapanganakan *' : 'Date of birth *'}</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value="27/09/2004"
                  className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                />
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Edad *' : 'Age *'}</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={applicantAge || '22'}
                  className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 font-bold text-blue-400`}
                />
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Kasarian *' : 'Gender *'}</label>
                <select
                  disabled
                  value={applicantGender || 'Male'}
                  className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                >
                  <option value="Male">{isTagalog ? 'Lalaki' : 'Male'}</option>
                  <option value="Female">{isTagalog ? 'Babae' : 'Female'}</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Katayuang Sibil *' : 'Civil status *'}</label>
                <select
                  disabled
                  value={applicantCivilStatus || (mode === 'soloparent' ? 'Solo Parent' : 'Single')}
                  className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                >
                  <option value="Single">{isTagalog ? 'Walang asawa' : 'Single'}</option>
                  <option value="Married">{isTagalog ? 'May asawa' : 'Married'}</option>
                  <option value="Widowed">{isTagalog ? 'Balo' : 'Widowed'}</option>
                  <option value="Separated">{isTagalog ? 'Hiwalay' : 'Separated'}</option>
                  <option value="Solo Parent">Solo Parent</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Numero ng Bahay/Gusali *' : 'House/Building number *'}</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={applicantHouseNo || '176'}
                  className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                />
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Pangalan ng Kalye *' : 'Street name *'}</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={applicantStreet || '23'}
                  className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                />
              </div>

              <div>
                <label className={labelClass}>Barangay *</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={applicantBarangay || 'Bagong Silangan'}
                  className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                />
              </div>

              <div>
                <label className={labelClass}>{isTagalog ? 'Numero ng Telepono *' : 'Phone number *'}</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={contactNumber || '09155582122'}
                  className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                />
              </div>

              <div>
                <label className={labelClass}>Email Address *</label>
                <input
                  type="email"
                  readOnly
                  disabled
                  value={emailAddress || 'jeffersonlee1234@gmail.com'}
                  className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90`}
                />
              </div>

              {mode === 'soloparent' && (
                <div>
                  <label className={labelClass}>{isTagalog ? 'Kasalukuyang Numero ng Solo Parent ID *' : 'Existing Solo Parent ID Number *'}</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={soloParentIdNumber ? (soloParentIdNumber.startsWith('SP-') ? soloParentIdNumber : `SP-2026-${soloParentIdNumber}`) : 'SP-2026-88492'}
                    className={`${inputClass} select-none cursor-not-allowed border-slate-700/50 opacity-90 font-mono`}
                  />
                </div>
              )}

              {mode === 'childwelfare' && (
                <div>
                  <label className={labelClass}>{isTagalog ? 'QCitizen ID / Katibayan sa Pamahalaan *' : 'QCitizen ID / Valid Government ID *'}</label>
                  <input
                    type="text"
                    value={qcitizenId}
                    onChange={(e) => setQcitizenId(e.target.value)}
                    placeholder="110008262304143"
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          </div>

          {/* RELATIONSHIP TO CHILD / BENEFICIARY (Non-Solo Parent mode only) */}
          {mode !== 'soloparent' && (
            <div className={`pt-4 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <label className={labelClass}>{isTagalog ? 'Relasyon sa Bata *' : 'Relationship to Child *'}</label>
              <select
                value={relationToChild}
                onChange={(e) => setRelationToChild(e.target.value)}
                className={`${inputClass} max-w-md`}
              >
                <option value="Select Relationship">{isTagalog ? 'Pumili ng Relasyon' : 'Select Relationship'}</option>
                <option value="Parent">{isTagalog ? 'Magulang' : 'Parent'}</option>
                <option value="Father">{isTagalog ? 'Ama' : 'Father'}</option>
                <option value="Mother">{isTagalog ? 'Ina' : 'Mother'}</option>
                <option value="Guardian">{isTagalog ? 'Tagapangalaga' : 'Guardian'}</option>
                <option value="Grandparent">{isTagalog ? 'Lolo/Lola' : 'Grandparent'}</option>
                <option value="Relative">{isTagalog ? 'Kamag-anak' : 'Relative'}</option>
                <option value="Other">{isTagalog ? 'Iba pa' : 'Other'}</option>
              </select>
            </div>
          )}

          {/* SECTION: STUDENT / DEPENDENT CHILD INFORMATION */}
          <div className={`space-y-4 pt-6 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
            <div>
              <h3 className={`text-xs font-extrabold tracking-wider uppercase ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {isTagalog 
                  ? (mode === 'soloparent' ? 'IMPORMASYON NG MAG-AARAL / ANÁK' : mode === 'childwelfare' ? 'IMPORMASYON NG BATA' : 'IMPORMASYON NG BATA / BENEPISYARYO')
                  : (mode === 'soloparent' ? 'STUDENT / DEPENDENT CHILD INFORMATION' : mode === 'childwelfare' ? 'CHILD INFORMATION' : 'CHILD / BENEFICIARY INFORMATION')}
              </h3>
            </div>

            {mode === 'soloparent' ? (
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>{isTagalog ? 'Buong Pangalan ng Mag-aaral (Anak / Mag-aaral) *' : 'Student Full Name (Anak / Mag-aaral) *'}</label>
                  <input
                    type="text"
                    value={childFullName}
                    onChange={(e) => setChildFullName(e.target.value)}
                    placeholder="e.g. Juan Dela Cruz Jr."
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>{isTagalog ? 'Edad *' : 'Age (Edad) *'}</label>
                    <input
                      type="text"
                      value={childAge}
                      readOnly
                      disabled
                      placeholder="e.g. 14"
                      className={`${inputClass} select-none cursor-not-allowed opacity-85`}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>{isTagalog ? 'Petsa ng Kapanganakan (YYYY-MM-DD) *' : 'Date of Birth (YYYY-MM-DD) *'}</label>
                    <input
                      type="date"
                      value={childDob}
                      onChange={(e) => setChildDob(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>{isTagalog ? 'Kasarian *' : 'Sex (Kasarian) *'}</label>
                    <select
                      value={childSex}
                      onChange={(e) => setChildSex(e.target.value)}
                      className={inputClass}
                    >
                      <option value="Select Sex">{isTagalog ? 'Pumili ng Kasarian' : 'Select...'}</option>
                      <option value="Male">{isTagalog ? 'Lalaki' : 'Male / Lalaki'}</option>
                      <option value="Female">{isTagalog ? 'Babae' : 'Female / Babae'}</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : mode === 'childwelfare' ? (
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>{isTagalog ? 'Buong Pangalan ng Bata *' : "Child's Full Name *"}</label>
                  <input
                    type="text"
                    value={childFullName}
                    onChange={(e) => setChildFullName(e.target.value)}
                    placeholder={isTagalog ? 'Ilagay ang Buong Pangalan ng Bata' : "Enter Child's Full Name"}
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>{isTagalog ? 'Petsa ng Kapanganakan *' : 'Date of Birth *'}</label>
                    <input
                      type="date"
                      value={childDob}
                      onChange={(e) => setChildDob(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>{isTagalog ? 'Edad *' : 'Age *'}</label>
                    <input
                      type="text"
                      value={childAge}
                      readOnly
                      disabled
                      placeholder={isTagalog ? 'Awtomatikong kinuwenta' : 'Auto-computed'}
                      className={`${inputClass} select-none cursor-not-allowed opacity-85`}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>{isTagalog ? 'Kasarian *' : 'Sex *'}</label>
                    <select
                      value={childSex}
                      onChange={(e) => setChildSex(e.target.value)}
                      className={inputClass}
                    >
                      <option value="Select Sex">{isTagalog ? 'Pumili ng Kasarian' : 'Select Sex'}</option>
                      <option value="Male">{isTagalog ? 'Lalaki' : 'Male'}</option>
                      <option value="Female">{isTagalog ? 'Babae' : 'Female'}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>{isTagalog ? 'Tirahan *' : 'Address *'}</label>
                    <input
                      type="text"
                      value={childAddress}
                      onChange={(e) => setChildAddress(e.target.value)}
                      placeholder={isTagalog ? 'Ilagay ang Tirahan' : 'Enter Address'}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>{isTagalog ? 'Paaralan, kung naaangkop' : 'School, if applicable'}</label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder={isTagalog ? 'hal. Mababang Paaralan ng Quezon City (Optional)' : 'e.g. Quezon City Elementary School (Optional)'}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>{isTagalog ? 'Buong Pangalan *' : 'Full Name *'}</label>
                  <input
                    type="text"
                    value={childFullName}
                    onChange={(e) => setChildFullName(e.target.value)}
                    placeholder={isTagalog ? 'Ilagay ang Buong Pangalan ng Bata' : "Enter Child's Full Name"}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>{isTagalog ? 'Petsa ng Kapanganakan *' : 'Date of Birth *'}</label>
                  <input
                    type="date"
                    value={childDob}
                    onChange={(e) => setChildDob(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>{isTagalog ? 'Edad *' : 'Age *'}</label>
                  <input
                    type="text"
                    value={childAge}
                    readOnly
                    disabled
                    placeholder={isTagalog ? 'Awtomatikong kinuwenta' : 'Auto-computed'}
                    className={`${inputClass} select-none cursor-not-allowed opacity-85`}
                  />
                </div>

                <div>
                  <label className={labelClass}>{isTagalog ? 'Kasarian *' : 'Sex *'}</label>
                  <select
                    value={childSex}
                    onChange={(e) => setChildSex(e.target.value)}
                    className={inputClass}
                  >
                    <option value="Select Sex">{isTagalog ? 'Pumili ng Kasarian' : 'Select Sex'}</option>
                    <option value="Male">{isTagalog ? 'Lalaki' : 'Male'}</option>
                    <option value="Female">{isTagalog ? 'Babae' : 'Female'}</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>{isTagalog ? 'Pangalan ng Paaralan *' : 'School Name *'}</label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder={isTagalog ? 'Ilagay ang Pangalan ng Paaralan' : 'Enter School Name'}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>{isTagalog ? 'Antas / Baitang *' : 'Grade Level *'}</label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">{isTagalog ? 'Pumili ng Antas / Baitang' : 'Select Grade Level'}</option>
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="ALS">ALS (Alternative Learning System)</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Learner Reference Number (LRN)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={lrnNumber}
                    onChange={(e) => setLrnNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder={isTagalog ? 'LRN (Numero Lamang, Walang Limit)' : 'LRN (Numbers only, No limit)'}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>{isTagalog ? 'Uri ng Paaralan *' : 'Type of School *'}</label>
                  <select
                    value={typeOfSchool}
                    onChange={(e) => setTypeOfSchool(e.target.value)}
                    className={inputClass}
                  >
                    <option value="Select Type of School">{isTagalog ? 'Pumili ng Uri ng Paaralan' : 'Select Type of School'}</option>
                    <option value="Public">{isTagalog ? 'Pampubliko' : 'Public'}</option>
                    <option value="Private">{isTagalog ? 'Pribado' : 'Private'}</option>
                    <option value="ALS">ALS (Alternative Learning System)</option>
                    <option value="Other">{isTagalog ? 'Iba pa' : 'Other'}</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>{isTagalog ? 'Iba pang Impormasyon sa Pagpapatala' : 'Other Enrollment Information'}</label>
                  <input
                    type="text"
                    value={otherEnrollmentInfo}
                    onChange={(e) => setOtherEnrollmentInfo(e.target.value)}
                    placeholder="e.g. S.Y. 2026-2027 / Section / Track"
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION: SCHOOL & ACADEMIC DETAILS (For Solo Parent mode) */}
          {mode === 'soloparent' && (
            <div className={`space-y-4 pt-6 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div>
                <h3 className={`text-xs font-extrabold tracking-wider uppercase ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  {isTagalog ? 'MGA DETALYE NG PAARALAN AT AKADEMIKO' : 'SCHOOL & ACADEMIC DETAILS'}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>{isTagalog ? 'Pangalan ng Paaralan / Institusyon *' : 'Name of School / Institution *'}</label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="e.g. Sauyo High School / Quezon City Public School"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>{isTagalog ? 'Antas / Taon sa Akademiko *' : 'Grade Level / Academic Year *'}</label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">{isTagalog ? 'Pumili ng Antas / Baitang' : 'Select Grade Level'}</option>
                      <option value="Grade 1">Grade 1</option>
                      <option value="Grade 2">Grade 2</option>
                      <option value="Grade 3">Grade 3</option>
                      <option value="Grade 4">Grade 4</option>
                      <option value="Grade 5">Grade 5</option>
                      <option value="Grade 6">Grade 6</option>
                      <option value="Grade 7">Grade 7</option>
                      <option value="Grade 8">Grade 8</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="ALS">ALS (Alternative Learning System)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>{isTagalog ? 'Learner Reference Number (LRN) / Student ID *' : 'Learner Reference Number (LRN) / Student ID *'}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={lrnNumber}
                      onChange={(e) => setLrnNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder={isTagalog ? 'LRN (Numero Lamang, Walang Limit)' : 'LRN (Numbers only, No limit)'}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>{isTagalog ? 'Kumupletong Tirahan ng Paaralan *' : 'Complete School Address *'}</label>
                    <input
                      type="text"
                      value={schoolAddress}
                      onChange={(e) => setSchoolAddress(e.target.value)}
                      placeholder="e.g. Sauyo Road, Novaliches, Quezon City"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: REASON FOR REQUEST / FAMILY INFORMATION (Non-Solo Parent mode only) */}
          {mode !== 'soloparent' && (
            <div className={`space-y-4 pt-6 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div>
                <h3 className={`text-xs font-extrabold tracking-wider uppercase ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  {isTagalog 
                    ? (mode === 'childwelfare' ? 'DAHILAN NG HILING' : 'IMPORMASYON NG PAMILYA')
                    : (mode === 'childwelfare' ? 'REASON FOR REQUEST' : 'FAMILY INFORMATION')}
                </h3>
              </div>

              {mode === 'childwelfare' ? (
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>{isTagalog ? 'Deskripsyon ng alalahanin/problema *' : 'Description of concern/problem *'}</label>
                    <textarea
                      rows={4}
                      value={concernDescription}
                      onChange={(e) => setConcernDescription(e.target.value)}
                      placeholder={isTagalog ? 'Magbigay ng mga detalye ukol sa sitwasyon ng bata, alalahanin, o dahilan ng paghiling ng tulong / proteksyon...' : 'Please provide details regarding the child\'s situation, concern, or reason for requesting assistance / protection...'}
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>{isTagalog ? 'Petsa / tantyang petsa ng insidente, kung naaangkop' : 'Date / approximate date of incident, if applicable'}</label>
                      <input
                        type="date"
                        value={incidentDate}
                        onChange={(e) => setIncidentDate(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>{isTagalog ? 'Lokasyon ng insidente, kung naaangkop' : 'Location of incident, if applicable'}</label>
                      <input
                        type="text"
                        value={incidentLocation}
                        onChange={(e) => setIncidentLocation(e.target.value)}
                        placeholder={isTagalog ? 'hal. Barangay / Kalye / Tiyak na lokasyon (Optional)' : 'e.g. Barangay / Street / Specific location (Optional)'}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col justify-end">
                      <label className={`${labelClass} min-h-[2.25rem] flex items-end`}>{isTagalog ? 'Bilang ng mga Bata sa Pamilya *' : 'Number of Children in the Family *'}</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        value={numChildrenInFamily}
                        onChange={(e) => setNumChildrenInFamily(e.target.value.replace(/\D/g, '').slice(0, 2))}
                        placeholder={isTagalog ? 'Ilagay ang bilang' : 'Enter number'}
                        className={inputClass}
                      />
                    </div>

                    <div className="flex flex-col justify-end">
                      <label className={`${labelClass} min-h-[2.25rem] flex items-end`}>{isTagalog ? 'Bilang ng mga Batang Kasalukuyang Nag-aaral *' : 'Number of Children Currently Studying *'}</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        value={numChildrenStudying}
                        onChange={(e) => setNumChildrenStudying(e.target.value.replace(/\D/g, '').slice(0, 2))}
                        placeholder={isTagalog ? 'Ilagay ang bilang' : 'Enter number'}
                        className={inputClass}
                      />
                    </div>

                    <div className="flex flex-col justify-end">
                      <label className={`${labelClass} min-h-[2.25rem] flex items-end`}>{isTagalog ? 'Buwanang Kita ng Pamilya *' : 'Monthly Family Income *'}</label>
                      <select
                        value={monthlyIncome}
                        onChange={(e) => setMonthlyIncome(e.target.value)}
                        className={inputClass}
                      >
                        <option value="Select Monthly Income">{isTagalog ? 'Pumili ng Buwanang Kita' : 'Select Monthly Income'}</option>
                        <option value="Below ₱10,000">{isTagalog ? 'Mababa sa ₱10,000' : 'Below ₱10,000'}</option>
                        <option value="₱10,000 - ₱15,000">₱10,000 - ₱15,000</option>
                        <option value="₱15,001 - ₱25,000">₱15,001 - ₱25,000</option>
                        <option value="₱25,001 and above">{isTagalog ? '₱25,001 pataas' : '₱25,001 and above'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className={labelClass}>{isTagalog ? 'Benepisyaryo ng 4Ps *' : '4Ps Beneficiary *'}</label>
                      <select
                        value={is4psBeneficiary}
                        onChange={(e) => setIs4psBeneficiary(e.target.value)}
                        className={inputClass}
                      >
                        <option value="Select Option">{isTagalog ? 'Pumili ng Pagpipilian' : 'Select Option'}</option>
                        <option value="Yes">{isTagalog ? 'Oo' : 'Yes'}</option>
                        <option value="No">{isTagalog ? 'Hindi' : 'No'}</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>{isTagalog ? 'Benepisyaryo ng Solo Parent *' : 'Solo Parent Beneficiary *'}</label>
                      <select
                        value={isSoloParentBeneficiary}
                        onChange={(e) => setIsSoloParentBeneficiary(e.target.value)}
                        className={inputClass}
                      >
                        <option value="Select Option">{isTagalog ? 'Pumili ng Pagpipilian' : 'Select Option'}</option>
                        <option value="Yes">{isTagalog ? 'Oo' : 'Yes'}</option>
                        <option value="No">{isTagalog ? 'Hindi' : 'No'}</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>{isTagalog ? 'Benepisyaryo ng PWD *' : 'PWD Beneficiary *'}</label>
                      <select
                        value={isPwdBeneficiary}
                        onChange={(e) => setIsPwdBeneficiary(e.target.value)}
                        className={inputClass}
                      >
                        <option value="Select Option">{isTagalog ? 'Pumili ng Pagpipilian' : 'Select Option'}</option>
                        <option value="Yes">{isTagalog ? 'Oo' : 'Yes'}</option>
                        <option value="No">{isTagalog ? 'Hindi' : 'No'}</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={backBtnClass}
            >
              {isTagalog ? 'BUMALIK' : 'BACK'}
            </button>

            <button
              type="button"
              disabled={!isStep2Complete}
              onClick={() => handleNextStep(3)}
              className={`px-8 py-2.5 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all ${
                isStep2Complete
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
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

      {/* STEP 3: UPLOAD DOCUMENTS */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className={`text-xl font-black tracking-tight mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {isTagalog ? 'Pag-upload ng Dokumento' : 'File upload'}
            </h2>
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {isTagalog 
                ? 'Tiyaking i-upload ang mga angkop na dokumento para sa bawat kategorya at beripikahin na ang lahat ng detalye—tulad ng iyong buong pangalan at tirahan—ay tumutugma sa iyong QC ID.\nMag-upload ng malinaw at nababasang kopya ng mga kailangang dokumento (JPG, JPEG, PNG, WEBP, o PDF).'
                : 'Make sure to upload the appropriate documents for each category and verify that all details—such as your full name (first, middle, and last name) and address—match the information on your QC ID.\nUpload clear and legible copies of the required documents (JPG, JPEG, PNG, WEBP, or PDF).'}
            </p>
          </div>

          <div className="space-y-4">
            {(mode === 'childwelfare'
              ? [
                  { key: 'available', title: isTagalog ? 'I-UPLOAD ANG MGA MAGAGAMIT NA DOKUMENTO *' : 'UPLOAD AVAILABLE DOCUMENTS *', doc: docAvailable, setDoc: setDocAvailable },
                  { key: 'referral', title: isTagalog ? 'LIHAM NG REFERRAL, KUNG NAAANGKOP (OPTIONAL)' : 'REFERRAL LETTER, IF APPLICABLE (OPTIONAL)', doc: docReferral, setDoc: setDocReferral },
                  { key: 'birthCert', title: isTagalog ? 'SERTIPIKASYON NG KAPANGANAKAN, KUNG MAYROON (OPTIONAL)' : 'BIRTH CERTIFICATE, IF AVAILABLE (OPTIONAL)', doc: docBirthCert, setDoc: setDocBirthCert },
                  { key: 'medicalPoliceBarangay', title: isTagalog ? 'DOKUMENTONG MEDIKAL/POLIS/BARANGAY, KUNG NAAANGKOP (OPTIONAL)' : 'MEDICAL/POLICE/BARANGAY DOCUMENTS, IF APPLICABLE (OPTIONAL)', doc: docMedicalPoliceBarangay, setDoc: setDocMedicalPoliceBarangay },
                ]
              : mode === 'soloparent'
              ? [
                  { key: 'indigency', title: isTagalog ? 'ORIHINAL NA BARANGAY CERTIFICATE OF INDIGENCY *' : 'ORIGINAL BARANGAY CERTIFICATE OF INDIGENCY *', doc: docIndigency, setDoc: setDocIndigency },
                  { key: 'enrollment', title: isTagalog ? 'KATIBAYAN NG PAGPAPATALA (CERTIFICATE OF ENROLLMENT) *' : 'CERTIFICATE OF ENROLLMENT *', doc: docEnrollment, setDoc: setDocEnrollment },
                  { key: 'qcitizenId', title: isTagalog ? 'QCITIZEN ID *' : 'QCITIZEN ID *', doc: docQcitizenId, setDoc: setDocQcitizenId },
                  { key: 'soloParentId', title: isTagalog ? 'SOLO PARENT ID / SERTIPIKASYON *' : 'SOLO PARENT ID / CERTIFICATION *', doc: docSoloParentId, setDoc: setDocSoloParentId },
                ]
              : [
                  { key: 'indigency', title: isTagalog ? 'BARANGAY CERTIFICATE OF INDIGENCY – ORIHINAL (LAYUNIN: TULONG SA EDUKASYON) *' : 'BARANGAY CERTIFICATE OF INDIGENCY – ORIGINAL (PURPOSE: EDUCATIONAL ASSISTANCE) *', doc: docIndigency, setDoc: setDocIndigency },
                  { key: 'enrollment', title: isTagalog ? 'KATIBAYAN NG PAGPAPATALA – ORIHINAL *' : 'CERTIFICATE OF ENROLLMENT – ORIGINAL *', doc: docEnrollment, setDoc: setDocEnrollment },
                  { key: 'schoolId', title: isTagalog ? 'BAGONG SCHOOL ID – KUNG MAYROON (OPTIONAL)' : 'RECENT SCHOOL ID – IF AVAILABLE (OPTIONAL)', doc: docSchoolId, setDoc: setDocSchoolId },
                  { key: 'govId', title: isTagalog ? 'VALID GOVERNMENT ID / MAS MAINAM NA QCITIZEN ID *' : 'VALID GOVERNMENT ID / PREFERABLY QCITIZEN ID *', doc: docGovId, setDoc: setDocGovId },
                ]
            ).map((item) => {
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
                      {isTagalog ? 'Pinapayagang uri ng file: JPG, JPEG, PNG, WEBP (o kumuha gamit ang Kamera)' : 'Allowed file types: JPG, JPEG, PNG, WEBP (or capture using Camera)'}
                    </span>
                  </div>

                  {/* Always-visible action buttons matching Medical Assistance */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <label className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold cursor-pointer inline-flex items-center gap-2 transition-all shadow-md">
                      <Upload className="w-4 h-4" />
                      <span>{isTagalog ? 'MAG-UPLOAD NG LITRATO' : 'UPLOAD PHOTO'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              item.setDoc({ name: file.name, url: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => openCameraModal(item.key)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold cursor-pointer inline-flex items-center gap-2 transition-all shadow-md"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{isTagalog ? 'KUMUHA NG LITRATO (KAMERA)' : 'TAKE PHOTO (CAMERA)'}</span>
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

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={backBtnClass}
            >
              {isTagalog ? 'BUMALIK' : 'BACK'}
            </button>

            <button
              type="button"
              disabled={!isStep3Complete}
              onClick={() => handleNextStep(4)}
              className={`px-8 py-2.5 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all ${
                isStep3Complete
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
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

      {/* STEP 4: REVIEW & SUBMIT */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div>
            <h3 className={`text-xs font-extrabold tracking-wider uppercase mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              {isTagalog ? 'SURIIN ANG IYONG APLIKASYON' : 'REVIEW YOUR APPLICATION'}
            </h3>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {isTagalog ? 'Mangyaring suriin nang mabuti ang lahat ng detalye bago ang pinal na pag-submit.' : 'Please double check all submitted details before final submission.'}
            </p>
          </div>

          {/* Summary Cards */}
          <div className="space-y-4">
            {/* Single Combined Card for Section A, B, and C */}
            <div className={`border rounded-2xl overflow-hidden transition-all ${
              darkMode ? 'bg-[#0e1933]/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className={`p-4 border-b flex justify-between items-center ${darkMode ? 'border-slate-800 bg-[#091124]' : 'border-slate-200 bg-slate-50'}`}>
                <h4 className="text-xs font-extrabold tracking-wide uppercase text-blue-500 dark:text-blue-400 flex items-center gap-2">
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                  {isTagalog ? 'Mga Detalye ng Aplikasyon at Benepisyaryo' : 'Application & Beneficiary Details'}
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
                {/* Section: Applicant Information */}
                <div>
                  <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-3 pb-1 border-b ${darkMode ? 'text-blue-400 border-slate-800' : 'text-blue-600 border-slate-200'}`}>
                    {isTagalog ? 'IMPORMASYON NG APLIKANTE' : 'APPLICANT INFORMATION'}
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-3 gap-x-6 text-xs">
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'UNANG PANGALAN' : 'FIRST NAME'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{applicantFirstName || 'JEFFERSON'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'GITNANG PANGALAN' : 'MIDDLE NAME'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{applicantMiddleName || 'FERNANDO'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'APELYIDO' : 'LAST NAME'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{applicantLastName || 'LEE'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'DUGTONG SA PANGALAN' : 'SUFFIX'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{applicantSuffix || 'N/A'}</span>
                    </div>
                    {mode === 'soloparent' && (
                      <div>
                        <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'MGA DETALYE NG SOLO PARENT ID' : 'SOLO PARENT ID DETAILS'}</span>
                        <span className={`font-bold text-emerald-400`}>{soloParentIdDetails || soloParentIdNumber}</span>
                      </div>
                    )}
                    {mode === 'childwelfare' && (
                      <div>
                        <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'QCITIZEN ID / VALID GOVT ID' : 'QCITIZEN ID / VALID GOVT ID'}</span>
                        <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{qcitizenId || 'N/A'}</span>
                      </div>
                    )}
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'NASYONALIDAD' : 'NATIONALITY'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{applicantNationality || 'FILIPINO'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'PETSA NG KAPANGANAKAN' : 'DATE OF BIRTH'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{applicantDob || 'N/A'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'EDAD / KASARIAN' : 'AGE / GENDER'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{applicantAge || '22'} {isTagalog ? 'taon' : 'yrs'} / {applicantGender === 'Male' ? (isTagalog ? 'Lalaki' : 'Male') : (isTagalog ? 'Babae' : 'Female')}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'KATAYUANG SIBIL' : 'CIVIL STATUS'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{applicantCivilStatus || (isTagalog ? 'Walang asawa' : 'Single')}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'NUMERO NG BAHAY / GUSALI' : 'HOUSE / BUILDING NUMBER'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{applicantHouseNo || '176'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'PANGALAN NG KALYE' : 'STREET NAME'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{applicantStreet || '23'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>BARANGAY</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{applicantBarangay || 'Bagong Silangan'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'NUMERO NG TELEPONO' : 'PHONE NUMBER'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{contactNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'REHISTRADONG EMAIL ADDRESS' : 'REGISTERED EMAIL ADDRESS'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{emailAddress || 'N/A'}</span>
                    </div>
                    {mode !== 'soloparent' && (
                      <div>
                        <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'RELASYON SA BATA' : 'RELATION TO CHILD'}</span>
                        <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{relationToChild || 'N/A'}</span>
                      </div>
                    )}
                    {mode !== 'soloparent' && (
                      <>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'PINILING SEKTOR' : 'TARGET SECTOR(S)'}</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{selectedSector.length > 0 ? selectedSector.join(', ') : 'Children & Youth'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'HINILING NA SERBISYO' : 'REQUESTED SERVICE(S)'}</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{selectedServices.length > 0 ? selectedServices.join(', ') : 'Child Protection & Educational Aid'}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Section: Child / Student Information */}
                <div>
                  <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-3 pb-1 border-b ${darkMode ? 'text-blue-400 border-slate-800' : 'text-blue-600 border-slate-200'}`}>
                    {isTagalog 
                      ? (mode === 'soloparent' ? 'IMPORMASYON NG MAG-AARAL / ANÁK' : mode === 'childwelfare' ? 'IMPORMASYON NG BATA' : 'IMPORMASYON NG BATA / BENEPISYARYO')
                      : (mode === 'soloparent' ? 'STUDENT / DEPENDENT CHILD INFORMATION' : mode === 'childwelfare' ? 'CHILD INFORMATION' : 'CHILD / BENEFICIARY INFORMATION')}
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'BUONG PANGALAN NG MAG-AARAL' : 'STUDENT FULL NAME'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{childFullName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'PETSA NG KAPANGANAKAN' : 'DATE OF BIRTH'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{childDob || 'N/A'}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'EDAD / KASARIAN' : 'AGE / SEX'}</span>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{childAge ? `${childAge} ${isTagalog ? 'taon' : 'yrs'}` : 'N/A'} ({childSex === 'Male' ? (isTagalog ? 'Lalaki' : 'Male') : childSex === 'Female' ? (isTagalog ? 'Babae' : 'Female') : childSex})</span>
                    </div>
                    {mode === 'childwelfare' ? (
                      <>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'TIRAHAN NG BATA' : 'CHILD ADDRESS'}</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{childAddress || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'PAARALAN (KUNG NAAANGKOP)' : 'SCHOOL (IF APPLICABLE)'}</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{schoolName || 'N/A'}</span>
                        </div>
                      </>
                    ) : mode !== 'soloparent' ? (
                      <>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'PANGALAN NG PAARALAN' : 'SCHOOL NAME'}</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{schoolName || 'N/A'} ({typeOfSchool})</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'ANTAS / BAITANG' : 'GRADE LEVEL'}</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{gradeLevel || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>LEARNER REFERENCE NUMBER (LRN)</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{lrnNumber || 'N/A'}</span>
                        </div>
                        {otherEnrollmentInfo && (
                          <div>
                            <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'IBA PANG IMPORMASYON SA PAGPAPATALA' : 'OTHER ENROLLMENT INFO'}</span>
                            <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{otherEnrollmentInfo}</span>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Section C: School & Academic Details (For Solo Parent mode) */}
                {mode === 'soloparent' && (
                  <div>
                    <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-3 pb-1 border-b ${darkMode ? 'text-blue-400 border-slate-800' : 'text-blue-600 border-slate-200'}`}>
                      {isTagalog ? 'C. MGA DETALYE NG PAARALAN AT AKADEMIKO' : 'C. SCHOOL & ACADEMIC DETAILS'}
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                      <div>
                        <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'PANGALAN NG PAARALAN / INSTITUSYON' : 'NAME OF SCHOOL / INSTITUTION'}</span>
                        <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{schoolName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'ANTAS / TAON SA AKADEMIKO' : 'GRADE LEVEL / ACADEMIC YEAR'}</span>
                        <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{gradeLevel || 'N/A'}</span>
                      </div>
                      <div>
                        <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>LEARNER REFERENCE NUMBER (LRN) / STUDENT ID</span>
                        <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{lrnNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'KUMUPLETONG TIRAHAN NG PAARALAN' : 'COMPLETE SCHOOL ADDRESS'}</span>
                        <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{schoolAddress || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section: Reason for Request / Family Information (Non-Solo Parent mode only) */}
                {mode !== 'soloparent' && (
                  <div>
                    <h5 className={`text-xs font-extrabold uppercase tracking-wider mb-3 pb-1 border-b ${darkMode ? 'text-blue-400 border-slate-800' : 'text-blue-600 border-slate-200'}`}>
                      {isTagalog 
                        ? (mode === 'childwelfare' ? 'DAHILAN NG HILING' : 'IMPORMASYON NG PAMILYA')
                        : (mode === 'childwelfare' ? 'REASON FOR REQUEST' : 'FAMILY INFORMATION')}
                    </h5>
                    {mode === 'childwelfare' ? (
                      <div className="space-y-3 text-xs">
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'DESKRIPSYON NG ALALAHANIN / PROBLEMA' : 'DESCRIPTION OF CONCERN / PROBLEM'}</span>
                          <p className={`font-medium leading-relaxed mt-0.5 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{concernDescription || 'N/A'}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                          <div>
                            <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'PETSA NG INSIDENTE' : 'DATE OF INCIDENT'}</span>
                            <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{incidentDate || 'N/A'}</span>
                          </div>
                          <div>
                            <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'LOKASYON NG INSIDENTE' : 'LOCATION OF INCIDENT'}</span>
                            <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{incidentLocation || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'MGA BATA SA PAMILYA' : 'CHILDREN IN FAMILY'}</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{numChildrenInFamily || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'MGA BATANG NAG-AARAL' : 'CHILDREN STUDYING'}</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{numChildrenStudying || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'BUWANANG KITA NG PAMILYA' : 'MONTHLY FAMILY INCOME'}</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{monthlyIncome}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>4PS / SOLO PARENT</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{is4psBeneficiary} / {isSoloParentBeneficiary}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{isTagalog ? 'BENEPISYARYO NG PWD' : 'PWD BENEFICIARY'}</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{isPwdBeneficiary}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Section D: Required Documents Card */}
            <div className={`border rounded-2xl overflow-hidden transition-all ${
              darkMode ? 'bg-[#0e1933]/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className={`p-4 border-b flex justify-between items-center ${darkMode ? 'border-slate-800 bg-[#091124]' : 'border-slate-200 bg-slate-50'}`}>
                <h4 className="text-xs font-extrabold tracking-wide uppercase text-blue-500 dark:text-blue-400 flex items-center gap-2">
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                  {isTagalog ? 'Mga Kailangang Dokumento' : 'Required documents'}
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
                {(mode === 'childwelfare'
                  ? [
                      { key: 'available', title: isTagalog ? 'I-UPLOAD ANG MGA MAGAGAMIT NA DOKUMENTO *' : 'UPLOAD AVAILABLE DOCUMENTS *', doc: docAvailable },
                      { key: 'referral', title: isTagalog ? 'LIHAM NG REFERRAL, KUNG NAAANGKOP (OPTIONAL)' : 'REFERRAL LETTER, IF APPLICABLE (OPTIONAL)', doc: docReferral },
                      { key: 'birthCert', title: isTagalog ? 'SERTIPIKASYON NG KAPANGANAKAN, KUNG MAYROON (OPTIONAL)' : 'BIRTH CERTIFICATE, IF AVAILABLE (OPTIONAL)', doc: docBirthCert },
                      { key: 'medicalPoliceBarangay', title: isTagalog ? 'DOKUMENTONG MEDIKAL/POLIS/BARANGAY, KUNG NAAANGKOP (OPTIONAL)' : 'MEDICAL/POLICE/BARANGAY DOCUMENTS, IF APPLICABLE (OPTIONAL)', doc: docMedicalPoliceBarangay },
                    ]
                  : mode === 'soloparent'
                  ? [
                      { key: 'indigency', title: isTagalog ? 'ORIHINAL NA BARANGAY CERTIFICATE OF INDIGENCY *' : 'ORIGINAL BARANGAY CERTIFICATE OF INDIGENCY *', doc: docIndigency },
                      { key: 'enrollment', title: isTagalog ? 'KATIBAYAN NG PAGPAPATALA (CERTIFICATE OF ENROLLMENT) *' : 'CERTIFICATE OF ENROLLMENT *', doc: docEnrollment },
                      { key: 'qcitizenId', title: isTagalog ? 'QCITIZEN ID *' : 'QCITIZEN ID *', doc: docQcitizenId },
                      { key: 'soloParentId', title: isTagalog ? 'SOLO PARENT ID / SERTIPIKASYON *' : 'SOLO PARENT ID / CERTIFICATION *', doc: docSoloParentId },
                    ]
                  : [
                      { key: 'indigency', title: isTagalog ? 'BARANGAY CERTIFICATE OF INDIGENCY – ORIHINAL (LAYUNIN: TULONG SA EDUKASYON) *' : 'BARANGAY CERTIFICATE OF INDIGENCY – ORIGINAL (PURPOSE: EDUCATIONAL ASSISTANCE) *', doc: docIndigency },
                      { key: 'enrollment', title: isTagalog ? 'KATIBAYAN NG PAGPAPATALA – ORIHINAL *' : 'CERTIFICATE OF ENROLLMENT – ORIGINAL *', doc: docEnrollment },
                      { key: 'schoolId', title: isTagalog ? 'BAGONG SCHOOL ID – KUNG MAYROON (OPTIONAL)' : 'RECENT SCHOOL ID – IF AVAILABLE (OPTIONAL)', doc: docSchoolId },
                      { key: 'govId', title: isTagalog ? 'VALID GOVERNMENT ID / MAS MAINAM NA QCITIZEN ID *' : 'VALID GOVERNMENT ID / PREFERABLY QCITIZEN ID *', doc: docGovId },
                    ]
                ).map((item) => (
                  <div key={item.key} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-extrabold uppercase tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {item.title}
                      </span>
                      {item.doc && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
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
                            <img src={item.doc.url || 'https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?w=500&auto=format&fit=crop&q=80'} alt={item.doc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
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
                        <span className={`text-xs italic ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{isTagalog ? 'Walang na-upload na litrato' : 'No photo uploaded'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
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
              className="px-8 py-3 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all bg-blue-600 hover:bg-blue-500 text-white"
            >
              {isTagalog ? 'IPASA' : 'SUBMIT'}
            </button>
          </div>
        </div>
      )}
        </div>
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
                {isTagalog ? 'Kumuha ng Litrato ng Dokumento' : 'Capture Document Photo'}
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
                {isTagalog ? 'Kanselahin' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleCapturePhoto}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md"
              >
                {isTagalog ? 'Kumuha ng Litrato' : 'Take Photo'}
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
                <GraduationCap className="w-5 h-5" />
                {isTagalog ? 'Mga Kailangan para sa Tulong sa Edukasyon sa QC' : 'QC Educational Assistance Requirements'}
              </h3>
              <button type="button" onClick={() => setShowReqModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`space-y-3 text-xs max-h-96 overflow-y-auto pr-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <p>
                <strong>{isTagalog ? 'Pangunahing Kwalipikasyon:' : 'Primary Qualification:'}</strong>{' '}
                {isTagalog 
                  ? 'Kapus-palad na residente ng Lungsod Quezon, rehistradong Batang May Kapansanan (CWD) o estudyanteng nakatala sa SPED / Pampublikong Paaralan.' 
                  : 'Indigent resident of Quezon City, registered Child with Disability (CWD) or student enrolled in SPED / Public School.'}
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{isTagalog ? 'Barangay Certificate of Indigency (inisyu sa nakalipas na 6 na buwan)' : 'Barangay Certificate of Indigency (issued within last 6 months)'}</li>
                <li>{isTagalog ? 'Valid QC ID o PhilSys ID ng Aplikante' : 'Valid QC ID or PhilSys ID of Applicant'}</li>
                <li>{isTagalog ? 'Katibayan ng Pagpapatala / Rehistrasyon sa Paaralan (SPED / Baitang 10 pababa)' : 'Certificate of Enrollment / School Registration (SPED / Grade 10 & below)'}</li>
                <li>{isTagalog ? 'PWD ID o Medikal na Sertipiko ng Kapansanan' : 'PWD ID or Medical Certificate of Disability'}</li>
                <li>{isTagalog ? 'Sertipiko ng Buwanang Kita ng Pamilya na Php13,873 o pababa' : 'Monthly Family Income Certificate of Php13,873 or below'}</li>
              </ul>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowReqModal(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
              >
                {isTagalog ? 'Isara' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};
