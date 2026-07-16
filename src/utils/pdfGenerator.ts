import { jsPDF } from "jspdf";
import { PredictionRecord } from "../types";

/**
 * Generates and downloads a beautifully formatted, clinical-grade PDF report
 * for a single derm-AI diagnostic prediction record.
 */
export function generateDiagnosticPDF(record: PredictionRecord): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // A4 Page width: 210mm, height: 297mm
  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  let y = 15;

  // Helper: check page overflow and add page if needed
  const checkPageOverflow = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = 20;
      drawPageFooter();
    }
  };

  // Helper: Draw footer with page numbers/disclaimer
  const drawPageFooter = () => {
    const originalFont = doc.getFont();
    const originalSize = doc.getFontSize();
    const originalColor = doc.getTextColor();

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    
    // Bottom border line
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.line(marginX, pageHeight - 15, pageWidth - marginX, pageHeight - 15);

    // Disclaimer
    doc.text(
      "CONFIDENTIAL MEDICAL AI ASSIGNMENT REPORT - FOR INFORMATIONAL & SUPPORTIVE EVALUATION ONLY",
      marginX,
      pageHeight - 10
    );
    doc.text(
      `DermAI Systems Inc. | Report ID: ${record.id}`,
      pageWidth - marginX,
      pageHeight - 10,
      { align: "right" }
    );

    // Restore state
    doc.setFont(originalFont.fontName, originalFont.fontStyle);
    doc.setFontSize(originalSize);
    // @ts-ignore
    doc.setTextColor(originalColor);
  };

  // --- 1. HEADER BANNER ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(marginX, y, pageWidth - (marginX * 2), 22, "F");

  // Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("DERMAI CLINICAL DIAGNOSTIC REPORT", marginX + 6, y + 10);

  // Header Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("INTELLIGENT DERMATOLOGY ASSESSMENT ENGINE", marginX + 6, y + 15);

  // Logo text or badge on right
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(pageWidth - marginX - 35, y + 6, 29, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("AI DIAGNOSTIC", pageWidth - marginX - 20, y + 12, { align: "center" });

  y += 28;

  // --- 2. CONDITION SUMMARY BANNER ---
  checkPageOverflow(30);
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(marginX, y, pageWidth - (marginX * 2), 26, 3, 3, "FD");

  // Condition name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("MOST LIKELY DETECTED CONDITION", marginX + 5, y + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(29, 78, 216); // blue-700
  doc.text(record.disease_name, marginX + 5, y + 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Report ID: ${record.id}`, marginX + 5, y + 21);

  // Confidence & Severity score layout on the right
  const rightAlignX = pageWidth - marginX - 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("CERTAINTY MATCH", rightAlignX - 35, y + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text(`${Math.round(record.confidence * 100)}%`, rightAlignX - 35, y + 15);

  // Severity Badge
  const severity = record.details?.severity || "Low";
  let badgeBg = [219, 234, 254]; // blue-100
  let badgeText = [30, 64, 175]; // blue-800
  if (severity === "High" || severity === "Critical") {
    badgeBg = [254, 226, 226]; // red-100
    badgeText = [153, 27, 27]; // red-800
  } else if (severity === "Medium") {
    badgeBg = [254, 243, 199]; // amber-100
    badgeText = [146, 64, 14]; // amber-800
  }

  doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
  doc.roundedRect(rightAlignX - 25, y + 17, 25, 5, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(badgeText[0], badgeText[1], badgeText[2]);
  doc.text(`${severity.toUpperCase()} SEVERITY`, rightAlignX - 12.5, y + 20.5, { align: "center" });

  y += 32;

  // --- 3. MEDICAL METADATA & PHOTO GRID ---
  checkPageOverflow(48);

  // Left col: Assessment info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("ASSESSMENT DETAILS", marginX, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600
  y += 5;
  doc.text(`Patient Reference: SECURE-USER-ANONYMOUS`, marginX, y);
  y += 4.5;
  doc.text(`Log Date: ${new Date(record.prediction_time).toLocaleDateString()}`, marginX, y);
  y += 4.5;
  doc.text(`Log Time: ${new Date(record.prediction_time).toLocaleTimeString()}`, marginX, y);
  y += 4.5;
  doc.text(`Clinical Specialist: ${record.details?.specialist || "Dermatologist"}`, marginX, y);

  // Right col: Skin Scan Image
  if (record.image_data) {
    try {
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setFillColor(248, 250, 252); // slate-50
      doc.roundedRect(pageWidth - marginX - 52, y - 18, 52, 40, 2, 2, "FD");
      doc.addImage(record.image_data, "JPEG", pageWidth - marginX - 50, y - 16, 48, 36);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("CAPTURED SCAN TARGET IMAGE", pageWidth - marginX - 26, y + 23, { align: "center" });
    } catch (err) {
      console.warn("Could not embed image in PDF:", err);
    }
  }

  y += 12;

  // Helper: Section header drawing
  const drawSectionHeader = (title: string) => {
    checkPageOverflow(15);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(title.toUpperCase(), marginX, y);
    y += 2;
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 4.5;
  };

  // --- 4. OVERVIEW SECTION ---
  if (record.details?.description) {
    drawSectionHeader("Condition Overview");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85); // slate-700
    
    const overviewLines = doc.splitTextToSize(record.details.description, pageWidth - (marginX * 2));
    checkPageOverflow(overviewLines.length * 4.5);
    doc.text(overviewLines, marginX, y);
    y += (overviewLines.length * 4.5) + 3;
  }

  // --- 5. CLINICAL PRESENTATION (SYMPTOMS & CAUSES) ---
  if (record.details?.symptoms || record.details?.causes) {
    drawSectionHeader("Clinical Presentation");
    const colWidth = (pageWidth - (marginX * 2) - 8) / 2;

    const startY = y;
    let symptomsMaxY = y;
    let causesMaxY = y;

    // Left Column: Symptoms
    if (record.details?.symptoms && record.details.symptoms.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(225, 29, 72); // rose-600
      doc.text("COMMON CLINICAL SYMPTOMS", marginX, y);
      y += 4.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);

      record.details.symptoms.forEach((symp) => {
        const textLines = doc.splitTextToSize(`• ${symp}`, colWidth);
        checkPageOverflow(textLines.length * 4);
        doc.text(textLines, marginX, y);
        y += textLines.length * 4;
      });
      symptomsMaxY = y;
    }

    // Right Column: Causes
    if (record.details?.causes && record.details.causes.length > 0) {
      y = startY;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(37, 99, 235); // blue-600
      doc.text("PROBABLE CAUSES & TRIGGERS", marginX + colWidth + 8, y);
      y += 4.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);

      record.details.causes.forEach((cause) => {
        const textLines = doc.splitTextToSize(`• ${cause}`, colWidth);
        checkPageOverflow(textLines.length * 4);
        doc.text(textLines, marginX + colWidth + 8, y);
        y += textLines.length * 4;
      });
      causesMaxY = y;
    }

    y = Math.max(symptomsMaxY, causesMaxY) + 3;
  }

  // --- 6. CARE MANAGEMENT (TREATMENT & PRECAUTIONS) ---
  if (record.details?.treatment || record.details?.precautions) {
    drawSectionHeader("Care & Management Plan");
    const colWidth = (pageWidth - (marginX * 2) - 8) / 2;

    const startY = y;
    let treatmentMaxY = y;
    let precautionsMaxY = y;

    // Left Column: Supportive Treatment
    if (record.details?.treatment && record.details.treatment.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(22, 163, 74); // green-600
      doc.text("SUPPORTIVE FIRST-LINE CARE", marginX, y);
      y += 4.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);

      record.details.treatment.forEach((treat) => {
        const textLines = doc.splitTextToSize(`• ${treat}`, colWidth);
        checkPageOverflow(textLines.length * 4);
        doc.text(textLines, marginX, y);
        y += textLines.length * 4;
      });
      treatmentMaxY = y;
    }

    // Right Column: Critical Precautions
    if (record.details?.precautions && record.details.precautions.length > 0) {
      y = startY;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(217, 119, 6); // amber-600
      doc.text("CRITICAL HOME PRECAUTIONS", marginX + colWidth + 8, y);
      y += 4.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);

      record.details.precautions.forEach((prec) => {
        const textLines = doc.splitTextToSize(`• ${prec}`, colWidth);
        checkPageOverflow(textLines.length * 4);
        doc.text(textLines, marginX + colWidth + 8, y);
        y += textLines.length * 4;
      });
      precautionsMaxY = y;
    }

    y = Math.max(treatmentMaxY, precautionsMaxY) + 3;
  }

  // --- 7. MEDICATIONS (IF ANY) ---
  if (record.details?.medicines && record.details.medicines.length > 0) {
    drawSectionHeader("Informational Pharmacotherapy");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text("REPRESENTATIVE DRUG CLASSES (CONSULT DOCTOR BEFORE USE)", marginX, y);
    y += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    const medsString = record.details.medicines.join("  |  ");
    const medsLines = doc.splitTextToSize(medsString, pageWidth - (marginX * 2));
    checkPageOverflow(medsLines.length * 4);
    doc.text(medsLines, marginX, y);
    y += (medsLines.length * 4) + 3;
  }

  // --- 8. EMERGENCY RED FLAGS (SEEK IMMEDIATE EMERGENCY CARE) ---
  if (record.details?.emergencySigns && record.details.emergencySigns.length > 0) {
    checkPageOverflow(25);
    y += 3;
    doc.setFillColor(254, 242, 242); // rose-50
    doc.setDrawColor(254, 205, 205); // rose-200
    doc.roundedRect(marginX, y, pageWidth - (marginX * 2), 22, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(153, 27, 27); // rose-800
    doc.text("WARNING RED FLAGS (SEEK IMMEDIATE EMERGENCY CARE)", marginX + 4, y + 5);

    doc.setFont("helvetica", "medium");
    doc.setFontSize(7.5);
    doc.setTextColor(185, 28, 28); // rose-700

    let signY = y + 9.5;
    const signsLeft = record.details.emergencySigns.slice(0, 3).join(", ");
    const signsRight = record.details.emergencySigns.slice(3, 6).join(", ");

    doc.text(`• ${signsLeft}`, marginX + 4, signY);
    if (signsRight) {
      signY += 4;
      doc.text(`• ${signsRight}`, marginX + 4, signY);
    }
    
    y += 26;
  }

  // --- 9. CLINICAL CLINICIAN ADVISORY & MEDICAL DISCLAIMER ---
  checkPageOverflow(25);
  y += 2;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("IMPORTANT CLINICAL NOTICE & DISCLAIMER", marginX, y);
  y += 3;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184); // slate-400
  const disclaimerText = 
    "This report is compiled automatically using a Deep Learning Skin Classification neural network model. It does NOT constitute formal medical advice, diagnosis, or treatment. The findings presented are purely supportive and statistical in nature. You MUST consult a registered medical professional or specialized dermatologist for any physical concerns or to determine appropriate clinical prescription and diagnosis programs.";
  const disclaimerLines = doc.splitTextToSize(disclaimerText, pageWidth - (marginX * 2));
  doc.text(disclaimerLines, marginX, y);

  // Draw initial footer
  drawPageFooter();

  // Save the PDF
  const filename = `DermAI_Report_${record.disease_name.replace(/[^a-zA-Z0-9]/g, "_")}_${record.id.slice(0, 8)}.pdf`;
  doc.save(filename);
}
