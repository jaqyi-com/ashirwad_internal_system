import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, ScrollView, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../services/api';
import { useTheme } from '../../store/themeStore';
import { Colors, Spacing, Radius } from '../../constants/Colors';
import { Picker } from '@react-native-picker/picker'; // Optional if they have it, else we build a simple picker or use text input

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
}

const ROLES = ['ADMIN', 'MANAGER', 'WAREHOUSE_STAFF', 'ACCOUNTANT', 'SALES_STAFF', 'STAFF'];

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STAFF', isActive: true });
  const [saving, setSaving] = useState(false);

  const { colors } = useTheme();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) {
      console.error('Fetch users failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', password: '', role: 'STAFF', isActive: true });
    setShowModal(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, isActive: u.isActive });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || (!editingUser && !form.email)) {
      Alert.alert('Error', 'Please fill required fields');
      return;
    }
    try {
      setSaving(true);
      if (editingUser) {
        const data: any = { name: form.name, role: form.role, isActive: form.isActive };
        if (form.password) data.password = form.password;
        await api.put(`/users/${editingUser.id}`, data);
      } else {
        await api.post('/auth/register', form);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getRoleColor = (role: string) => {
    const map: any = {
      ADMIN: '#a855f7',
      MANAGER: '#3b82f6',
      WAREHOUSE_STAFF: '#10b981',
      ACCOUNTANT: '#eab308',
      SALES_STAFF: '#f97316',
      STAFF: '#6b7280'
    };
    return map[role] || '#6b7280';
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>User Management</Text>
        <TouchableOpacity onPress={handleOpenAdd} style={styles.addBtnIcon}>
          <Feather name="user-plus" size={20} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : users.length === 0 ? (
        <View style={styles.center}>
          <Feather name="users" size={48} color={colors.textMuted} style={{ marginBottom: 16 }} />
          <Text style={[styles.noDataText, { color: colors.textMuted }]}>No users found</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              onPress={() => handleOpenEdit(item)}
            >
              <View style={styles.cardRow}>
                <View style={[styles.avatar, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                  <Text style={[styles.avatarText, { color: '#3b82f6' }]}>{item.name[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.name, { color: colors.textPrimary }]}>{item.name}</Text>
                    {item.isActive ? (
                      <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
                    ) : (
                      <View style={[styles.statusDot, { backgroundColor: '#ef4444' }]} />
                    )}
                  </View>
                  <Text style={[styles.email, { color: colors.textSecondary }]}>{item.email}</Text>
                </View>
              </View>

              <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                <View style={[styles.roleBadge, { backgroundColor: `${getRoleColor(item.role)}15` }]}>
                  <Text style={[styles.roleBadgeText, { color: getRoleColor(item.role) }]}>
                    {item.role.replace('_', ' ')}
                  </Text>
                </View>
                <Text style={[styles.lastLogin, { color: colors.textMuted }]}>
                  Last login: {formatDate(item.lastLogin)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.bgPrimary }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {editingUser ? 'Edit User' : 'Add User'}
            </Text>
            <TouchableOpacity onPress={handleSubmit} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color={Colors.accent} /> : <Text style={{ color: Colors.accent, fontSize: 16, fontWeight: '700' }}>Save</Text>}
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Full Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
                value={form.name}
                onChangeText={t => setForm({ ...form, name: t })}
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {!editingUser && (
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>Email *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
                  value={form.email}
                  onChangeText={t => setForm({ ...form, email: t })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {editingUser ? 'New Password (optional)' : 'Password *'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
                value={form.password}
                onChangeText={t => setForm({ ...form, password: t })}
                secureTextEntry
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Role</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {ROLES.map(role => (
                  <TouchableOpacity
                    key={role}
                    onPress={() => setForm({ ...form, role })}
                    style={[
                      styles.roleSelectChip,
                      { backgroundColor: colors.bgSecondary, borderColor: colors.border },
                      form.role === role && { backgroundColor: Colors.accent, borderColor: Colors.accent }
                    ]}
                  >
                    <Text style={[
                      styles.roleSelectChipText,
                      { color: colors.textPrimary },
                      form.role === role && { color: '#fff' }
                    ]}>
                      {role.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {editingUser && (
              <View style={[styles.formGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }]}>
                <Text style={[styles.label, { color: colors.textPrimary, marginBottom: 0 }]}>Active Status</Text>
                <Switch
                  value={form.isActive}
                  onValueChange={v => setForm({ ...form, isActive: v })}
                  trackColor={{ false: colors.border, true: Colors.accent }}
                />
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  addBtnIcon: { padding: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noDataText: { fontSize: 14, fontWeight: '600' },
  list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 40 },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center'
  },
  avatarText: { fontSize: 16, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  name: { fontSize: 15, fontWeight: '700' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  email: { fontSize: 13 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  roleBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm
  },
  roleBadgeText: { fontSize: 10, fontWeight: '800' },
  lastLogin: { fontSize: 11 },
  
  // Modal styles
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalContent: { padding: Spacing.lg, gap: Spacing.lg },
  formGroup: { marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1, borderRadius: Radius.md,
    paddingHorizontal: 12, height: 44, fontSize: 15
  },
  roleSelectChip: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1,
  },
  roleSelectChipText: { fontSize: 12, fontWeight: '600' }
});
