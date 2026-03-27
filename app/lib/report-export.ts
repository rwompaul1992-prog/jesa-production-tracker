<<<<<<< HEAD
import dayjs from 'dayjs';

export type ReportChartPoint = {
  date: string;
  offloaded: number;
  pasteurized: number;
  loss: number;
};

export type ChemicalPoint = {
  operator: string;
  caustic: number;
  nitric: number;
};

export type RankingPoint = {
  operator: string;
  score: number;
  lossRate: number;
  chemicalIntensity: number;
  completeness: number;
};

export type MonthlySummary = {
  totalOffloaded: number;
  totalPasteurized: number;
  totalLoss: number;
  lossPercentage: number;
};

export type ExportMonthlyReportInput = {
  selectedMonth: string;
  generatedAt: string;
  summary: MonthlySummary;
  chartData: ReportChartPoint[];
  chemicalByOperator: ChemicalPoint[];
  ranking: RankingPoint[];
  totalCipCycles: number;
  topOperator?: string;
  filters: {
    operators: string[];
    shifts: string[];
  };
};

function compactNumber(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${Math.round(value * 10) / 10}`;
}

function sanitizeMonth(month: string) {
  return month.replace(/[^\w-]+/g, '_');
}

const BRAND = {
  navy: '002D72',
  blue: '4A90E2',
  gold: 'FFC107',
  text: '0F172A',
  muted: '64748B',
  border: 'E2E8F0',
  white: 'FFFFFF',
};

function addSlideHeader(slide: any, title: string, subtitle?: string) {
  slide.background = { color: BRAND.white };
  slide.addShape(slide.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.5, fill: { color: BRAND.navy }, line: { color: BRAND.navy } });
  slide.addText(title, { x: 0.5, y: 0.62, w: 11.2, h: 0.4, fontSize: 22, bold: true, color: BRAND.text, fontFace: 'Inter' });
  if (subtitle) {
    slide.addText(subtitle, { x: 0.5, y: 1.05, w: 11.8, h: 0.3, fontSize: 11, color: BRAND.muted, fontFace: 'Inter' });
  }
}

function addKpiCard(slide: any, options: { x: number; y: number; title: string; value: string; tone?: string }) {
  const tone = options.tone ?? BRAND.navy;
  slide.addShape(slide.ShapeType.roundRect, {
    x: options.x,
    y: options.y,
    w: 2.95,
    h: 1.2,
    rectRadius: 0.04,
    fill: { color: 'FFFFFF' },
    line: { color: BRAND.border, pt: 1 },
    shadow: { type: 'outer', color: 'DDE5F0', angle: 45, blur: 2, distance: 1, opacity: 0.14 },
  });
  slide.addShape(slide.ShapeType.rect, { x: options.x, y: options.y, w: 0.08, h: 1.2, fill: { color: tone }, line: { color: tone } });
  slide.addText(options.title.toUpperCase(), { x: options.x + 0.16, y: options.y + 0.16, w: 2.7, h: 0.2, fontSize: 9, color: BRAND.muted, bold: true, fontFace: 'Inter', charSpace: 1.2 });
  slide.addText(options.value, { x: options.x + 0.16, y: options.y + 0.5, w: 2.7, h: 0.45, fontSize: 18, color: BRAND.text, bold: true, fontFace: 'Inter' });
}

function addChartCard(slide: any, options: { x: number; y: number; w: number; h: number; title: string; subtitle: string }) {
  slide.addShape(slide.ShapeType.roundRect, {
    x: options.x,
    y: options.y,
    w: options.w,
    h: options.h,
    rectRadius: 0.04,
    fill: { color: BRAND.white },
    line: { color: BRAND.border, pt: 1 },
  });
  slide.addText(options.title.toUpperCase(), {
    x: options.x + 0.2,
    y: options.y + 0.14,
    w: options.w - 0.4,
    h: 0.2,
    fontSize: 9,
    color: BRAND.text,
    bold: true,
    fontFace: 'Inter',
    charSpace: 1.2,
  });
  slide.addText(options.subtitle, {
    x: options.x + 0.2,
    y: options.y + 0.36,
    w: options.w - 0.4,
    h: 0.2,
    fontSize: 9,
    color: BRAND.muted,
    fontFace: 'Inter',
  });
}

export async function exportMonthlyReport(input: ExportMonthlyReportInput) {
  const { default: PptxGenJS } = await import('pptxgenjs');

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'JESA Production Tracker';
  pptx.company = 'JESA Farm Dairy';
  pptx.subject = `Monthly production report ${input.selectedMonth}`;
  pptx.title = `Jesa Production Report ${input.selectedMonth}`;

  const monthLabel = dayjs(`${input.selectedMonth}-01`).format('MMMM YYYY');

  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: BRAND.white };
  titleSlide.addShape(titleSlide.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 1.1, fill: { color: BRAND.navy }, line: { color: BRAND.navy } });
  titleSlide.addText('Jesa Production Report', {
    x: 0.7,
    y: 2.0,
    w: 8.8,
    h: 0.8,
    fontSize: 36,
    bold: true,
    color: BRAND.text,
    fontFace: 'Inter',
  });
  titleSlide.addText(`${monthLabel} • ${dayjs(input.generatedAt).format('DD MMM YYYY')}`, {
    x: 0.7,
    y: 2.9,
    w: 8.4,
    h: 0.4,
    fontSize: 16,
    color: BRAND.blue,
    fontFace: 'Inter',
  });
  titleSlide.addText('Generated from production tracking dashboard', {
    x: 0.7,
    y: 3.35,
    w: 6.4,
    h: 0.3,
    fontSize: 11,
    color: BRAND.muted,
    fontFace: 'Inter',
  });

  const execSlide = pptx.addSlide();
  addSlideHeader(execSlide, 'Executive Summary', `Performance highlights for ${monthLabel}`);
  addKpiCard(execSlide, { x: 0.5, y: 1.5, title: 'Total Offloaded', value: `${compactNumber(input.summary.totalOffloaded)} L`, tone: BRAND.navy });
  addKpiCard(execSlide, { x: 3.6, y: 1.5, title: 'Total Pasteurized', value: `${compactNumber(input.summary.totalPasteurized)} L`, tone: BRAND.blue });
  addKpiCard(execSlide, { x: 6.7, y: 1.5, title: 'Total Loss', value: `${compactNumber(input.summary.totalLoss)} L`, tone: BRAND.gold });
  addKpiCard(execSlide, { x: 9.8, y: 1.5, title: 'Loss Rate', value: `${input.summary.lossPercentage.toFixed(1)}%`, tone: BRAND.gold });
  addKpiCard(execSlide, { x: 0.5, y: 2.95, title: 'CIP Cycles', value: compactNumber(input.totalCipCycles), tone: BRAND.blue });
  addKpiCard(execSlide, { x: 3.6, y: 2.95, title: 'Top Operator', value: input.topOperator ?? 'N/A', tone: BRAND.navy });

  const throughputSlide = pptx.addSlide();
  addSlideHeader(throughputSlide, 'Throughput Trend', 'Daily offloaded vs pasteurized throughput across the selected month.');
  addChartCard(throughputSlide, { x: 0.5, y: 1.4, w: 12.3, h: 5.7, title: 'Throughput chart', subtitle: 'Offloaded and pasteurized volume trend' });
  throughputSlide.addChart((pptx as any).ChartType.line, [
    { name: 'Offloaded', labels: input.chartData.map((point) => point.date), values: input.chartData.map((point) => Number(point.offloaded.toFixed(1))) },
    { name: 'Pasteurized', labels: input.chartData.map((point) => point.date), values: input.chartData.map((point) => Number(point.pasteurized.toFixed(1))) },
  ], {
    x: 0.9,
    y: 1.9,
    w: 11.5,
    h: 4.85,
    lineSize: 2,
    showLegend: true,
    legendPos: 't',
    chartColors: [BRAND.navy, BRAND.blue],
    catAxisLabelSize: 10,
    valAxisLabelSize: 10,
    valAxisMinVal: 0,
  });

  const lossSlide = pptx.addSlide();
  addSlideHeader(lossSlide, 'Loss Surveillance', 'Milk loss pattern and risk concentration over the selected period.');
  addChartCard(lossSlide, { x: 0.5, y: 1.4, w: 12.3, h: 5.7, title: 'Loss chart', subtitle: 'Daily absolute milk loss (litres)' });
  lossSlide.addChart((pptx as any).ChartType.area, [
    { name: 'Loss', labels: input.chartData.map((point) => point.date), values: input.chartData.map((point) => Number(point.loss.toFixed(1))) },
  ], {
    x: 0.9,
    y: 1.9,
    w: 11.5,
    h: 4.85,
    showLegend: true,
    legendPos: 't',
    chartColors: [BRAND.gold],
    valAxisLabelSize: 10,
    catAxisLabelSize: 10,
    valAxisMinVal: 0,
  });

  const chemicalSlide = pptx.addSlide();
  addSlideHeader(chemicalSlide, 'Chemical Intensity', 'Caustic and nitric usage profile by operator for sanitation oversight.');
  addChartCard(chemicalSlide, { x: 0.5, y: 1.4, w: 12.3, h: 5.7, title: 'Chemical usage', subtitle: 'Operator-level caustic and nitric totals' });
  chemicalSlide.addChart((pptx as any).ChartType.bar, [
    { name: 'Caustic', labels: input.chemicalByOperator.map((point) => point.operator), values: input.chemicalByOperator.map((point) => Number(point.caustic.toFixed(1))) },
    { name: 'Nitric', labels: input.chemicalByOperator.map((point) => point.operator), values: input.chemicalByOperator.map((point) => Number(point.nitric.toFixed(1))) },
  ], {
    x: 0.9,
    y: 1.9,
    w: 11.5,
    h: 4.85,
    barDir: 'col',
    barGrouping: 'clustered',
    showLegend: true,
    legendPos: 't',
    chartColors: [BRAND.navy, BRAND.blue],
    valAxisLabelSize: 10,
    catAxisLabelSize: 10,
  });

  const performanceSlide = pptx.addSlide();
  addSlideHeader(performanceSlide, 'Operator Performance', 'Ranking based on score, loss discipline, chemical intensity, and data completeness.');
  performanceSlide.addShape(performanceSlide.ShapeType.roundRect, {
    x: 0.5,
    y: 1.35,
    w: 12.3,
    h: 5.9,
    rectRadius: 0.04,
    fill: { color: BRAND.white },
    line: { color: BRAND.border, pt: 1 },
  });

  const tableRows = [
    ['Rank', 'Operator', 'Score', 'Loss %', 'Chemical', 'Data %'],
    ...input.ranking.slice(0, 10).map((entry, index) => [
      `#${index + 1}`,
      entry.operator,
      entry.score.toFixed(1),
      `${entry.lossRate.toFixed(1)}%`,
      entry.chemicalIntensity.toFixed(1),
      `${entry.completeness.toFixed(0)}%`,
    ]),
  ];

  performanceSlide.addTable(tableRows as any, {
    x: 0.8,
    y: 1.75,
    w: 11.7,
    h: 5.1,
    border: { pt: 1, color: BRAND.border },
    fill: BRAND.white,
    color: BRAND.text,
    fontFace: 'Inter',
    fontSize: 10,
    valign: 'mid',
  });

  const notesSlide = pptx.addSlide();
  addSlideHeader(notesSlide, 'Report Notes', 'Context and filter metadata used for this export.');
  notesSlide.addShape(notesSlide.ShapeType.roundRect, {
    x: 0.5,
    y: 1.4,
    w: 12.3,
    h: 5.7,
    rectRadius: 0.04,
    fill: { color: BRAND.white },
    line: { color: BRAND.border, pt: 1 },
  });
  notesSlide.addText('Active filters', { x: 0.9, y: 1.75, w: 3, h: 0.3, fontSize: 12, bold: true, color: BRAND.text, fontFace: 'Inter' });
  notesSlide.addText(`Month: ${monthLabel}\nOperators: ${input.filters.operators.length ? input.filters.operators.join(', ') : 'All'}\nShifts: ${input.filters.shifts.length ? input.filters.shifts.join(', ') : 'All'}`, {
    x: 0.9,
    y: 2.1,
    w: 5.7,
    h: 1.3,
    fontSize: 11,
    color: BRAND.muted,
    breakLine: true,
    fontFace: 'Inter',
  });
  notesSlide.addText(`Generated: ${dayjs(input.generatedAt).format('DD MMM YYYY, HH:mm')}`, {
    x: 0.9,
    y: 3.65,
    w: 4.8,
    h: 0.3,
    fontSize: 11,
    color: BRAND.text,
    fontFace: 'Inter',
  });
  notesSlide.addText('Supervisor comments', { x: 7.1, y: 1.75, w: 3.4, h: 0.3, fontSize: 12, bold: true, color: BRAND.text, fontFace: 'Inter' });
  notesSlide.addShape(notesSlide.ShapeType.rect, {
    x: 7.1,
    y: 2.1,
    w: 5.2,
    h: 3.9,
    line: { color: BRAND.border, pt: 1 },
    fill: { color: 'FAFCFF' },
  });
  notesSlide.addText('Add management observations, risks, and action points here.', {
    x: 7.35,
    y: 2.35,
    w: 4.8,
    h: 0.5,
    fontSize: 10,
    color: BRAND.muted,
    fontFace: 'Inter',
  });

  const fileName = `Jesa_Production_Report_${sanitizeMonth(input.selectedMonth)}.pptx`;
  await pptx.writeFile({ fileName });
}
=======
import PptxGenJS from "pptxgenjs";

export async function exportMonthlyReport(data: any) {
  const pptx = new PptxGenJS();

  // Slide 1: Title
  const slide1 = pptx.addSlide();
  slide1.addText("Monthly Production Report", {
    x: 1,
    y: 1.5,
    fontSize: 28,
    bold: true,
  });

  // Slide 2: Summary
  const slide2 = pptx.addSlide();
  slide2.addText("Summary", { x: 0.5, y: 0.5, fontSize: 20, bold: true });

  slide2.addText(
    `Total Offloaded: ${data.totalOffloaded || 0} L\nLoss Rate: ${
      data.lossRate || 0
    }%`,
    { x: 0.5, y: 1.2, fontSize: 14 }
  );

  // Save file
  await pptx.writeFile({ fileName: "Monthly_Report.pptx" });
}
>>>>>>> 2d1b616 (Working dashboard, fixing ppt export issue)
