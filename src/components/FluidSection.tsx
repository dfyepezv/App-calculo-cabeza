import React from 'react';
import { FluidProperties, UnitSystem } from '../types';
import { Beaker, HelpCircle, Thermometer, Layers, Activity } from 'lucide-react';

interface FluidSectionProps {
  fluid: FluidProperties;
  onChange: (updated: FluidProperties) => void;
  unitSystem: UnitSystem;
}

export const FluidSection: React.FC<FluidSectionProps> = ({ fluid, onChange, unitSystem }) => {
  const handleSgChange = (val: number) => {
    const validSg = Math.max(0.1, val || 1.0);
    const densityKgM3 = validSg * 1000;
    const kinematicViscosityCst = fluid.dynamicViscosityCp / validSg;
    onChange({
      ...fluid,
      sg: validSg,
      densityKgM3,
      kinematicViscosityCst
    });
  };

  const handleViscosityChange = (val: number) => {
    const validCp = Math.max(0.1, val || 1.0);
    const validSg = fluid.sg > 0 ? fluid.sg : 1.0;
    onChange({
      ...fluid,
      dynamicViscosityCp: validCp,
      kinematicViscosityCst: validCp / validSg
    });
  };

  const densityLbFt3 = fluid.sg * 62.428;
  const kinematicCst = fluid.sg > 0 ? fluid.dynamicViscosityCp / fluid.sg : fluid.dynamicViscosityCp;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all">
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
            <Beaker className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              1. Datos y Propiedades del Fluido
            </h2>
            <p className="text-xs text-slate-500">
              Densidad, viscosidad dinámica y cinemática para fluidos newtonianos
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            {fluid.dynamicViscosityCp > 10 ? 'Fluido Viscoso' : 'Baja Viscosidad (Agua)'}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Name and quick presets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre o Descripción del Fluido
            </label>
            <input
              type="text"
              value={fluid.name}
              onChange={(e) => onChange({ ...fluid, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Ej. Meladura de caña, Jarabe, Salmuera, etc."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Sólidos / Concentración</span>
              <span className="text-[10px] text-slate-400 font-normal">(Opcional)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={fluid.brix ?? ''}
                onChange={(e) => onChange({ ...fluid, brix: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                placeholder="Ej. 65"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                °Brix
              </span>
            </div>
          </div>
        </div>

        {/* Primary inputs: SG, Viscosity, Temperature */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Specific Gravity */}
          <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                Gravedad Específica (SG)
                <span title="Relación de densidad respecto al agua pura a 4°C (1000 kg/m³). Para meladura de 65°Bx es típicamente 1.32.">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                </span>
              </label>
              <span className="text-[11px] font-mono text-slate-500">adimensional</span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0.5"
              max="3.0"
              value={fluid.sg}
              onChange={(e) => handleSgChange(parseFloat(e.target.value))}
              className="w-full px-3 py-2 text-base font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
              <span>ρ = {fluid.densityKgM3.toFixed(1)} kg/m³</span>
              <span>{densityLbFt3.toFixed(1)} lb/ft³</span>
            </div>
          </div>

          {/* Dynamic Viscosity */}
          <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                Viscosidad Dinámica (μ)
                <span title="Viscosidad absoluta en centipoise (cP) o mPa·s. Agua=1 cP; Jarabe liviano=20-50 cP; Meladura caliente=100-200 cP; Glucosa fría=800+ cP.">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                </span>
              </label>
              <span className="text-[11px] font-mono text-slate-500">cP (mPa·s)</span>
            </div>
            <input
              type="number"
              step="0.5"
              min="0.1"
              max="50000"
              value={fluid.dynamicViscosityCp}
              onChange={(e) => handleViscosityChange(parseFloat(e.target.value))}
              className="w-full px-3 py-2 text-base font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
              <span>Cinemática (ν):</span>
              <span className="font-medium text-slate-700">{kinematicCst.toFixed(1)} cSt (mm²/s)</span>
            </div>
          </div>

          {/* Temperature */}
          <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                Temperatura de Operación
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                {unitSystem === 'imperial' ? '°F' : '°C'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="1"
                value={
                  unitSystem === 'imperial'
                    ? fluid.temperatureF ?? (fluid.temperatureC !== undefined ? Math.round((fluid.temperatureC * 9) / 5 + 32) : 68)
                    : fluid.temperatureC ?? 20
                }
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (unitSystem === 'imperial') {
                    onChange({
                      ...fluid,
                      temperatureF: val,
                      temperatureC: Math.round(((val - 32) * 5) / 9)
                    });
                  } else {
                    onChange({
                      ...fluid,
                      temperatureC: val,
                      temperatureF: Math.round((val * 9) / 5 + 32)
                    });
                  }
                }}
                className="w-full px-3 py-2 text-base font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              {unitSystem === 'imperial'
                ? `Equivalente: ${fluid.temperatureC ?? 20} °C`
                : `Equivalente: ${fluid.temperatureF ?? 68} °F`}
            </div>
          </div>
        </div>

        {/* Informative reference banner */}
        <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-100 flex items-start space-x-3 text-xs text-blue-900">
          <Activity className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">Efecto de la Viscosidad en Bombas Centrífugas:</span> Fluidos con viscosidad mayor a 10 cP provocan aumento en el factor de fricción de Darcy <span className="font-mono">f</span>, reducción de velocidad óptima para evitar sobrepresión y pérdidas por fricción elevadas, así como una disminución en la capacidad, cabeza y rendimiento de la bomba según la norma <span className="font-semibold">ANSI/HI 9.6.7</span>.
          </div>
        </div>

      </div>
    </div>
  );
};
