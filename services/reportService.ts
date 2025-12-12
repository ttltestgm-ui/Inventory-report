import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ReportHeader, LineItem, Totals } from '../types';
import { getFilenameDate } from '../utils';

// Helper to calculate totals
export const calculateTotals = (items: LineItem[]): Totals => {
  return items.reduce(
    (acc, item) => ({
      totalInvoiceQty: acc.totalInvoiceQty + (Number(item.invoiceQty) || 0),
      totalRcvdQty: acc.totalRcvdQty + (Number(item.rcvdQty) || 0),
      totalValue: acc.totalValue + ((Number(item.invoiceQty) || 0) * (Number(item.unitPrice) || 0)),
    }),
    { totalInvoiceQty: 0, totalRcvdQty: 0, totalValue: 0 }
  );
};

export const generateReports = (header: ReportHeader, items: LineItem[]) => {
  const totals = calculateTotals(items);
  const totalValueStr = Math.round(totals.totalValue); 
  const filenameDate = getFilenameDate(header.billingDate);
  const baseFilename = `Bill of Buyer ${header.buyerName} $${totalValueStr} DATE-${filenameDate}`;

  generatePDF(header, items, totals, baseFilename);
  generateExcel(header, items, totals, baseFilename);
};

const generatePDF = (header: ReportHeader, items: LineItem[], totals: Totals, filename: string) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // --- Layout Constants ---
  const headerY = 15;
  const addressY = 21;
  const titleY = 32;
  
  const infoBlockY = 42;
  const lineHeight = 5.5;
  const infoBlockHeight = lineHeight * 5; // 5 lines of details
  
  const tableStartY = infoBlockY + infoBlockHeight + 5;
  
  // Signature Block Constants
  const signatureHeight = 25; // Height reserved for signature lines/text
  const bottomMargin = 15;
  const signatureBlockY = pageHeight - signatureHeight - bottomMargin;
  
  // Calculate available height for the table (from startY to top of signature block)
  // We leave a buffer between table bottom and signature top
  // Increased buffer to 30mm to ensure significant gap before signatures
  const maxTableHeight = signatureBlockY - tableStartY - 30;
  
  // --- Dynamic Layout Logic ---
  // Rows = Header(1) + Items(n) + Footer(1)
  const rowCount = items.length + 2; 
  
  // Default styling
  let finalFontSize = 9;
  let finalCellPadding = 2;
  let finalMinCellHeight = 8;

  // Calculate the height required if we use "standard" comfortable spacing (e.g. 10mm per row)
  const standardHeight = rowCount * 8; 

  if (standardHeight > maxTableHeight) {
    // Content is TALLER than available space -> Shrink to fit
    const availablePerRow = maxTableHeight / rowCount;
    // Heuristic: font size based on available height, min 5pt
    finalFontSize = Math.max(5, Math.floor(availablePerRow * 1.5)); 
    finalCellPadding = Math.max(0.5, finalFontSize / 5);
    finalMinCellHeight = availablePerRow; 
  } else {
    // Content is SHORTER than available space -> Expand to fill
    // We distribute the available space among the rows
    finalMinCellHeight = maxTableHeight / rowCount;
    // Keep font size standard
    finalFontSize = 10;
  }

  // --- Draw Static Header Content ---
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text("Tusuka Trousers Ltd.", pageWidth / 2, headerY, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text("Neelngar, Konabari, Gazipur", pageWidth / 2, addressY, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Inventory Report", pageWidth / 2, titleY, { align: 'center' });

  // --- Info Block ---
  const leftX = 14;
  const rightX = pageWidth - 70;

  doc.setFontSize(9);
  
  // Helper to draw label: value pair
  const drawLabelVal = (label: string, val: string, x: number, y: number) => {
    doc.setFont('helvetica', 'bold'); doc.text(label, x, y);
    doc.setFont('helvetica', 'normal'); doc.text(val || '', x + 35, y);
  };

  drawLabelVal("Buyer Name :", header.buyerName, leftX, infoBlockY);
  drawLabelVal("Supplier Name:", header.supplierName, leftX, infoBlockY + lineHeight);
  drawLabelVal("File No :", header.fileNo, leftX, infoBlockY + lineHeight * 2);
  drawLabelVal("Invoice No :", header.invoiceNo, leftX, infoBlockY + lineHeight * 3);
  drawLabelVal("L/C Number :", header.lcNumber, leftX, infoBlockY + lineHeight * 4);

  // Right Column
  doc.setFont('helvetica', 'bold'); doc.text("Invoice Date:", rightX, infoBlockY);
  doc.setFont('helvetica', 'normal'); doc.text(header.invoiceDate || '', rightX + 25, infoBlockY);

  doc.setFont('helvetica', 'bold'); doc.text("Billing Date:", rightX, infoBlockY + lineHeight);
  doc.setFont('helvetica', 'normal'); doc.text(header.billingDate || '', rightX + 25, infoBlockY + lineHeight);

  // --- Table Data Preparation ---
  const tableColumn = [
    "Fabric Code", 
    "Item Description", 
    "Rcvd Date", 
    "Challan No", 
    "Pi Number", 
    "Unit", 
    "Invoice Qty", 
    "Rcvd Qty", 
    "Unit Price $", 
    "Total Value", 
    "Appstreme No.\n(Receipt no)"
  ];

  const tableRows = items.map(item => {
    // FIX: Safely cast to numbers
    const invoiceQty = Number(item.invoiceQty) || 0;
    const rcvdQty = Number(item.rcvdQty) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const totalRowVal = invoiceQty * unitPrice;

    // Build Description Conditionally
    let description = item.itemDescription || '';
    const details = [];
    if (item.color && item.color.trim()) details.push(`Color: ${item.color}`);
    if (item.hsCode && item.hsCode.trim()) details.push(`H.S Code: ${item.hsCode}`);
    
    if (details.length > 0) {
      description += `\n${details.join(', ')}`;
    }

    return [
      item.fabricCode,
      description,
      item.rcvdDate,
      item.challanNo,
      item.piNumber,
      item.unit,
      invoiceQty,
      rcvdQty,
      unitPrice.toFixed(2),
      totalRowVal.toFixed(2),
      item.appstremeNo
    ];
  });

  const footerRow = [
    "", "", "", "", "Total:", "YDS", 
    totals.totalInvoiceQty.toFixed(2),
    totals.totalRcvdQty.toFixed(2),
    "",
    totals.totalValue.toFixed(2),
    ""
  ];
  tableRows.push(footerRow);

  // --- AutoTable Generation ---
  autoTable(doc, {
    startY: tableStartY,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: finalFontSize,
      cellPadding: finalCellPadding,
      overflow: 'linebreak', // Allows text to wrap if it's too long
      halign: 'center',
      valign: 'middle',
      minCellHeight: finalMinCellHeight // DYNAMIC ROW HEIGHT
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    columnStyles: {
      1: { cellWidth: 40, halign: 'left' } // Description
    },
    didParseCell: (data) => {
      // Bold the total row
      if (data.row.index === tableRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  // --- Signatures ---
  // We want to place the signature at a FIXED position at the bottom of the page,
  // unless the table has overflowed onto a new page or overlaps this area.
  
  let sigY = signatureBlockY;
  const lastTableY = (doc as any).lastAutoTable.finalY;

  // If table overlaps the signature area (minus our large buffer), add a new page.
  // Note: We use a smaller tolerance here for the *actual* overlap check compared to the visual gap buffer.
  if (lastTableY > signatureBlockY - 10) {
      doc.addPage();
      // On new page, place signatures at the bottom as well? Or top?
      // Usually bottom is consistent.
      sigY = signatureBlockY; 
  }

  doc.setLineWidth(0.3);
  
  // Left Sig
  doc.line(20, sigY, 70, sigY);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text("Prepared By", 25, sigY + 5);

  // Right Sig
  doc.line(pageWidth - 70, sigY, pageWidth - 20, sigY);
  doc.text("Store In-Charge", pageWidth - 65, sigY + 5);

  doc.save(`${filename}.pdf`);
};

const generateExcel = (header: ReportHeader, items: LineItem[], totals: Totals, filename: string) => {
  const wb = XLSX.utils.book_new();
  
  const wsData = [
    ["Tusuka Trousers Ltd."],
    ["Neelngar, Konabari, Gazipur"],
    ["Inventory Report"],
    [],
    ["Buyer Name :", header.buyerName, "", "", "", "", "", "Invoice Date:", header.invoiceDate],
    ["Supplier Name:", header.supplierName, "", "", "", "", "", "Billing Date:", header.billingDate],
    ["File No :", header.fileNo],
    ["Invoice No :", header.invoiceNo],
    ["L/C Number :", header.lcNumber],
    [],
    [
      "Fabric Code", "Item Description", "Color", "HS Code", "Rcvd Date", "Challan No", 
      "Pi Number", "Unit", "Invoice Qty", "Rcvd Qty", "Unit Price $", "Total Value", "Appstreme No"
    ]
  ];

  items.forEach(item => {
    // FIX: Safely cast to numbers for Excel as well
    const invoiceQty = Number(item.invoiceQty) || 0;
    const rcvdQty = Number(item.rcvdQty) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const totalVal = invoiceQty * unitPrice;

    wsData.push([
      item.fabricCode,
      item.itemDescription,
      item.color,
      item.hsCode,
      item.rcvdDate,
      item.challanNo,
      item.piNumber,
      item.unit,
      invoiceQty.toString(),
      rcvdQty.toString(),
      unitPrice.toString(),
      totalVal.toFixed(2),
      item.appstremeNo
    ]);
  });

  wsData.push([
    "Total:", "", "", "", "", "", "", "", 
    totals.totalInvoiceQty.toString(), 
    totals.totalRcvdQty.toString(), 
    "", 
    totals.totalValue.toFixed(2), 
    ""
  ]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  if(!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }); 
  ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 12 } }); 
  ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 12 } }); 

  ws['!cols'] = [
    { wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 6 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 15 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Inventory Report");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};
