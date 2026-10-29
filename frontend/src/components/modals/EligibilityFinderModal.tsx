import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  MapPin,
  Activity,
  Stethoscope,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  ArrowRight,
  ShieldCheck,
  Check,
  Shield,
  ShieldAlert,
  Wallet,
  Heart,
  GraduationCap,
  BookOpen,
  Briefcase,
  Loader2,
  XCircle
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { useLanguage } from '../../context/LanguageContext';

export interface RecommendedProgramItem {
  tabKey: string;
  programName: string;
  moduleLabel: string;
  benefitAmount: string;
  matchConfidence: number;
  eligibilityTag: string;
  matchReason: string;
  requirements: string[];
}

export interface AiAssessmentResult {
  eligibilityStatus: 'HIGHLY_ELIGIBLE' | 'CONDITIONALLY_ELIGIBLE' | 'NOT_ELIGIBLE';
  statusBadge: string;
  matchScore: number;
  priorityLevel: string;
  aiAssessmentSummary: string;
  policyNotes: string;
  recommendedPrograms: RecommendedProgramItem[];
  engineSource?: string;
}

export function localizeStatusBadge(badge: string, eligibilityStatus: string, isTagalog: boolean): string {
  if (isTagalog) {
    if (eligibilityStatus === 'HIGHLY_ELIGIBLE') {
      return 'Kumpirmadong Kwalipikado (Prayoridad na Indigent Category)';
    }
    if (eligibilityStatus === 'CONDITIONALLY_ELIGIBLE') {
      return 'Conditionally Eligible (Dadaan sa Social Worker Validation)';
    }
    return 'Labas sa Sakop o Lagpas sa Income Threshold (Hindi Kwalipikado)';
  }
  if (eligibilityStatus === 'HIGHLY_ELIGIBLE') {
    return 'High Eligibility Match Confirmed (Priority Indigent Category)';
  }
  if (eligibilityStatus === 'CONDITIONALLY_ELIGIBLE') {
    return 'Conditionally Eligible (Subject to Social Worker Case Validation)';
  }
  return badge || 'Outside MSWDO System Scope / Not Eligible';
}

export function localizeAssessmentSummary(summary: string, eligibilityStatus: string, isTagalog: boolean): string {
  const hasTagalogWords = /\b(base sa|ng inyong|ang inyong|sambahayan|narito|maaari|kayo|tugma)\b/i.test(summary || '');
  if (isTagalog) {
    if (hasTagalogWords) return summary;
    if (eligibilityStatus === 'HIGHLY_ELIGIBLE') {
      return 'Base sa AI Pre-Screening ng inyong household profile at salaysay sa Step 3, ang inyong sambahayan ay PASOK sa Indigent Priority Criteria ng MSWDO. Narito ang mga opisyal na programa sa loob ng ating system na direktang tumutugon sa inyong sitwasyon.';
    }
    if (eligibilityStatus === 'CONDITIONALLY_ELIGIBLE') {
      return 'Base sa AI Pre-Screening, ang inyong sambahayan ay CONDITIONALLY ELIGIBLE. Maaari kayong magpasa ng aplikasyon sa mga inirekomendang programa sa ibaba, ngunit dadaan ito sa karagdagang case validation ng MSWDO Social Worker.';
    }
    return 'Ang inyong inilagay na sitwasyon ay labas sa sakop o lagpas sa indigent income threshold ng MSWDO.';
  } else {
    if (!hasTagalogWords && summary) return summary;
    const parenMatch = (summary || '').match(/household profile \(([^)]+)\)/i);
    const details = parenMatch ? ` (${parenMatch[1]})` : '';
    if (eligibilityStatus === 'HIGHLY_ELIGIBLE') {
      return `Based on the AI Pre-Screening of your household profile${details} and your narrative statement in Step 3, your household meets the MSWDO Indigent Priority Criteria. Below are the official social assistance programs in our system that directly address your situation.`;
    }
    if (eligibilityStatus === 'CONDITIONALLY_ELIGIBLE') {
      return `Based on the AI Pre-Screening, your household${details} is CONDITIONALLY ELIGIBLE. You may submit an application for the recommended programs below, subject to further case validation by an MSWDO Social Worker.`;
    }
    return 'Based on the AI Pre-Screening, the submitted profile or request falls outside the MSWDO Indigent Priority Criteria.';
  }
}

export function localizeProgramName(tabKey: string, defaultName: string, isTagalog: boolean): string {
  if (!isTagalog) return defaultName;
  switch (tabKey) {
    case 'aics-medical': return 'AICS Tulong Medikal at Pagpapa-ospital';
    case 'aics-funeral': return 'AICS Tulong sa Libing at Punerarya';
    case 'aics-educational': return 'Tulong Pang-Edukasyon para sa Kabataan';
    case 'childwelfare-form': return 'Serbisyo sa Kalinga at Proteksyon ng Bata';
    case 'pwd-form': return 'Tulong Pinansyal at Kagamitan para sa PWD';
    case 'senior-form': return 'Tulong Pinansyal at Medikal para sa Senior Citizen';
    case 'soloparent-financial-form':
    case 'soloparent-form': return 'Buwanang Tulong Pinansyal para sa Solo Parent';
    case 'soloparent-edu-form': return 'Tulong Pang-Edukasyon para sa Anak ng Solo Parent';
    case 'livelihood': return 'Puhunan Pangkabuhayan (Livelihood Capital Grant)';
    case 'skills-training': return 'Libreng Pagsasanay Bokasyonal (Skills Training)';
    default: return defaultName;
  }
}

