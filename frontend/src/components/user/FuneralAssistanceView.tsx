import React, { useState, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle2, 
  Upload, 
  ShieldCheck, 
  QrCode,
  Info,
  X,
  Cross,
  Camera,
  Pencil,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import type { ApplicationRecord } from '../../types';

interface FuneralAssistanceViewProps {
  onBack: () => void;
  onAddApplication: (app: ApplicationRecord) => void;
  darkMode?: boolean;
  applications?: ApplicationRecord[];
  onNavigateToModule?: (tab: string) => void;
}

// Utility to calculate age from Date of Birth and optional Date of Death string
const calculateDeceasedAge = (dobString: string, dodString?: string): string => {
  if (!dobString) return '';
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return '';

  const endDate = (dodString && dodString.trim() !== '') ? new Date(dodString) : new Date();
  if (isNaN(endDate.getTime())) return '';

  let calculatedAge = endDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = endDate.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birthDate.getDate())) {
    calculatedAge--;
  }
  return calculatedAge >= 0 ? String(calculatedAge) : '';
};

const burialDocRequirements = [
  {
    key: 'referral_form',
    title: 'REFERRAL FORM (OPTIONAL) – ORIGINAL COPY',
    subtitle: 'Maaaring manggaling sa Barangay, hospital, o accredited partner funeral service provider.',
    isOptional: true,
  },
  {
    key: 'death_cert',
    title: 'DEATH CERTIFICATE – ORIGINAL CERTIFIED TRUE COPY *',
    subtitle: '',
    isOptional: false,
  },
  {
    key: 'funeral_contract',
    title: 'NOTARIZED FUNERAL CONTRACT – ORIGINAL COPY *',
    subtitle: 'Mula sa QC-accredited/partner funeral home.',
    isOptional: false,
  },
  {
    key: 'indigency',
    title: 'BARANGAY CERTIFICATE OF INDIGENCY – ORIGINAL COPY *',
    subtitle: 'Dapat ang purpose ay “Burial/Funeral Assistance.”',
    isOptional: false,
  },
  {
    key: 'government_id',
    title: 'VALID ID NG INFORMANT/NEAREST KIN *',
    subtitle: 'Preferably QC ID.',
    isOptional: false,
  },
];

const ACCREDITED_FUNERAL_HOMES: Record<string, string[]> = {
  'District 1': [
    'Kristiana Funeral Services',
    'Elcielo Funeral'
  ],
  'District 2': [
    'Blessed Memorial Homes',
    'Catalonia Funeral Homes',
    'Heart of Mary Funeral Services',
    'Accredited Partner Funeral Services',
    'St. Fiacre Funeral Services',
    'Vivs Funeral Homes',
    'Rizalde Funeral Services',
    'Kaagapay mo Karamay Funeral Homes',
    'Precious JP Funeral Services',
    'St. Jacob Funeral Homes'
  ],
  'District 3': [
    'Bonita Memorial Homes',
    'St. James Memorial Chapel',
    'Amber Green Funeral Services',
    'St. Ignatius Funeral Homes Inc.',
    'Loyola Memorial Chapels and Crematorium Inc. – Commonwealth',
    'Dayao Funeral Home Inc.'
  ],
  'District 4': [
    'La Funeraria Paz, Inc.',
    'Wyn Funeral Services',
    'Aijel Funeral Services'
  ],
  'District 5': [
    'A & J Biglang Awa Funeral Homes',
    'Mananghaya Funeral Services',
    'D. Imperial Funeral Homes'
  ],
  'District 6': [
    'Ka Andres Memorial Chapel',
    'Ever Memorial Services',
    'Memory Funeral Services',
    'Cinco Estrellas Memorial Chapel Inc.',
    'Sauyo Funeral Service'
  ]
};

