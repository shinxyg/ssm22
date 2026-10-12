import React from 'react';
import { Search, HeartHandshake } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface HeroBannerProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  onOpenTrackModal?: () => void;
  onOpenEligibilityModal: () => void;
  darkMode?: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  onOpenEligibilityModal,
  darkMode = true,
}) => {
  const { language } = useLanguage();
  const isTagalog = language === 'Tagalog';

  const filterPills = [
    { id: 'all', label: isTagalog ? 'Lahat ng Serbisyo' : 'All Services' },
    { id: 'aics', label: isTagalog ? 'Tulong sa Kapus-Palad (AICS)' : 'AICS Crisis Aid (6 Types)' },
    { id: 'pwd_senior', label: isTagalog ? 'PWD at Senior Citizen' : 'PWD & Senior Citizens' },
    { id: 'solo_child', label: isTagalog ? 'Solo Parent at Kalinga sa Bata' : 'Solo Parent & Child Welfare' },
    { id: 'livelihood_payout', label: isTagalog ? 'Pangkabuhayan at Pagsasanay' : 'Livelihood & Training' },
  ];

  return (
    <div className={`relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 px-6 sm:px-8 lg:px-12 py-6 sm:py-7 lg:py-8 border-b shadow-xl transition-all duration-300 ${
      darkMode 
        ? 'bg-gradient-to-r from-[#0d152d] via-[#132247] to-[#0a1124] border-blue-500/20' 
        : 'bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border-blue-400/30'
    }`}>
      {/* Background Seal Graphic Overlay */}
      <div className="absolute -right-8 -top-8 opacity-25 pointer-events-none select-none hidden md:block">
        <img
          src="/Government Service Integrity Seal.png"
          alt="Government Service Integrity Seal"
          className="w-96 h-96 object-contain filter drop-shadow-2xl"
        />
      </div>

      {/* Top Flex Row: Badge */}
      <div className="relative z-10 flex items-center mb-4">
        {/* Badge Pill */}
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-900/80 border border-blue-400/30 text-blue-200 text-xs font-semibold">
          <span>{isTagalog ? 'GovServe Portal ng Mamamayan • Gabay sa Serbisyo at Tulong' : 'Gov Serves Social Services Portal • Help & Service Guide'}</span>
        </div>
      </div>

      {/* Headline & Subtitle */}
      <div className="relative z-10 max-w-3xl mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug mb-1.5">
          {isTagalog ? 'Maligayang Pagdating sa GovServe Portal!' : 'Welcome to GovServe Citizen Portal!'}
        </h2>
        <p className="text-slate-300 text-xs sm:text-[13px] leading-relaxed font-normal">
          {isTagalog 
            ? 'Alamin ang mga magagamit na programa ng tulong pampinansyal (AICS Medikal, Libing, Edukasyon), mga benepisyo sa sektor (PWD, Senior Citizen, Solo Parent), kalinga sa bata, at pondo sa pangkabuhayan.'
            : 'Explore available financial aid programs (AICS Medical, Funeral, Educational), special sector benefits (PWD, Senior Citizen, Solo Parent), child welfare support, and livelihood training grants before filing your digital application.'}
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative z-10 mb-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const elem = document.getElementById('service-catalog');
            if (elem) {
              elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          className="relative max-w-3xl"
        >
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isTagalog ? "Maghanap ng serbisyo, kailangan, o benepisyo (hal. Medikal, Senior Booklet, PWD ID, Libing, Pangkabuhayan)..." : "Search services, requirements, or benefits (e.g. Medical, Senior Booklet, PWD ID, Funeral, Livelihood)..."}
              className="w-full pl-10 pr-16 py-3 bg-[#0d162a] border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/80 focus:border-blue-500 shadow-inner transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Filter Category Pills */}
      <div className="relative z-10 flex flex-wrap items-center gap-2">
        {filterPills.map((pill) => {
          const isActive = activeFilter === pill.id;
          return (
            <button
              key={pill.id}
              onClick={() => {
                setActiveFilter(pill.id);
                const elem = document.getElementById('service-catalog');
                if (elem) {
                  elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white border border-blue-400 shadow-md scale-105'
                  : 'bg-slate-900/80 hover:bg-slate-900 text-slate-200 border border-slate-700/60 hover:border-blue-500/50'
              }`}
            >
              {pill.label}
            </button>
          );
        })}

        {/* Special Blue Pill: Assistance & Eligibility Finder */}
        <button
          onClick={onOpenEligibilityModal}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs border border-blue-400/50 transition-all cursor-pointer"
        >
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>{isTagalog ? 'Tagahanap ng Tulong at Kwalipikasyon' : 'Assistance & Eligibility Finder'}</span>
        </button>
      </div>
    </div>
  );
};
