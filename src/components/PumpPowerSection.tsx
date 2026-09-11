import React from 'react';
import { FlowPointResult, FluidProperties, UnitSystem } from '../types';
import { Zap, HelpCircle, AlertTriangle, CheckCircle, Sliders } from 'lucide-react';

interface PumpPowerSectionProps {
  nominalResult: FlowPointResult;
  fluid: FluidProperties;
  pumpEfficiencyPercent: number;
  onPumpEfficiencyChange: (eff: number) => void;
  enableViscosityCorrection: boolean;
  onToggleViscosityCorrection: (enabled: boolean) => void;
  manualCq: number;
  onChangeManualCq: (val: number) => void;
  manualCh: number;
  onChangeManualCh: (val: number) => void;
  manualCeta: number;
  onChangeManualCeta: (val: number) => void;
  unitSystem: UnitSystem;
}

export const PumpPowerSection: React.FC<PumpPowerSectionProps> = ({
  nominalResult,
  fluid,
  pumpEfficiencyPercent,
  onPumpEfficiencyChange,
  enableViscosityCorrection,
  onToggleViscosityCorrection,
  manualCq,
  onChangeManualCq,
  manualCh,
  onChangeManualCh,
  manualCeta,
  onChangeManualCeta,
  unitSystem
}) => {
  const whp = nominalResult.whpHydraulicPower;
  const effFrac = Math.max(0.1, pumpEfficiencyPercent) / 100;
  const bhp = whp / effFrac;
  const kw = bhp * 0.7457;

  const standardSensitivities = [50, 55, 60, 65, 70, 75, 80, 85, 90];

  // Viscosity correction estimation from ANSI/HI 9.6.7
  const est = nominalResult.viscosityCorrection;
  const activeCq = manualCq > 0 ? manualCq : est?.cq ?? 1.0;
  const activeCh = manualCh > 0 ? manualCh : est?.ch ?? 1.0;
  const activeCeta = manualCeta > 0 ? manualCeta : est?.ceta ?? 1.0;

  const correctedTdhFt = nominalResult.totalDynamicHeadFt / activeCh;
  const correctedBhp = (whp / (effFrac * activeCeta));
  const correctedKw = correctedBhp * 0.7457;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              6. Potencia de la Bomba y Corrección de Viscosidad ANSI/HI 9.6.7
            </h2>
            <p className="text-xs text-slate-500">
              Potencia hidráulica (WHP), potencia al freno (BHP), análisis de sensibilidad y factores de viscosidad
            </p>
          </div>
        </div>

        {/* Efficiency control */}
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-xs">
          <span className="text-amber-900 font-semibold">Eficiencia de Bomba (η):</span>
          <input
            type="number"
            min="20"
            max="95"
            step="1"
            value={pumpEfficiencyPercent}
            onChange={(e) => onPumpEfficiencyChange(parseFloat(e.target.value) || 70)}
            className="w-14 px-1.5 py-0.5 border border-amber-300 rounded font-mono font-bold text-amber-950 text-center bg-white"
          />
          <span className="font-bold text-amber-900">%</span>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Main Power Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* WHP */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold text-slate-700">Potencia Hidráulica (WHP)</span>
              <span className="text-[10px] font-mono">Q·H·SG / 3960</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {whp.toFixed(2)} <span className="text-sm font-semibold text-slate-500">HP</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {(whp * 0.7457).toFixed(2)} kW de energía entregada al fluido
            </div>
          </div>

          {/* Nominal BHP */}
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200">
            <div className="flex items-center justify-between text-xs text-amber-900 mb-1">
              <span className="font-bold">Potencia al Freno (BHP @ {pumpEfficiencyPercent}%)</span>
              <span className="text-[10px] font-mono">WHP / η</span>
            </div>
            <div className="text-2xl font-black text-amber-950 font-mono">
              {bhp.toFixed(2)} <span className="text-sm font-semibold text-amber-700">BHP (HP)</span>
            </div>
            <div className="mt-1 text-xs text-amber-800 font-medium">
              Motor eléctrico sugerido: <strong>{kw.toFixed(2)} kW</strong> ({Math.ceil(bhp * 1.15)} HP comercial)
            </div>
          </div>

          {/* Corrected BHP (with ANSI/HI) */}
          <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200">
            <div className="flex items-center justify-between text-xs text-indigo-900 mb-1">
              <span className="font-bold">BHP Corregido Viscosidad (HI 9.6.7)</span>
              <span className="text-[10px] font-mono">η_visc = η·C_η</span>
            </div>
            <div className="text-2xl font-black text-indigo-950 font-mono">
              {correctedBhp.toFixed(2)} <span className="text-sm font-semibold text-indigo-700">HP</span>
            </div>
            <div className="mt-1 text-xs text-indigo-800 font-medium">
              TDH agua equivalente: <strong>{correctedTdhFt.toFixed(1)} ft</strong> ({correctedKw.toFixed(2)} kW)
            </div>
          </div>
        </div>

        {/* Sensitivity Table 50% to 90% */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              Sensibilidad de Potencia al Freno (BHP) según Eficiencia de la Bomba
              <span title="Útil cuando se desconoce la curva certificada del fabricante de la bomba centrífuga.">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
              </span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Evaluado a {nominalResult.flowGpm.toFixed(1)} gpm / TDH = {nominalResult.totalDynamicHeadFt.toFixed(1)} ft
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="min-w-full divide-y divide-slate-200 text-xs text-center">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="px-3 py-2 text-left">Parámetro</th>
                  {standardSensitivities.map(eff => (
                    <th
                      key={eff}
                      className={`px-3 py-2 ${
                        eff === pumpEfficiencyPercent ? 'bg-amber-100 text-amber-900 font-bold' : ''
                      }`}
                    >
                      {eff}%
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                <tr>
                  <td className="px-3 py-2 text-left font-medium text-slate-700">Potencia BHP (HP)</td>
                  {standardSensitivities.map(eff => {
                    const effBhp = whp / (eff / 100);
                    const isSelected = eff === pumpEfficiencyPercent;
                    return (
                      <td
                        key={eff}
                        className={`px-3 py-2 font-mono ${
                          isSelected ? 'bg-amber-50 font-bold text-amber-950' : 'text-slate-800'
                        }`}
                      >
                        {effBhp.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="px-3 py-2 text-left font-medium text-slate-500">Potencia Eléctrica (kW)</td>
                  {standardSensitivities.map(eff => {
                    const effKw = (whp / (eff / 100)) * 0.7457;
                    const isSelected = eff === pumpEfficiencyPercent;
                    return (
                      <td
                        key={eff}
                        className={`px-3 py-2 font-mono text-slate-500 ${
                          isSelected ? 'bg-amber-50 font-semibold text-amber-900' : ''
                        }`}
                      >
                        {effKw.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Viscosity Correction ANSI/HI 9.6.7 Section */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-800 text-sm">
                Corrección por Viscosidad (Método ANSI/HI 9.6.7)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                Hydraulic Institute
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-xs text-slate-600 font-medium">
                Aplicar corrección en resultados:
              </label>
              <input
                type="checkbox"
                checked={enableViscosityCorrection}
                onChange={(e) => onToggleViscosityCorrection(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </div>
          </div>

          <p className="text-slate-600 leading-relaxed">
            Cuando una bomba centrífuga diseñada para agua bombea un líquido viscoso (como jarabes, salmueras densas o meladura), la fricción en los impulsores reduce la <strong>capacidad de caudal (C_Q)</strong>, reduce la <strong>cabeza desarrollada (C_H)</strong> e incrementa sustancialmente la <strong>potencia consumida al disminuir la eficiencia (C_η)</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Factor de Caudal (C_Q)</span>
                <span className="text-slate-400 font-normal">Est: {est?.cq.toFixed(3)}</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.4"
                max="1.0"
                value={manualCq > 0 ? manualCq : est?.cq.toFixed(3) || 1.0}
                onChange={(e) => onChangeManualCq(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs text-right"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Q_agua_req = Q_viscoso / C_Q
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Factor de Cabeza (C_H)</span>
                <span className="text-slate-400 font-normal">Est: {est?.ch.toFixed(3)}</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.4"
                max="1.0"
                value={manualCh > 0 ? manualCh : est?.ch.toFixed(3) || 1.0}
                onChange={(e) => onChangeManualCh(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs text-right"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                H_agua_req = H_viscoso / C_H
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Factor de Eficiencia (C_η)</span>
                <span className="text-slate-400 font-normal">Est: {est?.ceta.toFixed(3)}</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.2"
                max="1.0"
                value={manualCeta > 0 ? manualCeta : est?.ceta.toFixed(3) || 1.0}
                onChange={(e) => onChangeManualCeta(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs text-right"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                η_viscoso = η_agua · C_η
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