const QC_BARANGAY_DISTRICT_MAP: Record<string, string> = {
  // District 1
  'alicia': 'District 1', 'bagong pag-asa': 'District 1', 'bahay toro': 'District 1', 'balingasa': 'District 1',
  'bungad': 'District 1', 'damar': 'District 1', 'damayan': 'District 1', 'del monte': 'District 1',
  'doña josefa': 'District 1', 'katipunan': 'District 1', 'mariblo': 'District 1', 'masambong': 'District 1',
  'n.s. amoranto': 'District 1', 'nayong kanluran': 'District 1', 'paang bundok': 'District 1', 'paltok': 'District 1',
  'paraiso': 'District 1', 'phil-am': 'District 1', 'ramon magsaysay': 'District 1', 'salvacion': 'District 1',
  'san antonio': 'District 1', 'san isidro labrador': 'District 1', 'san jose': 'District 1', 'santa cruz': 'District 1',
  'santa teresita': 'District 1', 'santo cristo': 'District 1', 'santo niño': 'District 1', 'siena': 'District 1',
  'talayan': 'District 1', 'vasra': 'District 1', 'veterans village': 'District 1', 'west kamias': 'District 1',

  // District 2
  'bagong silangan': 'District 2', 'batasan hills': 'District 2', 'commonwealth': 'District 2',
  'holy spirit': 'District 2', 'payatas': 'District 2',

  // District 3
  'amihan': 'District 3', 'bagumbayan': 'District 3', 'bayanihan': 'District 3',
  'blue ridge a': 'District 3', 'blue ridge b': 'District 3', 'camp aguinaldo': 'District 3', 'claro': 'District 3',
  'dioquino zobel': 'District 3', 'duyan-duyan': 'District 3', 'e. rodriguez': 'District 3', 'east kamias': 'District 3',
  'escopa i': 'District 3', 'escopa ii': 'District 3', 'escopa iii': 'District 3', 'escopa iv': 'District 3',
  'kaunlaran': 'District 3', 'libis': 'District 3', 'loyola heights': 'District 3', 'mangga': 'District 3',
  'marilag': 'District 3', 'masagana': 'District 3', 'matandang balara': 'District 3', 'milagrosa': 'District 3',
  'pansol': 'District 3', 'quirino 2-a': 'District 3', 'quirino 2-b': 'District 3', 'quirino 2-c': 'District 3',
  'quirino 3-a': 'District 3', 'san roque': 'District 3', 'silangan': 'District 3', 'socorro': 'District 3',
  'tagumpay': 'District 3', 'ugong norte': 'District 3', 'villa maria clara': 'District 3', 'white plains': 'District 3',

  // District 4
  'central': 'District 4', 'damayang lagi': 'District 4', 'doña imelda': 'District 4', 'horseshoe': 'District 4',
  'immaculada concepcion': 'District 4', 'kalusugan': 'District 4', 'kamuning': 'District 4', 'kristong hari': 'District 4',
  'laging handa': 'District 4', 'malaya': 'District 4', 'mariana': 'District 4', 'obrero': 'District 4',
  'paligsahan': 'District 4', 'pinagkaisahan': 'District 4', 'pinyahan': 'District 4', 'roxas': 'District 4',
  'sacred heart': 'District 4', 'san isidro': 'District 4', 'san martin de porres': 'District 4', 'santol': 'District 4',
  'sikatuna village': 'District 4', 'south trinity': 'District 4', 'tatalon': 'District 4', 'teachers village east': 'District 4',
  'teachers village west': 'District 4', 'u.p. campus': 'District 4', 'u.p. village': 'District 4', 'valencia': 'District 4',

  // District 5
  'bagbag': 'District 5', 'capri': 'District 5', 'fairview': 'District 5', 'greater lagro': 'District 5',
  'gulod': 'District 5', 'kaligayahan': 'District 5', 'nagkaisang nayon': 'District 5', 'novaliches proper': 'District 5',
  'pasong putik proper': 'District 5', 'san agustin': 'District 5', 'san bartolome': 'District 5', 'santa lucia': 'District 5',
  'santa monica': 'District 5',

  // District 6
  'apolonio samson': 'District 6', 'baesa': 'District 6', 'balon-bato': 'District 6', 'culiat': 'District 6',
  'new era': 'District 6', 'pasong tamo': 'District 6', 'sangandaan': 'District 6', 'sauyo': 'District 6',
  'tandang sora': 'District 6', 'unang sigaw': 'District 6'
};

const getDistrictFromBarangay = (brgyName: string): string => {
  if (!brgyName) return '';
  const normalized = brgyName.trim().toLowerCase();
  return QC_BARANGAY_DISTRICT_MAP[normalized] || '';
};

