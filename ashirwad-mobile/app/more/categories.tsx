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

interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string | null;
  children?: Category[];
  _count?: {
    products: number;
  };
}

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // Form fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formParentId, setFormParentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch (err) {
      console.error('Fetch categories failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (category?: Category) => {
    if (category) {
      setSelectedCategory(category);
      setFormName(category.name);
      setFormDescription(category.description || '');
      setFormParentId(category.parentId || null);
    } else {
      setSelectedCategory(null);
      setFormName('');
      setFormDescription('');
      setFormParentId(null);
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert('Validation Error', 'Category Name is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        parentId: formParentId || null,
      };

      if (selectedCategory) {
        await api.put(`/categories/${selectedCategory.id}`, payload);
      } else {
        await api.post('/categories', payload);
      }
      setModalVisible(false);
      fetchCategories();
    } catch (err) {
      Alert.alert('Save Failed', 'Could not save category. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Category', 'Are you sure you want to delete this category?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/categories/${id}`);
            fetchCategories();
          } catch (_) {
            Alert.alert('Error', 'Failed to delete category.');
          }
        }
      }
    ]);
  };

  // Filter possible parent categories to avoid self-reference cycle
  const parentCandidates = categories.filter(c => !c.parentId && (!selectedCategory || c.id !== selectedCategory.id));

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity onPress={() => handleOpenForm()} style={styles.addBtn}>
          <Feather name="plus" size={20} color={Colors.accentLight} />
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : categories.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.noDataText}>No categories found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {categories.map(cat => (
            <View key={cat.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{cat.name}</Text>
                  {cat.description ? (
                    <Text style={styles.cardDesc}>{cat.description}</Text>
                  ) : null}
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleOpenForm(cat)} style={styles.actionBtn}>
                    <Feather name="edit" size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(cat.id)} style={styles.actionBtn}>
                    <Feather name="trash-2" size={16} color={Colors.red} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Subcategories (children) */}
              {cat.children && cat.children.length > 0 ? (
                <View style={styles.children}>
                  <Text style={styles.childrenTitle}>Subcategories:</Text>
                  <View style={styles.chipRow}>
                    {cat.children.map(child => (
                      <View key={child.id} style={styles.childChip}>
                        <Text style={styles.childChipText}>{child.name}</Text>
                        <TouchableOpacity onPress={() => handleOpenForm(child)} style={{ padding: 2 }}>
                          <Feather name="edit-2" size={10} color={Colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              <View style={styles.footer}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cat._count?.products || 0} Products</Text>
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
                {selectedCategory ? 'Edit Category' : 'Add New Category'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="e.g. Raw Materials"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  value={formDescription}
                  onChangeText={setFormDescription}
                  placeholder="Category description..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />
              </View>

              {/* Parent Category selector */}
              {parentCandidates.length > 0 ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Parent Category (Optional)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.parentRow}>
                    <TouchableOpacity
                      style={[styles.parentChip, !formParentId && styles.parentChipActive]}
                      onPress={() => setFormParentId(null)}
                    >
                      <Text style={[styles.parentChipText, !formParentId && styles.parentChipTextActive]}>None (Root)</Text>
                    </TouchableOpacity>
                    {parentCandidates.map(p => (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.parentChip, formParentId === p.id && styles.parentChipActive]}
                        onPress={() => setFormParentId(p.id)}
                      >
                        <Text style={[styles.parentChipText, formParentId === p.id && styles.parentChipTextActive]}>
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
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
                  <Text style={styles.saveBtnText}>Save Category</Text>
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
  cardDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 4 },
  children: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  childrenTitle: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  childChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  childChipText: { fontSize: 12, color: Colors.textPrimary },
  footer: { flexDirection: 'row', gap: 8, marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md },
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
  parentRow: { gap: 8, paddingVertical: 4 },
  parentChip: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  parentChipActive: {
    backgroundColor: Colors.accentGlow,
    borderColor: Colors.accent,
  },
  parentChipText: { fontSize: 12, color: Colors.textSecondary },
  parentChipTextActive: { color: Colors.accentLight, fontWeight: '700' },
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
