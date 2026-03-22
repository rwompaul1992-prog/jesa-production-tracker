import dayjs from 'dayjs';
import { CipRecord, CipType, OperatorDailyEntry, ProductionRecord, Shift } from '@/app/lib/types';

export const operators = [
  'Mpima Abubakar',
  'Saadi Wakabi',
  'Robert Bakwatanisa',
  'Manano Vicent',
];

const shiftCycle: Shift[] = ['Morning', 'Afternoon', 'Night'];
const cipCycle: CipType[] = ['Caustic wash', 'Caustic and Acid wash'];
const monthStart = dayjs('2026-03-01');
const daysInDemoMonth = monthStart.daysInMonth();

function buildEntry(operatorName: string, operatorIndex: number, day: number): OperatorDailyEntry {
  const date = monthStart.date(day).format('YYYY-MM-DD');
  const offloadingShift = shiftCycle[(day + operatorIndex) % shiftCycle.length];
  const pasteurizationShift = shiftCycle[(day + operatorIndex + 1) % shiftCycle.length];
  const baseline = 11600 + operatorIndex * 320 + day * 92;
  const variation = ((day + 1) * (operatorIndex + 2) * 17) % 470;
  const milkOffloaded = baseline + variation;
  const lossBase = 120 + (day % 6) * 22 + operatorIndex * 18;
  const anomalyBoost = day === 11 && operatorIndex === 2 ? 210 : day === 18 && operatorIndex === 1 ? 180 : 0;
  const gainCase = day === 24 && operatorIndex === 3 ? -55 : 0;
  const milkPasteurized = milkOffloaded - lossBase - anomalyBoost - gainCase;
  const cipDone = day % 2 === 0 || day % 5 === operatorIndex % 5;
  const cipType = cipCycle[(day + operatorIndex) % cipCycle.length];
  const causticJerrycansUsed = cipDone ? 1 + ((day + operatorIndex) % 4) : 0;
  const nitricJerrycansUsed = !cipDone
    ? 0
    : cipType === 'Caustic and Acid wash'
      ? 1 + ((day + operatorIndex + 1) % 3)
      : 0;

  return {
    id: `${operatorName.toLowerCase().replace(/\s+/g, '-')}-${date}`,
    date,
    operatorName,
    offloadingShift,
    pasteurizationShift,
    milkOffloaded,
    milkPasteurized,
    cipDone,
    cipType,
    causticJerrycansUsed,
    nitricJerrycansUsed,
  };
}

export const demoOperatorEntries: OperatorDailyEntry[] = operators.flatMap((operatorName, operatorIndex) =>
  Array.from({ length: daysInDemoMonth }, (_, index) => buildEntry(operatorName, operatorIndex, index + 1)),
);

export const demoProductionData: ProductionRecord[] = demoOperatorEntries.map((entry) => ({
  id: `prod-${entry.id}`,
  date: entry.date,
  offloadingShift: entry.offloadingShift,
  pasteurizationShift: entry.pasteurizationShift,
  offloadingOperator: entry.operatorName,
  pasteurizationOperator: entry.operatorName,
  totalMilkOffloaded: entry.milkOffloaded,
  totalMilkPasteurized: entry.milkPasteurized,
  remarks:
    entry.milkPasteurized > entry.milkOffloaded
      ? 'Possible meter variance flagged for review.'
      : entry.milkOffloaded - entry.milkPasteurized > 300
        ? 'Higher-than-normal milk loss observed.'
        : entry.cipDone
          ? 'Routine production and CIP record completed.'
          : 'Production completed; no CIP logged for this date.',
}));

export const demoCipData: CipRecord[] = demoOperatorEntries
  .filter((entry) => entry.cipDone)
  .map((entry) => ({
    id: `cip-${entry.id}`,
    date: entry.date,
    operatorName: entry.operatorName,
    cipType: entry.cipType,
    chemicalUsed:
      entry.causticJerrycansUsed > 0 && entry.nitricJerrycansUsed > 0
        ? 'Both'
        : entry.nitricJerrycansUsed > 0
          ? 'Nitric Acid'
          : 'Caustic',
    causticJerrycansUsed: entry.causticJerrycansUsed,
    nitricAcidJerrycansUsed: entry.nitricJerrycansUsed,
  }));
