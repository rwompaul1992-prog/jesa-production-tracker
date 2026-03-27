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