export const FuneralAssistanceView: React.FC<FuneralAssistanceViewProps> = ({
  onBack,
  onAddApplication,
  darkMode = true,
  applications,
  onNavigateToModule,
}) => {
  const { language } = useLanguage();
  const isTagalog = language === 'Tagalog';
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

  // Step 1 Form States (Eligibility Questions)
  const [isDeceasedQCResident, setIsDeceasedQCResident] = useState<string>('Yes');
  const [relationToDeceased, setRelationToDeceased] = useState<string>(''); // 'Child' | 'Parent' | 'Sibling' | 'Spouse' | 'Others'
  const [selectedFuneralHome, setSelectedFuneralHome] = useState<string>('');
  const [showReqModal, setShowReqModal] = useState<boolean>(false);

  // Step 2 Form States - Applicant Information (Prefilled & Disabled Verified Profile)
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

  // Step 2 Form States - Deceased Information
  const [deceasedFirstName, setDeceasedFirstName] = useState<string>('');
  const [deceasedMiddleName, setDeceasedMiddleName] = useState<string>('');
  const [deceasedLastName, setDeceasedLastName] = useState<string>('');
  const [deceasedSuffix, setDeceasedSuffix] = useState<string>('');
  const [deceasedGender, setDeceasedGender] = useState<string>('');
  const [deceasedDob, setDeceasedDob] = useState<string>('');
  const [deceasedDateOfDeath, setDeceasedDateOfDeath] = useState<string>('');
  const [deceasedAge, setDeceasedAge] = useState<string>('');
  const [deceasedCremationOrBurial, setDeceasedCremationOrBurial] = useState<string>('');
  const [burialLocationSite, setBurialLocationSite] = useState<string>('');
  const [otherBurialLocation, setOtherBurialLocation] = useState<string>('');
  const [cremationLocationSite, setCremationLocationSite] = useState<string>('');
  const [otherCremationLocation, setOtherCremationLocation] = useState<string>('');
  const [deceasedPlaceOfDeath, setDeceasedPlaceOfDeath] = useState<string>('');
  const [deceasedDateOfBurial, setDeceasedDateOfBurial] = useState<string>('');

  const [sameAsApplicantAddress, setSameAsApplicantAddress] = useState<boolean>(false);
  const [deceasedHouseNo, setDeceasedHouseNo] = useState<string>('');
  const [deceasedStreet, setDeceasedStreet] = useState<string>('');
  const [deceasedBarangay, setDeceasedBarangay] = useState<string>('');

  const [funeralDistrict, setFuneralDistrict] = useState<string>('');
  const [funeralHomeName, setFuneralHomeName] = useState<string>('');

  // Auto-calculate applicant age from DOB
  React.useEffect(() => {
    if (dob) {
      const calcAge = calculateDeceasedAge(dob);
      if (calcAge) setAge(calcAge);
    }
  }, [dob]);

  // Auto-calculate deceased age from Date of Birth and Date of Death
  React.useEffect(() => {
    if (!deceasedDob && !deceasedDateOfDeath) {
      setDeceasedAge('');
      return;
    }
    const calcAge = calculateDeceasedAge(deceasedDob, deceasedDateOfDeath);
    setDeceasedAge(calcAge);
  }, [deceasedDob, deceasedDateOfDeath]);

  // Auto sync / clear address when "Same as applicant's address" is checked / unchecked & detect district
  React.useEffect(() => {
    if (sameAsApplicantAddress) {
      setDeceasedHouseNo(houseNo);
      setDeceasedStreet(street);
      setDeceasedBarangay(barangay);
      const detected = getDistrictFromBarangay(barangay);
      if (detected) {
        setFuneralDistrict(detected);
      }
    }
  }, [sameAsApplicantAddress, houseNo, street, barangay]);

  // Auto-detect district when deceasedBarangay changes
  React.useEffect(() => {
    if (deceasedBarangay) {
      const detected = getDistrictFromBarangay(deceasedBarangay);
      if (detected) {
        setFuneralDistrict(detected);
      }
    }
  }, [deceasedBarangay]);

  // Step 3 Form States
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File }>({});
  const [uploadedDocData, setUploadedDocData] = useState<{ [key: string]: { name: string; size: string; type: string; dataUrl: string } }>({});

  // Step 4 Form States
  const [isCertified, setIsCertified] = useState<boolean>(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [submittedAppRecord, setSubmittedAppRecord] = useState<ApplicationRecord | null>(null);

  // Accredited Partner Funeral Homes List (matching screenshot 3)
  const funeralHomesList = [
    'Accredited Partner Funeral Services',
    'St. Fiacre Funeral Service',
    'Vivs Funeral Homes',
    'Rizalde Funeral Services',
    'Kaagapay Mo Karamay Funeral Homes Co.',
    'Bonita Memorial Homes',
    'St. James Memorial Chapel',
    'Amber Green Funeral Services',
    'Dayao Funeral Home Incorporated',
    'La Funeraria Paz, Inc.',
    'Wyn Funeral Services',
    'St. Ignatius Funeral Homes Inc.',
    'Aijel Funeral Services',
    'A & J Biglang-awa Funeral Homes',
    'Precious JP Funeral Services',
    'D. Imperial Funeral Services',
    'Ka Andres Memorial Chapel',
    'Memory Funeral Service',
    'Cinco Estrellas Memorial Chapels Inc.',
    'Others'
  ];

  // Validation: Next button in Step 1 MUST only enable when relation and funeral home are selected!
  const isStep1Complete = Boolean(
    relationToDeceased !== '' && 
    selectedFuneralHome !== ''
  );

  // Camera Modal State & Handlers
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
          const file = new File([blob], `${activeCameraKey}_camera_photo.jpg`, { type: 'image/jpeg' });
          setUploadedFiles(prev => ({ ...prev, [activeCameraKey]: file }));
          const reader = new FileReader();
          reader.onloadend = () => {
            setUploadedDocData(prev => ({
              ...prev,
              [activeCameraKey]: {
                name: file.name,
                size: `${(file.size / 1024).toFixed(1)} KB`,
                type: file.type,
                dataUrl: reader.result as string
              }
            }));
          };
          reader.readAsDataURL(file);
        }
        handleCloseCamera();
      }, 'image/jpeg', 0.9);
    }
  };

  const handleFileUpload = (reqKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFiles(prev => ({ ...prev, [reqKey]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedDocData(prev => ({
          ...prev,
          [reqKey]: {
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            type: file.type,
            dataUrl: reader.result as string
          }
        }));
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
    const newRefNo = `QC-AICS-2026-FUN-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullName = [firstName, middleName, lastName, suffix].filter(Boolean).join(' ') || 'JEFFERSON FERNANDO LEE';
    const deceasedName = [deceasedFirstName, deceasedMiddleName, deceasedLastName, deceasedSuffix].filter(Boolean).join(' ') || 'Deceased Beneficiary';

    const appDetails = {
      category: 'AICS Funeral & Burial Assistance Services',
      assistanceType: 'Funeral / Burial Aid',
      hospitalFacility: funeralHomeName || selectedFuneralHome || 'Accredited Funeral Home Partner',
      medicalCondition: `Burial Assistance Request (${funeralHomeName || selectedFuneralHome || 'Partner Funeral Parlor'})`,

      // Step 2 Applicant
      qcId,
      applicantName: fullName,
      firstName: firstName || 'JEFFERSON',
      middleName: middleName || 'FERNANDO',
      lastName: lastName || 'LEE',
      suffix,
      nationality,
      dob: dob || '2004-09-27',
      age: age || '22',
      gender: gender || 'Male',
      civilStatus: civilStatus || 'Single',
      houseNo: houseNo || '176',
      street: street || '23',
      barangay: barangay || 'Bagong Silangan',
      fullAddress: [houseNo, street, barangay, 'Quezon City'].filter(Boolean).join(', ') || '176, 23, Brgy. Bagong Silangan, Quezon City',
      phone: phone || '09155582122',

      // Step 2 Deceased Patient
      isApplicantPatient: false,
      patientRelation: relationToDeceased || 'Deceased Family Member',
      patientName: deceasedName,
      patientFirstName: deceasedFirstName,
      patientMiddleName: deceasedMiddleName,
      patientLastName: deceasedLastName,
      patientSuffix: deceasedSuffix,
      patientGender: deceasedGender || 'N/A',
      patientDob: deceasedDob || 'N/A',
      patientAge: deceasedAge || 'N/A',
      patientAddress: [deceasedHouseNo, deceasedStreet, deceasedBarangay, 'Quezon City'].filter(Boolean).join(', ') || `Brgy. ${barangay || 'Bagong Silangan'}, Quezon City`,

      // Funeral Assistance Specific Fields
      funeralDistrict: funeralDistrict || 'District 2',
      funeralHomeName: (funeralHomeName || selectedFuneralHome || 'Accredited Funeral Services').replace(/Nieto\s*/gi, ''),
      selectedFuneralHome: (selectedFuneralHome || funeralHomeName || 'Accredited Funeral Services').replace(/Nieto\s*/gi, ''),
      deceasedDateOfDeath,
      deceasedCremationOrBurial,
      burialLocationSite,
      otherBurialLocation,
      cremationLocationSite,
      otherCremationLocation,
      deceasedPlaceOfDeath,
      deceasedDateOfBurial,
      deceasedHouseNo,
      deceasedStreet,
      deceasedBarangay,

      // Step 3 Uploads
      uploadedFiles: Object.keys(uploadedFiles).length > 0 ? Object.keys(uploadedFiles) : ['Death Certificate', 'Indigency Certificate', 'Funeral Contract', 'PhilSys ID'],
      uploadedDocData: uploadedDocData
    };

    const newApp: ApplicationRecord = {
      referenceNo: newRefNo,
      applicantName: fullName,
      serviceName: `QC Funeral Assistance — Guarantee Letter (${(funeralHomeName || selectedFuneralHome || 'Partner Funeral Parlor').replace(/Nieto\s*/gi, '')})`,
      category: 'AICS',
      assistanceType: 'Funeral / Burial Aid',
      hospitalFacility: funeralHomeName || selectedFuneralHome || 'Accredited Funeral Home Partner',
      medicalCondition: `Burial Assistance Request (${funeralHomeName || selectedFuneralHome || 'Partner Funeral Parlor'})`,
      dateSubmitted: `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
      status: 'Under Review',
      amountOrType: 'P25,000 Guarantee Voucher / Funeral Aid',
      assignedSocialWorker: 'Social Worker Maria Santos, RSW (QC CSWDO)',
      details: appDetails
    };

    onAddApplication(newApp);
    setSubmittedAppRecord(newApp);
  };

  if (submittedAppRecord) {
    return (
      <div className="max-w-md mx-auto my-6 animate-in fade-in zoom-in-95 duration-300">
        <div className={`p-5 sm:p-6 rounded-2xl border text-center space-y-4 ${
          darkMode ? 'bg-[#0b1426] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">Application Successfully Submitted</h3>
            <p className={`text-xs max-w-sm mx-auto leading-normal ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Your application for <span className="font-bold text-blue-400">QC Funeral Assistance</span> has been successfully submitted.
            </p>
          </div>

          <div className={`p-4 rounded-xl border text-left space-y-2.5 font-mono ${
            darkMode ? 'bg-[#060c18] border-slate-800/90' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-xs">
              <span className={`text-[11px] font-sans font-medium uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Application Reference No.:
              </span>
              <span className="font-bold text-blue-400 text-xs sm:text-sm">{submittedAppRecord.referenceNo}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-xs pt-2 border-t border-slate-800/60">
              <span className={`text-[11px] font-sans font-medium uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Date Filed:
              </span>
              <span className={`font-bold text-xs ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
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
                    {isTagalog ? 'Mga Kailangan sa Aplikasyon ng QC Funeral Assistance' : 'Requirements for Application of QC Funeral Assistance'}
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
                      if (stepNum < currentStep || (stepNum === 2 && isStep1Complete)) {
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
                    if (step.num < currentStep || (step.num === 2 && isStep1Complete)) {
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
            /* STEP 1: COMPLETE CHECKLIST (MATCHING USER SCREENSHOTS 1, 2, 3) */
            <div className="space-y-6 max-w-3xl mx-auto">
              
              {/* Top Primary Requirements Notice Box */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                darkMode ? 'bg-[#0e1e3b] border-blue-900/60 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}>
                <Info className={`w-5 h-5 shrink-0 mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                    FUNERAL ASSISTANCE — PRIMARY REQUIREMENTS
                  </h4>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Complete the primary qualification questions below and prepare the required documents to proceed with your application.
                  </p>
                </div>
              </div>

              {/* ELIGIBILITY SECTION */}
              <div className="space-y-6 pt-2">
                <h3 className={`text-sm font-extrabold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  ELIGIBILITY
                </h3>

                {/* Question 1: What is your relation to the deceased? */}
                <div className="space-y-2.5">
                  <label className={`text-xs font-bold block ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    What is your relation to the deceased? *
                  </label>
                  <div className="space-y-2">
                    {['Child', 'Parent', 'Sibling', 'Spouse', 'Others'].map((rel) => (
                      <label key={rel} className={`flex items-center gap-2 text-xs cursor-pointer ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <input
                          type="radio"
                          name="relationDeceased"
                          value={rel}
                          checked={relationToDeceased === rel}
                          onChange={(e) => setRelationToDeceased(e.target.value)}
                          className={`w-4 h-4 text-blue-600 focus:ring-blue-500 ${
                            darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
                          }`}
                        />
                        <span>{rel}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Question 2: Choose a Funeral Home Dropdown */}
                <div className="space-y-2">
                  <label className={`text-xs font-bold block ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    If you already have a funeral home, select which funeral home provided the service *
                  </label>
                  <select
                    value={selectedFuneralHome}
                    onChange={(e) => setSelectedFuneralHome(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none focus:border-blue-500 transition-all ${
                      darkMode
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="">Choose a funeral home</option>
                    {funeralHomesList.map((home) => (
                      <option key={home} value={home}>
                        {home}
                      </option>
                    ))}
                  </select>
                  <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Please choose a partner funeral home. If your chosen funeral home is not listed, select 'Others'.
                  </p>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className={`pt-6 border-t flex justify-end ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  disabled={!isStep1Complete}
                  onClick={() => handleNextStep(2)}
                  className={`px-8 py-3 rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all ${
                    isStep1Complete
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : darkMode
                      ? 'bg-[#18243c] text-slate-500 cursor-not-allowed border border-slate-800'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  }`}
                >
                  NEXT
                </button>
              </div>
            </div>
          ) : currentStep === 2 ? (
            /* STEP 2: PERSONAL INFORMATION (Matching exact QCID Screenshots 1, 2 & 3) */
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
              
              {/* IMPORTANT REMINDER Box */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                darkMode ? 'bg-[#0e1d3d] border-blue-800/60 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}>
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300">
                    IMPORTANT REMINDER
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Please make sure the information on your QCID is correct and complete. If any detail is missing or incorrect, contact the QCID Team to update your QCID records before continuing your application. Accurate information is important for fast and smooth processing of your service.
                  </p>
                </div>
              </div>

              {/* APPLICANT INFORMATION GRID (Prefilled & Disabled Verified Profile) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>First name *</label>
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
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Middle name</label>
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
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Last name *</label>
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
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Suffix (Jr., Sr., III, etc.)</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    placeholder="Suffix (Jr., Sr., III, etc.)"
                    value={suffix}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-not-allowed ${
                      darkMode ? 'bg-slate-950 border border-slate-800 text-slate-300 placeholder-slate-600' : 'bg-slate-100 border border-slate-300 text-slate-800 placeholder-slate-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Nationality *</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={nationality || 'FILIPINO'}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-not-allowed ${
                      darkMode ? 'bg-slate-950 border border-slate-800 text-slate-300' : 'bg-slate-100 border border-slate-300 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Date of birth *</label>
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
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Age *</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={age || '22'}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold cursor-not-allowed ${
                      darkMode ? 'bg-slate-950 border border-slate-800 text-slate-300' : 'bg-slate-100 border border-slate-300 text-slate-800'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Gender *</label>
                  <select
                    disabled
                    value={gender || 'Male'}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-not-allowed appearance-none ${
                      darkMode ? 'bg-slate-950 border border-slate-800 text-slate-300' : 'bg-slate-100 border border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Civil status *</label>
                  <select
                    disabled
                    value={civilStatus || 'Single'}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-not-allowed appearance-none ${
                      darkMode ? 'bg-slate-950 border border-slate-800 text-slate-300' : 'bg-slate-100 border border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                  </select>
                </div>
                <div>
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>House/Building number *</label>
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
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Street name *</label>
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
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Barangay *</label>
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
                  <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Phone number *</label>
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

              {/* DECEASED INFORMATION SECTION (Matching Screenshot 3) */}
              <div className={`pt-6 border-t space-y-4 ${darkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
                <h3 className={`text-sm font-extrabold tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Deceased Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>First name *</label>
                    <input
                      type="text"
                      value={deceasedFirstName}
                      onChange={(e) => setDeceasedFirstName(e.target.value)}
                      placeholder="First name"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                        darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white placeholder-slate-500' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Middle name</label>
                    <input
                      type="text"
                      value={deceasedMiddleName}
                      onChange={(e) => setDeceasedMiddleName(e.target.value)}
                      placeholder="Middle name"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                        darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white placeholder-slate-500' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Last name *</label>
                    <input
                      type="text"
                      value={deceasedLastName}
                      onChange={(e) => setDeceasedLastName(e.target.value)}
                      placeholder="Last name"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                        darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white placeholder-slate-500' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Suffix (Jr., Sr., III, etc.)</label>
                    <input
                      type="text"
                      value={deceasedSuffix}
                      onChange={(e) => setDeceasedSuffix(e.target.value)}
                      placeholder="Suffix (Jr., Sr., III, etc.)"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                        darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white placeholder-slate-500' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Gender *</label>
                    <select
                      value={deceasedGender}
                      onChange={(e) => setDeceasedGender(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs ${
                        darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white' : 'bg-white border border-slate-300 text-slate-900 shadow-sm'
                      }`}
                    >
                      <option value="">Please choose</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Date of birth *</label>
                    <input
                      type="date"
                      value={deceasedDob}
                      onChange={(e) => setDeceasedDob(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                        darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white' : 'bg-white border border-slate-300 text-slate-900 shadow-sm'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Date of death *</label>
                    <input
                      type="date"
                      value={deceasedDateOfDeath}
                      onChange={(e) => setDeceasedDateOfDeath(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                        darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white' : 'bg-white border border-slate-300 text-slate-900 shadow-sm'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Age *</label>
                    <input
                      type="text"
                      value={deceasedAge}
                      readOnly
                      placeholder="Auto-computed from DOB & Death"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold select-none ${
                        darkMode 
                          ? 'bg-slate-900/60 border border-slate-700 text-cyan-400 placeholder-slate-500' 
                          : 'bg-slate-100 border border-slate-300 text-blue-700 placeholder-slate-400 shadow-sm'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Cremation or burial *</label>
                    <select
                      value={deceasedCremationOrBurial}
                      onChange={(e) => {
                        setDeceasedCremationOrBurial(e.target.value);
                        setBurialLocationSite('');
                        setOtherBurialLocation('');
                        setCremationLocationSite('');
                        setOtherCremationLocation('');
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs ${
                        darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white' : 'bg-white border border-slate-300 text-slate-900 shadow-sm'
                      }`}
                    >
                      <option value="">Please choose</option>
                      <option value="Burial">Burial</option>
                      <option value="Cremation">Cremation</option>
                    </select>
                  </div>

                  {/* Conditional Burial Site Fields */}
                  {deceasedCremationOrBurial === 'Burial' && (
                    <>
                      <div>
                        <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Where will it be buried *</label>
                        <select
                          value={burialLocationSite}
                          onChange={(e) => setBurialLocationSite(e.target.value)}
                          className={`w-full px-3 py-2.5 rounded-xl text-xs ${
                            darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white' : 'bg-white border border-slate-300 text-slate-900 shadow-sm'
                          }`}
                        >
                          <option value="">Select burial site...</option>
                          <option value="Bagbag Public Cemetery">Bagbag Public Cemetery</option>
                          <option value="Novaliches Public Cemetery">Novaliches Public Cemetery</option>
                          <option value="Others (Specify)">Others (Specify)</option>
                        </select>
                      </div>

                      {burialLocationSite === 'Others (Specify)' && (
                        <div>
                          <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Specify the burial location *</label>
                          <input
                            type="text"
                            value={otherBurialLocation}
                            onChange={(e) => setOtherBurialLocation(e.target.value)}
                            placeholder="Name of cemetery/place"
                            className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                              darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white placeholder-slate-500' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                            }`}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Conditional Cremation Site Fields */}
                  {deceasedCremationOrBurial === 'Cremation' && (
                    <>
                      <div>
                        <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Where will it be cremated *</label>
                        <select
                          value={cremationLocationSite}
                          onChange={(e) => setCremationLocationSite(e.target.value)}
                          className={`w-full px-3 py-2.5 rounded-xl text-xs ${
                            darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white' : 'bg-white border border-slate-300 text-slate-900 shadow-sm'
                          }`}
                        >
                          <option value="">Select cremation site...</option>
                          <option value="Baesa Crematorium">Baesa Crematorium</option>
                          <option value="Others (Specify)">Others (Specify)</option>
                        </select>
                      </div>

                      {cremationLocationSite === 'Others (Specify)' && (
                        <div>
                          <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Specify the cremation location *</label>
                          <input
                            type="text"
                            value={otherCremationLocation}
                            onChange={(e) => setOtherCremationLocation(e.target.value)}
                            placeholder="Name of crematorium/place"
                            className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                              darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white placeholder-slate-500' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                            }`}
                          />
                        </div>
                      )}
                    </>
                  )}

                  <div className="md:col-span-2">
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Place of death *</label>
                    <input
                      type="text"
                      value={deceasedPlaceOfDeath}
                      onChange={(e) => setDeceasedPlaceOfDeath(e.target.value)}
                      placeholder="Place of death"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                        darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white placeholder-slate-500' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Date of burial</label>
                    <input
                      type="date"
                      value={deceasedDateOfBurial}
                      onChange={(e) => setDeceasedDateOfBurial(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                        darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white' : 'bg-white border border-slate-300 text-slate-900 shadow-sm'
                      }`}
                    />
                  </div>
                </div>

                {/* Same as Applicant Address Checkbox */}
                <div className="pt-2">
                  <label className={`flex items-center gap-2 cursor-pointer text-xs font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    <input
                      type="checkbox"
                      checked={sameAsApplicantAddress}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSameAsApplicantAddress(checked);
                        if (checked) {
                          setDeceasedHouseNo(houseNo);
                          setDeceasedStreet(street);
                          setDeceasedBarangay(barangay);
                          const detected = getDistrictFromBarangay(barangay);
                          if (detected) {
                            setFuneralDistrict(detected);
                          }
                        } else {
                          // Clear auto-filled address & funeral fields when unchecked
                          setDeceasedHouseNo('');
                          setDeceasedStreet('');
                          setDeceasedBarangay('');
                          setFuneralDistrict('');
                          setFuneralHomeName('');
                        }
                      }}
                      className={`w-4 h-4 text-blue-600 rounded ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                    />
                    <span>Same as applicant's address</span>
                  </label>
                </div>

                {/* Deceased Address Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>House/Building number *</label>
                    <input
                      type="text"
                      value={deceasedHouseNo}
                      onChange={(e) => setDeceasedHouseNo(e.target.value)}
                      placeholder="House/Building number"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                        darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white placeholder-slate-500' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Street name *</label>
                    <input
                      type="text"
                      value={deceasedStreet}
                      onChange={(e) => setDeceasedStreet(e.target.value)}
                      placeholder="Street name"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                        darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white placeholder-slate-500' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Barangay *</label>
                    <input
                      type="text"
                      value={deceasedBarangay}
                      onChange={(e) => setDeceasedBarangay(e.target.value)}
                      placeholder="Barangay"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs ${
                        darkMode ? 'bg-[#0f1c38] border border-slate-700 text-white placeholder-slate-500' : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
                      }`}
                    />
                  </div>
                </div>

                {/* Accredited Funeral Home Details Section */}
                <div className={`mt-6 pt-5 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className="mb-4">
                    <h4 className={`text-xs font-extrabold uppercase tracking-wider ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                      Accredited Funeral Home Details
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Funeral Home District Dropdown */}
                    <div>
                      <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        Funeral Home District *
                      </label>
                      <select
                        value={funeralDistrict}
                        onChange={(e) => {
                          setFuneralDistrict(e.target.value);
                          setFuneralHomeName('');
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium ${
                          darkMode
                            ? 'bg-[#0f1c38] border border-slate-700 text-white'
                            : 'bg-white border border-slate-300 text-slate-900 shadow-sm'
                        }`}
                      >
                        <option value="">Select District</option>
                        <option value="District 1">District 1</option>
                        <option value="District 2">District 2</option>
                        <option value="District 3">District 3</option>
                        <option value="District 4">District 4</option>
                        <option value="District 5">District 5</option>
                        <option value="District 6">District 6</option>
                      </select>
                      {funeralDistrict && (
                        <span className="text-[10px] text-blue-400 mt-1 block font-semibold">
                          ✓ Auto-detected / Selected: {funeralDistrict}
                        </span>
                      )}
                    </div>

                    {/* Accredited Funeral Home Dropdown */}
                    <div>
                      <label className={`text-xs font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        Accredited Funeral Home *
                      </label>
                      <select
                        value={funeralHomeName}
                        onChange={(e) => setFuneralHomeName(e.target.value)}
                        disabled={!funeralDistrict}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium ${
                          !funeralDistrict
                            ? darkMode
                              ? 'bg-slate-900/50 border border-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                            : darkMode
                            ? 'bg-[#0f1c38] border border-slate-700 text-white'
                            : 'bg-white border border-slate-300 text-slate-900 shadow-sm'
                        }`}
                      >
                        <option value="">
                          {funeralDistrict ? 'Select Funeral Home' : 'Please select a District first'}
                        </option>
                        {funeralDistrict &&
                          ACCREDITED_FUNERAL_HOMES[funeralDistrict]?.map((home) => (
                            <option key={home} value={home}>
                              {home}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Navigation Buttons */}
              <div className={`pt-6 border-t flex justify-between ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className={`px-6 py-3 rounded-xl font-extrabold text-xs uppercase border transition-all ${
                    darkMode ? 'bg-[#18243c] hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  BACK
                </button>
                <button
                  type="button"
                  onClick={() => handleNextStep(3)}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs tracking-wider rounded-xl uppercase transition-all"
                >
                  NEXT
                </button>
              </div>
            </div>
          ) : currentStep === 3 ? (
            /* STEP 3: UPLOAD DOCUMENTS */
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
              <div className="space-y-1 mb-6">
                <h3 className={`text-base sm:text-lg font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>File upload</h3>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Make sure to upload the appropriate documents for each category and verify that all details—such as your full name (first, middle, and last name) and address—match the information on your QC ID.
                </p>
                <p className={`text-xs leading-relaxed mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Upload clear and legible copies of the required documents (JPG, JPEG, PNG, WEBP, or PDF).
                </p>
              </div>

              <div className="space-y-4">
                {burialDocRequirements.map((doc) => {
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-extrabold tracking-wide uppercase ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {doc.title}
                          </span>
                          {uploaded && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/20 shrink-0" />
                          )}
                        </div>
                        {doc.subtitle && (
                          <p className={`text-[11px] font-medium mt-1 ${darkMode ? 'text-blue-300/90' : 'text-blue-700'}`}>
                            • {doc.subtitle}
                          </p>
                        )}
                        <span className={`text-[11px] block mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Allowed file types: JPG, JPEG, PNG, WEBP (or capture using Camera)
                        </span>
                      </div>

                      {/* Always-visible action buttons */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <label className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold cursor-pointer inline-flex items-center gap-2 transition-all shadow-md">
                          <Upload className="w-4 h-4" />
                          <span>UPLOAD PHOTO</span>
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
                          <span>TAKE PHOTO (CAMERA)</span>
                        </button>
                      </div>

                      {/* Uploaded Card Thumbnail Preview */}
                      {uploaded && previewUrl && (
                        <div className="pt-2">
                          <div className={`relative w-36 border rounded-2xl p-2.5 flex flex-col items-center shadow-xl group ${
                            darkMode ? 'bg-[#091124] border-slate-700/90' : 'bg-white border-slate-200'
                          }`}>
                            {/* Floating X Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(doc.key)}
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
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Truncated Filename */}
                            <span className={`text-[10px] font-bold text-center truncate max-w-full mt-2 block px-1 ${
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
                  BACK
                </button>
                <button
                  type="button"
                  onClick={() => handleNextStep(4)}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl uppercase"
                >
                  NEXT
                </button>
              </div>
            </div>
          ) : (
            /* STEP 4: REVIEW & SUBMIT */
            <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
              <div className="space-y-1 mb-4">
                <h3 className={`text-base sm:text-lg font-extrabold tracking-wide uppercase ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  REVIEW YOUR APPLICATION
                </h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Please review all information carefully before submitting your application. You can edit any section by clicking the edit button.
                </p>
              </div>

              <div className="space-y-4">
                {/* 1. Requirements Section Card */}
                <div className={`border rounded-2xl overflow-hidden ${darkMode ? 'bg-[#0e1933]/60 border-slate-800' : 'bg-slate-50/80 border-slate-200 shadow-sm'}`}>
                  <div className={`p-4 flex items-center justify-between border-b ${darkMode ? 'bg-[#101c38] border-slate-800/80' : 'bg-slate-100 border-slate-200'}`}>
                    <div className="flex items-center gap-2">
                      <ChevronUp className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                      <h4 className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Requirements</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEditStepFromReview(1)}
                      className="text-xs font-extrabold text-blue-500 hover:text-blue-400 flex items-center gap-1.5 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>EDIT</span>
                    </button>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                        Relation to Deceased: <span className={`font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{relationToDeceased || 'N/A'}</span>
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                        Chosen Funeral Home: <span className="text-amber-500 font-extrabold">{selectedFuneralHome || 'La Funeraria Paz, Inc.'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Personal Information Section Card */}
                <div className={`border rounded-2xl overflow-hidden ${darkMode ? 'bg-[#0e1933]/60 border-slate-800' : 'bg-slate-50/80 border-slate-200 shadow-sm'}`}>
                  <div className={`p-4 flex items-center justify-between border-b ${darkMode ? 'bg-[#101c38] border-slate-800/80' : 'bg-slate-100 border-slate-200'}`}>
                    <div className="flex items-center gap-2">
                      <ChevronUp className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                      <h4 className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Personal information</h4>
                    </div>
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
                        <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{dob || '27/09/2004'}</span>
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

                    {/* Deceased Information Sub-section */}
                    <div className={`pt-4 border-t space-y-4 ${darkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
                      <h5 className={`text-xs font-extrabold tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Deceased Information
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>RELATIONSHIP TO DECEASED</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{relationToDeceased || 'Child'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>FIRST NAME</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{deceasedFirstName || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>MIDDLE NAME</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{deceasedMiddleName || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>LAST NAME</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{deceasedLastName || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>SUFFIX</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{deceasedSuffix || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>GENDER</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{deceasedGender || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>DATE OF BIRTH</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{deceasedDob || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>DATE OF DEATH</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{deceasedDateOfDeath || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>AGE</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{deceasedAge || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>CREMATION OR BURIAL</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{deceasedCremationOrBurial || 'N/A'}</span>
                        </div>
                        {deceasedCremationOrBurial === 'Burial' && (
                          <div>
                            <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>BURIAL LOCATION</span>
                            <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {burialLocationSite === 'Others (Specify)' ? otherBurialLocation : burialLocationSite || 'N/A'}
                            </span>
                          </div>
                        )}
                        {deceasedCremationOrBurial === 'Cremation' && (
                          <div>
                            <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>CREMATION LOCATION</span>
                            <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {cremationLocationSite === 'Others (Specify)' ? otherCremationLocation : cremationLocationSite || 'N/A'}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>PLACE OF DEATH</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{deceasedPlaceOfDeath || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>DATE OF BURIAL</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{deceasedDateOfBurial || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>HOUSE / BUILDING NUMBER</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{deceasedHouseNo || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>STREET NAME</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{deceasedStreet || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>BARANGAY</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{deceasedBarangay || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>FUNERAL HOME DISTRICT</span>
                          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{funeralDistrict || 'N/A'}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold block uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>ACCREDITED FUNERAL HOME</span>
                          <span className="font-extrabold text-amber-500">{funeralHomeName || 'N/A'}</span>
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
                      <h4 className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Required documents</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="text-xs font-extrabold text-blue-500 hover:text-blue-400 flex items-center gap-1.5 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>EDIT</span>
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    {burialDocRequirements.map((doc) => {
                      const file = uploadedFiles[doc.key];
                      const previewUrl = file ? URL.createObjectURL(file) : null;
                      return (
                        <div key={doc.key} className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-extrabold uppercase tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {doc.title}
                            </span>
                            {file && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          </div>
                          {doc.subtitle && (
                            <p className={`text-[11px] font-medium ${darkMode ? 'text-blue-300/80' : 'text-blue-600'}`}>
                              • {doc.subtitle}
                            </p>
                          )}
                          {previewUrl ? (
                            <div className="pt-1">
                              <div className={`w-36 border rounded-2xl p-2.5 flex flex-col items-center shadow-lg ${
                                darkMode ? 'bg-[#091124] border-slate-700/90' : 'bg-white border-slate-200'
                              }`}>
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
                              <span className={`text-xs italic ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>No photo uploaded</span>
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
                  BACK
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all"
                >
                  SUBMIT
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
                QC Funeral Assistance Guidelines & Requirements
              </h3>
              <button onClick={() => setShowReqModal(false)} className={`${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className={`space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <p className="leading-relaxed">
                The Funeral and Burial Assistance Program under Ordinance 2865 S-2019 provides financial aid through a Guarantee Letter (GL) to accredited partner funeral homes, covering service packages up to Php 25,000.
              </p>
              <div className="space-y-2 pt-2">
                <span className={`font-bold uppercase tracking-wider block ${darkMode ? 'text-white' : 'text-slate-900'}`}>Standard Requirements:</span>
                <ul className={`list-disc list-inside space-y-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  <li>
                    <strong>Referral Form (optional) – original copy</strong>
                    <span className="block text-[11px] text-blue-300/80 ml-4 font-normal">• Maaaring manggaling sa Barangay, hospital, o accredited partner funeral service provider.</span>
                  </li>
                  <li>
                    <strong>Death Certificate – original Certified True Copy</strong>
                  </li>
                  <li>
                    <strong>Notarized Funeral Contract – original copy</strong>
                    <span className="block text-[11px] text-blue-300/80 ml-4 font-normal">• Mula sa QC-accredited/partner funeral home.</span>
                  </li>
                  <li>
                    <strong>Barangay Certificate of Indigency – original copy</strong>
                    <span className="block text-[11px] text-blue-300/80 ml-4 font-normal">• Dapat ang purpose ay “Burial/Funeral Assistance.”</span>
                  </li>
                  <li>
                    <strong>Valid ID ng informant/nearest kin</strong>
                    <span className="block text-[11px] text-blue-300/80 ml-4 font-normal">• Preferably QC ID.</span>
                  </li>
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
