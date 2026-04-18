import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Lazy load all pages
const AdminDashboard      = lazy(() => import('./pages/admin/AdminDashboard'));
const SiteManagement      = lazy(() => import('./pages/admin/SiteManagement'));
const Analytics           = lazy(() => import('./pages/admin/Analytics'));
const BudgetControl       = lazy(() => import('./pages/admin/BudgetControl'));
const UserManagement      = lazy(() => import('./pages/admin/UserManagement'));
const InventoryManagement = lazy(() => import('./pages/admin/InventoryManagement'));
const InvoiceManagement   = lazy(() => import('./pages/admin/InvoiceManagement'));
const PaymentManagement   = lazy(() => import('./pages/admin/PaymentManagement'));
const Notifications       = lazy(() => import('./pages/admin/Notifications'));
const SiteAnalytics      = lazy(() => import('./pages/admin/SiteAnalytics'));
const AIInsights          = lazy(() => import('./pages/admin/AIInsights'));

const ManagerDashboard    = lazy(() => import('./pages/manager/ManagerDashboard'));
const ManagerWorkersPage  = lazy(() => import('./pages/manager/ManagerWorkersPage'));
const ManagerReportsPage  = lazy(() => import('./pages/manager/ManagerReportsPage'));
const ManagerAttendance   = lazy(() => import('./pages/manager/ManagerAttendance'));
const ManagerMaterials    = lazy(() => import('./pages/manager/ManagerMaterials'));
const ManagerInvoices     = lazy(() => import('./pages/manager/ManagerInvoices'));
const ManagerPayments     = lazy(() => import('./pages/manager/ManagerPayments'));
const ManagerNotifications = lazy(() => import('./pages/manager/ManagerNotifications'));

const EngineerDashboard   = lazy(() => import('./pages/engineer/EngineerDashboard'));
const EngineerStock       = lazy(() => import('./pages/engineer/EngineerStock'));
const EngineerLogs        = lazy(() => import('./pages/engineer/EngineerLogs'));
const EngineerInvoices    = lazy(() => import('./pages/engineer/EngineerInvoices'));
const EngineerNotifications = lazy(() => import('./pages/engineer/EngineerNotifications'));
const EngineerDrawings     = lazy(() => import('./pages/engineer/EngineerDrawings'));
const Login = lazy(() => import('./pages/auth/Login'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    <div className="text-amber-500 font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">BuildTrack AI Loading...</div>
  </div>
);

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  const engineerRedirect = user?.role === 'site_engineer' ? '/engineer/dashboard' : '/manager/dashboard';
  const adminRoutes = [
    { path: '/admin/dashboard',    comp: AdminDashboard },
    { path: '/admin/sites',        comp: SiteManagement },
    { path: '/admin/analytics',    comp: Analytics },
    { path: '/admin/budget',       comp: BudgetControl },
    { path: '/admin/inventory',    comp: InventoryManagement },
    { path: '/admin/invoices',     comp: InvoiceManagement },
    { path: '/admin/payments',     comp: PaymentManagement },
    { path: '/admin/users',        comp: UserManagement },
    { path: '/admin/notifications',comp: Notifications },
    { path: '/admin/ai',           comp: AIInsights },
    { path: '/admin/sites/:id',    comp: SiteAnalytics },
  ];

  return (
    <Routes>
      <Route path="/login" element={
        user
          ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : engineerRedirect} />
          : <Login />
      } />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Admin */}
      {adminRoutes.map(({ path, comp: Comp }) => (
        <Route key={path} path={path} element={
          <ProtectedRoute allowedRoles={['admin']}><Comp /></ProtectedRoute>
        } />
      ))}

      {/* Manager */}
      <Route path="/manager/dashboard" element={<ProtectedRoute allowedRoles={['site_manager', 'admin']}><ManagerDashboard /></ProtectedRoute>} />
      <Route path="/manager/workers"   element={<ProtectedRoute allowedRoles={['site_manager', 'admin']}><ManagerWorkersPage /></ProtectedRoute>} />
      <Route path="/manager/attendance" element={<ProtectedRoute allowedRoles={['site_manager', 'admin']}><ManagerAttendance /></ProtectedRoute>} />
      <Route path="/manager/materials" element={<ProtectedRoute allowedRoles={['site_manager', 'admin']}><ManagerMaterials /></ProtectedRoute>} />
      <Route path="/manager/invoices"  element={<ProtectedRoute allowedRoles={['site_manager', 'admin']}><ManagerInvoices /></ProtectedRoute>} />
      <Route path="/manager/payments"  element={<ProtectedRoute allowedRoles={['site_manager', 'admin']}><ManagerPayments /></ProtectedRoute>} />
      <Route path="/manager/reports"   element={<ProtectedRoute allowedRoles={['site_manager', 'admin']}><ManagerReportsPage /></ProtectedRoute>} />
      <Route path="/manager/notifications" element={<ProtectedRoute allowedRoles={['site_manager', 'admin']}><ManagerNotifications /></ProtectedRoute>} />

      {/* Engineer Routes */}
      <Route path="/engineer/dashboard" element={<ProtectedRoute allowedRoles={['site_engineer', 'admin']}><EngineerDashboard /></ProtectedRoute>} />
      <Route path="/engineer/stock"     element={<ProtectedRoute allowedRoles={['site_engineer', 'admin']}><EngineerStock /></ProtectedRoute>} />
      <Route path="/engineer/logs"      element={<ProtectedRoute allowedRoles={['site_engineer', 'admin']}><EngineerLogs /></ProtectedRoute>} />
      <Route path="/engineer/invoices"  element={<ProtectedRoute allowedRoles={['site_engineer', 'admin']}><EngineerInvoices /></ProtectedRoute>} />
      <Route path="/engineer/notifications" element={<ProtectedRoute allowedRoles={['site_engineer', 'admin']}><EngineerNotifications /></ProtectedRoute>} />
      <Route path="/engineer/drawings"      element={<ProtectedRoute allowedRoles={['site_engineer', 'admin']}><EngineerDrawings /></ProtectedRoute>} />

      <Route path="/unauthorized" element={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400 text-xl">Access Denied</div>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <AppRoutes />
          </Suspense>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
