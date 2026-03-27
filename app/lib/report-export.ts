declare global {
  interface Window {
    PptxGenJS: any;
  }
}

export async function exportMonthlyReport(data: any) {
  const PptxGenJS = window.PptxGenJS;

  if (!PptxGenJS) {
    throw new Error('PptxGenJS browser bundle not loaded');
  }

  const pptx = new PptxGenJS();

  const slide1 = pptx.addSlide();
  slide1.addText('Monthly Production Report', {
    x: 1,
    y: 1.5,
    fontSize: 28,
    bold: true,
  });

  const slide2 = pptx.addSlide();
  slide2.addText('Summary', { x: 0.5, y: 0.5, fontSize: 20, bold: true });

  slide2.addText(
    `Total Offloaded: ${data.totalOffloaded || 0} L\nLoss Rate: ${data.lossRate || 0}%`,
    { x: 0.5, y: 1.2, fontSize: 14 }
  );

  await pptx.writeFile({ fileName: 'Monthly_Report.pptx' });
}