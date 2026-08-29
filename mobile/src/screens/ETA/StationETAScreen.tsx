import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Building2, ArrowDownRight, ArrowUpRight, Clock, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';

interface StationETAScreenProps {
  onSelectTrain?: (trainNo: string) => void;
}

export const StationETAScreen: React.FC<StationETAScreenProps> = ({ onSelectTrain }) => {
  const [stationCode, setStationCode] = useState('NDLS');
  const [stationData, setStationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const stations = [
    { code: 'NDLS', name: 'New Delhi' },
    { code: 'MMCT', name: 'Mumbai Central' },
    { code: 'BSB', name: 'Varanasi Jn' },
    { code: 'BPL', name: 'Bhopal Jn' },
    { code: 'AGC', name: 'Agra Cantt' },
  ];

  useEffect(() => {
    fetchStationData(stationCode);
  }, [stationCode]);

  const fetchStationData = async (code: string) => {
    try {
      setLoading(true);
      const data = await api.getStationETA(code);
      setStationData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-slide-up">
      {/* Station Selector Bar */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {stations.map((stn) => (
          <button
            key={stn.code}
            onClick={() => setStationCode(stn.code)}
            style={{
              padding: '8px 14px',
              borderRadius: '12px',
              border: stationCode === stn.code ? '2px solid #F59E0B' : '1px solid #E2E8F0',
              background: stationCode === stn.code ? '#102A43' : '#FFFFFF',
              color: stationCode === stn.code ? '#FFFFFF' : '#334E68',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Building2 size={14} color={stationCode === stn.code ? '#F59E0B' : '#64748B'} />
            {stn.name} ({stn.code})
          </button>
        ))}
      </div>

      {/* Station Header Card */}
      <div className="navy-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ color: '#F59E0B', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
              LIVE STATION PASSENGER DISPLAY SYSTEM
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
              {stationData?.station_name || stationCode}
            </h2>
          </div>
          <button
            onClick={() => fetchStationData(stationCode)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              color: '#FFFFFF',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div style={{ marginTop: '12px', fontSize: '12px', color: '#94A3B8' }}>
          Real-time Section Speed & Delay Propagation Active • {stationData?.trains?.length || 0} Trains scheduled
        </div>
      </div>

      {/* Train Arrival/Departure List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>
            <RefreshCw size={24} className="animate-pulse-glow" color="#F59E0B" />
            <p style={{ marginTop: '8px' }}>Refreshing Station Board...</p>
          </div>
        ) : stationData?.trains?.map((train: any) => {
          const isDelayed = train.delay_minutes > 5;
          const isDeparting = train.direction === 'DEPARTING';

          return (
            <div
              key={train.train_no}
              onClick={() => onSelectTrain && onSelectTrain(train.train_no)}
              className="glass-card"
              style={{
                padding: '16px',
                cursor: 'pointer',
                borderLeft: `4px solid ${isDelayed ? '#DC2626' : '#16A34A'}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: isDeparting ? '#E0F2FE' : '#DCFCE7',
                      color: isDeparting ? '#0369A1' : '#15803D'
                    }}>
                      {isDeparting ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {train.direction}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
                      #{train.train_no}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#102A43', marginTop: '6px' }}>
                    {train.train_name}
                  </h3>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    background: '#102A43',
                    color: '#F59E0B',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    PLATFORM {train.platform}
                  </span>
                </div>
              </div>

              {/* Timing Grid */}
              <div style={{ 
                marginTop: '12px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                background: '#F8FAFC',
                padding: '10px 12px',
                borderRadius: '8px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Estimated Arrival</div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 800, 
                    color: isDelayed ? '#DC2626' : '#16A34A' 
                  }}>
                    {train.expected_time}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Scheduled</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#334E68' }}>
                    {train.scheduled_time}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Delay Margin</div>
                  <div style={{ 
                    fontSize: '13px', 
                    fontWeight: 700, 
                    color: isDelayed ? '#DC2626' : '#16A34A' 
                  }}>
                    {isDelayed ? `+${train.delay_minutes} mins` : 'On Time'}
                  </div>
                </div>
              </div>

              {/* Explainability Tag */}
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={13} color="#F59E0B" />
                <span>Confidence: <b>{train.confidence_range}</b></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
