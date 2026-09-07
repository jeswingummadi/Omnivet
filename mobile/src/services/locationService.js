import * as Location from 'expo-location';
import { Platform } from 'react-native';

/**
 * Reverses latitude & longitude into human-readable rural village, district, state and country
 * via OpenStreetMap Nominatim.
 */
export const reverseGeocodeNominatim = async (lat, lon) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'AnimalHealthSentinel-MobileApp/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim HTTP ${response.status}`);
    }

    const data = await response.json();
    const a = data.address || {};

    const village = a.road || a.village || a.hamlet || a.neighbourhood || a.suburb || 'Local Village';
    const district = a.county || a.state_district || a.city || a.town || 'District Center';
    const state = a.state || a.region || 'Province';
    const country = a.country || 'Kenya';
    const fullAddress = data.display_name || `${village}, ${district}, ${state}`;

    return {
      village,
      district,
      state,
      country,
      fullAddress,
    };
  } catch (error) {
    console.warn('Reverse geocoding error:', error);
    return {
      village: 'Field Locality',
      district: 'Rural Sector',
      state: 'Agricultural Zone',
      country: 'Global',
      fullAddress: `GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
    };
  }
};

/**
 * Detects device coordinates (Native Expo Location or Web Geolocation)
 * and reverse geocodes the address.
 */
export const detectSelfLocation = async () => {
  let lat = null;
  let lon = null;
  let accuracy = null;

  // 1. Try Native Expo Location API
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      lat = loc.coords.latitude;
      lon = loc.coords.longitude;
      accuracy = loc.coords.accuracy;
    }
  } catch (nativeErr) {
    console.warn('Expo location attempt note:', nativeErr);
  }

  // 2. Fallback to Browser / Web Geolocation if needed
  if (lat === null && typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true,
        });
      });
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
      accuracy = pos.coords.accuracy;
    } catch (webErr) {
      console.warn('Browser geolocation fallback note:', webErr);
    }
  }

  if (lat === null || lon === null) {
    throw new Error('Unable to retrieve device GPS. Please check location permissions or enter coordinates manually.');
  }

  // 3. Reverse geocode via OpenStreetMap Nominatim
  const addressDetails = await reverseGeocodeNominatim(lat, lon);

  return {
    latitude: lat,
    longitude: lon,
    accuracy,
    ...addressDetails,
  };
};
