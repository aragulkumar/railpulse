import React, { useState } from 'react';
import { TrainETAScreen } from './screens/ETA/TrainETAScreen';
import { StationETAScreen } from './screens/ETA/StationETAScreen';
import { SearchScreen } from './screens/Booking/SearchScreen';
import { ComplaintsHomeScreen } from './screens/Complaints/ComplaintsHomeScreen';
import { ChatScreen } from './screens/Chat/ChatScreen';
import { NotificationsScreen } from './screens/Notifications/NotificationsScreen';
import { ProfileScreen } from './screens/Profile/ProfileScreen';
import { 
  Activity, 
  Search, 
  ShieldAlert, 
  Bot, 
  User, 
  Bell, 
  Train, 
  Building2, 
  Sparkles,
  Zap
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'eta' | 'booking' | 'complaints' | 'chat' | 'profile' | 'notifications'>('eta');
  const [etaViewMode, setEtaViewMode] = useState<'train' | 'station'>('train');
  const [selectedTrainNo, setSelectedTrainNo] = useState<string>('12951');

  const handleNavigateToTrainETA = (trainNo: string) => {
    setSelectedTrainNo(trainNo);
    setEtaViewMode('train');
    setActiveTab('eta');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Top Application Bar */}
      <header style={{
        background: '#102A43',
        color: '#FFFFFF',
        padding: '12px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 20px rgba(16, 42, 67, 0.15)'
      }}>
        <div 
          onClick={() => setActiveTab('eta')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
          }}>
            <Train size={18} color="#0B1D2D" />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.3px', color: '#FFFFFF' }}>
              Rail<span style={{ color: '#F59E0B' }}>Pulse</span>
            </div>
            <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.2px' }}>
              SIH 2026 PROTOTYPE
            </div>
          </div>
        </div>

        {/* Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* 1-Tap SOS Mini Button */}
          <button
            onClick={() => setActiveTab('complaints')}
            style={{
              background: '#DC2626',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '20px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(220, 38, 38, 0.35)'
            }}
          >
            <ShieldAlert size={14} /> SOS
          </button>

          {/* Notifications Bell */}
          <button
            onClick={() => setActiveTab('notifications')}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeTab === 'notifications' ? '#F59E0B' : '#FFFFFF',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <Bell size={18} />
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#F59E0B'
            }} />
          </button>

          {/* Profile Icon */}
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              background: activeTab === 'profile' ? '#F59E0B' : 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeTab === 'profile' ? '#102A43' : '#FFFFFF',
              cursor: 'pointer'
            }}
          >
            <User size={18} />
          </button>
        </div>
      </header>

      {/* Secondary ETA Sub-Navigation Bar if ETA tab active */}
      {activeTab === 'eta' && (
        <div style={{
          background: '#FFFFFF',
          padding: '8px 16px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={() => setEtaViewMode('train')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: etaViewMode === 'train' ? '#102A43' : '#F1F5F9',
              color: etaViewMode === 'train' ? '#F59E0B' : '#475569',
              fontWeight: 700,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Train size={14} /> Train Live ETA
          </button>

          <button
            onClick={() => setEtaViewMode('station')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: etaViewMode === 'station' ? '#102A43' : '#F1F5F9',
              color: etaViewMode === 'station' ? '#F59E0B' : '#475569',
              fontWeight: 700,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Building2 size={14} /> Station Board
          </button>
        </div>
      )}

      {/* Main Content View Switcher */}
      <main style={{ flex: 1, paddingBottom: '75px' }}>
        {activeTab === 'eta' && (
          etaViewMode === 'train' ? (
            <TrainETAScreen initialTrainNo={selectedTrainNo} />
          ) : (
            <StationETAScreen onSelectTrain={handleNavigateToTrainETA} />
          )
        )}

        {activeTab === 'booking' && <SearchScreen onNavigateToETA={handleNavigateToTrainETA} />}
        {activeTab === 'complaints' && <ComplaintsHomeScreen />}
        {activeTab === 'chat' && <ChatScreen />}
        {activeTab === 'notifications' && <NotificationsScreen onNavigate={(s) => setActiveTab(s as any)} />}
        {activeTab === 'profile' && <ProfileScreen onNavigateToETA={handleNavigateToTrainETA} />}
      </main>

      {/* Modern Bottom Navigation Bar */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '520px',
        background: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        padding: '6px 12px 10px 12px',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '4px',
        zIndex: 100,
        boxShadow: '0 -4px 20px rgba(16, 42, 67, 0.08)'
      }}>
        {[
          { id: 'eta', label: 'Live ETA', icon: Activity },
          { id: 'booking', label: 'Book Ticket', icon: Search },
          { id: 'complaints', label: 'Services/SOS', icon: ShieldAlert },
          { id: 'chat', label: 'AI RailBot', icon: Bot },
          { id: 'profile', label: 'Account', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: 'none',
                border: 'none',
                padding: '6px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                color: isActive ? '#D97706' : '#64748B',
                fontWeight: isActive ? 800 : 600,
                fontSize: '11px',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{
                padding: '4px 12px',
                borderRadius: '16px',
                background: isActive ? '#FEF3C7' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={19} color={isActive ? '#D97706' : '#64748B'} />
              </div>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
export default App;
