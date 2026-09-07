import React, { useState } from 'react';
import { 
  Tractor, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  PhoneCall, 
  HelpCircle,
  Activity,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AddressLocationPicker, LocationData } from './AddressLocationPicker';
import { ReportItem } from './ReportsTable';

const SPECIES_OPTIONS = ['Cattle', 'Goat', 'Sheep', 'Swine', 'Poultry', 'Camel', 'Other'];

const COMMON_SYMPTOMS = [
  'blisters',
  'high fever',
  'sudden death',
  'excessive salivation',
  'lameness',
  'loss of appetite',
  'coughing',
  'bloody discharge',
];

interface FarmerViewProps {
  reports: ReportItem[];
  onReportSubmitted: () => void;
  apiBase: string;
}

export const FarmerView: React.FC<FarmerViewProps> = ({ reports, onReportSubmitted, apiBase }) => {
  const { user } = useAuth();

  // Form State
  const [species, setSpecies] = useState('Cattle');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['blisters']);
  const [customSymptom, setCustomSymptom] = useState('');
  const [mortalityStatus, setMortalityStatus] = useState(false);
  const [farmerName, setFarmerName] = useState(user?.name || 'Samuel Kiprotich');
  const [farmerPhone, setFarmerPhone] = useState(user?.phone || '+254-712-345678');
  const [location, setLocation] = useState<LocationData | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleSymptom = (s: string) => {
    if (selectedSymptoms.includes(s)) {
      setSelectedSymptoms(selectedSymptoms.filter((item) => item !== s));
    } else {
      setSelectedSymptoms([...selectedSymptoms, s]);
    }
  };

  const addCustomSymptom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms([...selectedSymptoms, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0) {
      setErrorMessage('Please select or specify at least one clinical symptom.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const payload = {
      species,
      symptoms: selectedSymptoms,
      mortality_status: mortalityStatus,
      farmer_name: farmerName,
      farmer_phone: farmerPhone,
      latitude: location?.latitude ?? -1.2921,
      longitude: location?.longitude ?? 36.8219,
    };

    try {
      const res = await fetch(`${apiBase}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const result = await res.json();
      const isHighRisk = result.status === 'flagged_high_risk';

      setSuccessMessage(
        isHighRisk
          ? 'URGENT OUTBREAK ALERT: Report submitted & triaged as HIGH-RISK. A regional veterinarian has been alerted!'
          : 'Health report successfully submitted to regional surveillance.'
      );
      setTimeout(() => setSuccessMessage(null), 6000);

      // Reset form symptoms
      setSelectedSymptoms(['blisters']);
      setMortalityStatus(false);
      onReportSubmitted();
    } catch (err: any) {
      setErrorMessage(`Submission failed: ${err.message}. Please verify the backend is running.`);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter reports submitted by this farmer or show community submissions
  const farmerReports = reports.filter(
    (r) => !user?.name || (r.farmer_name || '').toLowerCase().includes(user.name.toLowerCase())
  );
  const displayReports = farmerReports.length > 0 ? farmerReports : reports.slice(0, 5);

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#E8F5E9] via-[#F9FBE7] to-[#FFF8E1] border-2 border-emerald-300 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-black text-[#2E7D32] uppercase tracking-wider">
              <Tractor className="w-4 h-4 text-[#2E7D32]" />
              Farmer Grassroots Surveillance Portal
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1B5E20]">
              Welcome back, {user?.name || 'Farmer'}
            </h2>
            <p className="text-xs text-stone-600 max-w-xl font-semibold">
              Report sick livestock with automated GPS farm localization to receive rapid veterinary diagnostics and protect community herds.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white border border-emerald-300 p-3.5 rounded-2xl shrink-0 shadow-sm">
            <PhoneCall className="w-6 h-6 text-[#2E7D32]" />
            <div>
              <div className="text-[10px] uppercase font-black text-stone-500">Emergency Vet Toll-Free</div>
              <div className="text-sm font-black text-[#2E7D32] font-mono">1800-VET-AID</div>
            </div>
          </div>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-sm animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#2E7D32] shrink-0" />
            {successMessage}
          </span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 text-red-900 text-xs font-bold flex items-center justify-between shadow-sm animate-fadeIn">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            {errorMessage}
          </span>
          <button onClick={() => setErrorMessage(null)} className="text-red-700 hover:text-red-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Primary Report Form Card */}
      <div className="bg-white border-2 border-emerald-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-emerald-100 pb-4">
          <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#2E7D32]" />
            Report Sickness or Mortality Incident
          </h3>
          <p className="text-xs text-stone-500 font-semibold mt-0.5">
            Rule-based triage engine automatically identifies symptoms of Foot-and-Mouth Disease, Anthrax, and High Fever.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Species Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-stone-800">
              1. Select Affected Species
            </label>
            <div className="flex flex-wrap gap-2.5">
              {SPECIES_OPTIONS.map((item) => {
                const active = species === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSpecies(item)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                      active
                        ? 'bg-[#2E7D32] text-white shadow-md scale-105'
                        : 'bg-[#F9FBE7] text-stone-700 border border-emerald-300 hover:bg-[#F1F8E9]'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Symptoms Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-stone-800">
                2. Clinical Symptoms Observed
              </label>
              <span className="text-[11px] text-red-600 font-bold">
                ⚠️ Triggers automatic veterinary outbreak flag
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {COMMON_SYMPTOMS.map((symptom) => {
                const isSelected = selectedSymptoms.includes(symptom);
                const isTrigger =
                  symptom === 'blisters' || symptom === 'high fever' || symptom === 'sudden death';

                return (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => toggleSymptom(symptom)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? isTrigger
                          ? 'bg-red-600 text-white shadow-md scale-105'
                          : 'bg-[#2E7D32] text-white shadow-md scale-105'
                        : isTrigger
                        ? 'bg-red-50 border border-red-300 text-red-700 hover:bg-red-100'
                        : 'bg-[#F9FBE7] border border-emerald-300 text-stone-700 hover:bg-[#F1F8E9]'
                    }`}
                  >
                    <span>{symptom}</span>
                    {isTrigger && <span>⚠️</span>}
                  </button>
                );
              })}
            </div>

            {/* Custom symptom input */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Type additional clinical symptoms..."
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                className="bg-[#F9FBE7] border border-emerald-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#2E7D32] focus:bg-white max-w-sm flex-1"
              />
              <button
                type="button"
                onClick={addCustomSymptom}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-black text-stone-800 border border-stone-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>

          {/* 3. Mortality Status */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F9FBE7] border border-emerald-300">
            <div>
              <div className="text-xs font-black text-stone-800">
                3. Animal Mortality Status
              </div>
              <div className="text-[11px] text-stone-600 font-medium">
                {mortalityStatus ? 'Animal died (Triggers highest urgency protocol)' : 'Animal is currently alive but sick'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMortalityStatus(!mortalityStatus)}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${
                mortalityStatus
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white text-stone-700 border border-emerald-300 shadow-sm'
              }`}
            >
              {mortalityStatus ? 'Dead (Fatal)' : 'Alive (Sick)'}
            </button>
          </div>

          {/* 4. Automated Location & Address Component */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-stone-800">
              4. Farm Location & Geolocation
            </label>
            <AddressLocationPicker onLocationChange={setLocation} />
          </div>

          {/* 5. Farmer Contact Pre-filled */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Reporter Name
              </label>
              <input
                type="text"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                className="w-full bg-[#F9FBE7] border border-emerald-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:border-[#2E7D32] focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Contact Phone Number
              </label>
              <input
                type="text"
                value={farmerPhone}
                onChange={(e) => setFarmerPhone(e.target.value)}
                className="w-full bg-[#F9FBE7] border border-emerald-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:border-[#2E7D32] focus:bg-white"
              />
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-[#2E7D32] hover:bg-[#1B5E20] active:scale-[0.99] text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
            <span>{submitting ? 'Transmitting to Surveillance Engine...' : 'Transmit Health Report'}</span>
          </button>
        </form>
      </div>

      {/* Farmer's Recent Submissions Feed */}
      <div className="bg-white border-2 border-emerald-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#2E7D32]" />
              My Community Surveillance Reports
            </h3>
            <p className="text-xs text-stone-500 font-medium">Recent telemetry logs received from your district</p>
          </div>
          <span className="text-xs font-bold text-[#2E7D32] bg-[#E8F5E9] px-3 py-1 rounded-full border border-emerald-300">
            {displayReports.length} Cases
          </span>
        </div>

        <div className="space-y-3">
          {displayReports.length === 0 ? (
            <div className="text-center py-6 text-stone-500 text-xs font-medium">
              No reports submitted yet. Submit a case above to initialize telemetry.
            </div>
          ) : (
            displayReports.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[#F9FBE7] border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-black text-stone-700">#{item.id}</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#E8F5E9] text-[#2E7D32] font-black text-xs border border-emerald-300">
                      {item.species || 'Cattle'}
                    </span>
                    <span className="text-xs text-stone-900 font-bold">{item.symptoms}</span>
                  </div>
                  <div className="text-[11px] text-stone-500 font-semibold">
                    GPS: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)} • {new Date(item.timestamp).toLocaleDateString()}
                  </div>
                </div>

                <div>
                  {item.status === 'flagged_high_risk' || item.status === 'escalated_quarantine_alert' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      HIGH-RISK TRIAGED
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-stone-700 border border-emerald-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      LOGGED IN SURVEILLANCE
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
