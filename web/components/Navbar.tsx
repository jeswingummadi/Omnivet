import React, { useState } from 'react';
import { 
  Radio, 
  ArrowRightLeft, 
  LogOut, 
  Menu, 
  X, 
  Stethoscope, 
  Tractor, 
  Sparkles, 
  MapPin, 
  Phone, 
  Layers, 
  Award,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenAuthModal: () => void;
  onSeedData?: () => void;
  activeMainTab: 'dashboard' | 'outcomes';
  setActiveMainTab: (tab: 'dashboard' | 'outcomes') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenAuthModal, 
  onSeedData, 
  activeMainTab, 
  setActiveMainTab 
}) => {
  const { user, role, switchRole, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2E7D32] flex items-center justify-center shadow-md text-white font-bold">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-wider text-[#1B5E20] uppercase">
                  LIVESTOCK SENTINEL
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-[#E8F5E9] text-[#2E7D32] border border-emerald-300">
                  Rural Surveillance
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-semibold">
                Animal Health & Disease Early Warning System
              </p>
            </div>
          </div>

          {/* Center Navigation Links: Dashboard vs 6 Outcomes */}
          <div className="hidden md:flex items-center space-x-1.5 bg-[#F1F8E9] p-1.5 rounded-2xl border border-emerald-200">
            <button
              onClick={() => setActiveMainTab('dashboard')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeMainTab === 'dashboard'
                  ? 'bg-[#2E7D32] text-white shadow-md'
                  : 'text-[#2E7D32] hover:bg-emerald-100/70'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Surveillance Portal</span>
            </button>
            <button
              onClick={() => setActiveMainTab('outcomes')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeMainTab === 'outcomes'
                  ? 'bg-[#E65100] text-white shadow-md'
                  : 'text-[#E65100] hover:bg-amber-100/70'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>🌟 6 Core Outcomes</span>
            </button>
          </div>

          {/* Desktop Right User Controls */}
          <div className="hidden md:flex items-center space-x-3">
            {onSeedData && (
              <button
                onClick={onSeedData}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-xs font-bold text-stone-700 transition-colors shadow-sm"
                title="Seed sample surveillance outbreaks"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Seed Outbreaks</span>
              </button>
            )}

            {user ? (
              <div className="flex items-center space-x-2 bg-[#F9FBE7] border-2 border-emerald-200 p-1.5 rounded-2xl shadow-sm">
                {/* User Profile Header Pill: Name, Village, Phone */}
                <div
                  className={`flex flex-col px-3.5 py-1 rounded-xl text-xs ${
                    role === 'farmer'
                      ? 'bg-white border border-emerald-300'
                      : 'bg-white border border-teal-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-sm text-stone-900">
                    {role === 'farmer' ? (
                      <Tractor className="w-4 h-4 text-[#2E7D32]" />
                    ) : (
                      <Stethoscope className="w-4 h-4 text-teal-700" />
                    )}
                    <span className={role === 'farmer' ? 'text-[#1B5E20]' : 'text-teal-900'}>
                      {user.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-600 flex items-center gap-2.5 mt-0.5 font-semibold">
                    {user.village && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#E65100]" />
                        {user.village}
                      </span>
                    )}
                    {user.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#2E7D32]" />
                        {user.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Switch Role Button */}
                <button
                  onClick={() => switchRole(role === 'farmer' ? 'vet' : 'farmer')}
                  className="px-2.5 py-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-white rounded-xl transition-colors flex items-center gap-1 border border-transparent hover:border-emerald-200"
                  title={`Switch persona`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-stone-500" />
                  <span>{role === 'farmer' ? 'To Vet' : 'To Farmer'}</span>
                </button>

                {/* Explicit Log Out Button */}
                <button
                  onClick={logout}
                  className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  title="Log Out of your session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-black shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
              >
                Sign In / Register
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-[#F1F8E9] text-[#2E7D32] hover:bg-emerald-100 border border-emerald-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden p-4 bg-white border-b-2 border-emerald-200 space-y-3 animate-fadeIn">
          {user && (
            <div className="p-3.5 rounded-2xl bg-[#F9FBE7] border border-emerald-300 text-xs space-y-1">
              <div className="font-extrabold text-sm text-[#1B5E20] flex items-center gap-1.5">
                <Tractor className="w-4 h-4 text-[#2E7D32]" />
                {user.name}
              </div>
              <div className="text-xs text-stone-700 font-bold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#E65100]" />
                Village: {user.village}
              </div>
              <div className="text-xs text-stone-700 font-bold flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#2E7D32]" />
                Mobile: {user.phone}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setActiveMainTab('dashboard');
                setMobileMenuOpen(false);
              }}
              className={`py-2.5 text-xs font-black rounded-xl border ${
                activeMainTab === 'dashboard'
                  ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
                  : 'bg-[#F1F8E9] text-[#2E7D32] border-emerald-300'
              }`}
            >
              📋 Surveillance
            </button>
            <button
              onClick={() => {
                setActiveMainTab('outcomes');
                setMobileMenuOpen(false);
              }}
              className={`py-2.5 text-xs font-black rounded-xl border ${
                activeMainTab === 'outcomes'
                  ? 'bg-[#E65100] text-white border-[#E65100]'
                  : 'bg-[#FFF8E1] text-[#E65100] border-amber-300'
              }`}
            >
              🌟 6 Outcomes
            </button>
          </div>

          {user && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  switchRole(role === 'farmer' ? 'vet' : 'farmer');
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl border border-stone-300"
              >
                Switch to {role === 'farmer' ? 'Vet' : 'Farmer'}
              </button>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="py-2 px-4 bg-red-100 hover:bg-red-200 text-red-800 border border-red-300 text-xs font-extrabold rounded-xl flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
