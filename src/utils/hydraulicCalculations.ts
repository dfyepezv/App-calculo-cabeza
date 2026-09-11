import {
  DischargeConfig,
  ExtractionPoint,
  FlowPointResult,
  FlowUnit,
  FluidProperties,
  PipeSegment,
  SegmentHydraulicResult,
  SuctionConfig
} from '../types';
import { getInternalDiameterInches, getMaterialRoughness } from './pipeData';
import { feetToMeters, flowToGpm, gpmToFlow, psiToHeadFeet } from './unitConversions';

const G_FT_S2 = 32.174;
const G_M_S2 = 9.80665;

/**
 * Calculates the exact liquid surface elevation at the suction source (in feet).
 */
export function calculateSuctionElevationFt(suction: SuctionConfig): number {
  if (suction.type === 'fixed_elevation') {
    return suction.fixedElevationFt || 0;
  }

  if (suction.type === 'tank_cone') {
    const { baseDatumElevationFt, coneHeightFt, cylinderHeightFt, diameterFt, liquidLevelPercent } = suction.coneTank;
    const levelFrac = Math.max(0, Math.min(100, liquidLevelPercent)) / 100;
    const r = diameterFt / 2;

    // Conical section volume: V_cone = (1/3) * pi * r^2 * h_cone
    const vCone = (1 / 3) * Math.PI * Math.pow(r, 2) * Math.max(0.01, coneHeightFt);
    // Cylindrical section volume: V_cyl = pi * r^2 * h_cyl
    const vCyl = Math.PI * Math.pow(r, 2) * Math.max(0, cylinderHeightFt);
    const vTotal = vCone + vCyl;
    const currentVolume = levelFrac * vTotal;

    if (currentVolume <= vCone) {
      // Liquid is strictly inside the conical section
      // V(z) = (1/3) * pi * (r * z / h_c)^2 * z = V_cone * (z / h_c)^3
      // z = h_c * (V / V_cone)^(1/3)
      const zInsideCone = coneHeightFt * Math.cbrt(currentVolume / vCone);
      return baseDatumElevationFt + zInsideCone;
    } else {
      // Liquid has filled the cone and is inside the cylinder
      const excessVol = currentVolume - vCone;
      const zInsideCylinder = excessVol / (Math.PI * Math.pow(r, 2));
      return baseDatumElevationFt + coneHeightFt + zInsideCylinder;
    }
  }

  if (suction.type === 'tank_horizontal') {
    const { invertElevationFt, diameterFt, liquidLevelPercent } = suction.horizTank;
    const levelFrac = Math.max(0, Math.min(100, liquidLevelPercent)) / 100;
    // For a horizontal tank, level % can be treated as liquid height fraction: h = D * %
    const liquidDepth = diameterFt * levelFrac;
    return invertElevationFt + liquidDepth;
  }

  return 0;
}

/**
 * Calculates Darcy friction factor f using Swamee-Jain + 2 Newton-Raphson Colebrook iterations
 */
export function calculateDarcyFrictionFactor(reynolds: number, relativeRoughness: number): number {
  if (reynolds <= 0) return 0.02;

  // Laminar regime
  if (reynolds < 2300) {
    return Math.min(1.0, Math.max(0.005, 64 / reynolds));
  }

  // Transition / Turbulent: Initial estimate using Swamee-Jain (1976)
  // f = 0.25 / [ log10( (eps / 3.7D) + 5.74 / Re^0.9 ) ]^2
  const term1 = relativeRoughness / 3.7;
  const term2 = 5.74 / Math.pow(reynolds, 0.9);
  const logTerm = Math.log10(term1 + term2);
  let f = 0.25 / Math.pow(logTerm, 2);

  // Refine with 2 Colebrook-White iterations for precision:
  // F(x) = x + 2*log10( eps/(3.7D) + 2.51*x/Re ) where x = 1/sqrt(f)
  for (let i = 0; i < 2; i++) {
    const sqrtF = Math.sqrt(f);
    const cbTerm = term1 + (2.51 / (reynolds * sqrtF));
    if (cbTerm > 0) {
      const invSqrtF = -2.0 * Math.log10(cbTerm);
      if (invSqrtF > 0) {
        f = 1 / (invSqrtF * invSqrtF);
      }
    }
  }

  return Math.min(0.2, Math.max(0.005, f));
}

/**
 * Evaluates the entire piping system hydraulics for a given pump discharge flow rate
 */
