import React from 'react';
import dynamic from 'next/dynamic';
import { 
  ShieldAlert, 
  MapPin, 
  Skull, 
  Layers, 
  AlertTriangle, 
  Activity, 
  Stethoscope, 
  Radio,
  FileSpreadsheet,
  Siren
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ReportsTable, ReportItem } from './ReportsTable';

// Dynamically import GIS Map to ensure safe client-side Leaflet rendering
const DynamicGisMapView = dynamic(
  () => import('./GisMapView').then((mod) => mod.GisMapView),
  { ssr: false }
);

interface VetViewProps {
  reports: ReportItem[];
  outbreaks: any[];
  onEscalate: (id: number) => Promise<void>;
  onRefresh: () => void;
  loading: boolean;
}

export const VetView: React.FC<VetViewProps> = ({
  reports,
  outbreaks,
  onEscalate,
  onRefresh,
  loading,
}) => {
  const { user } = useAuth();

  // Metrics computation
  const highRiskCount = reports.filter(
    (r) => r.status === 'flagged_high_risk' || r.status === 'escalated_quarantine_alert'
  ).length;
  const mortalityCount = reports.filter((r) => r.mortality_status).length;
  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto">
      {/* Officer Command Header */}
      <div className="bg-gradient-to-r from-teal-50 via-white to-emerald-50 border-2 border-teal-300 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-black text-teal-800 uppercase tracking-wider">
              <Stethoscope className="w-4 h-4 text-teal-700" />
              Veterinary Directorate Surveillance Command
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900">
              Officer in Charge: {user?.name || 'Dr. Sarah Mercer'}
            </h2>
            <p className="text-xs text-stone-600 font-medium">
              Credential: <span className="font-mono text-teal-800 font-bold">{user?.identifier || 'VET-LIC-0994'}</span> • Assigned Sector: <span className="text-stone-800 font-bold">{user?.region || 'National Surveillance Grid'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-2xl bg-white border border-teal-300 text-xs text-stone-700 font-bold flex items-center gap-2 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Telemetry Feed: <b className="text-[#2E7D32]">Active</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white border-2 border-red-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-500">Active High-Risk Outbreaks</span>
            <div className="p-2 rounded-xl bg-red-100 text-red-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-red-700">{highRiskCount}</div>
          <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1 font-bold">
            <AlertTriangle className="w-3 h-3" />
            Immediate Quarantine Action Required
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white border-2 border-teal-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-500">Geospatial PostGIS Clusters</span>
            <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-stone-900">{outbreaks.length}</div>
          <p className="text-[11px] text-teal-700 mt-1 font-bold">
            Plotted with 5km Quarantine Rings
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white border-2 border-rose-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-500">Fatal Mortality Incidents</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-800">
              <Skull className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-800">{mortalityCount}</div>
          <p className="text-[11px] text-stone-500 mt-1 font-medium">Confirmed livestock deaths</p>
        </div>

        {/* Card 4 */}
        <div className="bg-white border-2 border-emerald-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-500">Total Monitored Reports</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-[#2E7D32]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-stone-900">{reports.length}</div>
          <p className="text-[11px] text-[#2E7D32] mt-1 font-bold">
            {pendingCount} cases pending diagnostic triage
          </p>
        </div>
      </div>

      {/* GIS Leaflet Map Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-stone-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-700" />
              GIS Outbreak & Early Warning Mapping
            </h3>
            <p className="text-xs text-stone-500 font-medium">
              Real-time PostGIS geodetic coordinates with automated 5km perimeter containment zones
            </p>
          </div>
          <span className="text-xs text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-300 font-mono font-bold">
            Projection: EPSG 4326
          </span>
        </div>

        <DynamicGisMapView outbreaks={outbreaks} onEscalate={onEscalate} />
      </div>

      {/* Real-time Triage Table Section */}
      <div className="space-y-2 pt-4">
        <ReportsTable
          reports={reports}
          onEscalate={onEscalate}
          onRefresh={onRefresh}
          loading={loading}
        />
      </div>
    </div>
  );
};
