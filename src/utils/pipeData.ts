import { PipeSizeDef, PipeMaterial, FittingDef } from '../types';

export const STANDARD_PIPE_SIZES: PipeSizeDef[] = [
  { nominalInches: '0.5', nominalNumeric: 0.5, sch40IdInches: 0.622, sch40IdMm: 15.80, sch80IdInches: 0.546, sch80IdMm: 13.87, sch10IdInches: 0.710, sch10IdMm: 18.03 },
  { nominalInches: '0.75', nominalNumeric: 0.75, sch40IdInches: 0.824, sch40IdMm: 20.93, sch80IdInches: 0.742, sch80IdMm: 18.85, sch10IdInches: 0.884, sch10IdMm: 22.45 },
  { nominalInches: '1', nominalNumeric: 1.0, sch40IdInches: 1.049, sch40IdMm: 26.64, sch80IdInches: 0.957, sch80IdMm: 24.31, sch10IdInches: 1.097, sch10IdMm: 27.86 },
  { nominalInches: '1.25', nominalNumeric: 1.25, sch40IdInches: 1.380, sch40IdMm: 35.05, sch80IdInches: 1.278, sch80IdMm: 32.46, sch10IdInches: 1.442, sch10IdMm: 36.63 },
  { nominalInches: '1.5', nominalNumeric: 1.5, sch40IdInches: 1.610, sch40IdMm: 40.89, sch80IdInches: 1.500, sch80IdMm: 38.10, sch10IdInches: 1.682, sch10IdMm: 42.72 },
  { nominalInches: '2', nominalNumeric: 2.0, sch40IdInches: 2.067, sch40IdMm: 52.50, sch80IdInches: 1.939, sch80IdMm: 49.25, sch10IdInches: 2.157, sch10IdMm: 54.79 },
  { nominalInches: '2.5', nominalNumeric: 2.5, sch40IdInches: 2.469, sch40IdMm: 62.71, sch80IdInches: 2.323, sch80IdMm: 59.00, sch10IdInches: 2.635, sch10IdMm: 66.93 },
  { nominalInches: '3', nominalNumeric: 3.0, sch40IdInches: 3.068, sch40IdMm: 77.93, sch80IdInches: 2.900, sch80IdMm: 73.66, sch10IdInches: 3.260, sch10IdMm: 82.80 },
  { nominalInches: '4', nominalNumeric: 4.0, sch40IdInches: 4.026, sch40IdMm: 102.26, sch80IdInches: 3.826, sch80IdMm: 97.18, sch10IdInches: 4.260, sch10IdMm: 108.20 },
  { nominalInches: '5', nominalNumeric: 5.0, sch40IdInches: 5.047, sch40IdMm: 128.19, sch80IdInches: 4.813, sch80IdMm: 122.25, sch10IdInches: 5.295, sch10IdMm: 134.49 },
  { nominalInches: '6', nominalNumeric: 6.0, sch40IdInches: 6.065, sch40IdMm: 154.05, sch80IdInches: 5.761, sch80IdMm: 146.33, sch10IdInches: 6.357, sch10IdMm: 161.47 },
  { nominalInches: '8', nominalNumeric: 8.0, sch40IdInches: 7.981, sch40IdMm: 202.72, sch80IdInches: 7.625, sch80IdMm: 193.68, sch10IdInches: 8.329, sch10IdMm: 211.56 },
  { nominalInches: '10', nominalNumeric: 10.0, sch40IdInches: 10.020, sch40IdMm: 254.51, sch80IdInches: 9.562, sch80IdMm: 242.87, sch10IdInches: 10.420, sch10IdMm: 264.67 },
  { nominalInches: '12', nominalNumeric: 12.0, sch40IdInches: 11.938, sch40IdMm: 303.23, sch80IdInches: 11.374, sch80IdMm: 288.90, sch10IdInches: 12.390, sch10IdMm: 314.71 },
  { nominalInches: '14', nominalNumeric: 14.0, sch40IdInches: 13.125, sch40IdMm: 333.38, sch80IdInches: 12.500, sch80IdMm: 317.50, sch10IdInches: 13.624, sch10IdMm: 346.05 },
  { nominalInches: '16', nominalNumeric: 16.0, sch40IdInches: 15.000, sch40IdMm: 381.00, sch80IdInches: 14.312, sch80IdMm: 363.52, sch10IdInches: 15.624, sch10IdMm: 396.85 }
];

