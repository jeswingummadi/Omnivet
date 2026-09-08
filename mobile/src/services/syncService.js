import NetInfo from '@react-native-community/netinfo';

export const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';

/**
 * Checks if the device has an active internet connection.
 */
export const checkIsConnected = async () => {
  try {
    const state = await NetInfo.fetch();
    return Boolean(state.isConnected && state.isInternetReachable !== false);
  } catch (error) {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true;
  }
};

/**
 * Direct online submission to FastAPI / Neon DB backend.
 * Throws error immediately if device is offline or request fails (no offline storage).
 */
export const submitReportOnline = async (reportData, apiUrl = DEFAULT_API_URL) => {
  const isOnline = await checkIsConnected();
  if (!isOnline) {
    throw new Error('Network Error: Please connect to the internet to submit your report.');
  }

  const response = await fetch(`${apiUrl}/api/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reportData),
  });

  if (!response.ok) {
    throw new Error(`Server returned status ${response.status}`);
  }

  return await response.json();
};
