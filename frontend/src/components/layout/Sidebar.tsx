import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  BookOpen, 
  ShieldAlert,
  UserCheck, 
  Users, 
  Heart,
  GraduationCap, 
  Wallet, 
  FileText,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

// Custom clean PWD Wheelchair Icon matching official accessibility symbol
const WheelchairIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="4" r="2" />
    <path d="M10 8.5v5h4.5l2 5h2.5" />
    <circle cx="9" cy="16.5" r="4" />
  </svg>
);

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen?: (open: boolean) => void;
  darkMode?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const [livelihoodOpen, setLivelihoodOpen] = useState<boolean>(false);
  const { t } = useLanguage();

  const [currentUserData] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const citizenName = currentUserData?.name || 
    (currentUserData?.first_name ? `${currentUserData.first_name} ${currentUserData.last_name || ''}`.trim() : 'Jefferson Lee');
  
  const citizenInitials = (() => {
    const parts = citizenName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    if (parts.length === 1 && parts[0].length >= 1) return parts[0].slice(0, 2).toUpperCase();
    return 'JL';
  })();

  const mainNavItems = [
    { id: 'help-guide', label: t('nav.guide'), icon: BookOpen },
    { id: 'aics', label: t('nav.aics'), icon: ShieldAlert },
    { id: 'pwd', label: t('nav.pwd'), icon: WheelchairIcon },
    { id: 'senior', label: t('nav.senior'), icon: UserCheck },
    { id: 'soloparent', label: t('nav.solo_parent'), icon: Users },
    { id: 'childwelfare', label: t('nav.child_welfare'), icon: Heart },
    { id: 'livelihood', label: t('nav.livelihood'), icon: GraduationCap },
  ];

  const handleMobileSelect = (tabId: string) => {
    setActiveTab(tabId);
    if (setIsOpen) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* =========================================================================
          MOBILE OFF-CANVAS SLIDE-OUT DRAWER (Visible when isOpen is true on mobile)
          Matches reference mobile student portal drawer layout
      ========================================================================= */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen?.(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 max-w-[85vw] bg-[#070e1b] border-r border-slate-800 flex flex-col shadow-2xl md:hidden transition-transform duration-300 ease-in-out text-slate-100 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Drawer Top Header: Logo + Title + Close Button */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/60 shrink-0 bg-[#070e1b]">
          <div className="flex items-center gap-2.5">
            <img
              src="/Government Service Integrity Seal.png"
              alt="Government Service Integrity Seal"
              className="w-8 h-8 object-contain shrink-0"
            />
            <div className="flex flex-col justify-center">
              <h1 className="font-extrabold text-sm tracking-tight leading-none text-white">GovServe</h1>
              <span className="text-[10px] font-medium tracking-wide text-blue-400">Citizen Portal</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen?.(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Profile Card (Matching Reference Student Dashboard Drawer) */}
        <div className="p-4 border-b border-slate-800/80 bg-gradient-to-b from-[#10203e] to-[#070e1b]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-black text-base flex items-center justify-center border-2 border-blue-400/40 shadow-lg shrink-0">
              {citizenInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-extrabold text-sm text-white truncate">{citizenName}</div>
              <div className="text-[11px] text-slate-400 truncate select-none">QC Citizen</div>
              <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-[9px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 select-none">
                Active Resident
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Nav Links */}
        <div className="p-3 space-y-4 overflow-y-auto flex-1">
          <div className="px-3 text-[10px] font-extrabold tracking-wider uppercase text-slate-500">
            CITIZEN SERVICES
          </div>

          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isLivelihood = item.id === 'livelihood';
              const isActive = 
                activeTab === item.id ||
                (item.id === 'childwelfare' && activeTab === 'aics-educational') ||
                (item.id === 'pwd' && activeTab === 'pwd-form') ||
                (item.id === 'senior' && activeTab === 'senior-form') ||
                (item.id === 'soloparent' && (activeTab === 'soloparent-form' || activeTab === 'soloparent-financial-form' || activeTab === 'soloparent-edu-form')) ||
                (item.id === 'aics' && (activeTab === 'aics-medical' || activeTab === 'aics-funeral')) ||
                (isLivelihood && (activeTab.startsWith('livelihood') || activeTab === 'skills-training'));

              return (
                <div key={item.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (isLivelihood) {
                        setLivelihoodOpen(!livelihoodOpen);
                        handleMobileSelect('livelihood');
                      } else {
                        handleMobileSelect(item.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[13px] font-semibold transition-all border ${
                      isActive
                        ? 'bg-[#152747] text-white border-blue-500/30 shadow-md'
                        : 'bg-transparent text-[#94a3b8] hover:text-white hover:bg-[#101e38] border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-[#94a3b8]'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isLivelihood && (
                      livelihoodOpen 
                        ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>

                  {isLivelihood && livelihoodOpen && (
                    <div className="pl-9 pr-2 py-1 space-y-1">
                      <button
                        type="button"
                        onClick={() => handleMobileSelect('livelihood')}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold ${
                          activeTab === 'livelihood'
                            ? 'bg-blue-600/30 text-blue-300 font-extrabold border border-blue-500/40'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        Livelihood Program
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMobileSelect('skills-training')}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold ${
                          activeTab === 'skills-training'
                            ? 'bg-blue-600/30 text-blue-300 font-extrabold border border-blue-500/40'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        Skills Training Program
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Financial Aid Disbursement */}
            <button
              type="button"
              onClick={() => handleMobileSelect('payout')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 justify-start rounded-2xl text-[13px] font-semibold transition-all border ${
                activeTab === 'payout'
                  ? 'bg-[#152747] text-white border-blue-500/30 shadow-md'
                  : 'bg-transparent text-[#94a3b8] hover:text-white hover:bg-[#101e38] border-transparent'
              }`}
            >
              <Wallet className={`w-4 h-4 shrink-0 ${activeTab === 'payout' ? 'text-blue-400' : 'text-[#94a3b8]'}`} />
              <span className="truncate">{t('nav.disbursement')}</span>
            </button>
          </nav>

          {/* Section Divider & Histories */}
          <div className="pt-2 border-t border-slate-800/60">
            <div className="px-3 text-[10px] font-extrabold tracking-wider uppercase mb-2 text-slate-500">
              HISTORIES
            </div>
            <button
              type="button"
              onClick={() => handleMobileSelect('history')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 justify-start rounded-2xl text-[13px] font-semibold transition-all border ${
                activeTab === 'history'
                  ? 'bg-[#152747] text-white border-blue-500/30 shadow-md'
                  : 'bg-transparent text-[#94a3b8] hover:text-white hover:bg-[#101e38] border-transparent'
              }`}
            >
              <FileText className={`w-4 h-4 shrink-0 ${activeTab === 'history' ? 'text-blue-400' : 'text-[#94a3b8]'}`} />
              <span className="truncate">{t('nav.history')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          DESKTOP SIDEBAR (Static/Docked, visible only on md: screens and wider)
      ========================================================================= */}
      <aside
        className={`shrink-0 border-r border-slate-800/80 transition-all duration-300 flex-col select-none bg-[#070e1b] text-slate-100 h-screen hidden md:flex ${
          isOpen ? 'w-64' : 'w-16'
        }`}
      >
        {/* Top Header inside Sidebar matching reference screenshot */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/60 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src="/Government Service Integrity Seal.png"
              alt="Government Service Integrity Seal"
              className="w-9 h-9 object-contain shrink-0"
            />
            {isOpen && (
              <div className="flex flex-col justify-center truncate">
                <h1 className="font-extrabold text-base tracking-tight leading-none text-white">GovServe</h1>
                <span className="text-[10px] font-medium tracking-wide text-slate-400">Citizen Portal</span>
              </div>
            )}
          </div>
          {setIsOpen && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-slate-400 hover:text-white transition-colors shrink-0 ml-1 cursor-pointer"
              title={isOpen ? undefined : "Expand Sidebar"}
            >
              {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>

        <div className="p-3 space-y-4 overflow-y-auto flex-1">
          {/* Main Navigation Items */}
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isLivelihood = item.id === 'livelihood';
              const isActive = 
                activeTab === item.id ||
                (item.id === 'childwelfare' && activeTab === 'aics-educational') ||
                (item.id === 'pwd' && activeTab === 'pwd-form') ||
                (item.id === 'senior' && activeTab === 'senior-form') ||
                (item.id === 'soloparent' && (activeTab === 'soloparent-form' || activeTab === 'soloparent-financial-form' || activeTab === 'soloparent-edu-form')) ||
                (item.id === 'aics' && (activeTab === 'aics-medical' || activeTab === 'aics-funeral')) ||
                (isLivelihood && (activeTab.startsWith('livelihood') || activeTab === 'skills-training'));

              return (
                <div key={item.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (isLivelihood) {
                        setLivelihoodOpen(!livelihoodOpen);
                        if (!activeTab.startsWith('livelihood') && activeTab !== 'skills-training') {
                          setActiveTab('livelihood');
                        }
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    className={`w-full flex items-center ${
                      isOpen ? 'justify-between px-4 py-3' : 'justify-center p-3'
                    } rounded-2xl text-[13px] font-semibold transition-all duration-150 border group cursor-pointer ${
                      isActive
                        ? 'bg-[#152747] text-white border-blue-500/30'
                        : 'bg-transparent text-[#94a3b8] hover:text-white hover:bg-[#101e38] border-transparent'
                    }`}
                    title={isOpen ? undefined : item.label}
                  >
                    <div className="flex items-center gap-3.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive 
                          ? 'text-blue-400' 
                          : 'text-[#94a3b8] group-hover:text-white'
                      }`} />
                      {isOpen && <span className="truncate">{item.label}</span>}
                    </div>
                    {isOpen && isLivelihood && (
                      livelihoodOpen 
                        ? <ChevronUp className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                        : <ChevronDown className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                    )}
                  </button>

                  {/* Sub-menu items for Livelihood & Training */}
                  {isOpen && isLivelihood && livelihoodOpen && (
                    <div className="pl-9 pr-2 py-1 space-y-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab('livelihood')}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          activeTab === 'livelihood' || activeTab.startsWith('livelihood-')
                            ? 'bg-blue-600/30 text-blue-300 font-extrabold border border-blue-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        Livelihood Program
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('skills-training')}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          activeTab === 'skills-training'
                            ? 'bg-blue-600/30 text-blue-300 font-extrabold border border-blue-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        Skills Training Program
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Financial Aid Disbursement */}
            <button
              type="button"
              onClick={() => setActiveTab('payout')}
              className={`w-full flex items-center ${
                isOpen ? 'gap-3.5 px-4 py-3 justify-start' : 'justify-center p-3'
              } rounded-2xl text-[13px] font-semibold transition-all duration-150 border group cursor-pointer ${
                activeTab === 'payout'
                  ? 'bg-[#152747] text-white border-blue-500/30'
                  : 'bg-transparent text-[#94a3b8] hover:text-white hover:bg-[#101e38] border-transparent'
              }`}
              title={isOpen ? undefined : "Financial Aid Disbursement"}
            >
              <Wallet className={`w-4 h-4 shrink-0 transition-colors ${
                activeTab === 'payout'
                  ? 'text-blue-400'
                  : 'text-[#94a3b8] group-hover:text-white'
              }`} />
              {isOpen && <span className="truncate">{t('nav.disbursement')}</span>}
            </button>
          </nav>

          {/* Section Divider & Histories */}
          <div className="pt-2 border-t border-slate-800/60">
            {isOpen && (
              <div className="px-4 text-[10px] font-bold tracking-wider uppercase mb-2 text-slate-500">
                HISTORIES
              </div>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center ${
                isOpen ? 'gap-3.5 px-4 py-3 justify-start' : 'justify-center p-3'
              } rounded-2xl text-[13px] font-semibold transition-all duration-150 border group cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-[#152747] text-white border-blue-500/30'
                  : 'bg-transparent text-[#94a3b8] hover:text-white hover:bg-[#101e38] border-transparent'
              }`}
              title={isOpen ? undefined : t('nav.history')}
            >
              <FileText className={`w-4 h-4 shrink-0 transition-colors ${
                activeTab === 'history'
                  ? 'text-blue-400'
                  : 'text-[#94a3b8] group-hover:text-white'
              }`} />
              {isOpen && <span className="truncate">{t('nav.history')}</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
