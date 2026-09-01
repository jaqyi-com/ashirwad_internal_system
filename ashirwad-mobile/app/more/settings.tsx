import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../services/api';
import { useTheme } from '../../store/themeStore';
import { Colors, Spacing, Radius } from '../../constants/Colors';

interface Coating {
  id: string;
  name: string;
}

export default function SettingsScreen() {
  const [coatings, setCoatings] = useState<Coating[]>([]);
  const [newCoating, setNewCoating] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    fetchCoatings();
  }, []);

  const fetchCoatings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/coatings');
      setCoatings(data);
    } catch (err) {
      console.error('Fetch coatings failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoating = async () => {
    if (!newCoating.trim()) return;
    try {
      setSaving(true);
      await api.post('/coatings', { name: newCoating });
      setNewCoating('');
      fetchCoatings();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to add coating');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoating = (id: string, name: string) => {
    Alert.alert('Delete Coating', `Are you sure you want to delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/coatings/${id}`);
            fetchCoatings();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to delete coating');
          }
        }
      }
    ]);
  };

  const systemInfo = [
    { label: 'Application', value: 'Ashirwad IMS' },
    { label: 'Version', value: '1.0.0' },
    { label: 'Company', value: 'Ashirwad Enterprises' },
    { label: 'Currency', value: '₹ Indian Rupee (INR)' },
    { label: 'Tax System', value: 'GST (India)' },
  ];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Coating Types Section */}
        <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Coating Types</Text>
          <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Manage available coating options for products</Text>

          {loading ? (
            <ActivityIndicator color={Colors.accent} style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.chipsContainer}>
              {coatings.map(c => (
                <View key={c.id} style={[styles.chip, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                  <Text style={[styles.chipText, { color: colors.textPrimary }]}>{c.name}</Text>
                  <TouchableOpacity onPress={() => handleDeleteCoating(c.id, c.name)} style={styles.chipClose}>
                    <Feather name="x" size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.addForm}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="New coating type name..."
              placeholderTextColor={colors.textMuted}
              value={newCoating}
              onChangeText={setNewCoating}
            />
            <TouchableOpacity 
              style={[styles.addBtn, (!newCoating.trim() || saving) && { opacity: 0.5 }]} 
              onPress={handleAddCoating}
              disabled={!newCoating.trim() || saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="plus" size={16} color="#fff" />
                  <Text style={styles.addBtnText}>Add</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* System Info Section */}
        <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>System Information</Text>
          
          <View style={styles.infoList}>
            {systemInfo.map((info, idx) => (
              <View 
                key={info.label} 
                style={[
                  styles.infoRow, 
                  idx < systemInfo.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                ]}
              >
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{info.label}</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{info.value}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
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
  content: { padding: Spacing.lg, gap: Spacing.lg },
  section: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  sectionDesc: { fontSize: 13, marginBottom: Spacing.lg },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    gap: 6,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  chipClose: { padding: 2 },
  addForm: { flexDirection: 'row', gap: Spacing.md },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    fontSize: 14,
    height: 44,
  },
  addBtn: {
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    height: 44,
    gap: 6,
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  infoList: { marginTop: Spacing.sm },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '700' }
});
