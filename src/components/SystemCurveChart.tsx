import React, { useState } from 'react';
import { FlowPointResult, UnitSystem } from '../types';
import { feetToMeters } from '../utils/unitConversions';
import { TrendingUp, Eye, EyeOff } from 'lucide-react';

interface SystemCurveChartProps {
  flowResults: FlowPointResult[];
  nominalGpm: number;
  unitSystem: UnitSystem;
}

export const SystemCurveChart: React.FC<SystemCurveChartProps> = ({
  flowResults,
  nominalGpm,
  unitSystem
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showPumpCurve, setShowPumpCurve] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'tdh' | 'power'>('tdh');

  if (!flowResults || flowResults.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200">
        No hay datos de caudal para graficar la curva del sistema.
      </div>
    );
  }

  // Chart dimensions
  const width = 800;
  const height = 400;
  const margin = { top: 40, right: 40, bottom: 60, left: 70 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Scales
  const maxQ = Math.max(...flowResults.map(r => (unitSystem === 'imperial' ? r.flowGpm : r.flowM3h))) * 1.1 || 100;
  
  // Find max TDH or Power
  const maxTDH = Math.max(...flowResults.map(r => (unitSystem === 'imperial' ? r.totalDynamicHeadFt : r.totalDynamicHeadM))) * 1.25 || 100;
  const maxPower = Math.max(...flowResults.map(r => r.nominalBhp)) * 1.3 || 50;

  const yMax = viewMode === 'tdh' ? maxTDH : maxPower;

  const getX = (val: number) => margin.left + (val / maxQ) * innerWidth;
  const getY = (val: number) => margin.top + innerHeight - (Math.max(0, val) / yMax) * innerHeight;

  // System curve points
  const systemPoints = flowResults.map(r => {
    const qVal = unitSystem === 'imperial' ? r.flowGpm : r.flowM3h;
    const yVal = viewMode === 'tdh'
      ? (unitSystem === 'imperial' ? r.totalDynamicHeadFt : r.totalDynamicHeadM)
      : r.nominalBhp;
    return { x: getX(qVal), y: getY(yVal), data: r };
  });

  const pathD = systemPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '');

  // Static head horizontal line (only in TDH mode)
  const staticHeadVal = unitSystem === 'imperial'
    ? flowResults[0].staticHeadFt + flowResults[0].deliveryPressureHeadFt
    : flowResults[0].staticHeadM + flowResults[0].deliveryPressureHeadM;
  const staticY = getY(staticHeadVal);

  // Hypothetical pump centrifugal H-Q curve (shut-off head approx 1.25 * TDH_BEP)
  const nominalResult = flowResults.find(r => Math.abs(r.flowGpm - nominalGpm) < 0.1) || flowResults[Math.floor(flowResults.length / 2)];
  const nomTDH = unitSystem === 'imperial' ? nominalResult.totalDynamicHeadFt : nominalResult.totalDynamicHeadM;
  const shutoffHead = nomTDH * 1.28;
  
  // Pump curve: H_pump(Q) = H_shutoff - K_pump * Q^2
  const nomQ = unitSystem === 'imperial' ? nominalResult.flowGpm : nominalResult.flowM3h;
  const kPump = (shutoffHead - nomTDH) / Math.pow(Math.max(1, nomQ), 2);

  const pumpCurvePoints = flowResults.map(r => {
    const q = unitSystem === 'imperial' ? r.flowGpm : r.flowM3h;
    const hPump = Math.max(0, shutoffHead - kPump * Math.pow(q, 2));
    return { x: getX(q), y: getY(hPump) };
  });
  const pumpPathD = pumpCurvePoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '');

  // X ticks
  const xTicksCount = 6;
  const xTicks = Array.from({ length: xTicksCount + 1 }, (_, i) => (maxQ / xTicksCount) * i);

  // Y ticks
  const yTicksCount = 5;
  const yTicks = Array.from({ length: yTicksCount + 1 }, (_, i) => (yMax / yTicksCount) * i);

  // Active hover point
  const activePoint = hoverIndex !== null ? systemPoints[hoverIndex] : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      {/* Title and graph toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            Curva del Sistema {viewMode === 'tdh' ? '(Q vs TDH)' : '(Q vs Potencia BHP)'}
          </h3>
          <p className="text-xs text-slate-500">
            Respuesta hidráulica del sistema según variación del caudal bombeado
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle: TDH vs Power */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('tdh')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                viewMode === 'tdh'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cabeza Dinámica (TDH)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('power')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                viewMode === 'power'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Potencia al Freno (BHP)
            </button>
          </div>

          {viewMode === 'tdh' && (
            <button
              type="button"
              onClick={() => setShowPumpCurve(!showPumpCurve)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition ${
                showPumpCurve
                  ? 'bg-amber-50 text-amber-800 border-amber-300 font-medium'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
              title="Superponer curva estimada de bomba centrífuga estándar para visualizar intersección"
            >
              {showPumpCurve ? <Eye className="w-3.5 h-3.5 text-amber-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
              Curva Bomba Estimada
            </button>
          )}
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[420px] select-none"
        >
          <defs>
            {/* Gradient under system curve */}
            <linearGradient id="systemCurveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((val, i) => (
            <g key={i}>
              <line
                x1={margin.left}
                y1={getY(val)}
                x2={width - margin.right}
                y2={getY(val)}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
              />
              <text
                x={margin.left - 10}
                y={getY(val) + 4}
                textAnchor="end"
                className="text-[11px] fill-slate-400 font-mono"
              >
                {val.toFixed(0)}
              </text>
            </g>
          ))}

          {xTicks.map((val, i) => (
            <g key={i}>
              <line
                x1={getX(val)}
                y1={margin.top}
                x2={getX(val)}
                y2={height - margin.bottom}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
              />
              <text
                x={getX(val)}
                y={height - margin.bottom + 20}
                textAnchor="middle"
                className="text-[11px] fill-slate-500 font-mono"
              >
                {val.toFixed(0)}
              </text>
            </g>
          ))}

          {/* Static Head Baseline Line (in TDH mode) */}
          {viewMode === 'tdh' && (
            <g>
              <line
                x1={margin.left}
                y1={staticY}
                x2={width - margin.right}
                y2={staticY}
                stroke="#059669"
                strokeWidth="2"
                strokeDasharray="5 4"
              />
              <text
                x={width - margin.right}
                y={staticY - 6}
                textAnchor="end"
                className="text-[10px] font-semibold fill-emerald-700"
              >
                Cabeza Estática + Presión Base: {staticHeadVal.toFixed(1)} {unitSystem === 'imperial' ? 'ft' : 'm'}
              </text>
            </g>
          )}

          {/* Area fill under system curve */}
          {systemPoints.length > 0 && (
            <path
              d={`${pathD} L ${systemPoints[systemPoints.length - 1].x} ${height - margin.bottom} L ${systemPoints[0].x} ${height - margin.bottom} Z`}
              fill="url(#systemCurveGrad)"
            />
          )}

          {/* System Curve Path */}
          <path
            d={pathD}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hypothetical Pump Curve */}
          {viewMode === 'tdh' && showPumpCurve && (
            <path
              d={pumpPathD}
              fill="none"
              stroke="#d97706"
              strokeWidth="2.5"
              strokeDasharray="6 3"
              strokeLinecap="round"
            />
          )}

          {/* Point markers */}
          {systemPoints.map((pt, idx) => {
            const isNominal = Math.abs(pt.data.flowGpm - nominalGpm) < 0.1;
            const isHovered = hoverIndex === idx;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
                className="cursor-pointer"
              >
                {/* Hit area for easy mouse hover */}
                <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

                {isNominal && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="9"
                    fill="#4f46e5"
                    fillOpacity="0.25"
                    className="animate-ping"
                  />
                )}

                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 7 : isNominal ? 6 : 4}
                  fill={isNominal ? '#4f46e5' : '#ffffff'}
                  stroke={isNominal ? '#ffffff' : '#4f46e5'}
                  strokeWidth={isNominal ? 2 : 2}
                />
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={width / 2}
            y={height - 15}
            textAnchor="middle"
            className="text-xs font-semibold fill-slate-700"
          >
            Caudal del Sistema (Q) [{unitSystem === 'imperial' ? 'GPM' : 'm³/h'}]
          </text>

          <text
            x={-(height / 2)}
            y={20}
            transform="rotate(-90)"
            textAnchor="middle"
            className="text-xs font-semibold fill-slate-700"
          >
            {viewMode === 'tdh'
              ? `Cabeza Dinámica Total (TDH) [${unitSystem === 'imperial' ? 'ft' : 'm'}]`
              : 'Potencia al Freno de Bomba [BHP (HP)]'}
          </text>
        </svg>

        {/* Hover Crosshair Tooltip Overlay */}
        {activePoint && (
          <div className="mt-2 bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-400 block">Caudal (Q):</span>
              <strong className="text-cyan-300 font-mono text-sm">
                {unitSystem === 'imperial'
                  ? `${activePoint.data.flowGpm.toFixed(1)} gpm`
                  : `${activePoint.data.flowM3h.toFixed(1)} m³/h`}
              </strong>
              <div className="text-[10px] text-slate-400">{activePoint.data.flowTonsH.toFixed(1)} ton/h</div>
            </div>

            <div>
              <span className="text-slate-400 block">TDH Total:</span>
              <strong className="text-emerald-300 font-mono text-sm">
                {unitSystem === 'imperial'
                  ? `${activePoint.data.totalDynamicHeadFt.toFixed(2)} ft`
                  : `${activePoint.data.totalDynamicHeadM.toFixed(2)} m`}
              </strong>
              <div className="text-[10px] text-slate-400">
                ΔH fricción: {unitSystem === 'imperial' ? `${activePoint.data.frictionLossFt.toFixed(1)} ft` : `${activePoint.data.frictionLossM.toFixed(1)} m`}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block">Pérdidas Menores:</span>
              <strong className="text-amber-300 font-mono text-sm">
                {unitSystem === 'imperial'
                  ? `${activePoint.data.minorLossFt.toFixed(2)} ft`
                  : `${activePoint.data.minorLossM.toFixed(2)} m`}
              </strong>
              <div className="text-[10px] text-slate-400">
                P_entrega: {unitSystem === 'imperial' ? `${activePoint.data.deliveryPressureHeadFt.toFixed(1)} ft` : `${activePoint.data.deliveryPressureHeadM.toFixed(1)} m`}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block">Potencia Requerida:</span>
              <strong className="text-indigo-300 font-mono text-sm">
                {activePoint.data.nominalBhp.toFixed(1)} BHP
              </strong>
              <div className="text-[10px] text-slate-400">
                WHP: {activePoint.data.whpHydraulicPower.toFixed(1)} HP ({activePoint.data.nominalKw.toFixed(1)} kW)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend and description */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-indigo-600 rounded"></span>
            <span>Curva del Sistema (TDH requerida por tubería)</span>
          </div>
          {viewMode === 'tdh' && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-t-2 border-dashed border-emerald-600"></span>
              <span>Cabeza Estática Neta + Presión de Entrega</span>
            </div>
          )}
          {viewMode === 'tdh' && showPumpCurve && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-t-2 border-dashed border-amber-500"></span>
              <span>Curva H-Q Bomba Centrífuga (Estimada BEP)</span>
            </div>
          )}
        </div>

        <span className="text-[11px] text-slate-400 italic">
          Pasa el cursor sobre los puntos para auditar cada caudal evaluado
        </span>
      </div>
    </div>
  );
};
