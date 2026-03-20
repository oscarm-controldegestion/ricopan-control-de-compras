import { useState } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { generarReportePDF } from '../utils/pdfReport';
import { generarReporteExcel } from '../utils/excelReport';
import { enviarReporteDiario } from '../utils/emailService';
import { format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Reportes() {
  const { userProfile } = useAuth();
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [datos, setDatos] = useState(null);
  const [mensaje, setMensaje] = useState('');

  async function cargarDatos() {
    if (!userProfile?.local) return;
    setLoading(true);
    setMensaje('');

    const inicio = Timestamp.fromDate(startOfDay(new Date(fecha + 'T00:00:00')));
    const fin = Timestamp.fromDate(endOfDay(new Date(fecha + 'T23:59:59')));

    try {
      const qPedidos = query(
        collection(db, 'pedidos'),
        where('local', '==', userProfile.local),
        where('creadoEn', '>=', inicio),
        where('creadoEn', '<=', fin)
      );
      const snapP = await getDocs(qPedidos);
      const pedidos = snapP.docs.map(d => ({ id: d.id, ...d.data() }));

      const qFacturas = query(
        collection(db, 'facturas'),
        where('local', '==', userProfile.local),
        where('creadoEn', '>=', inicio),
        where('creadoEn', '<=', fin)
      );
      const snapF = await getDocs(qFacturas);
      const facturas = snapF.docs.map(d => ({ id: d.id, ...d.data() }));

      setDatos({ pedidos, facturas });
    } catch (e) {
      console.error(e);
      setMensaje('Error al cargar datos.');
    }
    setLoading(false);
  }

  function handlePDF() {
    if (!datos) return;
    generarReportePDF({ local: userProfile.local, pedidos: datos.pedidos, facturas: datos.facturas, fecha });
  }

  function handleExcel() {
    if (!datos) return;
    generarReporteExcel({ local: userProfile.local, pedidos: datos.pedidos, facturas: datos.facturas, fecha });
  }

  async function handleEmail() {
    if (!datos) return;
    setEnviandoEmail(true);
    const totalPedidos = datos.pedidos.reduce((s, p) => s + (Number(p.monto) || 0), 0);
    const totalFacturado = datos.facturas.reduce((s, f) => s + (Number(f.monto) || 0), 0);

    try {
      await enviarReporteDiario({
        local: userProfile.local,
        fecha: format(new Date(fecha + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: es }),
        resumen: {
          totalPedidos,
          totalFacturado,
          pendientePago: datos.facturas.filter(f => f.estado === 'pendiente_pago').reduce((s, f) => s + (Number(f.monto) || 0), 0),
          pendienteNC: datos.facturas.filter(f => f.estado === 'pendiente_nc').reduce((s, f) => s + (Number(f.monto) || 0), 0),
          numPedidos: datos.pedidos.length,
          numFacturas: datos.facturas.length,
          detallePedidos: datos.pedidos.map(p => `${p.proveedor}: $${Number(p.monto).toLocaleString('es-CL')}`).join(', ') || 'Sin pedidos',
        },
      });
      setMensaje('✅ Reporte enviado al administrador exitosamente.');
    } catch (e) {
      console.error(e);
      setMensaje('❌ Error al enviar el correo. Verifica la configuración de EmailJS.');
    }
    setEnviandoEmail(false);
  }

  const resumen = datos ? {
    totalPedidos: datos.pedidos.reduce((s, p) => s + (Number(p.monto) || 0), 0),
    totalFacturado: datos.facturas.reduce((s, f) => s + (Number(f.monto) || 0), 0),
    pendientePago: datos.facturas.filter(f => f.estado === 'pendiente_pago').reduce((s, f) => s + (Number(f.monto) || 0), 0),
    pendienteNC: datos.facturas.filter(f => f.estado === 'pendiente_nc').reduce((s, f) => s + (Number(f.monto) || 0), 0),
  } : null;

  return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: '0 0 20px' }}>📊 Reportes</h1>

      {/* Selector fecha */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>
          Selecciona la fecha del reporte:
        </label>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="date"
            value={fecha}
            onChange={e => { setFecha(e.target.value); setDatos(null); }}
            style={{ padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px' }}
          />
          <button
            onClick={cargarDatos}
            disabled={loading}
            style={{
              padding: '10px 24px', background: '#b41e1e', color: 'white',
              border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Cargando...' : '🔍 Generar reporte'}
          </button>
        </div>
      </div>

      {mensaje && (
        <div style={{
          padding: '14px 18px', borderRadius: '10px', marginBottom: '16px',
          background: mensaje.startsWith('✅') ? '#d1fae5' : '#fee2e2',
          color: mensaje.startsWith('✅') ? '#065f46' : '#dc2626',
          fontWeight: '600', fontSize: '14px',
        }}>{mensaje}</div>
      )}

      {datos && (
        <>
          {/* Resumen */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px', color: '#374151' }}>
              Resumen — {format(new Date(fecha + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: es })} · {userProfile.local}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
              {[
                { label: 'Pedidos realizados', value: datos.pedidos.length, sub: `$${resumen.totalPedidos.toLocaleString('es-CL')}`, icon: '📦', color: '#b41e1e' },
                { label: 'Facturas recibidas', value: datos.facturas.length, sub: `$${resumen.totalFacturado.toLocaleString('es-CL')}`, icon: '🧾', color: '#1d4ed8' },
                { label: 'Pend. de pago', value: `$${resumen.pendientePago.toLocaleString('es-CL')}`, icon: '⏳', color: '#f59e0b' },
                { label: 'Pend. nota crédito', value: `$${resumen.pendienteNC.toLocaleString('es-CL')}`, icon: '📝', color: '#6366f1' },
              ].map((stat, i) => (
                <div key={i} style={{ padding: '14px', borderRadius: '10px', background: '#f9fafb', borderLeft: `3px solid ${stat.color}` }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{stat.icon} {stat.label}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: '800', color: '#111827' }}>{stat.value}</p>
                  {stat.sub && <p style={{ margin: '2px 0 0', fontSize: '13px', color: stat.color, fontWeight: '700' }}>{stat.sub}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Botones descarga */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 16px', color: '#374151' }}>Exportar reporte</h2>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handlePDF}
                style={{ padding: '13px 22px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                📄 Descargar PDF
              </button>
              <button
                onClick={handleExcel}
                style={{ padding: '13px 22px', background: '#15803d', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                📊 Descargar Excel
              </button>
              <button
                onClick={handleEmail}
                disabled={enviandoEmail}
                style={{ padding: '13px 22px', background: enviandoEmail ? '#ccc' : '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: enviandoEmail ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {enviandoEmail ? 'Enviando...' : '📧 Enviar al administrador'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
