import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  ActivityIndicator, Modal, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import api from '../../services/api';
import { useTheme } from '../../store/themeStore';
import SearchBar from '../../components/SearchBar';
import { Colors, Spacing, Radius } from '../../constants/Colors';

const STATUS_FILTERS = ['', 'DRAFT', 'PENDING', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'];

interface POItem {
  id?: string;
  productId: string;
  product?: any;
  quantity: number;
  unitPrice: number;
  orderedQty?: number;
  receivedQty?: number;
}

const INITIAL_PO_FORM = {
  supplierId: '',
  expectedDate: '',
  notes: '',
  items: [] as POItem[],
};

export default function PurchasesScreen() {
  const { colors } = useTheme();
  const [purchases, setPurchases]     = useState<any[]>([]);
  const [total, setTotal]             = useState(0);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Meta data
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts]   = useState<any[]>([]);

  // Modals
  const [selected, setSelected]         = useState<any>(null);
  const [showForm, setShowForm]         = useState(false);
  const [editOrder, setEditOrder]       = useState<any>(null);
  const [poForm, setPoForm]             = useState({ ...INITIAL_PO_FORM });
  const [saving, setSaving]             = useState(false);

  // Goods Receiving
  const [showReceive, setShowReceive]   = useState(false);
  const [receiveOrder, setReceiveOrder] = useState<any>(null);
  const [receivedQtys, setReceivedQtys] = useState<Record<string, string>>({});
  const [receiveSaving, setReceiveSaving] = useState(false);

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  const load = useCallback(async (p = 1, q = search, status = statusFilter, isRefresh = false) => {
    if (p === 1) isRefresh ? setRefreshing(true) : setLoading(true);
    else setLoadingMore(true);
    try {
      const { data } = await api.get('/purchases', {
        params: {
          search: q || undefined,
          status: status || undefined,
          page: p,
          limit: 20
        },
      });
      const items = data.orders || [];
      if (p === 1) setPurchases(items);
      else setPurchases(prev => [...prev, ...items]);
      setTotal(data.total || 0);
      setPage(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [search, statusFilter]);

  const loadMeta = async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        api.get('/suppliers'),
        api.get('/products', { params: { limit: 500 } }),
      ]);
      const sups = Array.isArray(supRes.data) ? supRes.data : (supRes.data?.suppliers || []);
      const prods = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.products || []);
      setSuppliers(sups);
      setProducts(prods);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(1, search, statusFilter); }, [search, statusFilter]);
  useEffect(() => { loadMeta(); }, []);

  // ─── Formatting helpers ─────────────────────────────────────────────────────
  const fmtDate = (d?: string) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  };

  const fmtCur = (n?: number | string) =>
    '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return { label: 'Approved', color: '#10b981', bg: 'rgba(16,185,129,0.12)' };
      case 'RECEIVED':
        return { label: 'Received', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' };
      case 'PARTIALLY_RECEIVED':
        return { label: 'Partially Received', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' };
      case 'PENDING':
        return { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
      case 'CANCELLED':
        return { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
      default:
        return { label: status || 'Draft', color: colors.textMuted, bg: 'rgba(156,163,175,0.12)' };
    }
  };

  // ─── CRUD Actions ──────────────────────────────────────────────────────────
  const openCreatePO = async () => {
    if (!suppliers.length || !products.length) {
      await loadMeta();
    }
    setEditOrder(null);
    setPoForm({
      supplierId: suppliers[0]?.id || '',
      expectedDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      notes: '',
      items: [],
    });
    setShowForm(true);
  };

  const openEditPO = (po: any) => {
    setEditOrder(po);
    setPoForm({
      supplierId: po.supplierId || '',
      expectedDate: po.expectedDate ? new Date(po.expectedDate).toISOString().split('T')[0] : '',
      notes: po.notes || '',
      items: (po.items || []).map((it: any) => ({
        id: it.id,
        productId: it.productId,
        product: it.product,
        quantity: it.orderedQty || it.quantity || 1,
        unitPrice: parseFloat(it.unitPrice) || 0,
      })),
    });
    setSelected(null);
    setShowForm(true);
  };

  const handleSavePO = async () => {
    if (!poForm.supplierId) {
      Alert.alert('Validation', 'Please select a supplier.');
      return;
    }
    if (!poForm.items.length) {
      Alert.alert('Validation', 'Please add at least one line item.');
      return;
    }

    // Validate quantities & rates
    for (const it of poForm.items) {
      if (!it.productId) {
        Alert.alert('Validation', 'Please select a product for each line item.');
        return;
      }
      if (!it.quantity || it.quantity <= 0) {
        Alert.alert('Validation', 'Quantity must be greater than 0.');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        supplierId: poForm.supplierId,
        expectedDate: poForm.expectedDate || null,
        notes: poForm.notes.trim() || null,
        items: poForm.items.map(it => ({
          productId: it.productId,
          quantity: parseInt(String(it.quantity)),
          unitPrice: parseFloat(String(it.unitPrice)) || 0,
        })),
      };

      if (editOrder) {
        await api.put(`/purchases/${editOrder.id}`, payload);
        Alert.alert('Success', 'Purchase order updated successfully!');
      } else {
        await api.post('/purchases', payload);
        Alert.alert('Success', 'Purchase order created successfully!');
      }
      setShowForm(false);
      load(1, search, statusFilter, true);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to save purchase order.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelPO = (po: any) => {
    Alert.alert(
      'Cancel Purchase Order',
      `Are you sure you want to cancel order ${po.poNumber || po.id}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/purchases/${po.id}`);
              setSelected(null);
              load(1, search, statusFilter, true);
            } catch {
              Alert.alert('Error', 'Could not cancel purchase order.');
            }
          },
        },
      ]
    );
  };

  const handleUpdateStatus = async (po: any, newStatus: string) => {
    try {
      await api.patch(`/purchases/${po.id}/status`, { status: newStatus });
      Alert.alert('Status Updated', `Order status changed to ${newStatus}.`);
      if (selected && selected.id === po.id) {
        setSelected({ ...selected, status: newStatus });
      }
      load(1, search, statusFilter, true);
    } catch {
      Alert.alert('Error', 'Failed to update order status.');
    }
  };

  const openReceiveModal = (po: any) => {
    setReceiveOrder(po);
    const initialQtys: Record<string, string> = {};
    (po.items || []).forEach((it: any) => {
      const remaining = (it.orderedQty || 0) - (it.receivedQty || 0);
      initialQtys[it.id] = remaining > 0 ? String(remaining) : '0';
    });
    setReceivedQtys(initialQtys);
    setSelected(null);
    setShowReceive(true);
  };

  const handleReceiveGoods = async () => {
    if (!receiveOrder) return;
    const receivedItems = (receiveOrder.items || [])
      .map((it: any) => {
        const qty = parseInt(receivedQtys[it.id] || '0');
        return {
          purchaseOrderItemId: it.id,
          productId: it.productId,
          receivedQty: isNaN(qty) ? 0 : qty,
        };
      })
      .filter((it: any) => it.receivedQty > 0);

    if (!receivedItems.length) {
      Alert.alert('Validation', 'Please enter a received quantity of at least 1 item.');
      return;
    }

    setReceiveSaving(true);
    try {
      await api.post(`/purchases/${receiveOrder.id}/receive`, { receivedItems });
      Alert.alert('Success', 'Goods received and inventory updated successfully!');
      setShowReceive(false);
      load(1, search, statusFilter, true);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to receive goods.');
    } finally {
      setReceiveSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Purchase Orders</Text>
          <Text style={[styles.count, { color: colors.textMuted }]}>{total} orders</Text>
        </View>
        <TouchableOpacity onPress={openCreatePO} style={[styles.createBtn, { backgroundColor: colors.accent }]}>
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
          {STATUS_FILTERS.map(st => {
            const isActive = statusFilter === st;
            return (
              <TouchableOpacity
                key={st || 'ALL'}
                style={[
                  styles.filterPill,
                  { backgroundColor: colors.bgCard, borderColor: colors.border },
                  isActive && [styles.filterPillActive, { backgroundColor: colors.accent, borderColor: colors.accent }]
                ]}
                onPress={() => { setStatusFilter(st); setPage(1); }}
              >
                <Text style={[styles.filterPillTxt, { color: colors.textSecondary }, isActive && styles.filterPillTxtActive]}>
                  {st ? st.replace('_', ' ') : 'All'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List */}
      <FlatList
        data={purchases}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <SearchBar
            value={search}
            onChangeText={v => { setSearch(v); setPage(1); }}
            placeholder="Search PO number, supplier..."
          />
        }
        renderItem={({ item }) => {
          const badge = getStatusBadge(item.status);
          const itemCount = item.items?.length || 0;

          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              onPress={() => setSelected(item)}
              activeOpacity={0.75}
            >
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.poNumber, { color: colors.textPrimary }]}>{item.poNumber || `PO #${item.id.slice(-6)}`}</Text>
                  <Text style={[styles.supplierName, { color: colors.accentLight }]}>{item.supplier?.name || 'Unknown Supplier'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.statusBadgeTxt, { color: badge.color }]}>{badge.label}</Text>
                </View>
              </View>

              <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

              <View style={styles.cardFooterRow}>
                <View style={styles.cardMetaCol}>
                  <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Order Date</Text>
                  <Text style={[styles.metaValue, { color: colors.textSecondary }]}>{fmtDate(item.orderDate || item.createdAt)}</Text>
                </View>

                <View style={styles.cardMetaCol}>
                  <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Items</Text>
                  <Text style={[styles.metaValue, { color: colors.textSecondary }]}>{itemCount} line item{itemCount !== 1 ? 's' : ''}</Text>
                </View>

                <View style={[styles.cardMetaCol, { alignItems: 'flex-end' }]}>
                  <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Total Amount</Text>
                  <Text style={[styles.amountValue, { color: colors.green }]}>{fmtCur(item.totalAmount)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(1, search, statusFilter, true)}
            tintColor={colors.accent}
          />
        }
        onEndReached={() => {
          if (purchases.length < total && !loadingMore) load(page + 1, search, statusFilter);
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.accent} style={{ marginVertical: 16 }} /> : null}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Feather name="shopping-bag" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No purchase orders found</Text>
              <TouchableOpacity style={[styles.emptyAddBtn, { backgroundColor: colors.accent }]} onPress={openCreatePO}>
                <Feather name="plus" size={16} color="#fff" />
                <Text style={styles.emptyAddText}>Create Purchase Order</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      {loading && (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.bgPrimary }]}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )}

      {/* PO Detail Modal */}
      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
        {selected && (
          <PurchaseDetail
            po={selected}
            onClose={() => setSelected(null)}
            onEdit={() => openEditPO(selected)}
            onCancel={() => handleCancelPO(selected)}
            onReceive={() => openReceiveModal(selected)}
            onUpdateStatus={(st: string) => handleUpdateStatus(selected, st)}
            fmtCur={fmtCur}
            fmtDate={fmtDate}
          />
        )}
      </Modal>

      {/* Create / Edit Purchase Order Form Modal */}
      <Modal visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
        <PurchaseForm
          editOrder={editOrder}
          form={poForm}
          setForm={setPoForm}
          suppliers={suppliers}
          products={products}
          saving={saving}
          onSave={handleSavePO}
          onClose={() => setShowForm(false)}
          fmtCur={fmtCur}
        />
      </Modal>

      {/* Receive Goods Modal */}
      <Modal visible={showReceive} transparent animationType="slide" onRequestClose={() => setShowReceive(false)}>
        {receiveOrder && (
          <ReceiveGoodsModal
            order={receiveOrder}
            receivedQtys={receivedQtys}
            setReceivedQtys={setReceivedQtys}
            saving={receiveSaving}
            onReceive={handleReceiveGoods}
            onClose={() => setShowReceive(false)}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

// ─── Purchase Detail Modal Component ──────────────────────────────────────────
function PurchaseDetail({
  po, onClose, onEdit, onCancel, onReceive, onUpdateStatus, fmtCur, fmtDate
}: {
  po: any;
  onClose: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onReceive: () => void;
  onUpdateStatus: (s: string) => void;
  fmtCur: (n?: number | string) => string;
  fmtDate: (d?: string) => string;
}) {
  const { colors } = useTheme();
  const items: any[] = po.items || [];
  const badge = (() => {
    switch (po.status) {
      case 'APPROVED': return { label: 'Approved', color: '#10b981', bg: 'rgba(16,185,129,0.15)' };
      case 'RECEIVED': return { label: 'Received', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' };
      case 'PARTIALLY_RECEIVED': return { label: 'Partially Received', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' };
      case 'PENDING': return { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
      case 'CANCELLED': return { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
      default: return { label: po.status || 'Draft', color: colors.textMuted, bg: 'rgba(156,163,175,0.15)' };
    }
  })();

  const canReceive = po.status !== 'CANCELLED' && po.status !== 'RECEIVED' && po.status !== 'DRAFT';
  const canEdit = po.status === 'DRAFT' || po.status === 'PENDING';

  return (
    <SafeAreaView style={[dtStyles.root, { backgroundColor: colors.bgCard }]}>
      {/* Header */}
      <View style={[dtStyles.header, { borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[dtStyles.orderId, { color: colors.textPrimary }]}>{po.poNumber || `PO #${po.id.slice(-6)}`}</Text>
            <View style={[dtStyles.statusBadge, { backgroundColor: badge.bg }]}>
              <Text style={[dtStyles.statusBadgeTxt, { color: badge.color }]}>{badge.label}</Text>
            </View>
          </View>
          <Text style={[dtStyles.supplier, { color: colors.accentLight }]}>{po.supplier?.name || '—'}</Text>
        </View>

        <View style={dtStyles.headerActions}>
          {canEdit && (
            <TouchableOpacity onPress={onEdit} style={[dtStyles.headerBtn, { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}>
              <Feather name="edit-2" size={15} color={colors.accentLight} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onClose} style={[dtStyles.headerBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <Feather name="x" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={dtStyles.body} showsVerticalScrollIndicator={false}>
        {/* Financial Metrics Summary */}
        <View style={dtStyles.metricsGrid}>
          <View style={[dtStyles.metricBox, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <Text style={[dtStyles.metricVal, { color: colors.green }]}>{fmtCur(po.totalAmount)}</Text>
            <Text style={[dtStyles.metricLabel, { color: colors.textMuted }]}>Total Amount</Text>
          </View>

          <View style={[dtStyles.metricBox, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <Text style={[dtStyles.metricVal, { color: colors.textPrimary }]}>{fmtCur(po.subtotal)}</Text>
            <Text style={[dtStyles.metricLabel, { color: colors.textMuted }]}>Subtotal</Text>
          </View>

          <View style={[dtStyles.metricBox, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <Text style={[dtStyles.metricVal, { color: colors.purple }]}>{fmtCur(po.gstAmount)}</Text>
            <Text style={[dtStyles.metricLabel, { color: colors.textMuted }]}>GST (18%)</Text>
          </View>
        </View>

        {/* Order Details Info */}
        <View style={[dtStyles.infoCard, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <View style={dtStyles.infoRow}>
            <Text style={[dtStyles.infoLabel, { color: colors.textMuted }]}>Order Date</Text>
            <Text style={[dtStyles.infoValue, { color: colors.textPrimary }]}>{fmtDate(po.orderDate || po.createdAt)}</Text>
          </View>
          <View style={dtStyles.infoRow}>
            <Text style={[dtStyles.infoLabel, { color: colors.textMuted }]}>Expected Date</Text>
            <Text style={[dtStyles.infoValue, { color: colors.textPrimary }]}>{fmtDate(po.expectedDate)}</Text>
          </View>
          {po.supplier?.phone && (
            <View style={dtStyles.infoRow}>
              <Text style={[dtStyles.infoLabel, { color: colors.textMuted }]}>Supplier Phone</Text>
              <Text style={[dtStyles.infoValue, { color: colors.textPrimary }]}>{po.supplier.phone}</Text>
            </View>
          )}
          {po.supplier?.email && (
            <View style={dtStyles.infoRow}>
              <Text style={[dtStyles.infoLabel, { color: colors.textMuted }]}>Supplier Email</Text>
              <Text style={[dtStyles.infoValue, { color: colors.textPrimary }]}>{po.supplier.email}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons Bar */}
        <View style={dtStyles.actionBar}>
          {canReceive && (
            <TouchableOpacity style={[dtStyles.actionPrimaryBtn, { backgroundColor: colors.accent }]} onPress={onReceive}>
              <Feather name="package" size={16} color="#fff" />
              <Text style={dtStyles.actionPrimaryTxt}>Receive Goods</Text>
            </TouchableOpacity>
          )}

          {po.status === 'DRAFT' && (
            <TouchableOpacity
              style={[dtStyles.actionSecondaryBtn, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: '#10b981' }]}
              onPress={() => onUpdateStatus('APPROVED')}
            >
              <Feather name="check-circle" size={15} color="#10b981" />
              <Text style={[dtStyles.actionSecondaryTxt, { color: '#10b981' }]}>Approve Order</Text>
            </TouchableOpacity>
          )}

          {po.status !== 'CANCELLED' && po.status !== 'RECEIVED' && (
            <TouchableOpacity
              style={[dtStyles.actionSecondaryBtn, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' }]}
              onPress={onCancel}
            >
              <Feather name="slash" size={15} color={colors.red} />
              <Text style={[dtStyles.actionSecondaryTxt, { color: colors.red }]}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Line Items */}
        <Text style={[dtStyles.sectionTitle, { color: colors.textPrimary }]}>Order Items ({items.length})</Text>
        {items.map((it, idx) => {
          const ordered = it.orderedQty || 0;
          const received = it.receivedQty || 0;
          const isComplete = received >= ordered && ordered > 0;

          return (
            <View key={idx} style={[dtStyles.lineItemCard, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <View style={dtStyles.lineItemHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[dtStyles.lineItemName, { color: colors.textPrimary }]}>{it.product?.name || 'Product'}</Text>
                  {it.product?.partNumber && (
                    <Text style={[dtStyles.lineItemPart, { color: colors.textMuted }]}>P/N: {it.product.partNumber}</Text>
                  )}
                </View>
                <Text style={[dtStyles.lineItemPrice, { color: colors.green }]}>{fmtCur(it.totalPrice || (it.orderedQty * it.unitPrice))}</Text>
              </View>

              <View style={dtStyles.lineItemDetails}>
                <Text style={[dtStyles.lineItemRate, { color: colors.textSecondary }]}>
                  {ordered} {it.product?.unit || 'pcs'} × {fmtCur(it.unitPrice)}
                </Text>
                <View style={[dtStyles.progressTag, { backgroundColor: isComplete ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)' }]}>
                  <Text style={[dtStyles.progressTagTxt, { color: isComplete ? '#10b981' : '#3b82f6' }]}>
                    Received: {received} / {ordered}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {po.notes ? (
          <View style={[dtStyles.notesBox, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
            <Text style={[dtStyles.notesTitle, { color: colors.textMuted }]}>Notes / Remarks</Text>
            <Text style={[dtStyles.notesContent, { color: colors.textSecondary }]}>{po.notes}</Text>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Create & Edit Purchase Order Form ────────────────────────────────────────
function PurchaseForm({
  editOrder, form, setForm, suppliers, products, saving, onSave, onClose, fmtCur
}: {
  editOrder: any;
  form: typeof INITIAL_PO_FORM;
  setForm: (f: any) => void;
  suppliers: any[];
  products: any[];
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
  fmtCur: (n?: number | string) => string;
}) {
  const { colors } = useTheme();
  const [showSupPicker, setShowSupPicker]     = useState(false);
  const [showProdPicker, setShowProdPicker]   = useState(false);
  const [prodSearch, setProdSearch]           = useState('');
  const [supSearch, setSupSearch]             = useState('');
  const [localProducts, setLocalProducts]     = useState<any[]>(products || []);
  const [localSuppliers, setLocalSuppliers]   = useState<any[]>(suppliers || []);

  useEffect(() => {
    if (products && products.length > 0) {
      setLocalProducts(products);
    } else {
      api.get('/products', { params: { limit: 500 } }).then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.products || []);
        setLocalProducts(list);
      }).catch(console.error);
    }
  }, [products]);

  useEffect(() => {
    if (suppliers && suppliers.length > 0) {
      setLocalSuppliers(suppliers);
    } else {
      api.get('/suppliers').then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.suppliers || []);
        setLocalSuppliers(list);
      }).catch(console.error);
    }
  }, [suppliers]);

  const selectedSupplier = localSuppliers.find(s => s.id === form.supplierId);

  const filteredSuppliers = localSuppliers.filter(s =>
    s.name.toLowerCase().includes(supSearch.toLowerCase())
  );
  const filteredProducts = localProducts.filter(p =>
    (p.name && p.name.toLowerCase().includes(prodSearch.toLowerCase())) ||
    (p.partNumber && p.partNumber.toLowerCase().includes(prodSearch.toLowerCase()))
  );

  // Line item helpers
  const addItem = (product: any) => {
    const existing = form.items.find(it => it.productId === product.id);
    if (existing) {
      setForm((f: any) => ({
        ...f,
        items: f.items.map((it: any) => it.productId === product.id ? { ...it, quantity: it.quantity + 1 } : it),
      }));
    } else {
      setForm((f: any) => ({
        ...f,
        items: [
          ...f.items,
          {
            productId: product.id,
            product,
            quantity: 1,
            unitPrice: parseFloat(product.purchasePrice) || 0,
          },
        ],
      }));
    }
    setShowProdPicker(false);
  };

  const removeItem = (index: number) => {
    setForm((f: any) => ({
      ...f,
      items: f.items.filter((_: any, i: number) => i !== index),
    }));
  };

  const updateQuantity = (index: number, val: number) => {
    if (val < 1) return;
    setForm((f: any) => {
      const copy = [...f.items];
      copy[index] = { ...copy[index], quantity: val };
      return { ...f, items: copy };
    });
  };

  const updatePrice = (index: number, val: string) => {
    const price = parseFloat(val) || 0;
    setForm((f: any) => {
      const copy = [...f.items];
      copy[index] = { ...copy[index], unitPrice: price };
      return { ...f, items: copy };
    });
  };

  // Calculations
  const subtotal = form.items.reduce((s, it) => s + (it.quantity * it.unitPrice || 0), 0);
  const gstAmount = subtotal * 0.18;
  const grandTotal = subtotal + gstAmount;

  return (
    <SafeAreaView style={[fStyles.root, { backgroundColor: colors.bgPrimary }]}>
      {/* Header */}
      <View style={[fStyles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose} style={fStyles.closeBtn}>
          <Feather name="x" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[fStyles.title, { color: colors.textPrimary }]}>
          {editOrder ? 'Edit Purchase Order' : 'New Purchase Order'}
        </Text>
        <TouchableOpacity
          onPress={onSave}
          style={[fStyles.saveBtn, { backgroundColor: colors.accent }, saving && { opacity: 0.7 }]}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={fStyles.saveTxt}>Save PO</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={fStyles.body} showsVerticalScrollIndicator={false}>
          {/* Supplier Picker */}
          <Text style={[fStyles.sectionHeader, { color: colors.textMuted }]}>ORDER DETAILS</Text>

          <View style={fStyles.fieldGroup}>
            <Text style={[fStyles.fieldLabel, { color: colors.textSecondary }]}>Supplier *</Text>
            <TouchableOpacity
              style={[fStyles.picker, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              onPress={() => { setSupSearch(''); setShowSupPicker(true); }}
            >
              <Text style={[fStyles.pickerTxt, { color: selectedSupplier ? colors.textPrimary : colors.textMuted }]}>
                {selectedSupplier ? selectedSupplier.name : 'Select Supplier'}
              </Text>
              <Feather name="chevron-down" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Expected Delivery Date */}
          <View style={fStyles.fieldGroup}>
            <Text style={[fStyles.fieldLabel, { color: colors.textSecondary }]}>Expected Delivery Date (YYYY-MM-DD)</Text>
            <TextInput
              style={[fStyles.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]}
              value={form.expectedDate}
              onChangeText={v => setForm((f: any) => ({ ...f, expectedDate: v }))}
              placeholder="e.g. 2026-09-15"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Line Items Section */}
          <View style={fStyles.itemsHeaderRow}>
            <Text style={[fStyles.sectionHeader, { color: colors.textMuted, marginTop: 0, marginBottom: 0 }]}>
              PURCHASE ITEMS ({form.items.length})
            </Text>
            <TouchableOpacity
              style={[fStyles.addItemBtn, { backgroundColor: colors.accentGlow, borderColor: colors.accent }]}
              onPress={() => { setProdSearch(''); setShowProdPicker(true); }}
            >
              <Feather name="plus" size={14} color={colors.accentLight} />
              <Text style={[fStyles.addItemTxt, { color: colors.accentLight }]}>Add Product</Text>
            </TouchableOpacity>
          </View>

          {form.items.length === 0 ? (
            <View style={[fStyles.emptyItemsBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Feather name="shopping-cart" size={32} color={colors.textMuted} />
              <Text style={[fStyles.emptyItemsTxt, { color: colors.textMuted }]}>No items added yet</Text>
              <TouchableOpacity
                style={[fStyles.addFirstItemBtn, { backgroundColor: colors.accent }]}
                onPress={() => { setProdSearch(''); setShowProdPicker(true); }}
              >
                <Feather name="plus" size={14} color="#fff" />
                <Text style={fStyles.addFirstItemTxt}>Select Products</Text>
              </TouchableOpacity>
            </View>
          ) : (
            form.items.map((item, idx) => (
              <View key={idx} style={[fStyles.itemCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <View style={fStyles.itemCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[fStyles.itemName, { color: colors.textPrimary }]}>{item.product?.name || 'Selected Item'}</Text>
                    {item.product?.partNumber && (
                      <Text style={[fStyles.itemPart, { color: colors.textMuted }]}>P/N: {item.product.partNumber}</Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => removeItem(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Feather name="trash-2" size={16} color={colors.red} />
                  </TouchableOpacity>
                </View>

                <View style={fStyles.itemControlsRow}>
                  {/* Quantity adjustment */}
                  <View style={fStyles.qtyWrapper}>
                    <Text style={[fStyles.controlLabel, { color: colors.textMuted }]}>Qty</Text>
                    <View style={[fStyles.qtyRow, { borderColor: colors.border }]}>
                      <TouchableOpacity
                        style={[fStyles.qtyBtn, { backgroundColor: colors.bgSecondary }]}
                        onPress={() => updateQuantity(idx, item.quantity - 1)}
                      >
                        <Feather name="minus" size={14} color={colors.textPrimary} />
                      </TouchableOpacity>
                      <TextInput
                        style={[fStyles.qtyInput, { color: colors.textPrimary }]}
                        value={String(item.quantity)}
                        keyboardType="number-pad"
                        onChangeText={v => updateQuantity(idx, parseInt(v) || 1)}
                      />
                      <TouchableOpacity
                        style={[fStyles.qtyBtn, { backgroundColor: colors.bgSecondary }]}
                        onPress={() => updateQuantity(idx, item.quantity + 1)}
                      >
                        <Feather name="plus" size={14} color={colors.textPrimary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Unit Rate */}
                  <View style={fStyles.rateWrapper}>
                    <Text style={[fStyles.controlLabel, { color: colors.textMuted }]}>Rate (₹)</Text>
                    <TextInput
                      style={[fStyles.rateInput, { backgroundColor: colors.bgSecondary, borderColor: colors.border, color: colors.textPrimary }]}
                      value={String(item.unitPrice)}
                      keyboardType="decimal-pad"
                      onChangeText={v => updatePrice(idx, v)}
                    />
                  </View>

                  {/* Line Total */}
                  <View style={fStyles.lineTotalWrapper}>
                    <Text style={[fStyles.controlLabel, { color: colors.textMuted }]}>Total</Text>
                    <Text style={[fStyles.lineTotalTxt, { color: colors.green }]}>
                      {fmtCur(item.quantity * item.unitPrice)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}

          {/* Order Financials Summary */}
          {form.items.length > 0 && (
            <View style={[fStyles.summaryCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={fStyles.summaryRow}>
                <Text style={[fStyles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
                <Text style={[fStyles.summaryVal, { color: colors.textPrimary }]}>{fmtCur(subtotal)}</Text>
              </View>
              <View style={fStyles.summaryRow}>
                <Text style={[fStyles.summaryLabel, { color: colors.textSecondary }]}>Estimated GST (18%)</Text>
                <Text style={[fStyles.summaryVal, { color: colors.purple }]}>{fmtCur(gstAmount)}</Text>
              </View>
              <View style={[fStyles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={fStyles.summaryRow}>
                <Text style={[fStyles.grandTotalLabel, { color: colors.textPrimary }]}>Grand Total</Text>
                <Text style={[fStyles.grandTotalVal, { color: colors.green }]}>{fmtCur(grandTotal)}</Text>
              </View>
            </View>
          )}

          {/* Notes */}
          <View style={fStyles.fieldGroup}>
            <Text style={[fStyles.fieldLabel, { color: colors.textSecondary }]}>Notes / Remarks</Text>
            <TextInput
              style={[fStyles.input, fStyles.textarea, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]}
              value={form.notes}
              onChangeText={v => setForm((f: any) => ({ ...f, notes: v }))}
              placeholder="Delivery instructions, payment terms..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Supplier Selection Modal */}
      <Modal visible={showSupPicker} transparent animationType="fade">
        <View style={fStyles.pickerModal}>
          <View style={[fStyles.pickerSheet, { backgroundColor: colors.bgCard }]}>
            <View style={[fStyles.pickerModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[fStyles.pickerModalTitle, { color: colors.textPrimary }]}>Select Supplier</Text>
              <TouchableOpacity onPress={() => setShowSupPicker(false)}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={[fStyles.searchRow, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <Feather name="search" size={14} color={colors.textMuted} />
              <TextInput
                style={[fStyles.searchInput, { color: colors.textPrimary }]}
                value={supSearch}
                onChangeText={setSupSearch}
                placeholder="Search suppliers..."
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <ScrollView style={{ maxHeight: 320 }}>
              {filteredSuppliers.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[fStyles.pickerItem, { borderBottomColor: colors.border }, form.supplierId === s.id && [fStyles.pickerItemActive, { backgroundColor: colors.accentGlow }]]}
                  onPress={() => { setForm((f: any) => ({ ...f, supplierId: s.id })); setShowSupPicker(false); }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[fStyles.pickerItemTxt, { color: colors.textPrimary }, form.supplierId === s.id && { color: colors.accentLight, fontWeight: '700' }]}>
                      {s.name}
                    </Text>
                    {s.phone && <Text style={{ fontSize: 11, color: colors.textMuted }}>{s.phone}</Text>}
                  </View>
                  {form.supplierId === s.id && <Feather name="check" size={16} color={colors.accentLight} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Product Selection Modal */}
      <Modal visible={showProdPicker} transparent animationType="fade">
        <View style={fStyles.pickerModal}>
          <View style={[fStyles.pickerSheet, { backgroundColor: colors.bgCard }]}>
            <View style={[fStyles.pickerModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[fStyles.pickerModalTitle, { color: colors.textPrimary }]}>Select Product</Text>
              <TouchableOpacity onPress={() => setShowProdPicker(false)}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={[fStyles.searchRow, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <Feather name="search" size={14} color={colors.textMuted} />
              <TextInput
                style={[fStyles.searchInput, { color: colors.textPrimary }]}
                value={prodSearch}
                onChangeText={setProdSearch}
                placeholder="Search product name, part number..."
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <ScrollView style={{ maxHeight: 340 }}>
              {filteredProducts.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[fStyles.pickerItem, { borderBottomColor: colors.border }]}
                  onPress={() => addItem(p)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[fStyles.pickerItemTxt, { color: colors.textPrimary }]}>{p.name}</Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      {p.partNumber ? `P/N: ${p.partNumber} · ` : ''}Purchase: ₹{p.purchasePrice || 0}
                    </Text>
                  </View>
                  <Feather name="plus-circle" size={18} color={colors.accentLight} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Goods Receiving Modal Component ──────────────────────────────────────────
function ReceiveGoodsModal({
  order, receivedQtys, setReceivedQtys, saving, onReceive, onClose
}: {
  order: any;
  receivedQtys: Record<string, string>;
  setReceivedQtys: (q: any) => void;
  saving: boolean;
  onReceive: () => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const items: any[] = order.items || [];

  const receiveAllRemaining = () => {
    const all: Record<string, string> = {};
    items.forEach((it: any) => {
      const remaining = (it.orderedQty || 0) - (it.receivedQty || 0);
      all[it.id] = remaining > 0 ? String(remaining) : '0';
    });
    setReceivedQtys(all);
  };

  return (
    <View style={rcStyles.overlay}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[rcStyles.sheet, { backgroundColor: colors.bgCard }]}>
        <View style={[rcStyles.handle, { backgroundColor: colors.border }]} />

        <View style={[rcStyles.header, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[rcStyles.title, { color: colors.textPrimary }]}>Receive Goods</Text>
            <Text style={[rcStyles.subTitle, { color: colors.textMuted }]}>{order.poNumber || `PO #${order.id.slice(-6)}`}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={rcStyles.closeBtn}>
            <Feather name="x" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={rcStyles.topActions}>
          <TouchableOpacity style={[rcStyles.quickFillBtn, { backgroundColor: colors.accentGlow, borderColor: colors.accent }]} onPress={receiveAllRemaining}>
            <Feather name="check-square" size={14} color={colors.accentLight} />
            <Text style={[rcStyles.quickFillTxt, { color: colors.accentLight }]}>Receive All Remaining</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ maxHeight: 360, paddingHorizontal: Spacing.lg }} showsVerticalScrollIndicator={false}>
          {items.map((it: any) => {
            const ordered = it.orderedQty || 0;
            const alreadyReceived = it.receivedQty || 0;
            const remaining = Math.max(0, ordered - alreadyReceived);

            return (
              <View key={it.id} style={[rcStyles.itemRow, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[rcStyles.itemName, { color: colors.textPrimary }]}>{it.product?.name || 'Product'}</Text>
                  <Text style={[rcStyles.itemMeta, { color: colors.textMuted }]}>
                    Ordered: {ordered} | Prev. Recv: {alreadyReceived} | Rem: {remaining}
                  </Text>
                </View>

                <View style={rcStyles.qtyInputWrapper}>
                  <Text style={[rcStyles.inputPrefix, { color: colors.textMuted }]}>Qty</Text>
                  <TextInput
                    style={[rcStyles.qtyInput, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]}
                    value={receivedQtys[it.id] || '0'}
                    keyboardType="number-pad"
                    onChangeText={v => setReceivedQtys((prev: any) => ({ ...prev, [it.id]: v }))}
                  />
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={[rcStyles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity style={[rcStyles.cancelBtn, { borderColor: colors.border }]} onPress={onClose}>
            <Text style={[rcStyles.cancelTxt, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[rcStyles.submitBtn, { backgroundColor: colors.accent }, saving && { opacity: 0.7 }]}
            onPress={onReceive}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={rcStyles.submitTxt}>Confirm Receipt</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  count: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  createBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  filterScrollWrapper: { marginBottom: Spacing.xs },
  filterBar: { paddingHorizontal: Spacing.lg, gap: 8, paddingBottom: 4 },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1,
    backgroundColor: Colors.bgCard, borderColor: Colors.border,
  },
  filterPillActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterPillTxt: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  filterPillTxtActive: { color: '#fff', fontWeight: '700' },
  list: { padding: Spacing.lg, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  poNumber: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  supplierName: { fontSize: 13, fontWeight: '600', color: Colors.accentLight, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusBadgeTxt: { fontSize: 11, fontWeight: '700' },
  cardDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  cardFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMetaCol: { gap: 2 },
  metaLabel: { fontSize: 10, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase' },
  metaValue: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  amountValue: { fontSize: 14, fontWeight: '800', color: Colors.green },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  emptyAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.accent, borderRadius: Radius.md,
    paddingHorizontal: 16, paddingVertical: 10, marginTop: 4,
  },
  emptyAddText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bgPrimary,
  },
});

const dtStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgCard },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  orderId: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  statusBadgeTxt: { fontSize: 10, fontWeight: '700' },
  supplier: { fontSize: 14, fontWeight: '600', color: Colors.accentLight, marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  body: { padding: Spacing.xl, paddingBottom: 40 },
  metricsGrid: { flexDirection: 'row', gap: 10, marginBottom: Spacing.lg },
  metricBox: {
    flex: 1, padding: Spacing.md, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  metricVal: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  metricLabel: { fontSize: 10, fontWeight: '600', color: Colors.textMuted, marginTop: 3 },
  infoCard: {
    borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg, gap: 8,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 12, color: Colors.textMuted },
  infoValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  actionBar: { flexDirection: 'row', gap: 10, marginBottom: Spacing.xl },
  actionPrimaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRadius: Radius.md, backgroundColor: Colors.accent,
  },
  actionPrimaryTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  actionSecondaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRadius: Radius.md, borderWidth: 1,
  },
  actionSecondaryTxt: { fontWeight: '700', fontSize: 13 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md },
  lineItemCard: {
    borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8, gap: 6,
  },
  lineItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  lineItemName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  lineItemPart: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  lineItemPrice: { fontSize: 14, fontWeight: '800', color: Colors.green },
  lineItemDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineItemRate: { fontSize: 12, color: Colors.textSecondary },
  progressTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm },
  progressTagTxt: { fontSize: 10, fontWeight: '700' },
  notesBox: {
    borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.lg,
  },
  notesTitle: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 4 },
  notesContent: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
});

const fStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  closeBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  saveBtn: {
    backgroundColor: Colors.accent, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: Radius.md, minWidth: 64, alignItems: 'center',
  },
  saveTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  body: { padding: Spacing.lg, gap: Spacing.md },
  sectionHeader: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.8, marginTop: Spacing.sm },
  fieldGroup: { gap: 5 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.bgCard, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10,
    color: Colors.textPrimary, fontSize: 14,
  },
  textarea: { height: 70, textAlignVertical: 'top' },
  picker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.bgCard, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 12,
  },
  pickerTxt: { fontSize: 14, color: Colors.textPrimary, flex: 1 },
  itemsHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing.md,
  },
  addItemBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.md, borderWidth: 1,
  },
  addItemTxt: { fontSize: 12, fontWeight: '700' },
  emptyItemsBox: {
    borderRadius: Radius.lg, borderWidth: 1.5, borderStyle: 'dashed',
    padding: Spacing.xl, alignItems: 'center', gap: 8,
  },
  emptyItemsTxt: { fontSize: 13, color: Colors.textMuted },
  addFirstItemBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.md,
  },
  addFirstItemTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  itemCard: {
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: Spacing.sm,
  },
  itemCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  itemPart: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  itemControlsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyWrapper: { flex: 1.2 },
  controlLabel: { fontSize: 10, fontWeight: '600', color: Colors.textMuted, marginBottom: 3 },
  qtyRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderRadius: Radius.md, overflow: 'hidden',
  },
  qtyBtn: { width: 28, height: 32, alignItems: 'center', justifyContent: 'center' },
  qtyInput: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', paddingVertical: 2 },
  rateWrapper: { flex: 1 },
  rateInput: {
    borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 8,
    paddingVertical: 5, fontSize: 13, fontWeight: '600', textAlign: 'center',
  },
  lineTotalWrapper: { flex: 1, alignItems: 'flex-end' },
  lineTotalTxt: { fontSize: 14, fontWeight: '800', color: Colors.green, marginTop: 6 },
  summaryCard: {
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: 6,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: Colors.textSecondary },
  summaryVal: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  summaryDivider: { height: 1, marginVertical: 4 },
  grandTotalLabel: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  grandTotalVal: { fontSize: 16, fontWeight: '800', color: Colors.green },

  // Modals
  pickerModal: {
    flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)',
    padding: Spacing.xl,
  },
  pickerSheet: { borderRadius: Radius.xl, maxHeight: '80%', overflow: 'hidden' },
  pickerModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg, borderBottomWidth: 1,
  },
  pickerModalTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: Spacing.md, borderRadius: Radius.md,
    paddingHorizontal: 10, borderWidth: 1,
  },
  searchInput: { flex: 1, paddingVertical: 8, fontSize: 13 },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: 12, borderBottomWidth: 1,
  },
  pickerItemActive: {},
  pickerItemTxt: { fontSize: 14, fontWeight: '600' },
});

const rcStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.xl, borderBottomWidth: 1,
  },
  title: { fontSize: 17, fontWeight: '800' },
  subTitle: { fontSize: 12, marginTop: 2 },
  closeBtn: { padding: 4 },
  topActions: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
  quickFillBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 8, borderRadius: Radius.md, borderWidth: 1,
  },
  quickFillTxt: { fontSize: 12, fontWeight: '700' },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: Radius.md, borderWidth: 1,
    padding: Spacing.md, marginBottom: 8,
  },
  itemName: { fontSize: 13, fontWeight: '700' },
  itemMeta: { fontSize: 11, marginTop: 2 },
  qtyInputWrapper: { width: 80, alignItems: 'center' },
  inputPrefix: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  qtyInput: {
    width: '100%', borderWidth: 1, borderRadius: Radius.sm,
    textAlign: 'center', fontSize: 14, fontWeight: '700', paddingVertical: 4,
  },
  footer: {
    flexDirection: 'row', gap: Spacing.md, padding: Spacing.xl,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: Radius.md,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  cancelTxt: { fontWeight: '600' },
  submitBtn: {
    flex: 2, paddingVertical: 12, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  submitTxt: { color: '#fff', fontWeight: '700' },
});
