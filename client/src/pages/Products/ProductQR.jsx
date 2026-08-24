import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, QrCode, ExternalLink } from 'lucide-react';

const FRONTEND_URL =
  import.meta.env.VITE_APP_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `${window.location.protocol}//${window.location.hostname}`
    : 'https://ashirwad-ims.vercel.app');

export default function ProductQR({ product }) {
  const canvasRef = useRef();
  const qrUrl = `${FRONTEND_URL}/p/${product.id}`;

  const downloadQR = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;

    // Create a new canvas with padding + label
    const padding = 24;
    const labelH = 52;
    const out = document.createElement('canvas');
    out.width  = canvas.width  + padding * 2;
    out.height = canvas.height + padding * 2 + labelH;
    const ctx = out.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out.width, out.height);

    // QR
    ctx.drawImage(canvas, padding, padding);

    // Product name label
    ctx.fillStyle = '#1a1d2e';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(product.name.length > 40 ? product.name.slice(0, 40) + '…' : product.name, out.width / 2, canvas.height + padding + 22);

    // Sub-label
    ctx.fillStyle = '#8892a4';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('Scan to view product details', out.width / 2, canvas.height + padding + 40);

    const link = document.createElement('a');
    link.download = `QR_${product.name.replace(/\s+/g, '_')}.png`;
    link.href = out.toDataURL('image/png');
    link.click();
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
      padding: '20px',
    }}>
      {/* QR Code */}
      <div
        ref={canvasRef}
        style={{
          background: '#ffffff',
          padding: 16,
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          border: '1px solid var(--border)',
        }}
      >
        <QRCodeCanvas
          value={qrUrl}
          size={200}
          level="H"
          marginSize={1}
          imageSettings={{
            src: '', // Can add logo here
            excavate: false,
          }}
        />
      </div>

      {/* Label */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          {product.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', wordBreak: 'break-all', maxWidth: 240 }}>
          {qrUrl}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, width: '100%' }}>
        <button
          className="btn btn-primary"
          style={{ flex: 1, fontSize: 13 }}
          onClick={downloadQR}
        >
          <Download size={14} /> Download QR
        </button>
        <a
          href={qrUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          style={{ flex: 1, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <ExternalLink size={14} /> Preview Page
        </a>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
        Scan with any camera app — no app install needed
      </div>
    </div>
  );
}
