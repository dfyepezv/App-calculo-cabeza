import React from 'react';
import {
  DischargeConfig,
  FlowPointResult,
  FluidProperties,
  PipeSegment,
  SuctionConfig,
  UnitSystem
} from '../types';
import { getInternalDiameterInches, getInternalDiameterMm } from '../utils/pipeData';
import { feetToMeters } from '../utils/unitConversions';
import { FileSpreadsheet, Download, Printer, CheckCircle, FileText, PieChart } from 'lucide-react';

interface SummaryReportsSectionProps {
  segments: PipeSegment[];
  nominalResult: FlowPointResult;
  fluid: FluidProperties;
  suction: SuctionConfig;
  discharge: DischargeConfig;
  unitSystem: UnitSystem;
  onExportCsv: () => void;
  onPrintReport: () => void;
}

export const SummaryReportsSection: React.FC<SummaryReportsSectionProps> = ({
  segments,
  nominalResult,
  fluid,
  suction,
  discharge,
  unitSystem,
  onExportCsv,
  onPrintReport
}) => {
  const sortedSegments = [...segments].sort((a, b) => a.order - b.order);

  // Group pipe length by nominal diameter and schedule
  const pipeSummaryMap = new Map<string, { nominal: string; schedule: string; totalFt: number; idIn: number; idMm: number }>();
  sortedSegments.forEach(s => {
    const key = `${s.nominalDiameter}_${s.schedule}`;
    const idIn = getInternalDiameterInches(s.nominalDiameter, s.schedule, s.customInternalDiameterInches);
    const idMm = getInternalDiameterMm(s.nominalDiameter, s.schedule, s.customInternalDiameterInches);
    const cur = pipeSummaryMap.get(key) || { nominal: s.nominalDiameter, schedule: s.schedule, totalFt: 0, idIn, idMm };
    cur.totalFt += s.straightLengthFt || 0;
    pipeSummaryMap.set(key, cur);
  });
  const pipeSummaryList = Array.from(pipeSummaryMap.values());

  // Group accessories totals
  const fittingsMap = new Map<string, { name: string; quantity: number; kValue: number; totalK: number }>();
  sortedSegments.forEach(s => {
    (s.fittings || []).forEach(f => {
      const key = `${f.name}_${f.kValue}`;
      const cur = fittingsMap.get(key) || { name: f.name, quantity: 0, kValue: f.kValue, totalK: 0 };
      cur.quantity += f.quantity;
      cur.totalK += f.quantity * f.kValue;
      fittingsMap.set(key, cur);
    });
  });
  const fittingsSummaryList = Array.from(fittingsMap.values());

  // Breakdown percentages
  const totalH = nominalResult.totalDynamicHeadFt || 1;
  const staticH = nominalResult.staticHeadFt;
  const frictionH = nominalResult.frictionLossFt;
  const minorH = nominalResult.minorLossFt;
  const pressH = nominalResult.deliveryPressureHeadFt;
  const eqH = nominalResult.equipmentLossHeadFt;

  const staticPct = Math.max(0, (staticH / totalH) * 100);
  const frictionPct = Math.max(0, (frictionH / totalH) * 100);
  const minorPct = Math.max(0, (minorH / totalH) * 100);
  const pressPct = Math.max(0, (pressH / totalH) * 100);
  const eqPct = Math.max(0, (eqH / totalH) * 100);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-6">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-teal-100 text-teal-700 rounded-lg">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              8. Salidas, Bitácora de Cotas y Reporte Técnico
            </h2>
            <p className="text-xs text-slate-500">
              Cómputo de materiales de tubería, conteo de accesorios, desglose porcentual de TDH y exportación
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar Reporte CSV
          </button>
          <button
            type="button"
            onClick={onPrintReport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      <div className="px-5 space-y-6 pb-6">
        {/* Visual TDH Breakdown Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-teal-600" />
              Desglose de Componentes de Cabeza Dinámica Total (TDH)
            </h3>
            <span className="font-mono text-xs font-bold text-slate-800">
              TDH = {nominalResult.totalDynamicHeadFt.toFixed(2)} ft ({nominalResult.totalDynamicHeadM.toFixed(2)} m)
            </span>
          </div>

          {/* Stacked colored progress bar */}
          <div className="h-6 w-full bg-slate-100 rounded-lg overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${staticPct}%` }}
              className="bg-emerald-500 h-full transition-all"
              title={`Cabeza Estática: ${staticH.toFixed(1)} ft (${staticPct.toFixed(1)}%)`}
            />
            <div
              style={{ width: `${frictionPct}%` }}
              className="bg-indigo-500 h-full transition-all"
              title={`Fricción Tubería: ${frictionH.toFixed(1)} ft (${frictionPct.toFixed(1)}%)`}
            />
            <div
              style={{ width: `${minorPct}%` }}
              className="bg-cyan-500 h-full transition-all"
              title={`Pérdidas Menores: ${minorH.toFixed(1)} ft (${minorPct.toFixed(1)}%)`}
            />
            <div
              style={{ width: `${pressPct}%` }}
              className="bg-amber-500 h-full transition-all"
              title={`Presión de Entrega: ${pressH.toFixed(1)} ft (${pressPct.toFixed(1)}%)`}
            />
            <div
              style={{ width: `${eqPct}%` }}
              className="bg-purple-500 h-full transition-all"
              title={`Equipos en Línea: ${eqH.toFixed(1)} ft (${eqPct.toFixed(1)}%)`}
            />
          </div>

          {/* Cards for each component */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-3 text-xs">
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-1 text-[11px] text-emerald-800 font-semibold mb-0.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
                Cabeza Estática (ΔZ)
              </div>
              <div className="font-mono font-bold text-emerald-950 text-sm">
                {unitSystem === 'imperial' ? `${staticH.toFixed(1)} ft` : `${feetToMeters(staticH).toFixed(1)} m`}
              </div>
              <div className="text-[10px] text-emerald-700">{staticPct.toFixed(1)}% del TDH</div>
            </div>

            <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg">
              <div className="flex items-center gap-1 text-[11px] text-indigo-800 font-semibold mb-0.5">
                <span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block"></span>
                Fricción Tubería (hf)
              </div>
              <div className="font-mono font-bold text-indigo-950 text-sm">
                {unitSystem === 'imperial' ? `${frictionH.toFixed(1)} ft` : `${feetToMeters(frictionH).toFixed(1)} m`}
              </div>
              <div className="text-[10px] text-indigo-700">{frictionPct.toFixed(1)}% del TDH</div>
            </div>

            <div className="p-2.5 bg-cyan-50 border border-cyan-200 rounded-lg">
              <div className="flex items-center gap-1 text-[11px] text-cyan-800 font-semibold mb-0.5">
                <span className="w-2.5 h-2.5 rounded bg-cyan-500 inline-block"></span>
                Accesorios (hf menor)
              </div>
              <div className="font-mono font-bold text-cyan-950 text-sm">
                {unitSystem === 'imperial' ? `${minorH.toFixed(1)} ft` : `${feetToMeters(minorH).toFixed(1)} m`}
              </div>
              <div className="text-[10px] text-cyan-700">{minorPct.toFixed(1)}% del TDH</div>
            </div>

            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-1 text-[11px] text-amber-800 font-semibold mb-0.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span>
                Presión Entrega
              </div>
              <div className="font-mono font-bold text-amber-950 text-sm">
                {unitSystem === 'imperial' ? `${pressH.toFixed(1)} ft` : `${feetToMeters(pressH).toFixed(1)} m`}
              </div>
              <div className="text-[10px] text-amber-700">{pressPct.toFixed(1)}% ({discharge.deliveryPressure} {discharge.pressureUnit})</div>
            </div>

            <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-1 text-[11px] text-purple-800 font-semibold mb-0.5">
                <span className="w-2.5 h-2.5 rounded bg-purple-500 inline-block"></span>
                Equipos (Filtros ΔP)
              </div>
              <div className="font-mono font-bold text-purple-950 text-sm">
                {unitSystem === 'imperial' ? `${eqH.toFixed(1)} ft` : `${feetToMeters(eqH).toFixed(1)} m`}
              </div>
              <div className="text-[10px] text-purple-700">{eqPct.toFixed(1)}% del TDH</div>
            </div>
          </div>
        </div>

        {/* Elevation Survey Log Table (Bitácora de Cotas) */}
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            Bitácora de Levantamiento de Cotas por Nivel
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="px-3 py-2">Orden</th>
                  <th className="px-3 py-2">Nombre del Tramo</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Cota Inicio (Z_ini)</th>
                  <th className="px-3 py-2">Cota Final (Z_fin)</th>
                  <th className="px-3 py-2">Desnivel ΔZ</th>
                  <th className="px-3 py-2">Longitud Recta (L)</th>
                  <th className="px-3 py-2">Diámetro / Cédula</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {sortedSegments.map(s => {
                  const dZ = (s.endElevationValFt || 0) - (s.startElevationValFt || 0);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-slate-400">{s.order}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">{s.name}</td>
                      <td className="px-3 py-2 text-slate-600 capitalize">{s.type.replace('_', ' ')}</td>
                      <td className="px-3 py-2 font-mono text-slate-700">
                        {s.startElevationStr} ({s.startElevationValFt.toFixed(2)} ft)
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-700">
                        {s.endElevationStr} ({s.endElevationValFt.toFixed(2)} ft)
                      </td>
                      <td className="px-3 py-2 font-mono">
                        <span className={dZ >= 0 ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                          {dZ >= 0 ? `+${dZ.toFixed(2)}` : dZ.toFixed(2)} ft
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-700">
                        {s.straightLengthFt.toFixed(2)} ft ({feetToMeters(s.straightLengthFt).toFixed(2)} m)
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-700">
                        {s.nominalDiameter}&quot; ({s.schedule})
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pipe by Diameter and Total Accessories Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table: Total Pipe Length by Diameter */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Resumen de Tuberías y Longitudes por Diámetro
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-3 py-2">Diámetro Nominal</th>
                    <th className="px-3 py-2">Cédula</th>
                    <th className="px-3 py-2">Longitud Total (ft)</th>
                    <th className="px-3 py-2">Longitud Total (m)</th>
                    <th className="px-3 py-2">DI Interno (mm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {pipeSummaryList.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-bold font-mono text-slate-800">{p.nominal}&quot;</td>
                      <td className="px-3 py-2 text-slate-600 uppercase">{p.schedule}</td>
                      <td className="px-3 py-2 font-mono font-semibold text-slate-900">{p.totalFt.toFixed(2)} ft</td>
                      <td className="px-3 py-2 font-mono text-slate-600">{feetToMeters(p.totalFt).toFixed(2)} m</td>
                      <td className="px-3 py-2 font-mono text-slate-500">{p.idMm.toFixed(1)} mm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table: Accessories Count */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Conteo Total de Accesorios por Tipo
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-3 py-2">Accesorio / Válvula</th>
                    <th className="px-3 py-2 text-center">Cantidad Total</th>
                    <th className="px-3 py-2 text-center">K unitario</th>
                    <th className="px-3 py-2 text-right">ΣK Acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {fittingsSummaryList.map((f, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium text-slate-800">{f.name}</td>
                      <td className="px-3 py-2 font-mono font-bold text-slate-900 text-center">{f.quantity}</td>
                      <td className="px-3 py-2 font-mono text-slate-500 text-center">{f.kValue.toFixed(2)}</td>
                      <td className="px-3 py-2 font-mono text-slate-700 text-right">{f.totalK.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
