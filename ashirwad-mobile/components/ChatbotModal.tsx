import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../store/themeStore';
import { Radius, Spacing } from '../constants/Colors';
import api from '../services/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  cards?: any[];
  suggestions?: string[];
  timestamp: string;
}

interface ChatbotModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectProduct?: (productNameOrSku: string) => void;
}

const DEFAULT_SUGGESTIONS = [
  '🔴 Low stock alerts',
  '📊 Total inventory value',
  "💰 Today's sales report",
  '📦 Active purchase orders',
  '🏢 List suppliers directory',
];

export default function ChatbotModal({ visible, onClose, onSelectProduct }: ChatbotModalProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: '👋 **Hello! I am your Ashirwad AI Inventory Assistant.**\n\nAsk me about stock quantities, low stock alerts, product locations, sales, or suppliers in **English**, **Hindi**, or **Hinglish**.',
      cards: [],
      suggestions: DEFAULT_SUGGESTIONS,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300);
    }
  }, [visible, messages, loading]);

  const sendMessage = async (overrideText?: string) => {
    const textToSend = (overrideText || inputText).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
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
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: botData.reply,
          cards: botData.cards || [],
          suggestions: botData.suggestions || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error(res.data?.error || 'Failed to process request');
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'bot',
          text: '⚠️ Unable to fetch information right now. Please check your connection or try another query.',
          cards: [],
          suggestions: DEFAULT_SUGGESTIONS,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: '🧹 **Chat cleared.** How can I help you check inventory today?',
        cards: [],
        suggestions: DEFAULT_SUGGESTIONS,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const renderFormattedText = (raw: string, isUser: boolean) => {
    // Simple text cleaner for markdown characters in React Native
    const lines = raw.split('\n');
    return lines.map((line, idx) => {
      const cleanLine = line
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1');

      const isBullet = line.startsWith('• ') || line.startsWith('   • ');
      const isHeader = line.startsWith('#');

      return (
        <Text
          key={idx}
          style={[
            styles.messageText,
            { color: isUser ? '#ffffff' : colors.textPrimary },
            isBullet && styles.bulletText,
            isHeader && styles.headerText,
          ]}
        >
          {cleanLine}
        </Text>
      );
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.bgPrimary }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.bgSecondary,
              borderBottomColor: colors.border,
              paddingTop: Platform.OS === 'android' ? insets.top + 8 : 12,
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={['#4f46e5', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarBox}
            >
              <Feather name="cpu" size={18} color="#ffffff" />
            </LinearGradient>
            <View>
              <View style={styles.titleRow}>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Ashirwad AI</Text>
                <View style={styles.badgeLive}>
                  <Text style={styles.badgeLiveText}>ONLINE</Text>
                </View>
              </View>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                Real-time Inventory Assistant
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={clearChat} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="trash-2" size={18} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages List */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageRow,
                  isUser ? styles.messageRowUser : styles.messageRowBot,
                ]}
              >
                {!isUser && (
                  <LinearGradient
                    colors={['#4f46e5', '#6366f1']}
                    style={styles.botMiniAvatar}
                  >
                    <Feather name="cpu" size={12} color="#ffffff" />
                  </LinearGradient>
                )}

                <View style={[styles.bubbleWrapper, isUser && styles.bubbleWrapperUser]}>
                  <View
                    style={[
                      styles.bubble,
                      isUser
                        ? [styles.bubbleUser, { backgroundColor: colors.accent }]
                        : [styles.bubbleBot, { backgroundColor: colors.bgCard, borderColor: colors.border }],
                    ]}
                  >
                    {renderFormattedText(msg.text, isUser)}

                    {/* Render Product Cards if returned by bot */}
                    {msg.cards && msg.cards.length > 0 && (
                      <View style={styles.cardsList}>
                        {msg.cards.map((card: any) => (
                          <View
                            key={card.id}
                            style={[
                              styles.productCard,
                              { backgroundColor: isDark ? '#1a1a27' : '#f8fafc', borderColor: colors.border },
                            ]}
                          >
                            <View style={styles.cardHeader}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.cardCategory}>{card.category}</Text>
                                <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                                  {card.name}
                                </Text>
                                <Text style={[styles.cardSku, { color: colors.textMuted }]}>
                                  SKU: {card.sku} {card.location ? `• Shelf: ${card.location}` : ''}
                                </Text>
                              </View>
                              <View
                                style={[
                                  styles.statusPill,
                                  card.status === 'out_of_stock'
                                    ? styles.statusPillRed
                                    : card.status === 'low_stock'
                                    ? styles.statusPillYellow
                                    : styles.statusPillGreen,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.statusPillText,
                                    card.status === 'out_of_stock'
                                      ? { color: '#ef4444' }
                                      : card.status === 'low_stock'
                                      ? { color: '#f59e0b' }
                                      : { color: '#10b981' },
                                  ]}
                                >
                                  {card.status === 'out_of_stock'
                                    ? 'Out of Stock'
                                    : card.status === 'low_stock'
                                    ? 'Low'
                                    : 'In Stock'}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.cardFooter}>
                              <Text style={[styles.stockInfo, { color: colors.textSecondary }]}>
                                Stock: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{card.currentStock} {card.unit}</Text>
                              </Text>
                              <Text style={styles.priceInfo}>
                                ₹{Number(card.price).toLocaleString('en-IN')}
                              </Text>
                            </View>

                            {onSelectProduct && (
                              <TouchableOpacity
                                style={[styles.viewProductBtn, { borderColor: colors.border }]}
                                onPress={() => {
                                  onClose();
                                  onSelectProduct(card.sku || card.name);
                                }}
                              >
                                <Text style={[styles.viewProductText, { color: colors.accentLight }]}>
                                  View Details
                                </Text>
                                <Feather name="arrow-right" size={12} color={colors.accentLight} />
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Suggestions Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <View style={styles.suggestionsRow}>
                      {msg.suggestions.map((sugg, sIdx) => (
                        <TouchableOpacity
                          key={sIdx}
                          style={[styles.suggChip, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                          onPress={() => sendMessage(sugg)}
                        >
                          <Text style={[styles.suggChipText, { color: colors.accentLight }]}>{sugg}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <Text style={[styles.timestamp, { color: colors.textMuted }]}>{msg.timestamp}</Text>
                </View>
              </View>
            );
          })}

          {loading && (
            <View style={[styles.messageRow, styles.messageRowBot]}>
              <View style={[styles.botMiniAvatar, { backgroundColor: colors.accent }]}>
                <Feather name="cpu" size={12} color="#ffffff" />
              </View>
              <View style={[styles.bubble, styles.bubbleBot, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={colors.accentLight} />
                  <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                    Querying inventory database...
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.bgSecondary,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
            placeholder="Ask about inventory, stock, or rates..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
            editable={!loading}
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: inputText.trim() ? colors.accent : colors.border },
            ]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || loading}
          >
            <Feather name="send" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  badgeLive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  badgeLiveText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 6,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 16,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  messageRowBot: {
    justifyContent: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  botMiniAvatar: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  bubbleWrapper: {
    maxWidth: '85%',
  },
  bubbleWrapperUser: {
    alignItems: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  bubbleBot: {
    borderWidth: 1,
    borderTopLeftRadius: 2,
  },
  bubbleUser: {
    borderTopRightRadius: 2,
  },
  messageText: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  bulletText: {
    paddingLeft: 6,
    marginVertical: 2,
  },
  headerText: {
    fontWeight: '700',
    fontSize: 14,
    marginTop: 6,
    marginBottom: 2,
  },
  cardsList: {
    marginTop: 10,
    gap: 8,
  },
  productCard: {
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardCategory: {
    fontSize: 9,
    color: '#818cf8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardSku: {
    fontSize: 10,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  statusPillRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusPillYellow: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusPillGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  stockInfo: {
    fontSize: 11,
  },
  priceInfo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
  },
  viewProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginTop: 2,
  },
  viewProductText: {
    fontSize: 11,
    fontWeight: '600',
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  suggChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  suggChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 9,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  loadingText: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    fontSize: 13.5,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
