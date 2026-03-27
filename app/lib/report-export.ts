import html2canvas from "html2canvas";

declare global {
  interface Window {
    PptxGenJS: any;
  }
}

type ChartRow = {
  date: string;
  offloaded: number;
  pasteurized: number;
};

type MonthlyReportData = {
  month: string;
  totalOffloaded: number;
  totalPasteurized: number;
  lossRate: number;
  topOperator?: string;
  chartData: ChartRow[];
  chartElementId?: string;
};

function safeNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function exportMonthlyReport(data: MonthlyReportData) {
  const PptxGenJS = window.PptxGenJS;

  if (!PptxGenJS) {
    throw new Error("PptxGenJS browser bundle not loaded");
  }

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Paul Rwomwijhu";
  pptx.subject = "Monthly Production Report";
  pptx.title = `Monthly Production Report - ${data.month}`;
  pptx.company = "Jesa";
  pptx.lang = "en-UG";

  const totalOffloaded = safeNumber(data.totalOffloaded);
  const totalPasteurized = safeNumber(data.totalPasteurized);
  const lossRate = safeNumber(data.lossRate);
  const topOperator = data.topOperator || "N/A";
  const rows = Array.isArray(data.chartData) ? data.chartData : [];

  // Slide 1: Title
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: "F8FAFC" };
  titleSlide.addText("Monthly Production Report", {
    x: 0.7,
    y: 1.0,
    w: 11.0,
    h: 0.7,
    fontSize: 24,
    bold: true,
    color: "0F172A",
    align: "center",
  });
  titleSlide.addText(`${data.month}`, {
    x: 0.7,
    y: 1.9,
    w: 11.0,
    h: 0.4,
    fontSize: 14,
    color: "475569",
    align: "center",
  });

  // Slide 2: Summary
  const summarySlide = pptx.addSlide();
  summarySlide.background = { color: "FFFFFF" };
  summarySlide.addText("Summary", {
    x: 0.6,
    y: 0.5,
    w: 3,
    h: 0.4,
    fontSize: 20,
    bold: true,
    color: "0F172A",
  });

  summarySlide.addText(
    [
      { text: "Month: ", options: { bold: true } },
      { text: String(data.month) },
      { text: "\nTotal Offloaded: ", options: { bold: true } },
      { text: `${totalOffloaded.toLocaleString()} L` },
      { text: "\nTotal Pasteurized: ", options: { bold: true } },
      { text: `${totalPasteurized.toLocaleString()} L` },
      { text: "\nLoss Rate: ", options: { bold: true } },
      { text: `${lossRate.toFixed(2)}%` },
      { text: "\nTop Operator: ", options: { bold: true } },
      { text: topOperator },
    ],
    {
      x: 0.8,
      y: 1.3,
      w: 5.2,
      h: 2.6,
      fontSize: 16,
      color: "1E293B",
      breakLine: false,
      margin: 0.05,
    }
  );

  // simple KPI boxes
  summarySlide.addShape(pptx.ShapeType.rect, {
    x: 6.4,
    y: 1.2,
    w: 2.0,
    h: 1.0,
    fill: { color: "DBEAFE" },
    line: { color: "93C5FD" },
    radius: 0.08,
  });
  summarySlide.addText("Offloaded", {
    x: 6.65,
    y: 1.38,
    w: 1.5,
    h: 0.2,
    fontSize: 11,
    color: "1D4ED8",
    bold: true,
    align: "center",
  });
  summarySlide.addText(totalOffloaded.toLocaleString(), {
    x: 6.5,
    y: 1.65,
    w: 1.8,
    h: 0.25,
    fontSize: 16,
    color: "0F172A",
    bold: true,
    align: "center",
  });

  summarySlide.addShape(pptx.ShapeType.rect, {
    x: 8.7,
    y: 1.2,
    w: 2.0,
    h: 1.0,
    fill: { color: "DCFCE7" },
    line: { color: "86EFAC" },
    radius: 0.08,
  });
  summarySlide.addText("Pasteurized", {
    x: 8.95,
    y: 1.38,
    w: 1.5,
    h: 0.2,
    fontSize: 11,
    color: "15803D",
    bold: true,
    align: "center",
  });
  summarySlide.addText(totalPasteurized.toLocaleString(), {
    x: 8.8,
    y: 1.65,
    w: 1.8,
    h: 0.25,
    fontSize: 16,
    color: "0F172A",
    bold: true,
    align: "center",
  });

  // Slide 3: Daily data table
  if (rows.length > 0) {
    const tableSlide = pptx.addSlide();
    tableSlide.background = { color: "FFFFFF" };
    tableSlide.addText("Daily Production Data", {
      x: 0.6,
      y: 0.45,
      w: 4.0,
      h: 0.4,
      fontSize: 20,
      bold: true,
      color: "0F172A",
    });

    const tableRows = [
      [
        { text: "Date", options: { bold: true, color: "FFFFFF" } },
        { text: "Offloaded (L)", options: { bold: true, color: "FFFFFF" } },
        { text: "Pasteurized (L)", options: { bold: true, color: "FFFFFF" } },
        { text: "Variance (L)", options: { bold: true, color: "FFFFFF" } },
      ],
      ...rows.map((row) => {
        const offloaded = safeNumber(row.offloaded);
        const pasteurized = safeNumber(row.pasteurized);
        return [
          String(row.date),
          offloaded.toLocaleString(),
          pasteurized.toLocaleString(),
          (offloaded - pasteurized).toLocaleString(),
        ];
      }),
    ];

    tableSlide.addTable(tableRows, {
      x: 0.45,
      y: 1.0,
      w: 12.2,
      border: { type: "solid", color: "CBD5E1", pt: 1 },
      fill: "FFFFFF",
      color: "1E293B",
      fontSize: 10,
      rowH: 0.28,
      colW: [2.2, 3.0, 3.0, 2.6],
      margin: 0.05,
      autoFit: false,
      valign: "mid",
      bold: false,
      shadeHeader: false,
      fillHeader: "2563EB",
    });
  }

  // Slide 4: Chart image
  if (data.chartElementId) {
    const chartElement = document.getElementById(data.chartElementId);

    if (chartElement) {
      const chartSlide = pptx.addSlide();
      chartSlide.background = { color: "FFFFFF" };
      chartSlide.addText("Milk Movement Chart", {
        x: 0.6,
        y: 0.45,
        w: 4.2,
        h: 0.4,
        fontSize: 20,
        bold: true,
        color: "0F172A",
      });

      const canvas = await html2canvas(chartElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");

      chartSlide.addImage({
        data: imgData,
        x: 0.5,
        y: 1.0,
        w: 12.0,
        h: 5.5,
      });
    }
  }

  const fileName = `Monthly_Report_${String(data.month).replace(/\s+/g, "_")}.pptx`;
  await pptx.writeFile({ fileName });
}