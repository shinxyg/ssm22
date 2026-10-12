import React from 'react';
import { FileSearch, FileEdit, UserCheck, CreditCard } from 'lucide-react';

interface HowItWorksProps {
  darkMode?: boolean;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ darkMode = true }) => {
  const steps = [
    {
      stepNumber: '01',
      title: 'Select Service & Requirements',
      description:
        'Choose the service you need (AICS Aid, PWD, Senior Citizen, Solo Parent, Child Welfare, Livelihood & Training) and prepare digital document files.',
      icon: FileSearch,
      iconBg: darkMode ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' : 'bg-blue-100 border-blue-300 text-blue-600',
    },
    {
      stepNumber: '02',
      title: 'Fill Online Form & Upload',
      description:
        'Provide your citizen details, barangay address, and upload legible scanned copies or photos of supporting requirements.',
      icon: FileEdit,
      iconBg: darkMode ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400' : 'bg-indigo-100 border-indigo-300 text-indigo-600',
    },
    {
      stepNumber: '03',
      title: 'Social Worker Assessment',
      description:
        'Assigned City Social Workers review your submission, evaluate financial eligibility, and approve assistance grants or ID cards.',
      icon: UserCheck,
      iconBg: darkMode ? 'bg-purple-600/20 border-purple-500/40 text-purple-400' : 'bg-purple-100 border-purple-300 text-purple-600',
    },
    {
      stepNumber: '04',
      title: 'Approval & Payout / ID Claim',
      description:
        'Receive real-time status update, official QR Claim Voucher for financial payout, or notification to pick up your ID booklet.',
      icon: CreditCard,
      iconBg: darkMode ? 'bg-teal-600/20 border-teal-500/40 text-teal-400' : 'bg-teal-100 border-teal-300 text-teal-600',
    },
  ];

  return (
    <section className="py-8">
      {/* Title Header */}
      <div className="text-center mb-8">
        <h3 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          How the Social Services Application Works
        </h3>
        <p className={`text-xs sm:text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Four simple steps from application filing to official payout and ID releasing.
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
                <span>Learn more</span>
                <span className="ml-1">→</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
