import React from 'react';
import { ServiceItem } from '../../types';
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
  ShieldAlert
} from 'lucide-react';

interface ServiceCatalogProps {
  services: ServiceItem[];
  onSelectService: (service: ServiceItem) => void;
  filterTitle?: string;
  darkMode?: boolean;
}

export const ServiceCatalog: React.FC<ServiceCatalogProps> = ({
  services,
  onSelectService,
  filterTitle = "Available Social Services Programs",
  darkMode = true,
}) => {
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

  return (
    <div id="service-catalog" className="py-6 scroll-mt-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className={`text-lg font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {filterTitle}
          </h3>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Select a service to view qualifications, required documents, or file your digital application.
          </p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-mono border ${
          darkMode ? 'bg-slate-800 text-blue-400 border-slate-700' : 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
        }`}>
          {services.length} Programs Found
        </span>
      </div>

      {services.length === 0 ? (
        <div className={`text-center py-12 border rounded-2xl p-6 ${
          darkMode ? 'bg-[#0e172a]/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h4 className={`text-base font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>No Services Found</h4>
          <p className={`text-xs max-w-sm mx-auto mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Try adjusting your search criteria or filter category above to browse available programs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service) => {
            const Icon = getIcon(service.iconName);
            return (
              <div
                key={service.id}
                className={`group relative border rounded-2xl p-5 shadow-md hover:shadow-xl transition-colors duration-200 flex flex-col justify-between [transform:translateZ(0)] ${
                  darkMode 
                    ? 'bg-[#0e172a] border-slate-800 hover:border-blue-500/50' 
                    : 'bg-white border-slate-200 hover:border-blue-400'
                }`}
              >
                <div>
                  {/* Top Badge & Category */}
                  <div className="flex justify-between items-start mb-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                      darkMode ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'
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

                  {/* Description */}
                  <p className={`text-xs line-clamp-2 leading-relaxed mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {service.description}
                  </p>

                  {/* Requirements List Preview */}
                  <div className={`space-y-1.5 mb-4 p-2.5 rounded-xl border ${
                    darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Required Documents:
                    </span>
                    {service.requirements.slice(0, 2).map((req, idx) => (
                      <div key={idx} className={`flex items-center gap-1.5 text-[11px] truncate ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="truncate">{req}</span>
                      </div>
                    ))}
                    {service.requirements.length > 2 && (
                      <span className="text-[10px] text-blue-500 pl-4 block font-medium">
                        +{service.requirements.length - 2} more requirements
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
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-500 hover:text-white bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 px-3 py-1.5 rounded-xl transition-all"
                  >
                    <span>Apply / Details</span>
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
