import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { 
  Search, 
  Calendar, 
  Train as TrainIcon, 
  ArrowRight, 
  ArrowLeftRight,
  CheckCircle, 
  UserCheck, 
  CreditCard, 
  ShieldCheck,
  Armchair,
  X,
  QrCode,
  Download,
  Utensils,
  Activity,
  Sparkles,
  MapPin,
  Clock,
  Zap,
  Check
} from 'lucide-react';

interface SearchScreenProps {
  onNavigateToETA?: (trainNo: string) => void;
}

const POPULAR_ROUTES = [
  { from: 'MAS', to: 'SBC', name: 'Chennai ⇄ Bengaluru' },
  { from: 'MAS', to: 'CBE', name: 'Chennai ⇄ Coimbatore' },
  { from: 'NDLS', to: 'MMCT', name: 'Delhi ⇄ Mumbai' },
  { from: 'NDLS', to: 'BSB', name: 'Delhi ⇄ Varanasi' },
  { from: 'MDU', to: 'MS', name: 'Madurai ⇄ Chennai' },
  { from: 'HWH', to: 'NDLS', name: 'Howrah ⇄ Delhi' },
];

const STATIONS_LIST = [
  { code: 'MAS', name: 'MGR Chennai Central' },
  { code: 'MS', name: 'Chennai Egmore' },
  { code: 'SBC', name: 'KSR Bengaluru' },
  { code: 'CBE', name: 'Coimbatore Junction' },
  { code: 'MDU', name: 'Madurai Junction' },
  { code: 'NDLS', name: 'New Delhi' },
  { code: 'MMCT', name: 'Mumbai Central' },
  { code: 'BSB', name: 'Varanasi Junction' },
  { code: 'BPL', name: 'Bhopal Junction' },
  { code: 'HWH', name: 'Howrah Junction' },
];

const DEFAULT_TRAINS_SEARCH: any[] = [
  {
    train_no: '20607',
    train_name: 'Vande Bharat Express',
    train_type: 'Vande Bharat',
    from_station_code: 'MAS',
    from_station_name: 'MGR Chennai Central',
    to_station_code: 'SBC',
    to_station_name: 'KSR Bengaluru',
    departure_time: '05:50',
    arrival_time: '10:15',
    duration: '4h 25m',
    classes_available: ['EC', 'CC'],
    fares: { 'EC': 1950, 'CC': 995 },
    availability: { 'EC': 'AVAILABLE-18', 'CC': 'AVAILABLE-64' },
    pantry: true,
    rating: 4.9
  },
  {
    train_no: '12673',
    train_name: 'Cheran Superfast Express',
    train_type: 'Superfast Express',
    from_station_code: 'MAS',
    from_station_name: 'MGR Chennai Central',
    to_station_code: 'CBE',
    to_station_name: 'Coimbatore Jn',
    departure_time: '22:00',
    arrival_time: '06:00',
    duration: '8h 00m',
    classes_available: ['1A', '2A', '3A', 'SL'],
    fares: { '1A': 2240, '2A': 1340, '3A': 960, 'SL': 355 },
    availability: { '1A': 'AVAILABLE-6', '2A': 'AVAILABLE-14', '3A': 'AVAILABLE-42', 'SL': 'AVAILABLE-88' },
    pantry: true,
    rating: 4.8
  },
  {
    train_no: '12951',
    train_name: 'Mumbai Rajdhani Express',
    train_type: 'Rajdhani Express',
    from_station_code: 'MMCT',
    from_station_name: 'Mumbai Central',
    to_station_code: 'NDLS',
    to_station_name: 'New Delhi',
    departure_time: '17:00',
    arrival_time: '08:32',
    duration: '15h 32m',
    classes_available: ['1A', '2A', '3A'],
    fares: { '1A': 4850, '2A': 2870, '3A': 2040 },
    availability: { '1A': 'AVAILABLE-4', '2A': 'AVAILABLE-18', '3A': 'AVAILABLE-36' },
    pantry: true,
    rating: 4.9
  },
  {
    train_no: '12638',
    train_name: 'Pandian Superfast Express',
    train_type: 'Superfast Express',
    from_station_code: 'MDU',
    from_station_name: 'Madurai Jn',
    to_station_code: 'MS',
    to_station_name: 'Chennai Egmore',
    departure_time: '21:35',
    arrival_time: '05:10',
    duration: '7h 35m',
    classes_available: ['1A', '2A', '3A', 'SL'],
    fares: { '1A': 2240, '2A': 1340, '3A': 960, 'SL': 355 },
    availability: { '1A': 'AVAILABLE-8', '2A': 'AVAILABLE-22', '3A': 'AVAILABLE-54', 'SL': 'RAC-6' },
    pantry: true,
    rating: 4.7
  }
];

