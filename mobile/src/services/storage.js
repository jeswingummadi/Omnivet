import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@pending_animal_health_reports';

/**
 * Retrieves all pending offline reports stored locally.
 */
export const getPendingReports = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading pending reports from local storage:', error);
    return [];
  }
};

/**
 * Saves a new health report into local offline storage.
 */
export const saveOfflineReport = async (reportData) => {
  try {
    const existing = await getPendingReports();
    const newReport = {
      ...reportData,
      local_id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      saved_at: new Date().toISOString(),
      sync_status: 'pending_sync'
    };
    const updated = [newReport, ...existing];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newReport;
  } catch (error) {
    console.error('Error saving offline report:', error);
    throw error;
  }
};

/**
 * Removes a successfully synchronized report from local storage by its local_id.
 */
export const removeSyncedReport = async (localId) => {
  try {
    const existing = await getPendingReports();
    const filtered = existing.filter((item) => item.local_id !== localId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (error) {
    console.error('Error removing synced report:', error);
    throw error;
  }
};

/**
 * Clears all queued reports.
 */
export const clearAllPendingReports = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing pending reports:', error);
  }
};
