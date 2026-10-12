import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  MapPin, 
  Activity, 
  Stethoscope, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Check,
  Shield,
  ShieldAlert,
  Wallet,
  Heart,
  GraduationCap,
  BookOpen
} from 'lucide-react';

interface EligibilityFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCategoryFilter?: (category: string) => void;
  darkMode?: boolean;
}

export const EligibilityFinderModal: React.FC<EligibilityFinderModalProps> = ({
  isOpen,
  onClose,
  onApplyCategoryFilter,
  darkMode = true,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Household & Demographics
  const [primaryApplicant, setPrimaryApplicant] = useState<string>('Myself (Individual)');
  const [householdIncome, setHouseholdIncome] = useState<string>('Below ₱10,000 per month (Indigent threshold)');
  const [barangay, setBarangay] = useState<string>('Barangay Poblacion (Municipal Proper)');
  const [dependentMembers, setDependentMembers] = useState<string>('3 to 5 members');
  const [employmentStatus, setEmploymentStatus] = useState<string>('Daily Wage / Sideline / Informal vendor');
  const [welfareProgramStatus, setWelfareProgramStatus] = useState<string>('Non-4Ps Household (Direct Citizen Applicant)');
  const [healthInsurance, setHealthInsurance] = useState<string>('PhilHealth Indigent / Sponsored (LGU / DSWD)');
  const [urgencyTimeline, setUrgencyTimeline] = useState<string>('Immediate Emergency (Within 24–48h - Hospital Discharge / Burial)');
  const [residencyCondition, setResidencyCondition] = useState<string>('Permanent Resident (Own house/lot)');

  // Step 2: Hardships & Crisis (Select all real-life challenges)
  const [selectedHardships, setSelectedHardships] = useState<string[]>(['medical']);

  const toggleHardship = (id: string) => {
    if (selectedHardships.includes(id)) {
      setSelectedHardships(selectedHardships.filter((item) => item !== id));
    } else {
      setSelectedHardships([...selectedHardships, id]);
    }
  };

  const hardshipCards = [
    {
      id: 'medical',
      title: 'Medical Emergency, Hospitalization, or Costly Medications',
      description: 'Hospital admission, surgery bills, ongoing dialysis/chemo, laboratory fees, or maintenance prescription drugs you cannot afford.',
      icon: Stethoscope,
      iconClass: 'bg-red-600 text-white',
      selectedStyle: 'border-red-500/90 bg-red-950/20 shadow-red-900/20',
    },
    {
      id: 'bereavement',
      title: 'Bereavement & Death in the Family',
      description: 'Recent passing of a loved one and struggling to pay for funeral parlor, casket, or burial plot expenses.',
      icon: ShieldAlert,
      iconClass: 'bg-slate-800 text-slate-300 border border-slate-700',
      selectedStyle: 'border-slate-400 bg-slate-800/40',
    },
    {
      id: 'food_insecurity',
      title: 'Immediate Food Insecurity & Crisis Survival',
      description: 'Lack of funds to buy daily groceries and milk, acute hunger, or total loss of household income.',
      icon: Wallet,
      iconClass: 'bg-amber-950/70 text-amber-400 border border-amber-600/50',
      selectedStyle: 'border-amber-500 bg-amber-950/25',
    },
    {
      id: 'stranded',
      title: 'Stranded / Emergency Provincial Travel',
      description: 'Stranded in the municipality/city with no money for travel fare to return to your home province.',
      icon: ArrowRight,
      iconClass: 'bg-blue-900/60 text-blue-400 border border-blue-600/50',
      selectedStyle: 'border-blue-500 bg-blue-950/25',
    },
    {
      id: 'disability',
      title: 'Family Member with Physical or Mental Disability',
      description: 'A member has a physical, mental, visual, or hearing impairment, or lacks assistive devices like wheelchairs/canes.',
      icon: Users,
      iconClass: 'bg-blue-950/80 text-blue-400 border border-blue-700/50',
      selectedStyle: 'border-blue-500 bg-blue-950/25',
    },
    {
      id: 'senior',
      title: 'Vulnerable Senior Citizen (60+ Years Old)',
      description: 'Living with an elderly parent or relative who has no adequate pension and struggles with medical maintenance.',
      icon: Heart,
      iconClass: 'bg-amber-950/70 text-amber-400 border border-amber-600/50',
      selectedStyle: 'border-amber-500 bg-amber-950/25',
    },
    {
      id: 'soloparent',
      title: 'Single Parent Raising Children Alone',
      description: 'Single-handedly bearing the responsibility of raising minor dependent children without spousal or co-parent support.',
      icon: Users,
      iconClass: 'bg-purple-950/80 text-purple-400 border border-purple-600/50',
      selectedStyle: 'border-purple-500 bg-purple-950/25',
    },
    {
      id: 'children',
      title: 'Young Children (0–5 yrs) Nutrition & Early Daycare',
      description: 'Have infants or toddlers who are underweight, need supplemental milk feeding, or early daycare education.',
      icon: GraduationCap,
      iconClass: 'bg-pink-950/80 text-pink-400 border border-pink-600/50',
      selectedStyle: 'border-pink-500 bg-pink-950/25',
    },
  ];

  // Step 3: Narrative Statement
  const [narrative, setNarrative] = useState<string>('Hihingi po sana ng tulong pinansyal para sa kagyat na gastusin sa pagpapagamot at gamot dahil nawalan ng sapat na kita ang aming pamilya.');
  const [specialCircumstances, setSpecialCircumstances] = useState<string[]>([
    'Family member with chronic illness or needing maintenance',
    'Low-income breadwinner with informal livelihood'
  ]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
      setCurrentStep(1);
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleCircumstance = (item: string) => {
    if (specialCircumstances.includes(item)) {
      setSpecialCircumstances(specialCircumstances.filter((c) => c !== item));
    } else {
      setSpecialCircumstances([...specialCircumstances, item]);
    }
  };

  const steps = [
    { num: 1, label: '1. Household & Demographics' },
    { num: 2, label: '2. Current Hardships & Crisis' },
    { num: 3, label: '3. Narrative Statement' },
    { num: 4, label: '4. Assessment & Recommendations' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className={`relative w-full max-w-5xl my-auto border rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
        darkMode ? 'bg-[#0b1329] border-slate-700/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Top Stepper Navigation Bar */}
        <div className={`px-4 sm:px-5 py-2.5 border-b flex items-center justify-between ${
          darkMode ? 'bg-[#080e1e] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-xs">
            {steps.map((st, idx) => {
              const isActive = currentStep === st.num;
              const isPast = currentStep > st.num;
              return (
                <React.Fragment key={st.num}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(st.num)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow'
                        : isPast
                        ? 'bg-[#0b2426] border border-emerald-500/40 text-emerald-400 hover:bg-[#0e2f31]'
                        : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {isPast && <Check className="w-3 h-3 text-emerald-400" />}
                    {st.num === 4 && !isPast && <Clock className="w-3 h-3 text-slate-400" />}
                    <span>{st.label}</span>
                  </button>
                  {idx < steps.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ml-2 shrink-0 ${
              darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
            }`}
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[78vh]">
          {/* STEP 1: Household & Demographics */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Section Header */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-5 h-5 text-blue-400" />
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Household Profile & Socio–Economic Demographics
                  </h3>
                </div>
                <p className="text-xs text-slate-300">
                  Please provide baseline demographic and living conditions to ensure precise MSWDO policy evaluation.
                </p>
              </div>

              {/* Form 2-Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* 1. Primary Applicant */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Who is the primary applicant?
                  </label>
                  <select
                    value={primaryApplicant}
                    onChange={(e) => setPrimaryApplicant(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0f182e] border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Myself (Individual)">Myself (Individual)</option>
                    <option value="Family Representative / Relative">Family Representative / Relative</option>
                    <option value="Guardian / Authorized Caregiver">Guardian / Authorized Caregiver</option>
                    <option value="Neighbor / Barangay Referrer">Neighbor / Barangay Referrer</option>
                  </select>
                </div>

                {/* 2. Monthly Income */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Estimated Total Monthly Household Income:
                  </label>
                  <select
                    value={householdIncome}
                    onChange={(e) => setHouseholdIncome(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0f182e] border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Below ₱10,000 per month (Indigent threshold)">Below ₱10,000 per month (Indigent threshold)</option>
                    <option value="₱10,001 - ₱20,000 per month (Low income)">₱10,001 - ₱20,000 per month (Low income)</option>
                    <option value="₱20,001 - ₱35,000 per month (Lower-middle income)">₱20,001 - ₱35,000 per month (Lower-middle income)</option>
                    <option value="Above ₱35,000 per month">Above ₱35,000 per month</option>
                  </select>
                </div>

                {/* 3. Barangay of Residence */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-200 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>Barangay of Residence (Within Municipality):</span>
                  </label>
                  <select
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0f182e] border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
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
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Number of Dependent Family Members:
                  </label>
                  <select
                    value={dependentMembers}
                    onChange={(e) => setDependentMembers(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0f182e] border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="None (Living alone)">None (Living alone)</option>
                    <option value="1 to 2 members">1 to 2 members</option>
                    <option value="3 to 5 members">3 to 5 members</option>
                    <option value="6 or more members">6 or more members</option>
                  </select>
                </div>

                {/* 5. Primary Earner Employment Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Primary Earner Employment Status:
                  </label>
                  <select
                    value={employmentStatus}
                    onChange={(e) => setEmploymentStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0f182e] border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Daily Wage / Sideline / Informal vendor">Daily Wage / Sideline / Informal vendor</option>
                    <option value="Unemployed / Displaced worker">Unemployed / Displaced worker</option>
                    <option value="Minimum Wage Earner (Contractual/Agency)">Minimum Wage Earner (Contractual/Agency)</option>
                    <option value="Regular / Full-time Employee">Regular / Full-time Employee</option>
                    <option value="Self-employed / Micro-business">Self-employed / Micro-business</option>
                    <option value="Retired / Pensioner">Retired / Pensioner</option>
                  </select>
                </div>

                {/* 6. Existing Welfare Program Status */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-200 mb-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-400" />
                    <span>Existing Government Social Welfare Program Status:</span>
                  </label>
                  <select
                    value={welfareProgramStatus}
                    onChange={(e) => setWelfareProgramStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0f182e] border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Non-4Ps Household (Direct Citizen Applicant)">Non-4Ps Household (Direct Citizen Applicant)</option>
                    <option value="Active 4Ps Beneficiary Household">Active 4Ps Beneficiary Household</option>
                    <option value="Waitlisted 4Ps Applicant">Waitlisted 4Ps Applicant</option>
                    <option value="Graduated 4Ps Beneficiary">Graduated 4Ps Beneficiary</option>
                  </select>
                </div>

                {/* 7. Health Insurance & Medical Coverage */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-200 mb-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Health Insurance & Medical Coverage (PhilHealth):</span>
                  </label>
                  <select
                    value={healthInsurance}
                    onChange={(e) => setHealthInsurance(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0f182e] border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="PhilHealth Indigent / Sponsored (LGU / DSWD)">PhilHealth Indigent / Sponsored (LGU / DSWD)</option>
                    <option value="PhilHealth Formal / Employed Paying Member">PhilHealth Formal / Employed Paying Member</option>
                    <option value="PhilHealth Senior Citizen Automatic Coverage">PhilHealth Senior Citizen Automatic Coverage</option>
                    <option value="PhilHealth PWD Automatic Coverage">PhilHealth PWD Automatic Coverage</option>
                    <option value="No PhilHealth Coverage / Unenrolled">No PhilHealth Coverage / Unenrolled</option>
                  </select>
                </div>

                {/* 8. Assistance Urgency & Timeline Need */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-200 mb-1.5">
                    <Clock className="w-3.5 h-3.5 text-red-400" />
                    <span>Assistance Urgency & Timeline Need:</span>
                  </label>
                  <select
                    value={urgencyTimeline}
                    onChange={(e) => setUrgencyTimeline(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0f182e] border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Immediate Emergency (Within 24–48h - Hospital Discharge / Burial)">Immediate Emergency (Within 24–48h - Hospital Discharge / Burial)</option>
                    <option value="Urgent (Within 3 to 5 days - Scheduled Chemo/Dialysis/Rent)">Urgent (Within 3 to 5 days - Scheduled Chemo/Dialysis/Rent)</option>
                    <option value="Standard (Within 1 to 2 weeks - Education/Livelihood/AICS)">Standard (Within 1 to 2 weeks - Education/Livelihood/AICS)</option>
                    <option value="Routine / General Assistance Consultation">Routine / General Assistance Consultation</option>
                  </select>
                </div>

                {/* 9. Residency & Housing Condition (Span 2) */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Residency & Housing Condition:
                  </label>
                  <select
                    value={residencyCondition}
                    onChange={(e) => setResidencyCondition(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0f182e] border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
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

          {/* STEP 2: Current Life Situation & Hardships */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Current Life Situation & Hardships
                  </h3>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-300 leading-normal">
                  Select all real-life challenges or emergencies your household is currently facing. Our AI will automatically identify and diagnose the exact government programs you qualify for:
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
                          ? card.selectedStyle
                          : 'bg-[#0e1628] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${card.iconClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 pr-5">
                        <h4 className="text-xs sm:text-[13px] font-bold text-white tracking-tight mb-0.5">
                          {card.title}
                        </h4>
                        <p className="text-[11px] text-slate-300 leading-snug font-normal">
                          {card.description}
                        </p>
                      </div>

                      <div className={`absolute top-3 right-3 w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                        isChecked
                          ? 'bg-blue-600 border-blue-400 text-white'
                          : 'border-slate-600 bg-transparent'
                      }`}>
                        {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
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
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Narrative Statement of Situation
                  </h3>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-300">
                  Describe your family's current emergency or financial hardship in your own words:
                </p>
              </div>

              <div>
                <textarea
                  rows={5}
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  placeholder="Example: I am a single mother of 3 children living in Barangay Poblacion. My youngest child was recently hospitalized with pneumonia, and I currently have no stable work to pay the hospital bill..."
                  className="w-full p-4 bg-[#0e1628] border border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 leading-relaxed resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Or click a pre-filled scenario:
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNarrative('Hospital admission and critical emergency bills for a family member undergoing acute medical intervention, with unsettled hospital bills and costly prescribed maintenance medications.')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-950/60 border border-red-500/50 text-red-300 hover:bg-red-900/60 transition-all cursor-pointer"
                  >
                    <span>🏥</span>
                    <span>Hospital bills & maintenance medicines</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNarrative('I am a solo parent raising minor children without spousal support, struggling to pay for children basic food, milk, school allowance, and requesting small micro-livelihood store capital.')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-950/60 border border-purple-500/50 text-purple-300 hover:bg-purple-900/60 transition-all cursor-pointer"
                  >
                    <span>👶</span>
                    <span>Solo parent needing store capital & child subsidy</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNarrative('Recent sudden demise of my parent with pending funeral parlor balance, casket fees, and burial plot expenses that our indigent family cannot afford.')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800/80 border border-slate-600/60 text-slate-300 hover:bg-slate-700 transition-all cursor-pointer"
                  >
                    <span>💐</span>
                    <span>Bereavement / Funeral expenses for deceased parent</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNarrative('Indigent senior citizen household head with no monthly pension, requiring continuous hypertension/diabetes maintenance medicines and assistive mobility devices like wheelchair/walker.')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-950/60 border border-amber-600/50 text-amber-300 hover:bg-amber-900/60 transition-all cursor-pointer"
                  >
                    <span>👴</span>
                    <span>Indigent senior citizen needing pension & wheelchair</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Assessment & Recommendations */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Assessment & Recommendations (AI Pre-Screening Results)
                  </h3>
                </div>
                <p className="text-xs text-slate-300">
                  Diagnostic evaluation matched against current Quezon City MSWDO eligibility policies and assistance guidelines.
                </p>
              </div>

              {/* Status Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 to-[#0e2722] border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-emerald-200">
                      High Eligibility Match Confirmed (Priority Category 1)
                    </h4>
                    <p className="text-xs text-emerald-300/80">
                      Household meets indigent vulnerability criteria based on reported monthly income and emergency indicators.
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>98% Policy Match</span>
                </div>
              </div>

              {/* Recommended Social Welfare Programs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Recommended Programs for Immediate Application:
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#0f182e] border border-blue-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">AICS Medical & Hospitalization Guarantee</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-400/40 font-bold">100% Eligible</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      ₱5,000 – ₱20,000 financial guarantee letter directly addressed to accredited hospital partners.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0f182e] border border-slate-700/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">QC Funeral Assistance Guarantee Letter</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-400/40 font-bold">Eligible</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Up to ₱10,000 direct service coverage with accredited funeral parlor partners.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0f182e] border border-slate-700/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Educational Grant for Indigent Children</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-400/40 font-bold">Eligible</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      ₱5,000 cash grant per school term for verified indigent student dependents.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0f182e] border border-slate-700/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Sustainable Livelihood Program Micro-Grant</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-600 font-bold">Recommended</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Micro-enterprise capital and skills training for informal and daily wage earners.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className={`px-4 sm:px-6 py-2.5 sm:py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2.5 ${
          darkMode ? 'bg-[#080e1e] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <p className="text-[10px] sm:text-[11px] italic text-slate-400 leading-tight">
            * This AI assessment serves as an automated pre-screening diagnostic. Official approval is subject to case validation by the licensed MSWDO Social Worker.
          </p>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            )}

            {currentStep < 4 ? (
              currentStep === 3 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md border border-blue-400/40 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Analyze & Generate AI Recommendation</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md border border-blue-400/40 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-3.5 h-3.5" />
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
                <span>Complete Diagnostic & View Services</span>
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