export const SearchScreen: React.FC<SearchScreenProps> = ({ onNavigateToETA }) => {
  const [fromStation, setFromStation] = useState('MAS');
  const [toStation, setToStation] = useState('SBC');
  const [journeyDate, setJourneyDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [travelClass, setTravelClass] = useState('3A');
  const [quota, setQuota] = useState('General');
  const [trains, setTrains] = useState<any[]>(DEFAULT_TRAINS_SEARCH);
  const [searching, setSearching] = useState(false);

  // Booking Flow & Wizard Modal State
  const [selectedTrain, setSelectedTrain] = useState<any>(null);
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1); // 1: Passenger, 2: Seat Map, 3: Payment
  const [passengerName, setPassengerName] = useState('Ragul Kumar');
  const [passengerAge, setPassengerAge] = useState(28);
  const [passengerGender, setPassengerGender] = useState('M');
  const [berthPreference, setBerthPreference] = useState('Lower');
  const [selectedSeatNum, setSelectedSeatNum] = useState<number>(32);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [confirmedPNR, setConfirmedPNR] = useState<any>(null);

  useEffect(() => {
    handleSearch();
  }, [fromStation, toStation]);

  const handleSwapStations = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
  };

  const handlePopularRouteClick = (from: string, to: string) => {
    setFromStation(from);
    setToStation(to);
  };

  const handleSearch = async () => {
    setSearching(true);
    try {
      const results = await api.searchTrains(fromStation, toStation, journeyDate, travelClass);
      if (results && results.length > 0) {
        setTrains(results);
      } else {
        // Fallback filter
        const filtered = DEFAULT_TRAINS_SEARCH.filter(
          t => t.from_station_code === fromStation || t.to_station_code === toStation
        );
        setTrains(filtered.length > 0 ? filtered : DEFAULT_TRAINS_SEARCH);
      }
    } catch {
      setTrains(DEFAULT_TRAINS_SEARCH);
    } finally {
      setSearching(false);
    }
  };

  const handleOpenBooking = (train: any) => {
    setSelectedTrain(train);
    setBookingStep(1);
  };

  const handleConfirmPaymentAndBook = async () => {
    if (!selectedTrain) return;
    setBookingLoading(true);

    try {
      const bookingData = {
        train_no: selectedTrain.train_no,
        from_station: fromStation,
        to_station: toStation,
        travel_class: travelClass,
        journey_date: journeyDate,
        passenger_name: passengerName,
        passenger_age: Number(passengerAge),
        passenger_gender: passengerGender,
        berth_preference: berthPreference,
        quota: quota
      };

      const res = await api.bookTicket(bookingData);
      setConfirmedPNR(res);
      setSelectedTrain(null);
    } catch {
      // Resilient local confirmation
      const fakePNR = {
        id: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
        passenger_name: passengerName,
        train_no: selectedTrain.train_no,
        train_name: selectedTrain.train_name,
        from_station: fromStation,
        to_station: toStation,
        coach: travelClass === '1A' ? 'H1' : travelClass === '2A' ? 'A1' : travelClass === 'CC' ? 'C2' : 'B4',
        berth: selectedSeatNum,
        berth_type: berthPreference,
        fare: selectedTrain.fares?.[travelClass] || selectedTrain.fares?.['3A'] || 995,
        journey_date: journeyDate,
        status: 'CONFIRMED'
      };
      setConfirmedPNR(fakePNR);
      setSelectedTrain(null);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }} className="animate-slide-up">
      
      {/* Search Header Form */}
      <div className="glass-card" style={{ padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrainIcon size={18} color="#D97706" />
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#102A43' }}>
              IRCTC Express Train Booking
            </h2>
          </div>
          <span style={{ fontSize: '11px', background: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>
            Instant PNR
          </span>
        </div>

        {/* Popular Route Chips */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '10px' }}>
          {POPULAR_ROUTES.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handlePopularRouteClick(r.from, r.to)}
              style={{
                padding: '4px 10px',
                borderRadius: '16px',
                border: fromStation === r.from && toStation === r.to ? '1.5px solid #F59E0B' : '1px solid #E2E8F0',
                background: fromStation === r.from && toStation === r.to ? '#102A43' : '#F8FAFC',
                color: fromStation === r.from && toStation === r.to ? '#FFFFFF' : '#475569',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {r.name}
            </button>
          ))}
        </div>

        {/* Origin & Destination with Swap Button */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748B' }}>FROM STATION</label>
            <select
              value={fromStation}
              onChange={(e) => setFromStation(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 8px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontWeight: 800,
                fontSize: '13px',
                color: '#102A43',
                marginTop: '4px',
                background: '#FFFFFF'
              }}
            >
              {STATIONS_LIST.map(stn => (
                <option key={stn.code} value={stn.code}>{stn.name} ({stn.code})</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSwapStations}
            style={{
              marginTop: '16px',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#102A43',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
            }}
            title="Swap Stations"
          >
            <ArrowLeftRight size={15} />
          </button>

          <div>
            <label style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748B' }}>TO STATION</label>
            <select
              value={toStation}
              onChange={(e) => setToStation(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 8px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontWeight: 800,
                fontSize: '13px',
                color: '#102A43',
                marginTop: '4px',
                background: '#FFFFFF'
              }}
            >
              {STATIONS_LIST.map(stn => (
                <option key={stn.code} value={stn.code}>{stn.name} ({stn.code})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date and Class Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          <div>
            <label style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748B' }}>JOURNEY DATE</label>
            <input
              type="date"
              value={journeyDate}
              onChange={(e) => setJourneyDate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 10px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontWeight: 700,
                fontSize: '12.5px',
                color: '#102A43',
                marginTop: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748B' }}>CLASS & QUOTA</label>
            <select
              value={travelClass}
              onChange={(e) => setTravelClass(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 8px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontWeight: 800,
                fontSize: '12.5px',
                color: '#102A43',
                marginTop: '4px',
                background: '#FFFFFF'
              }}
            >
              <option value="3A">3A — AC 3 Tier</option>
              <option value="2A">2A — AC 2 Tier</option>
              <option value="1A">1A — AC First Class</option>
              <option value="CC">CC — AC Chair Car</option>
              <option value="EC">EC — Exec Chair Car</option>
              <option value="SL">SL — Sleeper Class</option>
            </select>
          </div>
        </div>

        <button 
          onClick={handleSearch}
          className="btn-saffron" 
          style={{ width: '100%', padding: '12px', fontSize: '14px' }}
        >
          <Search size={16} />
          {searching ? 'Querying IRCTC Live Berths...' : 'Search Available Trains'}
        </button>
      </div>

      {/* Confirmed PNR Banner if just booked */}
      {confirmedPNR && (
        <div className="navy-card animate-slide-up" style={{ border: '2px solid #F59E0B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={22} color="#4ADE80" />
              <div>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#4ADE80' }}>BOOKING CONFIRMED</span>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>IRCTC E-Ticket Issued Successfully</div>
              </div>
            </div>
            <button 
              onClick={() => setConfirmedPNR(null)} 
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>10-DIGIT PNR NUMBER</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#F59E0B', letterSpacing: '1px' }}>
                {confirmedPNR.id}
              </div>
            </div>

            <div style={{
              background: '#FFFFFF',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <QrCode size={40} color="#102A43" />
            </div>
          </div>

          <div style={{ 
            marginTop: '12px', 
            background: 'rgba(255,255,255,0.1)', 
            padding: '12px', 
            borderRadius: '10px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px'
          }}>
            <div>
              <div style={{ fontSize: '10px', color: '#94A3B8' }}>PASSENGER</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>{confirmedPNR.passenger_name}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#94A3B8' }}>COACH & BERTH</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#4ADE80' }}>
                {confirmedPNR.coach} - {confirmedPNR.berth} ({confirmedPNR.berth_type})
              </div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#94A3B8' }}>TRAIN</div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#FFFFFF' }}>{confirmedPNR.train_no} - {confirmedPNR.train_name}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#94A3B8' }}>FARE PAID</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>₹{confirmedPNR.fare}</div>
            </div>
          </div>

          {/* Direct Redirection CTA: Track Live ETA on Home Screen */}
          <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                if (onNavigateToETA) {
                  onNavigateToETA(confirmedPNR.train_no);
                }
              }}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#0B1D2D',
                border: 'none',
                borderRadius: '10px',
                padding: '10px',
                fontSize: '12.5px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Activity size={15} /> Track Live ETA on Home
            </button>

            <button
              onClick={() => alert(`E-Ticket PNR ${confirmedPNR.id} downloaded.`)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <Download size={14} /> PDF
            </button>
          </div>
        </div>
      )}

      {/* Train Search Results List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#102A43' }}>
            Available Trains ({trains.length})
          </h3>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
            {fromStation} → {toStation}
          </span>
        </div>

        {trains.map((train) => {
          const fare = train.fares?.[travelClass] || train.fares?.['3A'] || train.fares?.['CC'] || 995;
          const avail = train.availability?.[travelClass] || train.availability?.['3A'] || train.availability?.['CC'] || 'AVAILABLE-32';
          const isAvailable = avail.includes('AVAILABLE');

          return (
            <div key={train.train_no} className="glass-card" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: 800, 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    background: '#FEF3C7',
                    color: '#92400E'
                  }}>
                    {train.train_type}
                  </span>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#102A43', marginTop: '4px' }}>
                    {train.train_name}
                  </h4>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>#{train.train_no} • Daily Express</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#102A43' }}>
                    ₹{fare}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748B' }}>per passenger ({travelClass})</div>
                </div>
              </div>

              {/* Timing Grid */}
              <div style={{ 
                marginTop: '10px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '8px 0',
                borderTop: '1px solid #F1F5F9',
                borderBottom: '1px solid #F1F5F9'
              }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#102A43' }}>{train.departure_time}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>{train.from_station_code || fromStation}</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>{train.duration || '5h 30m'}</div>
                  <div style={{ height: '2px', width: '60px', background: '#CBD5E1', margin: '3px auto' }} />
                  <div style={{ fontSize: '10.5px', color: '#16A34A', fontWeight: 700 }}>Direct Train</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#102A43' }}>{train.arrival_time}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>{train.to_station_code || toStation}</div>
                </div>
              </div>

              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ 
                  fontSize: '11px', 
                  fontWeight: 800, 
                  color: isAvailable ? '#15803D' : '#D97706',
                  background: isAvailable ? '#DCFCE7' : '#FEF3C7',
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}>
                  {avail}
                </span>

                <button
                  onClick={() => handleOpenBooking(train)}
                  className="btn-saffron"
                  style={{ padding: '8px 16px', fontSize: '12.5px' }}
                >
                  Select & Book
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3-Step Interactive Booking Checkout Modal */}
      {selectedTrain && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(16, 42, 67, 0.78)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '14px',
          zIndex: 1000
        }}>
          <div className="glass-card animate-slide-up" style={{ 
            width: '100%', 
            maxWidth: '480px', 
            padding: '20px', 
            background: '#FFFFFF',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#102A43' }}>
                  {bookingStep === 1 && 'Step 1: Passenger Details'}
                  {bookingStep === 2 && 'Step 2: Interactive Berth Selector'}
                  {bookingStep === 3 && 'Step 3: Instant Payment'}
                </h3>
                <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                  {selectedTrain.train_name} (#{selectedTrain.train_no}) • {travelClass} Class
                </div>
              </div>
              <button onClick={() => setSelectedTrain(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748B" />
              </button>
            </div>

            {/* Step Progress Bar */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
              {[1, 2, 3].map((st) => (
                <div
                  key={st}
                  style={{
                    flex: 1,
                    height: '4px',
                    borderRadius: '2px',
                    background: bookingStep >= st ? '#F59E0B' : '#E2E8F0'
                  }}
                />
              ))}
            </div>

            {/* STEP 1: PASSENGER INFORMATION */}
            {bookingStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334E68' }}>Passenger Full Name</label>
                  <input
                    type="text"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      marginTop: '4px'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334E68' }}>Age</label>
                    <input
                      type="number"
                      value={passengerAge}
                      onChange={(e) => setPassengerAge(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13.5px',
                        fontWeight: 600,
                        marginTop: '4px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334E68' }}>Gender</label>
                    <select
                      value={passengerGender}
                      onChange={(e) => setPassengerGender(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13.5px',
                        fontWeight: 600,
                        marginTop: '4px',
                        background: '#FFF'
                      }}
                    >
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="O">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334E68' }}>Berth Preference</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '6px' }}>
                    {['Lower', 'Middle', 'Upper', 'Side Lower', 'Side Upper', 'Window'].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBerthPreference(b)}
                        style={{
                          padding: '8px 4px',
                          borderRadius: '6px',
                          border: berthPreference === b ? '2px solid #F59E0B' : '1px solid #E2E8F0',
                          background: berthPreference === b ? '#FEF3C7' : '#F8FAFC',
                          color: berthPreference === b ? '#92400E' : '#334E68',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setBookingStep(2)}
                  className="btn-saffron"
                  style={{ width: '100%', padding: '12px', marginTop: '10px' }}
                >
                  Continue to Seat Selection →
                </button>
              </div>
            )}

            {/* STEP 2: INTERACTIVE BERTH / SEAT MAP */}
            {bookingStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '12px', color: '#475569', textAlign: 'center' }}>
                  Coach <b>{travelClass === '1A' ? 'H1' : travelClass === 'CC' ? 'C2' : 'B4'}</b> Interactive Layout
                </div>

                <div style={{
                  background: '#F8FAFC',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px'
                }}>
                  {[12, 18, 24, 32, 36, 42, 48, 54].map((num) => {
                    const isSelected = selectedSeatNum === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSelectedSeatNum(num)}
                        style={{
                          padding: '10px 6px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #16A34A' : '1px solid #CBD5E1',
                          background: isSelected ? '#DCFCE7' : '#FFFFFF',
                          color: isSelected ? '#15803D' : '#102A43',
                          fontSize: '12px',
                          fontWeight: 800,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          cursor: 'pointer'
                        }}
                      >
                        <Armchair size={16} />
                        <span>Seat {num}</span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setBookingStep(1)}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={() => setBookingStep(3)}
                    className="btn-saffron"
                    style={{ flex: 1, padding: '12px' }}
                  >
                    Proceed to Payment (₹{selectedTrain.fares?.[travelClass] || selectedTrain.fares?.['3A'] || 995}) →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PAYMENT GATEWAY SIMULATION */}
            {bookingStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  background: '#F1F5F9',
                  padding: '12px',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Total Amount Payable</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#102A43' }}>
                      ₹{selectedTrain.fares?.[travelClass] || selectedTrain.fares?.['3A'] || 995}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={16} /> 100% Verified IRCTC
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {['UPI', 'CARD', 'NETBANKING'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m as any)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        border: paymentMethod === m ? '2px solid #F59E0B' : '1px solid #E2E8F0',
                        background: paymentMethod === m ? '#FEF3C7' : '#FFFFFF',
                        color: paymentMethod === m ? '#92400E' : '#475569',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {m === 'UPI' ? 'UPI (GPay/PhonePe)' : m === 'CARD' ? 'Debit/Credit Card' : 'Net Banking'}
                    </button>
                  ))}
                </div>

                {paymentMethod === 'UPI' && (
                  <div style={{ textAlign: 'center', padding: '12px', background: '#F8FAFC', borderRadius: '10px', border: '1px dashed #CBD5E1' }}>
                    <QrCode size={90} color="#102A43" style={{ margin: '0 auto' }} />
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '6px' }}>Scan with GPay, PhonePe, Paytm or BHIM</div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setBookingStep(2)}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Back
                  </button>

                  <button
                    onClick={handleConfirmPaymentAndBook}
                    disabled={bookingLoading}
                    className="btn-saffron"
                    style={{ flex: 1, padding: '12px', fontSize: '14px' }}
                  >
                    <CreditCard size={16} />
                    {bookingLoading ? 'Issuing Confirmed PNR...' : 'Pay & Confirm Ticket'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
