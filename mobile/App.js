import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveOfflineReport,
  getPendingReports,
} from './src/services/storage';
import { syncPendingReports, checkIsConnected } from './src/services/syncService';
import { detectSelfLocation } from './src/services/locationService';
import { AuthScreen } from './src/components/AuthScreen';
import { OutcomesShowcase } from './src/components/OutcomesShowcase';

const FARMER_SESSION_KEY = '@omnivet_farmer_session';

const SPECIES_OPTIONS = ['Cattle 🐄', 'Goat 🐐', 'Sheep 🐑', 'Swine 🐖', 'Poultry 🐔', 'Camel 🐪'];

const COMMON_SYMPTOMS = [
  'blisters',
  'high fever',
  'sudden death',
  'excessive salivation',
  'loss of appetite',
  'lameness / limping',
  'coughing',
  'skin sores',
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('report');

  const [species, setSpecies] = useState('Cattle 🐄');
  const [selectedSymptoms, setSelectedSymptoms] = useState(['blisters']);
  const [customSymptom, setCustomSymptom] = useState('');
  const [isMortality, setIsMortality] = useState(false);

  const [latitude, setLatitude] = useState('-1.2921');
  const [longitude, setLongitude] = useState('36.8219');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState(null);

  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [apiUrl, setApiUrl] = useState(
    Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000'
  );

  useEffect(() => {
    (async () => {
      try {
        const savedSession = await AsyncStorage.getItem(FARMER_SESSION_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          setCurrentUser(parsed);
          if (parsed.village) setVillage(parsed.village);
        }
      } catch (err) {
        console.warn('Session reading note:', err);
      } finally {
        setAuthChecking(false);
      }
    })();
  }, []);

  const handleAuthenticate = async (userObj) => {
    setCurrentUser(userObj);
    if (userObj.village) setVillage(userObj.village);
    try {
      await AsyncStorage.setItem(FARMER_SESSION_KEY, JSON.stringify(userObj));
    } catch (err) {
      console.warn('Session saving error:', err);
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Do you want to sign out and switch accounts?');
      if (confirmed) {
        setCurrentUser(null);
        try {
          await AsyncStorage.removeItem(FARMER_SESSION_KEY);
        } catch (e) {}
      }
    } else {
      Alert.alert('Sign Out', 'Do you want to sign out and switch accounts?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setCurrentUser(null);
            try {
              await AsyncStorage.removeItem(FARMER_SESSION_KEY);
            } catch (e) {}
          },
        },
      ]);
    }
  };

  const refreshPendingCount = useCallback(async () => {
    const list = await getPendingReports();
    setPendingCount(list.length);
  }, []);

  const triggerSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await syncPendingReports(apiUrl);
      if (result.synced > 0) {
        showMessage(`Synced ${result.synced} offline report(s) to OmniVet Doctors!`);
      }
      await refreshPendingCount();
    } catch (err) {
      console.warn('Sync attempt note:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [apiUrl, refreshPendingCount]);

  const showMessage = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4500);
  };

  useEffect(() => {
    if (!currentUser) return;
    refreshPendingCount();

    checkIsConnected().then((online) => {
      setIsOnline(online);
      if (online) triggerSync();
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
      if (online) triggerSync();
    });

    return () => unsubscribe();
  }, [currentUser, triggerSync, refreshPendingCount]);

  const handleAutoDetectLocation = async () => {
    setIsLocating(true);
    setLocationStatus('Detecting GPS & village address...');
    try {
      const result = await detectSelfLocation();
      setLatitude(result.latitude.toFixed(5));
      setLongitude(result.longitude.toFixed(5));
      if (result.village) setVillage(result.village);
      if (result.district) setDistrict(result.district);
      setLocationStatus(`✓ GPS Locked: ${result.village || 'Locality'} (±${Math.round(result.accuracy || 10)}m)`);
      showMessage(`Location Locked: ${result.village || 'Locality'}`);
    } catch (error) {
      setLocationStatus(`⚠️ ${error.message}`);
      Alert.alert('GPS Notice', error.message);
    } finally {
      setIsLocating(false);
    }
  };

  const toggleSymptom = (item) => {
    if (selectedSymptoms.includes(item)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== item));
    } else {
      setSelectedSymptoms([...selectedSymptoms, item]);
    }
  };

  const addCustomSymptom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms([...selectedSymptoms, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  const handleSubmit = async () => {
    if (selectedSymptoms.length === 0) {
      Alert.alert('Please Select Sickness', 'Please choose at least one symptom your animal is experiencing.');
      return;
    }

    const reportData = {
      species: species.split(' ')[0],
      symptoms: selectedSymptoms,
      mortality_status: isMortality,
      farmer_name: currentUser.name,
      farmer_phone: currentUser.phone,
      farmer_aadhaar: currentUser.aadhaar || null,
      latitude: parseFloat(latitude) || -1.2921,
      longitude: parseFloat(longitude) || 36.8219,
      village: village || currentUser.village,
      district: district || 'Village Ward',
    };

    const currentlyOnline = await checkIsConnected();

    if (!currentlyOnline) {
      await saveOfflineReport(reportData);
      await refreshPendingCount();
      Alert.alert('Saved Offline', 'No internet right now. Report saved safely on your phone and will send automatically when connected.');
      showMessage('Saved offline. Will sync when connected.');
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      if (res.ok) {
        const result = await res.json();
        const isFlagged = result.status === 'flagged_high_risk';
        Alert.alert(
          'Report Sent to Doctor',
          isFlagged
            ? 'HIGH-RISK WARNING: Symptoms match a serious contagious virus (like Foot-and-Mouth / Anthrax). An emergency animal doctor has been alerted!'
            : 'Report received successfully by animal health officials.'
        );
        showMessage('Report sent directly to Veterinary Officers!');
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (error) {
      await saveOfflineReport(reportData);
      await refreshPendingCount();
      Alert.alert('Connection Interrupted', 'Saved safely on phone. Will sync automatically.');
      showMessage('Saved offline. Will sync when connected.');
    }
  };

  if (authChecking) {
    return (
      <SafeAreaView style={[styles.safeArea, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#D97706" />
        <Text style={{ color: '#78350F', marginTop: 14, fontSize: 14, fontWeight: '700' }}>
          Opening OmniVet...
        </Text>
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    return <AuthScreen onAuthenticate={handleAuthenticate} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFDF9" />

      {/* FARMER PROFILE HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.appTitle}>🐾 OMNIVET</Text>
            <Text style={styles.farmerNameText}>{currentUser.name}</Text>
            <Text style={styles.farmerSubText}>
              📍 {currentUser.village || village || 'Village'} • 📞 {currentUser.phone}
            </Text>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusBarRow}>
          <View style={[styles.statusPill, isOnline ? styles.pillOnline : styles.pillOffline]}>
            <View style={[styles.dot, isOnline ? styles.dotOnline : styles.dotOffline]} />
            <Text style={styles.statusText}>
              {isOnline ? 'Internet Connected (Direct Send)' : 'Offline Mode (Saves on Phone)'}
            </Text>
          </View>

          {pendingCount > 0 && (
            <TouchableOpacity style={styles.syncBadge} onPress={triggerSync} disabled={isSyncing}>
              {isSyncing ? (
                <ActivityIndicator size="small" color="#D97706" />
              ) : (
                <Text style={styles.syncBadgeText}>{pendingCount} Saved Offline</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'report' && styles.tabBtnActive]}
            onPress={() => setActiveTab('report')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'report' && styles.tabBtnTextActive]}>
              📋 Report Sick Animal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'outcomes' && styles.tabBtnActiveOutcomes]}
            onPress={() => setActiveTab('outcomes')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'outcomes' && styles.tabBtnTextActiveOutcomes]}>
              🌾 6 Key Benefits
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {statusMessage && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>{statusMessage}</Text>
        </View>
      )}

      {activeTab === 'outcomes' ? (
        <OutcomesShowcase />
      ) : (
        <ScrollView style={styles.formContainer} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.section}>
            <Text style={styles.label}>1. Which animal is sick?</Text>
            <View style={styles.chipsContainer}>
              {SPECIES_OPTIONS.map((item) => {
                const active = species === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setSpecies(item)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>2. What signs do you see?</Text>
              <Text style={styles.helperText}>⚠️ Red = Dangerous signs</Text>
            </View>

            <View style={styles.chipsContainer}>
              {COMMON_SYMPTOMS.map((item) => {
                const active = selectedSymptoms.includes(item);
                const isTrigger = item === 'blisters' || item === 'high fever' || item === 'sudden death';
                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.symptomChip,
                      active && (isTrigger ? styles.symptomChipActiveAlert : styles.symptomChipActive),
                    ]}
                    onPress={() => toggleSymptom(item)}
                  >
                    <Text
                      style={[
                        styles.symptomChipText,
                        active && styles.symptomChipTextActive,
                        isTrigger && !active && styles.triggerNotice,
                      ]}
                    >
                      {item} {isTrigger ? '⚠️' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.customInputRow}>
              <TextInput
                style={styles.inputFlex}
                placeholder="Other symptom (type here)..."
                placeholderTextColor="#A89F91"
                value={customSymptom}
                onChangeText={setCustomSymptom}
              />
              <TouchableOpacity style={styles.addBtn} onPress={addCustomSymptom}>
                <Text style={styles.addBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.section, styles.toggleSection]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.label}>3. Is the animal alive or dead?</Text>
              <Text style={styles.sublabel}>
                {isMortality ? 'Animal has died (Emergency Outbreak Flag)' : 'Animal is sick but alive'}
              </Text>
            </View>
            <Switch
              value={isMortality}
              onValueChange={setIsMortality}
              trackColor={{ false: '#FDE68A', true: '#C2410C' }}
              thumbColor={isMortality ? '#9A3412' : '#FFFFFF'}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>4. Where is your farm?</Text>
              <TouchableOpacity
                style={styles.detectLocationBtn}
                onPress={handleAutoDetectLocation}
                disabled={isLocating}
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.detectLocationBtnText}>📍 Use My Current Location</Text>
                )}
              </TouchableOpacity>
            </View>

            {locationStatus && (
              <Text style={styles.locationFeedbackText}>{locationStatus}</Text>
            )}

            <TextInput
              style={styles.textInput}
              placeholder="Village or Town Name"
              placeholderTextColor="#A89F91"
              value={village}
              onChangeText={setVillage}
            />
            <TextInput
              style={[styles.textInput, { marginTop: 8 }]}
              placeholder="District / Area"
              placeholderTextColor="#A89F91"
              value={district}
              onChangeText={setDistrict}
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>SEND REPORT TO DOCTOR</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFDF9' },
  header: { paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 36 : 14, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1.5, borderBottomColor: '#FDE68A' },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  appTitle: { fontSize: 11, fontWeight: '900', color: '#D97706', letterSpacing: 1 },
  farmerNameText: { fontSize: 18, fontWeight: '900', color: '#78350F', marginTop: 1 },
  farmerSubText: { fontSize: 12, color: '#92400E', fontWeight: '600', marginTop: 2 },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECCA7' },
  logoutBtnText: { fontSize: 12, fontWeight: '800', color: '#B91C1C' },
  statusBarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  pillOnline: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  pillOffline: { backgroundColor: '#FFEDD5', borderColor: '#FED7AA' },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  dotOnline: { backgroundColor: '#D97706' },
  dotOffline: { backgroundColor: '#C2410C' },
  statusText: { fontSize: 11, fontWeight: '700', color: '#78350F' },
  syncBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: '#FFEDD5', borderWidth: 1, borderColor: '#D97706' },
  syncBadgeText: { fontSize: 11, fontWeight: '800', color: '#C2410C' },
  tabRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#FFFBEB', alignItems: 'center', borderWidth: 1, borderColor: '#FDE68A' },
  tabBtnActive: { backgroundColor: '#D97706', borderColor: '#D97706' },
  tabBtnActiveOutcomes: { backgroundColor: '#C2410C', borderColor: '#C2410C' },
  tabBtnText: { fontSize: 13, color: '#92400E', fontWeight: '700' },
  tabBtnTextActive: { color: '#FFFFFF', fontWeight: '900' },
  tabBtnTextActiveOutcomes: { color: '#FFFFFF', fontWeight: '900' },
  toastBanner: { backgroundColor: '#D97706', paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' },
  toastText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  formContainer: { flex: 1, padding: 16 },
  section: { marginBottom: 16, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#FDE68A', shadowColor: '#D97706', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 },
  toggleSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 15, fontWeight: '900', color: '#78350F', marginBottom: 8 },
  sublabel: { fontSize: 12, color: '#92400E', fontWeight: '600' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  helperText: { fontSize: 11, color: '#C2410C', fontWeight: '700' },
  detectLocationBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: '#D97706' },
  detectLocationBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  locationFeedbackText: { fontSize: 12, color: '#B45309', fontWeight: '800', marginBottom: 8 },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#FFFBEB', borderWidth: 1.5, borderColor: '#FDE68A' },
  chipActive: { backgroundColor: '#FEF3C7', borderColor: '#D97706' },
  chipText: { fontSize: 13, fontWeight: '700', color: '#78350F' },
  chipTextActive: { color: '#78350F', fontWeight: '900' },
  symptomChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#FFFBEB', borderWidth: 1.5, borderColor: '#FDE68A' },
  symptomChipActive: { backgroundColor: '#FEF3C7', borderColor: '#D97706' },
  symptomChipActiveAlert: { backgroundColor: '#FEE2E2', borderColor: '#DC2626' },
  symptomChipText: { fontSize: 13, color: '#78350F', fontWeight: '600' },
  symptomChipTextActive: { color: '#78350F', fontWeight: '900' },
  triggerNotice: { color: '#DC2626', fontWeight: '700' },
  customInputRow: { flexDirection: 'row', marginTop: 10, gap: 8 },
  inputFlex: { flex: 1, backgroundColor: '#FFFBEB', borderRadius: 10, borderWidth: 1.5, borderColor: '#FDE68A', color: '#292524', paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, fontWeight: '600' },
  addBtn: { backgroundColor: '#78350F', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 10 },
  addBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  textInput: { backgroundColor: '#FFFBEB', borderRadius: 10, borderWidth: 1.5, borderColor: '#FDE68A', color: '#292524', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontWeight: '600' },
  submitButton: { backgroundColor: '#D97706', borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: '#78350F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4, marginTop: 8 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});