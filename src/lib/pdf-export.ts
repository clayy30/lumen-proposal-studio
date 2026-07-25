"use client";

/**
 * Premium multi-page PDF export via html2canvas + jsPDF.
 * Captures each [data-pdf-page] section as a crisp page.
 */
export async function exportProposalPdf(
  root: HTMLElement,
  filename: string
): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const pages = Array.from(
    root.querySelectorAll<HTMLElement>("[data-pdf-page]")
  );

  if (!pages.length) {
    throw new Error("No proposal pages found to export.");
  }

  // US Letter in mm
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < pages.length; i++) {
    const el = pages[i];
    // Temporarily ensure full visibility for capture
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#faf9f6",
      logging: false,
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (i > 0) pdf.addPage();

    // Fit to page — letter-box if taller than page
    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight, undefined, "FAST");
    } else {
      // Scale down to fit height
      const scale = pageHeight / imgHeight;
      const w = imgWidth * scale;
      const h = pageHeight;
      const x = (pageWidth - w) / 2;
      pdf.addImage(imgData, "JPEG", x, 0, w, h, undefined, "FAST");
    }
  }

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
