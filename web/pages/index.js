import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';

export default function OmniVetDashboard() {
  const DEFAULT_OFFICER = {
    name: 'Dr. Suresh Kumar (Official Vet)',
    village: 'Central Surveillance Command',
    licId: 'VET-IND-001',
    phone: '+91 98765 43210'
  };

  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [authMode, setAuthMode] = useState('signin');
  const [otpRequested, setOtpRequested] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [licId, setLicId] = useState('');
  const [user, setUser] = useState(DEFAULT_OFFICER);

  // Dashboard Data State
  const [reports, setReports] = useState([]);
  const [outbreaks, setOutbreaks] = useState([]);
  const [apiStatus, setApiStatus] = useState('Connecting...');
  const [incomingAlert, setIncomingAlert] = useState(null);
  const lastSeenReportIdRef = useRef(null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const getApiUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
    }
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://127.0.0.1:8000';
      }
    }
    return '';
  };
  const API_URL = getApiUrl();
  const SESSION_KEY = 'omnivet_vet_session';
  const VETS_DB_KEY = 'omnivet_registered_vets_db';

  const mapInstanceRef = useRef(null);
  const hasFittedBoundsRef = useRef(false);

  useEffect(() => {
    const isExplicitlySignedOut = localStorage.getItem('omnivet_signed_out') === 'true';
    if (isExplicitlySignedOut) {
      setIsLoggedIn(false);
      setUser(null);
      return;
    }
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        setUser(JSON.parse(saved));
        setIsLoggedIn(true);
      } catch (e) {
        localStorage.removeItem(SESSION_KEY);
        setUser(DEFAULT_OFFICER);
        setIsLoggedIn(true);
      }
    } else {
      localStorage.setItem(SESSION_KEY, JSON.stringify(DEFAULT_OFFICER));
      setUser(DEFAULT_OFFICER);
      setIsLoggedIn(true);
    }
  }, []);

  // Fetch live telemetry from FastAPI backend every 3 seconds
  useEffect(() => {
    if (!isLoggedIn) return;

    loadTelemetryData();
    const interval = setInterval(loadTelemetryData, 3000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Initialize & Update Map when outbreaks or reports change
  useEffect(() => {
    if (isLoggedIn && typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        initGoogleMapStyleMap();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, outbreaks, reports]);

  const fetchEndpointData = async (endpointPath) => {
    // 1. Try Next.js server proxy first (works seamlessly on localhost and Vercel)
    try {
      const res = await fetch(endpointPath);
      if (res.ok) return await res.json();
    } catch (e) {}

    // 2. Try direct API_URL
    if (API_URL) {
      try {
        const res = await fetch(`${API_URL}${endpointPath}`);
        if (res.ok) return await res.json();
      } catch (e) {}
    }

    // 3. Try direct local backend
    try {
      const res = await fetch(`http://127.0.0.1:8000${endpointPath}`);
      if (res.ok) return await res.json();
    } catch (e) {}

    throw new Error('All telemetry endpoints unreachable');
  };

  const loadTelemetryData = async () => {
    setIsRefreshing(true);
    try {
      const repData = await fetchEndpointData('/api/reports');
      const reportsList = Array.isArray(repData) ? repData : (repData.data || []);
      setReports(reportsList);

      // Auto-detect incoming alerts from mobile
      if (reportsList.length > 0) {
        const topReport = reportsList[0];
        if (lastSeenReportIdRef.current === null) {
          // On first load, show the latest alert if high risk
          if (topReport.status === 'flagged_high_risk' || topReport.mortality_status) {
            setIncomingAlert(topReport);
          }
        } else if (topReport.id > lastSeenReportIdRef.current) {
          // New report arrived in real-time!
          setIncomingAlert(topReport);
          if (mapInstanceRef.current && topReport.latitude && topReport.longitude) {
            mapInstanceRef.current.setView([parseFloat(topReport.latitude), parseFloat(topReport.longitude)], 13);
          }
        }
        lastSeenReportIdRef.current = topReport.id;
      }

      const outData = await fetchEndpointData('/api/outbreaks');
      const outbreaksList = Array.isArray(outData) ? outData : (outData.data || []);
      setOutbreaks(outbreaksList);

      setApiStatus('Online (Live Sync)');
    } catch (err) {
      setApiStatus('Offline (Cannot Reach Backend)');
    } finally {
      setIsRefreshing(false);
    }
  };

  const initGoogleMapStyleMap = () => {
    if (typeof window === 'undefined' || !document.getElementById('map')) return;
    const L = window.L;
    if (!L) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map('map').setView([20.5937, 78.9629], 5);
      
      L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps'
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Circle) {
        map.removeLayer(layer);
      }
    });

    const latlngs = [];

    // 1. Plot Outbreak Clusters (Orange with 5km perimeter)
    outbreaks.forEach((o) => {
      const lat = parseFloat(o.latitude) || 16.5062;
      const lng = parseFloat(o.longitude) || 80.6480;
      latlngs.push([lat, lng]);

      L.circle([lat, lng], {
        radius: 5000,
        color: '#C2410C',
        fillColor: '#C2410C',
        fillOpacity: 0.15,
        weight: 1.5,
      }).addTo(map);

      const markerHtml = '<div style="width:22px;height:22px;background:#C2410C;border:3px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(194,65,12,0.9);display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:bold;">⚡</div>';
      const customIcon = L.divIcon({
        className: 'custom-cluster-marker',
        html: markerHtml,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="color: #78350F; font-size: 12px; font-family: sans-serif; min-width: 170px;">
          <b style="color:#C2410C;">🚨 OUTBREAK CLUSTER #${o.id || 1}</b><br/>
          <b>Species:</b> ${o.species || 'All'}<br/>
          <b>Active Cases:</b> ${o.cases || 1}<br/>
          <b>Status:</b> ${o.status || 'Active Surveillance'}
        </div>
      `);
    });

    // 2. Plot Farmer Reports from Mobile App
    reports.forEach((r) => {
      if (!r.latitude || !r.longitude) return;
      const lat = parseFloat(r.latitude);
      const lng = parseFloat(r.longitude);
      if (isNaN(lat) || isNaN(lng)) return;
      latlngs.push([lat, lng]);

      const isHigh = r.status === 'flagged_high_risk' || r.mortality_status;
      const isEscalated = r.status === 'escalated_quarantine_alert';

      const bgColor = isEscalated ? '#B91C1C' : (isHigh ? '#DC2626' : '#D97706');
      const pulseColor = isEscalated ? 'rgba(185,28,28,0.8)' : (isHigh ? 'rgba(220,38,38,0.8)' : 'rgba(217,119,6,0.5)');

      // Draw quarantine alert circle around high-risk and escalated reports
      if (isHigh || isEscalated) {
        L.circle([lat, lng], {
          radius: 2500,
          color: bgColor,
          fillColor: bgColor,
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: '5, 5'
        }).addTo(map);
      }

      const pinHtml = `<div style="width:18px;height:18px;background:${bgColor};border:2.5px solid #fff;border-radius:50%;box-shadow:0 0 8px ${pulseColor};"></div>`;
      const reportIcon = L.divIcon({
        className: 'custom-report-marker',
        html: pinHtml,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const sympStr = Array.isArray(r.symptoms) ? r.symptoms.join(', ') : (r.symptoms || 'None');
      const timeStr = r.timestamp ? new Date(r.timestamp).toLocaleString() : 'Recent';

      const marker = L.marker([lat, lng], { icon: reportIcon }).addTo(map);
      marker.bindPopup(`
        <div style="color: #78350F; font-size: 12px; font-family: sans-serif; min-width: 180px;">
          <b style="color:${bgColor};">📱 FARMER REPORT #${r.id}</b><br/>
          <b>Farmer:</b> ${r.farmer_name || 'Farmer'}<br/>
          <b>Phone:</b> ${r.farmer_phone || 'N/A'}<br/>
          <b>Species:</b> ${r.species || 'Livestock'}<br/>
          <b>Symptoms:</b> ${sympStr}<br/>
          <b>Status:</b> ${r.status || 'Pending'}<br/>
          <b>Submitted:</b> ${timeStr}
        </div>
      `);
    });

    if (latlngs.length > 0 && !hasFittedBoundsRef.current) {
      map.fitBounds(latlngs, { padding: [40, 40] });
      hasFittedBoundsRef.current = true;
    }
  };

  const focusOnFarmerLocation = (lat, lng) => {
    if (mapInstanceRef.current && lat && lng) {
      mapInstanceRef.current.setView([lat, lng], 14);
      const mapElement = document.getElementById('map');
      if (mapElement) {
        mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 9) {
      alert('Please enter a valid mobile number.');
      return;
    }
    if (!otpRequested) {
      setOtpRequested(true);
      alert('OTP sent to your mobile phone.');
      return;
    }

    let registeredVets = {};
    try {
      registeredVets = JSON.parse(localStorage.getItem(VETS_DB_KEY) || '{}');
    } catch (err) {
      registeredVets = {};
    }

    let vetObj = {};
    if (authMode === 'register') {
      vetObj = { name: name.trim(), village: village.trim(), licId: licId.trim(), phone: cleanPhone };
      registeredVets[cleanPhone] = vetObj;
      localStorage.setItem(VETS_DB_KEY, JSON.stringify(registeredVets));
    } else {
      vetObj = registeredVets[cleanPhone] || { name: 'Dr. Veterinary Officer', village: 'HQ Station', licId: 'VET-HQ', phone: cleanPhone };
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(vetObj));
    localStorage.removeItem('omnivet_signed_out');
    setUser(vetObj);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.setItem('omnivet_signed_out', 'true');
    setIsLoggedIn(false);
    setUser(null);
    hasFittedBoundsRef.current = false;
  };

  const escalateReport = async (id, e) => {
    e.stopPropagation();
    try {
      await fetch(`${API_URL}/api/reports/${id}/escalate`, { method: 'POST' });
      loadTelemetryData();
    } catch (err) {
      alert('Could not escalate report.');
    }
  };

  const highRiskCount = reports.filter((r) => r.status === 'flagged_high_risk' || r.status === 'escalated_quarantine_alert').length;
  const mortalityCount = reports.filter((r) => r.mortality_status).length;

  return (
    <>
      <Head>
        <title>OmniVet - Veterinary Command Center</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      </Head>

      <div className="min-h-screen flex flex-col bg-[#FFFDF9] text-[#292524] font-sans">
        <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b-[1.5px] border-[#FDE68A] shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#D97706] flex items-center justify-center font-bold text-white shadow-md">🐾</div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs tracking-wider text-[#D97706] uppercase">OMNIVET</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">Vet Command Portal</span>
                </div>
                <p className="text-[11px] text-[#92400E] font-semibold">Official Animal Health Surveillance Directorate - India</p>
              </div>
            </div>

            {isLoggedIn && user && (
              <div className="flex items-center gap-3">
                <button
                  onClick={loadTelemetryData}
                  disabled={isRefreshing}
                  className="px-3 py-1.5 bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] border border-[#FDE68A] rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  title="Force re-sync with Neon PostgreSQL"
                >
                  <span className={isRefreshing ? "animate-spin" : ""}>🔄</span>
                  {isRefreshing ? 'Syncing...' : 'Refresh Telemetry'}
                </button>
                <div className="text-right">
                  <div className="text-xs font-bold text-[#78350F]">{user.name}</div>
                  <div className="text-[10px] text-[#D97706] font-mono font-bold">ID: {user.licId || 'VET-HQ'}</div>
                </div>
                <button onClick={handleLogout} className="px-3 py-1.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B91C1C] border border-[#FECCA7] rounded-lg text-xs font-bold transition-all">
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {!isLoggedIn ? (
            <div className="max-w-md mx-auto mt-10 space-y-6">
              <div className="bg-[#FFFFFF] border-[1.5px] border-[#FDE68A] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex w-12 h-12 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] items-center justify-center text-[#D97706] text-xl font-bold mb-1">🩺</div>
                  <h2 className="text-xl font-black text-[#78350F]">Veterinary Officer Portal</h2>
                  <p className="text-xs text-[#92400E] font-semibold leading-relaxed">Sign in with your registered phone number to view live mobile reports and Google Maps telemetry across India.</p>
                </div>

                <div className="flex bg-[#FFFBEB] p-1 rounded-xl border border-[#FDE68A]">
                  <button onClick={() => { setAuthMode('signin'); setOtpRequested(false); }} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authMode === 'signin' ? 'bg-[#D97706] text-white shadow-sm' : 'text-[#92400E]'}`}>Sign In</button>
                  <button onClick={() => { setAuthMode('register'); setOtpRequested(false); }} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authMode === 'register' ? 'bg-[#D97706] text-white shadow-sm' : 'text-[#92400E]'}`}>Register Officer</button>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {authMode === 'register' && (
                    <>
                      <div>
                        <label className="block text-xs font-extrabold text-[#92400E] mb-1">Full Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Suresh Kumar" className="w-full bg-[#FFFBEB] border-[1.5px] border-[#FDE68A] rounded-xl px-3.5 py-2.5 text-xs text-[#292524] font-semibold outline-none focus:border-[#D97706]" />
                      </div>
                      <div>
                        <label className="block text-xs font-extrabold text-[#92400E] mb-1">Village / Station</label>
                        <input type="text" value={village} onChange={(e) => setVillage(e.target.value)} placeholder="Gudlavalleru Veterinary Station" className="w-full bg-[#FFFBEB] border-[1.5px] border-[#FDE68A] rounded-xl px-3.5 py-2.5 text-xs text-[#292524] font-semibold outline-none focus:border-[#D97706]" />
                      </div>
                      <div>
                        <label className="block text-xs font-extrabold text-[#92400E] mb-1">Government Vet Doctor ID</label>
                        <input type="text" value={licId} onChange={(e) => setLicId(e.target.value)} placeholder="VET-IND-0994-AP" className="w-full bg-[#FFFBEB] border-[1.5px] border-[#FDE68A] rounded-xl px-3.5 py-2.5 text-xs text-[#C2410C] font-mono font-bold outline-none focus:border-[#D97706]" />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-extrabold text-[#92400E] mb-1">Mobile Phone Number</label>
                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="w-full bg-[#FFFBEB] border-[1.5px] border-[#FDE68A] rounded-xl px-3.5 py-2.5 text-xs text-[#292524] font-semibold outline-none focus:border-[#D97706]" />
                  </div>

                  {otpRequested && (
                    <div>
                      <label className="block text-xs font-extrabold text-[#C2410C] mb-1">Enter 4-Digit Verification OTP</label>
                      <input type="text" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="••••" className="w-full bg-[#FFFBEB] border-[1.5px] border-[#D97706] rounded-xl px-3.5 py-2.5 text-center font-mono tracking-widest text-lg text-[#78350F] font-black outline-none" />
                    </div>
                  )}

                  <button type="submit" className="w-full py-3.5 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-black text-xs uppercase tracking-wider shadow-md transition-all">
                    {!otpRequested ? 'Send Verification OTP' : (authMode === 'signin' ? 'Verify & Sign In' : 'Complete Registration')}
                  </button>

                  <div className="pt-2 border-t border-[#FDE68A]">
                    <button
                      type="button"
                      onClick={() => {
                        const demoVet = { name: 'Dr. Suresh Kumar (HQ)', village: 'Central Surveillance Command', licId: 'VET-IND-001', phone: '+91 98765 43210' };
                        localStorage.setItem(SESSION_KEY, JSON.stringify(demoVet));
                        localStorage.removeItem('omnivet_signed_out');
                        setUser(demoVet);
                        setIsLoggedIn(true);
                      }}
                      className="w-full py-2.5 rounded-xl bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] font-extrabold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>⚡</span> Instant Sign In as Official Vet
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {incomingAlert && (
                <div className="bg-gradient-to-r from-[#DC2626] via-[#D97706] to-[#DC2626] text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-2 border-red-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold shadow-inner">
                      🚨
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-wider text-amber-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                        LIVE EMERGENCY ALERT #{incomingAlert.id} RECEIVED FROM MOBILE
                      </div>
                      <div className="text-sm font-black">
                        Farmer <span className="underline decoration-amber-300">{incomingAlert.farmer_name || 'Farmer'}</span> reported <span className="text-amber-200">{incomingAlert.species}</span> with symptoms: <span className="text-white font-bold">{Array.isArray(incomingAlert.symptoms) ? incomingAlert.symptoms.join(', ') : incomingAlert.symptoms}</span>
                      </div>
                      <div className="text-[11px] text-amber-100 font-semibold">
                        GPS: {parseFloat(incomingAlert.latitude || 0).toFixed(4)}, {parseFloat(incomingAlert.longitude || 0).toFixed(4)} • Phone: {incomingAlert.farmer_phone || 'N/A'} • Status: {incomingAlert.status}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => focusOnFarmerLocation(incomingAlert.latitude, incomingAlert.longitude)}
                      className="px-4 py-2 bg-white text-red-700 hover:bg-amber-100 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <span>📍</span> Zoom to Location
                    </button>
                    <button
                      onClick={() => setIncomingAlert(null)}
                      className="px-3 py-2 bg-black/20 hover:bg-black/30 text-white font-bold text-xs rounded-xl transition-all"
                      title="Dismiss Alert"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FFFFFF] border-[1.5px] border-[#FDE68A] p-3 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] animate-ping"></span>
                  <span className="text-xs font-bold text-[#78350F]">India Google Maps Live Engine • SRID 4326</span>
                  <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] font-mono font-bold">API: {apiStatus}</span>
                </div>
                <div>
                  <button onClick={loadTelemetryData} className="px-3.5 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-lg text-xs font-black shadow-sm transition-all">
                    ↻ Refresh Mobile Data
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#FFFFFF] border-[1.5px] border-[#FDE68A] rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-bold text-[#92400E] mb-1">Active High-Risk Outbreaks</div>
                  <div className="text-2xl font-black text-[#C2410C]">{highRiskCount}</div>
                </div>
                <div className="bg-[#FFFFFF] border-[1.5px] border-[#FDE68A] rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-bold text-[#92400E] mb-1">GIS Clusters</div>
                  <div className="text-2xl font-black text-[#D97706]">{outbreaks.length}</div>
                </div>
                <div className="bg-[#FFFFFF] border-[1.5px] border-[#FDE68A] rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-bold text-[#92400E] mb-1">Mortality Cases</div>
                  <div className="text-2xl font-black text-[#C2410C]">{mortalityCount}</div>
                </div>
                <div className="bg-[#FFFFFF] border-[1.5px] border-[#FDE68A] rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-bold text-[#92400E] mb-1">Total Mobile Reports</div>
                  <div className="text-2xl font-black text-[#78350F]">{reports.length}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#78350F]">GIS Outbreak Map - India (Google Maps Style)</h3>
                  <span className="text-xs text-[#D97706] bg-[#FEF3C7] px-3 py-1 rounded-full border border-[#FDE68A] font-mono font-bold">SRID 4326</span>
                </div>
                <div className="relative w-full rounded-2xl overflow-hidden border-[1.5px] border-[#FDE68A] shadow-lg bg-white">
                  <div id="map" className="h-[460px] w-full z-0"></div>
                </div>
              </div>

              <div className="bg-[#FFFFFF] border-[1.5px] border-[#FDE68A] rounded-2xl overflow-hidden shadow-md space-y-2">
                <div className="p-4 border-b border-[#FDE68A] bg-[#FFFBEB]">
                  <h3 className="text-base font-black text-[#78350F]">Live Triage Telemetry Table (Mobile Submissions)</h3>
                  <p className="text-xs text-[#92400E] font-semibold">💡 Click any row to jump directly to the farmer's location on the map</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#FEF3C7] border-b border-[#FDE68A] text-[#78350F] font-black uppercase">
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">Farmer Details</th>
                        <th className="py-3 px-4">Species</th>
                        <th className="py-3 px-4">Symptoms</th>
                        <th className="py-3 px-4">GPS Coordinates</th>
                        <th className="py-3 px-4">Risk Level</th>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#FDE68A]">
                      {reports.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-6 text-[#92400E] font-semibold">No mobile reports received yet. Submit a problem from your mobile app!</td>
                        </tr>
                      ) : (
                        reports.map((r) => {
                          const isHigh = r.status === 'flagged_high_risk' || r.mortality_status;
                          const isEscalated = r.status === 'escalated_quarantine_alert';
                          let badge = <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">PENDING</span>;
                          if (isEscalated) badge = <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#FEF2F2] text-[#B91C1C] border border-[#FECCA7]">QUARANTINE ALERT</span>;
                          else if (isHigh) badge = <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#FEF3C7] text-[#C2410C] border border-[#FDE68A]">HIGH RISK</span>;

                          const sympText = Array.isArray(r.symptoms) ? r.symptoms.join(', ') : (r.symptoms || 'None');

                          return (
                            <tr key={r.id} onClick={() => focusOnFarmerLocation(r.latitude, r.longitude)} className="hover:bg-[#FEF3C7]/55 cursor-pointer transition-colors" title="Click to view on map">
                              <td className="py-3 px-4 font-mono font-bold text-[#78350F]">#{r.id}</td>
                              <td className="py-3 px-4 font-black text-[#292524]">{r.farmer_name || 'Farmer'} <span className="block text-[10px] text-[#92400E] font-mono">{r.farmer_phone}</span></td>
                              <td className="py-3 px-4 text-[#D97706] font-extrabold">{r.species}</td>
                              <td className="py-3 px-4 font-semibold text-[#78350F]">{sympText}</td>
                              <td className="py-3 px-4 font-mono text-[11px] text-[#92400E]">📍 {(r.latitude || 0).toFixed(4)}, {(r.longitude || 0).toFixed(4)}</td>
                              <td className="py-3 px-4">{badge}</td>
                              <td className="py-3 px-4 text-[#92400E] text-[11px] font-semibold">{r.timestamp ? new Date(r.timestamp).toLocaleString() : 'N/A'}</td>
                              <td className="py-3 px-4 text-right">
                                {isEscalated ? (
                                  <span className="text-[#D97706] font-black">✓ Escalated</span>
                                ) : (
                                  <button onClick={(e) => escalateReport(r.id, e)} className="px-3 py-1.5 bg-[#C2410C] hover:bg-[#9A3412] text-white font-black rounded-lg text-[11px] shadow-sm transition-all">Escalate</button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </>
  );
}