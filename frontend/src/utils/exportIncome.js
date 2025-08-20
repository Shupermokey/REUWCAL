import { isLeaf } from "./incomeMath.js";

export function flattenRows(obj, parentKey = "") {
  const acc = [];
  for (const [k, v] of Object.entries(obj || {})) {
    const path = parentKey ? `${parentKey}.${k}` : k;
    if (isLeaf(v)) {
      acc.push([
        path, v.grossAnnual, v.psfAnnual, v.pUnitAnnual,
        v.grossMonthly, v.psfMonthly, v.pUnitMonthly,
      ]);
    } else if (typeof v === "object") {
      acc.push(...flattenRows(v, path));
    }
  }
  return acc;
}

export function exportCSV(tree, propertyId) {
  const rows = [
    ["Line Item","Gross Annual","PSF (Annual)","PUnit (Annual)","Gross Monthly","PSF (Monthly)","PUnit (Monthly)"],
    ...flattenRows(tree),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.setAttribute("download", `IncomeStatement_${propertyId}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function exportPDF(tree, propertyId) {
  const { default: JSPDF } = await import("jspdf");
  const doc = new JSPDF();
  doc.setFontSize(14); doc.text("📊 Income Statement", 14, 20);
  doc.setFontSize(10);
  let y = 30;
  const header = ["Line Item","Gross Ann","PSF Ann","PUnit Ann","Gross Mo","PSF Mo","PUnit Mo"];
  [14,85,110,135,160,185,205].forEach((x,i)=>doc.text(header[i],x,y, i===6?{align:"right"}:{}));
  y += 6;
  for (const [path, ga, psa, pua, gm, psm, pum] of flattenRows(tree)) {
    doc.text(String(path), 14, y, { maxWidth: 65 });
    doc.text(String(ga), 85, y); doc.text(String(psa), 110, y); doc.text(String(pua), 135, y);
    doc.text(String(gm), 160, y); doc.text(String(psm), 185, y); doc.text(String(pum), 205, y, { align: "right" });
    if ((y += 6) > 270) { doc.addPage(); y = 20; }
  }
  doc.save(`IncomeStatement_${propertyId}.pdf`);
}
