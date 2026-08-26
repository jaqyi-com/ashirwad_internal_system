import { useState } from 'react';
import { X, Edit2, Package, ChevronLeft, ChevronRight, ZoomIn, Tag, Truck, MapPin, DollarSign, Layers, BarChart2, Calendar, Hash, QrCode } from 'lucide-react';
import { formatCurrency, formatNumber, getStockStatus } from '../../utils/helpers';
import ProductQR from './ProductQR';

export default function ProductDetailModal({ product, onClose, onEdit }) {
  const [tab, setTab]               = useState('product'); // 'product' | 'design' | 'qr'
  const [activeIdx, setActiveIdx]   = useState(0);
  const [lightbox, setLightbox]     = useState(false);

  const images = tab === 'product' ? (product.productImages || []) : (tab === 'design' ? (product.designImages || []) : []);
  const current = images[activeIdx];

  const prev = () => setActiveIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setActiveIdx(i => (i + 1) % images.length);
  const switchTab = (t) => { setTab(t); setActiveIdx(0); };

  const status = getStockStatus(product.currentStock, product.minStock);

  return (
    <>
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="product-detail-modal">
          {/* Header */}
          <div className="product-detail-header">
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{product.name}</h2>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                {product.partNumber && <span className="badge badge-gray">P/N: {product.partNumber}</span>}
                {product.coatingType && <span className="badge badge-blue">{product.coatingType.name}</span>}
                <span className={`badge ${status.className}`}>{status.label}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => { onClose(); onEdit(product); }}>
                <Edit2 size={14} /> Edit
              </button>
              <button className="btn btn-secondary btn-icon" onClick={onClose}><X size={16} /></button>
            </div>
          </div>

          <div className="product-detail-body">
            {/* Left: Image Gallery */}
            <div className="product-detail-gallery">
              {/* Tab switch */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                <button
                  className={`tab-btn ${tab === 'product' ? 'active' : ''}`}
                  onClick={() => switchTab('product')}
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  📷 Product ({(product.productImages || []).length})
                </button>
                <button
                  className={`tab-btn ${tab === 'design' ? 'active' : ''}`}
                  onClick={() => switchTab('design')}
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  🎨 Design ({(product.designImages || []).length})
                </button>
                <button
                  className={`tab-btn ${tab === 'qr' ? 'active' : ''}`}
                  onClick={() => switchTab('qr')}
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  <QrCode size={12} style={{ display: 'inline', marginRight: 4 }} />QR
                </button>
              </div>

              {/* QR tab */}
              {tab === 'qr' ? (
                <ProductQR product={product} />
              ) : current ? (
                <div className="gallery-main" onClick={() => setLightbox(true)}>
                  <img src={current} alt={`${product.name} ${tab}`} />
                  <div className="gallery-zoom-hint"><ZoomIn size={16} /> Click to zoom</div>
                  {images.length > 1 && (
                    <>
                      <button className="gallery-nav gallery-nav-prev" onClick={e => { e.stopPropagation(); prev(); }}><ChevronLeft size={20} /></button>
                      <button className="gallery-nav gallery-nav-next" onClick={e => { e.stopPropagation(); next(); }}><ChevronRight size={20} /></button>
                    </>
                  )}
                </div>
              ) : (
                <div className="gallery-empty">
                  <Package size={48} style={{ opacity: 0.2 }} />
                  <p>No {tab} images uploaded</p>
                </div>
              )}

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="gallery-thumbs">
                  {images.map((img, i) => (
                    <div
                      key={i}
                      className={`gallery-thumb ${i === activeIdx ? 'active' : ''}`}
                      onClick={() => setActiveIdx(i)}
                    >
                      <img src={img} alt={`thumb-${i}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Details */}
            <div className="product-detail-info">
              {/* Price cards */}
              <div className="product-detail-prices">
                <div className="price-card">
                  <div className="price-card-label">Selling Price</div>
                  <div className="price-card-value">{formatCurrency(product.price)}</div>
                </div>

                <div className="price-card">
                  <div className="price-card-label">GST</div>
                  <div className="price-card-value">{product.gstPercent}%</div>
                </div>
                <div className="price-card">
                  <div className="price-card-label">Stock</div>
                  <div className="price-card-value" style={{ color: status.color || 'inherit' }}>
                    {formatNumber(product.currentStock)} {product.unit}
                  </div>
                </div>
              </div>

              {/* Detail rows */}
              <div className="product-detail-rows">
                <DetailRow icon={<Tag size={14} />}      label="Category"  value={product.category?.name} />
                <DetailRow icon={<Truck size={14} />}    label="Supplier"  value={product.supplier?.name} />
                <DetailRow icon={<Layers size={14} />}   label="Company"   value={product.company} />
                <DetailRow icon={<MapPin size={14} />}   label="Location"  value={product.location} />
                <DetailRow icon={<Hash size={14} />}     label="Barcode"   value={product.barcode} />
                <DetailRow icon={<BarChart2 size={14} />} label="Min Stock" value={product.minStock ? `${product.minStock} ${product.unit}` : null} />
                <DetailRow icon={<Calendar size={14} />} label="Added"     value={new Date(product.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />
              </div>

              {/* Specs */}
              {product.specifications && (
                <div className="product-detail-section">
                  <div className="product-detail-section-title">Specifications</div>
                  <div className="product-detail-section-body">{product.specifications}</div>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div className="product-detail-section">
                  <div className="product-detail-section-title">Description</div>
                  <div className="product-detail-section-body">{product.description}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && current && (
        <div
          className="lightbox-overlay"
          onClick={() => setLightbox(false)}
        >
          <button className="lightbox-close" onClick={() => setLightbox(false)}><X size={24} /></button>
          {images.length > 1 && (
            <button className="lightbox-nav lightbox-prev" onClick={e => { e.stopPropagation(); prev(); }}><ChevronLeft size={32} /></button>
          )}
          <img
            src={current}
            alt={product.name}
            className="lightbox-img"
            onClick={e => e.stopPropagation()}
          />
          {images.length > 1 && (
            <button className="lightbox-nav lightbox-next" onClick={e => { e.stopPropagation(); next(); }}><ChevronRight size={32} /></button>
          )}
          <div className="lightbox-counter">{activeIdx + 1} / {images.length}</div>
        </div>
      )}
    </>
  );
}

function DetailRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="detail-row">
      <div className="detail-row-label">{icon}{label}</div>
      <div className="detail-row-value">{value}</div>
    </div>
  );
}
