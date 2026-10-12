import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface ModuleCard {
  title: string;
  description: string;
  requirements?: string[];
  processingTime?: string;
  benefitAmount?: string;
}

interface ModuleCardGridProps {
  activeTab: string;
  onApply: (title: string, description: string) => void;
  darkMode?: boolean;
}

export const ModuleCardGrid: React.FC<ModuleCardGridProps> = ({ activeTab, onApply, darkMode = true }) => {
  const { language, t } = useLanguage();
  const isTagalog = language === 'Tagalog';

  const getCardsForTab = (): { cards: ModuleCard[]; maxCols: string } => {
    switch (activeTab) {
      case 'aics':
        return {
          maxCols: 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto',
          cards: [
            {
              title: isTagalog ? 'Tulong sa Pagpapalibing (Burial Assistance)' : 'Burial / Funeral Assistance',
              description: isTagalog 
                ? 'Ang Programa ng Tulong sa Pagpapalibing sa ilalim ng Ordinansa 2865 S-2019 ay nagbibigay ng tulong pinansyal sa pamamagitan ng Guarantee Letter (GL) sa mga accredited partner funeral homes hanggang Php25,000.'
                : 'The Funeral and Burial Assistance Program under Ordinance 2865 S-2019 provides financial aid through a Guarantee Letter (GL) to accredited partner funeral homes, covering service packages up to Php25,000.',
            },
            {
              title: isTagalog ? 'Tulong Medikal at Ospital (Medical Assistance)' : 'Medical Assistance',
              description: isTagalog
                ? 'Ang Programa ng Tulong Medikal ay nagpoprotekta sa kalusugan ng mga residenteng nangangailangan, na nagbibigay ng tulong sa hospitalization, laboratoryo, gamot, at kagamitang medikal.'
                : 'The Medical Assistance Program safeguards the health of residents unable to meet medical needs, providing financial or medical support for hospitalization, laboratory examinations, medicines, and supplies.',
            },
          ],
        };

      case 'pwd':
        return {
          maxCols: 'grid-cols-1 max-w-2xl mx-auto',
          cards: [
            {
              title: isTagalog ? 'Programa ng Tulong Panlipunan para sa PWD' : 'PWD Social Assistance Program',
              description: isTagalog
                ? 'Nagbibigay ng espesyal na tulong pinansyal, subsidiya sa kalusugan, kagamitan (wheelchair, baston), at ayuda sa emergency para sa mga kapus-palad na Persons with Disabilities (PWD) at kanilang pamilya.'
                : 'The PWD Social Assistance Program provides specialized financial aid, healthcare subsidies, assistive devices (wheelchairs, crutches, walkers), and emergency social safety nets for indigent Persons with Disabilities and their families to address disability-related vulnerabilities.',
            },
          ],
        };

      case 'senior':
        return {
          maxCols: 'grid-cols-1 max-w-2xl mx-auto',
          cards: [
            {
              title: isTagalog ? 'Programa ng Tulong para sa Senior Citizen' : 'Senior Citizen Social Assistance Program',
              description: isTagalog
                ? 'Nagbibigay ng espesyal na tulong pinansyal, subsidiya sa kalusugan, at ayudang pampensyon para sa mga nakatatandang mamamayan sa Quezon City.'
                : 'The Senior Citizen Social Assistance Program provides specialized financial aid, healthcare subsidies, and emergency social safety nets for indigent Senior Citizens and their families to address senior-related vulnerabilities.',
            },
          ],
        };

      case 'soloparent':
        return {
          maxCols: 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto',
          cards: [
            {
              title: isTagalog ? 'Tulong Pinansyal Subsidy para sa Solo Parent' : 'Solo Parent Financial Subsidy Program',
              description: isTagalog
                ? 'SEKTOR NG SOLO PARENT: Ang mga kwalipikadong aplikante ay makatatanggap ng cash subsidy. Para sa mga nag-iisang magulang na nakatutugon sa pamantayan sa kita at dokumentasyon.'
                : 'SOLO PARENT SECTOR: Qualified applicants may receive financial subsidy. For qualified Solo Parents who meet the applicable income and program requirements. Eligibility is subject to document verification and assessment before approval.',
            },
            {
              title: isTagalog ? 'Tulong sa Edukasyon ng Anak ng Solo Parent' : 'Solo Parent Educational Assistance Program',
              description: isTagalog
                ? 'Tulong pampinansyal sa edukasyon na Php5,000 bawat kwalipikadong anak ng indigent solo parents na kasalukuyang nag-aaral sa pampublikong paaralan.'
                : "Educational financial assistance for indigent solo parents' dependent children/beneficiaries who are currently studying. The program includes solo parents with two (2) or more children enrolled in public school, providing financial assistance of P5,000 per qualified beneficiary, subject to interview and social worker assessment prior to granting assistance.",
            },
          ],
        };

      case 'childwelfare':
        return {
          maxCols: 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto',
          cards: [
            {
              title: isTagalog ? 'Tulong sa Edukasyon para sa mga Bata at Kabataan' : 'Educational Assistance for Indigent Children & Youth',
              description: isTagalog
                ? 'Nagbibigay ng tulong pampinansyal sa pag-aaral para sa mga kapus-palad na bata, anak ng solo parent, at mga batang may kapansanan (CWD) sa Lungsod Quezon.'
                : "Provides educational and financial aid support for indigent children & youth, solo parents' children/beneficiaries, and children with disabilities (CWD) residing in Quezon City.",
            },
            {
              title: isTagalog ? 'Serbisyo sa Kalinga at Proteksyon ng Bata' : 'Child Welfare Services',
              description: isTagalog
                ? 'Komprehensibong kalinga, proteksyon, at pagsusuri para sa kaligtasan at karapatan ng mga bata at kabataan sa Lungsod Quezon.'
                : 'Comprehensive care, protection, and developmental welfare services dedicated to ensuring the well-being and rights of children and youth in Quezon City.',
            },
          ],
        };

      case 'livelihood':
      case 'livelihood-grants':
        return {
          maxCols: 'grid-cols-1 max-w-2xl mx-auto',
          cards: [
            {
              title: isTagalog ? 'Pondo sa Pangkabuhayan (Puhunan hanggang ₱15,000)' : 'Livelihood Micro-Enterprise Seed Capital',
              description: isTagalog
                ? 'Pondong puhunan hanggang Php15,000 para sa pagtatayo ng maliit na sari-sari store, carwash, pagtatahi, o negosyo sa pagkain para sa mga kwalipikadong mamamayan.'
                : 'Capital grant up to P15,000 for starting small sari-sari store, carwash, tailoring, or food vending business for qualified beneficiaries.',
            },
          ],
        };

      case 'skills-training':
        return {
          maxCols: 'grid-cols-1 max-w-2xl mx-auto',
          cards: [
            {
              title: isTagalog ? 'Libreng Pagsasanay sa Bokasyonal at Skills' : 'Skills & Vocational Training Program',
              description: isTagalog
                ? 'Libreng pagsasanay sa TESDA Accredited courses kabilang ang Bread & Pastry, Computer Hardware Servicing, Caregiving, at Electrical Installation.'
                : 'Free skills and vocational training courses (TESDA Accredited) including Bread & Pastry, Computer Hardware Servicing, Caregiving, and Electrical Installation.',
            },
          ],
        };

      case 'payout':
        return {
          maxCols: 'grid-cols-1 max-w-2xl mx-auto',
          cards: [
            {
              title: isTagalog ? 'Pamamahagi ng Ayuda at QR Voucher Claim' : 'Financial Aid Disbursement & QR Voucher Claim',
              description: isTagalog
                ? 'I-claim ang inaprubahang ayuda sa pamamagitan ng GCash, Maya, Landbank, o magpakita ng QR Voucher sa mga partner city treasury counters.'
                : 'Claim approved financial grants via GCash, Maya, Landbank payout, or present QR voucher at partner city treasury counters.',
            },
          ],
        };

      default:
        return { cards: [], maxCols: 'grid-cols-1' };
    }
  };

  const { cards, maxCols } = getCardsForTab();

  if (cards.length === 0) return null;

  return (
    <div className="py-6 px-2">
      <div className={`grid ${maxCols} gap-6 items-stretch`}>
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`rounded-2xl border shadow-md overflow-hidden flex flex-col justify-between transition-all duration-300 group ${
              darkMode 
                ? 'bg-[#0f1b35] border-blue-900/40 hover:border-blue-500/50 hover:shadow-2xl' 
                : 'bg-white border-slate-300 hover:border-blue-500 shadow-slate-200/80 hover:shadow-xl'
            }`}
          >
            <div>
              {/* Top Banner Header of Card */}
              <div className={`border-b px-5 py-4 text-center ${
                darkMode ? 'bg-[#1b345d] border-blue-800/40' : 'bg-blue-50/90 border-blue-200'
              }`}>
                <h3 className={`text-sm sm:text-base font-extrabold leading-snug tracking-wide ${
                  darkMode ? 'text-white' : 'text-blue-950'
                }`}>
                  {card.title}
                </h3>
              </div>

              {/* Card Body Text */}
              <div className="p-6 text-center">
                <p className={`text-xs sm:text-sm leading-relaxed font-medium ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  {card.description}
                </p>
              </div>
            </div>

            {/* Bottom Centered APPLY NOW Button */}
            <div className="pb-6 pt-2 text-center">
              <button
                type="button"
                onClick={() => onApply(card.title, card.description)}
                className={`font-extrabold text-xs tracking-wider uppercase inline-flex items-center justify-center gap-1.5 hover:underline transition-colors cursor-pointer ${
                  darkMode ? 'text-cyan-400 group-hover:text-cyan-300' : 'text-blue-600 group-hover:text-blue-800'
                }`}
              >
                {t('btn.apply_now')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
