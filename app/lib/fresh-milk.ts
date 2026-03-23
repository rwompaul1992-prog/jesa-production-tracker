import dayjs from 'dayjs';
import { FreshMilkDailyRecord, FreshMilkDowntimeReason, FreshMilkMachine } from '@/app/lib/types';

export function getFreshMilkPouchesPerHour(record: FreshMilkDailyRecord) {
  if (record.runningHours <= 0) return 0;
  return record.totalPouchesProduced / record.runningHours;
}

export function getFreshMilkDefectRate(record: FreshMilkDailyRecord) {
  if (record.totalPouchesProduced <= 0) return 0;
  return (record.rejectedPouches / record.totalPouchesProduced) * 100;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeHigherBetter(value: number, min: number, max: number) {
  if (max <= min) return 100;
  return ((value - min) / (max - min)) * 100;
}

function normalizeLowerBetter(value: number, min: number, max: number) {
  if (max <= min) return 100;
  return ((max - value) / (max - min)) * 100;
}

export function buildFreshMilkSummary(records: FreshMilkDailyRecord[]) {
  const totalPouches = records.reduce((sum, record) => sum + record.totalPouchesProduced, 0);
  const totalDowntime = records.reduce((sum, record) => sum + record.downtimeMinutes, 0);
  const totalRejected = records.reduce((sum, record) => sum + record.rejectedPouches, 0);
  const totalStoppages = records.reduce((sum, record) => sum + record.stoppageCount, 0);
  const averagePouchesPerHour = average(records.map(getFreshMilkPouchesPerHour));
  const averageDefectRate = average(records.map(getFreshMilkDefectRate));
  const averageStartupTime = average(records.map((record) => record.startupTimeMinutes));

  return {
    totalEntries: records.length,
    totalPouches,
    totalDowntime,
    totalRejected,
    totalStoppages,
    averagePouchesPerHour,
    averageDefectRate,
    averageStartupTime,
  };
}

export function buildFreshMilkRanking(records: FreshMilkDailyRecord[]) {
  const grouped = new Map<string, FreshMilkDailyRecord[]>();
  records.forEach((record) => {
    const current = grouped.get(record.operatorName) ?? [];
    current.push(record);
    grouped.set(record.operatorName, current);
  });

  const raw = Array.from(grouped.entries()).map(([operatorName, entries]) => ({
    operatorName,
    entriesSubmitted: entries.length,
    totalPouches: entries.reduce((sum, record) => sum + record.totalPouchesProduced, 0),
    averagePouchesPerHour: average(entries.map(getFreshMilkPouchesPerHour)),
    totalDowntime: entries.reduce((sum, record) => sum + record.downtimeMinutes, 0),
    averageDefectRate: average(entries.map(getFreshMilkDefectRate)),
    averageStartupTime: average(entries.map((record) => record.startupTimeMinutes)),
    averageBadStartupPouches: average(entries.map((record) => record.badPouchesBeforeStableProduction)),
  }));

  const rates = raw.map((entry) => entry.averagePouchesPerHour);
  const downtimes = raw.map((entry) => entry.totalDowntime);
  const defectRates = raw.map((entry) => entry.averageDefectRate);
  const startupPenalty = raw.map((entry) => entry.averageStartupTime + entry.averageBadStartupPouches * 0.35);

  return raw
    .map((entry) => {
      const productionScore = normalizeHigherBetter(entry.averagePouchesPerHour, Math.min(...rates), Math.max(...rates));
      const downtimeScore = normalizeLowerBetter(entry.totalDowntime, Math.min(...downtimes), Math.max(...downtimes));
      const defectScore = normalizeLowerBetter(entry.averageDefectRate, Math.min(...defectRates), Math.max(...defectRates));
      const startupScore = normalizeLowerBetter(entry.averageStartupTime + entry.averageBadStartupPouches * 0.35, Math.min(...startupPenalty), Math.max(...startupPenalty));
      const performanceScore = productionScore * 0.35 + downtimeScore * 0.25 + defectScore * 0.25 + startupScore * 0.15;

      return {
        ...entry,
        performanceScore,
      };
    })
    .sort((left, right) => right.performanceScore - left.performanceScore)
    .map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));
}

export function buildFreshMilkDailyTrend(records: FreshMilkDailyRecord[]) {
  const grouped = new Map<string, FreshMilkDailyRecord[]>();
  records.forEach((record) => {
    const current = grouped.get(record.date) ?? [];
    current.push(record);
    grouped.set(record.date, current);
  });

  return Array.from(grouped.entries())
    .sort(([left], [right]) => dayjs(left).valueOf() - dayjs(right).valueOf())
    .map(([date, entries]) => ({
      date: dayjs(date).format('DD MMM'),
      totalPouches: entries.reduce((sum, record) => sum + record.totalPouchesProduced, 0),
      averageRate: average(entries.map(getFreshMilkPouchesPerHour)),
      totalDowntime: entries.reduce((sum, record) => sum + record.downtimeMinutes, 0),
    }));
}

export function buildFreshMilkMachineComparison(records: FreshMilkDailyRecord[]) {
  const grouped = new Map<FreshMilkMachine, FreshMilkDailyRecord[]>();
  records.forEach((record) => {
    const current = grouped.get(record.machineNumber) ?? [];
    current.push(record);
    grouped.set(record.machineNumber, current);
  });

  return Array.from(grouped.entries()).map(([machineNumber, entries]) => ({
    machineNumber,
    totalPouches: entries.reduce((sum, record) => sum + record.totalPouchesProduced, 0),
    averageRate: average(entries.map(getFreshMilkPouchesPerHour)),
    totalDowntime: entries.reduce((sum, record) => sum + record.downtimeMinutes, 0),
    averageDefectRate: average(entries.map(getFreshMilkDefectRate)),
    averageStartupTime: average(entries.map((record) => record.startupTimeMinutes)),
  }));
}

export function buildFreshMilkDowntimeReasonBreakdown(records: FreshMilkDailyRecord[]) {
  const grouped = new Map<string, Record<FreshMilkDowntimeReason, number>>();
  records.forEach((record) => {
    const current = grouped.get(record.operatorName) ?? {
      'Film misalignment': 0,
      'Black mark / sensor failure': 0,
      'Seal failure': 0,
      'Power interruption': 0,
      'Product supply interruption': 0,
      'Mechanical issue': 0,
      'Changeover / setup': 0,
      Cleaning: 0,
      Other: 0,
    };
    current[record.downtimeReason] += 1;
    grouped.set(record.operatorName, current);
  });

  return Array.from(grouped.entries()).map(([operatorName, reasons]) => ({ operatorName, ...reasons }));
}
