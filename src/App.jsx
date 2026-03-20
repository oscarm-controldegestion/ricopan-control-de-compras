import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Carga inmediata solo para Login y Layout (necesarios al inicio)
import Login from './components/Login';
import Layout from './components/Layout';

// Lazy loading: cada componente se carga solo cuando se navega a esa ruta
const Dashboard        = lazy(() => import('./components/Dashboard'));
const PedidoForm       = lazy(() => import('./components/PedidoForm'));
const PedidosList      = lazy(() => import('./components/PedidosList'));
const FacturaForm      = lazy(() => import('./components/FacturaForm'));
const FacturasList     = lazy(() => import('./components/FacturasList'));
const Reportes         = lazy(() => import('./components/Reportes'));
const AdminDashboard   = lazy(() => import('./components/admin/AdminDashboard'));
const LocalesManager   = lazy(() => import('./components/admin/LocalesManager'));
const UsuariosManager  = lazy(() => import('./components/admin/UsuariosManager'));
const AdminReportes    = lazy(() => import('./components/admin/AdminReportes'));
const ProveedoresManager = lazy(() => import('./components/admin/ProveedoresManager'));

// Pantalla de carga mientras se descarga un componente
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', flexDirection: 'column', gap: '12px',
    }}>
      <div style={{
        width: '36px', height: '36px', border: '3px solid #f3f3f3',
        borderTop: '3px solid #b41e1e', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#999', fontSize: '13px', margin: 0 }}>Cargando...</p>
    </div>
  );
}

function ProtectedRoute({ children, adminOnly = false }) {
  const { currentUser, isAdmin } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { currentUser, isAdmin } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={
          currentUser
            ? <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />
            : <Login />
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/pedidos/nuevo" element={
          <ProtectedRoute>
            <Layout><PedidoForm /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/pedidos" element={
          <ProtectedRoute>
            <Layout><PedidosList /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/facturas/nueva" element={
          <ProtectedRoute>
            <Layout><FacturaForm /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/facturas" element={
          <ProtectedRoute>
            <Layout><FacturasList /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/reportes" element={
          <ProtectedRoute>
            <Layout><Reportes /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute adminOnly>
            <Layout><AdminDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/locales" element={
          <ProtectedRoute adminOnly>
            <Layout><LocalesManager /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/usuarios" element={
          <ProtectedRoute adminOnly>
            <Layout><UsuariosManager /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/proveedores" element={
          <ProtectedRoute adminOnly>
            <Layout><ProveedoresManager /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/reportes" element={
          <ProtectedRoute adminOnly>
            <Layout><AdminReportes /></Layout>
          </ProtectedRoute>
        } />

        <Route path="*" element={
          <Navigate to={currentUser ? (isAdmin ? '/admin' : '/dashboard') : '/login'} replace />
        } />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
}
