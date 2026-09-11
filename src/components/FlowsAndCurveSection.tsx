import React from 'react';
import { FlowPointResult, FlowUnit, UnitSystem } from '../types';
import { formatFlow, gpmToFlow } from '../utils/unitConversions';
import { SystemCurveChart } from './SystemCurveChart';
import { BarChart3, Plus, RefreshCw, Trash2, HelpCircle } from 'lucide-react';

interface FlowsAndCurveSectionProps {
  nominalFlowGpm: number;
  onNominalFlowChange: (gpm: number) => void;
  flowPointsGpm: number[];
  onChangeFlowPointsGpm: (points: number[]) => void;
  selectedFlowUnit: FlowUnit;
  onSelectFlowUnit: (unit: FlowUnit) => void;
  flowResults: FlowPointResult[];
  sg: number;
  unitSystem: UnitSystem;
}

export const FlowsAndCurveSection: React.FC<FlowsAndCurveSectionProps> = ({
  nominalFlowGpm,
  onNominalFlowChange,
  flowPointsGpm,
  onChangeFlowPointsGpm,
  selectedFlowUnit,
  onSelectFlowUnit,
  flowResults,
  sg,
  unitSystem
}) => {
  // Generate 10 standard points: 0%, 20%, 40%, 60%, 80%, 100%, 115%, 130%, 145%, 160%
  const handleAutoGeneratePoints = () => {
    const fractions = [0.01, 0.25, 0.50, 0.75, 0.90, 1.00, 1.15, 1.30, 1.45, 1.60];
    const generated = fractions.map(f => Math.round(nominalFlowGpm * f * 10) / 10);
    onChangeFlowPointsGpm(generated);
  };

  const handleAddFlowPoint = () => {
    const maxVal = flowPointsGpm.length > 0 ? Math.max(...flowPointsGpm) : nominalFlowGpm;
    const nextVal = Math.round((maxVal + nominalFlowGpm * 0.2) * 10) / 10;
    onChangeFlowPointsGpm([...flowPointsGpm, nextVal].sort((a, b) => a - b));
  };

  const handleUpdatePoint = (index: number, valInSelectedUnit: number) => {
    let newGpm = valInSelectedUnit;
    if (selectedFlowUnit === 'm3h') newGpm = valInSelectedUnit * 4.40287;
    else if (selectedFlowUnit === 'ls') newGpm = valInSelectedUnit * 15.8503;
    else if (selectedFlowUnit === 'tons_h') newGpm = (valInSelectedUnit / (sg > 0 ? sg : 1.0)) * 4.40287;

    const updated = [...flowPointsGpm];
    updated[index] = Math.max(0.1, Math.round(newGpm * 10) / 10);
    onChangeFlowPointsGpm(updated);
  };

  const handleDeletePoint = (index: number) => {
    if (flowPointsGpm.length <= 2) return;
    const updated = flowPointsGpm.filter((_, i) => i !== index);
    onChangeFlowPointsGpm(updated);
  };

  const nominalInSelectedUnit = gpmToFlow(nominalFlowGpm, selectedFlowUnit, sg);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-violet-100 text-violet-700 rounded-lg">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              5. Múltiples Caudales de Evaluación y Curva del Sistema
            </h2>
            <p className="text-xs text-slate-500">
              Evaluación del comportamiento del sistema hidráulico a diferentes tasas de flujo
            </p>
          </div>
        </div>

        {/* Nominal flow and Unit selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">Unidad de Caudal:</span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white text-xs">
            {(['gpm', 'm3h', 'tons_h', 'ls'] as const).map(u => (
              <button
                key={u}
                type="button"
                onClick={() => onSelectFlowUnit(u)}
                className={`px-2 py-0.5 rounded font-medium ${
                  selectedFlowUnit === u
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {u === 'tons_h' ? 'ton/h' : u === 'm3h' ? 'm³/h' : u}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 border border-slate-200 rounded-lg text-xs">
            <span className="text-slate-600 font-medium">Caudal Nominal:</span>
            <input
              type="number"
              step="1"
              min="1"
              value={nominalInSelectedUnit.toFixed(1)}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 1;
                let gpm = val;
                if (selectedFlowUnit === 'm3h') gpm = val * 4.40287;
                else if (selectedFlowUnit === 'ls') gpm = val * 15.8503;
                else if (selectedFlowUnit === 'tons_h') gpm = (val / (sg > 0 ? sg : 1.0)) * 4.40287;
                onNominalFlowChange(gpm);
              }}
              className="w-16 px-1.5 py-0.5 border border-slate-300 rounded font-mono font-bold text-violet-900 text-right"
            />
            <span className="text-slate-500">{selectedFlowUnit === 'tons_h' ? 'ton/h' : selectedFlowUnit === 'm3h' ? 'm³/h' : selectedFlowUnit}</span>
          </div>

          <button
            type="button"
            onClick={handleAutoGeneratePoints}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition"
            title="Generar 10 puntos de evaluación automáticos (0% a 160% de Q nominal)"
          >
            <RefreshCw className="w-3 h-3 text-violet-600" />
            Auto-Rango
          </button>
        </div>
      </div>

      {/* Interactive System Curve Chart */}
      <div className="px-5">
        <SystemCurveChart
          flowResults={flowResults}
          nominalGpm={nominalFlowGpm}
          unitSystem={unitSystem}
        />
      </div>

      {/* Editable Flow Points Table */}
      <div className="px-5 pb-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            Tabla de Resultados por Caudal Evaluado
            <span title="Muestra el desglose detallado de la Cabeza Dinámica Total (TDH) y la potencia requerida para cada caudal.">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
            </span>
          </h3>
          <button
            type="button"
            onClick={handleAddFlowPoint}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 transition"
          >
            <Plus className="w-3 h-3" />
            Agregar Punto de Caudal
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">
                  Caudal Q ({selectedFlowUnit === 'tons_h' ? 'ton/h' : selectedFlowUnit === 'm3h' ? 'm³/h' : selectedFlowUnit})
                </th>
                <th className="px-3 py-2.5 text-slate-400 font-normal">GPM / m³/h</th>
                <th className="px-3 py-2.5">Cabeza Estática</th>
                <th className="px-3 py-2.5">Fricción Tubería</th>
                <th className="px-3 py-2.5">Pérdidas Menores</th>
                <th className="px-3 py-2.5">Presión + Equipos</th>
                <th className="px-3 py-2.5 text-indigo-900 font-bold bg-indigo-50/70">
                  TDH Total ({unitSystem === 'imperial' ? 'ft' : 'm'})
                </th>
                <th className="px-3 py-2.5">Potencia Hidr. (WHP)</th>
                <th className="px-3 py-2.5">Potencia Freno (BHP)</th>
                <th className="px-3 py-2.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {flowResults.map((r, idx) => {
                const isNominal = Math.abs(r.flowGpm - nominalFlowGpm) < 0.1;
                const flowInUnit = gpmToFlow(r.flowGpm, selectedFlowUnit, sg);
                const tdhVal = unitSystem === 'imperial' ? r.totalDynamicHeadFt : r.totalDynamicHeadM;
                const staticVal = unitSystem === 'imperial' ? r.staticHeadFt : r.staticHeadM;
                const frictionVal = unitSystem === 'imperial' ? r.frictionLossFt : r.frictionLossM;
                const minorVal = unitSystem === 'imperial' ? r.minorLossFt : r.minorLossM;
                const otherVal = unitSystem === 'imperial'
                  ? r.deliveryPressureHeadFt + r.equipmentLossHeadFt
                  : r.deliveryPressureHeadM + r.equipmentLossHeadM;

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-50 transition ${
                      isNominal ? 'bg-violet-50/60 font-semibold' : ''
                    }`}
                  >
                    <td className="px-3 py-2 font-mono text-slate-400">
                      {idx + 1}
                      {isNominal && <span className="ml-1 text-[10px] text-violet-700 font-bold">★</span>}
                    </td>

                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.5"
                        min="0.1"
                        value={flowInUnit.toFixed(1)}
                        onChange={(e) => handleUpdatePoint(idx, parseFloat(e.target.value) || 0.1)}
                        className="w-20 px-1.5 py-0.5 border border-slate-300 rounded font-mono text-xs text-right bg-white"
                      />
                    </td>

                    <td className="px-3 py-2 text-slate-400 font-mono text-[11px]">
                      {r.flowGpm.toFixed(1)} gpm / {r.flowM3h.toFixed(1)} m³/h
                    </td>

                    <td className="px-3 py-2 font-mono text-slate-700">
                      {staticVal.toFixed(2)}
                    </td>

                    <td className="px-3 py-2 font-mono text-slate-700">
                      {frictionVal.toFixed(2)}
                    </td>

                    <td className="px-3 py-2 font-mono text-slate-700">
                      {minorVal.toFixed(2)}
                    </td>

                    <td className="px-3 py-2 font-mono text-slate-700">
                      {otherVal.toFixed(2)}
                    </td>

                    <td className="px-3 py-2 font-mono font-bold text-indigo-900 bg-indigo-50/40">
                      {tdhVal.toFixed(2)}
                    </td>

                    <td className="px-3 py-2 font-mono text-slate-700">
                      {r.whpHydraulicPower.toFixed(2)} HP
                    </td>

                    <td className="px-3 py-2 font-mono font-semibold text-slate-900">
                      {r.nominalBhp.toFixed(2)} HP
                    </td>

                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        disabled={flowPointsGpm.length <= 2}
                        onClick={() => handleDeletePoint(idx)}
                        className="p-1 text-slate-300 hover:text-rose-600 disabled:opacity-20"
                        title="Eliminar punto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
