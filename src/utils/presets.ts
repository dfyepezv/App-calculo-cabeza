import { DischargeConfig, ExtractionPoint, FluidProperties, PipeSegment, SuctionConfig } from '../types';

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  fluid: FluidProperties;
  suction: SuctionConfig;
  discharge: DischargeConfig;
  segments: PipeSegment[];
  extractions: ExtractionPoint[];
  nominalFlowGpm: number;
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'sugar_cane_syrup',
    name: 'Meladura de Caña (Planta Azucarera - Caso Real)',
    description: 'Bomba de meladura a 65°Bx desde tanque de almacenamiento con fondo cónico, descarga a filtros dúplex, paso por tanque de reacción presurizado (12 psi) y entrega final a cabezal de evaporación a 22 psig.',
    fluid: {
      name: 'Meladura de caña de azúcar (65 °Brix)',
      sg: 1.32,
      densityKgM3: 1320,
      dynamicViscosityCp: 120,
      kinematicViscosityCst: 90.9,
      temperatureC: 60,
      temperatureF: 140,
      brix: 65,
      notes: 'Meladura clarificada caliente proveniente del sistema de clarificación.'
    },
    suction: {
      type: 'tank_cone',
      fixedElevationStr: "10'-0\"",
      fixedElevationFt: 10,
      coneTank: {
        baseDatumElevationFt: 8.5,
        coneHeightFt: 6.0,
        cylinderHeightFt: 18.0,
        diameterFt: 12.0,
        liquidLevelPercent: 30 // Nivel bajo conservador para cálculo de máximo TDH
      },
      horizTank: {
        invertElevationFt: 4.0,
        diameterFt: 8.0,
        lengthFt: 20.0,
        liquidLevelPercent: 50
      }
    },
    discharge: {
      deliveryPressure: 22,
      pressureUnit: 'psig',
      otherEquipmentLossPsi: 2.0 // Pérdida en medidor de flujo magnético y toberas
    },
    extractions: [
      {
        id: 'ext_1',
        afterSegmentId: 'seg_3',
        name: 'Recirculación a tanque / toma de refractómetro',
        flowValue: 15,
        flowUnit: 'gpm'
      }
    ],
    nominalFlowGpm: 120, // Aprox 36 ton/h
    segments: [
      {
        id: 'seg_1',
        name: 'Línea de Succión (Tanque a Boquilla Bomba)',
        order: 1,
        startElevationStr: "8'-6\"",
        endElevationStr: "3'-6\"",
        startElevationValFt: 8.5,
        endElevationValFt: 3.5,
        type: 'vertical_down',
        nominalDiameter: '4',
        schedule: 'sch40',
        straightLengthStr: "16'-0\"",
        straightLengthFt: 16.0,
        materialId: 'carbon_steel_comm',
        fittings: [
          { id: 'f1', fittingId: 'entrance_sharp', name: 'Entrada boquilla de tanque', quantity: 1, kValue: 0.5 },
          { id: 'f2', fittingId: 'valve_butterfly', name: 'Válvula de mariposa de corte', quantity: 1, kValue: 0.4 },
          { id: 'f3', fittingId: 'elbow_90_lr', name: 'Codo 90° radio largo', quantity: 1, kValue: 0.2 }
        ],
        equipmentName: '',
        equipmentDeltaPPsi: 0
      },
      {
        id: 'seg_2',
        name: 'Descarga Bomba a Filtros Dúplex',
        order: 2,
        startElevationStr: "3'-6\"",
        endElevationStr: "18'-6\"",
        startElevationValFt: 3.5,
        endElevationValFt: 18.5,
        type: 'vertical_up',
        nominalDiameter: '3',
        schedule: 'sch40',
        straightLengthStr: "28'-0\"",
        straightLengthFt: 28.0,
        materialId: 'carbon_steel_comm',
        fittings: [
          { id: 'f4', fittingId: 'valve_check_swing', name: 'Válvula check oscilante', quantity: 1, kValue: 2.0 },
          { id: 'f5', fittingId: 'valve_gate_open', name: 'Válvula compuerta', quantity: 1, kValue: 0.15 },
          { id: 'f6', fittingId: 'elbow_90_std', name: 'Codo 90° estándar', quantity: 2, kValue: 0.3 }
        ],
        equipmentName: 'Filtros dúplex de canasta para meladura (malla 40)',
        equipmentDeltaPPsi: 5.5
      },
      {
        id: 'seg_3',
        name: 'Filtros a Tanque de Reacción Presurizado',
        order: 3,
        startElevationStr: "18'-6\"",
        endElevationStr: "34'-0\"",
        startElevationValFt: 18.5,
        endElevationValFt: 34.0,
        type: 'vertical_up',
        nominalDiameter: '3',
        schedule: 'sch40',
        straightLengthStr: "52'-0\"",
        straightLengthFt: 52.0,
        materialId: 'carbon_steel_comm',
        fittings: [
          { id: 'f7', fittingId: 'elbow_90_std', name: 'Codo 90° estándar', quantity: 3, kValue: 0.3 },
          { id: 'f8', fittingId: 'valve_butterfly', name: 'Válvula mariposa control', quantity: 1, kValue: 0.4 },
          { id: 'f9', fittingId: 'tee_branch', name: 'Tee ramal hacia tanque reacción', quantity: 1, kValue: 1.0 }
        ],
        equipmentName: '',
        equipmentDeltaPPsi: 0,
        intermediatePressureReqPsi: 12.0 // Tanque de reacción presurizado
      },
      {
        id: 'seg_4',
        name: 'Cabezal de Distribución a Evaporadores',
        order: 4,
        startElevationStr: "34'-0\"",
        endElevationStr: "52'-11 5/8\"",
        startElevationValFt: 34.0,
        endElevationValFt: 52.96875,
        type: 'diagonal',
        nominalDiameter: '3',
        schedule: 'sch40',
        straightLengthStr: "94'-6\"",
        straightLengthFt: 94.5,
        materialId: 'carbon_steel_comm',
        fittings: [
          { id: 'f10', fittingId: 'elbow_90_std', name: 'Codo 90° estándar', quantity: 4, kValue: 0.3 },
          { id: 'f11', fittingId: 'elbow_45_std', name: 'Codo 45° estándar', quantity: 2, kValue: 0.2 },
          { id: 'f12', fittingId: 'valve_gate_open', name: 'Válvula compuerta seccionamiento', quantity: 1, kValue: 0.15 },
          { id: 'f13', fittingId: 'exit_discharge', name: 'Descarga a cabezal de distribución', quantity: 1, kValue: 1.0 }
        ],
        equipmentName: '',
        equipmentDeltaPPsi: 0
      }
    ]
  },
  {
    id: 'clean_water',
    name: 'Agua Limpia a 20°C (Referencia Estándar)',
    description: 'Sistema clásico de bombeo de agua para calibración y verificación contra tablas tradicionales del Hydraulic Institute.',
    fluid: {
      name: 'Agua limpia potable',
      sg: 1.0,
      densityKgM3: 1000,
      dynamicViscosityCp: 1.0,
      kinematicViscosityCst: 1.0,
      temperatureC: 20,
      temperatureF: 68,
      notes: 'Viscosidad estándar de referencia 1 cP.'
    },
    suction: {
      type: 'fixed_elevation',
      fixedElevationStr: "0'-0\"",
      fixedElevationFt: 0,
      coneTank: {
        baseDatumElevationFt: 0,
        coneHeightFt: 4,
        cylinderHeightFt: 10,
        diameterFt: 8,
        liquidLevelPercent: 50
      },
      horizTank: {
        invertElevationFt: 0,
        diameterFt: 6,
        lengthFt: 15,
        liquidLevelPercent: 50
      }
    },
    discharge: {
      deliveryPressure: 35,
      pressureUnit: 'psig',
      otherEquipmentLossPsi: 1.5
    },
    extractions: [],
    nominalFlowGpm: 150,
    segments: [
      {
        id: 'w_seg_1',
        name: 'Succión desde cisterna',
        order: 1,
        startElevationStr: "-4'-0\"",
        endElevationStr: "0'-0\"",
        startElevationValFt: -4,
        endElevationValFt: 0,
        type: 'vertical_up',
        nominalDiameter: '4',
        schedule: 'sch40',
        straightLengthStr: "18'-0\"",
        straightLengthFt: 18,
        materialId: 'pvc_cpvc',
        fittings: [
          { id: 'wf1', fittingId: 'entrance_bell', name: 'Entrada acampanada', quantity: 1, kValue: 0.05 },
          { id: 'wf2', fittingId: 'valve_check_swing', name: 'Válvula de pie / check', quantity: 1, kValue: 2.0 },
          { id: 'wf3', fittingId: 'elbow_90_lr', name: 'Codo 90°', quantity: 1, kValue: 0.2 }
        ]
      },
      {
        id: 'w_seg_2',
        name: 'Descarga a tanque elevado',
        order: 2,
        startElevationStr: "0'-0\"",
        endElevationStr: "45'-0\"",
        startElevationValFt: 0,
        endElevationValFt: 45,
        type: 'vertical_up',
        nominalDiameter: '3',
        schedule: 'sch40',
        straightLengthStr: "85'-0\"",
        straightLengthFt: 85,
        materialId: 'pvc_cpvc',
        fittings: [
          { id: 'wf4', fittingId: 'valve_check_swing', name: 'Válvula check', quantity: 1, kValue: 2.0 },
          { id: 'wf5', fittingId: 'valve_gate_open', name: 'Válvula compuerta', quantity: 1, kValue: 0.15 },
          { id: 'wf6', fittingId: 'elbow_90_std', name: 'Codo 90°', quantity: 3, kValue: 0.3 },
          { id: 'wf7', fittingId: 'exit_discharge', name: 'Descarga libre a tanque', quantity: 1, kValue: 1.0 }
        ]
      }
    ]
  },
  {
    id: 'glucose_viscous',
    name: 'Jarabe de Glucosa (Alta Viscosidad 850 cP)',
    description: 'Fluido altamente viscoso que opera típicamente en régimen laminar o de transición, provocando altas pérdidas friccionales por cota.',
    fluid: {
      name: 'Jarabe de Glucosa 84% sólidos',
      sg: 1.43,
      densityKgM3: 1430,
      dynamicViscosityCp: 850,
      kinematicViscosityCst: 594.4,
      temperatureC: 45,
      temperatureF: 113,
      notes: 'Viscosidad elevada, requiere tuberías amplias para mantener velocidades bajo 3 ft/s.'
    },
    suction: {
      type: 'fixed_elevation',
      fixedElevationStr: "12'-0\"",
      fixedElevationFt: 12,
      coneTank: {
        baseDatumElevationFt: 10,
        coneHeightFt: 5,
        cylinderHeightFt: 12,
        diameterFt: 10,
        liquidLevelPercent: 40
      },
      horizTank: {
        invertElevationFt: 5,
        diameterFt: 8,
        lengthFt: 18,
        liquidLevelPercent: 50
      }
    },
    discharge: {
      deliveryPressure: 15,
      pressureUnit: 'psig',
      otherEquipmentLossPsi: 3.0
    },
    extractions: [],
    nominalFlowGpm: 80,
    segments: [
      {
        id: 'g_seg_1',
        name: 'Línea de succión corta',
        order: 1,
        startElevationStr: "12'-0\"",
        endElevationStr: "3'-0\"",
        startElevationValFt: 12,
        endElevationValFt: 3,
        type: 'vertical_down',
        nominalDiameter: '6',
        schedule: 'sch40',
        straightLengthStr: "14'-0\"",
        straightLengthFt: 14,
        materialId: 'stainless_steel',
        fittings: [
          { id: 'gf1', fittingId: 'entrance_bell', name: 'Entrada acampanada', quantity: 1, kValue: 0.05 },
          { id: 'gf2', fittingId: 'valve_butterfly', name: 'Válvula mariposa sanitaria', quantity: 1, kValue: 0.4 }
        ]
      },
      {
        id: 'g_seg_2',
        name: 'Línea de bombeo a reactor',
        order: 2,
        startElevationStr: "3'-0\"",
        endElevationStr: "28'-0\"",
        startElevationValFt: 3,
        endElevationValFt: 28,
        type: 'vertical_up',
        nominalDiameter: '4',
        schedule: 'sch40',
        straightLengthStr: "65'-0\"",
        straightLengthFt: 65,
        materialId: 'stainless_steel',
        fittings: [
          { id: 'gf3', fittingId: 'valve_check_swing', name: 'Válvula check', quantity: 1, kValue: 2.0 },
          { id: 'gf4', fittingId: 'elbow_90_lr', name: 'Codo 90° radio largo', quantity: 4, kValue: 0.2 },
          { id: 'gf5', fittingId: 'valve_butterfly', name: 'Válvula mariposa', quantity: 1, kValue: 0.4 },
          { id: 'gf6', fittingId: 'exit_discharge', name: 'Descarga reactor', quantity: 1, kValue: 1.0 }
        ]
      }
    ]
  }
];
