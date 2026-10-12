import React, { useState, useEffect } from 'react';
import { Search, CheckCircle2, ChevronDown, UserCog, RefreshCw, Power, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { maskEmail, maskPhoneNumber, logDataUnmaskEvent } from '../utils/masking';

interface UserRecord {
  id: number;
  userId: string;
  email: string;
  role: string;
  rawRole: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phoneNumber: string;
  barangay: string;
  city: string;
  status: string;
  isOnline: boolean;
  presence: 'Online' | 'Offline';
  createdAt: string;
}

export const AdminUserView: React.FC<{ darkMode?: boolean }> = ({ darkMode = true }) => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('All Roles');
  const [presenceFilter, setPresenceFilter] = useState<string>('All Presences');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [unmaskedUserIds, setUnmaskedUserIds] = useState<Set<number>>(new Set());

  const toggleUnmaskUser = (u: UserRecord) => {
    setUnmaskedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(u.id)) {
        next.delete(u.id);
      } else {
        next.add(u.id);
        logDataUnmaskEvent(
          'User Management',
          `Admin revealed sensitive email (${u.email}) and contact (${u.phoneNumber}) of citizen ${u.name}`
        );
      }
      return next;
    });
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // Poll every 3 seconds for live real-time presence updates
    const interval = setInterval(fetchUsers, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleStatus = async (user: UserRecord) => {
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    setUpdatingId(user.id);
    try {
      const res = await fetch(`http://localhost:5000/api/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
        );
      }
    } catch (err) {
      console.error('Failed to update user status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phoneNumber.toLowerCase().includes(q) ||
      u.userId.toLowerCase().includes(q);

    const matchesRole =
      roleFilter === 'All Roles' ||
      (roleFilter === 'Administrator' && (u.rawRole === 'admin' || u.role === 'Administrator')) ||
      (roleFilter === 'User / Beneficiary' && (u.rawRole === 'user' || u.role === 'User / Beneficiary')) ||
      (roleFilter === 'Social Worker' && u.rawRole === 'social_worker');

    const matchesPresence =
      presenceFilter === 'All Presences' ||
      (presenceFilter === 'Online' && u.isOnline) ||
      (presenceFilter === 'Offline' && !u.isOnline);

    return matchesSearch && matchesRole && matchesPresence;
  });

  // Metric Stats
  const totalCount = users.length;
  const onlineCount = users.filter((u) => u.isOnline).length;
  const offlineCount = users.filter((u) => !u.isOnline).length;
  const adminCount = users.filter((u) => u.rawRole === 'admin' || u.role === 'Administrator').length;

  return (
    <div className={`space-y-6 select-none font-['Plus_Jakarta_Sans',sans-serif] ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            User Management
          </h1>
        </div>
      </div>

      {/* Top 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`border rounded-2xl p-5 shadow-lg ${
          darkMode ? 'bg-[#0e1726] border-slate-800/90 text-white' : 'bg-white border-slate-200/90 text-slate-900'
        }`}>
          <div>
            <span className={`text-[11px] font-bold tracking-wider uppercase block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>TOTAL USERS</span>
            <div className={`text-3xl font-extrabold tracking-tight mt-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{totalCount}</div>
          </div>
        </div>

        <div className={`border rounded-2xl p-5 shadow-lg ${
          darkMode ? 'bg-[#0e1726] border-slate-800/90 text-white' : 'bg-white border-slate-200/90 text-slate-900'
        }`}>
          <div>
            <span className={`text-[11px] font-bold tracking-wider uppercase block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>ONLINE USERS</span>
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight mt-2">{onlineCount}</div>
          </div>
        </div>

        <div className={`border rounded-2xl p-5 shadow-lg ${
          darkMode ? 'bg-[#0e1726] border-slate-800/90 text-white' : 'bg-white border-slate-200/90 text-slate-900'
        }`}>
          <div>
            <span className={`text-[11px] font-bold tracking-wider uppercase block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>OFFLINE USERS</span>
            <div className={`text-3xl font-extrabold tracking-tight mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{offlineCount}</div>
          </div>
        </div>

        <div className={`border rounded-2xl p-5 shadow-lg ${
          darkMode ? 'bg-[#0e1726] border-slate-800/90 text-white' : 'bg-white border-slate-200/90 text-slate-900'
        }`}>
          <div>
            <span className={`text-[11px] font-bold tracking-wider uppercase block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>ADMINISTRATORS</span>
            <div className="text-3xl font-extrabold text-purple-400 tracking-tight mt-2">{adminCount}</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className={`border rounded-2xl p-5 space-y-4 shadow-xl ${
        darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200/90'
      }`}>
        <div className="relative w-full">
          <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
          <input
            type="text"
            placeholder="Search by full name, email, contact number, or User ID (USR-...)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono border ${
              darkMode ? 'bg-[#0b1220] border-slate-700/80 text-slate-200 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-extrabold tracking-wider uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Account Role:</span>
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className={`appearance-none rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer border ${
                    darkMode ? 'bg-[#0b1220] border-slate-700/80 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="All Roles">All Roles</option>
                  <option value="Administrator">Administrator</option>
                  <option value="User / Beneficiary">User / Beneficiary</option>
                  <option value="Social Worker">Social Worker</option>
                </select>
                <ChevronDown className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-extrabold tracking-wider uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Presence Status:</span>
              <div className="relative">
                <select
                  value={presenceFilter}
                  onChange={(e) => setPresenceFilter(e.target.value)}
                  className={`appearance-none rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer border ${
                    darkMode ? 'bg-[#0b1220] border-slate-700/80 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="All Presences">All Presences</option>
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                </select>
                <ChevronDown className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
              </div>
            </div>
          </div>

          <div className={`text-[11px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Showing <strong className={darkMode ? 'text-slate-200' : 'text-slate-900'}>{filteredUsers.length}</strong> of <strong className={darkMode ? 'text-slate-200' : 'text-slate-900'}>{users.length}</strong> registered accounts
          </div>
        </div>
      </div>

      {/* Registered Accounts List Table */}
      <div className="space-y-3">
        <h3 className={`text-sm font-bold tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Registered Accounts <span className={`font-mono text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>({filteredUsers.length})</span>
        </h3>

        {filteredUsers.length === 0 ? (
          <div className={`border rounded-2xl p-16 text-center shadow-xl flex flex-col items-center justify-center ${
            darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200'
          }`}>
            <div className={`p-3.5 rounded-2xl mb-3 border ${darkMode ? 'bg-[#121c2e] border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
              <UserCog className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h4 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>No registered accounts found</h4>
            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Try adjusting your search query or role filters.</p>
          </div>
        ) : (
          <div className={`border rounded-2xl shadow-xl overflow-hidden ${
            darkMode ? 'bg-[#0e1726] border-slate-800/90' : 'bg-white border-slate-200'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b text-[10px] font-extrabold uppercase tracking-wider ${
                  darkMode ? 'bg-[#0b1220] border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  <tr>
                    <th className="px-5 py-3.5">USER ID</th>
                    <th className="px-5 py-3.5">FULL NAME</th>
                    <th className="px-5 py-3.5">EMAIL & CONTACT</th>
                    <th className="px-5 py-3.5">ROLE</th>
                    <th className="px-5 py-3.5">PRESENCE STATUS</th>
                    <th className="px-5 py-3.5 text-right">ACCESS CONTROL</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-medium ${
                  darkMode ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'
                }`}>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className={`transition-colors ${
                      darkMode ? 'hover:bg-[#121c2e]/60' : 'hover:bg-slate-50'
                    }`}>
                      <td className="px-5 py-4 font-mono font-bold text-blue-400 whitespace-nowrap">
                        {u.userId}
                      </td>
                      <td className={`px-5 py-4 font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        <div>{u.name}</div>
                        {u.barangay && u.barangay !== 'N/A' && (
                          <span className={`text-[10px] font-normal ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Brgy. {u.barangay}</span>
                        )}
                      </td>
                      <td className={`px-5 py-4 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {(() => {
                          const isUnmasked = unmaskedUserIds.has(u.id);
                          const isAdmin = u.rawRole === 'admin';
                          return (
                            <div className="flex items-center gap-2">
                              <div>
                                <div className={`font-mono ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                  {isAdmin || isUnmasked ? u.email : maskEmail(u.email, true)}
                                </div>
                                <div className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {isAdmin || isUnmasked ? u.phoneNumber : maskPhoneNumber(u.phoneNumber, true)}
                                </div>
                              </div>
                              {!isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => toggleUnmaskUser(u)}
                                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                    isUnmasked
                                      ? 'bg-blue-950/60 border-blue-700/80 text-blue-400 hover:bg-blue-900/80'
                                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                                  }`}
                                  title={isUnmasked ? 'Click to mask citizen data' : 'Click to unmask citizen data'}
                                >
                                  {isUnmasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                          u.rawRole === 'admin'
                            ? 'bg-purple-950/80 border border-purple-500/40 text-purple-300'
                            : 'bg-blue-950/80 border border-blue-500/40 text-blue-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          u.isOnline
                            ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-900 border border-slate-700/80 text-slate-400'
                        }`}>
                          {u.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={updatingId === u.id}
                          title={u.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                            u.status === 'Active'
                              ? 'bg-rose-950/40 border-rose-800/80 text-rose-300 hover:bg-rose-900/60'
                              : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60'
                          } ${updatingId === u.id ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{u.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
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
    </div>
  );
};
