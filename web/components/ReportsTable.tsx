import React, { useState } from 'react';
import { 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Phone, 
  RefreshCw, 
  Search, 
  ShieldAlert 
} from 'lucide-react';

export interface ReportItem {
  id: number;
  livestock_id: number;
  symptoms: string;
  mortality_status: boolean;
  latitude: number;
  longitude: number;
  status: string;
  timestamp: string;
  species?: string;
  farmer_name?: string;
  farmer_phone?: string;
}

interface ReportsTableProps {
  reports: ReportItem[];
  onEscalate: (id: number) => Promise<void>;
  onRefresh: () => void;
  loading: boolean;
}

export const ReportsTable: React.FC<ReportsTableProps> = ({ 
  reports, 
  onEscalate, 
  onRefresh,
  loading 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'high_risk' | 'pending'>('all');
  const [escalatingId, setEscalatingId] = useState<number | null>(null);

  const handleEscalateClick = async (id: number) => {
    try {
      setEscalatingId(id);
      await onEscalate(id);
    } finally {
      setEscalatingId(null);
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch = 
      (r.farmer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.species || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.symptoms || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === 'high_risk') {
      return r.status === 'flagged_high_risk' || r.status === 'escalated_quarantine_alert';
    }
    if (filter === 'pending') {
      return r.status === 'pending';
    }
    return true;
  });

  const getRiskBadge = (status: string, mortality: boolean) => {
    if (status === 'escalated_quarantine_alert') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-red-100 text-red-800 border border-red-300 animate-pulse">
          <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
          QUARANTINE ALERT
        </span>
      );
    }
    if (status === 'flagged_high_risk' || mortality) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-red-50 text-red-700 border border-red-200">
          <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
          HIGH RISK
        </span>
      );
    }
    if (status === 'flagged') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">
          FLAGGED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200">
        <Clock className="w-3.5 h-3.5 text-stone-500" />
        PENDING REVIEW
      </span>
    );
  };

  const parseSymptoms = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.join(', ');
      }
    } catch {
      // not JSON
    }
    return raw;
  };

  return (
    <div className="bg-white border-2 border-stone-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-stone-50">
        <div>
          <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
            Surveillance Reports & Triage Feed
            <span className="text-xs font-bold text-stone-500">({filteredReports.length} records)</span>
          </h2>
          <p className="text-xs text-stone-500 font-medium">Real-time telemetry from rural community reporters and field veterinarians</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search farmer, species, symptom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-stone-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#2E7D32] w-56 font-medium"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex bg-stone-200/80 rounded-xl p-0.5 border border-stone-300 text-xs font-bold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filter === 'all' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('high_risk')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filter === 'high_risk' ? 'bg-red-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              High Risk
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filter === 'pending' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Pending
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 transition-colors shadow-sm"
            title="Refresh reports"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#2E7D32]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-stone-100 border-b border-stone-200 text-stone-700 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Report ID</th>
              <th className="py-3 px-4">Farmer Details</th>
              <th className="py-3 px-4">Livestock Species</th>
              <th className="py-3 px-4">Symptoms & Pathologies</th>
              <th className="py-3 px-4">GPS Coordinates</th>
              <th className="py-3 px-4">Triage Risk Level</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4 text-right">Veterinary Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-stone-400 font-medium">
                  No surveillance reports match the current filter.
                </td>
              </tr>
            ) : (
              filteredReports.map((report) => {
                const isHighRisk =
                  report.status === 'flagged_high_risk' ||
                  report.status === 'escalated_quarantine_alert' ||
                  report.mortality_status;

                return (
                  <tr
                    key={report.id}
                    className={`hover:bg-[#F9FBE7] transition-colors ${
                      isHighRisk ? 'bg-red-50/50' : ''
                    }`}
                  >
                    {/* ID */}
                    <td className="py-3 px-4 font-mono font-bold text-stone-700">
                      #{report.id}
                    </td>

                    {/* Farmer */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900">{report.farmer_name || 'Anonymous Farmer'}</div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-1 font-medium">
                        <Phone className="w-3 h-3 text-[#2E7D32]" />
                        {report.farmer_phone || 'N/A'}
                      </div>
                    </td>

                    {/* Species */}
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-bold">
                        {report.species || 'Cattle'}
                      </span>
                    </td>

                    {/* Symptoms */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-stone-800 font-semibold">
                        {parseSymptoms(report.symptoms)}
                      </div>
                      {report.mortality_status && (
                        <div className="text-[10px] text-red-600 font-bold mt-0.5">
                          Dead animal reported
                        </div>
                      )}
                    </td>

                    {/* GPS */}
                    <td className="py-3 px-4 font-mono text-stone-600 text-[11px] font-medium">
                      {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                    </td>

                    {/* Risk Badge */}
                    <td className="py-3 px-4">
                      {getRiskBadge(report.status, report.mortality_status)}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 text-stone-500 whitespace-nowrap font-medium">
                      {new Date(report.timestamp).toLocaleDateString()} {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-4 text-right">
                      {report.status === 'escalated_quarantine_alert' ? (
                        <span className="inline-flex items-center gap-1 text-[#2E7D32] font-bold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Escalated
                        </span>
                      ) : isHighRisk ? (
                        <button
                          onClick={() => handleEscalateClick(report.id)}
                          disabled={escalatingId === report.id}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          {escalatingId === report.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ShieldAlert className="w-3.5 h-3.5" />
                          )}
                          Escalate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEscalateClick(report.id)}
                          disabled={escalatingId === report.id}
                          className="px-2.5 py-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg text-xs font-semibold transition-colors border border-stone-300 ml-auto cursor-pointer"
                        >
                          Flag Review
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
