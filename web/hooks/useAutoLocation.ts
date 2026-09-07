import { useState, useCallback } from 'react';

export interface StructuredAddress {
  villageOrStreet: string;
  cityOrDistrict: string;
  stateOrProvince: string;
  country: string;
  fullAddress: string;
  postcode?: string;
}

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface AutoLocationResult {
  coords: GeolocationCoords | null;
  address: StructuredAddress | null;
  loading: boolean;
  error: string | null;
  detectLocation: () => Promise<void>;
  setManualLocation: (lat: number, lng: number, addr?: Partial<StructuredAddress>) => void;
}

export const useAutoLocation = (initialLat?: number, initialLng?: number): AutoLocationResult => {
  const [coords, setCoords] = useState<GeolocationCoords | null>(
    initialLat && initialLng ? { latitude: initialLat, longitude: initialLng } : null
  );
  const [address, setAddress] = useState<StructuredAddress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reverse geocoding with OpenStreetMap Nominatim
  const reverseGeocode = async (lat: number, lon: number): Promise<StructuredAddress> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            // Nominatim asks for an identifying User-Agent header
            'User-Agent': 'AnimalHealthSentinel-SurveillanceApp/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Nominatim HTTP ${response.status}`);
      }

      const data = await response.json();
      const a = data.address || {};

      const villageOrStreet =
        a.road || a.village || a.hamlet || a.neighbourhood || a.suburb || 'Rural Locality';
      const cityOrDistrict =
        a.county || a.state_district || a.city || a.town || a.municipality || 'District Center';
      const stateOrProvince = a.state || a.region || a.province || 'Regional Province';
      const country = a.country || 'Kenya';
      const fullAddress = data.display_name || `${villageOrStreet}, ${cityOrDistrict}, ${stateOrProvince}`;

      return {
        villageOrStreet,
        cityOrDistrict,
        stateOrProvince,
        country,
        fullAddress,
        postcode: a.postcode || '',
      };
    } catch (err: any) {
      console.warn('Reverse geocoding warning:', err);
      // Return fallback without crashing
      return {
        villageOrStreet: 'Field Coordinates Recorded',
        cityOrDistrict: `Lat: ${lat.toFixed(4)}`,
        stateOrProvince: `Lng: ${lon.toFixed(4)}`,
        country: 'Global WGS84',
        fullAddress: `Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)} (OpenStreetMap Offline)`,
      };
    }
  };

  const detectLocation = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Browser Geolocation is not supported on this device.');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCoords({ latitude, longitude, accuracy });

        try {
          const resolvedAddress = await reverseGeocode(latitude, longitude);
          setAddress(resolvedAddress);
        } catch (err: any) {
          setError('Location detected, but reverse address lookup failed.');
        } finally {
          setLoading(false);
        }
      },
      (geoError) => {
        setLoading(false);
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setError('Location access was denied. You can enter coordinates manually.');
            break;
          case geoError.POSITION_UNAVAILABLE:
            setError('Location information is unavailable. Please try again or enter manually.');
            break;
          case geoError.TIMEOUT:
            setError('Location request timed out. Please try again.');
            break;
          default:
            setError('Could not retrieve geolocation.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 15000,
      }
    );
  }, []);

  const setManualLocation = (lat: number, lng: number, addr?: Partial<StructuredAddress>) => {
    setCoords({ latitude: lat, longitude: lng });
    if (addr) {
      setAddress((prev) => ({
        villageOrStreet: addr.villageOrStreet || prev?.villageOrStreet || '',
        cityOrDistrict: addr.cityOrDistrict || prev?.cityOrDistrict || '',
        stateOrProvince: addr.stateOrProvince || prev?.stateOrProvince || '',
        country: addr.country || prev?.country || '',
        fullAddress: addr.fullAddress || prev?.fullAddress || '',
      }));
    }
  };

  return {
    coords,
    address,
    loading,
    error,
    detectLocation,
    setManualLocation,
  };
};
