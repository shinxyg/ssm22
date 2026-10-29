import React, { useMemo } from 'react';
import { ServiceItem } from '../../types';
import { RecommendedProgramItem, localizeMatchReason } from '../modals/EligibilityFinderModal';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Stethoscope, 
  GraduationCap, 
  Cross, 
  Bus, 
  ShoppingBag, 
  Accessibility, 
  UserCheck, 
  Users, 
  Heart, 
  Briefcase, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';

interface ServiceCatalogProps {
  services: ServiceItem[];
  onSelectService: (service: ServiceItem) => void;
  filterTitle?: string;
  darkMode?: boolean;
  recommendedPrograms?: RecommendedProgramItem[];
}

export const ServiceCatalog: React.FC<ServiceCatalogProps> = ({
  services,
  onSelectService,
  filterTitle = "Available Social Services Programs",
  darkMode = true,
  recommendedPrograms = [],
}) => {
  const { language } = useLanguage();
  const isTagalog = language === 'Tagalog';

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'medical': return Stethoscope;
      case 'education': return GraduationCap;
      case 'funeral': return Cross;
      case 'transport': return Bus;
      case 'food': return ShoppingBag;
      case 'pwd': return Accessibility;
      case 'senior': return UserCheck;
      case 'soloparent': return Users;
      case 'child': return Heart;
      case 'livelihood': return Briefcase;
      default: return ShieldAlert;
    }
  };

  // Match a ServiceItem to an AI RecommendedProgramItem if applicable
  const findRecommendationForService = (service: ServiceItem): { item: RecommendedProgramItem; rankIndex: number } | null => {
    if (!recommendedPrograms || recommendedPrograms.length === 0) return null;

    for (let i = 0; i < recommendedPrograms.length; i++) {
      const rec = recommendedPrograms[i];
      const tab = (rec.tabKey || '').toLowerCase();
      const progName = (rec.programName || '').toLowerCase();

      if (tab === 'aics-medical' && service.id === 'aics-medical') return { item: rec, rankIndex: i };
      if (tab === 'aics-funeral' && service.id === 'aics-funeral') return { item: rec, rankIndex: i };
      if (tab === 'pwd-form' && service.id === 'pwd-social-assistance') return { item: rec, rankIndex: i };
      if (tab === 'senior-form' && service.id === 'senior-social-pension') return { item: rec, rankIndex: i };
      if ((tab === 'soloparent-financial-form' || tab === 'soloparent-form') && service.id === 'soloparent-financial') {
        return { item: rec, rankIndex: i };
      }
      if (tab === 'soloparent-edu-form' && service.id === 'soloparent-edu') return { item: rec, rankIndex: i };
      if (tab === 'aics-educational' && service.id === 'childwelfare-edu') return { item: rec, rankIndex: i };
      if (tab === 'childwelfare-form' && service.id === 'childwelfare-services') return { item: rec, rankIndex: i };
      if (tab === 'livelihood' && service.id === 'livelihood-grant') return { item: rec, rankIndex: i };
      if (tab === 'skills-training' && service.id === 'training-bread-pastry') return { item: rec, rankIndex: i };

      // Fallback title match
      if (progName && service.title.toLowerCase().includes(progName)) {
        return { item: rec, rankIndex: i };
      }
    }

    return null;
  };

  // Automatically place AI Recommended services at the very top of the catalog
  const sortedServices = useMemo(() => {
    if (!recommendedPrograms || recommendedPrograms.length === 0) return services;

    return [...services].sort((a, b) => {
      const recA = findRecommendationForService(a);
      const recB = findRecommendationForService(b);

      if (recA && !recB) return -1;
      if (!recA && recB) return 1;
      if (recA && recB) return recA.rankIndex - recB.rankIndex;
      return 0;
    });
  }, [services, recommendedPrograms]);

  return (
    <div id="service-catalog" className="py-6 scroll-mt-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className={`text-lg font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {isTagalog && filterTitle === "Available Social Services Programs"
              ? "Mga Magagamit na Programa ng Social Services"
              : filterTitle}
          </h3>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {isTagalog
              ? "Pumili ng serbisyo upang makita ang kwalipikasyon, kailangang dokumento, o magpasa ng digital na aplikasyon."
              : "Select a service to view qualifications, required documents, or file your digital application."}
          </p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-mono border ${
          darkMode ? 'bg-slate-800 text-blue-400 border-slate-700' : 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
        }`}>
          {sortedServices.length} {isTagalog ? "Programa" : "Programs Found"}
        </span>
      </div>

      {sortedServices.length === 0 ? (
        <div className={`text-center py-12 border rounded-2xl p-6 ${
          darkMode ? 'bg-[#0e172a]/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h4 className={`text-base font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            {isTagalog ? "Walang Nahanap na Serbisyo" : "No Services Found"}
          </h4>
          <p className={`text-xs max-w-sm mx-auto mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {isTagalog
              ? "Subukang palitan ang piniling kategorya sa itaas upang makita ang mga programa."
              : "Try adjusting your filter category above to browse available programs."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedServices.map((service) => {
            const Icon = getIcon(service.iconName);
            const matchedRec = findRecommendationForService(service);
            const isPrimaryRec = matchedRec?.rankIndex === 0;

            return (
              <div
                key={service.id}
                className={`group relative border rounded-2xl p-5 shadow-md hover:shadow-xl transition-colors duration-200 flex flex-col justify-between [transform:translateZ(0)] ${
                  matchedRec
                    ? darkMode
                      ? 'bg-[#0e1b33] border-emerald-500/60 ring-1 ring-emerald-500/30 hover:border-emerald-400'
                      : 'bg-emerald-50/30 border-emerald-400 ring-1 ring-emerald-300 hover:border-emerald-500'
                    : darkMode 
                      ? 'bg-[#0e172a] border-slate-800 hover:border-blue-500/50' 
                      : 'bg-white border-slate-200 hover:border-blue-400'
                }`}
              >
                <div>
                  {/* AI Recommended Banner Tag if matched */}
                  {matchedRec && (
                    <div className={`mb-3 px-3 py-1.5 rounded-xl border flex items-center justify-between gap-2 ${
                      isPrimaryRec
                        ? darkMode
                          ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                          : 'bg-emerald-100 border-emerald-300 text-emerald-800'
                        : darkMode
                          ? 'bg-blue-950/70 border-blue-500/50 text-blue-300'
                          : 'bg-blue-100 border-blue-300 text-blue-800'
                    }`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider truncate">
                          {isTagalog
                            ? `Inirekomenda ng AI • ${isPrimaryRec ? 'Pangunahing Rekomendasyon' : 'Pangalawang Rekomendasyon'}`
                            : `AI Recommended For You • ${isPrimaryRec ? 'Primary Recommendation' : 'Secondary Recommendation'}`}
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold shrink-0">
                        {matchedRec.item.matchConfidence}% {isTagalog ? 'Tugma' : 'Match'}
                      </span>
                    </div>
                  )}

                  {/* Top Badge & Category */}
                  <div className="flex justify-between items-start mb-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                      matchedRec
                        ? darkMode ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-emerald-100 border-emerald-300 text-emerald-700'
                        : darkMode ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {service.badge && (
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        darkMode ? 'bg-blue-900/50 text-blue-300 border-blue-600/40' : 'bg-blue-100 text-blue-800 border-blue-300'
                      }`}>
                        {service.badge}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className={`text-base font-bold transition-colors mb-2 ${
                    darkMode ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-600'
                  }`}>
                    {service.title}
                  </h4>

                  {/* Benefit / Amount if present */}
                  {service.benefitAmount && (
                    <div className="text-xs font-semibold text-amber-500 mb-2.5 flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded border ${
                        darkMode ? 'bg-amber-400/10 border-amber-400/20' : 'bg-amber-50 border-amber-200 font-bold'
                      }`}>
                        {service.benefitAmount}
                      </span>
                    </div>
                  )}

                  {/* AI Recommendation Reason Box */}
                  {matchedRec && (
                    <div className={`mb-3 p-2.5 rounded-xl border text-[11px] leading-relaxed ${
                      darkMode
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    }`}>
                      <span className="font-extrabold uppercase tracking-wider text-[10px] block mb-0.5">
                        {isTagalog ? 'Bakit Inirekomenda Para sa Iyo:' : 'Why Recommended For You:'}
                      </span>
                      {localizeMatchReason(matchedRec.item.tabKey, matchedRec.item.matchReason, isTagalog)}
                    </div>
                  )}

                  {/* Description */}
                  <p className={`text-xs line-clamp-2 leading-relaxed mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {service.description}
                  </p>

                  {/* Requirements List Preview */}
                  <div className={`space-y-1.5 mb-4 p-2.5 rounded-xl border ${
                    darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isTagalog ? 'Mga Kailangang Dokumento:' : 'Required Documents:'}
                    </span>
                    {service.requirements.slice(0, 2).map((req, idx) => (
                      <div key={idx} className={`flex items-center gap-1.5 text-[11px] truncate ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="truncate">{req}</span>
                      </div>
                    ))}
                    {service.requirements.length > 2 && (
                      <span className="text-[10px] text-blue-500 pl-4 block font-medium">
                        +{service.requirements.length - 2} {isTagalog ? 'iba pang requirements' : 'more requirements'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className={`pt-3 border-t flex items-center justify-between ${
                  darkMode ? 'border-slate-800/80' : 'border-slate-200'
                }`}>
                  <span className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Est. {service.processingTime}
                  </span>
                  <button
                    onClick={() => onSelectService(service)}
                    className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      matchedRec
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40 shadow-sm'
                        : 'text-blue-500 hover:text-white bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30'
                    }`}
                  >
                    <span>{isTagalog ? 'Mag-apply / Detalye' : 'Apply / Details'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
