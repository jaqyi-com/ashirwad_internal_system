import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ChallanPrintView from '../../components/Sales/ChallanPrintView';

export default function ViewChallan() {
  const { id } = useParams();
  const [challan, setChallan] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallan = async () => {
      try {
        // Fetch from the new public endpoint, bypassing the internal API interceptor
        // which might try to attach tokens or redirect to login.
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/public/challan/${id}`);
        setChallan(res.data);
      } catch (err) {
        setError('This Challan does not exist or has been removed.');
      } finally {
        setLoading(false);
      }
    };
    fetchChallan();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f6f6f6' }}>
        <div style={{ fontFamily: 'sans-serif', color: '#666' }}>Loading Challan details...</div>
      </div>
    );
  }

  if (error || !challan) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f6f6f6' }}>
        <div style={{ fontFamily: 'sans-serif', color: '#d32f2f', background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h2>Oops!</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f6f6', padding: '20px 0' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px', textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'sans-serif', color: '#333' }}>Your Delivery Challan</h2>
        <p style={{ fontFamily: 'sans-serif', color: '#666', fontSize: '14px' }}>Save or screenshot this page for your records.</p>
      </div>
      
      {/* Render the identical Challan UI safely on the page (not in a print portal) */}
      <ChallanPrintView sale={challan} isPublic={true} />
    </div>
  );
}
