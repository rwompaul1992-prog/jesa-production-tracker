import dayjs from 'dayjs';
import {
  CipRecord,
  CipType,
  FreshMilkDailyRecord,
  FreshMilkDowntimeReason,
  FreshMilkMachine,
  FreshMilkShift,
  OperatorDailyEntry,
  ProductionRecord,
  Shift,
} from '@/app/lib/types';

export const operators = [
  'Mpima Abubakar',
  'Saadi Wakabi',
  'Robert Bakwatanisa',
  'Manano Vicent',
];

export const freshMilkOperators = [
  'Kabogoza Eric',
  'Njagala Robert',
  'Semujju David',
  'Asiimwe Richard',
  'Eruchu James',
  'Telly Vicent',
  'Sentongo Kassim',
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

const freshMilkShifts: FreshMilkShift[] = ['Day', 'Night'];
const freshMilkMachines: FreshMilkMachine[] = ['Machine 1', 'Machine 2', 'Machine 3', 'Machine 4'];
const freshMilkReasons: FreshMilkDowntimeReason[] = [
  'Film misalignment',
  'Black mark / sensor failure',
  'Seal failure',
  'Power interruption',
  'Product supply interruption',
  'Mechanical issue',
  'Changeover / setup',
  'Cleaning',
  'Other',
];
const freshMilkProducts = ['Fresh Milk'];
const packSizes = ['500 mL', '1 L'];

function buildFreshMilkRecord(operatorName: string, operatorIndex: number, day: number, machineIndex: number): FreshMilkDailyRecord {
  const date = monthStart.date(day).format('YYYY-MM-DD');
  const shift = freshMilkShifts[(day + operatorIndex + machineIndex) % freshMilkShifts.length];
  const machineNumber = freshMilkMachines[machineIndex];
  const packSize = packSizes[(day + operatorIndex + machineIndex) % packSizes.length];
  const runningHours = Number((6.6 + ((day + machineIndex) % 5) * 0.32 + operatorIndex * 0.08).toFixed(1));
  const totalPouchesProduced = Math.round(6200 + operatorIndex * 210 + machineIndex * 260 + day * 41 + ((day + 3) * (machineIndex + 2) * 13) % 360);
  const downtimeMinutes = 18 + ((day + operatorIndex + machineIndex) % 6) * 11 + (machineIndex === 2 && day % 7 === 0 ? 20 : 0);
  const stoppageCount = 1 + ((day + operatorIndex + machineIndex) % 5);
  const rejectedPouches = Math.max(24, Math.round(totalPouchesProduced * (0.008 + ((operatorIndex + machineIndex + day) % 4) * 0.0025)));
  const startupTimeMinutes = 9 + ((day + operatorIndex + machineIndex) % 5) * 3 + (machineIndex === 1 && day % 9 === 0 ? 6 : 0);
  const badPouchesBeforeStableProduction = 18 + ((day + operatorIndex + machineIndex) % 6) * 5;
  const downtimeReason = freshMilkReasons[(day + operatorIndex + machineIndex) % freshMilkReasons.length];

  return {
    id: `fresh-milk-${operatorName.toLowerCase().replace(/\s+/g, '-')}-${date}-${machineNumber.toLowerCase().replace(/\s+/g, '-')}`,
    date,
    shift,
    operatorName,
    machineNumber,
    productPacked: freshMilkProducts[0],
    packSize,
    totalPouchesProduced,
    runningHours,
    downtimeMinutes,
    stoppageCount,
    rejectedPouches,
    startupTimeMinutes,
    badPouchesBeforeStableProduction,
    downtimeReason,
    comment: day % 8 === 0 ? 'Supervisor should review stoppage pattern.' : '',
    createdAt: `${date}T${shift === 'Day' ? '07:15:00' : '19:15:00'}Z`,
  };
}

export const demoFreshMilkRecords: FreshMilkDailyRecord[] = freshMilkOperators.flatMap((operatorName, operatorIndex) =>
  Array.from({ length: 10 }, (_, index) => buildFreshMilkRecord(operatorName, operatorIndex, index + 1, index % freshMilkMachines.length)),
);
