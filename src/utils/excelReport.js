import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export function generarReporteExcel({ local, pedidos, facturas, fecha }) {
  const wb = XLSX.utils.book_new();
  const fechaStr = format(new Date(fecha), 'dd/MM/yyyy');

  // ── Hoja 1: Pedidos ──────────────────────────────────────────────
  const pedidosData = [
    [`REPORTE DE PEDIDOS - ${local} - ${fechaStr}`],
    [],
    ['Proveedor', 'Monto ($)', 'Fecha entrega', 'Observaciones', 'Registrado por', 'Hora registro'],
    ...pedidos.map(p => [
      p.proveedor,
      Number(p.monto) || 0,
      p.fechaEntrega || '-',
      p.observaciones || '-',
      p.registradoPor || '-',
      p.creadoEn ? format(new Date(p.creadoEn.toDate ? p.creadoEn.toDate() : p.creadoEn), 'HH:mm') : '-',
    ]),
    [],
    ['TOTAL', pedidos.reduce((s, p) => s + (Number(p.monto) || 0), 0)],
  ];

  const wsPedidos = XLSX.utils.aoa_to_sheet(pedidosData);
  wsPedidos['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 30 }, { wch: 16 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsPedidos, 'Pedidos');

  // ── Hoja 2: Facturas ─────────────────────────────────────────────
  const estadoLabel = {
    pendiente_pago: 'Pendiente de pago',
    pendiente_nc: 'Pendiente nota crédito',
    pagada: 'Pagada',
    completada: 'Completada',
  };

  const facturasData = [
    [`REPORTE DE FACTURAS - ${local} - ${fechaStr}`],
    [],
    ['N° Factura', 'Proveedor', 'Monto ($)', 'Estado', 'Fecha recepción', 'Observaciones'],
    ...facturas.map(f => [
      f.numeroFactura || '-',
      f.proveedor,
      Number(f.monto) || 0,
      estadoLabel[f.estado] || f.estado,
      f.fechaRecepcion || '-',
      f.observaciones || '-',
    ]),
    [],
    ['TOTAL FACTURADO', facturas.reduce((s, f) => s + (Number(f.monto) || 0), 0)],
    ['PENDIENTE PAGO', facturas.filter(f => f.estado === 'pendiente_pago').reduce((s, f) => s + (Number(f.monto) || 0), 0)],
    ['PENDIENTE NC', facturas.filter(f => f.estado === 'pendiente_nc').reduce((s, f) => s + (Number(f.monto) || 0), 0)],
  ];

  const wsFacturas = XLSX.utils.aoa_to_sheet(facturasData);
  wsFacturas['!cols'] = [{ wch: 14 }, { wch: 20 }, { wch: 14 }, { wch: 24 }, { wch: 16 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsFacturas, 'Facturas');

  // ── Hoja 3: Resumen ───────────────────────────────────────────────
  const resumenData = [
    ['RESUMEN DIARIO - RICOPAN'],
    [`Local: ${local}`],
    [`Fecha: ${fechaStr}`],
    [],
    ['Indicador', 'Valor'],
    ['Total pedidos', pedidos.length],
    ['Monto total pedidos', pedidos.reduce((s, p) => s + (Number(p.monto) || 0), 0)],
    ['Total facturas recibidas', facturas.length],
    ['Monto total facturado', facturas.reduce((s, f) => s + (Number(f.monto) || 0), 0)],
    ['Facturas pendientes de pago', facturas.filter(f => f.estado === 'pendiente_pago').length],
    ['Monto pendiente de pago', facturas.filter(f => f.estado === 'pendiente_pago').reduce((s, f) => s + (Number(f.monto) || 0), 0)],
    ['Facturas pendientes NC', facturas.filter(f => f.estado === 'pendiente_nc').length],
    ['Monto pendiente NC', facturas.filter(f => f.estado === 'pendiente_nc').reduce((s, f) => s + (Number(f.monto) || 0), 0)],
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  wsResumen['!cols'] = [{ wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  const fileName = `Reporte_${local}_${format(new Date(fecha), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
