import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { 
  User, 
  Globe, 
  Ticket, 
  ShieldCheck, 
  Award, 
  LogOut, 
  Check, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const [profileData, setProfileData] = useState<any>(null);
  const [selectedLang, setSelectedLang] = useState('en');
  const [langUpdatedMsg, setLangUpdatedMsg] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await api.getProfile();
      setProfileData(data);
      if (data.user?.preferred_language) {
        setSelectedLang(data.user.preferred_language);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLanguageChange = async (langCode: string) => {
    setSelectedLang(langCode);
    try {
      await api.updateLanguage(langCode);
      setLangUpdatedMsg(true);
      setTimeout(() => setLangUpdatedMsg(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'bn', label: 'Bengali', native: 'বাংলা' },
    { code: 'mr', label: 'Marathi', native: 'मराठी' },
  ];

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-slide-up">
      {/* User Hero Banner */}
      <div className="navy-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#102A43',
            fontSize: '22px',
            fontWeight: 800
          }}>
            {profileData?.user?.name?.[0] || 'R'}
          </div>

          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
              {profileData?.user?.name || 'Ragul Kumar'}
            </h2>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
              +91 {profileData?.user?.phone || '9876543210'} • Verified Rail Passenger
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          marginTop: '16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '12px',
          borderRadius: '12px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#F59E0B' }}>
              {profileData?.total_trips || 4}
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Total Journeys</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#4ADE80' }}>
              {profileData?.active_trips || 2}
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Active PNRs</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#FCD34D' }}>
              98%
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Punctuality Score</div>
          </div>
        </div>
      </div>

      {/* Multilingual Switcher */}
      <div className="glass-card" style={{ padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} color="#D97706" />
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#102A43' }}>
              Preferred App & Audio Language
            </h3>
          </div>
          {langUpdatedMsg && (
            <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: 700 }}>
              ✓ Saved
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: selectedLang === lang.code ? '2px solid #F59E0B' : '1px solid #E2E8F0',
                background: selectedLang === lang.code ? '#FEF3C7' : '#FFFFFF',
                color: selectedLang === lang.code ? '#92400E' : '#334E68',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{lang.native} ({lang.label})</span>
              {selectedLang === lang.code && <Check size={16} color="#D97706" />}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Settings & Services */}
      <div className="glass-card" style={{ padding: '8px 16px' }}>
        {[
          { label: 'Saved Co-Passengers (Family / Senior Citizen)', icon: User },
          { label: 'Railway Safety & Emergency Contacts', icon: ShieldCheck },
          { label: 'RailPulse Frequent Traveler Rewards', icon: Award },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 0',
                borderBottom: idx < 2 ? '1px solid #F1F5F9' : 'none',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 600, color: '#334E68' }}>
                <Icon size={16} color="#64748B" />
                {item.label}
              </div>
              <ChevronRight size={16} color="#94A3B8" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
