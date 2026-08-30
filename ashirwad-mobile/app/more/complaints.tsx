import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../store/themeStore';
import { Colors, Spacing, Radius } from '../../../constants/Colors';
import { getTickets, updateTicketStatus, Ticket } from '../../../services/ticketService';
import { router } from 'expo-router';

const STATUS_COLORS = {
  OPEN: Colors.red,
  IN_PROGRESS: Colors.amber,
  RESOLVED: Colors.green,
  CLOSED: Colors.textMuted,
};

export default function ComplaintsScreen() {
  const { colors, isDark } = useTheme();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [updating, setUpdating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchTickets = async () => {
    try {
      const data = await getTickets(search);
      setTickets(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchTickets();
  }, [search]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return;
    setUpdating(true);
    try {
      await updateTicketStatus(selectedTicket.id, status);
      setSelectedTicket({ ...selectedTicket, status: status as any });
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: status as any } : t));
    } catch (error) {
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const renderItem = ({ item }: { item: Ticket }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      onPress={() => {
        setSelectedTicket(item);
        setModalVisible(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.ticketNumber, { color: colors.textPrimary }]}>{item.ticketNumber}</Text>
        <View style={[styles.statusChip, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>{item.status.replace('_', ' ')}</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.row}>
          <Feather name="phone" size={14} color={colors.textMuted} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>{item.customerWaNumber.replace('whatsapp:', '')}</Text>
        </View>
        <View style={styles.row}>
          <Feather name="clock" size={14} color={colors.textMuted} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
      
      <Text style={[styles.previewText, { color: colors.textMuted }]} numberOfLines={1}>
        {item.translatedComplaint || item.originalComplaint}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Complaints</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: colors.bgHover }]}>
          <Feather name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search tickets..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accentLight} />
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentLight} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Feather name="inbox" size={48} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No complaints found</Text>
            </View>
          }
        />
      )}

      {/* Detail Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => setModalVisible(false)}>
              <Feather name="x" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Ticket Details</Text>
            <View style={{ width: 40 }} />
          </View>
          
          {selectedTicket && (
            <FlatList
              data={[{ key: 'content' }]}
              renderItem={() => (
                <View style={styles.modalContent}>
                  <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>{selectedTicket.ticketNumber}</Text>
                  
                  <View style={styles.statusActionRow}>
                    {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(status => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusBtn,
                          { 
                            backgroundColor: selectedTicket.status === status ? STATUS_COLORS[status as keyof typeof STATUS_COLORS] + '20' : colors.bgHover,
                            borderColor: selectedTicket.status === status ? STATUS_COLORS[status as keyof typeof STATUS_COLORS] : colors.border
                          }
                        ]}
                        onPress={() => handleUpdateStatus(status)}
                        disabled={updating}
                      >
                        <Text style={[
                          styles.statusBtnText,
                          { color: selectedTicket.status === status ? STATUS_COLORS[status as keyof typeof STATUS_COLORS] : colors.textMuted }
                        ]}>
                          {status.replace('_', ' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={[styles.infoBlock, { backgroundColor: colors.bgHover }]}>
                    <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Customer Info</Text>
                    <Text style={[styles.infoValue, { color: colors.textPrimary }]}>WhatsApp: {selectedTicket.customerWaNumber.replace('whatsapp:', '')}</Text>
                    <Text style={[styles.infoValue, { color: colors.textPrimary }]}>Name: {selectedTicket.customerName || 'N/A'}</Text>
                    <Text style={[styles.infoValue, { color: colors.textPrimary }]}>Email: {selectedTicket.customerEmail || 'N/A'}</Text>
                  </View>

                  <View style={[styles.infoBlock, { backgroundColor: colors.bgHover }]}>
                    <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Complaint Details ({selectedTicket.languageDetected})</Text>
                    <Text style={[styles.complaintText, { color: colors.textPrimary }]}>{selectedTicket.originalComplaint}</Text>
                  </View>

                  {selectedTicket.translatedComplaint && (
                    <View style={[styles.infoBlock, { backgroundColor: colors.bgHover }]}>
                      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>English Translation</Text>
                      <Text style={[styles.complaintText, { color: colors.textPrimary }]}>{selectedTicket.translatedComplaint}</Text>
                    </View>
                  )}
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  searchContainer: { padding: Spacing.lg },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, height: 44, borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: 15 },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100, gap: Spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  emptyText: { marginTop: Spacing.md, fontSize: 16 },
  
  card: { padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  ticketNumber: { fontSize: 16, fontWeight: '700' },
  statusChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },
  cardBody: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 12 },
  previewText: { fontSize: 13, fontStyle: 'italic' },

  modalContent: { padding: Spacing.lg },
  detailTitle: { fontSize: 24, fontWeight: '800', marginBottom: Spacing.xl },
  statusActionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.xl },
  statusBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: Radius.md, borderWidth: 1 },
  statusBtnText: { fontSize: 12, fontWeight: '700' },
  infoBlock: { padding: Spacing.lg, borderRadius: Radius.lg, marginBottom: Spacing.md },
  infoLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: Spacing.sm },
  infoValue: { fontSize: 14, marginBottom: 4 },
  complaintText: { fontSize: 15, lineHeight: 22 },
});