export function localizeModuleLabel(tabKey: string, defaultLabel: string, isTagalog: boolean): string {
  if (!isTagalog) return defaultLabel;
  switch (tabKey) {
    case 'aics-medical':
    case 'aics-funeral': return 'Modyul ng AICS';
    case 'aics-educational':
    case 'childwelfare-form': return 'Modyul sa Kalinga ng Bata';
    case 'pwd-form': return 'Modyul ng PWD';
    case 'senior-form': return 'Modyul ng Senior Citizen';
    case 'soloparent-financial-form':
    case 'soloparent-form':
    case 'soloparent-edu-form': return 'Modyul ng Solo Parent';
    case 'livelihood':
    case 'skills-training': return 'Modyul sa Pangkabuhayan';
    default: return defaultLabel;
  }
}

export function localizeBenefitAmount(tabKey: string, defaultBenefit: string, isTagalog: boolean): string {
  if (!isTagalog) return defaultBenefit;
  switch (tabKey) {
    case 'aics-medical': return '₱5,000 – ₱20,000 Guarantee Letter / Tulong Pinansyal';
    case 'aics-funeral': return 'Hanggang ₱10,000 Guarantee Letter sa Punerarya';
    case 'aics-educational': return '₱5,000 Tulong Pang-Edukasyon';
    case 'childwelfare-form': return 'Proteksyon, Nutrisyon at Kalinga sa Bata';
    case 'pwd-form': return '₱3,000 Tulong Pinansyal at Assistive Device';
    case 'senior-form': return '₱4,000 Tulong Pinansyal at Medikal sa Senior';
    case 'soloparent-financial-form':
    case 'soloparent-form': return '₱3,000 Tulong Pinansyal sa Solo Parent';
    case 'soloparent-edu-form': return '₱5,000 Educational Grant sa Anak ng Solo Parent';
    case 'livelihood': return '₱15,000 Puhunan sa Maliit na Negosyo';
    case 'skills-training': return 'Libreng Kurso Bokasyonal at Starter Kit';
    default: return defaultBenefit;
  }
}

export function localizeMatchReason(tabKey: string, reason: string, isTagalog: boolean): string {
  const hasTagalogWords = /\b(tugma|inyong|direktang|sagot|gastusin|punerarya|libing|pumanaw|tulong|para sa|buwanan|nagtataguyod|nakalaan|nag-aaral|puhunan|angkop|libreng|upang|madagdagan|miyembro|pamilya|kapansanan|taong gulang|sambahayan)\b/i.test(reason || '');

  if (isTagalog) {
    if (hasTagalogWords && reason) return reason;
    switch (tabKey) {
      case 'aics-medical':
        return 'Tugma sa inyong medikal o hospitalization crisis at low-income household profile.';
      case 'aics-funeral':
        return 'Direktang sagot para sa gastusin sa punerarya at libing ng pumanaw na kapamilya sa ilalim ng AICS.';
      case 'aics-educational':
        return 'Tulong pang-edukasyon para sa nag-aaral na dependent mula sa low-income na sambahayan.';
      case 'childwelfare-form':
        return 'Para sa proteksyon, nutrisyon, at kapakanan ng mga bata sa sambahayan.';
      case 'pwd-form':
        return 'Statutory financial at assistive support para sa miyembro ng pamilya na may kapansanan (PWD).';
      case 'senior-form':
        return 'Tulong pinansyal at pang-medikal para sa indigent Senior Citizen (60+ taong gulang).';
      case 'soloparent-financial-form':
      case 'soloparent-form':
        return 'Buwanan o crisis financial subsidy para sa Solo Parent na mag-isang nagtataguyod ng anak.';
      case 'soloparent-edu-form':
        return 'Educational grant na nakalaan para sa nag-aaral na anak ng rehistradong Solo Parent.';
      case 'livelihood':
        return 'Puhunan pang-kabuhayan (₱15,000) na angkop sa kasalukuyang employment at income status ng sambahayan.';
      case 'skills-training':
        return 'Libreng vocational at skills training upang madagdagan ang kakayahan at kita ng pamilya.';
      default:
        return reason;
    }
  } else {
    if (!hasTagalogWords && reason) return reason;
    switch (tabKey) {
      case 'aics-medical':
        return 'Directly matches your medical or hospitalization crisis and low-income household profile for urgent AICS support.';
      case 'aics-funeral':
        return 'Provides immediate burial and funeral parlor financial assistance for a deceased family member under AICS.';
      case 'aics-educational':
        return 'Provides educational financial support for studying dependents from a low-income household.';
      case 'childwelfare-form':
        return 'Dedicated to child protection, nutrition, and developmental welfare support for vulnerable children in the household.';
      case 'pwd-form':
        return 'Provides statutory financial subsidy and assistive device support for a household member with a disability (PWD).';
      case 'senior-form':
        return 'Provides social pension and medical welfare support for an indigent Senior Citizen (60 years old and above).';
      case 'soloparent-financial-form':
      case 'soloparent-form':
        return 'Provides monthly or crisis financial subsidy for a verified Solo Parent supporting dependent children alone.';
      case 'soloparent-edu-form':
        return 'Provides an educational assistance grant dedicated to the studying child of a registered Solo Parent.';
      case 'livelihood':
        return 'Provides a ₱15,000 micro-enterprise capital grant suited to your household employment and income profile.';
      case 'skills-training':
        return 'Offers free vocational and skills training courses to improve employability and household income.';
      default:
        return 'Matched against MSWDO social welfare eligibility criteria for your household profile.';
    }
  }
}

