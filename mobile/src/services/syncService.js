import NetInfo from '@react-native-community/netinfo';
import { getPendingReports, removeSyncedReport } from './storage';

export const DEFAULT_API_URL = 'http://10.0.2.2:8000'; // Standard Android emulator host loopback (or http://localhost:8000 for iOS/Web)

/**
 * Checks if the device has an active internet connection.
 */
export const checkIsConnected = async () => {
  try {
    const state = await NetInfo.fetch();
    return Boolean(state.isConnected && state.isInternetReachable !== false);
  } catch (error) {
    // Fallback for web or dev environments
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true;
  }
};

/**
 * Pushes pending local reports to the FastAPI backend.
 * Triggered on app startup, network reconnection, or manual force-sync.
 */
export const syncPendingReports = async (apiUrl = DEFAULT_API_URL) => {
  const isOnline = await checkIsConnected();
  if (!isOnline) {
    return { success: false, reason: 'Device is offline', synced: 0 };
  }

  const pending = await getPendingReports();
  if (!pending || pending.length === 0) {
    return { success: true, synced: 0, message: 'No reports to sync' };
  }

  let syncedCount = 0;
  const errors = [];

  for (const item of pending) {
    try {
      // Clean payload for backend
      const payload = {
        species: item.species,
        farmer_name: item.farmer_name,
        farmer_phone: item.farmer_phone,
        symptoms: item.symptoms,
        mortality_status: item.mortality_status,
        latitude: item.latitude,
        longitude: item.longitude,
      };

      const response = await fetch(`${apiUrl}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await removeSyncedReport(item.local_id);
        syncedCount++;
      } else {
        const errText = await response.text();
        errors.push({ id: item.local_id, error: errText });
      }
    } catch (err) {
      errors.push({ id: item.local_id, error: err.message });
    }
  }

  const remaining = await getPendingReports();
  return {
    success: errors.length === 0,
    synced: syncedCount,
    remainingCount: remaining.length,
    errors,
  };
};
