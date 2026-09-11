import React from 'react';
import { ExtractionPoint, FlowUnit, PipeSegment, UnitSystem } from '../types';
import { GitFork, Plus, Trash2, HelpCircle } from 'lucide-react';

interface ExtractionsSectionProps {
  extractions: ExtractionPoint[];
  onChangeExtractions: (updated: ExtractionPoint[]) => void;
  segments: PipeSegment[];
  unitSystem: UnitSystem;
}

export const ExtractionsSection: React.FC<ExtractionsSectionProps> = ({
  extractions,
  onChangeExtractions,
  segments,
  unitSystem
}) => {
  const sortedSegments = [...segments].sort((a, b) => a.order - b.order);

  const handleAddExtraction = () => {
    const targetSegment = sortedSegments.length > 1 ? sortedSegments[1] : sortedSegments[0];
    const newExt: ExtractionPoint = {
      id: `ext_${Date.now()}`,
      afterSegmentId: targetSegment ? targetSegment.id : '',
      name: `Derivación ${extractions.length + 1}: Toma de flujo`,
      flowValue: 10,
      flowUnit: 'gpm'
    };
    onChangeExtractions([...extractions, newExt]);
  };

  const handleUpdate = (id: string, updates: Partial<ExtractionPoint>) => {
    const updated = extractions.map(e => (e.id === id ? { ...e, ...updates } : e));
    onChangeExtractions(updated);
  };

  const handleDelete = (id: string) => {
    onChangeExtractions(extractions.filter(e => e.id !== id));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-cyan-100 text-cyan-700 rounded-lg">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              4. Extracciones y Derivaciones de Caudal (Take-offs)
            </h2>
            <p className="text-xs text-slate-500">
              Puntos a lo largo de la ruta donde se extrae flujo hacia otros procesos o recirculaciones
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddExtraction}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition"
        >
          <Plus className="w-4 h-4" />
          Agregar Derivación
        </button>
      </div>

      <div className="p-5">
        {extractions.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
            No se han configurado derivaciones de caudal. El caudal bombeado es 100% constante en toda la ruta.
          </div>
        ) : (
          <div className="space-y-3">
            {extractions.map((ext, idx) => (
              <div
                key={ext.id}
                className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex flex-wrap lg:flex-nowrap items-center gap-3 text-xs"
              >
                <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                  {idx + 1}
                </span>

                <div className="w-full sm:w-1/3">
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                    Descripción del Punto de Extracción
                  </label>
                  <input
                    type="text"
                    value={ext.name}
                    onChange={(e) => handleUpdate(ext.id, { name: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                    placeholder="Ej. Recirculación, Toma de muestra, etc."
                  />
                </div>

                <div className="w-full sm:w-1/3">
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                    Se Extrae Después del Tramo:
                  </label>
                  <select
                    value={ext.afterSegmentId}
                    onChange={(e) => handleUpdate(ext.id, { afterSegmentId: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
                  >
                    {sortedSegments.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.order}. {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-1/4">
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                    Caudal Retirado
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={ext.flowValue}
                      onChange={(e) => handleUpdate(ext.id, { flowValue: parseFloat(e.target.value) || 0 })}
                      className="w-20 px-2 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs text-right"
                    />
                    <select
                      value={ext.flowUnit}
                      onChange={(e) => handleUpdate(ext.id, { flowUnit: e.target.value as any })}
                      className="px-2 py-1.5 border border-slate-300 rounded bg-white text-xs"
                    >
                      <option value="gpm">GPM</option>
                      <option value="m3h">m³/h</option>
                      <option value="tons_h">ton/h</option>
                      <option value="percent">% del total</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(ext.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 ml-auto"
                  title="Eliminar derivación"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
