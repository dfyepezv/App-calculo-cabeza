import React from 'react';
import { FlowPointResult, FluidProperties, UnitSystem } from '../types';
import { feetToMeters } from '../utils/unitConversions';
import { Calculator, AlertCircle, CheckCircle, HelpCircle, ShieldAlert } from 'lucide-react';

interface DetailedAuditSectionProps {
  nominalResult: FlowPointResult;
  fluid: FluidProperties;
  unitSystem: UnitSystem;
}

export const DetailedAuditSection: React.FC<DetailedAuditSectionProps> = ({
  nominalResult,
  fluid,
  unitSystem
}) => {
  const { segmentResults } = nominalResult;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              7. Auditoría Hidráulica Detallada Tramo por Tramo
            </h2>
            <p className="text-xs text-slate-500">
              Desglose exhaustivo de velocidad, Reynolds, régimen, fricción de Darcy y pérdidas locales
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-600 bg-white px-3 py-1 border border-slate-200 rounded-lg font-mono">
          Caudal evaluado: <strong>{nominalResult.flowGpm.toFixed(1)} GPM</strong> ({nominalResult.flowM3h.toFixed(1)} m³/h)
        </div>
      </div>

      {/* Critical Governing Point Warning (if any intermediate vessel demanded higher head) */}
      {nominalResult.governingCriticalSegmentName && (
        <div className="mx-5 p-3.5 bg-purple-50 border border-purple-200 rounded-lg text-xs flex items-start space-x-3 text-purple-900">
          <ShieldAlert className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sm block">Punto Crítico Gobernante Identificado</span>
            <p className="mt-0.5 leading-relaxed">
              El equipo intermedio en <span className="font-semibold">{nominalResult.governingCriticalSegmentName}</span> requiere una cabeza de bomba de <span className="font-mono font-bold">{nominalResult.totalDynamicHeadFt.toFixed(2)} ft</span>, la cual supera la requerida en el punto de entrega final. La bomba ha sido dimensionada automáticamente para satisfacer este punto crítico.
            </p>
          </div>
        </div>
      )}

      {/* Audit Table */}
      <div className="px-5 pb-5">
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Tramo</th>
                <th className="px-3 py-2.5">Q local</th>
                <th className="px-3 py-2.5">DI real</th>
                <th className="px-3 py-2.5">
                  Velocidad V
                  <span className="text-[10px] text-slate-400 font-normal block">(ft/s | m/s)</span>
                </th>
                <th className="px-3 py-2.5">
                  Reynolds (Re)
                  <span className="text-[10px] text-slate-400 font-normal block">Régimen</span>
                </th>
                <th className="px-3 py-2.5">
                  Factor f
                  <span className="text-[10px] text-slate-400 font-normal block">Darcy</span>
                </th>
                <th className="px-3 py-2.5">
                  Fricción hf
                  <span className="text-[10px] text-slate-400 font-normal block">Mayor</span>
                </th>
                <th className="px-3 py-2.5">
                  ΣK / Menor
                  <span className="text-[10px] text-slate-400 font-normal block">Accesorios</span>
                </th>
                <th className="px-3 py-2.5">
                  Equipos ΔP
                  <span className="text-[10px] text-slate-400 font-normal block">Filtros</span>
                </th>
                <th className="px-3 py-2.5 bg-blue-50 font-bold text-blue-900">
                  Pérdida Tramo
                  <span className="text-[10px] text-blue-700 font-normal block">hf + hm + heq</span>
                </th>
                <th className="px-3 py-2.5">
                  ΔZ Cotas
                  <span className="text-[10px] text-slate-400 font-normal block">Z_fin - Z_ini</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {segmentResults.map((sr, idx) => {
                const lossVal = unitSystem === 'imperial' ? sr.totalLossFt : sr.totalLossM;
                const frictionVal = unitSystem === 'imperial' ? sr.frictionLossFt : sr.frictionLossM;
                const minorVal = unitSystem === 'imperial' ? sr.minorLossFt : sr.minorLossM;
                const eqVal = unitSystem === 'imperial' ? sr.equipmentLossFt : sr.equipmentLossM;
                const dZVal = unitSystem === 'imperial' ? sr.deltaElevFt : feetToMeters(sr.deltaElevFt);

                // Velocity warning for viscous fluids
                let velBadgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                if (sr.velocityFps > 7) {
                  velBadgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                }
                if (sr.velocityFps > 10) {
                  velBadgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
                }

                // Regime color
                let regimeColor = 'bg-indigo-50 text-indigo-700';
                if (sr.flowRegime === 'Laminar') regimeColor = 'bg-cyan-50 text-cyan-700';
                if (sr.flowRegime === 'Transición') regimeColor = 'bg-amber-50 text-amber-700';

                return (
                  <tr key={sr.segmentId} className="hover:bg-slate-50 transition">
                    <td className="px-3 py-2 font-mono text-slate-400">
                      {sr.order}
                    </td>

                    <td className="px-3 py-2 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span>{sr.segmentName}</span>
                        {sr.isCriticalGovernor && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-purple-100 text-purple-800">
                            CRÍTICO
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        L = {unitSystem === 'imperial' ? `${sr.lengthFt.toFixed(1)} ft` : `${sr.lengthM.toFixed(1)} m`}
                      </div>
                    </td>

                    <td className="px-3 py-2 font-mono text-slate-700">
                      {sr.flowGpm.toFixed(1)} gpm
                      <div className="text-[10px] text-slate-400">{sr.flowM3h.toFixed(1)} m³/h</div>
                    </td>

                    <td className="px-3 py-2 font-mono text-slate-700">
                      {sr.internalDiameterIn.toFixed(3)}&quot;
                      <div className="text-[10px] text-slate-400">{(sr.internalDiameterIn * 25.4).toFixed(1)} mm</div>
                    </td>

                    <td className="px-3 py-2 font-mono">
                      <span className={`inline-block px-1.5 py-0.5 rounded border text-[11px] font-bold ${velBadgeColor}`}>
                        {sr.velocityFps.toFixed(2)} ft/s
                      </span>
                      <div className="text-[10px] text-slate-400">{sr.velocityMs.toFixed(2)} m/s</div>
                    </td>

                    <td className="px-3 py-2 font-mono text-slate-700">
                      <div>{Math.round(sr.reynolds).toLocaleString()}</div>
                      <span className={`inline-block px-1 py-0.2 rounded text-[10px] font-medium ${regimeColor}`}>
                        {sr.flowRegime}
                      </span>
                    </td>

                    <td className="px-3 py-2 font-mono text-slate-800">
                      {sr.darcyFrictionFactor.toFixed(4)}
                      <div className="text-[10px] text-slate-400">
                        {sr.flowRegime === 'Laminar' ? '64/Re' : 'Colebrook/S-J'}
                      </div>
                    </td>

                    <td className="px-3 py-2 font-mono text-slate-700">
                      {frictionVal.toFixed(2)} {unitSystem === 'imperial' ? 'ft' : 'm'}
                    </td>

                    <td className="px-3 py-2 font-mono text-slate-700">
                      <div>ΣK = {sr.fittingsKSum.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">
                        {minorVal.toFixed(2)} {unitSystem === 'imperial' ? 'ft' : 'm'}
                      </div>
                    </td>

                    <td className="px-3 py-2 font-mono text-slate-700">
                      {eqVal > 0 ? (
                        <span className="text-amber-700 font-medium">
                          {eqVal.toFixed(2)} {unitSystem === 'imperial' ? 'ft' : 'm'}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    <td className="px-3 py-2 font-mono font-bold text-blue-950 bg-blue-50/50">
                      {lossVal.toFixed(2)} {unitSystem === 'imperial' ? 'ft' : 'm'}
                    </td>

                    <td className="px-3 py-2 font-mono text-slate-600">
                      {dZVal >= 0 ? `+${dZVal.toFixed(2)}` : dZVal.toFixed(2)} {unitSystem === 'imperial' ? 'ft' : 'm'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Engineering Methodology Footer Explanation */}
        <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="font-semibold text-slate-700 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Fórmulas Aplicadas en la Auditoría:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px] text-slate-600">
            <div>• Reynolds: Re = (3160·Q·SG) / (D·μ)</div>
            <div>• Darcy: f = 64/Re (laminar) ó Swamee-Jain / Colebrook</div>
            <div>• Pérdidas: h = [f·(L/D) + ΣK] · (V²/2g)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
