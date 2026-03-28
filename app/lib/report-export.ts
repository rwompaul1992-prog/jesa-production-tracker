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

function safeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function exportMonthlyReport(
  data: MonthlyReportData
): Promise<void> {
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

  titleSlide.addText(String(data.month), {
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
      w: 5.5,
      h: 3.0,
      fontSize: 16,
      color: "1E293B",
      margin: 0.05,
    }
  );

  // Slide 3: Daily Production Data
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
      ["Date", "Offloaded (L)", "Pasteurized (L)", "Variance (L)"],
      ...rows.slice(0, 20).map((row) => {
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
      x: 0.5,
      y: 1.0,
      w: 12.0,
      border: { pt: 1, color: "CBD5E1" },
      fontSize: 10,
      color: "1E293B",
      fill: "FFFFFF",
      margin: 0.05,
      colW: [2.2, 3.0, 3.0, 2.6],
      rowH: 0.3,
    });
  }

  // Slide 4: Chart
  if (data.chartElementId) {
    const chartElement = document.getElementById(data.chartElementId);

    if (chartElement) {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const canvas = await html2canvas(chartElement as HTMLElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");

      if (imgData && imgData !== "data:,") {
        const chartSlide = pptx.addSlide();
        chartSlide.background = { color: "FFFFFF" };

        chartSlide.addText("Milk Movement Trend", {
          x: 0.5,
          y: 0.3,
          w: 4.2,
          h: 0.4,
          fontSize: 20,
          bold: true,
          color: "0F172A",
        });

        chartSlide.addImage({
          data: imgData,
          x: 0.6,
          y: 1.0,
          w: 11.5,
          h: 5.3,
        });
      }
    }
  }

  // Slides 5 to 10: placeholders
  while (pptx._slides.length < 10) {
    const slideNumber = pptx._slides.length + 1;
    const extraSlide = pptx.addSlide();
    extraSlide.background = { color: "FFFFFF" };

    extraSlide.addText(`Slide ${slideNumber}`, {
      x: 0.6,
      y: 0.5,
      w: 3.5,
      h: 0.4,
      fontSize: 20,
      bold: true,
      color: "0F172A",
    });

    extraSlide.addText("Content to be added.", {
      x: 0.6,
      y: 1.2,
      w: 5,
      h: 0.3,
      fontSize: 12,
      color: "64748B",
    });
  }

  const fileName = `Monthly_Report_${String(data.month).replace(/\s+/g, "_")}.pptx`;
  await pptx.writeFile({ fileName });
}