import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';

export default function LocalesManager() {
  const [locales, setLocales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', direccion: '', telefono: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { cargarLocales(); }, []);

  async function cargarLocales() {
    setLoading(true);
    const snap = await getDocs(collection(db, 'locales'));
    setLocales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  function abrirFormNuevo() {
    setForm({ nombre: '', direccion: '', telefono: '' });
    setEditando(null);
    setShowForm(true);
  }

  function abrirFormEditar(local) {
    setForm({ nombre: local.nombre, direccion: local.direccion || '', telefono: local.telefono || '' });
    setEditando(local.id);
    setShowForm(true);
  }

  async function guardar(e) {
    e.preventDefault();
    setSaving(true);
    if (editando) {
      await updateDoc(doc(db, 'locales', editando), { ...form, actualizadoEn: Timestamp.now() });
    } else {
      await addDoc(collection(db, 'locales'), { ...form, creadoEn: Timestamp.now(), activo: true });
    }
    setShowForm(false);
    setSaving(false);
    cargarLocales();
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este local? Esta acción no se puede deshacer.')) return;
    await deleteDoc(doc(db, 'locales', id));
    cargarLocales();
  }

  const inputStyle = { width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>🏪 Gestión de Locales</h1>
        <button onClick={abrirFormNuevo} style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
          ➕ Nuevo local
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', marginBottom: '20px', border: '2px solid #7c3aed' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 18px', color: '#374151' }}>
            {editando ? 'Editar local' : 'Nuevo local'}
          </h2>
          <form onSubmit={guardar}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={labelStyle}>Nombre del local *</label>
                <input type="text" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} required placeholder="Ej: Ricopan Las Condes" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Teléfono</label>
                <input type="text" value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} placeholder="+56 9 XXXX XXXX" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Dirección</label>
              <input type="text" value={form.direccion} onChange={e => setForm(p => ({ ...p, direccion: e.target.value }))} placeholder="Calle, número, comuna" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '11px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={saving} style={{ flex: 2, padding: '11px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                {saving ? 'Guardando...' : '✓ Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de locales */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Cargando...</div>
      ) : locales.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize: '40px', margin: '0 0 12px' }}>🏪</p>
          <p style={{ color: '#6b7280' }}>No hay locales registrados</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {locales.map(local => (
            <div key={local.id} style={{ background: 'white', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '16px', color: '#111827' }}>🏪 {local.nombre}</p>
                {local.direccion && <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#6b7280' }}>📍 {local.direccion}</p>}
                {local.telefono && <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>📞 {local.telefono}</p>}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => abrirFormEditar(local)} style={{ padding: '8px 14px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>✏️ Editar</button>
                <button onClick={() => eliminar(local.id)} style={{ padding: '8px 14px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>🗑️ Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