export function evaluateSystemAtFlow(
  pumpFlowGpm: number,
  fluid: FluidProperties,
  suction: SuctionConfig,
  segments: PipeSegment[],
  extractions: ExtractionPoint[],
  discharge: DischargeConfig
): FlowPointResult {
  const suctionElevationFt = calculateSuctionElevationFt(suction);
  const sg = fluid.sg > 0 ? fluid.sg : 1.0;
  const dynamicViscosityCp = Math.max(0.1, fluid.dynamicViscosityCp);

  let currentFlowGpm = pumpFlowGpm;
  let cumulativeFrictionFt = 0;
  let cumulativeMinorLossFt = 0;
  let cumulativeEquipmentLossFt = 0;
  let cumulativeHeadFromPumpFt = 0;

  const segmentResults: SegmentHydraulicResult[] = [];
  let governingCriticalSegmentName: string | undefined;
  let maxRequiredHeadFromPumpFt = 0;

  // Track previous diameter to identify diameter transitions
  let previousDiameterIn: number | null = null;

  // Process segments in order
  const sortedSegments = [...segments].sort((a, b) => a.order - b.order);

  sortedSegments.forEach((seg, idx) => {
    // 1. Flow in this segment (check if extractions happened before this segment)
    // Extractions specify `afterSegmentId`, meaning they take flow out after that segment.
    const internalDiaIn = getInternalDiameterInches(seg.nominalDiameter, seg.schedule, seg.customInternalDiameterInches);
    const internalDiaFt = internalDiaIn / 12;
    const internalDiaM = feetToMeters(internalDiaFt);
    const roughness = getMaterialRoughness(seg.materialId, seg.customRoughnessMm);
    const lengthFt = seg.straightLengthFt || 0;
    const lengthM = feetToMeters(lengthFt);

    // Cross-sectional area: A = pi * D^2 / 4
    const areaFt2 = (Math.PI / 4) * Math.pow(internalDiaFt, 2);
    // Flow in cfs: 1 cfs = 448.831 gpm
    const flowCfs = currentFlowGpm / 448.831;
    const velocityFps = areaFt2 > 0 ? flowCfs / areaFt2 : 0;
    const velocityMs = feetToMeters(velocityFps);

    // Velocity head: V^2 / 2g
    const velocityHeadFt = Math.pow(velocityFps, 2) / (2 * G_FT_S2);

    // Reynolds number:
    // Re = 3160 * Q(gpm) * SG / (D(in) * mu(cP))
    const reynolds = internalDiaIn > 0 && dynamicViscosityCp > 0
      ? (3160 * currentFlowGpm * sg) / (internalDiaIn * dynamicViscosityCp)
      : 0;

    let flowRegime: 'Laminar' | 'Transición' | 'Turbulento' = 'Turbulento';
    if (reynolds < 2300) flowRegime = 'Laminar';
    else if (reynolds <= 4000) flowRegime = 'Transición';

    // Relative roughness: eps / D
    const relRoughness = internalDiaFt > 0 ? roughness.ft / internalDiaFt : 0.0001;
    const f = calculateDarcyFrictionFactor(reynolds, relRoughness);

    // Major loss (fricción recta): hf = f * (L/D) * (V^2 / 2g)
    const frictionLossFt = internalDiaFt > 0 ? f * (lengthFt / internalDiaFt) * velocityHeadFt : 0;

    // Minor losses from fittings: sum(K) * (V^2 / 2g)
    let fittingsKSum = 0;
    (seg.fittings || []).forEach(fit => {
      fittingsKSum += (fit.kValue || 0) * (fit.quantity || 0);
    });

    // Auto-detect diameter change from previous segment (expansion / contraction)
    if (previousDiameterIn !== null && Math.abs(previousDiameterIn - internalDiaIn) > 0.05) {
      if (internalDiaIn > previousDiameterIn) {
        // Sudden or gradual enlargement
        // K_enlargement = (1 - (d1/d2)^2)^2 referenced to upstream velocity,
        // or approx K referenced to downstream: K = ((d2/d1)^2 - 1)^2
        const ratio = previousDiameterIn / internalDiaIn;
        const kExpansion = Math.pow(1 - Math.pow(ratio, 2), 2);
        fittingsKSum += kExpansion;
      } else {
        // Contraction: K_contraction approx 0.5 * (1 - (d2/d1)^2)
        const ratio = internalDiaIn / previousDiameterIn;
        const kContraction = 0.5 * (1 - Math.pow(ratio, 2));
        fittingsKSum += kContraction;
      }
    }
    previousDiameterIn = internalDiaIn;

    const minorLossFt = fittingsKSum * velocityHeadFt;

    // In-line equipment loss (e.g. filter, strainer)
    const eqPsi = seg.equipmentDeltaPPsi || 0;
    const equipmentLossFt = psiToHeadFeet(eqPsi, sg);

    const segTotalLossFt = frictionLossFt + minorLossFt + equipmentLossFt;

    cumulativeFrictionFt += frictionLossFt;
    cumulativeMinorLossFt += minorLossFt;
    cumulativeEquipmentLossFt += equipmentLossFt;

    // Elevation delta: end - start
    const deltaElevFt = (seg.endElevationValFt || 0) - (seg.startElevationValFt || 0);
    cumulativeHeadFromPumpFt += segTotalLossFt + deltaElevFt;

    // Check intermediate pressure requirement (if vessel or pressurized point)
    let isCriticalGovernor = false;
    let availablePsiAtPoint = 0;
    if (seg.intermediatePressureReqPsi && seg.intermediatePressureReqPsi > 0) {
      const intermediateStaticHeadFt = (seg.endElevationValFt || 0) - suctionElevationFt;
      const intermediateReqHeadFt = intermediateStaticHeadFt + cumulativeFrictionFt + cumulativeMinorLossFt + cumulativeEquipmentLossFt + psiToHeadFeet(seg.intermediatePressureReqPsi, sg);
      if (intermediateReqHeadFt > maxRequiredHeadFromPumpFt) {
        maxRequiredHeadFromPumpFt = intermediateReqHeadFt;
        governingCriticalSegmentName = `${seg.name} (P = ${seg.intermediatePressureReqPsi} psi)`;
        isCriticalGovernor = true;
      }
    }

    segmentResults.push({
      segmentId: seg.id,
      segmentName: seg.name,
      order: seg.order,
      flowGpm: currentFlowGpm,
      flowM3h: currentFlowGpm / 4.40287,
      flowTonsH: (currentFlowGpm / 4.40287) * sg,
      internalDiameterIn: internalDiaIn,
      internalDiameterM: internalDiaM,
      lengthFt,
      lengthM,
      velocityFps,
      velocityMs,
      velocityHeadFt,
      reynolds,
      flowRegime,
      darcyFrictionFactor: f,
      relativeRoughness: relRoughness,
      frictionLossFt,
      frictionLossM: feetToMeters(frictionLossFt),
      fittingsKSum,
      minorLossFt,
      minorLossM: feetToMeters(minorLossFt),
      equipmentLossFt,
      equipmentLossM: feetToMeters(equipmentLossFt),
      totalLossFt: segTotalLossFt,
      totalLossM: feetToMeters(segTotalLossFt),
      startElevFt: seg.startElevationValFt || 0,
      endElevFt: seg.endElevationValFt || 0,
      deltaElevFt,
      cumulativeHeadFt: cumulativeHeadFromPumpFt,
      availablePressurePsi: availablePsiAtPoint,
      requiredPressurePsi: seg.intermediatePressureReqPsi,
      isCriticalGovernor
    });

    // Check if extractions occur after this segment
    const extractionsAfterThis = extractions.filter(e => e.afterSegmentId === seg.id);
    extractionsAfterThis.forEach(ext => {
      let extractedGpm = 0;
      if (ext.flowUnit === 'percent') {
        extractedGpm = currentFlowGpm * (ext.flowValue / 100);
      } else {
        extractedGpm = flowToGpm(ext.flowValue, ext.flowUnit, sg);
      }
      currentFlowGpm = Math.max(0, currentFlowGpm - extractedGpm);
    });
  });

  // Final delivery elevation: end elevation of last segment (or suction elevation if no segments)
  const finalElevationFt = sortedSegments.length > 0
    ? (sortedSegments[sortedSegments.length - 1].endElevationValFt || 0)
    : suctionElevationFt;

  // Static head = Z_final - Z_suction
  const staticHeadFt = finalElevationFt - suctionElevationFt;

  // Terminal delivery pressure head:
  let deliveryPressurePsi = discharge.deliveryPressure || 0;
  if (discharge.pressureUnit === 'bar') deliveryPressurePsi = discharge.deliveryPressure / 0.0689476;
  if (discharge.pressureUnit === 'kpa') deliveryPressurePsi = discharge.deliveryPressure * 0.145038;
  const deliveryPressureHeadFt = psiToHeadFeet(deliveryPressurePsi, sg);

  // Additional overall equipment losses (strainers, meters, etc.)
  const additionalEquipmentLossFt = psiToHeadFeet(discharge.otherEquipmentLossPsi || 0, sg);
  const totalEquipmentLossFt = cumulativeEquipmentLossFt + additionalEquipmentLossFt;

  // Normal Total Dynamic Head:
  // TDH = Static Head + Friction Head + Minor Losses + Equipment Losses + Terminal Pressure Head
  const normalTdhFt = staticHeadFt + cumulativeFrictionFt + cumulativeMinorLossFt + totalEquipmentLossFt + deliveryPressureHeadFt;

  // Check if an intermediate critical point required more head
  let governingTdhFt = normalTdhFt;
  if (maxRequiredHeadFromPumpFt > normalTdhFt) {
    governingTdhFt = maxRequiredHeadFromPumpFt;
  }

  // Hydraulic Power (Water Horsepower):
  // WHP = Q(gpm) * H(ft) * SG / 3960
  const whpHydraulicPower = (pumpFlowGpm * governingTdhFt * sg) / 3960;

  // Sensitivity table for pump efficiencies 50% to 90%
  const efficiencies = [50, 55, 60, 65, 70, 75, 80, 85, 90];
  const bhpsensitivity = efficiencies.map(eff => {
    const bhp = whpHydraulicPower / (eff / 100);
    const kw = bhp * 0.7457;
    return { efficiency: eff, bhp, kw };
  });

  // Default nominal BHP at 70% efficiency
  const nominalBhp = whpHydraulicPower / 0.70;
  const nominalKw = nominalBhp * 0.7457;

  // Viscosity Correction Estimation ANSI/HI 9.6.7
  // Parameter B = 16.5 * (nu_cSt^0.5 * H_BEP^0.0625) / (Q_BEP^0.25 * N_rpm^0.25)
  // Assuming BEP near rated flow and speed 1750 rpm
  const kinematicViscosityCst = dynamicViscosityCp / sg;
  let cq = 1.0;
  let ch = 1.0;
  let ceta = 1.0;
  if (kinematicViscosityCst > 10 && pumpFlowGpm > 5 && governingTdhFt > 5) {
    const speedRpm = 1750;
    const bParam = 16.5 * (Math.pow(kinematicViscosityCst, 0.5) * Math.pow(governingTdhFt, 0.0625)) /
      (Math.pow(pumpFlowGpm, 0.25) * Math.pow(speedRpm, 0.25));

    if (bParam > 1.0) {
      // Approximate ANSI/HI correction factors
      cq = Math.max(0.60, Math.min(1.0, 1.0 - 0.08 * (bParam - 1)));
      ch = Math.max(0.65, Math.min(1.0, 1.0 - 0.06 * (bParam - 1)));
      ceta = Math.max(0.40, Math.min(1.0, 1.0 - 0.18 * (bParam - 1)));
    }
  }

  const correctedTdhFt = governingTdhFt / ch;
  const correctedBhp = (whpHydraulicPower / (0.70 * ceta));

  return {
    flowValue: pumpFlowGpm,
    flowUnit: 'gpm',
    flowGpm: pumpFlowGpm,
    flowM3h: pumpFlowGpm / 4.40287,
    flowTonsH: (pumpFlowGpm / 4.40287) * sg,
    staticHeadFt,
    staticHeadM: feetToMeters(staticHeadFt),
    frictionLossFt: cumulativeFrictionFt,
    frictionLossM: feetToMeters(cumulativeFrictionFt),
    minorLossFt: cumulativeMinorLossFt,
    minorLossM: feetToMeters(cumulativeMinorLossFt),
    deliveryPressureHeadFt,
    deliveryPressureHeadM: feetToMeters(deliveryPressureHeadFt),
    equipmentLossHeadFt: totalEquipmentLossFt,
    equipmentLossHeadM: feetToMeters(totalEquipmentLossFt),
    totalDynamicHeadFt: governingTdhFt,
    totalDynamicHeadM: feetToMeters(governingTdhFt),
    whpHydraulicPower,
    bhpsensitivity,
    nominalBhp,
    nominalKw,
    segmentResults,
    governingCriticalSegmentName,
    viscosityCorrection: {
      cq,
      ch,
      ceta,
      correctedTdhFt,
      correctedBhp
    }
  };
}
