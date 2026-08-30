import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { useEffect } from 'react';

import Layout from './components/Layout/Layout';
import TopLoadingBar from './components/Common/TopLoadingBar';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Products from './pages/Products/Products';
import Categories from './pages/Categories/Categories';
import Suppliers from './pages/Suppliers/Suppliers';
import Customers from './pages/Customers/Customers';
import Purchases from './pages/Purchases/Purchases';
import Sales from './pages/Sales/Sales';
import Challans from './pages/Challans/Challans';
import Inventory from './pages/Inventory/Inventory';
import LowStock from './pages/Inventory/LowStock';
import Adjustments from './pages/Inventory/Adjustments';
import Reports from './pages/Reports/Reports';
import Users from './pages/Users/Users';
import Settings from './pages/Settings';
import Audit from './pages/Audit';
import AttendanceDashboard from './pages/Attendance/AttendanceDashboard';
import AttendanceReport from './pages/Attendance/AttendanceReport';
import Employees from './pages/Attendance/Employees';
import DeviceSettings from './pages/Attendance/DeviceSettings';
import ProductPublicPage from './pages/Products/ProductPublicPage';
import DownloadApp from './pages/DownloadApp/DownloadApp';
import Complaints from './pages/Complaints/Complaints';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuthStore();
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <TopLoadingBar />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-light)',
              borderRadius: '10px',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: 'var(--green)', secondary: 'var(--bg-card)' } },
            error: { iconTheme: { primary: 'var(--red)', secondary: 'var(--bg-card)' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="customers" element={<Customers />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="sales" element={<Sales />} />
            <Route path="challans" element={<Challans />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="low-stock" element={<LowStock />} />
            <Route path="adjustments" element={<Adjustments />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<Users />} />
            <Route path="audit" element={<Audit />} />
            <Route path="complaints" element={<Complaints />} />
            <Route path="settings" element={<Settings />} />
            <Route path="download" element={<DownloadApp />} />
            <Route path="attendance" element={<AttendanceDashboard />} />
            <Route path="attendance/report" element={<AttendanceReport />} />
            <Route path="attendance/employees" element={<Employees />} />
            <Route path="attendance/devices" element={<DeviceSettings />} />
          </Route>
          {/* Public QR scan route — no auth required */}
          <Route path="/p/:id" element={<ProductPublicPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
