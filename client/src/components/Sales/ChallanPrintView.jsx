import React from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency, formatDate } from '../../utils/helpers';
import './ChallanPrintView.css';

export default function ChallanPrintView({ sale }) {
  if (!sale) return null;

  const invoiceNo = sale.saleNumber;
  const date = formatDate(sale.saleDate);
  const dueDate = formatDate(new Date(new Date(sale.saleDate).getTime() + 10 * 24 * 60 * 60 * 1000));
  const customer = sale.customer || {};

  return createPortal(
    <div className="challan-print-root">
      <div className="challan-print-container">
      <div className="challan-header">
        <div className="challan-left-column">
          <div className="qr-wrapper">
            <QRCodeSVG value={`https://ashirwad.jaqyi.com/view-challan/${sale.id}`} size={80} level="M" />
          </div>

          <div className="challan-info-block" style={{ marginTop: '30px' }}>
            <div className="info-label">Date :</div>
            <div className="info-value">{date}</div>
          </div>
          
          <div className="challan-info-block" style={{ marginTop: '10px' }}>
            <div className="info-label">Due Date :</div>
            <div className="info-value">{dueDate}</div>
          </div>

          <div className="challan-info-block" style={{ marginTop: '20px' }}>
            <div className="info-label">To</div>
            <div className="info-value" style={{ marginTop: '5px' }}>{customer.name || 'Walk-in Customer'}</div>
            {customer.phone && <div className="info-value" style={{ fontSize: '11px' }}>{customer.phone}</div>}
            {customer.email && <div className="info-value" style={{ fontSize: '11px' }}>{customer.email}</div>}
            {customer.address && <div className="info-value" style={{ fontSize: '11px', marginTop: '4px', maxWidth: '200px' }}>{customer.address}</div>}
          </div>
        </div>

        <div className="challan-right-column">
          <div className="company-logo-section">
            <div className="logo-circle">
              <div className="logo-inner-circle"></div>
            </div>
            <div>
              <div className="company-name">Ashirwad Enterprises</div>
              <div className="company-tagline">Quality Construction Materials</div>
            </div>
          </div>

          <h1 className="invoice-title">INVOICE</h1>
          <p className="invoice-subtitle">Document Payment Information</p>

          <div className="invoice-meta-box">
            <div className="meta-item">
              <div className="meta-label">Account No:</div>
              <div className="meta-value">123-456-789</div>
            </div>
            <div className="meta-divider"></div>
            <div className="meta-item">
              <div className="meta-label">Invoice No:</div>
              <div className="meta-value">#{invoiceNo}</div>
            </div>
          </div>

          <div className="payment-details" style={{ marginTop: '20px' }}>
            <div className="payment-label">
              Payment<br/>Method
              <div className="payment-line"></div>
            </div>
            <div className="payment-info">
              <div>Account Name</div>
              <div>Account BA 1982-1856</div>
              <div>1234 Main Street India</div>
            </div>
          </div>
        </div>
      </div>

      <div className="challan-body">
        <table className="challan-table">
          <thead>
            <tr>
              <th>Item Description</th>
              <th>Rate</th>
              <th>Unit</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(sale.items || []).map((item, idx) => (
              <tr key={idx}>
                <td>{item.product?.name || 'Product'}</td>
                <td>{formatCurrency(item.unitPrice)}</td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="challan-summary-wrapper">
          <div className="challan-summary">
            <div className="summary-row">
              <span className="summary-label">Subtotal</span>
              <span className="summary-colon">:</span>
              <span className="summary-value">{formatCurrency(sale.subtotal)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Tax Vat (GST)</span>
              <span className="summary-colon">:</span>
              <span className="summary-value">{formatCurrency(sale.gstAmount)}</span>
            </div>
            <div className="summary-row total-row">
              <span className="summary-label">Total</span>
              <span className="summary-colon">:</span>
              <span className="summary-value">{formatCurrency(sale.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="challan-footer">
        <div className="footer-notes">
          Goods once sold will not be taken back. Interest @ 24% p.a. will be charged if payment is delayed beyond 15 days. Subject to local jurisdiction.
        </div>
        <div className="footer-contact">
          <div className="contact-item">
            <div className="contact-icon">✉</div>
            <div>
              <div className="contact-label">E-mail</div>
              <div className="contact-value">billing@ashirwad.com</div>
            </div>
          </div>
          <div className="contact-item" style={{ marginTop: '10px' }}>
            <div className="contact-icon">📍</div>
            <div>
              <div className="contact-label">Main Office</div>
              <div className="contact-value">Madhya Pradesh, India</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>,
  document.body
  );
}
