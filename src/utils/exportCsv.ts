import {
  DischargeConfig,
  FlowPointResult,
  FluidProperties,
  PipeSegment,
  SuctionConfig
} from '../types';
import { getInternalDiameterInches, getInternalDiameterMm } from './pipeData';
import { feetToMeters } from './unitConversions';

export function generateTdhReportCsv(
  fluid: FluidProperties,
  suction: SuctionConfig,
  discharge: DischargeConfig,
  segments: PipeSegment[],
  nominalResult: FlowPointResult,
  allFlowCurveResults: FlowPointResult[]
): string {
  const lines: string[] = [];

  lines.push('REPORTE DE INGENIERÍA - CABEZA DINÁMICA TOTAL (TDH) PARA BOMBAS');
  lines.push(`Fecha de cálculo,"${new Date().toLocaleString()}"`);
  lines.push('');

  // 1. Fluid properties
  lines.push('1. PROPIEDADES DEL FLUIDO EVALUADO');
  lines.push(`Fluido,"${fluid.name}"`);
  lines.push(`Gravedad Específica (SG),${fluid.sg}`);
  lines.push(`Densidad (kg/m³),${(fluid.sg * 1000).toFixed(1)}`);
  lines.push(`Viscosidad Dinámica (cP = mPa·s),${fluid.dynamicViscosityCp}`);
  lines.push(`Viscosidad Cinemática (cSt = mm²/s),${(fluid.dynamicViscosityCp / fluid.sg).toFixed(2)}`);
  if (fluid.temperatureC !== undefined) lines.push(`Temperatura (°C / °F),"${fluid.temperatureC}°C (${((fluid.temperatureC * 9) / 5 + 32).toFixed(1)}°F)"`);
  if (fluid.brix !== undefined) lines.push(`Sólidos Solubles (°Brix),${fluid.brix}`);
  lines.push('');

  // 2. Head Breakdown
  lines.push('2. DESGLOSE DE CABEZA DINÁMICA TOTAL (PUNTO NOMINAL)');
  lines.push(`Caudal Nominal Evaluado,"${nominalResult.flowGpm.toFixed(1)} GPM | ${nominalResult.flowM3h.toFixed(1)} m³/h | ${nominalResult.flowTonsH.toFixed(1)} ton/h"`);
  lines.push('Componente de Cabeza,Cabeza (ft),Cabeza (m),Presión Equivalente (psi),Porcentaje (%)');
  
  const totalH = nominalResult.totalDynamicHeadFt || 1;
  const staticH = nominalResult.staticHeadFt;
  const frictionH = nominalResult.frictionLossFt;
  const minorH = nominalResult.minorLossFt;
  const pressH = nominalResult.deliveryPressureHeadFt;
  const eqH = nominalResult.equipmentLossHeadFt;

  const toPsi = (h: number) => ((h * fluid.sg) / 2.30666).toFixed(2);
  const pct = (h: number) => ((h / totalH) * 100).toFixed(1);

  lines.push(`Cabeza Estática Neta (Z_entrega - Z_succión),${staticH.toFixed(2)},${feetToMeters(staticH).toFixed(2)},${toPsi(staticH)},${pct(staticH)}%`);
  lines.push(`Pérdidas Mayores por Fricción (Tubería recta),${frictionH.toFixed(2)},${feetToMeters(frictionH).toFixed(2)},${toPsi(frictionH)},${pct(frictionH)}%`);
  lines.push(`Pérdidas Menores (Accesorios y válvulas),${minorH.toFixed(2)},${feetToMeters(minorH).toFixed(2)},${toPsi(minorH)},${pct(minorH)}%`);
  lines.push(`Presión Manométrica en Punto de Entrega,${pressH.toFixed(2)},${feetToMeters(pressH).toFixed(2)},${toPsi(pressH)},${pct(pressH)}%`);
  lines.push(`Pérdidas en Equipos en Línea (Filtros/Otros ΔP),${eqH.toFixed(2)},${feetToMeters(eqH).toFixed(2)},${toPsi(eqH)},${pct(eqH)}%`);
  lines.push(`CABEZA DINÁMICA TOTAL (TDH),${nominalResult.totalDynamicHeadFt.toFixed(2)},${nominalResult.totalDynamicHeadM.toFixed(2)},${toPsi(nominalResult.totalDynamicHeadFt)},100.0%`);
  
  if (nominalResult.governingCriticalSegmentName) {
    lines.push(`Punto Crítico Gobernante (Vessel/Equipo Intermedio),"${nominalResult.governingCriticalSegmentName}"`);
  }
  lines.push('');

  // 3. Power
  lines.push('3. POTENCIA DE BOMBEO');
  lines.push(`Potencia Hidráulica (WHP),${nominalResult.whpHydraulicPower.toFixed(2)} HP`);
  lines.push(`Potencia al Freno Nominal (BHP @ 70% eff),${nominalResult.nominalBhp.toFixed(2)} HP (${nominalResult.nominalKw.toFixed(2)} kW)`);
  lines.push('Eficiencia Bomba (%),Potencia al Freno BHP (HP),Potencia Motor Eléctrico Sugerido (kW)');
  nominalResult.bhpsensitivity.forEach(s => {
    lines.push(`${s.efficiency}%,${s.bhp.toFixed(2)},${s.kw.toFixed(2)}`);
  });
  lines.push('');

  // 4. Elevation Survey Log (Bitácora de Cotas)
  lines.push('4. BITÁCORA DE COTAS Y LEVANTAMIENTO DE TRAMOS');
  lines.push('Orden,Nombre del Tramo,Tipo,Cota Inicio (ft),Cota Final (ft),ΔZ Tramo (ft),Longitud Recta (ft),Longitud (m),Diámetro Nominal,Cédula,Diámetro Interior (in)');
  segments.forEach(seg => {
    const idIn = getInternalDiameterInches(seg.nominalDiameter, seg.schedule, seg.customInternalDiameterInches);
    const dZ = (seg.endElevationValFt || 0) - (seg.startElevationValFt || 0);
    lines.push(`${seg.order},"${seg.name}","${seg.type}",${seg.startElevationValFt.toFixed(2)},${seg.endElevationValFt.toFixed(2)},${dZ.toFixed(2)},${seg.straightLengthFt.toFixed(2)},${feetToMeters(seg.straightLengthFt).toFixed(2)},"${seg.nominalDiameter}\"","${seg.schedule}",${idIn.toFixed(3)}`);
  });
  lines.push('');

  // 5. Total pipe length grouped by diameter
  lines.push('5. RESUMEN DE TUBERÍA POR DIÁMETRO');
  lines.push('Diámetro Nominal,Cédula,Longitud Total (ft),Longitud Total (m),Diámetro Interno (mm)');
  const lengthByDia = new Map<string, { nominal: string; sched: string; totalFt: number; idMm: number }>();
  segments.forEach(seg => {
    const key = `${seg.nominalDiameter}_${seg.schedule}`;
    const idMm = getInternalDiameterMm(seg.nominalDiameter, seg.schedule, seg.customInternalDiameterInches);
    const existing = lengthByDia.get(key) || { nominal: seg.nominalDiameter, sched: seg.schedule, totalFt: 0, idMm };
    existing.totalFt += seg.straightLengthFt || 0;
    lengthByDia.set(key, existing);
  });
  lengthByDia.forEach(item => {
    lines.push(`"${item.nominal}\"","${item.sched}",${item.totalFt.toFixed(2)},${feetToMeters(item.totalFt).toFixed(2)},${item.idMm.toFixed(1)}`);
  });
  lines.push('');

  // 6. Accessories total count
  lines.push('6. RESUMEN TOTAL DE ACCESORIOS Y VÁLVULAS');
  lines.push('Accesorio / Válvula,Cantidad Total,Coeficiente K Unitario,ΣK Acumulado');
  const fitCounts = new Map<string, { name: string; qty: number; k: number }>();
  segments.forEach(seg => {
    (seg.fittings || []).forEach(f => {
      const key = `${f.name}_${f.kValue}`;
      const existing = fitCounts.get(key) || { name: f.name, qty: 0, k: f.kValue };
      existing.qty += f.quantity;
      fitCounts.set(key, existing);
    });
  });
  fitCounts.forEach(f => {
    lines.push(`"${f.name}",${f.qty},${f.k.toFixed(2)},${(f.qty * f.k).toFixed(2)}`);
  });
  lines.push('');

  // 7. System Curve Results Table
  lines.push('7. CURVA DEL SISTEMA (Q vs TDH)');
  lines.push('Caudal (GPM),Caudal (m³/h),Caudal (ton/h),Cabeza Estática (ft),Fricción Mayor (ft),Pérdidas Menores (ft),Equipos y Presión (ft),TDH Total (ft),TDH Total (m),WHP (HP)');
  allFlowCurveResults.forEach(r => {
    const otherHeads = r.deliveryPressureHeadFt + r.equipmentLossHeadFt;
    lines.push(`${r.flowGpm.toFixed(1)},${r.flowM3h.toFixed(1)},${r.flowTonsH.toFixed(1)},${r.staticHeadFt.toFixed(2)},${r.frictionLossFt.toFixed(2)},${r.minorLossFt.toFixed(2)},${otherHeads.toFixed(2)},${r.totalDynamicHeadFt.toFixed(2)},${r.totalDynamicHeadM.toFixed(2)},${r.whpHydraulicPower.toFixed(2)}`);
  });
  lines.push('');

  // 8. Detailed Hydraulic Audit per Segment
  lines.push('8. AUDITORÍA HIDRÁULICA DETALLADA TRAMO POR TRAMO (PUNTO NOMINAL)');
  lines.push('Tramo,Caudal (gpm),DI (in),Velocidad (ft/s),Velocidad (m/s),Re (Reynolds),Régimen,f (Darcy),hf Fricción (ft),hf Fricción (m),ΣK Accesorios,hf Menor (ft),ΔP Equipos (ft),Pérdida Total Tramo (ft)');
  nominalResult.segmentResults.forEach(sr => {
    lines.push(`"${sr.segmentName}",${sr.flowGpm.toFixed(1)},${sr.internalDiameterIn.toFixed(3)},${sr.velocityFps.toFixed(2)},${sr.velocityMs.toFixed(2)},${Math.round(sr.reynolds)},"${sr.flowRegime}",${sr.darcyFrictionFactor.toFixed(4)},${sr.frictionLossFt.toFixed(2)},${sr.frictionLossM.toFixed(2)},${sr.fittingsKSum.toFixed(2)},${sr.minorLossFt.toFixed(2)},${sr.equipmentLossFt.toFixed(2)},${sr.totalLossFt.toFixed(2)}`);
  });

  return '\uFEFF' + lines.join('\n');
}

export function downloadCsvFile(content: string, filename = 'calculo_tdh_bombas.csv') {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
