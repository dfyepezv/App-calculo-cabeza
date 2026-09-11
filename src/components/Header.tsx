import React from 'react';
import { UnitSystem } from '../types';
import { PRESET_SCENARIOS, PresetScenario } from '../utils/presets';
import { Droplet, Download, Printer, RotateCcw, Sliders, Info } from 'lucide-react';

interface HeaderProps {
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
  currentPresetId: string;
  onSelectPreset: (preset: PresetScenario) => void;
  onExportCsv: () => void;
  onPrintReport: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  unitSystem,
  setUnitSystem,
  currentPresetId,
  onSelectPreset,
  onExportCsv,
  onPrintReport,
  onReset
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-inner flex-shrink-0">
              <Droplet className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Calculadora de TDH para Bombas
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-medium bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-full">
                  Fluidos Viscosos
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cabeza Dinámica Total • Darcy-Weisbach • Swamee-Jain / Colebrook • Curva del Sistema
              </p>
            </div>
          </div>

          {/* Preset Cases & Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Scenario Preset Selector */}
            <div className="flex items-center bg-slate-800/90 rounded-lg p-1 border border-slate-700">
              <span className="text-xs text-slate-400 px-2 font-medium flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Caso:
              </span>
              <select
                aria-label="Seleccionar caso precargado"
                value={currentPresetId}
                onChange={(e) => {
                  const found = PRESET_SCENARIOS.find(p => p.id === e.target.value);
                  if (found) onSelectPreset(found);
                }}
                className="bg-slate-900 text-xs text-slate-200 py-1 px-2.5 rounded border border-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 max-w-[220px] truncate"
              >
                {PRESET_SCENARIOS.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Units Toggle */}
            <div className="flex items-center bg-slate-800/90 rounded-lg p-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setUnitSystem('imperial')}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  unitSystem === 'imperial'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Sistema Imperial: gpm, ft, psi, in"
              >
                Imperial (ft / gpm / psi)
              </button>
              <button
                type="button"
                onClick={() => setUnitSystem('metric')}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  unitSystem === 'metric'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Sistema Métrico: m³/h, m, bar, mm"
              >
                Métrico (m / m³·h / bar)
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1.5 ml-auto sm:ml-0">
              <button
                type="button"
                onClick={onExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 text-cyan-300 hover:bg-slate-700 border border-slate-700 transition"
                title="Descargar reporte completo en formato CSV / Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exportar</span> CSV
              </button>
              <button
                type="button"
                onClick={onPrintReport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition"
                title="Imprimir o guardar como PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>
              <button
                type="button"
                onClick={onReset}
                className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition"
                title="Restablecer valores originales del caso actual"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
