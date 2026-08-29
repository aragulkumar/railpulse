const API_BASE_URL = 'http://localhost:8000';
const WS_BASE_URL = 'ws://localhost:8000';

export const api = {
  // ETA Endpoints
  async getStationETA(stationCode: string) {
    const res = await fetch(`${API_BASE_URL}/eta/station/${stationCode}`);
    if (!res.ok) throw new Error(`Station not found: ${res.statusText}`);
    return res.json();
  },

  async getTrainETA(trainNo: string) {
    const res = await fetch(`${API_BASE_URL}/eta/train/${trainNo}`);
    if (!res.ok) throw new Error(`Train not found: ${res.statusText}`);
    return res.json();
  },

  // Booking Endpoints
  async searchTrains(from?: string, to?: string, date?: string, travelClass?: string) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (date) params.append('date', date);
    if (travelClass) params.append('class', travelClass);

    const res = await fetch(`${API_BASE_URL}/booking/search?${params.toString()}`);
    if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);
    return res.json();
  },

  async bookTicket(bookingData: any) {
    const res = await fetch(`${API_BASE_URL}/booking/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    if (!res.ok) throw new Error(`Booking failed: ${res.statusText}`);
    return res.json();
  },

  async getPNRStatus(pnrId: string) {
    const res = await fetch(`${API_BASE_URL}/booking/pnr/${pnrId}`);
    if (!res.ok) throw new Error(`PNR lookup failed: ${res.statusText}`);
    return res.json();
  },

  async getMyTickets() {
    const res = await fetch(`${API_BASE_URL}/booking/my-tickets`);
    if (!res.ok) throw new Error(`Failed to fetch tickets: ${res.statusText}`);
    return res.json();
  },

  // Complaints & SOS Endpoints
  async triggerSOS(sosData: any) {
    const res = await fetch(`${API_BASE_URL}/complaints/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sosData)
    });
    if (!res.ok) throw new Error(`SOS dispatch failed: ${res.statusText}`);
    return res.json();
  },

  async requestCleaning(cleanData: any) {
    const res = await fetch(`${API_BASE_URL}/complaints/cleaning`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanData)
    });
    if (!res.ok) throw new Error(`Cleaning request failed: ${res.statusText}`);
    return res.json();
  },

  async requestSeatSwap(swapData: any) {
    const res = await fetch(`${API_BASE_URL}/complaints/swap/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(swapData)
    });
    if (!res.ok) throw new Error(`Seat swap request failed: ${res.statusText}`);
    return res.json();
  },

  async respondSeatSwap(swapId: number, action: string) {
    const res = await fetch(`${API_BASE_URL}/complaints/swap/${swapId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    if (!res.ok) throw new Error(`Response failed: ${res.statusText}`);
    return res.json();
  },

  async fileGeneralComplaint(compData: any) {
    const res = await fetch(`${API_BASE_URL}/complaints/general`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(compData)
    });
    if (!res.ok) throw new Error(`Complaint failed: ${res.statusText}`);
    return res.json();
  },

  async getMyComplaints() {
    const res = await fetch(`${API_BASE_URL}/complaints/list/my`);
    if (!res.ok) throw new Error(`Failed to load complaints: ${res.statusText}`);
    return res.json();
  },

  // AI Chatbot
  async sendChatMessage(text: string, sessionId?: string, language: string = 'en') {
    const res = await fetch(`${API_BASE_URL}/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, session_id: sessionId, language })
    });
    if (!res.ok) throw new Error(`Chat failed: ${res.statusText}`);
    return res.json();
  },

  // Notifications
  async getNotifications() {
    const res = await fetch(`${API_BASE_URL}/notifications`);
    if (!res.ok) throw new Error(`Notifications failed: ${res.statusText}`);
    return res.json();
  },

  async markNotificationRead(id: number) {
    const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'POST'
    });
    return res.json();
  },

  // Profile
  async getProfile() {
    const res = await fetch(`${API_BASE_URL}/profile`);
    if (!res.ok) throw new Error(`Profile failed: ${res.statusText}`);
    return res.json();
  },

  async updateLanguage(language: string) {
    const res = await fetch(`${API_BASE_URL}/profile/language`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferred_language: language })
    });
    return res.json();
  },

  // WebSocket Live Stream Connection Helper
  createTrainWebSocket(trainNo: string, onMessage: (data: any) => void) {
    const ws = new WebSocket(`${WS_BASE_URL}/ws/eta/${trainNo}`);
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        onMessage(payload);
      } catch (err) {
        console.error('WS Parse Error', err);
      }
    };
    return ws;
  }
};
