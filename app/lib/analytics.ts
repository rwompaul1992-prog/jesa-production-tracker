import dayjs from 'dayjs';
import {
  CipRecord,
  OperatorDailyEntry,
  OperatorPerformanceAnomaly,
  OperatorPerformanceBadge,
  OperatorPerformanceEntry,
  OperatorPerformanceSummary,
  ProductionRecord,
} from '@/app/lib/types';

export const getMilkLoss = (record: ProductionRecord) =>
  Math.max(record.totalMilkOffloaded - record.totalMilkPasteurized, 0);

export const getLossPercentage = (record: ProductionRecord) =>
  record.totalMilkOffloaded === 0 ? 0 : (getMilkLoss(record) / record.totalMilkOffloaded) * 100;

export function buildMonthlySummary(production: ProductionRecord[], cip: CipRecord[]) {
  const totalOffloaded = production.reduce((sum, record) => sum + record.totalMilkOffloaded, 0);
  const totalPasteurized = production.reduce((sum, record) => sum + record.totalMilkPasteurized, 0);
  const totalLoss = production.reduce((sum, record) => sum + getMilkLoss(record), 0);
  const lossPercentage = totalOffloaded === 0 ? 0 : (totalLoss / totalOffloaded) * 100;
  const totalCaustic = cip.reduce((sum, record) => sum + record.causticJerrycansUsed, 0);
  const totalNitric = cip.reduce((sum, record) => sum + record.nitricAcidJerrycansUsed, 0);

  return {
    totalOffloaded,
    totalPasteurized,
    totalLoss,
    lossPercentage,
    totalCaustic,
    totalNitric,
  };
}

export function buildChartData(production: ProductionRecord[]) {
  return production.map((record) => ({
    date: dayjs(record.date).format('DD MMM'),
    isoDate: record.date,
    offloaded: record.totalMilkOffloaded,
    pasteurized: record.totalMilkPasteurized,
    loss: getMilkLoss(record),
    lossPercentage: getLossPercentage(record),
  }));
}

