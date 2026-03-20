import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

function StatCard({ label, value, icon, color = '#b41e1e', sub }) {
  return (
    <div style={{
      background: 'white', borderRadius: '12px', padding: '18px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 4px' }}>{label}</p>
          <p style={{ color: '#111827', fontSize: '22px', fontWeight: '700', margin: 0 }}>{value}</p>
          {sub && <p style={{ color: '#9ca3af', fontSize: '12px', margin: '4px 0 0' }}>{sub}</p>}
        </div>
        <span style={{ fontSize: '28px' }}>{icon}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({ pedidos: 0, facturas: 0, montoHoy: 0, pendientes: 0 });
  const [recentPedidos, setRecentPedidos] = useState([]);
  const [recentFacturas, setRecentFacturas] = useState([]);
  const [loading, setLoading] = useState(true);

  const hoy = new Date();
  const localNombre = userProfile?.local || '';

  useEffect(() => {
    if (!localNombre) return;
    cargarDatos();
  }, [localNombre]);

  async function cargarDatos() {
    setLoading(true);
    const inicio = Timestamp.fromDate(startOfDay(hoy));
    const fin = Timestamp.fromDate(endOfDay(hoy));

    try {
      // Pedidos de hoy
      const qPedidos = query(
        collection(db, 'pedidos'),
        where('local', '==', localNombre),
        where('creadoEn', '>=', inicio),
        where('creadoEn', '<=', fin)
      );
      const snapPedidos = await getDocs(qPedidos);
      const pedidosHoy = snapPedidos.docs.map(d => ({ id: d.id, ...d.data() }));

      // Facturas pendientes
      const qFacturas = query(
        collection(db, 'facturas'),
        where('local', '==', localNombre),
        where('estado', 'in', ['pendiente_pago', 'pendiente_nc'])
      );
      const snapFacturas = await getDocs(qFacturas);
      const facturasPendientes = snapFacturas.docs.map(d => ({ id: d.id, ...d.data() }));

      // Ultimas facturas
      const qUltFacturas = query(
        collection(db, 'facturas'),
        where('local', '==', localNombre),
        orderBy('creadoEn', 'desc'),
        limit(5)
      );
      const snapUltFacturas = await getDocs(qUltFacturas);

      setStats({
        pedidos: pedidosHoy.length,
        facturas: facturasPendientes.length,
        montoHoy: pedidosHoy.reduce((s, p) => s + (Number(p.monto) || 0), 0),
        pendientes: facturasPendientes.reduce((s, f) => s + (Number(f.monto) || 0), 0),
      });
      setRecentPedidos(pedidosHoy.slice(0, 4));
      setRecentFacturas(snapUltFacturas.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const estadoBadge = {
    pendiente_pago: { label: 'Pend. pago', color: '#f59e0b', bg: '#fef3c7' },
    pendiente_nc: { label: 'Pend. NC', color: '#3b82f6', bg: '#dbeafe' },
    pagada: { label: 'Pagada', color: '#10b981', bg: '#d1fae5' },
    completada: { label: 'Completada', color: '#6b7280', bg: '#f3f4f6' },
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>
          Bienvenida{userProfile?.nombre ? `, ${userProfile.nombre}` : ''}! 👋
        </h1>
        <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: '14px' }}>
          {format(hoy, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })} · {localNombre}
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Cargando...</div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            <StatCard label="Pedidos hoy" value={stats.pedidos} icon="📦" color="#b41e1e" />
            <StatCard label="Monto pedidos hoy" value={`$${stats.montoHoy.toLocaleString('es-CL')}`} icon="💰" color="#10b981" />
            <StatCard label="Facturas pendientes" value={stats.facturas} icon="🧾" color="#f59e0b" sub="requieren acción" />
            <StatCard label="Monto pendiente" value={`$${stats.pendientes.toLocaleString('es-CL')}`} icon="⏳" color="#3b82f6" />
          </div>

          {/* Acciones rápidas */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <Link to="/pedidos/nuevo" style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#b41e1e', color: 'white', padding: '12px 20px',
              borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '14px',
            }}>
              ➕ Registrar pedido
            </Link>
            <Link to="/facturas/nueva" style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#1d4ed8', color: 'white', padding: '12px 20px',
              borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '14px',
            }}>
              🧾 Registrar factura
            </Link>
            <Link to="/reportes" style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#059669', color: 'white', padding: '12px 20px',
              borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '14px',
            }}>
              📊 Ver reportes
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Pedidos recientes */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', gridColumn: '1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 }}>📦 Pedidos de hoy</h2>
                <Link to="/pedidos" style={{ fontSize: '13px', color: '#b41e1e', textDecoration: 'none' }}>Ver todos</Link>
              </div>
              {recentPedidos.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                  Sin pedidos registrados hoy
                </p>
              ) : (
                recentPedidos.map(p => (
                  <div key={p.id} style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#111827' }}>{p.proveedor}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>Entrega: {p.fechaEntrega || 'Por confirmar'}</p>
                    </div>
                    <p style={{ margin: 0, fontWeight: '700', color: '#b41e1e', fontSize: '15px' }}>
                      ${Number(p.monto).toLocaleString('es-CL')}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Facturas recientes */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', gridColumn: '2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 }}>🧾 Facturas recientes</h2>
                <Link to="/facturas" style={{ fontSize: '13px', color: '#b41e1e', textDecoration: 'none' }}>Ver todas</Link>
              </div>
              {recentFacturas.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                  Sin facturas registradas
                </p>
              ) : (
                recentFacturas.map(f => {
                  const badge = estadoBadge[f.estado] || { label: f.estado, color: '#6b7280', bg: '#f3f4f6' };
                  return (
                    <div key={f.id} style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>{f.proveedor}</p>
                          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>N°: {f.numeroFactura || '-'}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontWeight: '700', fontSize: '14px' }}>${Number(f.monto).toLocaleString('es-CL')}</p>
                          <span style={{
                            display: 'inline-block', marginTop: '2px',
                            padding: '2px 8px', borderRadius: '20px',
                            background: badge.bg, color: badge.color,
                            fontSize: '11px', fontWeight: '600',
                          }}>{badge.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
