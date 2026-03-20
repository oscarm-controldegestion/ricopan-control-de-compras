import { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ESTADOS = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendiente_pago', label: '⏳ Pend. pago' },
  { value: 'pendiente_nc', label: '📝 Pend. NC' },
  { value: 'pagada', label: '✅ Pagada' },
  { value: 'completada', label: '🏁 Completada' },
];

const BADGE = {
  pendiente_pago: { label: 'Pendiente de pago', color: '#92400e', bg: '#fef3c7', border: '#f59e0b' },
  pendiente_nc: { label: 'Pendiente NC', color: '#1e40af', bg: '#dbeafe', border: '#3b82f6' },
  pagada: { label: 'Pagada', color: '#065f46', bg: '#d1fae5', border: '#10b981' },
  completada: { label: 'Completada', color: '#374151', bg: '#f3f4f6', border: '#9ca3af' },
};

function FacturaCard({ factura, onUpdate }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { userProfile } = useAuth();

  const badge = BADGE[factura.estado] || { label: factura.estado, color: '#374151', bg: '#f3f4f6', border: '#9ca3af' };

  async function handleComprobante(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `comprobantes/${userProfile.local}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'facturas', factura.id), {
        comprobanteURL: url,
        estado: 'pagada',
        fechaPago: Timestamp.now(),
      });
      onUpdate();
    } catch (e) {
      console.error(e);
    }
    setUploading(false);
  }

  async function cambiarEstado(nuevoEstado) {
    await updateDoc(doc(db, 'facturas', factura.id), { estado: nuevoEstado });
    onUpdate();
  }

  return (
    <div style={{
      background: 'white', borderRadius: '12px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      borderLeft: `4px solid ${badge.border}`,
      overflow: 'hidden',
    }}>
      <div
        style={{ padding: '16px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '700', fontSize: '16px', color: '#111827' }}>{factura.proveedor}</span>
            <span style={{
              padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
              background: badge.bg, color: badge.color,
            }}>{badge.label}</span>
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            {factura.numeroFactura && `Fact. N°: ${factura.numeroFactura} · `}
            Recibida: {factura.fechaRecepcion ? format(new Date(factura.fechaRecepcion + 'T00:00:00'), "dd MMM yyyy", { locale: es }) : '-'}
          </div>
        </div>
        <div style={{ textAlign: 'right', marginLeft: '12px' }}>
          <div style={{ fontWeight: '800', fontSize: '18px', color: '#111827' }}>${Number(factura.monto).toLocaleString('es-CL')}</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>{expanded ? '▲' : '▼'}</div>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid #f3f4f6' }}>
          {factura.observaciones && (
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '12px 0 10px', fontStyle: 'italic' }}>
              💬 {factura.observaciones}
            </p>
          )}

          {/* Foto factura */}
          {factura.fotoURL && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: '0 0 6px' }}>📷 Factura:</p>
              <a href={factura.fotoURL} target="_blank" rel="noopener noreferrer">
                <img src={factura.fotoURL} alt="Factura" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '8px' }} />
              </a>
            </div>
          )}

          {/* Comprobante pago */}
          {factura.comprobanteURL ? (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: '0 0 6px' }}>✅ Comprobante de pago:</p>
              <a href={factura.comprobanteURL} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-block', padding: '8px 14px', background: '#d1fae5',
                color: '#065f46', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '600',
              }}>
                Ver comprobante →
              </a>
            </div>
          ) : (factura.estado === 'pendiente_pago') && (
            <div style={{ marginBottom: '12px' }}>
              <input
                type="file"
                ref={fileRef}
                accept="image/*,application/pdf"
                onChange={handleComprobante}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{
                  padding: '10px 18px', background: uploading ? '#ccc' : '#1d4ed8',
                  color: 'white', border: 'none', borderRadius: '8px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: '14px', fontWeight: '600',
                }}
              >
                {uploading ? 'Subiendo...' : '📎 Subir comprobante de pago'}
              </button>
            </div>
          )}

          {/* Cambiar estado */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
            {['pendiente_pago', 'pendiente_nc', 'pagada', 'completada'].filter(e => e !== factura.estado).map(e => (
              <button
                key={e}
                onClick={() => cambiarEstado(e)}
                style={{
                  padding: '6px 12px', border: '1px solid #e5e7eb', background: '#f9fafb',
                  borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#374151',
                }}
              >
                → {BADGE[e]?.label || e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FacturasList() {
  const { userProfile } = useAuth();
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');

  useEffect(() => {
    if (userProfile?.local) cargarFacturas();
  }, [userProfile]);

  async function cargarFacturas() {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'facturas'),
        where('local', '==', userProfile.local),
        orderBy('creadoEn', 'desc')
      );
      const snap = await getDocs(q);
      setFacturas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const filtradas = filtroEstado === 'todos' ? facturas : facturas.filter(f => f.estado === filtroEstado);
  const totalMonto = filtradas.reduce((s, f) => s + (Number(f.monto) || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>🧾 Facturas</h1>
        <Link to="/facturas/nueva" style={{
          background: '#1d4ed8', color: 'white', padding: '10px 18px',
          borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '14px',
        }}>
          ➕ Nueva factura
        </Link>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
        {ESTADOS.map(e => (
          <button
            key={e.value}
            onClick={() => setFiltroEstado(e.value)}
            style={{
              padding: '8px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              background: filtroEstado === e.value ? '#b41e1e' : '#f3f4f6',
              color: filtroEstado === e.value ? 'white' : '#374151',
            }}
          >
            {e.label}
          </button>
        ))}
      </div>

      {/* Totales */}
      <div style={{ background: 'white', borderRadius: '10px', padding: '12px 18px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#6b7280', fontSize: '14px' }}>{filtradas.length} factura(s)</span>
        <span style={{ fontWeight: '700', color: '#b41e1e' }}>Total: ${totalMonto.toLocaleString('es-CL')}</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Cargando...</div>
      ) : filtradas.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize: '40px', margin: '0 0 12px' }}>🧾</p>
          <p style={{ color: '#6b7280' }}>Sin facturas{filtroEstado !== 'todos' ? ' con este estado' : ''}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtradas.map(f => (
            <FacturaCard key={f.id} factura={f} onUpdate={cargarFacturas} />
          ))}
        </div>
      )}
    </div>
  );
}
