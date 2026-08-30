import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { formatCurrency, formatNumber, getStockStatus, GST_SLABS } from '../../utils/helpers';
import {
  Plus, Search, Edit2, Trash2, X, Package, Eye, ImagePlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ProductDetailModal from './ProductDetailModal';
import imageCompression from 'browser-image-compression';

const INITIAL_FORM = {
  name: '', partNumber: '', description: '', specifications: '',
  categoryId: '', company: '', supplierId: '', location: '',
  price: '0', purchasePrice: '0', gstPercent: '18',
  currentStock: '0', unit: 'pcs', coatingTypeId: '', barcode: '',
  customGst: '',
};

export default function Products() {
  const [products, setProducts]       = useState([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [categories, setCategories]   = useState([]);
  const [suppliers, setSuppliers]     = useState([]);
  const [coatings, setCoatings]       = useState([]);
  const [showModal, setShowModal]     = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);
  const [form, setForm]               = useState(INITIAL_FORM);

  // Image state — track NEW files + which EXISTING indices to remove
  // (we never send existing base64 data back to server — avoids body size limits)
  const [removedProductIdxs, setRemovedProductIdxs] = useState(new Set());
  const [removedDesignIdxs,  setRemovedDesignIdxs]  = useState(new Set());
  const [newProductFiles, setNewProductFiles] = useState([]); // { file, preview }
  const [newDesignFiles,  setNewDesignFiles]  = useState([]); // { file, preview }

  const [saving, setSaving]           = useState(false);
  const [page, setPage]               = useState(1);
  const [useCustomGst, setUseCustomGst] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const productImgRef = useRef();
  const designImgRef  = useRef();

  // ─── Data loading ────────────────────────────
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
      api.get('/categories'), api.get('/suppliers'), api.get('/coatings'),
    ]);
    setCategories(catRes.data);
    setSuppliers(supRes.data);
    setCoatings(coatRes.data);
  };

  useEffect(() => { load(); }, [search, page, filterCategory]);
  useEffect(() => { loadMeta(); }, []);

  // ─── Modal helpers ───────────────────────────
  const resetImageState = () => {
    setRemovedProductIdxs(new Set());
    setRemovedDesignIdxs(new Set());
    setNewProductFiles([]);
    setNewDesignFiles([]);
  };

  const openAdd = () => {
    setEditProduct(null);
    setForm(INITIAL_FORM);
    resetImageState();
    setUseCustomGst(false);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    const isCustomGst = !GST_SLABS.find(s => s.value === parseFloat(p.gstPercent));
    setUseCustomGst(isCustomGst);
    setForm({
      name:           p.name          || '',
      partNumber:     p.partNumber    || '',
      description:    p.description   || '',
      specifications: p.specifications || '',
      categoryId:     p.categoryId    || '',
      company:        p.company       || '',
      supplierId:     p.supplierId    || '',
      location:       p.location      || '',
      price:          String(p.price          || '0'),
      purchasePrice:  String(p.purchasePrice  || '0'),
      gstPercent:     String(p.gstPercent     || '18'),
      currentStock:   String(p.currentStock   || '0'),
      unit:           p.unit          || 'pcs',
      coatingTypeId:  p.coatingTypeId || '',
      barcode:        p.barcode       || '',
      customGst:      isCustomGst ? String(p.gstPercent) : '',
    });
    resetImageState();
    setShowModal(true);
  };

  // ─── Image management ────────────────────────
  const addFiles = async (e, type) => {
    const files = Array.from(e.target.files);
    e.target.value = ''; // Reset input early

    toast.loading('Compressing images...', { id: 'compress' });
    try {
      const compressedItems = await Promise.all(files.map(async (f) => {
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: false };
        const compressedFile = await imageCompression(f, options);
        return { file: compressedFile, preview: URL.createObjectURL(compressedFile) };
      }));
      
      if (type === 'product') setNewProductFiles(prev => [...prev, ...compressedItems]);
      else setNewDesignFiles(prev => [...prev, ...compressedItems]);
      
      toast.success('Images optimized', { id: 'compress' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to compress some images', { id: 'compress' });
      // Fallback
      const items = files.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
      if (type === 'product') setNewProductFiles(prev => [...prev, ...items]);
      else setNewDesignFiles(prev => [...prev, ...items]);
    }
  };

  const removeExistingImg = (idx, type) => {
    if (type === 'product') setRemovedProductIdxs(prev => new Set([...prev, idx]));
    else setRemovedDesignIdxs(prev => new Set([...prev, idx]));
  };

  const removeNewImg = (idx, type) => {
    if (type === 'product') setNewProductFiles(prev => prev.filter((_, i) => i !== idx));
    else setNewDesignFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Current visible existing images (excluding removed)
  const visibleProductImgs = (editProduct?.productImages || []).filter((_, i) => !removedProductIdxs.has(i));
  const visibleDesignImgs  = (editProduct?.designImages  || []).filter((_, i) => !removedDesignIdxs.has(i));
  const totalProductImgs   = visibleProductImgs.length + newProductFiles.length;
  const totalDesignImgs    = visibleDesignImgs.length  + newDesignFiles.length;

  // ─── Submit ──────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const finalGst = useCustomGst ? form.customGst : form.gstPercent;

      // Step 1: Save metadata as plain JSON (no multipart — always works through Vercel proxy)
      const payload = {
        name:           form.name,
        partNumber:     form.partNumber     || null,
        description:    form.description    || null,
        specifications: form.specifications || null,
        categoryId:     form.categoryId     || null,
        company:        form.company        || null,
        supplierId:     form.supplierId     || null,
        location:       form.location       || null,
        price:          form.price,
        purchasePrice:  form.purchasePrice,
        gstPercent:     finalGst,
        currentStock:   form.currentStock,
        unit:           form.unit,
        coatingTypeId:  form.coatingTypeId  || null,
        barcode:        form.barcode        || null,
      };

      let savedProduct;
      if (editProduct) {
        const { data } = await api.put(`/products/${editProduct.id}`, payload);
        savedProduct = data;
      } else {
        const { data } = await api.post('/products', payload);
        savedProduct = data;
      }

      // Step 2: Handle image changes via separate FormData POST (only when needed)
      const hasRemovals = removedProductIdxs.size > 0 || removedDesignIdxs.size > 0;
      const hasNewFiles = newProductFiles.length > 0   || newDesignFiles.length > 0;

      if (hasRemovals || hasNewFiles) {
        const fd = new FormData();
        fd.append('removeProductImageIndices', JSON.stringify([...removedProductIdxs]));
        fd.append('removeDesignImageIndices',  JSON.stringify([...removedDesignIdxs]));
        newProductFiles.forEach(({ file }) => fd.append('productImages', file));
        newDesignFiles.forEach(({ file })  => fd.append('designImages', file));
        await api.post(`/products/${savedProduct.id}/images`, fd);
      }

      toast.success(editProduct ? 'Product updated!' : 'Product added!');
      setShowModal(false);
      load();
    } catch (err) {
      console.error('Save error:', err?.response?.data || err.message);
      toast.error(err.response?.data?.error || err.message || 'Error saving product');
    } finally { setSaving(false); }
  };


  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await api.delete(`/products/${id}`); toast.success('Product deleted'); load(); }
    catch { toast.error('Error deleting product'); }
  };

  // ─── Render ───────────────────────────────────
  return (
    <div>
      {/* Toolbar */}
      <div className="products-toolbar">
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input placeholder="Search products, part number..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="form-select" value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div style={{ marginBottom: 16, fontSize: '13px', color: 'var(--text-secondary)' }}>
        {formatNumber(total)} products
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
                <th className="hide-mobile">Part No.</th>
                <th className="hide-mobile">Category</th>
                <th className="hide-tablet">Supplier</th>
                <th className="hide-tablet">Location</th>
                <th>Price (₹)</th>
                <th className="hide-mobile">GST</th>
                <th>Stock</th>
                <th className="hide-mobile">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const status = getStockStatus(p.currentStock, p.minStock);
                const thumb = p.productImages?.[0] || p.designImages?.[0];
                return (
                  <tr key={p.id} className="product-row" onClick={() => setDetailProduct(p)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {thumb ? (
                          <img src={thumb} alt={p.name} className="product-thumb" />
                        ) : (
                          <div className="product-thumb-placeholder">
                            <Package size={16} style={{ color: 'var(--text-muted)' }} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          {p.company && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.company}</div>}
                          {p.coatingType && <span className="badge badge-blue" style={{ marginTop: 2 }}>{p.coatingType.name}</span>}
                          {((p.productImages?.length || 0) + (p.designImages?.length || 0)) > 0 && (
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 4 }}>
                              📷 {(p.productImages?.length || 0) + (p.designImages?.length || 0)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hide-mobile">
                      {p.partNumber && <div style={{ fontSize: '12px' }}>{p.partNumber}</div>}
                    </td>
                    <td className="hide-mobile">
                      {p.category ? <span className="badge badge-blue">{p.category.name}</span> : '—'}
                    </td>
                    <td className="hide-tablet" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {p.supplier?.name || '—'}
                    </td>
                    <td className="hide-tablet">
                      {p.location ? <span className="badge badge-gray">📦 {p.location}</span> : '—'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(p.price)}</td>
                    <td className="hide-mobile"><span className="badge badge-gray">{p.gstPercent}%</span></td>
                    <td style={{ fontWeight: 700, fontSize: '15px' }}>{formatNumber(p.currentStock)}</td>
                    <td className="hide-mobile"><span className={`badge ${status.className}`}>{status.label}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setDetailProduct(p)} title="View"><Eye size={14} /></button>
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(p)} title="Edit"><Edit2 size={14} /></button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(p.id)} title="Delete"><Trash2 size={14} /></button>
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

      {/* Product Detail Modal */}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
          onEdit={(p) => { setDetailProduct(null); openEdit(p); }}
        />
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2>{editProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Basic Info */}
                <Section title="Basic Information">
                  <div className="grid-2" style={{ gap: 12 }}>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Product Name <span>*</span></label>
                      <input className="form-input" value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="Enter product name" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select className="form-select" value={form.categoryId}
                        onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Supplier</label>
                      <select className="form-select" value={form.supplierId}
                        onChange={e => setForm({ ...form, supplierId: e.target.value })}>
                        <option value="">Select Supplier</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Location (Shelf No.)</label>
                      <input className="form-input" value={form.location}
                        onChange={e => setForm({ ...form, location: e.target.value })}
                        placeholder="e.g. A-12, Shelf 3" />
                    </div>
                  </div>
                </Section>

                {/* Identification */}
                <Section title="Identification">
                  <div className="grid-2" style={{ gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Part Number</label>
                      <input className="form-input mono" value={form.partNumber}
                        onChange={e => setForm({ ...form, partNumber: e.target.value })}
                        placeholder="Manufacturer part number" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Unit</label>
                      <select className="form-select" value={form.unit}
                        onChange={e => setForm({ ...form, unit: e.target.value })}>
                        {['pcs', 'kg', 'g', 'litre', 'ml', 'meter', 'cm', 'box', 'set', 'pair', 'roll'].map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Barcode</label>
                      <input className="form-input mono" value={form.barcode}
                        onChange={e => setForm({ ...form, barcode: e.target.value })}
                        placeholder="Barcode / QR value" />
                    </div>
                  </div>
                </Section>

                {/* Pricing & Stock */}
                <Section title="Pricing & Stock">
                  <div className="grid-3" style={{ gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Selling Price (₹)</label>
                      <input type="number" min="0" step="0.01" className="form-input"
                        value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">GST</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <select className="form-select" value={useCustomGst ? 'custom' : form.gstPercent}
                          onChange={e => {
                            if (e.target.value === 'custom') setUseCustomGst(true);
                            else { setUseCustomGst(false); setForm({ ...form, gstPercent: e.target.value }); }
                          }}>
                          <option value="">Select GST</option>
                          {GST_SLABS.map(s => <option key={s.value} value={String(s.value)}>{s.label}</option>)}
                          <option value="custom">Custom %</option>
                        </select>
                        {useCustomGst && (
                          <input type="number" min="0" max="100" step="0.1" className="form-input"
                            placeholder="Enter custom GST %" value={form.customGst}
                            onChange={e => setForm({ ...form, customGst: e.target.value })} />
                        )}
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Current Stock</label>
                      <input type="number" min="0" className="form-input"
                        value={form.currentStock} onChange={e => setForm({ ...form, currentStock: e.target.value })} />
                    </div>
                  </div>
                </Section>

                {/* Coating */}
                <Section title="Coating Info">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button type="button" onClick={() => setForm({ ...form, coatingTypeId: '' })}
                      className={`btn btn-sm ${!form.coatingTypeId ? 'btn-primary' : 'btn-secondary'}`}>None</button>
                    {coatings.map(c => (
                      <button key={c.id} type="button" onClick={() => setForm({ ...form, coatingTypeId: c.id })}
                        className={`btn btn-sm ${form.coatingTypeId === c.id ? 'btn-primary' : 'btn-secondary'}`}>{c.name}</button>
                    ))}
                  </div>
                </Section>

                {/* Images */}
                <Section title="Images">
                  <ImageUploadGrid
                    label="📷 Product Images"
                    existingImgs={editProduct?.productImages || []}
                    removedIdxs={removedProductIdxs}
                    newFiles={newProductFiles}
                    onRemoveExisting={idx => removeExistingImg(idx, 'product')}
                    onRemoveNew={idx => removeNewImg(idx, 'product')}
                    onAdd={() => productImgRef.current.click()}
                    total={totalProductImgs}
                  />
                  <input ref={productImgRef} type="file" accept="image/*" multiple
                    style={{ display: 'none' }} onChange={e => addFiles(e, 'product')} />

                  <div style={{ marginTop: 14 }}>
                    <ImageUploadGrid
                      label="🎨 Design Images"
                      existingImgs={editProduct?.designImages || []}
                      removedIdxs={removedDesignIdxs}
                      newFiles={newDesignFiles}
                      onRemoveExisting={idx => removeExistingImg(idx, 'design')}
                      onRemoveNew={idx => removeNewImg(idx, 'design')}
                      onAdd={() => designImgRef.current.click()}
                      total={totalDesignImgs}
                    />
                    <input ref={designImgRef} type="file" accept="image/*" multiple
                      style={{ display: 'none' }} onChange={e => addFiles(e, 'design')} />
                  </div>
                </Section>

                {/* Details */}
                <Section title="Details">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Specifications</label>
                      <textarea className="form-textarea" value={form.specifications}
                        onChange={e => setForm({ ...form, specifications: e.target.value })}
                        placeholder="Technical specifications, dimensions, material, etc." rows={3} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea className="form-textarea" value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        placeholder="Product description..." rows={3} />
                    </div>
                  </div>
                </Section>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper components ─────────────────────────────────────

function Section({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ImageUploadGrid({ label, existingImgs, removedIdxs, newFiles, onRemoveExisting, onRemoveNew, onAdd, total }) {
  return (
    <div className="form-group">
      <label className="form-label" style={{ marginBottom: 10 }}>
        {label}
        <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
          ({total} added, up to 10)
        </span>
      </label>
      <div className="multi-image-grid">
        {/* Existing images from DB */}
        {existingImgs.map((src, i) => !removedIdxs.has(i) && (
          <div key={`e-${i}`} className="multi-image-item">
            <img src={src} alt={`img-${i}`} />
            <button type="button" className="multi-image-remove" onClick={() => onRemoveExisting(i)}>
              <X size={10} />
            </button>
          </div>
        ))}
        {/* New uploads */}
        {newFiles.map(({ preview }, i) => (
          <div key={`n-${i}`} className="multi-image-item new">
            <img src={preview} alt={`new-${i}`} />
            <button type="button" className="multi-image-remove" onClick={() => onRemoveNew(i)}>
              <X size={10} />
            </button>
            <div className="multi-image-new-badge">NEW</div>
          </div>
        ))}
        {/* Add button */}
        {total < 10 && (
          <div className="multi-image-add" onClick={onAdd}>
            <ImagePlus size={20} />
            <span>Add</span>
          </div>
        )}
      </div>
    </div>
  );
}
