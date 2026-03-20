import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Link } from 'react-router-dom';
import { format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ locales: 0, pedidosHoy: 0, montoHoy: 0, facturasPendientes: 0, montoPendiente: 0 });
  const [resumenPorLocal, setResumenPorLocal] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    setLoading(true);
    const hoy = new Date();
    const inicio = Timestamp.fromDate(startOfDay(hoy));
    const fin = Timestamp.fromDate(endOfDay(hoy));

    try {
      const snapLocales = await getDocs(collection(db, 'locales'));
      const locales = snapLocales.docs.map(d => ({ id: d.id, ...d.data() }));

      const snapPedidos = await getDocs(query(
        collection(db, 'pedidos'),
        where('creadoEn', '>=', inicio),
        where('creadoEn', '<=', fin)
      ));
      const pedidosHoy = snapPedidos.docs.map(d => d.data());

      const snapFacturas = await getDocs(query(
        collection(db, 'facturas'),
        where('estado', 'in', ['pendiente_pago', 'pendiente_nc'])
      ));
      const facturasPend = snapFacturas.docs.map(d => d.data());

      // Resumen por local
      const resumPorLocal = locales.map(local => {
        const pedLocal = pedidosHoy.filter(p => p.local === local.nombre);
        const factLocal = facturasPend.filter(f => f.local === local.nombre);
        return {
          nombre: local.nombre,
          pedidos: pedLocal.length,
          montoPedidos: pedLocal.reduce((s, p) => s + (Number(p.monto) || 0), 0),
          facturasPend: factLocal.length,
          montoPend: factLocal.reduce((s, f) => s + (Number(f.monto) || 0), 0),
        };
      });

      setStats({
        locales: locales.length,
        pedidosHoy: pedidosHoy.length,
        montoHoy: pedidosHoy.reduce((s, p) => s + (Number(p.monto) || 0), 0),
        facturasPendientes: facturasPend.length,
        montoPendiente: facturasPend.reduce((s, f) => s + (Number(f.monto) || 0), 0),
      });
      setResumenPorLocal(resumPorLocal);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>Panel de Administrador</h1>
        <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: '14px' }}>
          {format(new Date(), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>Cargando datos...</div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            {[
              { label: 'Locales activos', value: stats.locales, icon: '🏪', color: '#7c3aed' },
              { label: 'Pedidos hoy', value: stats.pedidosHoy, icon: '📦', color: '#b41e1e' },
              { label: 'Monto pedidos hoy', value: `$${stats.montoHoy.toLocaleString('es-CL')}`, icon: '💰', color: '#059669' },
              { label: 'Facturas pendientes', value: stats.facturasPendientes, icon: '⏳', color: '#d97706' },
              { label: 'Monto pendiente total', value: `$${stats.montoPendiente.toLocaleString('es-CL')}`, icon: '💸', color: '#dc2626' },
            ].map((s, i) => (
              <div key={i} style={{
                background: 'white', borderRadius: '12px', padding: '18px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderLeft: `4px solid ${s.color}`,
              }}>
                <p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 6px' }}>{s.icon} {s.label}</p>
                <p style={{ fontWeight: '800', fontSize: '22px', margin: 0, color: '#111827' }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Acciones rápidas */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <Link to="/admin/locales" style={{ background: '#7c3aed', color: 'white', padding: '12px 20px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}>
              🏪 Gestionar locales
            </Link>
            <Link to="/admin/usuarios" style={{ background: '#1d4ed8', color: 'white', padding: '12px 20px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}>
              👥 Gestionar usuarios
            </Link>
            <Link to="/admin/reportes" style={{ background: '#059669', color: 'white', padding: '12px 20px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}>
              📊 Ver reportes globales
            </Link>
          </div>

          {/* Resumen por local */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#374151', margin: '0 0 16px' }}>Resumen de hoy por local</h2>
            {resumenPorLocal.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>No hay locales registrados</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['Local', 'Pedidos hoy', 'Monto pedidos', 'Facturas pendientes', 'Monto pendiente'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '700', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resumenPorLocal.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '700' }}>{row.nombre}</td>
                        <td style={{ padding: '12px 14px' }}>{row.pedidos}</td>
                        <td style={{ padding: '12px 14px', color: '#059669', fontWeight: '600' }}>${row.montoPedidos.toLocaleString('es-CL')}</td>
                        <td style={{ padding: '12px 14px' }}>{row.facturasPend}</td>
                        <td style={{ padding: '12px 14px', color: row.montoPend > 0 ? '#dc2626' : '#6b7280', fontWeight: '600' }}>${row.montoPend.toLocaleString('es-CL')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
