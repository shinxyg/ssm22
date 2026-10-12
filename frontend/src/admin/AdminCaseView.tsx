import React, { useState } from 'react';
import { Search, Folder, Clock, Activity, CheckCircle2, ChevronDown, FileText } from 'lucide-react';

export const AdminCaseView: React.FC<{ darkMode?: boolean }> = ({ darkMode = true }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [programFilter, setProgramFilter] = useState<string>('All Programs');
  const [statusFilter, setStatusFilter] = useState<string>('All Statuses');
  const [priorityFilter, setPriorityFilter] = useState<string>('All Priorities');

  return (
    <div className={`space-y-6 select-none font-['Plus_Jakarta_Sans',sans-serif] ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      <div>
        <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Case Management
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`border rounded-2xl p-5 shadow-lg flex justify-between items-start ${
          darkMode ? 'bg-[#0e1726] border-slate-800/90 text-white' : 'bg-white border-slate-200/90 text-slate-900'
        }`}>
          <div>
            <span className={`text-[11px] font-bold tracking-wider uppercase block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>TOTAL CASES</span>
            <div className={`text-3xl font-extrabold tracking-tight mt-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>0</div>
          </div>
          <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-950/60 border border-blue-500/30 text-blue-400' : 'bg-blue-100 border border-blue-200 text-blue-600'}`}>
            <Folder className="w-4 h-4" />
          </div>
        </div>

        <div className={`border rounded-2xl p-5 shadow-lg flex justify-between items-start ${
          darkMode ? 'bg-[#0e1726] border-slate-800/90 text-white' : 'bg-white border-slate-200/90 text-slate-900'
        }`}>
          <div>
            <span className={`text-[11px] font-bold tracking-wider uppercase block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>OPEN CASES</span>
            <div className={`text-3xl font-extrabold tracking-tight mt-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>0</div>
          </div>
          <div className={`p-2 rounded-xl ${darkMode ? 'bg-amber-950/60 border border-amber-500/30 text-amber-400' : 'bg-amber-100 border border-amber-200 text-amber-600'}`}>
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className={`border rounded-2xl p-5 shadow-lg flex justify-between items-start ${
          darkMode ? 'bg-[#0e1726] border-slate-800/90 text-white' : 'bg-white border-slate-200/90 text-slate-900'
        }`}>
          <div>
            <span className={`text-[11px] font-bold tracking-wider uppercase block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>MONITORING & REFERRED</span>
            <div className={`text-3xl font-extrabold tracking-tight mt-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>0</div>
          </div>
          <div className={`p-2 rounded-xl ${darkMode ? 'bg-purple-950/60 border border-purple-500/30 text-purple-400' : 'bg-purple-100 border border-purple-200 text-purple-600'}`}>
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className={`border rounded-2xl p-5 shadow-lg flex justify-between items-start ${
          darkMode ? 'bg-[#0e1726] border-slate-800/90 text-white' : 'bg-white border-slate-200/90 text-slate-900'
        }`}>
          <div>
            <span className={`text-[11px] font-bold tracking-wider uppercase block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>CLOSED CASES</span>
            <div className={`text-3xl font-extrabold tracking-tight mt-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>0</div>
          </div>
          <div className={`p-2 rounded-xl ${darkMode ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400' : 'bg-emerald-100 border border-emerald-200 text-emerald-600'}`}>
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className={`border rounded-2xl p-5 space-y-4 shadow-xl ${
        darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90 shadow-sm'
      }`}>
        <div className="relative w-full">
          <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
          <input
            type="text"
            placeholder="SEARCH BY CLIENT NAME, CASE NUMBER (CM-...), QCID, OR REFERENCE NUMBER..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${
              darkMode ? 'bg-[#0b1220] border-slate-700/80 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
            }`}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-extrabold tracking-wider uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Program:</span>
              <div className="relative">
                <select
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                  className={`appearance-none border rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer ${
                    darkMode ? 'bg-[#0b1220] border-slate-700/80 text-slate-200' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                  }`}
                >
                  <option value="All Programs">All Programs</option>
                  <option value="AICS">AICS</option>
                  <option value="PWD">PWD</option>
                  <option value="Senior Citizen">Senior Citizen</option>
                  <option value="Solo Parent">Solo Parent</option>
                  <option value="Child Welfare">Child Welfare</option>
                  <option value="Livelihood Program">Livelihood Program</option>
                  <option value="Training Program">Training Program</option>
                </select>
                <ChevronDown className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-extrabold tracking-wider uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Status:</span>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`appearance-none border rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer ${
                    darkMode ? 'bg-[#0b1220] border-slate-700/80 text-slate-200' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                  }`}
                >
                  <option value="All Statuses">All Statuses</option>
                  <option value="Under Monitoring">Under Monitoring</option>
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
                <ChevronDown className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-extrabold tracking-wider uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Priority:</span>
              <div className="relative">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className={`appearance-none border rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer ${
                    darkMode ? 'bg-[#0b1220] border-slate-700/80 text-slate-200' : 'bg-white border-slate-300 text-slate-900 shadow-sm'
                  }`}
                >
                  <option value="All Priorities">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <ChevronDown className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
              </div>
            </div>
          </div>

          <div className={`text-[11px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Showing <strong className={darkMode ? 'text-slate-200' : 'text-slate-900'}>0</strong> of <strong className={darkMode ? 'text-slate-200' : 'text-slate-900'}>0</strong> approved cases
          </div>
        </div>
      </div>

      <div className={`border rounded-2xl p-16 text-center shadow-xl flex flex-col items-center justify-center ${
        darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90 shadow-sm'
      }`}>
        <div className={`p-3.5 rounded-2xl mb-3 border ${
          darkMode ? 'bg-[#121c2e] border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
        }`}>
          <FileText className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h4 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>No cases found</h4>
        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Try adjusting your search terms or filters.</p>
      </div>
    </div>
  );
};
