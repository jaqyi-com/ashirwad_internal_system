import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../services/api';
import { useTheme } from '../../store/themeStore';
import { Colors, Spacing, Radius } from '../../constants/Colors';

interface Customer {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  _count?: {
    sales: number;
  };
}

export default function CustomersScreen() {
  const { colors } = useTheme();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Form fields
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get(`/customers?search=${encodeURIComponent(search)}`);
      setCustomers(data);
    } catch (err) {
      console.error('Fetch customers failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (customer?: Customer) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormName(customer.name);
      setFormCompany(customer.company || '');
      setFormEmail(customer.email || '');
      setFormPhone(customer.phone || '');
      setFormAddress(customer.address || '');
    } else {
      setSelectedCustomer(null);
      setFormName('');
      setFormCompany('');
      setFormEmail('');
      setFormPhone('');
      setFormAddress('');
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert('Validation Error', 'Customer Name is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        company: formCompany.trim() || undefined,
        email: formEmail.trim() || undefined,
        phone: formPhone.trim() || undefined,
        address: formAddress.trim() || undefined,
      };

      if (selectedCustomer) {
        await api.put(`/customers/${selectedCustomer.id}`, payload);
      } else {
        await api.post('/customers', payload);
      }
      setModalVisible(false);
      fetchCustomers();
    } catch (err) {
      Alert.alert('Save Failed', 'Could not save customer. Please check network connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Customer', 'Are you sure you want to delete this customer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/customers/${id}`);
            fetchCustomers();
          } catch (_) {
            Alert.alert('Error', 'Failed to delete customer.');
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customers</Text>
        <TouchableOpacity onPress={() => handleOpenForm()} style={styles.addBtn}>
          <Feather name="plus" size={20} color={Colors.accentLight} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Feather name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search customers..."
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : customers.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.noDataText}>No customers found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {customers.map(cust => (
            <View key={cust.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{cust.name}</Text>
                  {cust.company ? (
                    <Text style={styles.cardCompany}>{cust.company}</Text>
                  ) : null}
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleOpenForm(cust)} style={styles.actionBtn}>
                    <Feather name="edit" size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(cust.id)} style={styles.actionBtn}>
                    <Feather name="trash-2" size={16} color={Colors.red} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.details}>
                {cust.phone ? (
                  <View style={styles.detailRow}>
                    <Feather name="phone" size={12} color={Colors.textMuted} />
                    <Text style={styles.detailText}>{cust.phone}</Text>
                  </View>
                ) : null}
                {cust.email ? (
                  <View style={styles.detailRow}>
                    <Feather name="mail" size={12} color={Colors.textMuted} />
                    <Text style={styles.detailText}>{cust.email}</Text>
                  </View>
                ) : null}
                {cust.address ? (
                  <View style={styles.detailRow}>
                    <Feather name="map-pin" size={12} color={Colors.textMuted} />
                    <Text style={styles.detailText} numberOfLines={1}>{cust.address}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.footer}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cust._count?.sales || 0} Sales Invoice(s)</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Form Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalRoot}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Customer Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="e.g. John Doe"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Company Name</Text>
                <TextInput
                  style={styles.input}
                  value={formCompany}
                  onChangeText={setFormCompany}
                  placeholder="Company name"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={formEmail}
                  onChangeText={setFormEmail}
                  placeholder="customer@company.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={formPhone}
                  onChangeText={setFormPhone}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  value={formAddress}
                  onChangeText={setFormAddress}
                  placeholder="Full physical address"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Customer</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  addBtn: {
    width: 32, height: 32, borderRadius: Radius.md,
    backgroundColor: Colors.accentGlow,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.accent,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: Colors.textPrimary, paddingVertical: 10, fontSize: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noDataText: { color: Colors.textMuted, fontSize: 14 },
  list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardName: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  cardCompany: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 4 },
  details: { gap: 6, marginVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, color: Colors.textSecondary },
  footer: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md },
  badge: {
    backgroundColor: Colors.accentGlow,
    borderWidth: 1, borderColor: Colors.accent,
    borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: Colors.accentLight },
  
  // Modal Styles
  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContainer: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  form: { padding: Spacing.xl, gap: Spacing.lg },
  inputGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10,
    color: Colors.textPrimary, fontSize: 14,
  },
  modalFooter: {
    flexDirection: 'row', gap: Spacing.md,
    padding: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: {
    flex: 2, paddingVertical: 12, borderRadius: Radius.md,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});
