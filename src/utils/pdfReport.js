import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function generarReportePDF({ local, pedidos, facturas, fecha }) {
  const doc = new jsPDF();
  const fechaStr = format(new Date(fecha), "dd 'de' MMMM 'de' yyyy", { locale: es });

  // Encabezado
  doc.setFillColor(180, 30, 30);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('RICOPAN', 14, 14);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Reporte Diario - ${local}`, 14, 22);
  doc.text(fechaStr, 140, 22);

  doc.setTextColor(0, 0, 0);
  let y = 38;

  // Resumen
  const totalPedidos = pedidos.reduce((s, p) => s + (Number(p.monto) || 0), 0);
  const totalFacturado = facturas.reduce((s, f) => s + (Number(f.monto) || 0), 0);
  const pendientePago = facturas.filter(f => f.estado === 'pendiente_pago').reduce((s, f) => s + (Number(f.monto) || 0), 0);
  const pendienteNC = facturas.filter(f => f.estado === 'pendiente_nc').reduce((s, f) => s + (Number(f.monto) || 0), 0);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen del día', 14, y);
  y += 7;

  const resumenData = [
    ['Total pedidos del día', `$${totalPedidos.toLocaleString('es-CL')}`],
    ['Total facturado', `$${totalFacturado.toLocaleString('es-CL')}`],
    ['Pendiente de pago', `$${pendientePago.toLocaleString('es-CL')}`],
    ['Pendiente nota de crédito', `$${pendienteNC.toLocaleString('es-CL')}`],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Concepto', 'Monto']],
    body: resumenData,
    theme: 'grid',
    headStyles: { fillColor: [180, 30, 30] },
    styles: { fontSize: 10 },
    columnStyles: { 1: { halign: 'right' } },
  });

  y = doc.lastAutoTable.finalY + 12;

  // Pedidos
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Pedidos realizados', 14, y);
  y += 4;

  if (pedidos.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Proveedor', 'Monto', 'Fecha entrega', 'Observaciones']],
      body: pedidos.map(p => [
        p.proveedor,
        `$${Number(p.monto).toLocaleString('es-CL')}`,
        p.fechaEntrega ? format(new Date(p.fechaEntrega), 'dd/MM/yyyy') : '-',
        p.observaciones || '-',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [60, 60, 60] },
      styles: { fontSize: 9 },
    });
    y = doc.lastAutoTable.finalY + 12;
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    doc.text('Sin pedidos registrados', 14, y + 5);
    doc.setTextColor(0);
    y += 14;
  }

  // Facturas
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Facturas recibidas', 14, y);
  y += 4;

  const estadoLabel = {
    pendiente_pago: 'Pendiente pago',
    pendiente_nc: 'Pendiente NC',
    pagada: 'Pagada',
    completada: 'Completada',
  };

  if (facturas.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['N° Factura', 'Proveedor', 'Monto', 'Estado', 'Fecha']],
      body: facturas.map(f => [
        f.numeroFactura || '-',
        f.proveedor,
        `$${Number(f.monto).toLocaleString('es-CL')}`,
        estadoLabel[f.estado] || f.estado,
        f.fechaRecepcion ? format(new Date(f.fechaRecepcion), 'dd/MM/yyyy') : '-',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [60, 60, 60] },
      styles: { fontSize: 9 },
    });
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    doc.text('Sin facturas registradas', 14, y + 5);
    doc.setTextColor(0);
  }

  // Pie de página
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Ricopan © ${new Date().getFullYear()} | Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm')} | Página ${i} de ${pageCount}`,
      14, 290
    );
  }

  const fileName = `Reporte_${local}_${format(new Date(fecha), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
