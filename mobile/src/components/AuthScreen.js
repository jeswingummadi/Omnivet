import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  StatusBar,
} from 'react-native';

export function AuthScreen({ onAuthenticate, apiUrl, onChangeServer }) {
  // Role: 'farmer' or 'vet'
  const [role, setRole] = useState('farmer');
  
  // Mode: 'login' or 'register'
  const [mode, setMode] = useState('login');

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [vetId, setVetId] = useState('');
  
  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSendOtp = () => {
    if (!phone || phone.length < 9) {
      Alert.alert('Phone Required', 'Please enter a valid mobile number to receive OTP.');
      return;
    }
    setOtpSent(true);
    Alert.alert('OTP Sent', 'A verification code has been sent to your mobile number.');
  };

  const handleVerifyAndSubmit = () => {
    if (otpSent && (!otp || otp.length < 4)) {
      Alert.alert('Invalid OTP', 'Please enter the 4-digit verification code.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        Alert.alert('Name Required', 'Please enter your full name.');
        return;
      }
      if (!village.trim()) {
        Alert.alert('Village / Town Required', 'Please enter your village or town name.');
        return;
      }
      if (role === 'farmer') {
        if (!aadhaar.trim() || aadhaar.length < 12) {
          Alert.alert('Aadhaar Required', 'Please enter a valid 12-digit Aadhaar number.');
          return;
        }
      }
      if (role === 'vet' && !vetId.trim()) {
        Alert.alert('Vet ID Required', 'Please enter your Government Veterinary Doctor ID.');
        return;
      }
    }

    // Build User Object
    const userObj = {
      name: name.trim() || (role === 'farmer' ? 'Local Farmer' : 'Veterinary Officer'),
      phone: phone.trim(),
      village: village.trim() || 'Rural Ward',
      role: role,
      aadhaar: role === 'farmer' ? aadhaar.trim() : null,
      vetId: role === 'vet' ? vetId.trim() : null,
    };

    onAuthenticate(userObj);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFDF9" />
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* OmniVet Branding Header */}
        <View style={styles.headerBox}>
          <Text style={styles.appBadge}>🐾 OMNIVET</Text>
          <Text style={styles.title}>
            {role === 'farmer' ? 'Farmer Health & Care' : 'Veterinary Command Portal'}
          </Text>
          <Text style={styles.subtitle}>
            {role === 'farmer'
              ? 'Protect your livestock with fast reporting and direct veterinary support.'
              : 'Monitor regional outbreaks, inspect telemetry, and coordinate responses.'}
          </Text>
        </View>
 
        {/* Server Connection Badge */}
        {apiUrl && onChangeServer && (
          <TouchableOpacity
            style={styles.serverBadge}
            onPress={onChangeServer}
            activeOpacity={0.7}
          >
            <Text style={styles.serverBadgeText}>
              🌐 Server: {apiUrl.replace('https://', '').replace('http://', '')} (Tap to change)
            </Text>
          </TouchableOpacity>
        )}

        {/* Role Switcher Tabs */}
        <View style={styles.roleTabRow}>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'farmer' && styles.roleBtnActiveFarmer]}
            onPress={() => { setRole('farmer'); setOtpSent(false); setOtp(''); }}
          >
            <Text style={[styles.roleBtnText, role === 'farmer' && styles.roleBtnTextActive]}>
              🌾 Farmer Portal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleBtn, role === 'vet' && styles.roleBtnActiveVet]}
            onPress={() => { setRole('vet'); setOtpSent(false); setOtp(''); }}
          >
            <Text style={[styles.roleBtnText, role === 'vet' && styles.roleBtnTextActiveVet]}>
              🩺 Vet Doctor
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Card Form */}
        <View style={styles.card}>
          <View style={styles.modeToggleRow}>
            <TouchableOpacity
              onPress={() => { setMode('login'); setOtpSent(false); }}
              style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, mode === 'login' && styles.modeTabTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setMode('register'); setOtpSent(false); }}
              style={[styles.modeTab, mode === 'register' && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, mode === 'register' && styles.modeTabTextActive]}>
                New Account / Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formBody}>
            
            {/* REGISTER FIELDS */}
            {mode === 'register' && (
              <>
                <Text style={styles.inputLabel}>Your Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Samuel Kiprotich"
                  placeholderTextColor="#A89F91"
                  value={name}
                  onChangeText={setName}
                />

                <Text style={styles.inputLabel}>Village / Town Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Kipkaren Village"
                  placeholderTextColor="#A89F91"
                  value={village}
                  onChangeText={setVillage}
                />

                {role === 'farmer' && (
                  <>
                    <Text style={styles.inputLabel}>Aadhaar Number (12 Digits)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 4321 8765 1098"
                      placeholderTextColor="#A89F91"
                      keyboardType="number-pad"
                      maxLength={12}
                      value={aadhaar}
                      onChangeText={setAadhaar}
                    />
                  </>
                )}

                {role === 'vet' && (
                  <>
                    <Text style={styles.inputLabel}>Government Vet Doctor ID</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. VET-LIC-0994-HQ"
                      placeholderTextColor="#A89F91"
                      value={vetId}
                      onChangeText={setVetId}
                    />
                  </>
                )}
              </>
            )}

            {/* PHONE NUMBER */}
            <Text style={styles.inputLabel}>Mobile Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. +254 712 345678"
              placeholderTextColor="#A89F91"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            {/* OTP SECTION */}
            {otpSent && (
              <>
                <Text style={styles.inputLabel}>Enter 4-Digit OTP Code</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="• • • •"
                  placeholderTextColor="#A89F91"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={otp}
                  onChangeText={setOtp}
                />
              </>
            )}

            {/* ACTION BUTTONS */}
            {!otpSent ? (
              <TouchableOpacity style={styles.primaryButton} onPress={handleSendOtp}>
                <Text style={styles.primaryButtonText}>SEND OTP CODE</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyAndSubmit}>
                <Text style={styles.primaryButtonText}>
                  {mode === 'login' ? 'VERIFY & SIGN IN' : 'COMPLETE REGISTRATION'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Switch Mode Prompt */}
            <TouchableOpacity
              style={styles.switchModePrompt}
              onPress={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setOtpSent(false);
              }}
            >
              <Text style={styles.switchModeText}>
                {mode === 'login'
                  ? "Don't have an account yet? Register here"
                  : 'Already registered? Sign in with your phone'}
              </Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* Footer Support Info */}
        <View style={styles.footerBox}>
          <Text style={styles.footerText}>🐾 OmniVet Secure Livestock Surveillance</Text>
          <Text style={styles.footerSubText}>Direct connection to animal health authorities</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFDF9' },
  container: { padding: 20, paddingBottom: 40 },
  headerBox: { alignItems: 'center', marginTop: 12, marginBottom: 20 },
  appBadge: { fontSize: 11, fontWeight: '900', color: '#D97706', letterSpacing: 1.5, marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '900', color: '#78350F', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#92400E', textAlign: 'center', paddingHorizontal: 16, lineHeight: 18, fontWeight: '600' },
  serverBadge: { alignSelf: 'center', backgroundColor: '#FEF3C7', borderColor: '#FDE68A', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 16 },
  serverBadgeText: { fontSize: 11, fontWeight: '800', color: '#92400E' },
  roleTabRow: { flexDirection: 'row', backgroundColor: '#FEF3C7', borderRadius: 14, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: '#FDE68A' },
  roleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  roleBtnActiveFarmer: { backgroundColor: '#D97706', shadowColor: '#78350F', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 3 },
  roleBtnActiveVet: { backgroundColor: '#C2410C', shadowColor: '#7C2D12', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 3 },
  roleBtnText: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  roleBtnTextActive: { color: '#FFFFFF', fontWeight: '900' },
  roleBtnTextActiveVet: { color: '#FFFFFF', fontWeight: '900' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1.5, borderColor: '#FDE68A', overflow: 'hidden', shadowColor: '#D97706', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 },
  modeToggleRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#FEF3C7', backgroundColor: '#FFFBEB' },
  modeTab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  modeTabActive: { borderBottomWidth: 3, borderBottomColor: '#D97706', backgroundColor: '#FFFFFF' },
  modeTabText: { fontSize: 13, fontWeight: '700', color: '#B45309' },
  modeTabTextActive: { color: '#78350F', fontWeight: '900' },
  formBody: { padding: 20 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#92400E', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#FFFBEB', borderRadius: 12, borderWidth: 1.5, borderColor: '#FDE68A', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: '600', color: '#292524' },
  otpInput: { letterSpacing: 8, textAlign: 'center', fontWeight: '900', fontSize: 18 },
  primaryButton: { backgroundColor: '#D97706', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20, shadowColor: '#78350F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  switchModePrompt: { marginTop: 16, alignItems: 'center', paddingVertical: 8 },
  switchModeText: { fontSize: 12, color: '#B45309', fontWeight: '700' },
  footerBox: { alignItems: 'center', marginTop: 24 },
  footerText: { fontSize: 12, fontWeight: '800', color: '#92400E' },
  footerSubText: { fontSize: 11, color: '#B45309', marginTop: 2, fontWeight: '600' },
});