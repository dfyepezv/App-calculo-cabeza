import { FlowUnit, LengthUnit, PressureUnit } from '../types';

/**
 * Parses length/elevation inputs supporting:
 * - Decimal numbers: "21.96875", "10.5", "15"
 * - Feet-inches-fraction: "21'-11 5/8\"", "21' 11 5/8\"", "21-11-5/8", "12' 4\"", "0' 8 3/8\""
 * - Pure inches fraction: "7 3/8\"", "11 5/8"
 * - Explicit meter notation: "6.5 m", "12m"
 * Returns value in feet.
 */
export function parseLengthToFeet(input: string | number): { feet: number; isValid: boolean; parsedStr: string } {
  if (typeof input === 'number') {
    return { feet: input, isValid: !isNaN(input), parsedStr: `${input.toFixed(2)} ft` };
  }
  if (!input || !input.trim()) {
    return { feet: 0, isValid: true, parsedStr: '0.00 ft' };
  }

  const str = input.trim();

  // Check if explicitly in meters e.g. "6.5m" or "6.5 m"
  const meterMatch = str.match(/^([+-]?\d+(?:\.\d+)?)\s*(?:m|mts|metros)$/i);
  if (meterMatch) {
    const valMeters = parseFloat(meterMatch[1]);
    const feet = valMeters / 0.3048;
    return { feet, isValid: true, parsedStr: `${feet.toFixed(3)} ft (${valMeters.toFixed(3)} m)` };
  }

  // Pure decimal number
  if (/^[+-]?\d+(?:\.\d+)?$/.test(str)) {
    const val = parseFloat(str);
    return { feet: val, isValid: true, parsedStr: `${val.toFixed(2)} ft` };
  }

  // Feet and inches pattern:
  // e.g. 21'-11 5/8", 21' 11 5/8", 21' 11-5/8", 21' 6", 21', 11 5/8"
  try {
    let sign = 1;
    let cleanStr = str;
    if (cleanStr.startsWith('-')) {
      sign = -1;
      cleanStr = cleanStr.substring(1).trim();
    } else if (cleanStr.startsWith('+')) {
      cleanStr = cleanStr.substring(1).trim();
    }

    let totalInches = 0;
    let hasMatch = false;

    // Check for feet marker (')
    if (cleanStr.includes("'") || cleanStr.toLowerCase().includes('ft')) {
      const feetPartMatch = cleanStr.match(/^(\d+(?:\.\d+)?)\s*(?:'|ft)/i);
      if (feetPartMatch) {
        const feetPart = parseFloat(feetPartMatch[1]);
        totalInches += feetPart * 12;
        hasMatch = true;
        // Remaining string after feet
        cleanStr = cleanStr.substring(feetPartMatch[0].length).replace(/^[-,\s]+/, '').trim();
      }
    }

    // Now parse inches and fractions from remaining string, e.g. "11 5/8\"", "11-5/8", "5/8\"", "11"
    if (cleanStr) {
      // Remove trailing quotes or "in"
      const inchClean = cleanStr.replace(/["”]|(?:in|inch|inches)/gi, '').trim();

      // Case: whole number + fraction: "11 5/8" or "11-5/8"
      const wholeFractionMatch = inchClean.match(/^(\d+)\s*(?:[- ]\s*)(\d+)\/(\d+)$/);
      if (wholeFractionMatch) {
        const whole = parseFloat(wholeFractionMatch[1]);
        const num = parseFloat(wholeFractionMatch[2]);
        const den = parseFloat(wholeFractionMatch[3]);
        if (den !== 0) {
          totalInches += whole + num / den;
          hasMatch = true;
        }
      } else {
        // Case: just fraction: "5/8"
        const fracMatch = inchClean.match(/^(\d+)\/(\d+)$/);
        if (fracMatch) {
          const num = parseFloat(fracMatch[1]);
          const den = parseFloat(fracMatch[2]);
          if (den !== 0) {
            totalInches += num / den;
            hasMatch = true;
          }
        } else {
          // Case: just decimal or integer inches
          const numMatch = inchClean.match(/^(\d+(?:\.\d+)?)$/);
          if (numMatch) {
            totalInches += parseFloat(numMatch[1]);
            hasMatch = true;
          }
        }
      }
    }

    if (hasMatch) {
      const totalFeet = sign * (totalInches / 12);
      return {
        feet: totalFeet,
        isValid: true,
        parsedStr: formatFeetToEngineering(totalFeet)
      };
    }
  } catch {
    // fallback
  }

  // Fallback direct parse
  const fallback = parseFloat(str);
  if (!isNaN(fallback)) {
    return { feet: fallback, isValid: true, parsedStr: `${fallback.toFixed(2)} ft` };
  }

  return { feet: 0, isValid: false, parsedStr: 'Inválido' };
}

/**
 * Formats feet to engineering notation: e.g. 21'-11 5/8"
 */
export function formatFeetToEngineering(feet: number): string {
  if (isNaN(feet)) return '0\'-0"';
  const sign = feet < 0 ? '-' : '';
  const absFeet = Math.abs(feet);

  const wholeFeet = Math.floor(absFeet);
  const remInches = (absFeet - wholeFeet) * 12;
  const wholeInches = Math.floor(remInches);
  const fracPart = remInches - wholeInches;

  // Round to nearest 1/16th or 1/8th
  const sixteenths = Math.round(fracPart * 16);

  let fracStr = '';
  let finalInches = wholeInches;
  let finalFeet = wholeFeet;

  if (sixteenths === 16) {
    finalInches += 1;
  } else if (sixteenths > 0) {
    // Simplify fraction
    let num = sixteenths;
    let den = 16;
    while (num % 2 === 0 && den % 2 === 0) {
      num /= 2;
      den /= 2;
    }
    fracStr = ` ${num}/${den}`;
  }

  if (finalInches >= 12) {
    finalFeet += Math.floor(finalInches / 12);
    finalInches = finalInches % 12;
  }

  return `${sign}${finalFeet}'-${finalInches}${fracStr}"`;
}

export function feetToMeters(feet: number): number {
  return feet * 0.3048;
}

export function metersToFeet(meters: number): number {
  return meters / 0.3048;
}

export function psiToHeadFeet(psi: number, sg: number): number {
  if (sg <= 0) return 0;
  // h(ft) = P(psi) * 2.306658 / SG (commonly rounded to 2.31/SG)
  return (psi * 2.30666) / sg;
}

export function headFeetToPsi(headFt: number, sg: number): number {
  return (headFt * sg) / 2.30666;
}

export function psiToBar(psi: number): number {
  return psi * 0.0689476;
}

export function barToPsi(bar: number): number {
  return bar / 0.0689476;
}

export function kpaToPsi(kpa: number): number {
  return kpa * 0.145038;
}

export function psiToKpa(psi: number): number {
  return psi / 0.145038;
}

export function pressureToPsi(val: number, unit: PressureUnit): number {
  if (unit === 'psig') return val;
  if (unit === 'bar') return barToPsi(val);
  if (unit === 'kpa') return kpaToPsi(val);
  return val;
}

export function psiToSelectedPressure(psi: number, unit: PressureUnit): number {
  if (unit === 'psig') return psi;
  if (unit === 'bar') return psiToBar(psi);
  if (unit === 'kpa') return psiToKpa(psi);
  return psi;
}

/**
 * Flow rate unit conversions:
 * Basis: GPM (US gallons per minute)
 * 1 US gallon = 3.785411784 L
 * 1 m³/h = 4.4028675 GPM
 * 1 L/s = 15.850323 GPM
 * 1 metric ton/h of fluid with specific gravity SG:
 *   Volume m³/h = (ton/h) / SG
 *   Flow in GPM = ((ton/h) / SG) * 4.4028675
 */
export function flowToGpm(val: number, unit: FlowUnit, sg: number): number {
  if (val <= 0) return 0;
  const safeSg = sg > 0 ? sg : 1.0;
  switch (unit) {
    case 'gpm':
      return val;
    case 'm3h':
      return val * 4.40287;
    case 'ls':
      return val * 15.8503;
    case 'tons_h':
      // 1 ton = 1000 kg. Volume (m³) = 1000 kg / (SG * 1000 kg/m³) = 1 / SG m³
      // m³/h = (ton/h) / SG
      return (val / safeSg) * 4.40287;
    default:
      return val;
  }
}

export function gpmToFlow(gpm: number, targetUnit: FlowUnit, sg: number): number {
  if (gpm <= 0) return 0;
  const safeSg = sg > 0 ? sg : 1.0;
  switch (targetUnit) {
    case 'gpm':
      return gpm;
    case 'm3h':
      return gpm / 4.40287;
    case 'ls':
      return gpm / 15.8503;
    case 'tons_h':
      // ton/h = (m³/h) * SG = (gpm / 4.40287) * SG
      return (gpm / 4.40287) * safeSg;
    case 'percent':
      return 100;
    default:
      return gpm;
  }
}

export function formatFlow(gpm: number, unit: FlowUnit, sg: number, decimals = 1): string {
  const val = gpmToFlow(gpm, unit, sg);
  const labels: Record<FlowUnit, string> = {
    gpm: 'gpm',
    m3h: 'm³/h',
    tons_h: 'ton/h',
    ls: 'L/s',
    percent: '%'
  };
  return `${val.toFixed(decimals)} ${labels[unit]}`;
}
