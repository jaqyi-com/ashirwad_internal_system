export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export const formatNumber = (n) =>
  new Intl.NumberFormat('en-IN').format(n || 0);

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStockStatus = (current, min) => {
  if (current <= 0) return { label: 'Out of Stock', className: 'badge-red' };
  if (current <= min) return { label: 'Low Stock', className: 'badge-yellow' };
  return { label: 'In Stock', className: 'badge-green' };
};

export const getStatusBadge = (status) => {
  const map = {
    DRAFT: 'badge-gray',
    PENDING: 'badge-yellow',
    APPROVED: 'badge-blue',
    PARTIALLY_RECEIVED: 'badge-orange',
    RECEIVED: 'badge-green',
    CANCELLED: 'badge-red',
    CONFIRMED: 'badge-blue',
    INVOICED: 'badge-purple',
    PAID: 'badge-green',
  };
  return map[status] || 'badge-gray';
};

export const GST_SLABS = [
  { label: '0% GST', value: 0 },
  { label: '5% GST', value: 5 },
  { label: '12% GST', value: 12 },
  { label: '18% GST', value: 18 },
  { label: '28% GST', value: 28 },
];

export const TRANSACTION_TYPE_LABELS = {
  PURCHASE: { label: 'Purchase IN', color: 'var(--green)', sign: '+' },
  SALE: { label: 'Sale OUT', color: 'var(--red)', sign: '-' },
  RETURN_IN: { label: 'Return IN', color: 'var(--green)', sign: '+' },
  RETURN_OUT: { label: 'Return OUT', color: 'var(--red)', sign: '-' },
  ADJUSTMENT_IN: { label: 'Adj. IN', color: 'var(--blue)', sign: '+' },
  ADJUSTMENT_OUT: { label: 'Adj. OUT', color: 'var(--yellow)', sign: '-' },
  TRANSFER_IN: { label: 'Transfer IN', color: 'var(--green)', sign: '+' },
  TRANSFER_OUT: { label: 'Transfer OUT', color: 'var(--red)', sign: '-' },
  DAMAGE: { label: 'Damage', color: 'var(--red)', sign: '-' },
  EXPIRED: { label: 'Expired', color: 'var(--red)', sign: '-' },
  OPENING_STOCK: { label: 'Opening Stock', color: 'var(--purple)', sign: '+' },
};
