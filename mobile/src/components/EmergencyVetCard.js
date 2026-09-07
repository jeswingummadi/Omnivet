import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';

export default function EmergencyVetCard({ assignedVet }) {
  // Default fallback local vet station contact if not loaded
  const vetName = assignedVet?.name || "Dr. Suresh Kumar (District Vet Officer)";
  const vetPhone = assignedVet?.phone || "+91 98765 43210";
  const stationName = assignedVet?.station || "Gudlavalleru Veterinary Station";

  const handleCallEmergency = () => {
    Linking.openURL(`tel:${vetPhone}`);
  };

  const handleWhatsApp = () => {
    Linking.openURL(`https://wa.me/${vetPhone.replace(/\D/g,'')}`);
  };

  return (
    <View style={{ backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#FCA5A5', borderRadius: 16, padding: 16, marginVertical: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 }}>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', fontSize: '10px', fontWeight: '900', padding: '2px 8px', borderRadius: '9999px', textTransform: 'uppercase' }}>
            🚨 Emergency Vet Hotline
          </span>
          <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#7F1D1D', marginTop: '6px', marginBottom: '2px' }}>
            {stationName}
          </h3>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#991B1B', margin: 0 }}>
            {vetName} • <span style={{ fontFamily: 'monospace' }}>{vetPhone}</span>
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button 
          onClick={handleCallEmergency}
          style={{ flex: 1, backgroundColor: '#DC2626', color: 'white', border: 'none', padding: '10px 12px', borderRadius: '10px', fontWeight: '900', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          📞 Call Emergency Vet
        </button>
        <button 
          onClick={handleWhatsApp}
          style={{ backgroundColor: '#16A34A', color: 'white', border: 'none', padding: '10px 14px', borderRadius: '10px', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}
        >
          💬 WhatsApp
        </button>
      </div>
    </View>
  );
}