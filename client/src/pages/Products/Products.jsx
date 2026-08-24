import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { formatCurrency, formatNumber, getStockStatus, GST_SLABS } from '../../utils/helpers';
import {
  Plus, Search, Edit2, Trash2, X, Package,
  Eye, ImagePlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ProductDetailModal from './ProductDetailModal';

const INITIAL_FORM = {
  name: '', partNumber: '', description: '', specifications: '',
  categoryId: '', company: '', supplierId: '', location: '0',
  price: '0', purchasePrice: '0', gstPercent: '18', minStock: '0',
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
  // Multiple images: arrays of { file, preview } for new uploads + existing strings
  const [productImages, setProductImages] = useState([]); // existing base64 strings
  const [designImages, setDesignImages]   = useState([]);
  const [newProductFiles, setNewProductFiles] = useState([]); // { file, preview }
  const [newDesignFiles, setNewDesignFiles]   = useState([]);
  const [saving, setSaving]           = useState(false);
  const [page, setPage]               = useState(1);
  const [useCustomGst, setUseCustomGst] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const productImgRef = useRef();
  const designImgRef  = useRef();

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

  const resetImageState = () => {
    setProductImages([]); setDesignImages([]);
    setNewProductFiles([]); setNewDesignFiles([]);
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
      name: p.name || '', partNumber: p.partNumber || '',
      description: p.description || '', specifications: p.specifications || '',
      categoryId: p.categoryId || '', company: p.company || '',
      supplierId: p.supplierId || '', location: p.location || '0',
      price: String(p.price || '0'), purchasePrice: String(p.purchasePrice || '0'),
      gstPercent: String(p.gstPercent || '18'), minStock: String(p.minStock || '0'),
      currentStock: String(p.currentStock || '0'), unit: p.unit || 'pcs',
      coatingTypeId: p.coatingTypeId || '', barcode: p.barcode || '',
      customGst: isCustomGst ? String(p.gstPercent) : '',
    });
    setProductImages(p.productImages || []);
    setDesignImages(p.designImages || []);
    setNewProductFiles([]); setNewDesignFiles([]);
    setShowModal(true);
  };

  const addFiles = (e, type) => {
    const files = Array.from(e.target.files);
    const items = files.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    if (type === 'product') setNewProductFiles(prev => [...prev, ...items]);
    else setNewDesignFiles(prev => [...prev, ...items]);
    e.target.value = ''; // reset so same file can be re-added
  };

  const removeExisting = (idx, type) => {
    if (type === 'product') setProductImages(prev => prev.filter((_, i) => i !== idx));
    else setDesignImages(prev => prev.filter((_, i) => i !== idx));
  };

  const removeNew = (idx, type) => {
    if (type === 'product') setNewProductFiles(prev => prev.filter((_, i) => i !== idx));
    else setNewDesignFiles(prev => prev.filter((_, i) => i !== idx));
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

      // Pass existing images as JSON so backend knows which to keep
      fd.append('existingProductImages', JSON.stringify(productImages));
      fd.append('existingDesignImages',  JSON.stringify(designImages));

      // Attach new files
      newProductFiles.forEach(({ file }) => fd.append('productImages', file));
      newDesignFiles.forEach(({ file })  => fd.append('designImages', file));

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
    try { await api.delete(`/products/${id}`); toast.success('Product deleted'); load(); }
    catch { toast.error('Error deleting product'); }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="products-toolbar">
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input placeholder="Search products, SKU, part number..." value={search}
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
                          {/* Show img count badge */}
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
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setDetailProduct(p)} title="View">
                          <Eye size={14} />
                        </button>
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

      {/* Product Detail Modal */}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
          onEdit={(p) => { setDetailProduct(null); openEdit(p); }}
        />
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
                <Section title="Basic Information">
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
                </Section>

                {/* Identification */}
                <Section title="Identification">
                  <div className="grid-2" style={{ gap: 12 }}>
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
                </Section>

                {/* Pricing */}
                <Section title="Pricing & Stock">
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
                        <select className="form-select" value={useCustomGst ? 'custom' : form.gstPercent}
                          onChange={e => {
                            if (e.target.value === 'custom') { setUseCustomGst(true); }
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
                      <input type="number" min="0" className="form-input" value={form.currentStock} onChange={e => setForm({ ...form, currentStock: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Min. Stock (Alert Level)</label>
                      <input type="number" min="0" className="form-input" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} />
                    </div>
                  </div>
                </Section>

                {/* Coating */}
                <Section title="Coating Info">
                  <div className="form-group">
                    <label className="form-label">Choose a Coating Type</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <button type="button" onClick={() => setForm({ ...form, coatingTypeId: '' })}
                        className={`btn btn-sm ${!form.coatingTypeId ? 'btn-primary' : 'btn-secondary'}`}>None</button>
                      {coatings.map(c => (
                        <button key={c.id} type="button" onClick={() => setForm({ ...form, coatingTypeId: c.id })}
                          className={`btn btn-sm ${form.coatingTypeId === c.id ? 'btn-primary' : 'btn-secondary'}`}>{c.name}</button>
                      ))}
                    </div>
                  </div>
                </Section>

                {/* Images */}
                <Section title="Images">
                  {/* Product Images */}
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label" style={{ marginBottom: 10 }}>
                      📷 Product Images
                      <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
                        ({productImages.length + newProductFiles.length} added, up to 10)
                      </span>
                    </label>
                    <div className="multi-image-grid">
                      {/* Existing images */}
                      {productImages.map((src, i) => (
                        <div key={`ep-${i}`} className="multi-image-item">
                          <img src={src} alt={`product-${i}`} />
                          <button type="button" className="multi-image-remove" onClick={() => removeExisting(i, 'product')}>
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      {/* New files */}
                      {newProductFiles.map(({ preview }, i) => (
                        <div key={`np-${i}`} className="multi-image-item new">
                          <img src={preview} alt={`new-product-${i}`} />
                          <button type="button" className="multi-image-remove" onClick={() => removeNew(i, 'product')}>
                            <X size={10} />
                          </button>
                          <div className="multi-image-new-badge">NEW</div>
                        </div>
                      ))}
                      {/* Add button */}
                      {(productImages.length + newProductFiles.length) < 10 && (
                        <div className="multi-image-add" onClick={() => productImgRef.current.click()}>
                          <ImagePlus size={20} />
                          <span>Add</span>
                        </div>
                      )}
                    </div>
                    <input ref={productImgRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                      onChange={e => addFiles(e, 'product')} />
                  </div>

                  {/* Design Images */}
                  <div className="form-group">
                    <label className="form-label" style={{ marginBottom: 10 }}>
                      🎨 Design Images
                      <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
                        ({designImages.length + newDesignFiles.length} added, up to 10)
                      </span>
                    </label>
                    <div className="multi-image-grid">
                      {designImages.map((src, i) => (
                        <div key={`ed-${i}`} className="multi-image-item">
                          <img src={src} alt={`design-${i}`} />
                          <button type="button" className="multi-image-remove" onClick={() => removeExisting(i, 'design')}>
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      {newDesignFiles.map(({ preview }, i) => (
                        <div key={`nd-${i}`} className="multi-image-item new">
                          <img src={preview} alt={`new-design-${i}`} />
                          <button type="button" className="multi-image-remove" onClick={() => removeNew(i, 'design')}>
                            <X size={10} />
                          </button>
                          <div className="multi-image-new-badge">NEW</div>
                        </div>
                      ))}
                      {(designImages.length + newDesignFiles.length) < 10 && (
                        <div className="multi-image-add" onClick={() => designImgRef.current.click()}>
                          <ImagePlus size={20} />
                          <span>Add</span>
                        </div>
                      )}
                    </div>
                    <input ref={designImgRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                      onChange={e => addFiles(e, 'design')} />
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
