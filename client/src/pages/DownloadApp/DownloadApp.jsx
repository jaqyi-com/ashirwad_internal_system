import { Smartphone, Download, Shield, Wifi, Package, TrendingUp, ShoppingCart, BarChart2, CheckCircle, ChevronRight } from 'lucide-react';
import './DownloadApp.css';

const APK_URL = '/ashirwad-ims.apk';
const APK_VERSION = '1.0.0';
const APK_SIZE = '41 MB';

const features = [
  { icon: Package,      label: 'Products',  desc: 'Full inventory with search & details' },
  { icon: TrendingUp,   label: 'Sales',     desc: 'View and manage sale orders' },
  { icon: ShoppingCart, label: 'Purchases', desc: 'Purchase orders & supplier info' },
  { icon: BarChart2,    label: 'Dashboard', desc: 'Live stats & business summary' },
];

const steps = [
  'Tap the Download APK button below',
  'Open the downloaded file on your Android device',
  'Allow "Install from unknown sources" if prompted',
  'Install and log in with your existing credentials',
];

export default function DownloadApp() {
  return (
    <div className="download-page">

      {/* Hero */}
      <div className="download-hero">
        <div className="download-hero-icon">
          <Smartphone size={40} />
        </div>
        <div>
          <h1 className="download-hero-title">Ashirwad IMS — Mobile App</h1>
          <p className="download-hero-sub">
            Access your inventory system anywhere, anytime. The official Android app
            for Ashirwad Enterprises.
          </p>
        </div>
      </div>

      {/* Download card */}
      <div className="download-card">
        <div className="download-card-left">
          <div className="download-app-icon">🏭</div>
          <div>
            <div className="download-app-name">Ashirwad IMS</div>
            <div className="download-app-meta">
              <span className="download-badge green">Android APK</span>
              <span className="download-badge">v{APK_VERSION}</span>
              <span className="download-badge">{APK_SIZE}</span>
            </div>
            <div className="download-app-compat">
              <CheckCircle size={12} /> Compatible with Android 7.0+
            </div>
          </div>
        </div>

        <a
          href={APK_URL}
          download="ashirwad-ims.apk"
          className="download-btn"
          id="download-apk-btn"
        >
          <Download size={18} />
          Download APK
        </a>
      </div>

      {/* Features */}
      <div className="download-section-title">What's included</div>
      <div className="download-features">
        {features.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="download-feature-card">
            <div className="download-feature-icon">
              <Icon size={20} />
            </div>
            <div>
              <div className="download-feature-label">{label}</div>
              <div className="download-feature-desc">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Install steps */}
      <div className="download-section-title">How to install</div>
      <div className="download-steps">
        {steps.map((step, i) => (
          <div key={i} className="download-step">
            <div className="download-step-num">{i + 1}</div>
            <div className="download-step-text">{step}</div>
          </div>
        ))}
      </div>

      {/* Security note */}
      <div className="download-security">
        <Shield size={15} />
        <span>
          This APK is the official build of Ashirwad IMS, signed with the debug
          key. It connects to the same backend as the web system. Your login
          credentials work across both platforms.
        </span>
      </div>

    </div>
  );
}
