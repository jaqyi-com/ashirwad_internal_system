import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Package, ChevronLeft, ChevronRight, MapPin, Tag, Layers, Hash, Calendar, ZoomIn, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'https://ashirwad-ims-api.vercel.app/api';

export default function ProductPublicPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('product');
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    axios.get(`${API}/public/products/${id}`)
      .then(r => { setProduct(r.data); setLoading(false); })
      .catch(() => { setError('Product not found or no longer available.'); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div style={styles.page}>
      <div style={styles.loadingBox}>
        <div style={styles.spinner} />
        <p style={{ color: '#8892a4', marginTop: 16 }}>Loading product…</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={styles.page}>
      <div style={styles.loadingBox}>
        <Package size={48} style={{ color: '#4a5568', marginBottom: 12 }} />
        <p style={{ color: '#8892a4' }}>{error}</p>
      </div>
    </div>
  );

  const images = tab === 'product' ? (product.productImages || []) : (product.designImages || []);
  const current = images[activeIdx];
  const allImgCount = (product.productImages?.length || 0) + (product.designImages?.length || 0);

  const prev = () => setActiveIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setActiveIdx(i => (i + 1) % images.length);

  const formatCurrency = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

  const gstAmount = (Number(product.price) * Number(product.gstPercent)) / 100;
  const priceWithGst = Number(product.price) + gstAmount;

  return (
    <div style={styles.page}>
      {/* Header bar */}
      <div style={styles.topBar}>
        <div style={styles.brand}>🏭 Ashirwad Enterprises</div>
        <div style={styles.brandSub}>Product Information</div>
      </div>

      <div style={styles.card}>
        {/* Product name + badges */}
        <div style={styles.nameRow}>
          <h1 style={styles.productName}>{product.name}</h1>
          <div style={styles.badgeRow}>
            {product.category?.name && <span style={styles.badge}>{product.category.name}</span>}
            {product.coatingType?.name && <span style={{ ...styles.badge, background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{product.coatingType.name}</span>}
          </div>
        </div>

        <div style={styles.body}>
          {/* Gallery */}
          <div style={styles.galleryCol}>
            {/* Tab switch */}
            {allImgCount > 0 && (
              <div style={styles.tabRow}>
                {(product.productImages?.length || 0) > 0 && (
                  <button style={{ ...styles.tabBtn, ...(tab === 'product' ? styles.tabBtnActive : {}) }} onClick={() => { setTab('product'); setActiveIdx(0); }}>
                    📷 Product ({product.productImages.length})
                  </button>
                )}
                {(product.designImages?.length || 0) > 0 && (
                  <button style={{ ...styles.tabBtn, ...(tab === 'design' ? styles.tabBtnActive : {}) }} onClick={() => { setTab('design'); setActiveIdx(0); }}>
                    🎨 Design ({product.designImages.length})
                  </button>
                )}
              </div>
            )}

            {/* Main image */}
            {current ? (
              <div style={styles.imgWrap} onClick={() => setLightbox(true)}>
                <img src={current} alt={product.name} style={styles.mainImg} />
                <div style={styles.zoomHint}><ZoomIn size={14} /> Tap to zoom</div>
                {images.length > 1 && (
                  <>
                    <button style={{ ...styles.navBtn, left: 8 }} onClick={e => { e.stopPropagation(); prev(); }}><ChevronLeft size={20} /></button>
                    <button style={{ ...styles.navBtn, right: 8 }} onClick={e => { e.stopPropagation(); next(); }}><ChevronRight size={20} /></button>
                  </>
                )}
              </div>
            ) : (
              <div style={styles.noImg}><Package size={64} style={{ color: '#2d3348' }} /><p style={{ color: '#4a5568', marginTop: 12 }}>No images available</p></div>
            )}

            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={styles.thumbRow}>
                {images.map((img, i) => (
                  <div key={i} style={{ ...styles.thumb, ...(i === activeIdx ? styles.thumbActive : {}) }} onClick={() => setActiveIdx(i)}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={styles.infoCol}>
            {/* Price block */}
            <div style={styles.priceBlock}>
              <div>
                <div style={{ fontSize: 12, color: '#8892a4', marginBottom: 4 }}>Base Price (excl. GST)</div>
                <div style={styles.bigPrice}>{formatCurrency(product.price)}</div>
              </div>
              <div style={styles.priceDivider} />
              <div>
                <div style={{ fontSize: 12, color: '#8892a4', marginBottom: 4 }}>Price incl. GST ({product.gstPercent}%)</div>
                <div style={{ ...styles.bigPrice, color: '#10b981' }}>{formatCurrency(priceWithGst)}</div>
              </div>
            </div>

            {/* Detail rows */}
            <div style={styles.detailRows}>
              {product.partNumber && <DetailRow icon={<Hash size={14} />} label="Part Number" value={product.partNumber} />}
              {product.location && <DetailRow icon={<MapPin size={14} />} label="Location" value={product.location} />}
              {product.barcode && <DetailRow icon={<Tag size={14} />} label="Barcode" value={product.barcode} />}
              {product.unit && <DetailRow icon={<Package size={14} />} label="Unit" value={product.unit} />}
              <DetailRow
                icon={<Calendar size={14} />}
                label="Added On"
                value={new Date(product.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              />
            </div>

            {/* Specs */}
            {product.specifications && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>Specifications</div>
                <div style={styles.sectionBody}>{product.specifications}</div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>Description</div>
                <div style={styles.sectionBody}>{product.description}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        Powered by <strong>Ashirwad IMS</strong> · Scan QR to view product details
      </div>

      {/* Lightbox */}
      {lightbox && current && (
        <div style={styles.lightbox} onClick={() => setLightbox(false)}>
          <button style={styles.lbClose} onClick={() => setLightbox(false)}><X size={22} /></button>
          {images.length > 1 && <button style={{ ...styles.lbNav, left: 16 }} onClick={e => { e.stopPropagation(); prev(); }}><ChevronLeft size={28} /></button>}
          <img src={current} alt={product.name} style={styles.lbImg} onClick={e => e.stopPropagation()} />
          {images.length > 1 && <button style={{ ...styles.lbNav, right: 16 }} onClick={e => { e.stopPropagation(); next(); }}><ChevronRight size={28} /></button>}
          <div style={styles.lbCounter}>{activeIdx + 1} / {images.length}</div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1f2330', fontSize: 13 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8892a4' }}>{icon}{label}</div>
      <div style={{ fontWeight: 600, color: '#e8eaf0' }}>{value}</div>
    </div>
  );
}

/* ── Inline styles (self-contained public page, no CSS file dependency) ── */
const styles = {
  page: { minHeight: '100vh', background: '#0a0b0f', fontFamily: "'Inter', -apple-system, sans-serif", color: '#e8eaf0' },
  topBar: { background: '#0d0f14', borderBottom: '1px solid #1f2330', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  brand: { fontSize: 16, fontWeight: 800, color: '#e8eaf0', letterSpacing: '-0.01em' },
  brandSub: { fontSize: 12, color: '#8892a4' },
  card: { maxWidth: 1000, margin: '24px auto', background: '#161820', borderRadius: 16, border: '1px solid #1f2330', overflow: 'hidden' },
  nameRow: { padding: '20px 24px 16px', borderBottom: '1px solid #1f2330' },
  productName: { fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 10, lineHeight: 1.3 },
  badgeRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  body: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 },
  galleryCol: { padding: 20, borderRight: '1px solid #1f2330', display: 'flex', flexDirection: 'column', gap: 12 },
  tabRow: { display: 'flex', gap: 4 },
  tabBtn: { flex: 1, padding: '7px 12px', borderRadius: 8, border: '1px solid #1f2330', background: '#111318', color: '#8892a4', fontSize: 12, fontWeight: 500, cursor: 'pointer' },
  tabBtnActive: { background: 'rgba(99,102,241,0.15)', color: '#818cf8', borderColor: '#6366f1' },
  imgWrap: { position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', background: '#111318', cursor: 'zoom-in' },
  mainImg: { width: '100%', height: '100%', objectFit: 'contain' },
  zoomHint: { position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, padding: '3px 8px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 },
  navBtn: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  noImg: { width: '100%', aspectRatio: '1', background: '#111318', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  thumbRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  thumb: { width: 56, height: 56, borderRadius: 8, overflow: 'hidden', border: '2px solid #1f2330', cursor: 'pointer', flexShrink: 0 },
  thumbActive: { borderColor: '#6366f1' },
  infoCol: { padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' },
  priceBlock: { background: '#111318', borderRadius: 12, padding: 16, border: '1px solid #1f2330', display: 'flex', gap: 16, flexWrap: 'wrap' },
  bigPrice: { fontSize: 22, fontWeight: 800, color: '#e8eaf0' },
  priceDivider: { width: 1, background: '#1f2330', alignSelf: 'stretch' },
  detailRows: { display: 'flex', flexDirection: 'column' },
  section: { background: '#111318', borderRadius: 12, padding: 14, border: '1px solid #1f2330' },
  sectionTitle: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4a5568', marginBottom: 8 },
  sectionBody: { fontSize: 13, lineHeight: 1.7, color: '#8892a4', whiteSpace: 'pre-wrap' },
  footer: { textAlign: 'center', padding: '20px', fontSize: 12, color: '#4a5568' },
  loadingBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' },
  spinner: { width: 36, height: 36, border: '3px solid #1f2330', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  lightbox: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  lbImg: { maxWidth: '90vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 8 },
  lbClose: { position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  lbNav: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', width: 52, height: 52, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  lbCounter: { position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.6)', fontSize: 13 },
};
