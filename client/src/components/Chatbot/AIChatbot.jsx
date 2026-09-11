import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  Send,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  Trash2,
  Bot,
  User,
  Package,
  AlertTriangle,
  TrendingUp,
  MapPin,
  ExternalLink,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import './AIChatbot.css';

const DEFAULT_SUGGESTIONS = [
  { text: '🔴 Low stock alerts', query: 'Show low stock products' },
  { text: '📊 Total inventory value', query: 'What is our total inventory valuation and summary?' },
  { text: '💰 Today\'s sales report', query: 'Show sales summary for today' },
  { text: '📦 Active purchase orders', query: 'Show active purchase orders' },
  { text: '🏢 Supplier contacts', query: 'List all suppliers with contact info' },
];

export default function AIChatbot() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: '👋 **Hello! I am your Ashirwad AI Assistant.**\n\nAsk me anything about stock quantities, product locations, sales, low stock alerts, or suppliers in **English**, **Hindi**, or **Hinglish**.\n\n*Try tapping one of the quick suggestions below or speaking into the mic!*',
      cards: [],
      suggestions: DEFAULT_SUGGESTIONS.map((s) => s.query),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [quickStats, setQuickStats] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Fetch quick stats on mount
  useEffect(() => {
    fetchQuickStats();
    setupSpeechRecognition();
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  const fetchQuickStats = async () => {
    try {
      const res = await api.get('/chat/quick-stats');
      if (res.data?.success) {
        setQuickStats(res.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch quick stats:', err);
    }
  };

  const setupSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN'; // Indian English / Hindi mix

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputQuery(transcript);
          sendMessage(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your query.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Speech recognition error:', err);
        setIsListening(false);
      }
    }
  };

  const sendMessage = async (overrideText) => {
    const textToSend = (overrideText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    try {
      // Build conversation history payload
      const historyPayload = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-4)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));

      const res = await api.post('/chat/message', {
        message: textToSend,
        history: historyPayload,
      });

      if (res.data?.success) {
        const botData = res.data.data;
        const botMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: botData.reply,
          cards: botData.cards || [],
          suggestions: botData.suggestions || [],
          toolUsed: botData.toolUsed,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error(res.data?.error || 'Failed to process request');
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'bot',
          text: '⚠️ **Oops!** I encountered an issue retrieving that information. Please verify your connection or try another keyword.',
          cards: [],
          suggestions: DEFAULT_SUGGESTIONS.map((s) => s.query),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: '🧹 **Chat cleared.** How can I assist you with your inventory today?',
        cards: [],
        suggestions: DEFAULT_SUGGESTIONS.map((s) => s.query),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Helper to render markdown-like formatting (bold, bullet points, headers)
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');

    return lines.map((line, idx) => {
      // Bold items
      let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Inline code / SKU
      formatted = formatted.replace(/`([^`]+)`/g, '<span class="chat-code">$1</span>');

      if (line.startsWith('• ') || line.startsWith('   • ')) {
        return (
          <div key={idx} className="chat-bullet-line" dangerouslySetInnerHTML={{ __html: formatted }} />
        );
      }
      if (line.startsWith('#')) {
        return <h4 key={idx} className="chat-header-line" dangerouslySetInnerHTML={{ __html: formatted.replace(/#/g, '') }} />;
      }
      if (line.trim() === '') {
        return <div key={idx} className="chat-spacer" />;
      }
      return <p key={idx} className="chat-text-line" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <div className="ai-chatbot-root">
      {/* Floating Trigger Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            className="ai-chatbot-launcher"
            onClick={() => setIsOpen(true)}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Ask Ashirwad AI"
          >
            <div className="launcher-glow" />
            <div className="launcher-icon-box">
              <Sparkles className="launcher-sparkle" size={22} />
            </div>
            <div className="launcher-text-wrapper">
              <span className="launcher-title">Ashirwad AI</span>
              <span className="launcher-subtitle">Ask Inventory</span>
            </div>
            <span className="launcher-pulse-dot" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window / Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`ai-chat-window ${isExpanded ? 'is-expanded' : ''}`}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="ai-chat-header">
              <div className="header-left">
                <div className="bot-avatar">
                  <Bot size={20} />
                  <span className="status-indicator-dot" />
                </div>
                <div className="bot-title-group">
                  <div className="title-row">
                    <h3>Ashirwad AI Assistant</h3>
                    <span className="badge-live">Live Inventory</span>
                  </div>
                  <p className="bot-status-text">Instant Stock, Valuation & Sales Assistant</p>
                </div>
              </div>

              <div className="header-actions">
                <button
                  className="header-btn"
                  onClick={clearChat}
                  title="Clear conversation"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  className="header-btn"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Restore size' : 'Maximize window'}
                >
                  {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  className="header-btn close-btn"
                  onClick={() => setIsOpen(false)}
                  title="Close chat"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Quick Stat Pill Bar */}
            {quickStats && (
              <div className="ai-quick-stats-bar">
                <div
                  className="stat-pill low-stock"
                  onClick={() => sendMessage('Show low stock products')}
                  title="Click to view low stock"
                >
                  <AlertTriangle size={13} />
                  <span>
                    Low Stock: <strong>{quickStats.lowStockCount || 0}</strong>
                  </span>
                </div>
                <div
                  className="stat-pill valuation"
                  onClick={() => sendMessage('Total inventory value')}
                  title="Click for valuation"
                >
                  <Package size={13} />
                  <span>
                    Items: <strong>{quickStats.totalProducts || 0}</strong>
                  </span>
                </div>
                <div
                  className="stat-pill sales"
                  onClick={() => sendMessage('Show sales summary for today')}
                  title="Click for today's sales"
                >
                  <TrendingUp size={13} />
                  <span>
                    Sales: <strong>₹{(quickStats.todaySales || 0).toLocaleString('en-IN')}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Messages Feed */}
            <div className="ai-chat-messages">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-message-row ${msg.sender === 'user' ? 'msg-user' : 'msg-bot'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="msg-avatar bot">
                      <Bot size={16} />
                    </div>
                  )}

                  <div className="msg-content-wrapper">
                    <div className="msg-bubble">
                      {renderFormattedText(msg.text)}

                      {/* Render Structured Product Cards if present */}
                      {msg.cards && msg.cards.length > 0 && (
                        <div className="chat-cards-grid">
                          {msg.cards.map((card) => (
                            <div key={card.id} className={`chat-product-card status-${card.status}`}>
                              <div className="card-top">
                                <div className="card-info">
                                  <span className="card-cat">{card.category}</span>
                                  <h4 className="card-name">{card.name}</h4>
                                  <div className="card-sku-row">
                                    <span className="sku-tag">SKU: {card.sku}</span>
                                    {card.location && (
                                      <span className="loc-tag">
                                        <MapPin size={11} /> {card.location}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className={`stock-status-pill ${card.status}`}>
                                  {card.status === 'out_of_stock'
                                    ? 'Out of Stock'
                                    : card.status === 'low_stock'
                                    ? 'Low Stock'
                                    : 'In Stock'}
                                </span>
                              </div>

                              <div className="card-bottom">
                                <div className="stock-count-group">
                                  <span className="stock-label">Stock:</span>
                                  <span className="stock-val">
                                    {card.currentStock} {card.unit}
                                  </span>
                                  <span className="min-val">(Min: {card.minStock})</span>
                                </div>
                                <div className="price-tag">
                                  ₹{Number(card.price).toLocaleString('en-IN')}
                                </div>
                              </div>

                              <button
                                className="card-action-btn"
                                onClick={() => {
                                  setIsOpen(false);
                                  navigate(`/products?search=${encodeURIComponent(card.sku || card.name)}`);
                                }}
                              >
                                View in Catalog <ExternalLink size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Suggestions below message */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="chat-suggestions-feed">
                        {msg.suggestions.map((sugg, sIdx) => (
                          <button
                            key={sIdx}
                            className="suggestion-chip"
                            onClick={() => sendMessage(sugg)}
                          >
                            {sugg}
                          </button>
                        ))}
                      </div>
                    )}

                    <span className="msg-timestamp">{msg.timestamp}</span>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="msg-avatar user">
                      <User size={16} />
                    </div>
                  )}
                </div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="chat-message-row msg-bot">
                  <div className="msg-avatar bot">
                    <Bot size={16} />
                  </div>
                  <div className="msg-bubble typing-bubble">
                    <div className="typing-dots">
                      <span />
                      <span />
                      <span />
                    </div>
                    <span className="typing-text">Checking real-time inventory...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="ai-chat-input-area">
              {/* Listening Overlay banner */}
              {isListening && (
                <div className="listening-pulse-banner">
                  <div className="sound-wave">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <span>Listening... Speak your question now</span>
                  <button className="stop-mic-btn" onClick={toggleListening}>
                    Cancel
                  </button>
                </div>
              )}

              <div className="input-row">
                <button
                  className={`mic-btn ${isListening ? 'active-mic' : ''}`}
                  onClick={toggleListening}
                  title={isListening ? 'Stop listening' : 'Speak to search inventory'}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                <textarea
                  ref={inputRef}
                  className="chat-textarea"
                  rows={1}
                  placeholder="Ask about inventory, stock, rates, POs, or sales (English/Hindi)..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                />

                <button
                  className="send-btn"
                  onClick={() => sendMessage()}
                  disabled={!inputQuery.trim() || isLoading}
                  title="Send message"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
