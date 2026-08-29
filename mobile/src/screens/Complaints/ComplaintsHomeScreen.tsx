import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { 
  AlertOctagon, 
  Sparkles, 
  ArrowLeftRight, 
  FileText, 
  MapPin, 
  PhoneCall, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  Send,
  X,
  User
} from 'lucide-react';

export const ComplaintsHomeScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sos' | 'cleaning' | 'swap' | 'general'>('sos');
  const [pnrId, setPnrId] = useState('8421950341');
  const [coach, setCoach] = useState('B2');
  const [berth, setBerth] = useState(45);

  // SOS State
  const [sosActive, setSosActive] = useState(false);
  const [sosResult, setSosResult] = useState<any>(null);
  const [sosType, setSosType] = useState('Medical Emergency');

  // Cleaning State
  const [cleanType, setCleanType] = useState('Coach Floor & Toilet');
  const [cleanDesc, setCleanDesc] = useState('');
  const [cleanSuccess, setCleanSuccess] = useState<string | null>(null);

  // Seat Swap State
  const [swapPref, setSwapPref] = useState('Lower');
  const [swapReason, setSwapReason] = useState('Senior Citizen / Knee Pain');
  const [swapSuccess, setSwapSuccess] = useState<string | null>(null);
  const [demoSwapPending, setDemoSwapPending] = useState(true);
  const [tteApproved, setTteApproved] = useState(false);

  // General Complaint State
  const [generalCategory, setGeneralCategory] = useState('Electrical / AC failure');
  const [generalDesc, setGeneralDesc] = useState('');
  const [generalSuccess, setGeneralSuccess] = useState<string | null>(null);

  const handleTriggerSOS = async () => {
    try {
      setSosActive(true);
      const res = await api.triggerSOS({
        pnr_id: pnrId,
        coach: coach,
        berth: Number(berth),
        emergency_type: sosType,
        gps_lat: 28.6139,
        gps_lng: 77.2090,
        nearest_station: 'Approaching Kota Jn',
        description: `IMMEDIATE ASSISTANCE: ${sosType} reported by passenger in Coach ${coach}, Berth ${berth}`
      });
      setSosResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCleaningSubmit = async () => {
    try {
      await api.requestCleaning({
        pnr_id: pnrId,
        coach: coach,
        berth: Number(berth),
        cleaning_type: cleanType,
        description: cleanDesc || 'Immediate sanitization requested.'
      });
      setCleanSuccess(`OBHS cleaning request dispatched for Coach ${coach}, Berth ${berth}. Staff will arrive shortly.`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwapSubmit = async () => {
    try {
      await api.requestSeatSwap({
        requester_pnr_id: pnrId,
        preferred_berth_type: swapPref,
        reason: swapReason
      });
      setSwapSuccess(`Seat swap request broadcasted to coach passengers! Awaiting co-passenger acceptance.`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGeneralSubmit = async () => {
    try {
      await api.fileGeneralComplaint({
        pnr_id: pnrId,
        category: generalCategory,
        coach: coach,
        berth: Number(berth),
        description: generalDesc || 'Grievance recorded.'
      });
      setGeneralSuccess(`Complaint registered. Reference assigned to Divisional Grievance Cell.`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-slide-up">
      {/* Category Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
        {[
          { id: 'sos', label: '1-Tap SOS', icon: AlertOctagon, color: '#DC2626' },
          { id: 'cleaning', label: 'Cleaning', icon: Sparkles, color: '#2563EB' },
          { id: 'swap', label: 'Seat Swap', icon: ArrowLeftRight, color: '#D97706' },
          { id: 'general', label: 'Grievance', icon: FileText, color: '#4B5563' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '10px 4px',
                borderRadius: '12px',
                border: isActive ? `2px solid ${tab.color}` : '1px solid #E2E8F0',
                background: isActive ? (tab.id === 'sos' ? '#FEE2E2' : '#F1F5F9') : '#FFFFFF',
                color: isActive ? tab.color : '#64748B',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Icon size={18} color={isActive ? tab.color : '#64748B'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Auto-tagged PNR Context */}
      <div style={{ 
        background: '#FFFFFF', 
        padding: '10px 14px', 
        borderRadius: '10px', 
        border: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px'
      }}>
        <span style={{ color: '#64748B' }}>Active Ticket: <b>PNR {pnrId}</b></span>
        <span style={{ color: '#102A43', fontWeight: 700 }}>Coach {coach} • Berth {berth}</span>
      </div>

      {/* TAB 1: EMERGENCY SOS */}
      {activeTab === 'sos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%)',
            color: '#FFFFFF',
            padding: '20px',
            borderRadius: '18px',
            boxShadow: '0 10px 30px rgba(220, 38, 38, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <ShieldAlert size={24} color="#FCA5A5" />
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Emergency Control Center</h3>
            </div>
            <p style={{ fontSize: '13px', color: '#FECACA', lineHeight: 1.4 }}>
              Instantly transmits your GPS coordinates and coach telemetry to the Railway Protection Force (RPF) and Train Superintendent.
            </p>

            {/* Emergency Type Selector */}
            <div style={{ marginTop: '14px' }}>
              <label style={{ fontSize: '11px', color: '#FECACA', fontWeight: 700 }}>EMERGENCY CATEGORY</label>
              <select
                value={sosType}
                onChange={(e) => setSosType(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#FFFFFF',
                  color: '#7F1D1D',
                  fontWeight: 700,
                  fontSize: '14px'
                }}
              >
                <option value="Medical Emergency">Medical Emergency / Doctor Required</option>
                <option value="Security / Threat">Security / Harassment / Threat</option>
                <option value="Theft / Crime">Theft / Illegal Intrusion</option>
                <option value="Fire / Hazard">Fire / Coach Smoke Alarm</option>
              </select>
            </div>

            {/* Huge SOS Trigger Button */}
            <button
              onClick={handleTriggerSOS}
              className="btn-sos animate-pulse-glow"
              style={{
                width: '100%',
                padding: '18px',
                marginTop: '18px',
                fontSize: '18px',
                letterSpacing: '1px'
              }}
            >
              <AlertOctagon size={24} />
              {sosActive ? '🚨 SOS DISPATCHED — RPF ALERTED' : 'TAP FOR 1-TOUCH EMERGENCY SOS'}
            </button>
          </div>

          {/* SOS Dispatch Confirmation */}
          {sosResult && (
            <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #DC2626' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#DC2626', fontWeight: 800 }}>
                <CheckCircle2 size={20} />
                <span>EMERGENCY DISPATCH CONFIRMED</span>
              </div>
              <div style={{ fontSize: '13px', color: '#334E68', marginTop: '8px' }}>
                • <b>Assigned Unit:</b> {sosResult.assigned_to}<br />
                • <b>Geo-Coordinates:</b> {sosResult.gps_lat}, {sosResult.gps_lng}<br />
                • <b>Status:</b> {sosResult.resolution_notes}
              </div>
              <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
                <a 
                  href="tel:139" 
                  style={{ 
                    flex: 1, 
                    padding: '10px', 
                    background: '#102A43', 
                    color: '#FFF', 
                    borderRadius: '8px', 
                    textAlign: 'center', 
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <PhoneCall size={14} /> Call 139 Helpline
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLEANING REQUEST */}
      {activeTab === 'cleaning' && (
        <div className="glass-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#102A43' }}>
            On-Board Housekeeping (OBHS)
          </h3>
          <p style={{ fontSize: '13px', color: '#64748B' }}>
            Request on-board coach cleaners to sanitize your compartment or lavatory.
          </p>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#334E68' }}>Cleaning Area</label>
            <select
              value={cleanType}
              onChange={(e) => setCleanType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontWeight: 600,
                marginTop: '4px',
                background: '#FFF'
              }}
            >
              <option value="Coach Floor & Toilet">Coach Floor & Toilet Sanitization</option>
              <option value="Lavatory Basin / Flush">Lavatory Basin & Water Supply</option>
              <option value="Berth & Window Glass">Berth / Window Cleaning</option>
              <option value="Fresh Linen / Bedroll">Fresh Bedroll / Linen Exchange</option>
              <option value="Trash & Bin Clearance">Trash & Dustbin Clearance</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#334E68' }}>Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Water spillage near door"
              value={cleanDesc}
              onChange={(e) => setCleanDesc(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                marginTop: '4px'
              }}
            />
          </div>

          <button onClick={handleCleaningSubmit} className="btn-saffron" style={{ padding: '12px' }}>
            <Sparkles size={16} /> Request OBHS Cleaning
          </button>

          {cleanSuccess && (
            <div style={{ background: '#DCFCE7', color: '#15803D', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
              {cleanSuccess}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SEAT / BERTH SWAP */}
      {activeTab === 'swap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="glass-card" style={{ padding: '18px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#102A43' }}>
              Peer-to-Peer Berth Exchange
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
              Request a mutual seat swap with fellow coach passengers and obtain digital TTE approval.
            </p>

            <div style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334E68' }}>Desired Berth</label>
              <select
                value={swapPref}
                onChange={(e) => setSwapPref(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontWeight: 600,
                  marginTop: '4px',
                  background: '#FFF'
                }}
              >
                <option value="Lower">Lower Berth (Senior / Medical)</option>
                <option value="Middle">Middle Berth</option>
                <option value="Side Lower">Side Lower</option>
                <option value="Adjacent Family Seat">Adjacent to Family</option>
              </select>
            </div>

            <div style={{ marginTop: '10px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334E68' }}>Reason for Swap</label>
              <input
                type="text"
                value={swapReason}
                onChange={(e) => setSwapReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  marginTop: '4px'
                }}
              />
            </div>

            <button 
              onClick={handleSwapSubmit} 
              className="btn-saffron" 
              style={{ width: '100%', padding: '12px', marginTop: '14px' }}
            >
              <ArrowLeftRight size={16} /> Broadcast Swap Request
            </button>

            {swapSuccess && (
              <div style={{ background: '#FEF3C7', color: '#92400E', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, marginTop: '10px' }}>
                {swapSuccess}
              </div>
            )}
          </div>

          {/* Active Peer Swap Negotiation Card */}
          <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #F59E0B' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#92400E' }}>CO-PASSENGER SWAP MATCH FOUND</span>
              <span style={{ fontSize: '11px', background: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                {tteApproved ? 'TTE APPROVED' : 'AWAITING TTE'}
              </span>
            </div>

            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', background: '#F8FAFC', padding: '12px', borderRadius: '8px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748B' }}>YOUR BERTH</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#102A43' }}>B2-45</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Upper</div>
              </div>
              <ArrowLeftRight size={20} color="#F59E0B" />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748B' }}>CO-PASSENGER</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#16A34A' }}>B2-12</div>
                <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: 600 }}>Lower (Agreed)</div>
              </div>
            </div>

            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setTteApproved(true)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: tteApproved ? '#16A34A' : '#102A43',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {tteApproved ? '✓ Handheld Terminal Updated' : 'Simulate TTE Digital Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GENERAL GRIEVANCE */}
      {activeTab === 'general' && (
        <div className="glass-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#102A43' }}>
            Rail Madad Grievance Cell
          </h3>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#334E68' }}>Category</label>
            <select
              value={generalCategory}
              onChange={(e) => setGeneralCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontWeight: 600,
                marginTop: '4px',
                background: '#FFF'
              }}
            >
              <option value="Electrical / AC failure">Electrical / Air Conditioning / Charging Socket</option>
              <option value="Catering & Food Quality">Catering / Overcharging / Food Quality</option>
              <option value="Punctuality & Delay">Punctuality & Unexpected Delay</option>
              <option value="Staff Misbehavior">Staff Misbehavior / Overcrowding</option>
              <option value="Coach Maintenance">Coach Window / Berth Maintenance</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#334E68' }}>Description</label>
            <textarea
              rows={3}
              value={generalDesc}
              onChange={(e) => setGeneralDesc(e.target.value)}
              placeholder="Describe the grievance details..."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                marginTop: '4px'
              }}
            />
          </div>

          <button onClick={handleGeneralSubmit} className="btn-saffron" style={{ padding: '12px' }}>
            <FileText size={16} /> Submit Grievance
          </button>

          {generalSuccess && (
            <div style={{ background: '#DCFCE7', color: '#15803D', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
              {generalSuccess}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
