import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PedidosList() {
  const { userProfile } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaFiltro, setFechaFiltro] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [verEliminados, setVerEliminados] = useState(false);
  const [confirmando, setConfirmando] = useState(null); // id del pedido a eliminar

  useEffect(() => {
    if (userProfile?.local) cargarPedidos();
  }, [userProfile, fechaFiltro]);

  async function cargarPedidos() {
    setLoading(true);
    const inicio = startOfDay(new Date(fechaFiltro + 'T00:00:00'));
    const fin = endOfDay(new Date(fechaFiltro + 'T23:59:59'));

    try {
      const q = query(collection(db, 'pedidos'), orderBy('creadoEn', 'desc'));
      const snap = await getDocs(q);
      const todos = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      const localFiltro = userProfile.local;
      const filtrados = todos.filter(p => {
        const matchLocal = localFiltro === 'Todos' || p.local === localFiltro;
        const fecha = p.creadoEn?.toDate ? p.creadoEn.toDate() : null;
        const matchFecha = fecha && fecha >= inicio && fecha <= fin;
        return matchLocal && matchFecha;
      });

      setPedidos(filtrados);
    } catch (e) {
      console.error('Error cargando pedidos:', e);
    }
    setLoading(false);
  }

  async function eliminarPedido(pedido) {
    try {
      await updateDoc(doc(db, 'pedidos', pedido.id), {
        eliminado: true,
        eliminadoEn: Timestamp.now(),
        eliminadoPor: userProfile?.nombre || '',
      });
      setConfirmando(null);
      cargarPedidos();
    } catch (e) {
      console.error('Error eliminando pedido:', e);
    }
  }

  async function restaurarPedido(pedido) {
    try {
      await updateDoc(doc(db, 'pedidos', pedido.id), {
        eliminado: false,
        eliminadoEn: null,
        eliminadoPor: null,
      });
      cargarPedidos();
    } catch (e) {
      console.error('Error restaurando pedido:', e);
    }
  }

  const activos = pedidos.filter(p => !p.eliminado);
  const eliminados = pedidos.filter(p => p.eliminado);
  const visibles = verEliminados ? eliminados : activos;
  const totalHoy = activos.reduce((s, p) => s + (Number(p.monto) || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>📦 Pedidos</h1>
        <Link to="/pedidos/nuevo" style={{
          background: '#b41e1e', color: 'white', padding: '10px 18px',
          borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '14px',
        }}>
          ➕ Nuevo pedido
        </Link>
      </div>

      {/* Filtro fecha */}
      <div style={{ background: 'white', borderRadius: '10px', padding: '14px 18px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Fecha:</label>
        <input
          type="date"
          value={fechaFiltro}
          onChange={e => setFechaFiltro(e.target.value)}
          style={{ padding: '8px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
        />
        <span style={{ marginLeft: 'auto', fontWeight: '700', color: '#b41e1e', fontSize: '16px' }}>
          Total: ${totalHoy.toLocaleString('es-CL')}
        </span>
      </div>

      {/* Toggle activos / eliminados */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setVerEliminados(false)}
          style={{
            padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
            border: 'none', cursor: 'pointer',
            background: !verEliminados ? '#b41e1e' : '#f3f4f6',
            color: !verEliminados ? 'white' : '#374151',
          }}
        >
          📦 Activos ({activos.length})
        </button>
        <button
          onClick={() => setVerEliminados(true)}
          style={{
            padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
            border: 'none', cursor: 'pointer',
            background: verEliminados ? '#6b7280' : '#f3f4f6',
            color: verEliminados ? 'white' : '#374151',
          }}
        >
          🗑️ Eliminados ({eliminados.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Cargando...</div>
      ) : visibles.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize: '40px', margin: '0 0 12px' }}>{verEliminados ? '🗑️' : '📦'}</p>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>
            {verEliminados ? 'Sin pedidos eliminados en esta fecha' : 'Sin pedidos para esta fecha'}
          </p>
          {!verEliminados && (
            <Link to="/pedidos/nuevo" style={{ color: '#b41e1e', textDecoration: 'none', fontWeight: '700' }}>
              Registrar primer pedido →
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {visibles.map(p => (
            <div key={p.id} style={{
              background: 'white', borderRadius: '12px', padding: '16px 18px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center',
              borderLeft: `4px solid ${p.eliminado ? '#9ca3af' : '#b41e1e'}`,
              opacity: p.eliminado ? 0.75 : 1,
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '16px', color: p.eliminado ? '#6b7280' : '#111827' }}>
                  {p.eliminado && <span style={{ fontSize: '13px', background: '#f3f4f6', color: '#6b7280', padding: '2px 8px', borderRadius: '10px', marginRight: '8px', fontWeight: '600' }}>Eliminado</span>}
                  {p.proveedor}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#6b7280' }}>
                  📅 Entrega: {p.fechaEntrega ? format(new Date(p.fechaEntrega + 'T00:00:00'), "dd 'de' MMMM", { locale: es }) : 'Por confirmar'}
                </p>
                {p.observaciones && (
                  <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>{p.observaciones}</p>
                )}
                {p.eliminado && p.eliminadoPor && (
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                    Eliminado por: {p.eliminadoPor}
                    {p.eliminadoEn?.toDate ? ` · ${format(p.eliminadoEn.toDate(), 'dd/MM HH:mm')}` : ''}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontWeight: '800', fontSize: '18px', color: p.eliminado ? '#9ca3af' : '#b41e1e' }}>
                    ${Number(p.monto).toLocaleString('es-CL')}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                    {p.creadoEn?.toDate ? format(p.creadoEn.toDate(), 'HH:mm') : ''}
                  </p>
                </div>

                {/* Botón eliminar / restaurar */}
                {p.eliminado ? (
                  <button
                    onClick={() => restaurarPedido(p)}
                    title="Restaurar pedido"
                    style={{
                      padding: '7px 12px', border: 'none', borderRadius: '8px',
                      background: '#d1fae5', color: '#065f46',
                      fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                    }}
                  >
                    ↩ Restaurar
                  </button>
                ) : confirmando === p.id ? (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => eliminarPedido(p)}
                      style={{
                        padding: '7px 12px', border: 'none', borderRadius: '8px',
                        background: '#dc2626', color: 'white',
                        fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                      }}
                    >
                      ✓ Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmando(null)}
                      style={{
                        padding: '7px 10px', border: 'none', borderRadius: '8px',
                        background: '#f3f4f6', color: '#374151',
                        fontSize: '13px', cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmando(p.id)}
                    title="Eliminar pedido"
                    style={{
                      padding: '7px 10px', border: 'none', borderRadius: '8px',
                      background: '#fee2e2', color: '#dc2626',
                      fontSize: '15px', cursor: 'pointer',
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