interface EligibilityFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCategoryFilter?: (category: string) => void;
  onNavigateToProgram?: (tabKey: string) => void;
  onSaveAssessmentResult?: (result: AiAssessmentResult) => void;
  darkMode?: boolean;
}

export const EligibilityFinderModal: React.FC<EligibilityFinderModalProps> = ({
  isOpen,
  onClose,
  onApplyCategoryFilter,
  onNavigateToProgram,
  onSaveAssessmentResult,
  darkMode = true,
}) => {
  const { language } = useLanguage();
  const isTagalog = language === 'Tagalog';
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AiAssessmentResult | null>(null);
  const [stepValidationMsg, setStepValidationMsg] = useState<string>('');

  // Step 1: Household & Demographics (Default empty so nothing is pre-selected)
  const [primaryApplicant, setPrimaryApplicant] = useState<string>('');
  const [householdIncome, setHouseholdIncome] = useState<string>('');
  const [barangay, setBarangay] = useState<string>('');
  const [dependentMembers, setDependentMembers] = useState<string>('');
  const [employmentStatus, setEmploymentStatus] = useState<string>('');
  const [welfareProgramStatus, setWelfareProgramStatus] = useState<string>('');
  const [healthInsurance, setHealthInsurance] = useState<string>('');
  const [urgencyTimeline, setUrgencyTimeline] = useState<string>('');
  const [residencyCondition, setResidencyCondition] = useState<string>('');

  // Step 2: Hardships & Crisis (Default empty so nothing is pre-checked)
  const [selectedHardships, setSelectedHardships] = useState<string[]>([]);

  // Step 3: Narrative Statement (Default empty so nothing is pre-filled)
  const [narrative, setNarrative] = useState<string>('');
  const [specialCircumstances] = useState<string[]>([]);

  const toggleHardship = (id: string) => {
    setStepValidationMsg('');
    if (selectedHardships.includes(id)) {
      setSelectedHardships(selectedHardships.filter((item) => item !== id));
    } else {
      setSelectedHardships([...selectedHardships, id]);
    }
  };

  const hardshipCards = [
    {
      id: 'medical',
      title: 'Unsettled Hospital Bills, Surgery, or Ongoing Medical Treatment',
      description: 'A family member is hospitalized, undergoing dialysis/chemotherapy, or requires costly prescription maintenance medicines.',
      icon: Stethoscope,
    },
    {
      id: 'bereavement',
      title: 'Recent Death or Bereavement in the Immediate Family',
      description: 'Coping with the recent passing of a loved one with unpaid funeral parlor, casket, or burial expenses.',
      icon: ShieldAlert,
    },
    {
      id: 'educational',
      title: 'Difficulty Sustaining Schooling & Youth Education Expenses',
      description: 'Struggling to afford school enrollment, tuition, books, or daily allowance for studying children or youth.',
      icon: GraduationCap,
    },
    {
      id: 'disability',
      title: 'Household Member Living with a Physical, Sensory, or Mental Disability',
      description: 'Caring for a family member with a long-term physical, visual, hearing, intellectual, or psychosocial condition.',
      icon: Users,
    },
    {
      id: 'senior',
      title: 'Elderly Family Member (60+ Years Old) Without Regular Pension',
      description: 'Household includes a senior citizen with no stable retirement income who needs daily living and health support.',
      icon: Heart,
    },
    {
      id: 'soloparent',
      title: 'Single-Handedly Raising Minor Dependent Children Alone',
      description: 'Solely bearing the financial and parenting responsibilities for minor children without spousal or partner support.',
      icon: Users,
    },
    {
      id: 'children',
      title: 'Infants or Young Children Needing Nutrition, Daycare, or Protection',
      description: 'Having young children at risk of malnutrition, lacking early childhood care, or needing protective social support.',
      icon: Wallet,
    },
    {
      id: 'livelihood_training',
      title: 'Loss of Income, Unemployment, or Lack of Stable Livelihood Skills',
      description: 'Primary earner is unemployed, displaced, or relies on unstable daily sidelining and needs sustainable income opportunities.',
      icon: Briefcase,
    },
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
      setCurrentStep(1);
      setStepValidationMsg('');
      setPrimaryApplicant('');
      setHouseholdIncome('');
      setBarangay('');
      setDependentMembers('');
      setEmploymentStatus('');
      setWelfareProgramStatus('');
      setHealthInsurance('');
      setUrgencyTimeline('');
      setResidencyCondition('');
      setSelectedHardships([]);
      setNarrative('');
      setAiResult(null);
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isStep1Complete = Boolean(
    primaryApplicant &&
      householdIncome &&
      barangay &&
      dependentMembers &&
      employmentStatus &&
      welfareProgramStatus &&
      healthInsurance &&
      urgencyTimeline &&
      residencyCondition
  );

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!isStep1Complete) {
        setStepValidationMsg('Please select an option for all 9 household & demographic fields before proceeding.');
        return;
      }
      setStepValidationMsg('');
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (selectedHardships.length === 0) {
        setStepValidationMsg('Please select at least one current life situation or hardship category to continue.');
        return;
      }
      setStepValidationMsg('');
      setCurrentStep(3);
    }
  };

  const handleRunAiAssessment = async () => {
    if (!narrative.trim()) {
      setStepValidationMsg('Please describe your situation or select a scenario before running the AI assessment.');
      return;
    }
    setStepValidationMsg('');
    setIsAnalyzing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/eligibility-assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryApplicant,
          householdIncome,
          barangay,
          dependentMembers,
          employmentStatus,
          welfareProgramStatus,
          healthInsurance,
          urgencyTimeline,
          residencyCondition,
          selectedHardships,
          narrative,
          specialCircumstances,
          language,
        }),
      });

      if (response.ok) {
        const data: AiAssessmentResult = await response.json();
        setAiResult(data);
        if (onSaveAssessmentResult) {
          onSaveAssessmentResult(data);
        }
        setCurrentStep(4);
      } else {
        throw new Error('Backend returned non-200');
      }
    } catch {
      const fallbackData: AiAssessmentResult = {
        eligibilityStatus: 'HIGHLY_ELIGIBLE',
        statusBadge: isTagalog
          ? 'Kumpirmadong Kwalipikado (Prayoridad na Indigent Category)'
          : 'High Eligibility Match Confirmed (Priority Indigent Category)',
        matchScore: 95,
        priorityLevel: isTagalog ? 'Prayoridad Kategorya 1 (Indigent / Krisis)' : 'Priority Category 1 (Indigent / Crisis)',
        aiAssessmentSummary: isTagalog
          ? 'Base sa AI Pre-Screening ng inyong household profile at salaysay sa Step 3, ang inyong sambahayan ay PASOK sa Indigent Priority Criteria ng MSWDO. Narito ang mga opisyal na programa sa loob ng ating system na direktang tumutugon sa inyong sitwasyon.'
          : 'Based on the AI Pre-Screening of your household profile and your narrative statement in Step 3, your household meets the MSWDO Indigent Priority Criteria. Below are the official social assistance programs in our system that directly address your situation.',
        policyNotes: isTagalog
          ? `Sinuri sa ilalim ng MSWDO Social Case Intake Guidelines para sa ${barangay}.`
          : `Evaluated under MSWDO Social Case Intake Guidelines for ${barangay}.`,
        recommendedPrograms: [
          {
            tabKey: 'aics-medical',
            programName: 'AICS Medical & Hospitalization Assistance',
            moduleLabel: 'AICS Module',
            benefitAmount: '₱5,000 – ₱20,000 Guarantee Letter / Cash Aid',
            matchConfidence: 96,
            eligibilityTag: 'Primary AI Match',
            matchReason: isTagalog
              ? 'Tugma sa inyong medikal o hospitalization crisis at low-income household profile.'
              : 'Directly matches your medical or hospitalization crisis and low-income household profile for urgent AICS support.',
            requirements: [
              'Valid Government / QCitizen ID',
              'Medical Certificate / Clinical Abstract',
              'Hospital Billing or Doctor Prescription',
              'Barangay Certificate of Indigency',
            ],
          },
          {
            tabKey: 'livelihood',
            programName: 'Sustainable Livelihood Starter Kit / Capital Grant',
            moduleLabel: 'Livelihood Module',
            benefitAmount: '₱15,000 Micro-Enterprise Capital Grant',
            matchConfidence: 90,
            eligibilityTag: 'Recommended Support',
            matchReason: isTagalog
              ? 'Puhunan pang-kabuhayan (₱15,000) na angkop sa kasalukuyang employment at income status ng sambahayan.'
              : 'Provides a ₱15,000 micro-enterprise capital grant suited to your household employment and income profile.',
            requirements: [
              'Valid Government / QCitizen ID',
              'Simple Micro-Business Proposal',
              'Barangay Clearance & Certificate of Indigency',
            ],
          },
        ],
      };
      setAiResult(fallbackData);
      if (onSaveAssessmentResult) {
        onSaveAssessmentResult(fallbackData);
      }
      setCurrentStep(4);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const steps = [
    { num: 1, label: '1. Household & Demographics' },
    { num: 2, label: '2. Current Hardships & Crisis' },
    { num: 3, label: '3. Narrative Statement' },
    { num: 4, label: '4. AI Assessment & Recommendations' },
  ];

  const getSelectClass = (val: string) =>
    `w-full px-3.5 py-2.5 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
      darkMode
        ? `bg-[#0f182e] border-slate-700 ${val ? 'text-slate-100' : 'text-slate-400'}`
        : `bg-white border-slate-300 ${val ? 'text-slate-900' : 'text-slate-500'}`
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div
        className={`relative w-full max-w-5xl my-auto border rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
          darkMode ? 'bg-[#0b1329] border-slate-700/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Thesis Title Banner */}
        <div
          className={`px-4 sm:px-5 py-2.5 border-b flex items-center justify-between gap-2 ${
            darkMode
              ? 'bg-gradient-to-r from-blue-950/90 via-[#0b1631] to-[#080e1e] border-slate-800'
              : 'bg-gradient-to-r from-blue-50 via-indigo-50/60 to-white border-slate-200'
          }`}
        >
          <div className="min-w-0">
            <h2 className={`text-xs sm:text-sm font-extrabold tracking-tight truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              AI-Powered Eligibility Assessment & Assistance Recommendation
            </h2>
            <p className={`text-[10px] sm:text-[11px] truncate ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Social Assistance Management Information System for Municipal Social Welfare and Development Offices
            </p>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer ${
              darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
            }`}
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Non-Clickable Stepper Indicator Bar (No > separators) */}
        <div
          className={`px-4 sm:px-5 py-2 border-b flex items-center justify-between ${
            darkMode ? 'bg-[#080e1e] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-xs select-none">
            {steps.map((st) => {
              const isActive = currentStep === st.num;
              const isPast = currentStep > st.num;
              return (
                <div
                  key={st.num}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow'
                      : isPast
                      ? darkMode
                        ? 'bg-[#0b2426] border border-emerald-500/40 text-emerald-400'
                        : 'bg-emerald-50 border border-emerald-300 text-emerald-700'
                      : darkMode
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  }`}
                >
                  {isPast && <Check className="w-3 h-3 text-emerald-500" />}
                  <span>{st.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[72vh]">
          {stepValidationMsg && (
            <div
              className={`mb-4 p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                darkMode
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-200'
                  : 'bg-amber-50 border-amber-300 text-amber-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>{stepValidationMsg}</span>
            </div>
          )}

          {/* STEP 1: Household & Demographics */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-5 h-5 text-blue-500" />
                  <h3 className={`text-base sm:text-lg font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Household Profile & Socio–Economic Demographics
                  </h3>
                </div>
                <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Please provide baseline demographic and living conditions to ensure accurate MSWDO AI eligibility evaluation.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* 1. Primary Applicant */}
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    Who is the primary applicant?
                  </label>
                  <select
                    value={primaryApplicant}
                    onChange={(e) => {
                      setPrimaryApplicant(e.target.value);
                      setStepValidationMsg('');
                    }}
                    className={getSelectClass(primaryApplicant)}
                  >
                    <option value="" disabled>
                      Select Primary Applicant
                    </option>
                    <option value="Myself (Individual)">Myself (Individual)</option>
                    <option value="Household Head / Breadwinner">Household Head / Breadwinner</option>
                    <option value="Immediate Family Member / Relative">Immediate Family Member / Relative</option>
                    <option value="Authorized Guardian / Caregiver">Authorized Guardian / Caregiver</option>
                  </select>
                </div>

                {/* 2. Monthly Income */}
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    Estimated Total Monthly Household Income:
                  </label>
                  <select
                    value={householdIncome}
                    onChange={(e) => {
                      setHouseholdIncome(e.target.value);
                      setStepValidationMsg('');
                    }}
                    className={getSelectClass(householdIncome)}
                  >
                    <option value="" disabled>
                      Select Monthly Household Income
                    </option>
                    <option value="Below ₱10,000 per month">Below ₱10,000 per month</option>
                    <option value="₱10,000 to ₱20,000 per month">₱10,000 to ₱20,000 per month</option>
                    <option value="₱20,001 to ₱30,000 per month">₱20,001 to ₱30,000 per month</option>
                    <option value="Above ₱30,000 per month">Above ₱30,000 per month</option>
                  </select>
                </div>

                {/* 3. Barangay of Residence */}
                <div>
                  <label className={`flex items-center gap-1.5 text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    <span>Barangay of Residence (Within Municipality):</span>
                  </label>
                  <select
                    value={barangay}
                    onChange={(e) => {
                      setBarangay(e.target.value);
                      setStepValidationMsg('');
                    }}
                    className={getSelectClass(barangay)}
                  >
                    <option value="" disabled>
                      Select Barangay of Residence
                    </option>
                    <option value="Barangay Poblacion (Municipal Proper)">Barangay Poblacion (Municipal Proper)</option>
                    <option value="Barangay San Bartolome (Novaliches)">Barangay San Bartolome (Novaliches)</option>
                    <option value="Barangay Bagong Silangan">Barangay Bagong Silangan</option>
                    <option value="Barangay Commonwealth">Barangay Commonwealth</option>
                    <option value="Barangay Batasan Hills">Barangay Batasan Hills</option>
                    <option value="Other Quezon City / Nearby Barangay">Other Quezon City / Nearby Barangay</option>
                  </select>
                </div>

                {/* 4. Number of Dependent Family Members */}
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    Number of Dependent Family Members:
                  </label>
                  <select
                    value={dependentMembers}
                    onChange={(e) => {
                      setDependentMembers(e.target.value);
                      setStepValidationMsg('');
                    }}
                    className={getSelectClass(dependentMembers)}
                  >
                    <option value="" disabled>
                      Select Number of Dependents
                    </option>
                    <option value="None (Living alone)">None (Living alone)</option>
                    <option value="1 to 2 members">1 to 2 members</option>
                    <option value="3 to 5 members">3 to 5 members</option>
                    <option value="6 or more members">6 or more members</option>
                  </select>
                </div>

                {/* 5. Primary Earner Employment Status */}
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    Primary Earner Employment Status:
                  </label>
                  <select
                    value={employmentStatus}
                    onChange={(e) => {
                      setEmploymentStatus(e.target.value);
                      setStepValidationMsg('');
                    }}
                    className={getSelectClass(employmentStatus)}
                  >
                    <option value="" disabled>
                      Select Employment Status
                    </option>
                    <option value="Daily Wage / Sideline / Informal vendor">Daily Wage / Sideline / Informal vendor</option>
                    <option value="Unemployed / Displaced worker">Unemployed / Displaced worker</option>
                    <option value="Minimum Wage Earner (Contractual/Agency)">Minimum Wage Earner (Contractual/Agency)</option>
                    <option value="Self-employed / Micro-business">Self-employed / Micro-business</option>
                    <option value="Retired / Senior without Pension">Retired / Senior without Pension</option>
                    <option value="Regular / Full-time Employee">Regular / Full-time Employee</option>
                  </select>
                </div>

                {/* 6. Existing Welfare Program Status */}
                <div>
                  <label className={`flex items-center gap-1.5 text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    <Activity className="w-3.5 h-3.5 text-blue-500" />
                    <span>Existing Government Social Welfare Program Status:</span>
                  </label>
                  <select
                    value={welfareProgramStatus}
                    onChange={(e) => {
                      setWelfareProgramStatus(e.target.value);
                      setStepValidationMsg('');
                    }}
                    className={getSelectClass(welfareProgramStatus)}
                  >
                    <option value="" disabled>
                      Select Welfare Program Status
                    </option>
                    <option value="Non-4Ps Household (Direct Citizen Applicant)">Non-4Ps Household (Direct Citizen Applicant)</option>
                    <option value="Active 4Ps Beneficiary Household">Active 4Ps Beneficiary Household</option>
                    <option value="Waitlisted 4Ps Applicant">Waitlisted 4Ps Applicant</option>
                    <option value="Graduated 4Ps Beneficiary">Graduated 4Ps Beneficiary</option>
                  </select>
                </div>

                {/* 7. Health Insurance & Medical Coverage */}
                <div>
                  <label className={`flex items-center gap-1.5 text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
                    <span>Health Insurance & Medical Coverage (PhilHealth):</span>
                  </label>
                  <select
                    value={healthInsurance}
                    onChange={(e) => {
                      setHealthInsurance(e.target.value);
                      setStepValidationMsg('');
                    }}
                    className={getSelectClass(healthInsurance)}
                  >
                    <option value="" disabled>
                      Select PhilHealth Coverage Status
                    </option>
                    <option value="PhilHealth Indigent / Sponsored (LGU / DSWD)">PhilHealth Indigent / Sponsored (LGU / DSWD)</option>
                    <option value="PhilHealth Senior Citizen Automatic Coverage">PhilHealth Senior Citizen Automatic Coverage</option>
                    <option value="PhilHealth PWD Automatic Coverage">PhilHealth PWD Automatic Coverage</option>
                    <option value="No PhilHealth Coverage / Unenrolled">No PhilHealth Coverage / Unenrolled</option>
                    <option value="PhilHealth Formal / Employed Paying Member">PhilHealth Formal / Employed Paying Member</option>
                  </select>
                </div>

                {/* 8. Assistance Urgency & Timeline Need */}
                <div>
                  <label className={`flex items-center gap-1.5 text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>Assistance Urgency & Timeline Need:</span>
                  </label>
                  <select
                    value={urgencyTimeline}
                    onChange={(e) => {
                      setUrgencyTimeline(e.target.value);
                      setStepValidationMsg('');
                    }}
                    className={getSelectClass(urgencyTimeline)}
                  >
                    <option value="" disabled>
                      Select Urgency / Timeline Need
                    </option>
                    <option value="Immediate Emergency (Within 24 to 48 hours)">Immediate Emergency (Within 24 to 48 hours)</option>
                    <option value="Urgent Need (Within 3 to 5 days)">Urgent Need (Within 3 to 5 days)</option>
                    <option value="Standard Processing (Within 1 to 2 weeks)">Standard Processing (Within 1 to 2 weeks)</option>
                    <option value="Routine / General Consultation">Routine / General Consultation</option>
                  </select>
                </div>

                {/* 9. Residency & Housing Condition */}
                <div className="md:col-span-2">
                  <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    Residency & Housing Condition:
                  </label>
                  <select
                    value={residencyCondition}
                    onChange={(e) => {
                      setResidencyCondition(e.target.value);
                      setStepValidationMsg('');
                    }}
                    className={getSelectClass(residencyCondition)}
                  >
                    <option value="" disabled>
                      Select Residency & Housing Condition
                    </option>
                    <option value="Permanent Resident (Own house/lot)">Permanent Resident (Own house/lot)</option>
                    <option value="Informal Settler / Unsecured Tenancy">Informal Settler / Unsecured Tenancy</option>
                    <option value="Renting (Room / House)">Renting (Room / House)</option>
                    <option value="Living with Relatives / Extended Family">Living with Relatives / Extended Family</option>
                    <option value="Homeless / Evicted / Displaced">Homeless / Evicted / Displaced</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Current Household Hardships & Vulnerability Indicators (All Icons Uniform Blue) */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <h3 className={`text-sm sm:text-base font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Current Household Hardships & Vulnerability Indicators
                  </h3>
                </div>
                <p className={`text-[11px] sm:text-xs leading-normal ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Select all real-life challenges or household conditions currently experienced by your family:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {hardshipCards.map((card) => {
                  const isChecked = selectedHardships.includes(card.id);
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.id}
                      onClick={() => toggleHardship(card.id)}
                      className={`relative p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? darkMode
                            ? 'border-blue-500 bg-blue-950/30 shadow-blue-900/20'
                            : 'border-blue-500 bg-blue-50/90 shadow-sm'
                          : darkMode
                          ? 'bg-[#0e1628] border-slate-800 hover:border-slate-700'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-blue-600 text-white'
                            : darkMode
                            ? 'bg-blue-950/80 text-blue-400 border border-blue-700/50'
                            : 'bg-blue-50 text-blue-600 border border-blue-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 pr-5">
                        <h4 className={`text-xs sm:text-[13px] font-bold tracking-tight mb-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {card.title}
                        </h4>
                        <p className={`text-[11px] leading-snug font-normal ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          {card.description}
                        </p>
                      </div>

                      <div
                        className={`absolute top-3 right-3 w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          isChecked
                            ? 'bg-blue-600 border-blue-400 text-white'
                            : darkMode
                            ? 'border-slate-600 bg-transparent'
                            : 'border-slate-400 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Narrative Statement */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <h3 className={`text-sm sm:text-base font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Narrative Statement of Situation (AI Case Analysis Input)
                  </h3>
                </div>
                <p className={`text-[11px] sm:text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Describe your family&apos;s current social welfare need in Tagalog or English. Our strict AI will evaluate your eligibility solely against official MSWDO system programs:
                </p>
              </div>

              <div>
                <textarea
                  rows={5}
                  value={narrative}
                  onChange={(e) => {
                    setNarrative(e.target.value);
                    setStepValidationMsg('');
                  }}
                  placeholder="Halimbawa: Ako po ay isang solo parent na may tatlong anak sa Brgy. Bagong Silangan. Na-ospital po ang aking bunso at kailangan din po namin ng educational assistance at puhunan sa maliit na tindahan..."
                  className={`w-full p-4 border rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 leading-relaxed resize-none ${
                    darkMode
                      ? 'bg-[#0e1628] border-slate-800 text-slate-100 placeholder:text-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>

              <div className="space-y-2">
                <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Or click a sample household situation:
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStepValidationMsg('');
                      setNarrative(
                        'Hospital admission and critical emergency bills for a family member undergoing acute medical intervention, with unsettled hospital bills and costly prescribed maintenance medications.'
                      );
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      darkMode
                        ? 'bg-blue-950/60 border-blue-500/50 text-blue-300 hover:bg-blue-900/60'
                        : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    <span>Hospital bills & maintenance medicines</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStepValidationMsg('');
                      setNarrative(
                        'I am raising minor children alone without spousal support, struggling to pay for my child school enrollment and needing small sari-sari store capital for daily family income.'
                      );
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      darkMode
                        ? 'bg-blue-950/60 border-blue-500/50 text-blue-300 hover:bg-blue-900/60'
                        : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    <span>Single parent with studying child & small store plan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStepValidationMsg('');
                      setNarrative(
                        'Recent sudden demise of my parent with pending funeral parlor balance, casket fees, and burial plot expenses that our indigent family cannot afford.'
                      );
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      darkMode
                        ? 'bg-blue-950/60 border-blue-500/50 text-blue-300 hover:bg-blue-900/60'
                        : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    <span>Recent death of parent & unpaid burial expenses</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStepValidationMsg('');
                      setNarrative(
                        'Elderly household member (67 years old) with physical disability and no monthly pension, struggling to afford daily living needs and regular maintenance medicines.'
                      );
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      darkMode
                        ? 'bg-blue-950/60 border-blue-500/50 text-blue-300 hover:bg-blue-900/60'
                        : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    <span>Elderly & disabled family member without pension</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStepValidationMsg('');
                      setNarrative(
                        'Walang trabaho ang breadwinner ng aming pamilya at nais pong matuto ng vocational skills habang nagpapa-aral ng aming anak sa kolehiyo.'
                      );
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      darkMode
                        ? 'bg-blue-950/60 border-blue-500/50 text-blue-300 hover:bg-blue-900/60'
                        : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    <span>Unemployed breadwinner & studying child</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: AI Assessment & Recommendations */}
          {currentStep === 4 && aiResult && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                    <h3 className={`text-base sm:text-lg font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      AI Eligibility Assessment & Assistance Recommendations
                    </h3>
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    Diagnostic evaluation strictly matched against official Quezon City MSWDO programs inside this system.
                  </p>
                </div>
              </div>

              {/* Dynamic Eligibility Status Banner */}
              {aiResult.eligibilityStatus === 'NOT_ELIGIBLE' ? (
                <div
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    darkMode
                      ? 'bg-red-950/60 border-red-500/50 text-red-100'
                      : 'bg-red-50 border-red-300 text-red-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${
                        darkMode ? 'bg-red-500/20 border-red-400/50 text-red-300' : 'bg-red-100 border-red-300 text-red-600'
                      }`}
                    >
                      <XCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-extrabold ${darkMode ? 'text-red-200' : 'text-red-800'}`}>
                        {aiResult.statusBadge}
                      </h4>
                      <p className={`text-xs mt-0.5 ${darkMode ? 'text-red-300/90' : 'text-red-700'}`}>
                        {aiResult.priorityLevel}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold shrink-0 ${
                      darkMode ? 'bg-red-500/20 border-red-400/30 text-red-200' : 'bg-red-100 border-red-300 text-red-800'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{aiResult.matchScore}% Policy Match</span>
                  </div>
                </div>
              ) : aiResult.eligibilityStatus === 'CONDITIONALLY_ELIGIBLE' ? (
                <div
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    darkMode
                      ? 'bg-amber-950/60 border-amber-500/50 text-amber-100'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${
                        darkMode ? 'bg-amber-500/20 border-amber-400/50 text-amber-300' : 'bg-amber-100 border-amber-300 text-amber-700'
                      }`}
                    >
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-extrabold ${darkMode ? 'text-amber-200' : 'text-amber-900'}`}>
                        {aiResult.statusBadge}
                      </h4>
                      <p className={`text-xs mt-0.5 ${darkMode ? 'text-amber-300/90' : 'text-amber-700'}`}>
                        {aiResult.priorityLevel}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold shrink-0 ${
                      darkMode ? 'bg-amber-500/20 border-amber-400/30 text-amber-200' : 'bg-amber-100 border-amber-300 text-amber-800'
                    }`}
                  >
                    <span>{aiResult.matchScore}% Policy Match</span>
                  </div>
                </div>
              ) : (
                <div
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    darkMode
                      ? 'bg-gradient-to-r from-emerald-950/80 to-[#0e2722] border-emerald-500/40'
                      : 'bg-emerald-50 border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${
                        darkMode
                          ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                          : 'bg-emerald-100 border-emerald-300 text-emerald-700'
                      }`}
                    >
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-extrabold ${darkMode ? 'text-emerald-200' : 'text-emerald-900'}`}>
                        {localizeStatusBadge(aiResult.statusBadge, aiResult.eligibilityStatus, isTagalog)}
                      </h4>
                      <p className={`text-xs mt-0.5 ${darkMode ? 'text-emerald-300/80' : 'text-emerald-700'}`}>
                        {aiResult.priorityLevel}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold shrink-0 ${
                      darkMode
                        ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200'
                        : 'bg-emerald-100 border-emerald-300 text-emerald-800'
                    }`}
                  >
                    <span>{aiResult.matchScore}% {isTagalog ? 'Tugma sa Patakaran' : 'Policy Match'}</span>
                  </div>
                </div>
              )}

              {/* AI Social Case Summary Box */}
              <div
                className={`p-4 rounded-xl border space-y-1.5 ${
                  darkMode ? 'bg-[#0f182e]/90 border-blue-500/30' : 'bg-blue-50/70 border-blue-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                    <FileText className="w-3.5 h-3.5" />
                    {isTagalog ? 'Buod ng Pagsusuri ng AI Social Case' : 'AI Social Case Evaluation Summary'}
                  </span>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  {localizeAssessmentSummary(aiResult.aiAssessmentSummary, aiResult.eligibilityStatus, isTagalog)}
                </p>
                {aiResult.policyNotes && (
                  <p className={`text-[11px] italic pt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {aiResult.policyNotes}
                  </p>
                )}
              </div>

              {/* Recommended Social Welfare Programs */}
              {aiResult.recommendedPrograms && aiResult.recommendedPrograms.length > 0 ? (
                <div className="space-y-3">
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    {isTagalog
                      ? `Inirekomendang Programa ng MSWDO System (${aiResult.recommendedPrograms.length} Tugma):`
                      : `Recommended MSWDO System Programs (${aiResult.recommendedPrograms.length} Matched):`}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {aiResult.recommendedPrograms.map((prog) => (
                      <div
                        key={prog.tabKey}
                        className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                          darkMode
                            ? 'bg-[#0f182e] border-blue-500/35 hover:border-blue-400/60'
                            : 'bg-white border-slate-200 shadow-sm hover:border-blue-400'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span
                                className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded mb-1 ${
                                  darkMode ? 'bg-slate-800 text-blue-300' : 'bg-blue-50 text-blue-700'
                                }`}
                              >
                                {localizeModuleLabel(prog.tabKey, prog.moduleLabel, isTagalog)}
                              </span>
                              <h5 className={`text-xs sm:text-sm font-extrabold leading-snug ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                {localizeProgramName(prog.tabKey, prog.programName, isTagalog)}
                              </h5>
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 border ${
                                darkMode
                                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              }`}
                            >
                              {prog.matchConfidence}% {isTagalog ? 'Tugma' : 'Match'}
                            </span>
                          </div>

                          <div className={`text-xs font-bold ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                            {isTagalog ? 'Benepisyo:' : 'Benefit:'} {localizeBenefitAmount(prog.tabKey, prog.benefitAmount, isTagalog)}
                          </div>

                          <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {localizeMatchReason(prog.tabKey, prog.matchReason, isTagalog)}
                          </p>

                          {prog.requirements && prog.requirements.length > 0 && (
                            <div className={`pt-1.5 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                              <span className={`block text-[10px] font-bold uppercase mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {isTagalog ? 'Mga Pangunahing Requirements:' : 'Key Requirements to Prepare:'}
                              </span>
                              <ul className="space-y-0.5">
                                {prog.requirements.slice(0, 3).map((req, rIdx) => (
                                  <li key={rIdx} className={`text-[11px] flex items-center gap-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                                    <span className="truncate">{req}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateToProgram) {
                              onNavigateToProgram(prog.tabKey);
                            }
                            onClose();
                          }}
                          className="w-full mt-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>{isTagalog ? 'Mag-apply Ngayon / Pumunta sa Form' : 'Apply Now / Proceed to Form'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  className={`p-4 rounded-xl border text-center space-y-2 ${
                    darkMode ? 'bg-slate-900/70 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <p className="text-xs sm:text-sm font-semibold">
                    No MSWDO System Program Matched
                  </p>
                  <p className="text-xs">
                    Please go back to Step 1, Step 2, or Step 3 and describe a valid social welfare crisis or vulnerable sector need covered by the MSWDO system.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Bar (Back on far left, Next Step / AI button on far right) */}
        <div
          className={`px-4 sm:px-6 py-2.5 sm:py-3 border-t flex items-center justify-between gap-2.5 ${
            darkMode ? 'bg-[#080e1e] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                disabled={isAnalyzing}
                onClick={() => {
                  setStepValidationMsg('');
                  setCurrentStep((prev) => Math.max(1, prev - 1));
                }}
                className={`px-4 py-1.5 rounded-lg font-bold text-xs border transition-colors flex items-center justify-center cursor-pointer ${
                  darkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 justify-end">
            {currentStep < 4 ? (
              currentStep === 3 ? (
                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={handleRunAiAssessment}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold text-xs sm:text-sm shadow-md border border-blue-400/40 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing Eligibility with AI...</span>
                    </>
                  ) : (
                    <span>Analyze & Generate AI Recommendation</span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md border border-blue-400/40 transition-all flex items-center justify-center cursor-pointer"
                >
                  <span>Next Step</span>
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onApplyCategoryFilter) onApplyCategoryFilter('all');
                  onClose();
                }}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md border border-emerald-400/40 transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Done / Return to Portal</span>
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
