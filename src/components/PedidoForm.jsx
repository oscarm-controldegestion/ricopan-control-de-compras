import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const PROVEEDORES = [
  'Coca Cola', 'CCU', 'Ambev', 'Dos en Uno', 'Pan Ideal',
  'Loncoleche', 'Nestlé', 'Carozzi', 'Watts', 'Soprole',
  'Otro',
];

export default function PedidoForm() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    proveedor: '',
    proveedorCustom: '',
    monto: '',
    fechaEntrega: format(new Date(), 'yyyy-MM-dd'),
    observaciones: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.proveedor) { setError('Selecciona un proveedor'); return; }
    if (!form.monto || isNaN(form.monto) || Number(form.monto) <= 0) { setError('Ingresa un monto válido'); return; }

    setLoading(true);
    try {
      await addDoc(collection(db, 'pedidos'), {
        local: userProfile.local,
        proveedor: form.proveedor === 'Otro' ? form.proveedorCustom : form.proveedor,
        monto: Number(form.monto),
        fechaEntrega: form.fechaEntrega,
        observaciones: form.observaciones,
        creadoEn: Timestamp.now(),
        creadoPor: currentUser.uid,
        registradoPor: userProfile.nombre || currentUser.email,
      });
      navigate('/pedidos');
    } catch (e) {
      console.error(e);
      setError('Error al guardar el pedido. Intenta nuevamente.');
    }
    setLoading(false);
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', border: '2px solid #e5e7eb',
    borderRadius: '8px', fontSize: '15px', outline: 'none',
    boxSizing: 'border-box', background: 'white',
  };

  const labelStyle = {
    display: 'block', fontSize: '14px', fontWeight: '600',
    color: '#374151', marginBottom: '6px',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', padding: '4px',
        }}>←</button>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>Registrar Pedido</h1>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>{userProfile?.local}</p>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '14px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', maxWidth: '560px' }}>
        {error && (
          <div style={{
            background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px',
            padding: '12px', color: '#dc2626', fontSize: '14px', marginBottom: '20px',
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Proveedor */}
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Proveedor *</label>
            <select
              name="proveedor"
              value={form.proveedor}
              onChange={handleChange}
              required
              style={inputStyle}
            >
              <option value="">Selecciona un proveedor...</option>
              {PROVEEDORES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {form.proveedor === 'Otro' && (
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Nombre del proveedor *</label>
              <input
                type="text"
                name="proveedorCustom"
                value={form.proveedorCustom}
                onChange={handleChange}
                required
                placeholder="Escribe el nombre del proveedor"
                style={inputStyle}
              />
            </div>
          )}

          {/* Monto */}
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Monto del pedido ($) *</label>
            <input
              type="number"
              name="monto"
              value={form.monto}
              onChange={handleChange}
              required
              min="1"
              placeholder="0"
              style={inputStyle}
            />
          </div>

          {/* Fecha entrega */}
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Fecha de entrega *</label>
            <input
              type="date"
              name="fechaEntrega"
              value={form.fechaEntrega}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          {/* Observaciones */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Observaciones</label>
            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              placeholder="Detalles adicionales del pedido..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                flex: 1, padding: '13px', background: '#f3f4f6', border: 'none',
                borderRadius: '8px', fontSize: '15px', fontWeight: '600',
                cursor: 'pointer', color: '#374151',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2, padding: '13px',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #b41e1e, #7a0e0e)',
                color: 'white', border: 'none', borderRadius: '8px',
                fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Guardando...' : '✓ Guardar pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
