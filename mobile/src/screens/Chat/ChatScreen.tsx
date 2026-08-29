import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Train, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  MapPin, 
  Gauge, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  action_type?: string;
  action_data?: any;
  quick_replies?: string[];
}

export const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Namaste! 🙏 I am your **RailPulse AI Assistant**.\nI can help you check live train ETAs, verify PNR status, search train berths, or dispatch on-board emergency/cleaning services.',
      quick_replies: [
        'Live ETA of 12951',
        'Check PNR 8421950341',
        'Search Delhi to Mumbai Trains',
        'Emergency SOS'
      ]
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('session-user-1');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.sendChatMessage(query, sessionId);
      if (res.session_id) setSessionId(res.session_id);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.reply_text,
        action_type: res.action_type,
        action_data: res.action_data,
        quick_replies: res.suggested_quick_replies
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: '⚠️ Unable to connect to railway dispatch network. Please try again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 140px)', 
      padding: '12px 16px',
      position: 'relative'
    }}>
      {/* AI Assistant Banner */}
      <div style={{
        background: '#102A43',
        color: '#FFFFFF',
        padding: '12px 16px',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: '#F59E0B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Bot size={22} color="#0B1D2D" />
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 800 }}>RailPulse Intelligent Rail Assistant</div>
          <div style={{ fontSize: '11px', color: '#94A3B8' }}>Physics+ML Function-Calling • Multilingual Support</div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px',
        paddingRight: '4px'
      }}>
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start'
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  background: isUser ? '#102A43' : '#FFFFFF',
                  color: isUser ? '#FFFFFF' : '#0F172A',
                  fontSize: '13.5px',
                  lineHeight: 1.5,
                  boxShadow: '0 2px 8px rgba(16, 42, 67, 0.06)',
                  border: isUser ? 'none' : '1px solid #E2E8F0',
                  whiteSpace: 'pre-line'
                }}
              >
                {msg.text}

                {/* DYNAMIC CARD: ETA CARD */}
                {msg.action_type === 'eta_card' && msg.action_data && (
                  <div style={{
                    marginTop: '10px',
                    background: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: '10px',
                    padding: '10px',
                    color: '#0F172A'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '13px', color: '#102A43' }}>
                        {msg.action_data.train_name}
                      </span>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        color: msg.action_data.overall_delay_minutes > 5 ? '#DC2626' : '#16A34A' 
                      }}>
                        {msg.action_data.overall_delay_minutes > 5 ? `+${msg.action_data.overall_delay_minutes}m Late` : 'On Time'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '6px', fontSize: '11px', color: '#64748B' }}>
                      <div>Speed: <b>{Math.round(msg.action_data.current_speed_kmh)} km/h</b></div>
                      <div>Confidence: <b>{msg.action_data.confidence_range_str}</b></div>
                    </div>
                  </div>
                )}

                {/* DYNAMIC CARD: PNR CARD */}
                {msg.action_type === 'pnr_card' && msg.action_data && (
                  <div style={{
                    marginTop: '10px',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: '10px',
                    padding: '10px',
                    color: '#065F46'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 800 }}>
                      Coach: {msg.action_data.coach} • Berth {msg.action_data.berth} ({msg.action_data.berth_type})
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '2px' }}>
                      Status: <b>{msg.action_data.status}</b> • {msg.action_data.passenger_name}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Reply Suggestions */}
              {msg.quick_replies && msg.quick_replies.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {msg.quick_replies.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip)}
                      style={{
                        padding: '6px 12px',
                        background: '#FEF3C7',
                        color: '#92400E',
                        border: '1px solid #FDE68A',
                        borderRadius: '16px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '12px' }}>
            <RefreshCw size={16} className="animate-pulse-glow" color="#F59E0B" />
            <span>AI Railway Assistant is reasoning & querying live telemetry...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Message Box */}
      <div style={{
        marginTop: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: '#FFFFFF',
        padding: '6px 10px',
        borderRadius: '16px',
        border: '1px solid #CBD5E1',
        boxShadow: '0 4px 12px rgba(16, 42, 67, 0.05)'
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask train status, PNR, cleaning, food..."
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            color: '#102A43',
            padding: '8px 4px'
          }}
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={loading || !input.trim()}
          className="btn-saffron"
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            opacity: input.trim() ? 1 : 0.6
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};
