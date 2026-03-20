import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, setDoc, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase';

export default function UsuariosManager() {
  const [usuarios, setUsuarios] = useState([]);
  const [locales, setLocales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'atendedora', local: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    setLoading(true);
    const [snapU, snapL] = await Promise.all([
      getDocs(collection(db, 'usuarios')),
      getDocs(collection(db, 'locales')),
    ]);
    setUsuarios(snapU.docs.map(d => ({ id: d.id, ...d.data() })));
    setLocales(snapL.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  async function crearUsuario(e) {
    e.preventDefault();
    setError(''); setOk('');
    if (!form.email || !form.password || !form.nombre) { setError('Completa todos los campos'); return; }
    if (form.rol === 'atendedora' && !form.local) { setError('Selecciona el local'); return; }
    setSaving(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await setDoc(doc(db, 'usuarios', cred.user.uid), {
        nombre: form.nombre,
        email: form.email,
        rol: form.rol,
        local: form.rol === 'atendedora' ? form.local : 'Todos',
        creadoEn: Timestamp.now(),
        activo: true,
      });
      setOk(`✅ Usuario ${form.nombre} creado exitosamente.`);
      setShowForm(false);
      setForm({ nombre: '', email: '', password: '', rol: 'atendedora', local: '' });
      cargarDatos();
    } catch (e) {
      console.error(e);
      if (e.code === 'auth/email-already-in-use') setError('Este correo ya está registrado.');
      else if (e.code === 'auth/weak-password') setError('La contraseña debe tener al menos 6 caracteres.');
      else setError('Error al crear usuario: ' + e.message);
    }
    setSaving(false);
  }

  async function toggleActivo(uid, activo) {
    await updateDoc(doc(db, 'usuarios', uid), { activo: !activo });
    cargarDatos();
  }

  const inputStyle = { width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>👥 Gestión de Usuarios</h1>
        <button onClick={() => { setShowForm(true); setError(''); setOk(''); }} style={{ background: '#1d4ed8', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
          ➕ Nuevo usuario
        </button>
      </div>

      {ok && <div style={{ background: '#d1fae5', color: '#065f46', padding: '12px 18px', borderRadius: '10px', marginBottom: '16px', fontWeight: '600' }}>{ok}</div>}

      {showForm && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', marginBottom: '20px', border: '2px solid #1d4ed8' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 18px' }}>Crear nuevo usuario</h2>
          {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '8px', marginBottom: '14px', fontSize: '14px' }}>{error}</div>}
          <form onSubmit={crearUsuario}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={labelStyle}>Nombre *</label>
                <input type="text" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} required placeholder="Nombre completo" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Rol *</label>
                <select value={form.rol} onChange={e => setForm(p => ({ ...p, rol: e.target.value }))} style={inputStyle}>
                  <option value="atendedora">Atendedora</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={labelStyle}>Correo electrónico *</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required placeholder="correo@ejemplo.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Contraseña *</label>
                <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required placeholder="Mínimo 6 caracteres" style={inputStyle} />
              </div>
            </div>
            {form.rol === 'atendedora' && (
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Local asignado *</label>
                <select value={form.local} onChange={e => setForm(p => ({ ...p, local: e.target.value }))} required style={inputStyle}>
                  <option value="">Selecciona un local...</option>
                  {locales.map(l => <option key={l.id} value={l.nombre}>{l.nombre}</option>)}
                </select>
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '11px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={saving} style={{ flex: 2, padding: '11px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                {saving ? 'Creando...' : '✓ Crear usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Cargando...</div>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {usuarios.map(u => (
            <div key={u.id} style={{ background: 'white', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', opacity: u.activo === false ? 0.6 : 1 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{u.rol === 'admin' ? '👑' : '👤'}</span>
                  <p style={{ margin: 0, fontWeight: '700', fontSize: '15px' }}>{u.nombre}</p>
                  <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: u.rol === 'admin' ? '#fef3c7' : '#dbeafe', color: u.rol === 'admin' ? '#92400e' : '#1e40af' }}>
                    {u.rol === 'admin' ? 'Administrador' : 'Atendedora'}
                  </span>
                </div>
                <p style={{ margin: '3px 0 0 30px', fontSize: '13px', color: '#6b7280' }}>
                  {u.email} {u.local && u.local !== 'Todos' ? `· 🏪 ${u.local}` : ''}
                </p>
              </div>
              <button
                onClick={() => toggleActivo(u.id, u.activo !== false)}
                style={{
                  padding: '7px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                  background: u.activo === false ? '#d1fae5' : '#fee2e2',
                  color: u.activo === false ? '#065f46' : '#dc2626',
                }}
              >
                {u.activo === false ? '✅ Activar' : '⛔ Desactivar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
