import React, { useState } from 'react';
import { PipeSegment, SegmentFittingItem, SegmentOrientation, UnitSystem } from '../types';
import {
  STANDARD_MATERIALS,
  STANDARD_PIPE_SIZES,
  TYPICAL_FITTINGS,
  getInternalDiameterInches,
  getInternalDiameterMm,
  getMaterialRoughness
} from '../utils/pipeData';
import {
  feetToMeters,
  formatFeetToEngineering,
  parseLengthToFeet
} from '../utils/unitConversions';
import {
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Settings2,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  Hash
} from 'lucide-react';

interface RouteBuilderSectionProps {
  segments: PipeSegment[];
  onChangeSegments: (segments: PipeSegment[]) => void;
  unitSystem: UnitSystem;
}

export const RouteBuilderSection: React.FC<RouteBuilderSectionProps> = ({
  segments,
  onChangeSegments,
  unitSystem
}) => {
  const [expandedSegmentId, setExpandedSegmentId] = useState<string | null>(
    segments.length > 0 ? segments[0].id : null
  );

  // Quick summary calculations:
  // 1. Final accumulated elevation
  const sortedSegments = [...segments].sort((a, b) => a.order - b.order);
  const finalAccumElevationFt = sortedSegments.length > 0
    ? sortedSegments[sortedSegments.length - 1].endElevationValFt
    : 0;

  // 2. Length by diameter
  const lengthByDiaMap = new Map<string, { nominal: string; sched: string; totalFt: number }>();
  sortedSegments.forEach(s => {
    const key = `${s.nominalDiameter}_${s.schedule}`;
    const cur = lengthByDiaMap.get(key) || { nominal: s.nominalDiameter, sched: s.schedule, totalFt: 0 };
    cur.totalFt += s.straightLengthFt || 0;
    lengthByDiaMap.set(key, cur);
  });

  // 3. Total accessories count
  let totalAccessoriesCount = 0;
  sortedSegments.forEach(s => {
    (s.fittings || []).forEach(f => {
      totalAccessoriesCount += f.quantity || 0;
    });
  });

  // Actions on segments
  const handleAddSegment = () => {
    const lastSeg = sortedSegments[sortedSegments.length - 1];
    const newOrder = sortedSegments.length + 1;
    const startVal = lastSeg ? lastSeg.endElevationValFt : 0;
    const startStr = lastSeg ? lastSeg.endElevationStr : "0'-0\"";

    const newSegment: PipeSegment = {
      id: `seg_${Date.now()}`,
      name: `Tramo ${newOrder}: Tubería recta`,
      order: newOrder,
      startElevationStr: startStr,
      endElevationStr: formatFeetToEngineering(startVal + 10),
      startElevationValFt: startVal,
      endElevationValFt: startVal + 10,
      type: 'horizontal',
      nominalDiameter: lastSeg ? lastSeg.nominalDiameter : '3',
      schedule: lastSeg ? lastSeg.schedule : 'sch40',
      straightLengthStr: "20'-0\"",
      straightLengthFt: 20,
      materialId: lastSeg ? lastSeg.materialId : 'carbon_steel_comm',
      fittings: [
        { id: `fit_${Date.now()}_1`, fittingId: 'elbow_90_std', name: 'Codo 90° estándar', quantity: 1, kValue: 0.3 }
      ]
    };

    const nextList = [...sortedSegments, newSegment];
    onChangeSegments(nextList);
    setExpandedSegmentId(newSegment.id);
  };

  const handleDeleteSegment = (id: string) => {
    if (segments.length <= 1) return;
    const filtered = sortedSegments.filter(s => s.id !== id);
    const reordered = filtered.map((s, idx) => ({ ...s, order: idx + 1 }));
    onChangeSegments(reordered);
    if (expandedSegmentId === id && reordered.length > 0) {
      setExpandedSegmentId(reordered[0].id);
    }
  };

  const handleDuplicateSegment = (seg: PipeSegment) => {
    const newSeg: PipeSegment = {
      ...seg,
      id: `seg_${Date.now()}`,
      name: `${seg.name} (Copia)`,
      order: seg.order + 1,
      fittings: seg.fittings.map(f => ({ ...f, id: `fit_${Date.now()}_${Math.random()}` }))
    };
    const nextList = [...sortedSegments];
    nextList.splice(seg.order, 0, newSeg);
    const reordered = nextList.map((s, idx) => ({ ...s, order: idx + 1 }));
    onChangeSegments(reordered);
    setExpandedSegmentId(newSeg.id);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === sortedSegments.length - 1)) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const items = [...sortedSegments];
    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;
    const reordered = items.map((s, idx) => ({ ...s, order: idx + 1 }));
    onChangeSegments(reordered);
  };

  const updateSegment = (id: string, updates: Partial<PipeSegment>) => {
    const updated = segments.map(s => {
      if (s.id !== id) return s;
      return { ...s, ...updates };
    });
    onChangeSegments(updated);
  };

  // Helper for elevation input parse
  const handleElevationChange = (id: string, field: 'start' | 'end', inputStr: string) => {
    const parsed = parseLengthToFeet(inputStr);
    if (field === 'start') {
      updateSegment(id, {
        startElevationStr: inputStr,
        startElevationValFt: parsed.feet
      });
    } else {
      updateSegment(id, {
        endElevationStr: inputStr,
        endElevationValFt: parsed.feet
      });
    }
  };

  const handleLengthChange = (id: string, inputStr: string) => {
    const parsed = parseLengthToFeet(inputStr);
    updateSegment(id, {
      straightLengthStr: inputStr,
      straightLengthFt: Math.max(0, parsed.feet)
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header with Title and Live Summary Bar */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              3. Constructor de Ruta de Tubería por Niveles de Elevación
            </h2>
            <p className="text-xs text-slate-500">
              Configuración tramo por tramo en orden de flujo: cotas, diámetros, rugosidad y accesorios
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddSegment}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Agregar Tramo
        </button>
      </div>

      {/* Live Route Summary Bar */}
      <div className="bg-indigo-50/60 px-5 py-2.5 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-slate-500">Total Tramos:</span>{' '}
            <span className="font-bold text-slate-900">{segments.length}</span>
          </div>
          <span className="text-indigo-200">|</span>
          <div>
            <span className="text-slate-500">Cota Final Acumulada:</span>{' '}
            <span className="font-bold text-indigo-950 font-mono">
              {finalAccumElevationFt.toFixed(2)} ft ({feetToMeters(finalAccumElevationFt).toFixed(2)} m)
            </span>
          </div>
          <span className="text-indigo-200">|</span>
          <div>
            <span className="text-slate-500">Total Accesorios:</span>{' '}
            <span className="font-bold text-indigo-950">{totalAccessoriesCount} unidades</span>
          </div>
        </div>

        {/* Total Length per diameter pill badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-500 font-medium">Metraje por Ø:</span>
          {Array.from(lengthByDiaMap.values()).map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-indigo-900 border border-indigo-200 text-[11px] font-mono shadow-2xs"
            >
              <strong>{item.nominal}&quot;</strong> ({item.sched}): {item.totalFt.toFixed(1)} ft ({feetToMeters(item.totalFt).toFixed(1)} m)
            </span>
          ))}
        </div>
      </div>

      {/* Segment List */}
      <div className="p-4 space-y-3">
        {sortedSegments.map((seg, idx) => {
          const isExpanded = expandedSegmentId === seg.id;
          const idIn = getInternalDiameterInches(seg.nominalDiameter, seg.schedule, seg.customInternalDiameterInches);
          const idMm = getInternalDiameterMm(seg.nominalDiameter, seg.schedule, seg.customInternalDiameterInches);
          const roughness = getMaterialRoughness(seg.materialId, seg.customRoughnessMm);
          const deltaZ = (seg.endElevationValFt || 0) - (seg.startElevationValFt || 0);

          // Check if diameter change with previous segment
          const prevSeg = idx > 0 ? sortedSegments[idx - 1] : null;
          const prevId = prevSeg ? getInternalDiameterInches(prevSeg.nominalDiameter, prevSeg.schedule, prevSeg.customInternalDiameterInches) : null;
          const hasDiameterChange = prevId !== null && Math.abs(prevId - idIn) > 0.05;

          return (
            <div
              key={seg.id}
              className={`border rounded-xl transition-all ${
                isExpanded
                  ? 'border-indigo-300 bg-white shadow-sm'
                  : 'border-slate-200 bg-slate-50/70 hover:bg-white'
              }`}
            >
              {/* Segment Collapsible Header */}
              <div
                className="px-4 py-3 flex items-center justify-between cursor-pointer select-none"
                onClick={() => setExpandedSegmentId(isExpanded ? null : seg.id)}
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {seg.order}
                  </span>
                  <div className="truncate">
                    <span className="text-sm font-semibold text-slate-800 mr-2">
                      {seg.name}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Ø {seg.nominalDiameter}&quot; {seg.schedule} • L = {seg.straightLengthFt.toFixed(1)} ft • Cotas: {seg.startElevationStr} → {seg.endElevationStr} (ΔZ = {deltaZ >= 0 ? `+${deltaZ.toFixed(2)}` : deltaZ.toFixed(2)} ft)
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  {hasDiameterChange && (
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      {idIn > (prevId || 0) ? 'Ampliación' : 'Reducción'} (ΔØ)
                    </span>
                  )}

                  {seg.intermediatePressureReqPsi ? (
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                      P_req = {seg.intermediatePressureReqPsi} psi
                    </span>
                  ) : null}

                  {/* Reorder and action buttons */}
                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Subir tramo"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === sortedSegments.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Bajar tramo"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicateSegment(seg)}
                      className="p-1 text-slate-400 hover:text-indigo-600"
                      title="Duplicar tramo"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSegment(seg.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                      title="Eliminar tramo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-1 text-slate-400">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Segment Expanded Editor */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-200/80 space-y-4 text-xs">
                  
                  {/* Basic description and orientation */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Nombre / Descripción del Tramo
                      </label>
                      <input
                        type="text"
                        value={seg.name}
                        onChange={(e) => updateSegment(seg.id, { name: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Orientación del Tramo
                      </label>
                      <select
                        value={seg.type}
                        onChange={(e) => updateSegment(seg.id, { type: e.target.value as SegmentOrientation })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="horizontal">Horizontal</option>
                        <option value="vertical_up">Vertical (Sube ↑)</option>
                        <option value="vertical_down">Vertical (Baja ↓)</option>
                        <option value="diagonal">Diagonal / Inclinado</option>
                      </select>
                    </div>
                  </div>

                  {/* Elevations & Length with fraction support */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Cota Inicio (Z_ini)</span>
                        <span className="text-[10px] text-slate-400">ej. 21&apos;-11 5/8&quot;</span>
                      </label>
                      <input
                        type="text"
                        value={seg.startElevationStr}
                        onChange={(e) => handleElevationChange(seg.id, 'start', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs"
                      />
                      <div className="mt-1 text-[10px] text-slate-500">
                        {seg.startElevationValFt.toFixed(2)} ft ({feetToMeters(seg.startElevationValFt).toFixed(2)} m)
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Cota Final (Z_fin)</span>
                        <span className="text-[10px] text-slate-400">ej. 34&apos;-0&quot;</span>
                      </label>
                      <input
                        type="text"
                        value={seg.endElevationStr}
                        onChange={(e) => handleElevationChange(seg.id, 'end', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs"
                      />
                      <div className="mt-1 text-[10px] text-slate-500">
                        {seg.endElevationValFt.toFixed(2)} ft ({feetToMeters(seg.endElevationValFt).toFixed(2)} m)
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Longitud Recta (L)</span>
                        <span className="text-[10px] text-slate-400">tubería</span>
                      </label>
                      <input
                        type="text"
                        value={seg.straightLengthStr}
                        onChange={(e) => handleLengthChange(seg.id, e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs"
                      />
                      <div className="mt-1 text-[10px] text-slate-500">
                        {seg.straightLengthFt.toFixed(2)} ft ({feetToMeters(seg.straightLengthFt).toFixed(2)} m)
                      </div>
                    </div>
                  </div>

                  {/* Dimensions & Schedule */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Diámetro Nominal (NPS)
                      </label>
                      <select
                        value={seg.nominalDiameter}
                        onChange={(e) => updateSegment(seg.id, { nominalDiameter: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-mono"
                      >
                        {STANDARD_PIPE_SIZES.map(p => (
                          <option key={p.nominalInches} value={p.nominalInches}>
                            {p.nominalInches}&quot; (Nominal)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Cédula / Schedule
                      </label>
                      <select
                        value={seg.schedule}
                        onChange={(e) => updateSegment(seg.id, { schedule: e.target.value as any })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                      >
                        <option value="sch40">Schedule 40 (Estándar)</option>
                        <option value="sch80">Schedule 80 (Extra fuerte)</option>
                        <option value="sch10">Schedule 10 (Pared delgada)</option>
                        <option value="custom">Personalizado (Ingresar DI)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Diámetro Interior (ID)
                      </label>
                      {seg.schedule === 'custom' ? (
                        <div className="relative">
                          <input
                            type="number"
                            step="0.001"
                            value={seg.customInternalDiameterInches ?? idIn}
                            onChange={(e) => updateSegment(seg.id, { customInternalDiameterInches: parseFloat(e.target.value) })}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-xs"
                          />
                          <span className="absolute right-2 top-1.5 text-slate-400">in</span>
                        </div>
                      ) : (
                        <div className="px-2.5 py-1.5 bg-slate-100 rounded-lg border border-slate-200 font-mono text-slate-800 text-xs">
                          {idIn.toFixed(3)} in ({idMm.toFixed(1)} mm)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Material & Roughness */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Material de Tubería / Rugosidad Absoluta (ε)
                      </label>
                      <select
                        value={seg.materialId}
                        onChange={(e) => updateSegment(seg.id, { materialId: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                      >
                        {STANDARD_MATERIALS.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} (ε = {m.roughnessMm} mm)
                          </option>
                        ))}
                      </select>
                    </div>

                    {seg.materialId === 'custom' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Rugosidad Personalizada (mm)
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          value={seg.customRoughnessMm ?? 0.045}
                          onChange={(e) => updateSegment(seg.id, { customRoughnessMm: parseFloat(e.target.value) })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {/* Inline Equipment Loss and Intermediate Pressure */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/50 p-3 rounded-lg border border-amber-200/60">
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-950 mb-1 flex items-center justify-between">
                        <span>Pérdida por Equipo en Línea (ΔP)</span>
                        <span className="text-[10px] text-amber-700 font-normal">Filtro dúplex / Intercambiador</span>
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={seg.equipmentName || ''}
                          onChange={(e) => updateSegment(seg.id, { equipmentName: e.target.value })}
                          placeholder="Nombre (ej. Filtro canasta)"
                          className="w-2/3 px-2 py-1 border border-slate-300 rounded bg-white text-xs"
                        />
                        <div className="relative w-1/3">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={seg.equipmentDeltaPPsi || 0}
                            onChange={(e) => updateSegment(seg.id, { equipmentDeltaPPsi: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 border border-slate-300 rounded bg-white font-mono text-xs pr-6"
                          />
                          <span className="absolute right-2 top-1 text-slate-400 text-[10px]">psi</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-purple-950 mb-1 flex items-center justify-between">
                        <span>Presión Requerida en este Punto</span>
                        <span className="text-[10px] text-purple-700 font-normal">Tanque presurizado / Vessel</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={seg.intermediatePressureReqPsi ?? ''}
                          onChange={(e) =>
                            updateSegment(seg.id, {
                              intermediatePressureReqPsi: e.target.value === '' ? undefined : parseFloat(e.target.value)
                            })
                          }
                          placeholder="0 si es línea abierta"
                          className="w-full px-2.5 py-1 border border-slate-300 rounded bg-white font-mono text-xs pr-10"
                        />
                        <span className="absolute right-2 top-1 text-slate-400 text-[11px]">psig</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Verifica si la presión aquí excede la entrega final (Punto Crítico).
                      </span>
                    </div>
                  </div>

                  {/* Fittings / Accessories Manager */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        Accesorios y Válvulas en este Tramo
                        <span title="Cada accesorio introduce una pérdida menor proporcional a K * V²/(2g).">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newFit: SegmentFittingItem = {
                            id: `fit_${Date.now()}`,
                            fittingId: 'elbow_90_std',
                            name: 'Codo 90° estándar',
                            quantity: 1,
                            kValue: 0.3
                          };
                          updateSegment(seg.id, { fittings: [...(seg.fittings || []), newFit] });
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium text-[11px] border border-indigo-200 transition"
                      >
                        <Plus className="w-3 h-3" />
                        Agregar Accesorio
                      </button>
                    </div>

                    {/* Fittings list table */}
                    {seg.fittings && seg.fittings.length > 0 ? (
                      <div className="space-y-2">
                        {seg.fittings.map((fit, fIdx) => (
                          <div
                            key={fit.id}
                            className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs"
                          >
                            <select
                              value={fit.fittingId}
                              onChange={(e) => {
                                const selectedDef = TYPICAL_FITTINGS.find(tf => tf.id === e.target.value);
                                if (selectedDef) {
                                  const updatedFits = [...seg.fittings];
                                  updatedFits[fIdx] = {
                                    ...fit,
                                    fittingId: selectedDef.id,
                                    name: selectedDef.name,
                                    kValue: selectedDef.kValue
                                  };
                                  updateSegment(seg.id, { fittings: updatedFits });
                                }
                              }}
                              className="w-full sm:w-1/2 px-2 py-1 border border-slate-300 rounded bg-white text-xs truncate"
                            >
                              {TYPICAL_FITTINGS.map(tf => (
                                <option key={tf.id} value={tf.id}>
                                  {tf.name} (K={tf.kValue})
                                </option>
                              ))}
                            </select>

                            <div className="flex items-center gap-1">
                              <span className="text-slate-500 text-[11px]">Cant:</span>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={fit.quantity}
                                onChange={(e) => {
                                  const updatedFits = [...seg.fittings];
                                  updatedFits[fIdx] = { ...fit, quantity: parseInt(e.target.value) || 1 };
                                  updateSegment(seg.id, { fittings: updatedFits });
                                }}
                                className="w-14 px-1.5 py-1 border border-slate-300 rounded bg-white text-center font-mono text-xs"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-slate-500 text-[11px]">K:</span>
                              <input
                                type="number"
                                step="0.05"
                                min="0"
                                value={fit.kValue}
                                onChange={(e) => {
                                  const updatedFits = [...seg.fittings];
                                  updatedFits[fIdx] = { ...fit, kValue: parseFloat(e.target.value) || 0 };
                                  updateSegment(seg.id, { fittings: updatedFits });
                                }}
                                className="w-16 px-1.5 py-1 border border-slate-300 rounded bg-white text-center font-mono text-xs"
                              />
                            </div>

                            <div className="text-slate-500 text-[11px] font-mono whitespace-nowrap">
                              ΣK = {(fit.quantity * fit.kValue).toFixed(2)}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const updatedFits = seg.fittings.filter(f => f.id !== fit.id);
                                updateSegment(seg.id, { fittings: updatedFits });
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 ml-auto"
                              title="Quitar accesorio"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-400 text-center py-2 text-xs italic bg-slate-50 rounded border border-dashed border-slate-200">
                        No hay accesorios agregados en este tramo.
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
