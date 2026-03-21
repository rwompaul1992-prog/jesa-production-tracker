import dayjs from 'dayjs';
import { CipRecord, ProductionRecord } from '@/app/lib/types';

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
    offloaded: record.totalMilkOffloaded,
    pasteurized: record.totalMilkPasteurized,
    loss: getMilkLoss(record),
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
        relatedProduction.length === 0
          ? relatedCip.length
          : relatedCip.reduce(
              (sum, record) => sum + record.causticJerrycansUsed + record.nitricAcidJerrycansUsed,
              0,
            ) / relatedProduction.length;
      const completeness = Math.min(
        ((relatedProduction.length + relatedCip.length) / 4) * 100,
        100,
      );
      const consistency = Math.max(100 - lossRate * 12 - chemicalIntensity * 4, 35);
      const score = 100 - lossRate * 16 - chemicalIntensity * 5 + completeness * 0.08 + consistency * 0.12;

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
      b.causticJerrycansUsed + b.nitricAcidJerrycansUsed - (a.causticJerrycansUsed + a.nitricAcidJerrycansUsed),
  )[0];
  const missingEntries = Math.max(31 - production.length, 0);

  return {
    highMilkLoss: highestLossDay
      ? `${highestLossDay.date}: ${getMilkLoss(highestLossDay).toLocaleString()}L loss observed.`
      : 'No production entries yet.',
    highChemicalUsage: highestChemicalDay
      ? `${highestChemicalDay.operatorName} used ${highestChemicalDay.causticJerrycansUsed + highestChemicalDay.nitricAcidJerrycansUsed} jerrycans on ${highestChemicalDay.date}.`
      : 'No CIP entries yet.',
    missingEntries: `${missingEntries} daily production entries still missing for a full month view.`,
    bestOperator: ranking[0]?.operator ?? 'N/A',
    worstOperator: ranking[ranking.length - 1]?.operator ?? 'N/A',
  };
}
