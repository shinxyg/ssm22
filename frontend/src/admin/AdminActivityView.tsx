import React, { useState, useEffect } from 'react';
import { Search, CheckCircle2, XCircle, ChevronDown, Trash2, Activity, RotateCcw, FileText, Info } from 'lucide-react';

interface ActivityLog {
  id: number;
  timestamp: string;
  staff_name: string;
  action: string;
  module: string;
  details: string;
  reference_no?: string;
  is_deleted?: boolean;
  deleted_at?: string;
}

export const AdminActivityView: React.FC<{ darkMode?: boolean }> = ({ darkMode = true }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [deletedLogs, setDeletedLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('All Modules');
  const [actionFilter, setActionFilter] = useState<string>('All Actions');
  const [isRecentlyDeletedView, setIsRecentlyDeletedView] = useState<boolean>(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/activity-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/activity-logs?deleted=true');
      if (res.ok) {
        const data = await res.json();
        setDeletedLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch deleted activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isRecentlyDeletedView) {
      fetchDeletedLogs();
    } else {
      fetchLogs();
    }
  }, [isRecentlyDeletedView]);

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/activity-logs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLogs(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to soft delete activity log:', err);
    }
  };

  const handleDeleteAll = async () => {
    if (logs.length === 0) return;
    if (!window.confirm('Are you sure you want to move ALL activity logs to Recently Deleted?')) return;
    try {
      const res = await fetch('http://localhost:5000/api/activity-logs/bulk/soft-delete-all', { method: 'DELETE' });
      if (res.ok) {
        setLogs([]);
      }
    } catch (err) {
      console.error('Failed to soft delete all activity logs:', err);
    }
  };

  const handleRestore = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/activity-logs/${id}/restore`, { method: 'POST' });
      if (res.ok) {
        setDeletedLogs(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to restore activity log:', err);
    }
  };

  const handlePermanentDeleteSingle = async (id: number) => {
    if (!window.confirm('Permanently delete this activity log record? This cannot be undone.')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/activity-logs/${id}/permanent`, { method: 'DELETE' });
      if (res.ok) {
        setDeletedLogs(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to permanently delete activity log:', err);
    }
  };

  const handleEmptyTrash = async () => {
    if (deletedLogs.length === 0) return;
    if (!window.confirm('PERMANENTLY DELETE ALL LOGS in Recently Deleted? This CANNOT be undone!')) return;
    try {
      const res = await fetch('http://localhost:5000/api/activity-logs/bulk/empty-trash', { method: 'DELETE' });
      if (res.ok) {
        setDeletedLogs([]);
      }
    } catch (err) {
      console.error('Failed to empty trash activity logs:', err);
    }
  };

  // Stats
  const totalEntries = logs.length;
  const approvedCount = logs.filter(l => l.action.toLowerCase().includes('approve') || l.action === 'Approved').length;
  const rejectedCount = logs.filter(l => l.action.toLowerCase().includes('reject') || l.action === 'Rejected').length;
  const todayCount = logs.filter(l => {
    if (!l.timestamp) return false;
    const d = new Date(l.timestamp);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  }).length;

  // Filtering
  const activeList = isRecentlyDeletedView ? deletedLogs : logs;
  const filteredLogs = activeList.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (item.staff_name && item.staff_name.toLowerCase().includes(q)) ||
      (item.reference_no && item.reference_no.toLowerCase().includes(q)) ||
      (item.details && item.details.toLowerCase().includes(q)) ||
      (item.module && item.module.toLowerCase().includes(q)) ||
      (item.action && item.action.toLowerCase().includes(q));

    const matchesModule = moduleFilter === 'All Modules' || item.module.toLowerCase() === moduleFilter.toLowerCase();
    const matchesAction = actionFilter === 'All Actions' || item.action.toLowerCase().includes(actionFilter.toLowerCase());

    return matchesSearch && matchesModule && matchesAction;
  });

  const formatDate = (isoStr: string) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoStr;
    }
  };

  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('approve')) {
      return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${darkMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border border-emerald-300'}`}><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
    }
    if (act.includes('reject') || act.includes('declin')) {
      return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${darkMode ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-100 text-rose-700 border border-rose-300'}`}><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
    }
    if (act.includes('create') || act.includes('add') || act.includes('register')) {
      return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${darkMode ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-100 text-blue-700 border border-blue-300'}`}><FileText className="w-3.5 h-3.5" /> Created</span>;
    }
    if (act.includes('update') || act.includes('edit') || act.includes('status')) {
      return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${darkMode ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-100 text-amber-700 border border-amber-300'}`}><Info className="w-3.5 h-3.5" /> Updated</span>;
    }
    return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${darkMode ? 'bg-slate-500/10 text-slate-300 border border-slate-500/20' : 'bg-slate-100 text-slate-700 border border-slate-300'}`}>{action}</span>;
  };

  const cardClass = darkMode 
    ? 'bg-[#0e1726] border-slate-800/90 text-white' 
    : 'bg-white border-slate-200/90 text-slate-900 shadow-sm';

  const filterBoxClass = darkMode 
    ? 'bg-[#0e1726] border-slate-800/90' 
    : 'bg-white border-slate-200/90 shadow-sm';

  const inputClass = darkMode 
    ? 'bg-[#0b1220] border-slate-700/80 text-slate-200 placeholder-slate-500 focus:ring-blue-500/50' 
    : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:ring-blue-500/50';

  if (isRecentlyDeletedView) {
    return (
      <div className={`space-y-6 select-none font-['Plus_Jakarta_Sans',sans-serif] animate-in fade-in duration-300 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className={`text-3xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Recently Deleted</h1>
            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Archived audit logs soft-deleted from main record. You can restore or permanently delete them.</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={handleEmptyTrash}
              disabled={deletedLogs.length === 0}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                deletedLogs.length === 0
                  ? 'opacity-40 pointer-events-none bg-rose-950/40 border border-rose-900 text-rose-300'
                  : 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400/40'
              }`}
              title="Permanently delete all logs in Recently Deleted"
            >
              <Trash2 className="w-4 h-4" />
              <span>Permanent Delete All</span>
            </button>

            <button 
              type="button" 
              onClick={() => setIsRecentlyDeletedView(false)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                darkMode 
                  ? 'bg-[#0e1726] hover:bg-[#142036] text-slate-200 border border-slate-700/80' 
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
              }`}
            >
              <RotateCcw className={`w-4 h-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`} />
              <span>Back to Activity Log</span>
            </button>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className={`${filterBoxClass} border rounded-2xl p-16 text-center flex flex-col items-center justify-center`}>
            <div className={`p-3.5 rounded-2xl mb-3 border ${darkMode ? 'bg-[#121c2e] border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
              <Trash2 className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h4 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>No recently deleted logs found</h4>
            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Deleted records and logs will appear here for audit tracking before permanent cleanup.</p>
          </div>
        ) : (
          <div className={`${filterBoxClass} border rounded-2xl overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b uppercase tracking-wider text-[10px] font-extrabold ${
                  darkMode ? 'bg-[#0b1220] border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  <tr>
                    <th className="px-5 py-3.5">Date & Time</th>
                    <th className="px-5 py-3.5">Staff Name</th>
                    <th className="px-5 py-3.5">Module</th>
                    <th className="px-5 py-3.5">Action</th>
                    <th className="px-5 py-3.5">Details</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-medium ${
                  darkMode ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'
                }`}>
                  {filteredLogs.map(log => (
                    <tr key={log.id} className={`transition-colors ${darkMode ? 'hover:bg-[#121d30]/60' : 'hover:bg-slate-50'}`}>
                      <td className={`px-5 py-3.5 whitespace-nowrap font-mono text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(log.timestamp)}</td>
                      <td className={`px-5 py-3.5 font-bold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{log.staff_name}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-lg border font-semibold text-[11px] ${
                          darkMode ? 'bg-slate-800 text-slate-300 border-slate-700/60' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>{log.module}</span>
                      </td>
                      <td className="px-5 py-3.5">{getActionBadge(log.action)}</td>
                      <td className="px-5 py-3.5 max-w-xs">
                        {log.details}
                        {log.reference_no && <span className={`ml-2 font-mono text-[11px] font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>({log.reference_no})</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleRestore(log.id)}
                            className="inline-flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-xl font-bold transition-all text-[11px] cursor-pointer"
                            title="Restore log entry"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePermanentDeleteSingle(log.id)}
                            className="inline-flex items-center gap-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-xl font-bold transition-all text-[11px] cursor-pointer"
                            title="Permanently delete log entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Permanent Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 select-none font-['Plus_Jakarta_Sans',sans-serif] ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>System Security & Activity Log</h1>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Track system actions, staff audits, and status logs in real-time.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            onClick={handleDeleteAll}
            disabled={logs.length === 0}
            className={`flex items-center gap-2 border px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              logs.length === 0
                ? 'opacity-40 pointer-events-none bg-rose-950/40 border-rose-900 text-rose-300'
                : 'bg-rose-950/50 hover:bg-rose-900/80 text-rose-300 border-rose-800/80'
            }`}
            title="Move all active logs to Recently Deleted"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Delete All Logs</span>
          </button>

          <button 
            type="button" 
            onClick={() => setIsRecentlyDeletedView(true)}
            className={`flex items-center gap-2 border px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              darkMode 
                ? 'bg-[#0e1726] hover:bg-[#142036] text-slate-300 border-slate-700/80' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-sm'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Recently Deleted</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`${cardClass} border rounded-2xl p-5`}>
          <div>
            <span className={`text-[11px] font-bold tracking-wider uppercase block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>TOTAL ENTRIES</span>
            <div className={`text-3xl font-extrabold tracking-tight mt-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{totalEntries}</div>
          </div>
        </div>

        <div className={`${cardClass} border rounded-2xl p-5`}>
          <div>
            <span className={`text-[11px] font-bold tracking-wider uppercase block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>APPROVED</span>
            <div className="text-3xl font-extrabold text-emerald-500 tracking-tight mt-2">{approvedCount}</div>
          </div>
        </div>

        <div className={`${cardClass} border rounded-2xl p-5`}>
          <div>
            <span className={`text-[11px] font-bold tracking-wider uppercase block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>REJECTED</span>
            <div className="text-3xl font-extrabold text-rose-500 tracking-tight mt-2">{rejectedCount}</div>
          </div>
        </div>

        <div className={`${cardClass} border rounded-2xl p-5`}>
          <div>
            <span className={`text-[11px] font-bold tracking-wider uppercase block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>TODAY</span>
            <div className={`text-3xl font-extrabold tracking-tight mt-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{todayCount}</div>
          </div>
        </div>
      </div>

      <div className={`${filterBoxClass} border rounded-2xl p-5 space-y-4`}>
        <div className="relative w-full">
          <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
          <input
            type="text"
            placeholder="Search by name, reference no., or staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 transition-all ${inputClass}`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className={`text-[10px] font-extrabold tracking-wider uppercase block mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Module</label>
            <div className="relative">
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className={`w-full appearance-none border rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 transition-all cursor-pointer ${inputClass}`}
              >
                <option value="All Modules">All Modules</option>
                <option value="AICS">AICS</option>
                <option value="PWD">PWD</option>
                <option value="Senior Citizen">Senior Citizen</option>
                <option value="Solo Parent">Solo Parent</option>
                <option value="Child Welfare">Child Welfare</option>
                <option value="Livelihood Program">Livelihood Program</option>
                <option value="Training Program">Training Program</option>
                <option value="User Management">User Management</option>
              </select>
              <ChevronDown className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
            </div>
          </div>

          <div>
            <label className={`text-[10px] font-extrabold tracking-wider uppercase block mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Action</label>
            <div className="relative">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className={`w-full appearance-none border rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 transition-all cursor-pointer ${inputClass}`}
              >
                <option value="All Actions">All Actions</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Created">Created</option>
                <option value="Updated">Updated</option>
              </select>
              <ChevronDown className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
            </div>
          </div>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className={`${filterBoxClass} border rounded-2xl p-16 text-center flex flex-col items-center justify-center`}>
          <div className={`p-3.5 rounded-2xl mb-3 border ${darkMode ? 'bg-[#121c2e] border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
            <Activity className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h4 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>No activity logs found</h4>
          <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>System audit logs will appear here when actions are recorded.</p>
        </div>
      ) : (
        <div className={`${filterBoxClass} border rounded-2xl overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b uppercase tracking-wider text-[10px] font-extrabold ${
                darkMode ? 'bg-[#0b1220] border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                <tr>
                  <th className="px-5 py-3.5">Date & Time</th>
                  <th className="px-5 py-3.5">Staff Name</th>
                  <th className="px-5 py-3.5">Module</th>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Details / Reference</th>
                  <th className="px-5 py-3.5 text-right">Options</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-medium ${
                darkMode ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'
              }`}>
                {filteredLogs.map(log => (
                  <tr key={log.id} className={`transition-colors ${darkMode ? 'hover:bg-[#121d30]/60' : 'hover:bg-slate-50'}`}>
                    <td className={`px-5 py-3.5 whitespace-nowrap font-mono text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(log.timestamp)}</td>
                    <td className={`px-5 py-3.5 font-bold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{log.staff_name}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-lg border font-semibold text-[11px] ${
                        darkMode ? 'bg-slate-800 text-slate-300 border-slate-700/60' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>{log.module}</span>
                    </td>
                    <td className="px-5 py-3.5">{getActionBadge(log.action)}</td>
                    <td className="px-5 py-3.5 max-w-xs">
                      {log.details}
                      {log.reference_no && <span className={`ml-2 font-mono text-[11px] font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>({log.reference_no})</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(log.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          darkMode ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-100'
                        }`}
                        title="Delete log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
