import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { 
  Search, 
  Calendar, 
  Train as TrainIcon, 
  ArrowRight, 
  CheckCircle, 
  UserCheck, 
  CreditCard, 
  ShieldCheck,
  Armchair,
  X
} from 'lucide-react';

export const SearchScreen: React.FC = () => {
  const [fromStation, setFromStation] = useState('NDLS');
  const [toStation, setToStation] = useState('MMCT');
  const [journeyDate, setJourneyDate] = useState('2026-09-02');
  const [travelClass, setTravelClass] = useState('3A');
  const [trains, setTrains] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Booking Modal State
  const [selectedTrain, setSelectedTrain] = useState<any>(null);
  const [passengerName, setPassengerName] = useState('Ragul Kumar');
  const [passengerAge, setPassengerAge] = useState(28);
  const [passengerGender, setPassengerGender] = useState('M');
  const [berthPreference, setBerthPreference] = useState('Lower');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [confirmedPNR, setConfirmedPNR] = useState<any>(null);

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    try {
      setSearching(true);
      const results = await api.searchTrains(fromStation, toStation, journeyDate, travelClass);
      setTrains(results);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleBookTicket = async () => {
    if (!selectedTrain) return;
    try {
      setBookingLoading(true);
      const bookingData = {
        train_no: selectedTrain.train_no,
        from_station: fromStation,
        to_station: toStation,
        travel_class: travelClass,
        journey_date: journeyDate,
        passenger_name: passengerName,
        passenger_age: Number(passengerAge),
        passenger_gender: passengerGender,
        berth_preference: berthPreference
      };
      const pnr = await api.bookTicket(bookingData);
      setConfirmedPNR(pnr);
      setSelectedTrain(null);
    } catch (err) {
      console.error(err);
      alert('Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-slide-up">
      {/* Search Header Form */}
      <div className="glass-card" style={{ padding: '18px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#102A43', marginBottom: '14px' }}>
          Book Train Tickets
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>FROM</label>
            <input
              type="text"
              value={fromStation}
              onChange={(e) => setFromStation(e.target.value.toUpperCase())}
              placeholder="e.g. NDLS"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontWeight: 700,
                fontSize: '14px',
                color: '#102A43',
                marginTop: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>TO</label>
            <input
              type="text"
              value={toStation}
              onChange={(e) => setToStation(e.target.value.toUpperCase())}
              placeholder="e.g. MMCT"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontWeight: 700,
                fontSize: '14px',
                color: '#102A43',
                marginTop: '4px'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>JOURNEY DATE</label>
            <input
              type="date"
              value={journeyDate}
              onChange={(e) => setJourneyDate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontWeight: 600,
                fontSize: '13px',
                color: '#102A43',
                marginTop: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>CLASS</label>
            <select
              value={travelClass}
              onChange={(e) => setTravelClass(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontWeight: 700,
                fontSize: '14px',
                color: '#102A43',
                marginTop: '4px',
                background: '#FFFFFF'
              }}
            >
              <option value="1A">1A — AC First Class</option>
              <option value="2A">2A — AC 2 Tier</option>
              <option value="3A">3A — AC 3 Tier</option>
              <option value="CC">CC — AC Chair Car</option>
              <option value="EC">EC — Exec Chair Car</option>
              <option value="SL">SL — Sleeper Class</option>
            </select>
          </div>
        </div>

        <button 
          onClick={handleSearch}
          className="btn-saffron" 
          style={{ width: '100%', padding: '14px' }}
        >
          <Search size={18} />
          {searching ? 'Searching Real-Time Berths...' : 'Search Available Trains'}
        </button>
      </div>

      {/* Confirmed PNR Banner if just booked */}
      {confirmedPNR && (
        <div className="navy-card animate-slide-up" style={{ border: '2px solid #F59E0B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} color="#4ADE80" />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#4ADE80' }}>BOOKING CONFIRMED</span>
            </div>
            <button 
              onClick={() => setConfirmedPNR(null)} 
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ fontSize: '12px', color: '#94A3B8' }}>PNR NUMBER</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#F59E0B', letterSpacing: '1px' }}>
            {confirmedPNR.id}
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
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>PASSENGER</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>{confirmedPNR.passenger_name}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>COACH & BERTH</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#4ADE80' }}>
                {confirmedPNR.coach} - {confirmedPNR.berth} ({confirmedPNR.berth_type})
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>TRAIN</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>{confirmedPNR.train_no} - {confirmedPNR.train_name}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>TOTAL FARE</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>₹{confirmedPNR.fare}</div>
            </div>
          </div>
        </div>
      )}

      {/* Train Search Results List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#102A43' }}>
          Available Trains ({trains.length})
        </h3>

        {trains.map((train) => {
          const fare = train.fares?.[travelClass] || train.fares?.['3A'] || 1250;
          const avail = train.availability?.[travelClass] || 'AVAILABLE-32';

          return (
            <div key={train.train_no} className="glass-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    background: '#FEF3C7',
                    color: '#92400E'
                  }}>
                    {train.train_type}
                  </span>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#102A43', marginTop: '6px' }}>
                    {train.train_name} (#{train.train_no})
                  </h4>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#102A43' }}>
                    ₹{fare}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>per passenger</div>
                </div>
              </div>

              {/* Timing Grid */}
              <div style={{ 
                marginTop: '12px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '10px 0',
                borderTop: '1px solid #F1F5F9',
                borderBottom: '1px solid #F1F5F9'
              }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#102A43' }}>{train.departure_time}</div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>{train.from_station_code}</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>{train.duration}</div>
                  <div style={{ height: '2px', width: '60px', background: '#CBD5E1', margin: '4px auto' }} />
                  <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: 600 }}>Direct</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#102A43' }}>{train.arrival_time}</div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>{train.to_station_code}</div>
                </div>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: 700, 
                  color: '#15803D',
                  background: '#DCFCE7',
                  padding: '4px 10px',
                  borderRadius: '6px'
                }}>
                  {avail}
                </span>

                <button
                  onClick={() => setSelectedTrain(train)}
                  className="btn-saffron"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Select & Book
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Checkout Modal */}
      {selectedTrain && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(16, 42, 67, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '16px',
          zIndex: 1000
        }}>
          <div className="glass-card animate-slide-up" style={{ 
            width: '100%', 
            maxWidth: '460px', 
            padding: '24px', 
            background: '#FFFFFF',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#102A43' }}>
                  Passenger & Berth Selection
                </h3>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  {selectedTrain.train_name} • {travelClass} Class
                </div>
              </div>
              <button onClick={() => setSelectedTrain(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748B" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334E68' }}>Passenger Full Name</label>
                <input
                  type="text"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    fontWeight: 600,
                    marginTop: '4px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334E68' }}>Age</label>
                  <input
                    type="number"
                    value={passengerAge}
                    onChange={(e) => setPassengerAge(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '14px',
                      fontWeight: 600,
                      marginTop: '4px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334E68' }}>Gender</label>
                  <select
                    value={passengerGender}
                    onChange={(e) => setPassengerGender(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '14px',
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
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334E68' }}>Berth Preference</label>
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
            </div>

            {/* Fare Summary & Instant Pay */}
            <div style={{
              background: '#F1F5F9',
              padding: '14px',
              borderRadius: '10px',
              marginBottom: '18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Total Payable</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#102A43' }}>
                  ₹{selectedTrain.fares?.[travelClass] || 1250}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16A34A', fontSize: '12px', fontWeight: 700 }}>
                <ShieldCheck size={16} /> Instant PNR
              </div>
            </div>

            <button
              onClick={handleBookTicket}
              disabled={bookingLoading}
              className="btn-saffron"
              style={{ width: '100%', padding: '14px', fontSize: '15px' }}
            >
              <CreditCard size={18} />
              {bookingLoading ? 'Securing Berth & Issuing PNR...' : 'Pay & Confirm Ticket'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
