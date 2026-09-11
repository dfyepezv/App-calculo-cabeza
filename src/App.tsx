import React, { useMemo, useState } from 'react';
import {
  DischargeConfig,
  ExtractionPoint,
  FlowUnit,
  FluidProperties,
  PipeSegment,
  SuctionConfig,
  UnitSystem
} from './types';
import { Header } from './components/Header';
import { FluidSection } from './components/FluidSection';
import { SuctionDischargeSection } from './components/SuctionDischargeSection';
import { RouteBuilderSection } from './components/RouteBuilderSection';
import { ExtractionsSection } from './components/ExtractionsSection';
import { FlowsAndCurveSection } from './components/FlowsAndCurveSection';
import { PumpPowerSection } from './components/PumpPowerSection';
import { DetailedAuditSection } from './components/DetailedAuditSection';
import { SummaryReportsSection } from './components/SummaryReportsSection';
import { PRESET_SCENARIOS, PresetScenario } from './utils/presets';
import { evaluateSystemAtFlow } from './utils/hydraulicCalculations';
import { downloadCsvFile, generateTdhReportCsv } from './utils/exportCsv';
import { feetToMeters, gpmToFlow } from './utils/unitConversions';
import { Activity, Gauge, Zap, TrendingUp, Layers, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Unit System
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');

  // Initial Scenario Preset: Meladura de Caña
  const initialPreset = PRESET_SCENARIOS[0];
  const [currentPresetId, setCurrentPresetId] = useState<string>(initialPreset.id);

  // Hydraulic State
  const [fluid, setFluid] = useState<FluidProperties>(initialPreset.fluid);
  const [suction, setSuction] = useState<SuctionConfig>(initialPreset.suction);
  const [discharge, setDischarge] = useState<DischargeConfig>(initialPreset.discharge);
  const [segments, setSegments] = useState<PipeSegment[]>(initialPreset.segments);
  const [extractions, setExtractions] = useState<ExtractionPoint[]>(initialPreset.extractions);

  // Pump & Flow Points State
  const [nominalFlowGpm, setNominalFlowGpm] = useState<number>(initialPreset.nominalFlowGpm);
  const [selectedFlowUnit, setSelectedFlowUnit] = useState<FlowUnit>('gpm');
  const [pumpEfficiencyPercent, setPumpEfficiencyPercent] = useState<number>(70);

  // 10 evaluation flow points initialized
  const [flowPointsGpm, setFlowPointsGpm] = useState<number[]>(() => {
    const fractions = [0.01, 0.25, 0.50, 0.75, 0.90, 1.00, 1.15, 1.30, 1.45, 1.60];
    return fractions.map(f => Math.round(initialPreset.nominalFlowGpm * f * 10) / 10);
  });

  // Viscosity Correction (ANSI/HI 9.6.7)
  const [enableViscosityCorrection, setEnableViscosityCorrection] = useState<boolean>(false);
  const [manualCq, setManualCq] = useState<number>(0);
  const [manualCh, setManualCh] = useState<number>(0);
  const [manualCeta, setManualCeta] = useState<number>(0);

  // Active section filter or scroll
  const [activeSectionTab, setActiveSectionTab] = useState<string>('all');

  // Switch scenario preset
  const handleSelectPreset = (preset: PresetScenario) => {
    setCurrentPresetId(preset.id);
    setFluid(preset.fluid);
    setSuction(preset.suction);
    setDischarge(preset.discharge);
    setSegments(preset.segments);
    setExtractions(preset.extractions);
    setNominalFlowGpm(preset.nominalFlowGpm);
    const fractions = [0.01, 0.25, 0.50, 0.75, 0.90, 1.00, 1.15, 1.30, 1.45, 1.60];
    setFlowPointsGpm(fractions.map(f => Math.round(preset.nominalFlowGpm * f * 10) / 10));
    setManualCq(0);
    setManualCh(0);
    setManualCeta(0);
  };

  // Reset to current scenario
  const handleReset = () => {
    const found = PRESET_SCENARIOS.find(p => p.id === currentPresetId) || PRESET_SCENARIOS[0];
    handleSelectPreset(found);
  };

  // Final delivery elevation from segments
  const finalRouteElevationFt = useMemo(() => {
    if (!segments || segments.length === 0) return 0;
    const sorted = [...segments].sort((a, b) => a.order - b.order);
    return sorted[sorted.length - 1].endElevationValFt || 0;
  }, [segments]);

  // Hydraulic Calculations (Evaluated in real-time)
  const nominalResult = useMemo(() => {
    return evaluateSystemAtFlow(nominalFlowGpm, fluid, suction, segments, extractions, discharge);
  }, [nominalFlowGpm, fluid, suction, segments, extractions, discharge]);

  const allFlowCurveResults = useMemo(() => {
    const sortedPoints = [...new Set([...flowPointsGpm, nominalFlowGpm])].sort((a, b) => a - b);
    return sortedPoints.map(q => evaluateSystemAtFlow(q, fluid, suction, segments, extractions, discharge));
  }, [flowPointsGpm, nominalFlowGpm, fluid, suction, segments, extractions, discharge]);

  // CSV Export handler
  const handleExportCsv = () => {
    const csvContent = generateTdhReportCsv(
      fluid,
      suction,
      discharge,
      segments,
      nominalResult,
      allFlowCurveResults
    );
    const sanitizedName = fluid.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadCsvFile(csvContent, `calculo_tdh_${sanitizedName}_${Date.now()}.csv`);
  };

  const handlePrintReport = () => {
    window.print();
  };

  // Max velocity across segments
  const maxVelocityFps = Math.max(...nominalResult.segmentResults.map(s => s.velocityFps), 0);
  const maxVelocityMs = feetToMeters(maxVelocityFps);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      {/* Top Navbar */}
      <Header
        unitSystem={unitSystem}
        setUnitSystem={setUnitSystem}
        currentPresetId={currentPresetId}
        onSelectPreset={handleSelectPreset}
        onExportCsv={handleExportCsv}
        onPrintReport={handlePrintReport}
        onReset={handleReset}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        
        {/* Engineering KPI Summary Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Ficha Técnica de Dimensionamiento
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {fluid.name} ({fluid.sg} SG • {fluid.dynamicViscosityCp} cP)
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-1">
                Cabeza Dinámica Total del Sistema (TDH)
              </h2>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400">Punto de Operación Nominal</div>
              <div className="text-base font-bold text-cyan-300 font-mono">
                {nominalResult.flowGpm.toFixed(1)} GPM ({nominalResult.flowM3h.toFixed(1)} m³/h • {nominalResult.flowTonsH.toFixed(1)} ton/h)
              </div>
            </div>
          </div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
            {/* TDH */}
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 backdrop-blur-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="font-semibold text-slate-300">TDH Total Requerido</span>
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {unitSystem === 'imperial'
                  ? `${nominalResult.totalDynamicHeadFt.toFixed(2)}`
                  : `${nominalResult.totalDynamicHeadM.toFixed(2)}`}
                <span className="text-xs font-semibold text-cyan-300 ml-1">
                  {unitSystem === 'imperial' ? 'ft' : 'm'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                <span>ΔZ estático: {unitSystem === 'imperial' ? `${nominalResult.staticHeadFt.toFixed(1)} ft` : `${nominalResult.staticHeadM.toFixed(1)} m`}</span>
                <span>hf: {unitSystem === 'imperial' ? `${nominalResult.frictionLossFt.toFixed(1)} ft` : `${nominalResult.frictionLossM.toFixed(1)} m`}</span>
              </div>
            </div>

            {/* Brake Power BHP */}
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 backdrop-blur-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="font-semibold text-slate-300">Potencia al Freno (BHP)</span>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-300 font-mono">
                {nominalResult.nominalBhp.toFixed(2)}
                <span className="text-xs font-semibold text-amber-400/80 ml-1">HP</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                <span>WHP: {nominalResult.whpHydraulicPower.toFixed(2)} HP</span>
                <span>{nominalResult.nominalKw.toFixed(1)} kW</span>
              </div>
            </div>

            {/* Velocity */}
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 backdrop-blur-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="font-semibold text-slate-300">Velocidad Máxima</span>
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-indigo-200 font-mono">
                {maxVelocityFps.toFixed(2)}
                <span className="text-xs font-semibold text-indigo-400 ml-1">ft/s</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {maxVelocityMs.toFixed(2)} m/s {maxVelocityFps > 8 ? '• ¡Velocidad alta!' : '• Rango adecuado'}
              </div>
            </div>

            {/* Critical Governing check */}
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 backdrop-blur-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="font-semibold text-slate-300">Punto Gobernante</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-sm font-bold text-emerald-300 truncate mt-1">
                {nominalResult.governingCriticalSegmentName ? 'Equipo Intermedio' : 'Descarga Terminal'}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">
                {nominalResult.governingCriticalSegmentName || 'P = ' + discharge.deliveryPressure + ' ' + discharge.pressureUnit}
              </div>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center space-x-1 border-b border-slate-300 overflow-x-auto pb-1 text-xs no-print">
          {[
            { id: 'all', label: 'Ver Todo' },
            { id: 'fluid', label: '1. Fluido' },
            { id: 'suction', label: '2. Succión & Presión' },
            { id: 'route', label: '3. Ruta de Tubería' },
            { id: 'extractions', label: '4. Derivaciones' },
            { id: 'curve', label: '5. Curva del Sistema' },
            { id: 'power', label: '6. Potencia & Viscosidad' },
            { id: 'audit', label: '7. Auditoría Tramo a Tramo' },
            { id: 'reports', label: '8. Reporte & Materiales' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSectionTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                activeSectionTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 1. Fluid Section */}
        {(activeSectionTab === 'all' || activeSectionTab === 'fluid') && (
          <section id="section-fluid">
            <FluidSection
              fluid={fluid}
              onChange={setFluid}
              unitSystem={unitSystem}
            />
          </section>
        )}

        {/* 2. Suction & Delivery Pressure Section */}
        {(activeSectionTab === 'all' || activeSectionTab === 'suction') && (
          <section id="section-suction">
            <SuctionDischargeSection
              suction={suction}
              onSuctionChange={setSuction}
              discharge={discharge}
              onDischargeChange={setDischarge}
              fluid={fluid}
              unitSystem={unitSystem}
              finalRouteElevationFt={finalRouteElevationFt}
            />
          </section>
        )}

        {/* 3. Pipe Route Builder Section */}
        {(activeSectionTab === 'all' || activeSectionTab === 'route') && (
          <section id="section-route">
            <RouteBuilderSection
              segments={segments}
              onChangeSegments={setSegments}
              unitSystem={unitSystem}
            />
          </section>
        )}

        {/* 4. Extractions Section */}
        {(activeSectionTab === 'all' || activeSectionTab === 'extractions') && (
          <section id="section-extractions">
            <ExtractionsSection
              extractions={extractions}
              onChangeExtractions={setExtractions}
              segments={segments}
              unitSystem={unitSystem}
            />
          </section>
        )}

        {/* 5. Flows & System Curve Section */}
        {(activeSectionTab === 'all' || activeSectionTab === 'curve') && (
          <section id="section-curve">
            <FlowsAndCurveSection
              nominalFlowGpm={nominalFlowGpm}
              onNominalFlowChange={setNominalFlowGpm}
              flowPointsGpm={flowPointsGpm}
              onChangeFlowPointsGpm={setFlowPointsGpm}
              selectedFlowUnit={selectedFlowUnit}
              onSelectFlowUnit={setSelectedFlowUnit}
              flowResults={allFlowCurveResults}
              sg={fluid.sg}
              unitSystem={unitSystem}
            />
          </section>
        )}

        {/* 6. Pump Power & Viscosity Correction Section */}
        {(activeSectionTab === 'all' || activeSectionTab === 'power') && (
          <section id="section-power">
            <PumpPowerSection
              nominalResult={nominalResult}
              fluid={fluid}
              pumpEfficiencyPercent={pumpEfficiencyPercent}
              onPumpEfficiencyChange={setPumpEfficiencyPercent}
              enableViscosityCorrection={enableViscosityCorrection}
              onToggleViscosityCorrection={setEnableViscosityCorrection}
              manualCq={manualCq}
              onChangeManualCq={setManualCq}
              manualCh={manualCh}
              onChangeManualCh={setManualCh}
              manualCeta={manualCeta}
              onChangeManualCeta={setManualCeta}
              unitSystem={unitSystem}
            />
          </section>
        )}

        {/* 7. Detailed Audit Section */}
        {(activeSectionTab === 'all' || activeSectionTab === 'audit') && (
          <section id="section-audit">
            <DetailedAuditSection
              nominalResult={nominalResult}
              fluid={fluid}
              unitSystem={unitSystem}
            />
          </section>
        )}

        {/* 8. Summary & Materials Reports Section */}
        {(activeSectionTab === 'all' || activeSectionTab === 'reports') && (
          <section id="section-reports">
            <SummaryReportsSection
              segments={segments}
              nominalResult={nominalResult}
              fluid={fluid}
              suction={suction}
              discharge={discharge}
              unitSystem={unitSystem}
              onExportCsv={handleExportCsv}
              onPrintReport={handlePrintReport}
            />
          </section>
        )}

      </main>

      {/* Engineering Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-6 mt-12 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-slate-200">Calculadora de TDH para Bombas Centrífugas con Fluidos Viscosos</span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Metodología basada en Darcy-Weisbach, aproximación Swamee-Jain / Colebrook-White, pérdidas menores Crane TP-410 y corrección ANSI/HI 9.6.7.
            </p>
          </div>
          <div className="text-slate-500 text-[11px]">
            100% Client-Side • Sin Backend • Ejecución Segura en Navegador
          </div>
        </div>
      </footer>
    </div>
  );
}
