import emailjs from 'emailjs-com';

// ⚠️ Configurar en EmailJS (https://www.emailjs.com/)
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'TU_SERVICE_ID';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'TU_TEMPLATE_ID';
const USER_ID = import.meta.env.VITE_EMAILJS_USER_ID || 'TU_USER_ID';

export async function enviarReporteDiario({ local, resumen, fecha }) {
  const templateParams = {
    to_email: 'adm.pasteleriaricopan@gmail.com',
    local_nombre: local,
    fecha: fecha,
    total_pedidos: resumen.totalPedidos.toLocaleString('es-CL'),
    total_facturado: resumen.totalFacturado.toLocaleString('es-CL'),
    pendiente_pago: resumen.pendientePago.toLocaleString('es-CL'),
    pendiente_nc: resumen.pendienteNC.toLocaleString('es-CL'),
    num_pedidos: resumen.numPedidos,
    num_facturas: resumen.numFacturas,
    detalle_pedidos: resumen.detallePedidos,
  };

  return emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, USER_ID);
}
