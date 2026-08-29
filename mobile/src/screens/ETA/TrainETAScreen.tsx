import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { 
  Train as TrainIcon, 
  MapPin, 
  Clock, 
  Gauge, 
  Activity, 
  Wifi, 
  Info, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

interface TrainETAScreenProps {
  initialTrainNo?: string;
  onSelectStation?: (stationCode: string) => void;
}

export const TrainETAScreen: React.FC<TrainETAScreenProps> = ({ 
  initialTrainNo = '12951',
  onSelectStation 
}) => {
  const [trainNo, setTrainNo] = useState(initialTrainNo);
  const [etaData, setEtaData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastTick, setLastTick] = useState<string>('');

  const trainsList = [
    { no: '12951', name: 'Mumbai Rajdhani Express (MMCT → NDLS)' },
    { no: '22436', name: 'Vande Bharat Express (NDLS → BSB)' },
    { no: '12002', name: 'Bhopal Shatabdi (NDLS → RKMP)' },
    { no: '12626', name: 'Kerala Express (NDLS → TVC)' },
  ];

  useEffect(() => {
    fetchTrainData(trainNo);

    // Setup WebSocket connection
    const ws = api.createTrainWebSocket(trainNo, (payload) => {
      setWsConnected(true);
      if (payload.type === 'INIT_ETA' || payload.type === 'UPDATE_ETA' || payload.type === 'TICK_ETA') {
        setEtaData(payload.data);
        setLastTick(new Date().toLocaleTimeString());
      }
    });

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);

    return () => {
      ws.close();
    };
  }, [trainNo]);

  const fetchTrainData = async (tNo: string) => {
    try {
      setLoading(true);
      const data = await api.getTrainETA(tNo);
      setEtaData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isDelayed = etaData?.overall_delay_minutes > 5;

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-slide-up">
      {/* Train Selector Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {trainsList.map((t) => (
          <button
            key={t.no}
            onClick={() => setTrainNo(t.no)}
            style={{
              padding: '8px 14px',
              borderRadius: '20px',
              border: trainNo === t.no ? '2px solid #F59E0B' : '1px solid #E2E8F0',
              background: trainNo === t.no ? '#102A43' : '#FFFFFF',
              color: trainNo === t.no ? '#FFFFFF' : '#334E68',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <TrainIcon size={14} color={trainNo === t.no ? '#F59E0B' : '#64748B'} />
            {t.no}
          </button>
        ))}
      </div>

      {loading && !etaData ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
          <RefreshCw size={28} className="animate-pulse-glow" color="#F59E0B" />
          <p style={{ marginTop: '12px', fontWeight: 600 }}>Calculating Kinematic ETA & Delay Models...</p>
        </div>
      ) : etaData ? (
        <>
          {/* Main Hero Card */}
          <div className="navy-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span style={{ 
                  background: 'rgba(245, 158, 11, 0.2)', 
                  color: '#F59E0B', 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  padding: '3px 8px', 
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {etaData.train_type}
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginTop: '6px' }}>
                  {etaData.train_name}
                </h2>
                <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '2px' }}>
                  #{etaData.train_no} • {etaData.source_station_code} → {etaData.dest_station_code}
                </div>
              </div>

              {/* WebSocket Status Indicator */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                background: 'rgba(255,255,255,0.1)', 
                padding: '6px 10px', 
                borderRadius: '20px' 
              }}>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: wsConnected ? '#22C55E' : '#EF4444' 
                }} className={wsConnected ? 'radar-ping' : ''} />
                <span style={{ fontSize: '11px', color: '#E2E8F0', fontWeight: 600 }}>
                  {wsConnected ? 'LIVE RTIS' : 'SYNCING'}
                </span>
              </div>
            </div>

            {/* Delay & Speed Telemetry Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '10px', 
              background: 'rgba(0, 0, 0, 0.25)', 
              padding: '12px', 
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> STATUS
                </div>
                <div style={{ 
                  fontSize: '15px', 
                  fontWeight: 700, 
                  color: isDelayed ? '#F87171' : '#4ADE80',
                  marginTop: '4px'
                }}>
                  {isDelayed ? `+${etaData.overall_delay_minutes}m Late` : 'On Time'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Gauge size={12} /> SPEED
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginTop: '4px' }}>
                  {Math.round(etaData.current_speed_kmh)} km/h
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Activity size={12} /> CONFIDENCE
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#FCD34D', marginTop: '4px' }}>
                  {etaData.confidence_range_str}
                </div>
              </div>
            </div>

            {/* Current Section / Location description */}
            <div style={{ 
              marginTop: '14px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '13px',
              color: '#E2E8F0'
            }}>
              <MapPin size={16} color="#F59E0B" />
              <span>{etaData.current_station_or_section}</span>
            </div>
          </div>

          {/* Explainability Engine Card (Key Innovation) */}
          <div className="glass-card" style={{ padding: '14px 16px', borderLeft: '4px solid #F59E0B' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <TrendingUp size={16} color="#D97706" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#92400E', textTransform: 'uppercase' }}>
                Physics + XGBoost Delay Explainability
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#334E68', lineHeight: 1.5 }}>
              {etaData.explainability_text}
            </p>
          </div>

          {/* Intermediate Stops Sequence Timeline */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#102A43' }}>
                Route Timeline & Station ETAs
              </h3>
              <span style={{ fontSize: '12px', color: '#64748B' }}>
                {etaData.stops?.length} Stops
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
              {etaData.stops?.map((stop: any, idx: number) => {
                const isCurrent = stop.status === 'CURRENT';
                const isPassed = stop.status === 'PASSED';
                const isStopDelayed = stop.delay_minutes > 5;

                return (
                  <div key={idx} style={{ display: 'flex', gap: '14px', position: 'relative' }}>
                    {/* Vertical Connecting Line */}
                    {idx < etaData.stops.length - 1 && (
                      <div style={{
                        position: 'absolute',
                        left: '11px',
                        top: '22px',
                        bottom: '-12px',
                        width: '2px',
                        backgroundColor: isPassed ? '#16A34A' : '#CBD5E1',
                        zIndex: 0
                      }} />
                    )}

                    {/* Timeline Node Icon */}
                    <div style={{ zIndex: 1, paddingTop: '4px' }}>
                      {isPassed ? (
                        <CheckCircle2 size={22} color="#16A34A" />
                      ) : isCurrent ? (
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: '#F59E0B',
                          border: '3px solid #FEF3C7',
                          boxShadow: '0 0 0 2px #F59E0B'
                        }} className="radar-ping" />
                      ) : (
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: '#FFFFFF',
                          border: '2px solid #94A3B8'
                        }} />
                      )}
                    </div>

                    {/* Station & Timing Details */}
                    <div style={{ 
                      flex: 1, 
                      paddingBottom: '20px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start' 
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            fontWeight: isCurrent ? 800 : 700, 
                            fontSize: '14px', 
                            color: isCurrent ? '#F59E0B' : isPassed ? '#64748B' : '#0F172A' 
                          }}>
                            {stop.station_name} ({stop.station_code})
                          </span>
                          <span style={{ 
                            fontSize: '11px', 
                            background: '#F1F5F9', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            color: '#475569',
                            fontWeight: 600
                          }}>
                            PF {stop.platform || '1'}
                          </span>
                        </div>

                        {stop.recovered_minutes > 0 && (
                          <div style={{ fontSize: '11px', color: '#16A34A', marginTop: '2px', fontWeight: 600 }}>
                            ⚡ Slack Recovery: -{stop.recovered_minutes}m buffer
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: 700, 
                          color: isStopDelayed ? '#DC2626' : '#16A34A' 
                        }}>
                          {stop.estimated_eta || stop.scheduled_arrival}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94A3B8', textDecoration: isStopDelayed ? 'line-through' : 'none' }}>
                          Sched: {stop.scheduled_arrival}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