export const STANDARD_MATERIALS: PipeMaterial[] = [
  {
    id: 'carbon_steel_comm',
    name: 'Acero al carbono comercial (nuevo)',
    roughnessMm: 0.045,
    roughnessFt: 0.00015,
    description: 'Tubería de acero comercial estándar soldada o sin costura (Crane TP-410).'
  },
  {
    id: 'carbon_steel_used',
    name: 'Acero al carbono (en servicio / moderadamente corroído)',
    roughnessMm: 0.15,
    roughnessFt: 0.0005,
    description: 'Tubería tras varios años de servicio con incrustaciones ligeras.'
  },
  {
    id: 'stainless_steel',
    name: 'Acero inoxidable (304 / 316)',
    roughnessMm: 0.015,
    roughnessFt: 0.00005,
    description: 'Tubería sanitaria o industrial lisa de acero inoxidable.'
  },
  {
    id: 'pvc_cpvc',
    name: 'PVC / CPVC',
    roughnessMm: 0.0015,
    roughnessFt: 0.000005,
    description: 'Tubería plástica extruida hidráulicamente lisa.'
  },
  {
    id: 'hdpe',
    name: 'Polietileno de Alta Densidad (HDPE)',
    roughnessMm: 0.007,
    roughnessFt: 0.000023,
    description: 'Tubería plástica flexible termo-fusionada.'
  },
  {
    id: 'ductile_iron',
    name: 'Hierro fundido / Dúctil revestido',
    roughnessMm: 0.12,
    roughnessFt: 0.0004,
    description: 'Hierro dúctil con revestimiento de mortero o epóxico.'
  },
  {
    id: 'custom',
    name: 'Rugosidad personalizada (Usuario)',
    roughnessMm: 0.045,
    roughnessFt: 0.00015,
    description: 'Ingrese el valor medido o de catálogo específico del material.'
  }
];

