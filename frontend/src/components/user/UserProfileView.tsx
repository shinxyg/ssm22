import React, { useState, useEffect } from 'react';
import { useLanguage, Language } from '../../context/LanguageContext';
import { API_BASE_URL } from '../../config/api';
import { 
  User, 
  Key, 
  ShieldAlert, 
  Camera, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  CreditCard,
  Laptop,
  Globe,
  Lock,
  Save,
  Trash2,
  AlertTriangle,
  LogOut,
  Monitor,
  Clock,
  MapPin,
  Languages,
  Check,
  Tablet,
  Smartphone,
  ShieldCheck
} from 'lucide-react';

interface UserProfileViewProps {
  darkMode?: boolean;
  userRole?: 'user' | 'admin';
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ 
  darkMode = true, 
  userRole = 'user' 
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'personal' | 'devices' | 'language'>('account');
  const { language, setLanguage, t } = useLanguage();


  // Account Information States
  const [email, setEmail] = useState<string>(
    userRole === 'admin' ? 'admin@gmail.com' : 'jeffersonlee1234@gmail.com'
  );
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [showCurrentPass, setShowCurrentPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);
  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);
  const [passSaveMsg, setPassSaveMsg] = useState<string | null>(null);
  const [passErrorMsg, setPassErrorMsg] = useState<string | null>(null);
  const [isSavingPass, setIsSavingPass] = useState<boolean>(false);

  // Personal Information States
  const [firstName, setFirstName] = useState<string>('JEFFERSON');
  const [middleName, setMiddleName] = useState<string>('FERNANDO');
  const [lastName, setLastName] = useState<string>('LEE');
  const [suffix, setSuffix] = useState<string>('');

  const [birthMonth, setBirthMonth] = useState<string>('SEPTEMBER');
  const [birthDay, setBirthDay] = useState<string>('27');
  const [birthYear, setBirthYear] = useState<string>('2004');
  const [bloodType, setBloodType] = useState<string>('O+');

  const [city, setCity] = useState<string>('QUEZON CITY');
  const [houseNo, setHouseNo] = useState<string>('176');
  const [street, setStreet] = useState<string>('23');
  const [barangay, setBarangay] = useState<string>('BAGONG SILANGAN');

  const [workingInQC, setWorkingInQC] = useState<string>('Yes');
  const [occupation, setOccupation] = useState<string>('IT SUPPORT');
  const [civilStatus, setCivilStatus] = useState<string>('Single');
  const [sex, setSex] = useState<string>('Male');
  const [mobileNumber, setMobileNumber] = useState<string>('09155582122');

  const [showQcidModal, setShowQcidModal] = useState<boolean>(false);

  // Device Management & Sessions State
  interface UserSession {
    id: number;
    user_id: string;
    email: string;
    session_token: string;
    device_type: 'desktop' | 'tablet' | 'mobile';
    os_name: string;
    browser_name: string;
    ip_address: string;
    location: string;
    signed_in_at: string;
    last_active_at: string;
    is_active: boolean;
  }

  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(false);
  const [currentSessionToken, setCurrentSessionToken] = useState<string>('');
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  const maskIp = (ip: string) => {
    if (!ip) return '120.28.•••.•••';
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.•••.•••`;
    }
    return `${ip.substring(0, 7)}•••.•••`;
  };

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return 'Active recently';
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 5) return 'Active now';
      if (mins < 60) return `Active ${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `Active ${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days === 1) return 'Active Yesterday';
      return `Active ${days}d ago`;
    } catch {
      return 'Active recently';
    }
  };

  const formatTimestamp = (dateStr: string) => {
    if (!dateStr) return 'Sep 29, 2026, 9:10:45 AM';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  const renderDeviceIcon = (type: string, osName: string) => {
    if (type === 'tablet' || /ipad|tablet/i.test(osName || '')) {
      return <Tablet className="w-6 h-6" />;
    }
    if (type === 'mobile' || /iphone|android.*phone/i.test(osName || '')) {
      return <Smartphone className="w-6 h-6" />;
    }
    if (/macbook|laptop/i.test(osName || '')) {
      return <Laptop className="w-6 h-6" />;
    }
    return <Monitor className="w-6 h-6" />;
  };

  const fetchSessions = async (userEmail?: string) => {
    const targetEmail = userEmail || email;
    if (!targetEmail) return;
    setLoadingSessions(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/sessions?email=${encodeURIComponent(targetEmail)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.sessions)) {
          setSessions(data.sessions);
        }
      }
    } catch (err) {
      console.warn('Error fetching device sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleLogoutDevice = async (session: UserSession) => {
    if (!window.confirm(`Are you sure you want to log out ${session.os_name} (${session.browser_name})?`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/sessions/logout-device`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: session.session_token, id: session.id })
      });
      if (res.ok) {
        setSessionNotice(`Successfully logged out ${session.os_name}.`);
        setSessions(prev => prev.filter(s => s.id !== session.id && s.session_token !== session.session_token));
        setTimeout(() => setSessionNotice(null), 4000);
      }
    } catch (err) {
      console.error('Logout device error:', err);
    }
  };

  const handleLogoutAllOtherDevices = async () => {
    if (!window.confirm('Are you sure you want to log out all other devices? Only this current device will stay signed in.')) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/sessions/logout-all-others`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, current_session_token: currentSessionToken })
      });
      if (res.ok) {
        setSessionNotice('Logged out of all other devices successfully.');
        setSessions(prev => prev.filter(s => s.session_token === currentSessionToken));
        setTimeout(() => setSessionNotice(null), 4000);
      }
    } catch (err) {
      console.error('Logout all other devices error:', err);
    }
  };

  // Load user profile from localStorage on mount
  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem('currentUser');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        if (u.first_name) setFirstName(u.first_name);
        if (u.middle_name) setMiddleName(u.middle_name);
        if (u.last_name) setLastName(u.last_name);
        if (u.suffix !== undefined) setSuffix(u.suffix || '');
        if (u.dob) {
          const parts = String(u.dob).split('-');
          if (parts.length === 3) {
            setBirthYear(parts[0]);
            const monthNames = [
              'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
              'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
            ];
            const mIdx = parseInt(parts[1], 10) - 1;
            if (mIdx >= 0 && mIdx < 12) {
              setBirthMonth(monthNames[mIdx]);
            }
            setBirthDay(String(parseInt(parts[2], 10)));
          }
        }
        if (u.blood_type) setBloodType(u.blood_type);
        if (u.city) setCity(u.city);
        if (u.house_no) setHouseNo(u.house_no);
        if (u.street_name || u.street) setStreet(u.street_name || u.street);
        if (u.barangay) setBarangay(u.barangay);
        if (u.occupation) setOccupation(u.occupation);
        if (u.civil_status) setCivilStatus(u.civil_status);
        if (u.sex) setSex(u.sex);
        if (u.phone_number || u.mobileNumber) setMobileNumber(u.phone_number || u.mobileNumber);
        if (u.working_in_qc !== undefined) setWorkingInQC(u.working_in_qc);
        if (u.session_token) setCurrentSessionToken(u.session_token);
        if (u.email) {
          setEmail(u.email);
          fetchSessions(u.email);
        } else {
          fetchSessions(userRole === 'admin' ? 'admin@gmail.com' : 'jeffersonlee1234@gmail.com');
        }
      } else {
        fetchSessions(userRole === 'admin' ? 'admin@gmail.com' : 'jeffersonlee1234@gmail.com');
      }
    } catch (err) {
      console.warn('Error reading currentUser from localStorage:', err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'devices') {
      fetchSessions();
    }
  }, [activeTab]);

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassSaveMsg(null);
    setPassErrorMsg(null);

    const cleanCurrent = currentPassword.trim();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanCurrent) {
      setPassErrorMsg('Please enter your current password.');
      return;
    }

    if (!cleanNew) {
      setPassErrorMsg('Please enter a new password.');
      return;
    }

    const hasMinLength = cleanNew.length >= 8;
    const hasUppercase = /[A-Z]/.test(cleanNew);
    const hasNumber = /[0-9]/.test(cleanNew);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(cleanNew);

    if (!hasMinLength) {
      setPassErrorMsg('New password must be at least 8 characters long.');
      return;
    }

    if (!hasUppercase) {
      setPassErrorMsg('New password must contain at least one uppercase letter (A-Z).');
      return;
    }

    if (!hasNumber) {
      setPassErrorMsg('New password must contain at least one number (0-9).');
      return;
    }

    if (!hasSpecial) {
      setPassErrorMsg('New password must contain at least one special character (!@#$%^&* etc.).');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setPassErrorMsg('New password and confirm password do not match.');
      return;
    }

    setIsSavingPass(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || (userRole === 'admin' ? 'admin@gmail.com' : 'jeffersonlee1234@gmail.com'),
          currentPassword: cleanCurrent,
          newPassword: cleanNew,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPassSaveMsg(data.message || 'Password successfully updated! You can now use your new password when logging in.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPassSaveMsg(null), 5000);
      } else {
        setPassErrorMsg(data.message || 'Failed to update password. Please check your current password.');
      }
    } catch (err) {
      console.error('Change password error:', err);
      setPassErrorMsg('Unable to connect to the server. Please ensure the backend is running and try again.');
    } finally {
      setIsSavingPass(false);
    }
  };

  const isSystemAdmin = userRole === 'admin';

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300 pb-12">
      {/* Main Profile Header Box (Matching Screenshots 1 to 5) */}
      <div className={`rounded-2xl border overflow-hidden ${
        darkMode ? 'bg-[#0b1426] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        
        {/* Header Title Section */}
        <div className={`p-4 sm:p-6 border-b ${darkMode ? 'bg-[#0e1933] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="space-y-4">

            {/* Profile Avatar Card */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border ${
              darkMode ? 'bg-[#070e1b] border-slate-800' : 'bg-slate-100 border-slate-300'
            }`}>
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-blue-500/50 flex items-center justify-center font-bold text-lg shrink-0 ${
                  darkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700'
                }`}>
                  <User className={`w-6 h-6 sm:w-7 sm:h-7 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`} />
                </div>
                <div className="min-w-0">
                  <h4 className={`text-sm sm:text-base font-extrabold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {isSystemAdmin ? 'SYSTEM ADMINISTRATOR' : `${firstName} ${middleName} ${lastName} ${suffix}`.replace(/\s+/g, ' ').trim() || 'JEFFERSON FERNANDO LEE'}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Status:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-extrabold rounded-full">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={`w-full sm:w-auto justify-center px-3.5 py-2 text-xs font-semibold rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                  darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                <Camera className="w-4 h-4 text-slate-400" />
                <span>Upload Photo</span>
              </button>
            </div>
          </div>

          {/* Profile Navigation Tabs (Swipeable Pills on Mobile, Centered on Desktop) */}
          <div className={`flex justify-start sm:justify-center border-b mt-4 sm:mt-6 overflow-x-auto no-scrollbar gap-1 sm:gap-6 px-1 sm:px-0 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
            {[
              { id: 'account', label: t('profile.tab_account') },
              { id: 'personal', label: t('profile.tab_personal') },
              { id: 'devices', label: t('profile.tab_devices') },
              { id: 'language', label: t('profile.tab_language') },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2.5 sm:py-3 px-3 sm:px-5 text-xs font-extrabold transition-all border-b-2 whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? darkMode ? 'border-blue-500 text-blue-400 bg-blue-950/30' : 'border-blue-600 text-blue-600 bg-blue-50'
                      : darkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          {activeTab === 'account' ? (
            /* TAB 1: ACCOUNT INFORMATION */
            <div className="space-y-6 sm:space-y-8 max-w-3xl mx-auto">
              
              {/* Section 1: Email Address */}
              <div className="space-y-2">
                <label className={`text-xs font-bold block uppercase tracking-wider ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className={`w-full px-4 py-3 border rounded-xl text-xs font-mono cursor-not-allowed opacity-90 ${
                    darkMode ? 'bg-[#0e1933] border-slate-700/80 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Section 2: Change Password Box */}
              <form onSubmit={handlePasswordSave} className={`p-4 sm:p-6 border rounded-2xl space-y-4 sm:space-y-5 shadow-lg ${
                darkMode ? 'bg-[#0c162b] border-slate-800' : 'bg-slate-50/80 border-slate-200'
              }`}>
                <div className={`flex items-center gap-2 text-blue-500 border-b pb-3 ${
                  darkMode ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <Key className="w-4 h-4" />
                  <h3 className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Change Password</h3>
                </div>

                {passSaveMsg && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{passSaveMsg}</span>
                  </div>
                )}

                {passErrorMsg && (
                  <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{passErrorMsg}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className={`text-xs font-bold block ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => { setCurrentPassword(e.target.value); if (passErrorMsg) setPassErrorMsg(null); }}
                      placeholder="Enter current password"
                      disabled={isSavingPass}
                      className={`w-full px-4 py-3 border rounded-xl text-xs pr-10 ${
                        darkMode ? 'bg-[#091122] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className={`absolute right-3 top-3.5 ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={`text-xs font-bold block ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); if (passErrorMsg) setPassErrorMsg(null); }}
                        placeholder="Min. 8 characters"
                        disabled={isSavingPass}
                        className={`w-full px-4 py-3 border rounded-xl text-xs pr-10 ${
                          darkMode ? 'bg-[#091122] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className={`absolute right-3 top-3.5 ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`text-xs font-bold block ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); if (passErrorMsg) setPassErrorMsg(null); }}
                        placeholder="Repeat new password"
                        disabled={isSavingPass}
                        className={`w-full px-4 py-3 border rounded-xl text-xs pr-10 ${
                          darkMode ? 'bg-[#091122] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className={`absolute right-3 top-3.5 ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password Requirements Live Checklist */}
                <div className={`p-3.5 rounded-xl border text-xs space-y-2.5 transition-all ${
                  darkMode ? 'bg-[#091122]/90 border-slate-800' : 'bg-slate-100/90 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
                      darkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      Password Requirements
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword) ? 'All Met' : 'Required'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className={`flex items-center gap-2 transition-all ${
                      newPassword.length >= 8 ? 'text-emerald-400 font-semibold' : darkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                        newPassword.length >= 8 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : darkMode ? 'border-slate-700 bg-slate-800/60 text-slate-600' : 'border-slate-300 bg-white text-slate-400'
                      }`}>
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span>At least 8 characters</span>
                    </div>

                    <div className={`flex items-center gap-2 transition-all ${
                      /[A-Z]/.test(newPassword) ? 'text-emerald-400 font-semibold' : darkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                        /[A-Z]/.test(newPassword) ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : darkMode ? 'border-slate-700 bg-slate-800/60 text-slate-600' : 'border-slate-300 bg-white text-slate-400'
                      }`}>
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span>At least 1 uppercase letter (A-Z)</span>
                    </div>

                    <div className={`flex items-center gap-2 transition-all ${
                      /[0-9]/.test(newPassword) ? 'text-emerald-400 font-semibold' : darkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                        /[0-9]/.test(newPassword) ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : darkMode ? 'border-slate-700 bg-slate-800/60 text-slate-600' : 'border-slate-300 bg-white text-slate-400'
                      }`}>
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span>At least 1 number (0-9)</span>
                    </div>

                    <div className={`flex items-center gap-2 transition-all ${
                      /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword) ? 'text-emerald-400 font-semibold' : darkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                        /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword) ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : darkMode ? 'border-slate-700 bg-slate-800/60 text-slate-600' : 'border-slate-300 bg-white text-slate-400'
                      }`}>
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span>At least 1 special char (!@#$%^&*)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingPass}
                    className="w-full sm:w-auto justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl border border-blue-400/30 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{isSavingPass ? 'Saving...' : 'Save New Password'}</span>
                  </button>
                </div>
              </form>

              {/* Section 3: Danger Zone Box */}
              <div className={`p-4 sm:p-6 rounded-2xl space-y-4 shadow-lg ${
                darkMode ? 'bg-red-950/20 border border-red-900/60' : 'bg-red-50/60 border border-red-200'
              }`}>
                <div className="flex items-center gap-2 text-red-500 font-extrabold text-sm">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>Danger Zone</span>
                </div>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Deactivating your account is a permanent action. All your data will be removed and you will lose access to the portal.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => alert('Account deactivation link requested.')}
                    className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Deactivate Account
                  </button>
                  <button
                    type="button"
                    onClick={() => alert('Account deletion confirmation sent to email.')}
                    className={`w-full sm:w-auto px-6 py-2.5 border font-bold text-xs rounded-xl transition-all cursor-pointer ${
                      darkMode ? 'border-red-600 text-red-400 hover:bg-red-950/40' : 'border-red-500 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'personal' ? (
            /* TAB 2: PERSONAL INFORMATION (Matching Pic 3 for Admin, Resident form for User) */
            isSystemAdmin ? (
              <div className="space-y-8 max-w-4xl mx-auto">
                {/* Admin Official Identification & Office Details Card */}
                <div className={`p-6 border rounded-2xl space-y-6 ${
                  darkMode ? 'bg-[#0c162b] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between border-b pb-4 border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-blue-400" />
                      <h3 className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Administrator Official Identification & Office Details
                      </h3>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full">
                      Verified Staff
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-1 font-medium">Designation / Role</span>
                      <strong className="text-white text-sm font-extrabold block">System Administrator</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1 font-medium">Department / Bureau</span>
                      <strong className="text-white text-sm font-extrabold block">Social Services Development Dept (SSDD)</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1 font-medium">Local Government Unit</span>
                      <strong className="text-white text-sm font-extrabold block">Quezon City Hall Complex</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1 font-medium">Official Email Address</span>
                      <span className="text-blue-300 font-mono font-bold block">admin@quezoncity.gov.ph</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1 font-medium">Security Access Level</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Full System Super Admin
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1 font-medium">Assigned Scope / Sector</span>
                      <strong className="text-white font-extrabold block">City-Wide (Districts 1 – 6)</strong>
                    </div>
                  </div>
                </div>

                {/* Authorized Operational Capabilities */}
                <div className={`p-6 border rounded-2xl space-y-4 ${
                  darkMode ? 'bg-[#0c162b] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-blue-400" />
                    Authorized Operational Capabilities
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      'Social Assistance Review & Aid Disbursement',
                      'Case Management & Welfare Resolution',
                      'QCID & Sectoral ID Verification & Printing',
                      'Realtime Telemetry, Reports & Audit Logs',
                    ].map((cap, i) => (
                      <div
                        key={i}
                        className={`p-3.5 border rounded-xl text-xs font-bold flex items-center gap-2.5 ${
                          darkMode ? 'bg-[#070e1b] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Danger Zone Box */}
                <div className={`p-6 rounded-2xl space-y-4 ${
                  darkMode ? 'bg-red-950/20 border border-red-900/60' : 'bg-red-50/60 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2 text-red-500 font-extrabold text-sm">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span>Danger Zone</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    Deactivating your account is a permanent action. All your data will be removed and you will lose access to the portal.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => alert('Account deactivation requested.')}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Deactivate Account
                    </button>
                    <button
                      type="button"
                      onClick={() => alert('Account deletion requested.')}
                      className={`px-6 py-2.5 border font-bold text-xs rounded-xl transition-all cursor-pointer ${
                        darkMode ? 'border-red-600 text-red-400 hover:bg-red-950/40' : 'border-red-500 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 max-w-4xl mx-auto">

              {/* Section 1: Full Name */}
              <div className="space-y-3">
                <h3 className={`text-xs font-extrabold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Full Name</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      disabled
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-xs uppercase cursor-not-allowed opacity-90 ${
                        darkMode ? 'bg-[#0e1933] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Middle Name</label>
                    <input
                      type="text"
                      value={middleName}
                      disabled
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-xs uppercase cursor-not-allowed opacity-90 ${
                        darkMode ? 'bg-[#0e1933] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      disabled
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-xs uppercase cursor-not-allowed opacity-90 ${
                        darkMode ? 'bg-[#0e1933] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Suffix</label>
                    <input
                      type="text"
                      value={suffix}
                      disabled
                      placeholder="e.g. JR"
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-xs uppercase cursor-not-allowed opacity-90 ${
                        darkMode ? 'bg-[#0e1933] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Birth Date & Blood Type */}
              <div className="space-y-3">
                <h3 className={`text-xs font-extrabold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Birth Date</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Month</label>
                    <input
                      type="text"
                      value={birthMonth}
                      disabled
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-xs uppercase cursor-not-allowed opacity-90 ${
                        darkMode ? 'bg-[#0e1933] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Day</label>
                    <input
                      type="text"
                      value={birthDay}
                      disabled
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-xs cursor-not-allowed opacity-90 ${
                        darkMode ? 'bg-[#0e1933] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Year</label>
                    <input
                      type="text"
                      value={birthYear}
                      disabled
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-xs cursor-not-allowed opacity-90 ${
                        darkMode ? 'bg-[#0e1933] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Blood Type</label>
                    <input
                      type="text"
                      value={bloodType}
                      disabled
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-normal cursor-not-allowed opacity-90 ${
                        darkMode ? 'bg-[#0e1933] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Address */}
              <div className="space-y-3">
                <h3 className={`text-xs font-extrabold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>City</label>
                    <input
                      type="text"
                      value={city}
                      disabled
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-xs uppercase cursor-not-allowed opacity-90 ${
                        darkMode ? 'bg-[#0e1933] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>House No.</label>
                    <input
                      type="text"
                      value={houseNo}
                      disabled
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-xs cursor-not-allowed opacity-90 ${
                        darkMode ? 'bg-[#0e1933] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Street</label>
                    <input
                      type="text"
                      value={street}
                      disabled
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-xs cursor-not-allowed opacity-90 ${
                        darkMode ? 'bg-[#0e1933] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-[11px] font-bold block mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Barangay</label>
                    <input
                      type="text"
                      value={barangay}
                      disabled
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-xs uppercase cursor-not-allowed opacity-90 ${
                        darkMode ? 'bg-[#0e1933] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Employment Details */}
              <div className="space-y-3">
                <h3 className={`text-xs font-extrabold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Employment Details</h3>
                
                <div className="space-y-2">
                  <label className={`text-xs block ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Are you working in Quezon City?</label>
                  <div className="flex items-center gap-6">
                    <label className={`flex items-center gap-2 text-xs cursor-not-allowed opacity-80 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      <input
                        type="radio"
                        name="workingQC"
                        value="Yes"
                        checked={workingInQC === 'Yes'}
                        disabled
                        className="w-4 h-4 text-blue-600 border-slate-700 cursor-not-allowed"
                      />
                      <span>Yes</span>
                    </label>
                    <label className={`flex items-center gap-2 text-xs cursor-not-allowed opacity-80 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      <input
                        type="radio"
                        name="workingQC"
                        value="No"
                        checked={workingInQC === 'No'}
                        disabled
                        className="w-4 h-4 text-blue-600 border-slate-700 cursor-not-allowed"
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Occupation</label>
                    <input
                      type="text"
                      value={occupation}
                      disabled
                      className={`w-full px-4 py-3 border rounded-xl text-xs uppercase cursor-not-allowed opacity-90 ${
                        darkMode ? 'bg-[#0e1933] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Civil Status</label>
                    <input
                      type="text"
                      value={civilStatus}
                      disabled
                      className={`w-full px-4 py-3 border rounded-xl text-xs cursor-not-allowed opacity-90 ${
                        darkMode ? 'bg-[#0e1933] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Sex & Mobile Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Sex</label>
                  <input
                    type="text"
                    value={sex}
                    disabled
                    className={`w-full px-4 py-3 border rounded-xl text-xs cursor-not-allowed opacity-90 ${
                      darkMode ? 'bg-[#0e1933] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className={`text-[11px] font-bold block ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Mobile Number</label>
                  <input
                    type="text"
                    value={mobileNumber}
                    disabled
                    className={`w-full px-4 py-3 border rounded-xl text-xs cursor-not-allowed opacity-90 ${
                      darkMode ? 'bg-[#0e1933] border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Danger Zone Box at Bottom */}
              <div className={`p-6 rounded-2xl space-y-4 shadow-lg ${
                darkMode ? 'bg-red-950/20 border border-red-900/60' : 'bg-red-50/60 border border-red-200'
              }`}>
                <div className="flex items-center gap-2 text-red-500 font-extrabold text-sm">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>Danger Zone</span>
                </div>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Deactivating your account is a permanent action. All your data will be removed and you will lose access to the portal.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => alert('Account deactivation requested.')}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
                  >
                    Deactivate Account
                  </button>
                  <button
                    type="button"
                    onClick={() => alert('Account deletion requested.')}
                    className={`px-6 py-2.5 border font-bold text-xs rounded-xl transition-all ${
                      darkMode ? 'border-red-600 text-red-400 hover:bg-red-950/40' : 'border-red-500 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
              </div>
            )
          ) : activeTab === 'devices' ? (
            /* TAB 3: DEVICES & HISTORY */
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Header Box */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b ${
                darkMode ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-blue-500" />
                  <h3 className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Device Management & Login History</h3>
                </div>
                <button
                  type="button"
                  onClick={handleLogoutAllOtherDevices}
                  className={`px-3.5 py-1.5 border font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer ${
                    darkMode ? 'border-red-800/80 hover:bg-red-950/40 text-red-400' : 'border-red-300 hover:bg-red-50 text-red-600'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out All Other Devices</span>
                </button>
              </div>

              {sessionNotice && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{sessionNotice}</span>
                </div>
              )}

              {/* Active Current Device Card & Other Devices */}
              {(() => {
                const activeCurrent = sessions.find(s => currentSessionToken ? s.session_token === currentSessionToken : false) 
                  || sessions[0] 
                  || {
                    id: 9999,
                    user_id: 'USR-2026-002',
                    email,
                    session_token: currentSessionToken || 'current_local',
                    device_type: 'desktop' as const,
                    os_name: 'Windows 11 PC',
                    browser_name: 'Google Chrome',
                    ip_address: '120.28.144.151',
                    location: 'Quezon City, PH',
                    signed_in_at: new Date().toISOString(),
                    last_active_at: new Date().toISOString(),
                    is_active: true
                  };

                const otherSessions = sessions.filter(s => s.session_token !== activeCurrent.session_token && s.id !== activeCurrent.id);

                return (
                  <>
                    {/* CURRENT DEVICE: Active Now, No Logout Button */}
                    <div className={`p-5 border rounded-2xl space-y-3.5 transition-all ${
                      darkMode ? 'bg-[#0e1933] border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-blue-600 border border-blue-400/40 text-white flex items-center justify-center shrink-0">
                            {renderDeviceIcon(activeCurrent.device_type, activeCurrent.os_name)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                {activeCurrent.os_name}
                              </span>
                              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-extrabold rounded-full inline-flex items-center gap-1">
                                Active Now • This Device
                              </span>
                            </div>
                            <div className={`flex items-center gap-2 text-xs font-mono mt-1.5 flex-wrap ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                              <span>🌐 <strong>Browser:</strong> {activeCurrent.browser_name}</span>
                              <span>•</span>
                              <span>🛡️ <strong>Network IP:</strong> {maskIp(activeCurrent.ip_address)} <em className="text-[10px] font-sans text-emerald-400 not-italic">(Protected)</em></span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={`pt-3 border-t flex flex-col sm:flex-row justify-between text-xs gap-2 ${
                        darkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-600'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          <span>Signed in: <strong className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{formatTimestamp(activeCurrent.signed_in_at)}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className={`w-3.5 h-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                          <span>Location: <strong className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{activeCurrent.location || 'Quezon City, PH'}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Sub-section: OTHER DEVICES & LOGIN HISTORY */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-extrabold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          OTHER DEVICES & LOGIN HISTORY ({otherSessions.length})
                        </h4>
                      </div>

                      {otherSessions.length === 0 ? (
                        <div className={`p-8 border-2 border-dashed rounded-2xl text-center text-xs ${
                          darkMode ? 'border-slate-800/80 text-slate-500' : 'border-slate-300 text-slate-500'
                        }`}>
                          No other login history recorded.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {otherSessions.map((s) => (
                            <div 
                              key={s.id || s.session_token}
                              className={`p-5 border rounded-2xl space-y-3.5 transition-all ${
                                darkMode ? 'bg-[#091122] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start sm:items-center gap-3.5">
                                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
                                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                                  }`}>
                                    {renderDeviceIcon(s.device_type, s.os_name)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                      <span className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        {s.os_name}
                                      </span>
                                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                                        darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'
                                      }`}>
                                        {formatRelativeTime(s.last_active_at || s.signed_in_at)}
                                      </span>
                                    </div>
                                    <div className={`flex items-center gap-2 text-xs font-mono mt-1.5 flex-wrap ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                      <span>🌐 <strong>Browser:</strong> {s.browser_name}</span>
                                      <span>•</span>
                                      <span>🛡️ <strong>Network IP:</strong> {maskIp(s.ip_address)} <em className="text-[10px] font-sans text-emerald-400 not-italic">(Protected)</em></span>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleLogoutDevice(s)}
                                  className={`px-3.5 py-1.5 border font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer ${
                                    darkMode ? 'border-red-800/80 hover:bg-red-950/40 text-red-400' : 'border-red-300 hover:bg-red-50 text-red-600'
                                  }`}
                                >
                                  <LogOut className="w-3.5 h-3.5" />
                                  <span>Log Out Device</span>
                                </button>
                              </div>

                              <div className={`pt-3 border-t flex flex-col sm:flex-row justify-between text-xs gap-2 ${
                                darkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-600'
                              }`}>
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                                  <span>Signed in: <strong className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{formatTimestamp(s.signed_in_at)}</strong></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <MapPin className={`w-3.5 h-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                                  <span>Location: <strong className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{s.location || 'Quezon City, PH'}</strong></span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* Danger Zone Box */}
              <div className={`p-6 rounded-2xl space-y-4 ${
                darkMode ? 'bg-red-950/20 border border-red-900/60' : 'bg-red-50/60 border border-red-200'
              }`}>
                <div className="flex items-center gap-2 text-red-500 font-extrabold text-sm">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>Danger Zone</span>
                </div>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Deactivating your account is a permanent action. All your data will be removed and you will lose access to the portal.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => alert('Account deactivation requested.')}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
                  >
                    Deactivate Account
                  </button>
                  <button
                    type="button"
                    onClick={() => alert('Account deletion requested.')}
                    className={`px-6 py-2.5 border font-bold text-xs rounded-xl transition-all ${
                      darkMode ? 'border-red-600 text-red-400 hover:bg-red-950/40' : 'border-red-500 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 4: LANGUAGE */
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className={`space-y-1 pb-2 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  <Languages className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-extrabold">{t('profile.lang_title')}</h3>
                </div>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('profile.lang_subtitle')}
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'English', label: 'English' },
                  { id: 'Tagalog', label: 'Tagalog' },
                ].map((lang) => {
                  const isSelected = language === lang.id;
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setLanguage(lang.id as Language)}
                      className={`w-full p-4 rounded-xl text-left text-xs font-bold transition-all border flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? darkMode ? 'bg-[#0f1c38] border-blue-500 text-blue-300 ring-1 ring-blue-500/50' : 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500/30'
                          : darkMode ? 'bg-[#091122] border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>{lang.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-blue-500" />}
                    </button>
                  );
                })}
              </div>

              {/* Danger Zone Box */}
              <div className={`p-6 rounded-2xl space-y-4 ${
                darkMode ? 'bg-red-950/20 border border-red-900/60' : 'bg-red-50/60 border border-red-200'
              }`}>
                <div className="flex items-center gap-2 text-red-500 font-extrabold text-sm">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>Danger Zone</span>
                </div>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Deactivating your account is a permanent action. All your data will be removed and you will lose access to the portal.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => alert('Account deactivation requested.')}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
                  >
                    Deactivate Account
                  </button>
                  <button
                    type="button"
                    onClick={() => alert('Account deletion requested.')}
                    className={`px-6 py-2.5 border font-bold text-xs rounded-xl transition-all ${
                      darkMode ? 'border-red-600 text-red-400 hover:bg-red-950/40' : 'border-red-500 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QCID Digital Card Modal */}
      {showQcidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#0e172a] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-400" />
                Quezon City Digital Resident Identification (QCID)
              </h3>
              <button onClick={() => setShowQcidModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-6 bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 border border-blue-500/50 rounded-2xl text-left space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-mono font-bold text-blue-300 uppercase tracking-widest">QUEZON CITY RESIDENT ID</span>
                <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded-full uppercase">VERIFIED</span>
              </div>
              <div className="space-y-1">
                <span className="text-lg font-black text-white block">JEFFERSON FERNANDO LEE</span>
                <span className="text-xs font-mono text-amber-300 font-bold">QCID No: 9842-1049-4143</span>
              </div>
              <div className="pt-2 flex justify-between items-end text-[11px] text-slate-300 border-t border-blue-800/60">
                <div>
                  <span className="block text-[9px] text-slate-400">BARANGAY</span>
                  <span className="font-semibold">BAGONG SILANGAN</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400">VALID UNTIL</span>
                  <span className="font-semibold">SEP 2030</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowQcidModal(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl"
            >
              Close QCID Card
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
