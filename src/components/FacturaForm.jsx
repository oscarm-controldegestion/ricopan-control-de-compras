import { useState, useRef } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const PROVEEDORES = [
  'Coca Cola', 'CCU', 'Ambev', 'Dos en Uno', 'Pan Ideal',
  'Loncoleche', 'Nestlé', 'Carozzi', 'Watts', 'Soprole', 'Otro',
];

export default function FacturaForm() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [form, setForm] = useState({
    proveedor: '',
    proveedorCustom: '',
    numeroFactura: '',
    monto: '',
    fechaRecepcion: format(new Date(), 'yyyy-MM-dd'),
    estado: 'pendiente_pago',
    observaciones: '',
  });
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFoto(file);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.proveedor) { setError('Selecciona un proveedor'); return; }
    if (!form.monto || Number(form.monto) <= 0) { setError('Ingresa un monto válido'); return; }

    setLoading(true);
    try {
      let fotoURL = null;
      if (foto) {
        const storageRef = ref(storage, `facturas/${userProfile.local}/${Date.now()}_${foto.name}`);
        await uploadBytes(storageRef, foto);
        fotoURL = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'facturas'), {
        local: userProfile.local,
        proveedor: form.proveedor === 'Otro' ? form.proveedorCustom : form.proveedor,
        numeroFactura: form.numeroFactura,
        monto: Number(form.monto),
        fechaRecepcion: form.fechaRecepcion,
        estado: form.estado,
        observaciones: form.observaciones,
        fotoURL,
        creadoEn: Timestamp.now(),
        creadoPor: currentUser.uid,
        registradoPor: userProfile.nombre || currentUser.email,
      });

      navigate('/facturas');
    } catch (e) {
      console.error(e);
      setError('Error al guardar la factura. Intenta nuevamente.');
    }
    setLoading(false);
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', border: '2px solid #e5e7eb',
    borderRadius: '8px', fontSize: '15px', outline: 'none',
    boxSizing: 'border-box', background: 'white',
  };
  const labelStyle = { display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>←</button>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>Registrar Factura</h1>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>{userProfile?.local}</p>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '14px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', maxWidth: '580px' }}>
        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px', color: '#dc2626', fontSize: '14px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Foto factura */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>📷 Foto de la factura</label>
            <input
              type="file"
              ref={fileRef}
              accept="image/*,application/pdf"
              capture="environment"
              onChange={handleFile}
              style={{ display: 'none' }}
            />
            {preview ? (
              <div style={{ position: 'relative' }}>
                <img src={preview} alt="Factura" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e5e7eb' }} />
                <button
                  type="button"
                  onClick={() => { setFoto(null); setPreview(null); }}
                  style={{
                    position: 'absolute', top: '8px', right: '8px',
                    background: '#dc2626', color: 'white', border: 'none',
                    borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px',
                  }}
                >✕</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  width: '100%', padding: '30px', border: '2px dashed #d1d5db',
                  borderRadius: '8px', background: '#f9fafb', cursor: 'pointer',
                  color: '#6b7280', fontSize: '14px', textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
                Toca para sacar foto o subir imagen de la factura
              </button>
            )}
          </div>

          {/* Proveedor */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Proveedor *</label>
            <select name="proveedor" value={form.proveedor} onChange={handleChange} required style={inputStyle}>
              <option value="">Selecciona un proveedor...</option>
              {PROVEEDORES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {form.proveedor === 'Otro' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Nombre del proveedor *</label>
              <input type="text" name="proveedorCustom" value={form.proveedorCustom} onChange={handleChange} required placeholder="Nombre del proveedor" style={inputStyle} />
            </div>
          )}

          {/* Número factura y monto */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>N° Factura</label>
              <input type="text" name="numeroFactura" value={form.numeroFactura} onChange={handleChange} placeholder="Ej: 123456" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Monto ($) *</label>
              <input type="number" name="monto" value={form.monto} onChange={handleChange} required min="1" placeholder="0" style={inputStyle} />
            </div>
          </div>

          {/* Fecha recepción */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Fecha de recepción *</label>
            <input type="date" name="fechaRecepcion" value={form.fechaRecepcion} onChange={handleChange} required style={inputStyle} />
          </div>

          {/* Estado */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Estado *</label>
            <select name="estado" value={form.estado} onChange={handleChange} required style={inputStyle}>
              <option value="pendiente_pago">⏳ Pendiente de pago</option>
              <option value="pendiente_nc">📝 Pendiente nota de crédito</option>
              <option value="pagada">✅ Pagada</option>
            </select>
          </div>

          {/* Observaciones */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Observaciones</label>
            <textarea name="observaciones" value={form.observaciones} onChange={handleChange} placeholder="Detalles adicionales..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={() => navigate(-1)} style={{ flex: 1, padding: '13px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', color: '#374151' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ flex: 2, padding: '13px', background: loading ? '#ccc' : 'linear-gradient(135deg, #1d4ed8, #1e3a8a)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Guardando...' : '✓ Guardar factura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
