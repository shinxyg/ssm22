import React from 'react';
import { FileSearch, FileEdit, UserCheck, CreditCard } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface HowItWorksProps {
  darkMode?: boolean;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ darkMode = true }) => {
  const { language } = useLanguage();
  const isTagalog = language === 'Tagalog';

  const uniformBlueIconClass = darkMode
    ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
    : 'bg-blue-100 border-blue-300 text-blue-600';

  const steps = [
    {
      stepNumber: '01',
      title: isTagalog ? 'Pumili ng Serbisyo at Requirements' : 'Select Service & Requirements',
      description: isTagalog
        ? 'Piliin ang kailangang tulong (AICS Aid, PWD, Senior Citizen, Solo Parent, Child Welfare, Livelihood & Training) at ihanda ang mga digital na dokumento.'
        : 'Choose the service you need (AICS Aid, PWD, Senior Citizen, Solo Parent, Child Welfare, Livelihood & Training) and prepare digital document files.',
      icon: FileSearch,
      iconBg: uniformBlueIconClass,
    },
    {
      stepNumber: '02',
      title: isTagalog ? 'Sagutan ang Online Form at Mag-upload' : 'Fill Online Form & Upload',
      description: isTagalog
        ? 'Ilagay ang iyong detalye, barangay address, at i-upload ang malinaw na kopya o larawan ng mga kailangang dokumento.'
        : 'Provide your citizen details, barangay address, and upload legible scanned copies or photos of supporting requirements.',
      icon: FileEdit,
      iconBg: uniformBlueIconClass,
    },
    {
      stepNumber: '03',
      title: isTagalog ? 'Pagsusuri ng Social Worker' : 'Social Worker Assessment',
      description: isTagalog
        ? 'Susuriin ng nakatalagang Social Worker ang iyong aplikasyon, titingnan ang kwalipikasyon, at aaprubahan ang tulong o ID.'
        : 'Assigned City Social Workers review your submission, evaluate financial eligibility, and approve assistance grants or ID cards.',
      icon: UserCheck,
      iconBg: uniformBlueIconClass,
    },
    {
      stepNumber: '04',
      title: isTagalog ? 'Pag-apruba at Payout / Pagkuha ng ID' : 'Approval & Payout / ID Claim',
      description: isTagalog
        ? 'Makatanggap ng real-time status update, opisyal na QR Claim Voucher para sa financial payout, o abiso sa pagkuha ng iyong ID booklet.'
        : 'Receive real-time status update, official QR Claim Voucher for financial payout, or notification to pick up your ID booklet.',
      icon: CreditCard,
      iconBg: uniformBlueIconClass,
    },
  ];

  return (
    <section className="py-8">
      {/* Title Header */}
      <div className="text-center mb-8">
        <h3 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          {isTagalog ? 'Paano Gumagana ang Aplikasyon sa Social Services' : 'How the Social Services Application Works'}
        </h3>
        <p className={`text-xs sm:text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {isTagalog
            ? 'Apat na simpleng hakbang mula sa pagpasa ng aplikasyon hanggang sa opisyal na payout at pag-release ng ID.'
            : 'Four simple steps from application filing to official payout and ID releasing.'}
        </p>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.stepNumber}
              className={`relative rounded-2xl border p-5 transition-all duration-300 shadow-xl flex flex-col justify-between group ${
                darkMode
                  ? 'bg-[#0e172a]/90 border-slate-800 hover:border-blue-500/40 hover:bg-[#111d36]'
                  : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-2xl'
              }`}
            >
              <div>
                {/* Header Row: Icon & Large Step Number */}
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-inner ${step.iconBg}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-2xl font-extrabold font-mono transition-colors ${
                    darkMode ? 'text-slate-600 group-hover:text-blue-400/80' : 'text-slate-300 group-hover:text-blue-600'
                  }`}>
                    {step.stepNumber}
                  </span>
                </div>

                {/* Card Title */}
                <h4 className={`text-sm font-bold mb-2 leading-snug ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                  {step.title}
                </h4>

                {/* Card Description */}
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {step.description}
                </p>
              </div>

              {/* Bottom decorative bar */}
              <div className={`mt-4 pt-3 border-t flex items-center text-[11px] font-semibold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity ${
                darkMode ? 'border-slate-800/60' : 'border-slate-200'
              }`}>
                <span>{isTagalog ? 'Alamin pa' : 'Learn more'}</span>
                <span className="ml-1">→</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
