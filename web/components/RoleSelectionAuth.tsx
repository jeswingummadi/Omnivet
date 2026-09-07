import React, { useState } from 'react';
import { 
  X, 
  Tractor, 
  Stethoscope, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  Phone,
  User,
  MapPin,
  CreditCard,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface RoleSelectionAuthProps {
  isOpen: boolean;
  onClose: () => void;
  forcedGate?: boolean;
}

export const RoleSelectionAuth: React.FC<RoleSelectionAuthProps> = ({ 
  isOpen, 
  onClose,
  forcedGate = false
}) => {
  const { register, loginWithPhone, loginQuickDemo } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login State - ONLY Mobile Number required
  const [loginPhone, setLoginPhone] = useState('9876543210');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register State - Exactly 4 fields
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regVillage, setRegVillage] = useState('');
  const [regAadhaar, setRegAadhaar] = useState('');
  const [regRole, setRegRole] = useState<'farmer' | 'vet'>('farmer');
  const [regError, setRegError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Format Aadhaar: XXXX XXXX XXXX
  const handleAadhaarInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
    const parts = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setRegAadhaar(parts);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const clean = loginPhone.replace(/\D/g, '');
    if (clean.length < 10) {
      setLoginError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const success = loginWithPhone(loginPhone);
    if (success) {
      onClose();
    } else {
      setLoginError('Authentication failed. Please check your mobile number.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName.trim()) {
      setRegError('Field 1: Full Name is required.');
      return;
    }
    const cleanPhone = regPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setRegError('Field 2: Mobile Number must be at least 10 digits.');
      return;
    }
    if (!regVillage.trim()) {
      setRegError('Field 3: Village or Town Name is required.');
      return;
    }
    const cleanAadhaar = regAadhaar.replace(/\D/g, '');
    if (cleanAadhaar.length !== 12) {
      setRegError('Field 4: Aadhaar Number must be exactly 12 digits.');
      return;
    }

    register({
      name: regName.trim(),
      phone: cleanPhone,
      village: regVillage.trim(),
      aadhaar: regAadhaar,
      role: regRole,
      identifier: regRole === 'farmer' ? `FARM-${cleanPhone.slice(-4)}` : `VET-${cleanPhone.slice(-4)}`,
      region: `${regVillage.trim()} Sector`,
    });

    onClose();
  };

  const handleQuickDemoClick = (roleChoice: 'farmer' | 'vet') => {
    loginQuickDemo(roleChoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border-2 border-emerald-300 rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-emerald-200 flex items-center justify-between bg-[#F1F8E9]">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-[#2E7D32] flex items-center justify-center shadow-md text-white font-bold">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1B5E20] flex items-center gap-2">
                Livestock Sentinel
              </h2>
              <p className="text-xs text-[#2E7D32] font-semibold">
                Rural Animal Health Surveillance & Early Warning
              </p>
            </div>
          </div>

          {!forcedGate && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-emerald-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
          {/* Quick Demo Bypass Banner */}
          <div className="p-3.5 bg-[#FFF8E1] rounded-2xl border border-amber-200 space-y-2">
            <div className="text-[11px] font-bold text-[#E65100] uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#E65100]" />
              Quick One-Click Demo Access
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoClick('farmer')}
                className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-400 text-[#2E7D32] font-extrabold text-xs transition-colors text-center shadow-sm"
              >
                🌾 Demo Farmer (Samuel)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoClick('vet')}
                className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-teal-50 border border-teal-400 text-teal-800 font-extrabold text-xs transition-colors text-center shadow-sm"
              >
                🩺 Demo Vet (Dr. Sarah)
              </button>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-[#F1F8E9] p-1.5 rounded-2xl border border-emerald-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setLoginError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'login'
                  ? 'bg-[#2E7D32] text-white shadow-md'
                  : 'text-[#2E7D32] hover:bg-emerald-100/60'
              }`}
            >
              Log In (Phone Only)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setRegError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'register'
                  ? 'bg-[#2E7D32] text-white shadow-md'
                  : 'text-[#2E7D32] hover:bg-emerald-100/60'
              }`}
            >
              New Registration (4 Fields)
            </button>
          </div>

          {/* ============================================================== */}
          {/* TAB 1: LOGIN (PHONE ONLY)                                      */}
          {/* ============================================================== */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Enter Your 10-Digit Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 absolute left-3.5 top-3 text-[#2E7D32]" />
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="w-full bg-stone-50 border-2 border-emerald-300 rounded-xl pl-11 pr-3 py-2.5 text-sm font-bold text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#2E7D32] focus:bg-white transition-colors"
                  />
                </div>
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Quick login without passwords. Returning accounts are loaded instantly.
                </span>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#2E7D32] hover:bg-[#1B5E20] active:scale-[0.99] text-white font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🌾 Log In to My Farm</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Prominent Link: New User? Register Here */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setRegError(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#F9FBE7] hover:bg-[#F1F8E9] border border-emerald-300 text-[#2E7D32] font-black text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <span>✨ New User? Register Here</span>
                </button>
              </div>
            </form>
          ) : (
            /* TAB 2: REGISTRATION (EXACTLY 4 FIELDS) */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 pt-1">
              {regError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {/* 1. Full Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  1. Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-2.5 text-[#2E7D32]" />
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Patel"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-stone-50 border border-emerald-300 rounded-xl pl-10 pr-3 py-2 text-xs font-semibold text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#2E7D32] focus:bg-white"
                  />
                </div>
              </div>

              {/* 2. Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  2. Mobile Number (10 Digits) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-2.5 text-[#2E7D32]" />
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-stone-50 border border-emerald-300 rounded-xl pl-10 pr-3 py-2 text-xs font-semibold text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#2E7D32] focus:bg-white"
                  />
                </div>
              </div>

              {/* 3. Village or Town Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  3. Village or Town Name *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-2.5 text-[#2E7D32]" />
                  <input
                    type="text"
                    placeholder="e.g. Rampur Village, Ward 4"
                    value={regVillage}
                    onChange={(e) => setRegVillage(e.target.value)}
                    className="w-full bg-stone-50 border border-emerald-300 rounded-xl pl-10 pr-3 py-2 text-xs font-semibold text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#2E7D32] focus:bg-white"
                  />
                </div>
              </div>

              {/* 4. Aadhaar Number */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  4. Aadhaar Number (12 Digits) *
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3.5 top-2.5 text-[#2E7D32]" />
                  <input
                    type="text"
                    placeholder="XXXX XXXX XXXX"
                    value={regAadhaar}
                    onChange={handleAadhaarInput}
                    className="w-full bg-stone-50 border border-emerald-300 rounded-xl pl-10 pr-3 py-2 text-xs font-mono font-bold tracking-wider text-emerald-800 placeholder-stone-400 focus:outline-none focus:border-[#2E7D32] focus:bg-white"
                  />
                </div>
                <span className="text-[10px] text-stone-500 mt-0.5 block">
                  Encrypted & securely linked for livestock health subsidies & alerts
                </span>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('farmer')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border-2 flex items-center justify-center gap-1.5 transition-all ${
                      regRole === 'farmer'
                        ? 'bg-[#E8F5E9] text-[#1B5E20] border-[#2E7D32]'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <Tractor className="w-4 h-4" />
                    <span>Farmer / Owner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('vet')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border-2 flex items-center justify-center gap-1.5 transition-all ${
                      regRole === 'vet'
                        ? 'bg-teal-50 text-teal-800 border-teal-600'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>Vet Official</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#2E7D32] hover:bg-[#1B5E20] active:scale-[0.99] text-white font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>✅ Complete Registration & Enter</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setRegError(null);
                  }}
                  className="text-xs font-bold text-[#2E7D32] hover:underline"
                >
                  Already have an account? Log In with Mobile Number
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
