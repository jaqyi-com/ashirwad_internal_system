import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../services/api';
import { useTheme } from '../../store/themeStore';
import { Colors, Spacing, Radius } from '../../constants/Colors';

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  createdAt: string;
  user?: {
    name: string;
  };
}

export default function AuditLogsScreen() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/audit');
      setLogs(data);
    } catch (err) {
      console.error('Fetch audit logs failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getActionColor = (action: string) => {
    if (action === 'DELETE') return '#ef4444';
    if (action === 'CREATE') return '#10b981';
    return '#3b82f6';
  };

  const getActionBg = (action: string) => {
    if (action === 'DELETE') return 'rgba(239, 68, 68, 0.1)';
    if (action === 'CREATE') return 'rgba(16, 185, 129, 0.1)';
    return 'rgba(59, 130, 246, 0.1)';
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Audit Logs</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.center}>
          <Feather name="clipboard" size={48} color={colors.textMuted} style={{ marginBottom: 16 }} />
          <Text style={[styles.noDataText, { color: colors.textMuted }]}>No audit logs found</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resourceName, { color: colors.textPrimary }]}>{item.resource}</Text>
                  <Text style={[styles.resourceId, { color: colors.textMuted }]}>ID: {item.resourceId || '—'}</Text>
                </View>
                <View style={[
                  styles.badge,
                  { backgroundColor: getActionBg(item.action) }
                ]}>
                  <Text style={[
                    styles.badgeText,
                    { color: getActionColor(item.action) }
                  ]}>
                    {item.action}
                  </Text>
                </View>
              </View>
              
              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <Text style={[styles.footerMeta, { color: colors.textMuted }]}>
                  By {item.user?.name || 'System'} · {formatDate(item.createdAt)}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noDataText: { fontSize: 14, fontWeight: '600' },
  list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 40 },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  resourceName: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  resourceId: { fontSize: 11, fontFamily: 'monospace' },
  badge: {
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '800' },
  footer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  footerMeta: { fontSize: 11, fontWeight: '500' }
});
