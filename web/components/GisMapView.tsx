import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { ShieldAlert, AlertTriangle, User, Calendar, Stethoscope } from 'lucide-react';

interface OutbreakMarkerData {
  id: number;
  latitude: number;
  longitude: number;
  status: string;
  species: string;
  symptoms: string;
  mortality_status: boolean;
  farmer_name: string;
  timestamp: string;
}

interface GisMapViewProps {
  outbreaks: OutbreakMarkerData[];
  onEscalate?: (id: number) => void;
}

export const GisMapView: React.FC<GisMapViewProps> = ({ outbreaks, onEscalate }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-[450px] w-full bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-center text-slate-400">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>Initializing PostGIS Map Layers...</span>
        </div>
      </div>
    );
  }

  // Create Custom Pulsing Red Leaflet Icon
  const createAlertIcon = (isQuarantine: boolean) => {
    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `<div class="pulse-red-marker" style="background: ${isQuarantine ? '#7f1d1d' : '#ef4444'};"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      popupAnchor: [0, -12],
    });
  };

  // Determine initial center: average of outbreaks or fallback
  const defaultCenter: [number, number] = outbreaks.length > 0
    ? [outbreaks[0].latitude, outbreaks[0].longitude]
    : [-1.2921, 36.8219];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border-2 border-stone-200 shadow-sm bg-stone-100">
      {/* Map Header / Overlays */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-stone-300 shadow-md">
        <div className="flex items-center space-x-2.5">
          <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />
          <span className="text-xs font-bold text-stone-800">
            Active GIS Outbreak Clusters: <span className="text-red-600 font-black">{outbreaks.length}</span>
          </span>
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-stone-300 shadow-md text-[11px] space-y-1.5">
        <div className="font-black text-stone-800 mb-1 border-b border-stone-200 pb-1">GIS Map Legend</div>
        <div className="flex items-center space-x-2 font-medium">
          <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse shrink-0" />
          <span className="text-stone-700">High-Risk Outbreak (Blisters / High Fever / Death)</span>
        </div>
        <div className="flex items-center space-x-2 font-medium">
          <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
          <span className="text-stone-600">Suspected Case Zone (Buffer: 5km)</span>
        </div>
      </div>

      {/* Leaflet Map Container */}
      <div className="h-[450px] w-full">
        <MapContainer
          center={defaultCenter}
          zoom={11}
          scrollWheelZoom={false}
          className="h-full w-full z-0"
        >
          {/* CartoDB Voyager Tiles for daylight UI */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {outbreaks.map((outbreak) => {
            const isQuarantine = outbreak.status === 'escalated_quarantine_alert';
            return (
              <React.Fragment key={outbreak.id}>
                {/* 5km Quarantine Buffer Circle */}
                <Circle
                  center={[outbreak.latitude, outbreak.longitude]}
                  radius={5000}
                  pathOptions={{
                    color: isQuarantine ? '#dc2626' : '#ea580c',
                    fillColor: isQuarantine ? '#ef4444' : '#f97316',
                    fillOpacity: 0.15,
                    weight: 2,
                    dashArray: '5, 5',
                  }}
                />

                {/* Red Pulse Outbreak Marker */}
                <Marker
                  position={[outbreak.latitude, outbreak.longitude]}
                  icon={createAlertIcon(isQuarantine)}
                >
                  <Popup>
                    <div className="p-1 space-y-2 text-xs text-stone-800">
                      <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                        <span className="font-black text-red-600 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          ALERT #{outbreak.id}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-red-100 text-red-800 font-bold uppercase">
                          {outbreak.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="space-y-1 text-stone-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-[#2E7D32]" />
                          <span className="text-stone-500 font-bold">Species:</span>
                          <span className="font-bold text-stone-900">{outbreak.species}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-teal-700" />
                          <span className="text-stone-500 font-bold">Farmer:</span>
                          <span>{outbreak.farmer_name}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-stone-500 font-bold">Symptoms:</span>
                          <span className="text-stone-900 font-bold">{outbreak.symptoms}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span className="text-stone-500 font-bold">Reported:</span>
                          <span>{new Date(outbreak.timestamp).toLocaleString()}</span>
                        </div>
                      </div>

                      {outbreak.mortality_status && (
                        <div className="p-1.5 rounded-lg bg-red-50 border border-red-300 text-red-800 font-bold text-[10px]">
                          Mortality Recorded (Immediate Quarantine Required)
                        </div>
                      )}

                      {onEscalate && outbreak.status !== 'escalated_quarantine_alert' && (
                        <button
                          onClick={() => onEscalate(outbreak.id)}
                          className="w-full mt-2 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer shadow-sm"
                        >
                          Trigger Veterinary Escalation
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};
