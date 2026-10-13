import React from 'react';
import { 
  MapPin, 
  Home, 
  FileText, 
  ClipboardList, 
  ArrowRight, 
  Sun, 
  Moon 
} from 'lucide-react';

interface LandingViewProps {
  onAccessPortal: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onAccessPortal,
  darkMode = true,
  onToggleDarkMode,
}) => {
  return (
    <div className={`min-h-screen w-full flex flex-col font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-300 ${
      darkMode ? 'bg-[#050a14] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Top Navbar */}
      <header className="w-full px-6 py-4 max-w-7xl mx-auto flex items-center justify-between">
        {/* Left Branding - Clean image with no outer border ring */}
        <div className="flex items-center gap-3 select-none">
          <img
            src="/Government Service Integrity Seal.png"
            alt="Seal"
            className="w-8 h-8 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span className={`font-extrabold text-base sm:text-lg tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Gov Service
          </span>
        </div>

        {/* Right Dark / Light Mode Toggle */}
        {onToggleDarkMode && (
          <button
            type="button"
            onClick={onToggleDarkMode}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-md ${
              darkMode 
                ? 'bg-[#0d1628] border-slate-700/80 hover:border-slate-500 text-amber-400' 
                : 'bg-white border-slate-300 hover:border-slate-400 text-blue-600'
            }`}
            title="Toggle Light / Dark mode"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-4 pb-12 flex flex-col justify-center">
        
        {/* Title & Subtitle */}
        <div className="text-center max-w-xl mx-auto space-y-3">
          <h1 className="text-2xl sm:text-3xl lg:text-[38px] font-extrabold tracking-tight leading-tight text-center drop-shadow-sm">
            <span className="bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-400 bg-clip-text text-transparent block sm:whitespace-nowrap">
              Social Services Management
            </span>
            <span className={`block mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Made Simple
            </span>
          </h1>

          <p className={`text-xs font-normal leading-relaxed max-w-md mx-auto pt-0.5 ${
            darkMode ? 'text-slate-300/90' : 'text-slate-600'
          }`}>
            A comprehensive digital platform for crisis assistance, PWD and senior citizen services, solo parent support, and livelihood training.
          </p>

          {/* Access the Portal CTA Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onAccessPortal}
              className="px-6 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] active:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-full shadow-[0_0_20px_rgba(26,115,232,0.5)] inline-flex items-center gap-2 transition-all duration-300 hover:scale-105 cursor-pointer group"
            >
              <span>Access the Portal</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Feature Cards Grid (2x2 Grid - 2 per row) */}
        <div className="mt-10 max-w-[500px] mx-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Card 1: AICS */}
            <div className={`border rounded-2xl p-4 text-left transition-all duration-300 cursor-pointer group ${
              darkMode 
                ? 'bg-[#0b1324] border-[#141e33] hover:bg-[#101b33] hover:border-slate-700/80 hover:shadow-2xl' 
                : 'bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-lg'
            }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105 ${
                darkMode ? 'bg-[#181932] text-[#a78bfa] border border-[#2c2858]' : 'bg-purple-50 text-purple-600 border border-purple-200'
              }`}>
                <MapPin className="w-4 h-4 stroke-[2.2]" />
              </div>
              <h3 className={`font-bold text-xs sm:text-sm mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                AICS
              </h3>
              <p className={`text-[11px] font-normal leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Crisis assistance for medical, burial, and educational needs
              </p>
            </div>

            {/* Card 2: PWD & Senior Citizen */}
            <div className={`border rounded-2xl p-4 text-left transition-all duration-300 cursor-pointer group ${
              darkMode 
                ? 'bg-[#0b1324] border-[#141e33] hover:bg-[#101b33] hover:border-slate-700/80 hover:shadow-2xl' 
                : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:shadow-lg'
            }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105 ${
                darkMode ? 'bg-[#122728] text-[#34d399] border border-[#1b4344]' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}>
                <Home className="w-4 h-4 stroke-[2.2]" />
              </div>
              <h3 className={`font-bold text-xs sm:text-sm mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                PWD & Senior Citizen
              </h3>
              <p className={`text-[11px] font-normal leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                ID issuance and social pension enrollment
              </p>
            </div>

            {/* Card 3: Solo Parent & Child Welfare */}
            <div className={`border rounded-2xl p-4 text-left transition-all duration-300 cursor-pointer group ${
              darkMode 
                ? 'bg-[#0b1324] border-[#141e33] hover:bg-[#101b33] hover:border-slate-700/80 hover:shadow-2xl' 
                : 'bg-white border-slate-200/90 hover:border-rose-300 hover:shadow-lg'
            }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105 ${
                darkMode ? 'bg-[#291522] text-[#f43f5e] border border-[#481e39]' : 'bg-rose-50 text-rose-600 border border-rose-200'
              }`}>
                <FileText className="w-4 h-4 stroke-[2.2]" />
              </div>
              <h3 className={`font-bold text-xs sm:text-sm mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Solo Parent & Child Welfare
              </h3>
              <p className={`text-[11px] font-normal leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Solo parent and child welfare monitoring
              </p>
            </div>

            {/* Card 4: Livelihood & Training */}
            <div className={`border rounded-2xl p-4 text-left transition-all duration-300 cursor-pointer group ${
              darkMode 
                ? 'bg-[#0b1324] border-[#141e33] hover:bg-[#101b33] hover:border-slate-700/80 hover:shadow-2xl' 
                : 'bg-white border-slate-200/90 hover:border-amber-300 hover:shadow-lg'
            }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105 ${
                darkMode ? 'bg-[#271f16] text-[#fbbf24] border border-[#46321b]' : 'bg-amber-50 text-amber-600 border border-amber-200'
              }`}>
                <ClipboardList className="w-4 h-4 stroke-[2.2]" />
              </div>
              <h3 className={`font-bold text-xs sm:text-sm mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Livelihood & Training
              </h3>
              <p className={`text-[11px] font-normal leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Skills training and starter kit assistance
              </p>
            </div>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="mt-8 max-w-[720px] mx-auto w-full">
          <div className={`border rounded-2xl p-4 sm:p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-y md:divide-y-0 md:divide-x ${
            darkMode 
              ? 'bg-[#0a1122]/90 border-[#141e33] divide-slate-800/80' 
              : 'bg-white border-slate-200 divide-slate-200 shadow-md'
          }`}>
            {/* Stat 1 */}
            <div className="pt-2 md:pt-0">
              <span className={`text-xl sm:text-2xl font-extrabold block tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                100%
              </span>
              <span className={`text-[11px] font-bold block mt-0.5 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                Digital Process
              </span>
              <span className={`text-[10px] block mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Paperless & Seamless
              </span>
            </div>

            {/* Stat 2 */}
            <div className="pt-3 md:pt-0 md:pl-3">
              <span className={`text-xl sm:text-2xl font-extrabold block tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                24/7
              </span>
              <span className={`text-[11px] font-bold block mt-0.5 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                System Access
              </span>
              <span className={`text-[10px] block mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Available Anytime
              </span>
            </div>

            {/* Stat 3 */}
            <div className="pt-3 md:pt-0 md:pl-3">
              <span className={`text-xl sm:text-2xl font-extrabold block tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                4 Core
              </span>
              <span className={`text-[11px] font-bold block mt-0.5 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                Welfare Programs
              </span>
              <span className={`text-[10px] block mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Integrated Services
              </span>
            </div>

            {/* Stat 4 */}
            <div className="pt-3 md:pt-0 md:pl-3">
              <span className={`text-xl sm:text-2xl font-extrabold block tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Real-Time
              </span>
              <span className={`text-[11px] font-bold block mt-0.5 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                Status Updates
              </span>
              <span className={`text-[10px] block mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Instant Tracking
              </span>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className={`w-full text-center text-[11px] font-medium py-4 border-t mt-6 ${
        darkMode ? 'border-slate-800/60 text-slate-500' : 'border-slate-200 text-slate-500'
      }`}>
        © 2026 Social Services Management System. Secure Government Platform.
      </footer>
    </div>
  );
};