export function buildChemicalUsageByOperator(cip: CipRecord[]) {
  const byOperator = new Map<string, { operator: string; caustic: number; nitric: number }>();

  cip.forEach((record) => {
    const current = byOperator.get(record.operatorName) ?? {
      operator: record.operatorName,
      caustic: 0,
      nitric: 0,
    };
    current.caustic += record.causticJerrycansUsed;
    current.nitric += record.nitricAcidJerrycansUsed;
    byOperator.set(record.operatorName, current);
  });

  return Array.from(byOperator.values());
}

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function standardDeviation(values: number[]) {
  if (values.length <= 1) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function hasMeaningfulEntry(entry: OperatorDailyEntry) {
  return (
    entry.milkOffloaded > 0 ||
    entry.milkPasteurized > 0 ||
    entry.cipDone ||
    entry.causticJerrycansUsed > 0 ||
    entry.nitricJerrycansUsed > 0
  );
}

function buildOperatorAnomalies(entry: OperatorDailyEntry, previousLossRate?: number) {
  const anomalies: OperatorPerformanceAnomaly[] = [];
  const milkLoss = entry.milkOffloaded - entry.milkPasteurized;
  const positiveLoss = Math.max(milkLoss, 0);
  const lossPercentage =
    entry.milkOffloaded === 0 ? 0 : (positiveLoss / entry.milkOffloaded) * 100;
  const combinedChemical = entry.causticJerrycansUsed + entry.nitricJerrycansUsed;
  const chemicalPer1000 =
    entry.milkOffloaded === 0 ? combinedChemical * 1000 : (combinedChemical / entry.milkOffloaded) * 1000;

  if (!hasMeaningfulEntry(entry)) {
    anomalies.push({
      date: entry.date,
      severity: 'medium',
      type: 'missing_entry',
      message: 'No production or CIP values entered for this day.',
    });
  }

  if (lossPercentage >= 2.8) {
    anomalies.push({
      date: entry.date,
      severity: lossPercentage >= 3.4 ? 'high' : 'medium',
      type: 'high_loss',
      message: `${round(lossPercentage)}% milk loss recorded.`,
    });
  }

  if (milkLoss < 0) {
    anomalies.push({
      date: entry.date,
      severity: 'medium',
      type: 'gain',
      message: 'Pasteurized volume exceeded offloaded volume. Review for gain or metering variance.',
    });
  }

  if (chemicalPer1000 > 0.34) {
    anomalies.push({
      date: entry.date,
      severity: chemicalPer1000 > 0.42 ? 'high' : 'medium',
      type: 'high_chemical',
      message: `${round(chemicalPer1000, 3)} jerrycans per 1000L used.`,
    });
  }

  if (previousLossRate !== undefined && lossPercentage - previousLossRate > 1.1) {
    anomalies.push({
      date: entry.date,
      severity: 'medium',
      type: 'spike',
      message: 'Loss rate spiked materially above the previous logged day.',
    });
  }

  return anomalies;
}

export function buildOperatorPerformance(entries: OperatorDailyEntry[], monthKey: string): OperatorPerformanceSummary {
  const monthEntries = entries.filter((entry) => entry.date.startsWith(monthKey));
  const operatorNames = Array.from(new Set(monthEntries.map((entry) => entry.operatorName))).sort();
  const daysInMonth = dayjs(`${monthKey}-01`).daysInMonth();

  const baseEntries = operatorNames.map((operator) => {
    const operatorEntries = monthEntries
      .filter((entry) => entry.operatorName === operator)
      .sort((a, b) => a.date.localeCompare(b.date));
    const filledEntries = operatorEntries.filter((entry) => hasMeaningfulEntry(entry));
    const totalMilkHandled = operatorEntries.reduce((sum, entry) => sum + entry.milkOffloaded, 0);
    const totalMilkLoss = operatorEntries.reduce(
      (sum, entry) => sum + Math.max(entry.milkOffloaded - entry.milkPasteurized, 0),
      0,
    );
    const averageLossPercentage =
      totalMilkHandled === 0 ? 0 : (totalMilkLoss / totalMilkHandled) * 100;
    const totalCaustic = operatorEntries.reduce((sum, entry) => sum + entry.causticJerrycansUsed, 0);
    const totalNitric = operatorEntries.reduce((sum, entry) => sum + entry.nitricJerrycansUsed, 0);
    const causticPer1000Litres =
      totalMilkHandled === 0 ? 0 : (totalCaustic / totalMilkHandled) * 1000;
    const nitricPer1000Litres =
      totalMilkHandled === 0 ? 0 : (totalNitric / totalMilkHandled) * 1000;
    const dataCompleteness = daysInMonth === 0 ? 0 : (filledEntries.length / daysInMonth) * 100;
    const lossRates = operatorEntries
      .filter((entry) => entry.milkOffloaded > 0)
      .map((entry) =>
        ((Math.max(entry.milkOffloaded - entry.milkPasteurized, 0) / entry.milkOffloaded) * 100),
      );
    const consistencyVariation = standardDeviation(lossRates);
    const consistency = clamp(100 - consistencyVariation * 26);
    const lossPerformanceScore = clamp(100 - averageLossPercentage * 28);
    const chemicalRate = causticPer1000Litres + nitricPer1000Litres * 1.15;
    const chemicalEfficiencyScore = clamp(100 - chemicalRate * 170);
    const firstHalf = operatorEntries.filter((entry) => dayjs(entry.date).date() <= Math.ceil(daysInMonth / 2));
    const secondHalf = operatorEntries.filter((entry) => dayjs(entry.date).date() > Math.ceil(daysInMonth / 2));
    const firstHalfLossRate =
      firstHalf.reduce((sum, entry) => sum + Math.max(entry.milkOffloaded - entry.milkPasteurized, 0), 0) /
      Math.max(firstHalf.reduce((sum, entry) => sum + entry.milkOffloaded, 0), 1) *
      100;
    const secondHalfLossRate =
      secondHalf.reduce((sum, entry) => sum + Math.max(entry.milkOffloaded - entry.milkPasteurized, 0), 0) /
      Math.max(secondHalf.reduce((sum, entry) => sum + entry.milkOffloaded, 0), 1) *
      100;
    const trendDelta = round(firstHalfLossRate - secondHalfLossRate, 2);

    const trend = operatorEntries.map((entry) => {
      const milkLoss = Math.max(entry.milkOffloaded - entry.milkPasteurized, 0);
      return {
        date: dayjs(entry.date).format('DD MMM'),
        lossPercentage:
          entry.milkOffloaded === 0 ? 0 : round((milkLoss / entry.milkOffloaded) * 100),
        causticPer1000L:
          entry.milkOffloaded === 0 ? 0 : round((entry.causticJerrycansUsed / entry.milkOffloaded) * 1000, 3),
        nitricPer1000L:
          entry.milkOffloaded === 0 ? 0 : round((entry.nitricJerrycansUsed / entry.milkOffloaded) * 1000, 3),
        milkHandled: entry.milkOffloaded,
        milkLoss,
      };
    });

    const anomalies = operatorEntries.flatMap((entry, index) =>
      buildOperatorAnomalies(
        entry,
        index > 0 ? trend[index - 1]?.lossPercentage : undefined,
      ),
    );

    const score = clamp(
      lossPerformanceScore * 0.4 +
        chemicalEfficiencyScore * 0.25 +
        dataCompleteness * 0.2 +
        consistency * 0.15,
    );

    return {
      operator,
      rank: 0,
      score: round(score, 1),
      badge: 'steady' as OperatorPerformanceBadge,
      positionLabel: '',
      totalMilkHandled: round(totalMilkHandled, 0),
      totalMilkLoss: round(totalMilkLoss, 0),
      averageLossPercentage: round(averageLossPercentage),
      causticPer1000Litres: round(causticPer1000Litres, 3),
      nitricPer1000Litres: round(nitricPer1000Litres, 3),
      chemicalEfficiencyScore: round(chemicalEfficiencyScore),
      dataCompleteness: round(dataCompleteness),
      consistency: round(consistency),
      lossPerformanceScore: round(lossPerformanceScore),
      trendDelta,
      filledDays: filledEntries.length,
      missingDays: Math.max(daysInMonth - filledEntries.length, 0),
      anomalies,
      trend,
    } satisfies OperatorPerformanceEntry;
  });

  const ranked = baseEntries
    .sort((a, b) => b.score - a.score)
    .map((entry, index, list) => {
      const badge: OperatorPerformanceBadge =
        index === 0
          ? 'best'
          : index === list.length - 1
            ? 'worst'
            : entry.anomalies.some((anomaly) => anomaly.severity === 'high') || entry.averageLossPercentage > 2.7
              ? 'risky'
              : entry.trendDelta > 0.18
                ? 'improving'
                : 'steady';

      return {
        ...entry,
        rank: index + 1,
        badge,
        positionLabel: `${index + 1} of ${list.length}`,
      };
    });

  return {
    operators: ranked,
    bestOperator: ranked[0]?.operator,
    worstOperator: ranked[ranked.length - 1]?.operator,
    riskyOperators: ranked.filter((entry) => entry.badge === 'risky').map((entry) => entry.operator),
    improvingOperators: ranked.filter((entry) => entry.badge === 'improving').map((entry) => entry.operator),
  };
}

export function buildOperatorRanking(production: ProductionRecord[], cip: CipRecord[]) {
  const operators = Array.from(
    new Set([
      ...production.flatMap((record) => [record.offloadingOperator, record.pasteurizationOperator]),
      ...cip.map((record) => record.operatorName),
    ]),
  );

  return operators
    .map((operator) => {
      const relatedProduction = production.filter(
        (record) =>
          record.offloadingOperator === operator || record.pasteurizationOperator === operator,
      );
      const relatedCip = cip.filter((record) => record.operatorName === operator);
      const totalLoss = relatedProduction.reduce((sum, record) => sum + getMilkLoss(record), 0);
      const totalOffloaded = relatedProduction.reduce(
        (sum, record) => sum + record.totalMilkOffloaded,
        0,
      );
      const lossRate = totalOffloaded === 0 ? 0 : (totalLoss / totalOffloaded) * 100;
      const chemicalIntensity =
        totalOffloaded === 0
          ? 0
          : (relatedCip.reduce(
              (sum, record) => sum + record.causticJerrycansUsed + record.nitricAcidJerrycansUsed,
              0,
            ) /
              totalOffloaded) *
            1000;
      const completeness = Math.min(
        ((relatedProduction.length + relatedCip.length) / 31) * 100,
        100,
      );
      const consistency = clamp(100 - lossRate * 10 - chemicalIntensity * 18, 25, 100);
      const score = clamp(
        100 - lossRate * 18 - chemicalIntensity * 42 + completeness * 0.18 + consistency * 0.12,
      );

      return {
        operator,
        lossRate,
        chemicalIntensity,
        completeness,
        consistency,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function buildInsights(production: ProductionRecord[], cip: CipRecord[]) {
  const ranking = buildOperatorRanking(production, cip);
  const highestLossDay = [...production].sort((a, b) => getMilkLoss(b) - getMilkLoss(a))[0];
  const highestChemicalDay = [...cip].sort(
    (a, b) =>
      b.causticJerrycansUsed +
      b.nitricAcidJerrycansUsed -
      (a.causticJerrycansUsed + a.nitricAcidJerrycansUsed),
  )[0];
  const missingEntries = Math.max(31 - production.length, 0);

  return {
    highMilkLoss: highestLossDay
      ? `${highestLossDay.date}: ${getMilkLoss(highestLossDay).toLocaleString()}L loss observed.`
      : 'No production entries yet.',
    highChemicalUsage: highestChemicalDay
      ? `${highestChemicalDay.operatorName} used ${
          highestChemicalDay.causticJerrycansUsed + highestChemicalDay.nitricAcidJerrycansUsed
        } jerrycans on ${highestChemicalDay.date}.`
      : 'No CIP entries yet.',
    missingEntries: `${missingEntries} daily production entries still missing for a full month view.`,
    bestOperator: ranking[0]?.operator ?? 'N/A',
    worstOperator: ranking[ranking.length - 1]?.operator ?? 'N/A',
  };
}
