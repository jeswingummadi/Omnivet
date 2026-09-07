import React, { useEffect, useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Globe,
  Compass
} from 'lucide-react';
import { useAutoLocation, StructuredAddress } from '../hooks/useAutoLocation';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  villageOrStreet: string;
  cityOrDistrict: string;
  stateOrProvince: string;
  country: string;
  fullAddress: string;
}

interface AddressLocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationChange: (loc: LocationData) => void;
}

export const AddressLocationPicker: React.FC<AddressLocationPickerProps> = ({
  initialLat = -1.2921,
  initialLng = 36.8219,
  onLocationChange,
}) => {
  const { coords, address, loading, error, detectLocation } = useAutoLocation(initialLat, initialLng);

  // Editable local state for manual overrides
  const [lat, setLat] = useState(initialLat.toString());
  const [lng, setLng] = useState(initialLng.toString());
  const [village, setVillage] = useState('Central Farming Locality');
  const [district, setDistrict] = useState('Nairobi Sub-County');
  const [province, setProvince] = useState('Rift Valley Agricultural Zone');
  const [country, setCountry] = useState('Kenya');
  const [isAutoDetected, setIsAutoDetected] = useState(false);

  // Synchronize when auto-location hook detects coordinates and address
  useEffect(() => {
    if (coords) {
      setLat(coords.latitude.toFixed(5));
      setLng(coords.longitude.toFixed(5));
      setIsAutoDetected(true);
    }
    if (address) {
      setVillage(address.villageOrStreet);
      setDistrict(address.cityOrDistrict);
      setProvince(address.stateOrProvince);
      setCountry(address.country);
    }
  }, [coords, address]);

  // Propagate changes up to parent form
  useEffect(() => {
    const numLat = parseFloat(lat) || initialLat;
    const numLng = parseFloat(lng) || initialLng;
    const formatted = `${village}, ${district}, ${province}, ${country}`;

    onLocationChange({
      latitude: numLat,
      longitude: numLng,
      accuracy: coords?.accuracy,
      villageOrStreet: village,
      cityOrDistrict: district,
      stateOrProvince: province,
      country: country,
      fullAddress: formatted,
    });
  }, [lat, lng, village, district, province, country, coords?.accuracy]);

  return (
    <div className="bg-[#F9FBE7] border-2 border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
      {/* Header & Auto-Detect Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#2E7D32]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-800">
              Farm Geolocation & Address
            </h4>
          </div>
          <p className="text-[11px] text-stone-600 font-medium mt-0.5">
            Auto-detects GPS and resolves nearest rural village/district via OpenStreetMap Nominatim
          </p>
        </div>

        {/* The Auto-Detect Trigger Button */}
        <button
          type="button"
          onClick={detectLocation}
          disabled={loading}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] active:scale-95 text-white text-xs font-black shadow-md shadow-emerald-900/20 transition-all cursor-pointer shrink-0"
        >
          {loading ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5 text-white" />
          )}
          <span>{loading ? 'Resolving Address...' : '📍 Use My Current Location'}</span>
        </button>
      </div>

      {/* Geolocation Status / Error Alerts */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-300 flex items-center gap-2 text-red-800 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {isAutoDetected && !error && !loading && (
        <div className="p-3 rounded-xl bg-[#E8F5E9] border border-emerald-400 flex items-center justify-between text-[#1B5E20] text-xs">
          <span className="flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
            GPS Position & Village Address Locked
          </span>
          {coords?.accuracy && (
            <span className="text-[10px] bg-white px-2.5 py-0.5 rounded-lg text-[#2E7D32] font-mono font-bold border border-emerald-200">
              Accuracy: ±{Math.round(coords.accuracy)}m
            </span>
          )}
        </div>
      )}

      {/* Form Fields: Structured Address */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-stone-700 mb-1">
            Village / Settlement / Street
          </label>
          <input
            type="text"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            placeholder="e.g. Rampur Village"
            className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#2E7D32]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-stone-700 mb-1">
            Town / Sub-County / District
          </label>
          <input
            type="text"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="e.g. Anand District"
            className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#2E7D32]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-stone-700 mb-1">
            State / Region / Province
          </label>
          <input
            type="text"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            placeholder="e.g. Gujarat"
            className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#2E7D32]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-stone-700 mb-1">
            Country
          </label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. India"
            className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#2E7D32]"
          />
        </div>
      </div>

      {/* Numerical PostGIS Coordinates */}
      <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-stone-600">
          <span className="flex items-center gap-1 font-bold text-stone-700">
            <Compass className="w-3.5 h-3.5 text-[#2E7D32]" />
            PostGIS Geodetic Coordinates (SRID 4326)
          </span>
          <span className="text-[10px] text-stone-500 font-mono">WGS 84 Datum</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] text-stone-500 block mb-0.5 font-medium">Latitude (North/South)</span>
            <input
              type="text"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full bg-[#F9FBE7] font-mono font-bold border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs text-[#2E7D32] focus:outline-none focus:border-[#2E7D32] focus:bg-white"
            />
          </div>

          <div>
            <span className="text-[10px] text-stone-500 block mb-0.5 font-medium">Longitude (East/West)</span>
            <input
              type="text"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="w-full bg-[#F9FBE7] font-mono font-bold border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs text-[#2E7D32] focus:outline-none focus:border-[#2E7D32] focus:bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
