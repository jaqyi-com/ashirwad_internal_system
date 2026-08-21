import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { formatCurrency, formatNumber, getStockStatus, GST_SLABS } from '../../utils/helpers';
import {
  Plus, Search, Edit2, Trash2, X, Upload, Package, ChevronDown,
  Eye, Filter, MoreVertical
} from 'lucide-react';
import toast from 'react-hot-toast';

const INITIAL_FORM = {
  name: '', sku: '', partNumber: '', description: '', specifications: '',
  categoryId: '', company: '', supplierId: 'ashirwad-default', location: '0',
  price: '0', purchasePrice: '0', gstPercent: '18', minStock: '0',
  currentStock: '0', unit: 'pcs', coatingTypeId: '', barcode: '',
  customGst: '',
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [coatings, setCoatings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [productImageFile, setProductImageFile] = useState(null);
  const [designImageFile, setDesignImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [designImagePreview, setDesignImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [useCustomGst, setUseCustomGst] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const productImgRef = useRef();
  const designImgRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const params = { search, page, limit: 20 };
      if (filterCategory) params.categoryId = filterCategory;
      const { data } = await api.get('/products', { params });
      setProducts(data.products);
      setTotal(data.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadMeta = async () => {
    const [catRes, supRes, coatRes] = await Promise.all([
      api.get('/categories'),
      api.get('/suppliers'),
      api.get('/coatings'),
    ]);
    setCategories(catRes.data);
    setSuppliers(supRes.data);
    setCoatings(coatRes.data);
  };

  useEffect(() => { load(); }, [search, page, filterCategory]);
  useEffect(() => { loadMeta(); }, []);

  const openAdd = () => {
    setEditProduct(null);
    setForm(INITIAL_FORM);
    setProductImageFile(null); setDesignImageFile(null);
    setProductImagePreview(null); setDesignImagePreview(null);
    setUseCustomGst(false);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    const isCustomGst = !GST_SLABS.find(s => s.value === parseFloat(p.gstPercent));
    setUseCustomGst(isCustomGst);
    setForm({
      name: p.name || '',
      sku: p.sku || '',
      partNumber: p.partNumber || '',
      description: p.description || '',
      specifications: p.specifications || '',
      categoryId: p.categoryId || '',
      company: p.company || '',
      supplierId: p.supplierId || '',
      location: p.location || '0',
      price: String(p.price || '0'),
      purchasePrice: String(p.purchasePrice || '0'),
      gstPercent: String(p.gstPercent || '18'),
      minStock: String(p.minStock || '0'),
      currentStock: String(p.currentStock || '0'),
      unit: p.unit || 'pcs',
      coatingTypeId: p.coatingTypeId || '',
      barcode: p.barcode || '',
      customGst: isCustomGst ? String(p.gstPercent) : '',
    });
    setProductImagePreview(p.productImage ? `/uploads/products/${p.productImage.split('/').pop()}` : null);
    setDesignImagePreview(p.designImage ? `/uploads/products/${p.designImage.split('/').pop()}` : null);
    setProductImageFile(null); setDesignImageFile(null);
    setShowModal(true);
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'product') { setProductImageFile(file); setProductImagePreview(url); }
    else { setDesignImageFile(file); setDesignImagePreview(url); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      const finalGst = useCustomGst ? form.customGst : form.gstPercent;
      Object.entries({ ...form, gstPercent: finalGst }).forEach(([k, v]) => {
        if (k !== 'customGst' && v !== '') fd.append(k, v);
      });
      if (productImageFile) fd.append('productImage', productImageFile);
      if (designImageFile) fd.append('designImage', designImageFile);

      if (editProduct) {
        await api.put(`/products/${editProduct.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product updated!');
      } else {
        await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product added!');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error saving product');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      load();
    } catch { toast.error('Error deleting product'); }
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            placeholder="Search products, SKU, part number..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 180 }}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, fontSize: '13px', color: 'var(--text-secondary)' }}>
        <span>{formatNumber(total)} products</span>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Package size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <Package size={48} />
            <h3>No products found</h3>
            <p>{search ? 'Try a different search term' : 'Add your first product'}</p>
            <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: 8 }}>
              <Plus size={16} /> Add Product
            </button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU / Part No.</th>
                <th>Category</th>
                <th>Supplier</th>
                <th>Location</th>
                <th>Price (₹)</th>
                <th>GST</th>
                <th>Stock</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const status = getStockStatus(p.currentStock, p.minStock);
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {p.productImage ? (
                          <img
                            src={p.productImage}
                            alt={p.name}
                            style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }}
                          />
                        ) : (
                          <div style={{
                            width: 36, height: 36, borderRadius: 8,
                            background: 'var(--bg-secondary)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Package size={16} style={{ color: 'var(--text-muted)' }} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          {p.company && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.company}</div>}
                          {p.coatingType && (
                            <span className="badge badge-blue" style={{ marginTop: 2 }}>{p.coatingType.name}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {p.sku && <div className="mono" style={{ fontSize: '12px' }}>{p.sku}</div>}
                      {p.partNumber && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>P/N: {p.partNumber}</div>}
                    </td>
                    <td>
                      {p.category ? (
                        <span className="badge badge-blue">{p.category.name}</span>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {p.supplier?.name || '—'}
                    </td>
                    <td>
                      {p.location ? (
                        <span className="badge badge-gray">📦 {p.location}</span>
                      ) : '—'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(p.price)}</td>
                    <td><span className="badge badge-gray">{p.gstPercent}%</span></td>
                    <td style={{ fontWeight: 700, fontSize: '15px' }}>{formatNumber(p.currentStock)}</td>
                    <td><span className={`badge ${status.className}`}>{status.label}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(p)} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(p.id)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span style={{ padding: '6px 12px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button className="btn btn-secondary btn-sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2>{editProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Basic Info */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Basic Information
                  </div>
                  <div className="grid-2" style={{ gap: 12 }}>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Product Name <span>*</span></label>
                      <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter product name" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select className="form-select" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Company / Brand</label>
                      <input className="form-input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Manufacturer or brand" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Supplier</label>
                      <select className="form-select" value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })}>
                        <option value="">Select Supplier</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Location (Shelf No.)</label>
                      <input className="form-input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. A-12, Shelf 3" />
                    </div>
                  </div>
                </div>

                {/* SKU & Part Number */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Identification
                  </div>
                  <div className="grid-2" style={{ gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">SKU</label>
                      <input className="form-input mono" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="e.g. PRD-001" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Part Number</label>
                      <input className="form-input mono" value={form.partNumber} onChange={e => setForm({ ...form, partNumber: e.target.value })} placeholder="Manufacturer part number" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Unit</label>
                      <select className="form-select" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                        {['pcs', 'kg', 'g', 'litre', 'ml', 'meter', 'cm', 'box', 'set', 'pair', 'roll'].map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Barcode</label>
                      <input className="form-input mono" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} placeholder="Barcode / QR" />
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Pricing & Stock
                  </div>
                  <div className="grid-3" style={{ gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Selling Price (₹)</label>
                      <input type="number" min="0" step="0.01" className="form-input" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Purchase Price (₹)</label>
                      <input type="number" min="0" step="0.01" className="form-input" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">GST</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <select
                          className="form-select"
                          value={useCustomGst ? 'custom' : form.gstPercent}
                          onChange={e => {
                            if (e.target.value === 'custom') {
                              setUseCustomGst(true);
                            } else {
                              setUseCustomGst(false);
                              setForm({ ...form, gstPercent: e.target.value });
                            }
                          }}
                        >
                          <option value="">Select GST</option>
                          {GST_SLABS.map(s => <option key={s.value} value={String(s.value)}>{s.label}</option>)}
                          <option value="custom">Custom %</option>
                        </select>
                        {useCustomGst && (
                          <input
                            type="number" min="0" max="100" step="0.1"
                            className="form-input"
                            placeholder="Enter custom GST %"
                            value={form.customGst}
                            onChange={e => setForm({ ...form, customGst: e.target.value })}
                          />
                        )}
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Current Stock</label>
                      <input type="number" min="0" className="form-input" value={form.currentStock} onChange={e => setForm({ ...form, currentStock: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Min. Stock (Alert Level)</label>
                      <input type="number" min="0" className="form-input" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Coating Info */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Coating Info
                  </div>
                  <div className="form-group">
                    <label className="form-label">Choose a Coating Type</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, coatingTypeId: '' })}
                        className={`btn btn-sm ${!form.coatingTypeId ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        None
                      </button>
                      {coatings.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setForm({ ...form, coatingTypeId: c.id })}
                          className={`btn btn-sm ${form.coatingTypeId === c.id ? 'btn-primary' : 'btn-secondary'}`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Images
                  </div>
                  <div className="grid-2" style={{ gap: 12 }}>
                    {/* Product Image */}
                    <div className="form-group">
                      <label className="form-label">Product Image</label>
                      {productImagePreview ? (
                        <div className="image-preview">
                          <img src={productImagePreview} alt="Product" />
                          <button
                            type="button"
                            className="image-preview-remove"
                            onClick={() => { setProductImageFile(null); setProductImagePreview(null); }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="upload-zone" onClick={() => productImgRef.current.click()}>
                          <div className="upload-zone-icon">📷</div>
                          <div className="upload-zone-text">
                            <strong>Upload Product Image</strong><br />
                            PNG, JPG up to 5MB
                          </div>
                        </div>
                      )}
                      <input ref={productImgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFileChange(e, 'product')} />
                    </div>

                    {/* Design Image */}
                    <div className="form-group">
                      <label className="form-label">Design Image</label>
                      {designImagePreview ? (
                        <div className="image-preview">
                          <img src={designImagePreview} alt="Design" />
                          <button
                            type="button"
                            className="image-preview-remove"
                            onClick={() => { setDesignImageFile(null); setDesignImagePreview(null); }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="upload-zone" onClick={() => designImgRef.current.click()}>
                          <div className="upload-zone-icon">🎨</div>
                          <div className="upload-zone-text">
                            <strong>Upload Design Image</strong><br />
                            PNG, JPG up to 5MB
                          </div>
                        </div>
                      )}
                      <input ref={designImgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFileChange(e, 'design')} />
                    </div>
                  </div>
                </div>

                {/* Specifications & Description */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Details
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Specifications</label>
                      <textarea
                        className="form-textarea"
                        value={form.specifications}
                        onChange={e => setForm({ ...form, specifications: e.target.value })}
                        placeholder="Technical specifications, dimensions, material, etc."
                        rows={3}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-textarea"
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        placeholder="Product description..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
