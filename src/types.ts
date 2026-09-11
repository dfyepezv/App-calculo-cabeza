export type UnitSystem = 'imperial' | 'metric';

export type FlowUnit = 'gpm' | 'm3h' | 'tons_h' | 'ls' | 'percent';
export type PressureUnit = 'psig' | 'bar' | 'kpa';
export type LengthUnit = 'ft' | 'm';

export interface FluidProperties {
  name: string;
  sg: number; // Specific gravity relative to water at 4°C
  densityKgM3: number;
  dynamicViscosityCp: number; // cP = mPa*s
  kinematicViscosityCst: number; // cSt = mm²/s = cP / SG
  temperatureC?: number;
  temperatureF?: number;
  brix?: number; // Optional sugar/solids content in °Bx
  notes?: string;
}

export interface PipeMaterial {
  id: string;
  name: string;
  roughnessMm: number;
  roughnessFt: number;
  description: string;
}

export interface PipeSizeDef {
  nominalInches: string; // e.g. "3"
  nominalNumeric: number; // 3.0
  sch40IdInches: number;
  sch40IdMm: number;
  sch80IdInches: number;
  sch80IdMm: number;
  sch10IdInches?: number;
  sch10IdMm?: number;
}

export interface FittingDef {
  id: string;
  name: string;
  category: 'elbow' | 'valve' | 'tee' | 'entrance_exit' | 'transition' | 'other';
  kValue: number;
  description: string;
  sourceRef?: string;
}

export interface SegmentFittingItem {
  id: string;
  fittingId: string;
  name: string;
  quantity: number;
  kValue: number;
  customNotes?: string;
}

export type SegmentOrientation = 'horizontal' | 'vertical_up' | 'vertical_down' | 'diagonal';

export interface PipeSegment {
  id: string;
  name: string;
  order: number;
  // Elevations
  startElevationStr: string; // supports e.g. "21'-11 5/8"" or "21.97"
  endElevationStr: string;
  startElevationValFt: number;
  endElevationValFt: number;
  type: SegmentOrientation;
  
  // Dimensions
  nominalDiameter: string; // e.g. "3"
  schedule: 'sch40' | 'sch80' | 'sch10' | 'custom';
  customInternalDiameterInches?: number;
  straightLengthStr: string;
  straightLengthFt: number;
  
  // Material
  materialId: string;
  customRoughnessMm?: number;
  
  // Fittings
  fittings: SegmentFittingItem[];
  
  // In-line equipment
  equipmentName?: string;
  equipmentDeltaPPsi?: number; // e.g. filter loss = 6 psi
  
  // Intermediate check
  intermediatePressureReqPsi?: number; // required gauge pressure at this point if vessel/header
}

export interface ExtractionPoint {
  id: string;
  afterSegmentId: string; // takeoff happens after this segment
  name: string;
  flowValue: number;
  flowUnit: FlowUnit;
}

export type SuctionSourceType = 'fixed_elevation' | 'tank_cone' | 'tank_horizontal';

export interface SuctionConfig {
  type: SuctionSourceType;
  fixedElevationStr: string;
  fixedElevationFt: number;
  
  // Vertical tank with conical bottom
  coneTank: {
    baseDatumElevationFt: number; // Elevation of cone vertex / discharge nozzle
    coneHeightFt: number;
    cylinderHeightFt: number;
    diameterFt: number;
    liquidLevelPercent: number; // 0 to 100%
  };
  
  // Horizontal cylindrical tank
  horizTank: {
    invertElevationFt: number; // Lowest bottom level
    diameterFt: number;
    lengthFt: number;
    liquidLevelPercent: number; // 0 to 100%
  };
}

export interface DischargeConfig {
  deliveryPressure: number;
  pressureUnit: PressureUnit;
  otherEquipmentLossPsi: number; // Total additional losses (strainers, meters, etc.)
}

export interface PumpEvaluation {
  nominalFlow: number;
  flowUnit: FlowUnit;
  pumpEfficiencyPercent: number;
  motorEfficiencyPercent: number;
  // Custom evaluation points
  flowPoints: number[];
  // Viscosity correction ANSI/HI 9.6.7
  enableViscosityCorrection: boolean;
  manualCq?: number;
  manualCh?: number;
  manualCeta?: number;
}

export interface SegmentHydraulicResult {
  segmentId: string;
  segmentName: string;
  order: number;
  flowGpm: number;
  flowM3h: number;
  flowTonsH: number;
  internalDiameterIn: number;
  internalDiameterM: number;
  lengthFt: number;
  lengthM: number;
  velocityFps: number;
  velocityMs: number;
  velocityHeadFt: number;
  reynolds: number;
  flowRegime: 'Laminar' | 'Transición' | 'Turbulento';
  darcyFrictionFactor: number;
  relativeRoughness: number;
  frictionLossFt: number;
  frictionLossM: number;
  fittingsKSum: number;
  minorLossFt: number;
  minorLossM: number;
  equipmentLossFt: number;
  equipmentLossM: number;
  totalLossFt: number;
  totalLossM: number;
  startElevFt: number;
  endElevFt: number;
  deltaElevFt: number;
  cumulativeHeadFt: number;
  availablePressurePsi: number;
  requiredPressurePsi?: number;
  isCriticalGovernor?: boolean;
}

export interface FlowPointResult {
  flowValue: number;
  flowUnit: FlowUnit;
  flowGpm: number;
  flowM3h: number;
  flowTonsH: number;
  staticHeadFt: number;
  staticHeadM: number;
  frictionLossFt: number;
  frictionLossM: number;
  minorLossFt: number;
  minorLossM: number;
  deliveryPressureHeadFt: number;
  deliveryPressureHeadM: number;
  equipmentLossHeadFt: number;
  equipmentLossHeadM: number;
  totalDynamicHeadFt: number;
  totalDynamicHeadM: number;
  whpHydraulicPower: number;
  bhpsensitivity: { efficiency: number; bhp: number; kw: number }[];
  nominalBhp: number;
  nominalKw: number;
  segmentResults: SegmentHydraulicResult[];
  governingCriticalSegmentName?: string;
  viscosityCorrection?: {
    cq: number;
    ch: number;
    ceta: number;
    correctedTdhFt: number;
    correctedBhp: number;
  };
}