export const TYPICAL_FITTINGS: FittingDef[] = [
  {
    id: 'elbow_90_std',
    name: 'Codo 90° estándar (brida/soldado)',
    category: 'elbow',
    kValue: 0.3,
    description: 'Codo estándar de radio corto (r/D = 1.0). Valor recomendado en Crane TP 410.',
    sourceRef: 'Crane TP-410: K = 30·fT ≈ 0.3'
  },
  {
    id: 'elbow_90_lr',
    name: 'Codo 90° radio largo (r/D = 1.5)',
    category: 'elbow',
    kValue: 0.2,
    description: 'Codo con curvatura suave de radio 1.5D, genera menor desprendimiento de capa límite.',
    sourceRef: 'Crane TP-410: K = 20·fT ≈ 0.2'
  },
  {
    id: 'elbow_90_thrd',
    name: 'Codo 90° roscado estándar',
    category: 'elbow',
    kValue: 0.75,
    description: 'Accesorios roscados generan mayor turbulencia interior en los filetes.',
    sourceRef: 'Hydraulic Institute Engineering Data Book'
  },
  {
    id: 'elbow_45_std',
    name: 'Codo 45° estándar',
    category: 'elbow',
    kValue: 0.2,
    description: 'Desviación angular suave de 45°.',
    sourceRef: 'Crane TP-410: K = 16·fT ≈ 0.2'
  },
  {
    id: 'valve_gate_open',
    name: 'Válvula de compuerta (100% abierta)',
    category: 'valve',
    kValue: 0.15,
    description: 'Paso directo completo sin obstrucción angular en posición totalmente abierta.',
    sourceRef: 'Crane TP-410: K = 8·fT ≈ 0.15'
  },
  {
    id: 'valve_butterfly',
    name: 'Válvula de mariposa (abierta)',
    category: 'valve',
    kValue: 0.4,
    description: 'El disco central permanece sumergido en el flujo, provocando una caída local.',
    sourceRef: 'Crane TP-410: K = 45·fT ≈ 0.4'
  },
  {
    id: 'valve_ball_fp',
    name: 'Válvula de bola paso completo',
    category: 'valve',
    kValue: 0.05,
    description: 'Orificio cilíndrico idéntico al diámetro interior de la tubería.',
    sourceRef: 'Crane TP-410: K = 3·fT ≈ 0.05'
  },
  {
    id: 'valve_check_swing',
    name: 'Válvula de retención (check) tipo columpio',
    category: 'valve',
    kValue: 2.0,
    description: 'Válvula antirretorno oscilante pesada, requiere energía cinética para mantener el disco alzado.',
    sourceRef: 'Crane TP-410: K = 100·fT ≈ 2.0'
  },
  {
    id: 'valve_check_lift',
    name: 'Válvula check tipo pistón / resorte',
    category: 'valve',
    kValue: 1.2,
    description: 'Mecanismo guiado con muelle, común en sistemas de alta presión.',
    sourceRef: 'Hydraulic Institute'
  },
  {
    id: 'valve_globe_open',
    name: 'Válvula de globo (100% abierta)',
    category: 'valve',
    kValue: 6.0,
    description: 'El flujo sufre un doble giro en S a través del asiento, muy restrictiva.',
    sourceRef: 'Crane TP-410: K = 340·fT ≈ 6.0'
  },
  {
    id: 'tee_through',
    name: 'Tee paso directo (flujo en línea recta)',
    category: 'tee',
    kValue: 0.2,
    description: 'El flujo continúa derecho a través del cuerpo de la tee con perturbación leve.',
    sourceRef: 'Crane TP-410: K = 20·fT ≈ 0.2'
  },
  {
    id: 'tee_branch',
    name: 'Tee a 90° (flujo por el ramal derivado)',
    category: 'tee',
    kValue: 1.0,
    description: 'El fluido gira en ángulo recto hacia la derivación, provocando choque y recirculación.',
    sourceRef: 'Crane TP-410: K = 60·fT ≈ 1.0'
  },
  {
    id: 'entrance_sharp',
    name: 'Entrada de tanque a tubería (borde vivo)',
    category: 'entrance_exit',
    kValue: 0.5,
    description: 'Boquilla al ras sin redondeo; se forma vena contracta en la entrada.',
    sourceRef: 'Weisbach / Crane TP-410'
  },
  {
    id: 'entrance_bell',
    name: 'Entrada de tanque abocardada / redondeada',
    category: 'entrance_exit',
    kValue: 0.05,
    description: 'Boca acampanada con r/D > 0.15 que suprime casi toda la vena contracta.',
    sourceRef: 'Crane TP-410: r/D >= 0.15'
  },
  {
    id: 'entrance_reentrant',
    name: 'Entrada de tubería saliente (Borda reentrante)',
    category: 'entrance_exit',
    kValue: 0.8,
    description: 'Tubería que penetra dentro del tanque sin brida al ras.',
    sourceRef: 'Crane TP-410'
  },
  {
    id: 'exit_discharge',
    name: 'Salida de tubería / Descarga a tanque abierto',
    category: 'entrance_exit',
    kValue: 1.0,
    description: 'Pérdida de la totalidad de la energía cinética (V²/2g) al entrar al volumen en reposo.',
    sourceRef: 'Teorema de Bernoulli / Crane'
  },
  {
    id: 'strainer_basket',
    name: 'Filtro canasta / colador en Y limpio',
    category: 'other',
    kValue: 1.5,
    description: 'Pérdida localizada debida a la malla coladora (sin saturar).',
    sourceRef: 'Typical industrial strainer'
  }
];

export function getInternalDiameterInches(nominal: string, schedule: string, customId?: number): number {
  if (schedule === 'custom' && customId && customId > 0) {
    return customId;
  }
  const found = STANDARD_PIPE_SIZES.find(p => p.nominalInches === nominal);
  if (!found) return parseFloat(nominal) || 3.068;
  
  if (schedule === 'sch80') return found.sch80IdInches;
  if (schedule === 'sch10' && found.sch10IdInches) return found.sch10IdInches;
  return found.sch40IdInches;
}

export function getInternalDiameterMm(nominal: string, schedule: string, customId?: number): number {
  const inches = getInternalDiameterInches(nominal, schedule, customId);
  return inches * 25.4;
}

export function getMaterialRoughness(materialId: string, customMm?: number): { mm: number; ft: number } {
  if (materialId === 'custom' && customMm !== undefined && customMm > 0) {
    return {
      mm: customMm,
      ft: customMm / 304.8
    };
  }
  const mat = STANDARD_MATERIALS.find(m => m.id === materialId) || STANDARD_MATERIALS[0];
  return {
    mm: mat.roughnessMm,
    ft: mat.roughnessFt
  };
}
