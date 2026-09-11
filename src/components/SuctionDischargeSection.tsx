import React, { useState } from 'react';
import { DischargeConfig, FluidProperties, SuctionConfig, UnitSystem } from '../types';
import { calculateSuctionElevationFt } from '../utils/hydraulicCalculations';
import {
  feetToMeters,
  formatFeetToEngineering,
  parseLengthToFeet,
  pressureToPsi,
  psiToHeadFeet,
  psiToSelectedPressure
} from '../utils/unitConversions';
import { Compass, Gauge, HelpCircle, Sliders, Layers, ArrowUpRight } from 'lucide-react';

interface SuctionDischargeSectionProps {
  suction: SuctionConfig;
  onSuctionChange: (updated: SuctionConfig) => void;
  discharge: DischargeConfig;
  onDischargeChange: (updated: DischargeConfig) => void;
  fluid: FluidProperties;
  unitSystem: UnitSystem;
  finalRouteElevationFt: number;
}

export const SuctionDischargeSection: React.FC<SuctionDischargeSectionProps> = ({
  suction,
  onSuctionChange,
  discharge,
  onDischargeChange,
  fluid,
  unitSystem,
  finalRouteElevationFt
}) => {
  const calculatedSuctionElevFt = calculateSuctionElevationFt(suction);
  const staticHeadFt = finalRouteElevationFt - calculatedSuctionElevFt;
  const staticHeadM = feetToMeters(staticHeadFt);

  // Terminal pressure head
  const deliveryPressurePsi = pressureToPsi(discharge.deliveryPressure, discharge.pressureUnit);
  const deliveryPressureHeadFt = psiToHeadFeet(deliveryPressurePsi, fluid.sg);
  const deliveryPressureHeadM = feetToMeters(deliveryPressureHeadFt);

  // Equipment head
  const equipmentHeadFt = psiToHeadFeet(discharge.otherEquipmentLossPsi, fluid.sg);

  const [rawFixedElev, setRawFixedElev] = useState(suction.fixedElevationStr || "10'-0\"");

  const handleFixedElevBlur = () => {
    const parsed = parseLengthToFeet(rawFixedElev);
    onSuctionChange({
      ...suction,
      fixedElevationStr: rawFixedElev,
      fixedElevationFt: parsed.feet
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              2. Nivel de Succión y Presión de Entrega
            </h2>
            <p className="text-xs text-slate-500">
              Definición de nivel de líquido en tanque de succión, cota de entrega y presión terminal
            </p>
          </div>
        </div>

        {/* Calculated Static Head Summary Badge */}
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs">
          <div>
            <span className="text-emerald-800 font-medium">Cabeza Estática Neta (ΔZ):</span>{' '}
            <span className="font-bold text-emerald-900">
              {unitSystem === 'imperial'
                ? `${staticHeadFt.toFixed(2)} ft`
                : `${staticHeadM.toFixed(2)} m`}
            </span>
          </div>
          <span className="text-emerald-300">|</span>
          <div className="text-slate-600">
            Z_succión: <span className="font-medium text-slate-800">{unitSystem === 'imperial' ? `${calculatedSuctionElevFt.toFixed(2)} ft` : `${feetToMeters(calculatedSuctionElevFt).toFixed(2)} m`}</span> →
            Z_entrega: <span className="font-medium text-slate-800">{unitSystem === 'imperial' ? `${finalRouteElevationFt.toFixed(2)} ft` : `${feetToMeters(finalRouteElevationFt).toFixed(2)} m`}</span>
          </div>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Suction Source */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Punto de Succión / Nivel de Líquido
            </h3>
            {/* Source Type Selector */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                type="button"
                onClick={() => onSuctionChange({ ...suction, type: 'tank_cone' })}
                className={`px-2 py-1 rounded-md transition ${
                  suction.type === 'tank_cone'
                    ? 'bg-white font-medium text-blue-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tanque Cónico
              </button>
              <button
                type="button"
                onClick={() => onSuctionChange({ ...suction, type: 'tank_horizontal' })}
                className={`px-2 py-1 rounded-md transition ${
                  suction.type === 'tank_horizontal'
                    ? 'bg-white font-medium text-blue-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cilíndrico Horiz.
              </button>
              <button
                type="button"
                onClick={() => onSuctionChange({ ...suction, type: 'fixed_elevation' })}
                className={`px-2 py-1 rounded-md transition ${
                  suction.type === 'fixed_elevation'
                    ? 'bg-white font-medium text-blue-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cota Fija Directa
              </button>
            </div>
          </div>

          {/* Mode 1: Vertical Tank with Conical Bottom */}
          {suction.type === 'tank_cone' && (
            <div className="bg-slate-50/80 rounded-lg p-4 border border-slate-200 space-y-3.5 text-xs">
              <div className="flex items-center justify-between text-slate-600 pb-1 border-b border-slate-200">
                <span className="font-semibold text-slate-800">Geometría de Tanque Vertical con Fondo Cónico</span>
                <span className="text-[11px] text-blue-600">Calcula espejo de fluido por volumen real</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Cota Vértice / Salida (Z_base)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={suction.coneTank.baseDatumElevationFt}
                      onChange={(e) =>
                        onSuctionChange({
                          ...suction,
                          coneTank: { ...suction.coneTank, baseDatumElevationFt: parseFloat(e.target.value) || 0 }
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                    />
                    <span className="absolute right-2 top-1.5 text-slate-400 text-[11px]">ft</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Diámetro del Tanque (D)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={suction.coneTank.diameterFt}
                      onChange={(e) =>
                        onSuctionChange({
                          ...suction,
                          coneTank: { ...suction.coneTank, diameterFt: parseFloat(e.target.value) || 1 }
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                    />
                    <span className="absolute right-2 top-1.5 text-slate-400 text-[11px]">ft</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Altura Cono Inferior (h_cono)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0.1"
                      value={suction.coneTank.coneHeightFt}
                      onChange={(e) =>
                        onSuctionChange({
                          ...suction,
                          coneTank: { ...suction.coneTank, coneHeightFt: parseFloat(e.target.value) || 0.1 }
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                    />
                    <span className="absolute right-2 top-1.5 text-slate-400 text-[11px]">ft</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Altura Virola Cilíndrica (h_cil)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={suction.coneTank.cylinderHeightFt}
                      onChange={(e) =>
                        onSuctionChange({
                          ...suction,
                          coneTank: { ...suction.coneTank, cylinderHeightFt: parseFloat(e.target.value) || 1 }
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                    />
                    <span className="absolute right-2 top-1.5 text-slate-400 text-[11px]">ft</span>
                  </div>
                </div>
              </div>

              {/* Slider for Level % */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Nivel Operativo del Tanque de Succión:
                  </label>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {suction.coneTank.liquidLevelPercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={suction.coneTank.liquidLevelPercent}
                  onChange={(e) =>
                    onSuctionChange({
                      ...suction,
                      coneTank: { ...suction.coneTank, liquidLevelPercent: parseInt(e.target.value) }
                    })
                  }
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0% (Vacío / Vértice)</span>
                  <span>30% (Nivel Bajo - Peor Caso TDH)</span>
                  <span>50% (Normal)</span>
                  <span>100% (Lleno)</span>
                </div>
              </div>

              <div className="bg-blue-50/80 p-2.5 rounded border border-blue-100 flex items-center justify-between">
                <span className="text-[11px] text-blue-900 font-medium">
                  Cota Calculada Espejo de Líquido:
                </span>
                <span className="text-sm font-bold text-blue-950 font-mono">
                  {calculatedSuctionElevFt.toFixed(2)} ft ({feetToMeters(calculatedSuctionElevFt).toFixed(2)} m)
                </span>
              </div>
            </div>
          )}

          {/* Mode 2: Horizontal Cylinder */}
          {suction.type === 'tank_horizontal' && (
            <div className="bg-slate-50/80 rounded-lg p-4 border border-slate-200 space-y-3.5 text-xs">
              <div className="flex items-center justify-between text-slate-600 pb-1 border-b border-slate-200">
                <span className="font-semibold text-slate-800">Tanque Cilíndrico Horizontal</span>
                <span className="text-[11px] text-blue-600">Nivel por profundidad de líquido</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Cota Invert / Fondo (ft)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={suction.horizTank.invertElevationFt}
                    onChange={(e) =>
                      onSuctionChange({
                        ...suction,
                        horizTank: { ...suction.horizTank, invertElevationFt: parseFloat(e.target.value) || 0 }
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Diámetro (D en ft)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={suction.horizTank.diameterFt}
                    onChange={(e) =>
                      onSuctionChange({
                        ...suction,
                        horizTank: { ...suction.horizTank, diameterFt: parseFloat(e.target.value) || 1 }
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Nivel Operativo (% de diámetro):
                  </label>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {suction.horizTank.liquidLevelPercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={suction.horizTank.liquidLevelPercent}
                  onChange={(e) =>
                    onSuctionChange({
                      ...suction,
                      horizTank: { ...suction.horizTank, liquidLevelPercent: parseInt(e.target.value) }
                    })
                  }
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div className="bg-blue-50/80 p-2.5 rounded border border-blue-100 flex items-center justify-between">
                <span className="text-[11px] text-blue-900 font-medium">Cota Espejo de Líquido:</span>
                <span className="text-sm font-bold text-blue-950 font-mono">
                  {calculatedSuctionElevFt.toFixed(2)} ft ({feetToMeters(calculatedSuctionElevFt).toFixed(2)} m)
                </span>
              </div>
            </div>
          )}

          {/* Mode 3: Direct Fixed Elevation with Fraction Parser */}
          {suction.type === 'fixed_elevation' && (
            <div className="bg-slate-50/80 rounded-lg p-4 border border-slate-200 space-y-3 text-xs">
              <label className="block text-[11px] font-medium text-slate-700">
                Cota fija de líquido en succión (acepta pies-pulgadas-fracción ej. 10&apos;-6&quot; o 3.2m):
              </label>
              <input
                type="text"
                value={rawFixedElev}
                onChange={(e) => setRawFixedElev(e.target.value)}
                onBlur={handleFixedElevBlur}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-sm focus:ring-2 focus:ring-blue-500"
                placeholder='Ej. 10-6" o 10.5'
              />
              <div className="text-[11px] text-slate-500 flex justify-between bg-white p-2 rounded border border-slate-200">
                <span>Cota Decimal: <strong>{suction.fixedElevationFt.toFixed(2)} ft</strong></span>
                <span>En Metros: <strong>{feetToMeters(suction.fixedElevationFt).toFixed(2)} m</strong></span>
                <span>Ingeniería: <strong>{formatFeetToEngineering(suction.fixedElevationFt)}</strong></span>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Discharge & Delivery Pressure */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-slate-500" />
              Presión Requerida en Entrega y Equipos
            </h3>
            {/* Pressure unit selector */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              {(['psig', 'bar', 'kpa'] as const).map(unit => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => onDischargeChange({ ...discharge, pressureUnit: unit })}
                  className={`px-2 py-0.5 rounded uppercase font-medium ${
                    discharge.pressureUnit === unit
                      ? 'bg-white text-blue-700 border border-slate-200 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-lg p-4 border border-slate-200 space-y-4 text-xs">
            {/* Terminal pressure input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Presión Manométrica en Punto de Entrega Final
                  <span title="Presión requerida en el punto terminal del sistema (ej. cabezal de distribución, reactor, toberas de aspersión). Se convierte automáticamente a columna de fluido: h = P(psi) * 2.31 / SG">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  </span>
                </label>
                <span className="font-mono text-[11px] text-blue-700 font-bold uppercase">
                  {discharge.pressureUnit}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={discharge.deliveryPressure}
                  onChange={(e) =>
                    onDischargeChange({
                      ...discharge,
                      deliveryPressure: parseFloat(e.target.value) || 0
                    })
                  }
                  className="w-full px-3 py-2 text-base font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Head equivalent calculation */}
              <div className="mt-2 text-[11px] text-slate-600 bg-white p-2.5 rounded border border-slate-200 flex items-center justify-between">
                <span>Cabeza Equivalente por Presión:</span>
                <span className="font-mono font-bold text-slate-900">
                  {deliveryPressureHeadFt.toFixed(2)} ft ({deliveryPressureHeadM.toFixed(2)} m)
                </span>
              </div>
            </div>

            {/* Other global equipment losses */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                  Otros ΔP en Equipos Adicionales (Total Global)
                  <span title="Caída de presión adicional por filtros coladores, caudalímetros másicos o toberas que no estén asociados a un tramo individual.">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  </span>
                </label>
                <span className="text-[11px] text-slate-400">psi</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={discharge.otherEquipmentLossPsi}
                  onChange={(e) =>
                    onDischargeChange({
                      ...discharge,
                      otherEquipmentLossPsi: parseFloat(e.target.value) || 0
                    })
                  }
                  className="w-full px-3 py-1.5 text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mt-1 text-[10px] text-slate-500">
                Cabeza equivalente ΔP adicional: {equipmentHeadFt.toFixed(2)} ft ({feetToMeters(equipmentHeadFt).toFixed(2)} m)
              </div>
            </div>

            {/* Note on intermediate equipment pressures */}
            <div className="text-[11px] text-slate-500 bg-amber-50/70 border border-amber-200 p-2.5 rounded leading-relaxed text-amber-900">
              <span className="font-semibold">Equipos y Tanques Intermedios:</span> En la sección 3 (Constructor de Ruta), puede especificar presiones intermedias requeridas en tanques presurizados o caídas $\Delta P$ de filtros dúplex en tramos específicos. El sistema evaluará automáticamente si algún equipo intermedio representa el <strong>punto crítico gobernante</strong> de diseño.
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
