import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  Download,
  PackageX,
  Printer,
  Share2,
  Truck,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { CompleteDelivery, PendingDelivery } from "../types/delivery";

interface Props {
  pendingDeliveries: PendingDelivery[];
  completeDeliveries: CompleteDelivery[];
  onBack: () => void;
}

type Period = "daily" | "weekly";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start: fmt(mon), end: fmt(sun) };
}

type MergedLabor = { name: string; amount: number };

function buildMergedLabors(d: CompleteDelivery): MergedLabor[] {
  const map = new Map<string, number>();
  for (const name of d.loadingLaborNames) {
    map.set(name, (map.get(name) ?? 0) + (d.perLoadingLaborAmount ?? 0));
  }
  for (const name of d.unloadingLaborNames) {
    map.set(name, (map.get(name) ?? 0) + (d.perUnloadingLaborAmount ?? 0));
  }
  return Array.from(map.entries()).map(([name, amount]) => ({ name, amount }));
}

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
  return dateStr;
}

function formatLongDate(dateStr: string): string {
  if (!dateStr) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Group deliveries by vehicleNumber */
function groupByVehicle(
  deliveries: CompleteDelivery[],
): Map<string, CompleteDelivery[]> {
  const map = new Map<string, CompleteDelivery[]>();
  for (const d of deliveries) {
    const key = d.vehicleNumber || "Unknown";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(d);
  }
  return map;
}

/** Collect all unique labor names across a group of deliveries */
function collectLaborNames(group: CompleteDelivery[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const d of group) {
    for (const { name } of buildMergedLabors(d)) {
      if (!seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }
  }
  return names;
}

export default function ReportPage({
  pendingDeliveries,
  completeDeliveries,
  onBack,
}: Props) {
  const [period, setPeriod] = useState<Period>("daily");
  const today = todayStr();

  const [dailyFrom, setDailyFrom] = useState(today);
  const [dailyTo, setDailyTo] = useState(today);

  const week = getWeekRange();
  const [weeklyFrom, setWeeklyFrom] = useState(week.start);
  const [weeklyTo, setWeeklyTo] = useState(week.end);

  const dailyDeliveries = completeDeliveries.filter((d) => {
    if (dailyFrom && d.date < dailyFrom) return false;
    if (dailyTo && d.date > dailyTo) return false;
    return true;
  });

  const weeklyCompleteDeliveries = completeDeliveries.filter((d) => {
    if (weeklyFrom && d.date < weeklyFrom) return false;
    if (weeklyTo && d.date > weeklyTo) return false;
    return true;
  });

  const _weeklyPendingDeliveries = pendingDeliveries.filter((d) => {
    if (weeklyFrom && d.date < weeklyFrom) return false;
    if (weeklyTo && d.date > weeklyTo) return false;
    return true;
  });

  // Filter out paidMoney deliveries for labor calculations
  const weeklyLaborDeliveries = weeklyCompleteDeliveries.filter(
    (d) => !d.paidMoney,
  );
  const dailyLaborDeliveries = dailyDeliveries.filter((d) => !d.paidMoney);

  // ── Weekly labor table data ──
  // Collect all unique labor names across filtered weekly deliveries
  const weeklyLaborNames = (() => {
    const seen = new Set<string>();
    const names: string[] = [];
    for (const d of weeklyLaborDeliveries) {
      for (const { name } of buildMergedLabors(d)) {
        if (!seen.has(name)) {
          seen.add(name);
          names.push(name);
        }
      }
    }
    return names;
  })();

  // Group weekly deliveries by date
  const weeklyByDate = (() => {
    const map = new Map<string, CompleteDelivery[]>();
    for (const d of weeklyLaborDeliveries) {
      if (!map.has(d.date)) map.set(d.date, []);
      map.get(d.date)!.push(d);
    }
    return map;
  })();

  // Sorted date keys
  const weeklyDateKeys = Array.from(weeklyByDate.keys()).sort();

  // For each date row: sum each labor's earnings
  const weeklyDateRows = weeklyDateKeys.map((date) => {
    const delivs = weeklyByDate.get(date) ?? [];
    const laborAmts: Record<string, number> = {};
    for (const name of weeklyLaborNames) laborAmts[name] = 0;
    for (const d of delivs) {
      for (const { name, amount } of buildMergedLabors(d)) {
        if (laborAmts[name] !== undefined) laborAmts[name] += amount;
        else laborAmts[name] = amount;
      }
    }
    const rowTotal = Object.values(laborAmts).reduce((s, v) => s + v, 0);
    return { date, laborAmts, rowTotal };
  });

  // Column totals
  const weeklyColTotals: Record<string, number> = {};
  for (const name of weeklyLaborNames) weeklyColTotals[name] = 0;
  for (const row of weeklyDateRows) {
    for (const name of weeklyLaborNames) {
      weeklyColTotals[name] += row.laborAmts[name] ?? 0;
    }
  }
  const weeklyGrandTotal = Object.values(weeklyColTotals).reduce(
    (s, v) => s + v,
    0,
  );

  // ── PDF Handlers ──
  function handlePrintDailyPDF() {
    const periodLabel =
      dailyFrom === dailyTo
        ? `Date: ${formatDisplayDate(dailyFrom)}`
        : dailyFrom && dailyTo
          ? `${formatDisplayDate(dailyFrom)} - ${formatDisplayDate(dailyTo)}`
          : dailyFrom
            ? `From: ${formatDisplayDate(dailyFrom)}`
            : dailyTo
              ? `To: ${formatDisplayDate(dailyTo)}`
              : "All Deliveries";

    const grouped = groupByVehicle(dailyLaborDeliveries);
    let tablesHtml = "";

    for (const [vehicleNumber, group] of grouped) {
      const laborNames = collectLaborNames(group);
      const dates = [...new Set(group.map((d) => d.date))];
      const dateLabel =
        dates.length === 1
          ? formatLongDate(dates[0])
          : dates.length > 1
            ? `${formatDisplayDate(dates[0])} – ${formatDisplayDate(dates[dates.length - 1])}`
            : "";

      const headerCols = [
        "Customer",
        "Address",
        "Quantity",
        "Trip Rate",
        ...laborNames,
      ]
        .map(
          (h) =>
            `<th style="background:#1565c0;color:#fff;padding:7px 10px;text-align:${["Customer", "Address"].includes(h) ? "left" : "right"};white-space:nowrap">${h}</th>`,
        )
        .join("");

      let totalQty = 0;
      const laborTotals: Record<string, number> = {};
      for (const n of laborNames) laborTotals[n] = 0;

      const dataRows = group
        .map((d, ri) => {
          const mergedMap = new Map(
            buildMergedLabors(d).map((l) => [l.name, l.amount]),
          );
          totalQty += d.totalBricks;
          const laborCells = laborNames
            .map((n) => {
              const amt = mergedMap.get(n) ?? 0;
              laborTotals[n] += amt;
              return `<td style="padding:6px 10px;text-align:right;background:${ri % 2 === 0 ? "#fff" : "#f5f9ff"}">${amt > 0 ? `₹${amt.toFixed(2)}` : "—"}</td>`;
            })
            .join("");
          return `<tr>
            <td style="padding:6px 10px;background:${ri % 2 === 0 ? "#fff" : "#f5f9ff"}">${d.customerName}</td>
            <td style="padding:6px 10px;background:${ri % 2 === 0 ? "#fff" : "#f5f9ff"}">${d.address}</td>
            <td style="padding:6px 10px;text-align:right;background:${ri % 2 === 0 ? "#fff" : "#f5f9ff"}">${d.totalBricks}</td>
            <td style="padding:6px 10px;text-align:right;background:${ri % 2 === 0 ? "#fff" : "#f5f9ff"}">${d.totalAmount !== undefined && d.totalAmount > 0 ? `₹${d.totalAmount.toFixed(2)}` : "—"}</td>
            ${laborCells}
          </tr>`;
        })
        .join("");

      const laborTotalCells = laborNames
        .map(
          (n) =>
            `<td style="padding:7px 10px;text-align:right;font-weight:700;color:#1565c0">${laborTotals[n] > 0 ? `₹${laborTotals[n].toFixed(2)}` : "—"}</td>`,
        )
        .join("");

      const grandTotal = group.reduce((s, d) => s + (d.totalAmount ?? 0), 0);

      tablesHtml += `
        <div style="background:#fff;border:1.5px solid #c7d9f5;border-radius:14px;margin-bottom:20px;overflow:hidden">
          <div style="padding:14px 16px 10px">
            <div style="font-size:16px;font-weight:800;color:#1a237e">Vehicle Statement</div>
            <div style="font-size:12px;color:#1565c0;margin-top:4px">Date: ${dateLabel} &nbsp;|&nbsp; Vehicle Number: <strong>${vehicleNumber}</strong></div>
          </div>
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;font-size:12px">
              <thead><tr>${headerCols}</tr></thead>
              <tbody>
                ${dataRows}
                <tr>
                  <td colspan="2" style="padding:8px 10px;font-weight:700;background:#f0f4ff">Total:</td>
                  <td style="padding:8px 10px;text-align:right;font-weight:700;background:#f0f4ff">${totalQty}</td>
                  <td style="padding:8px 10px;background:#f0f4ff"></td>
                  ${laborTotalCells.replace(/background:[^;]+;/g, "background:#f0f4ff;")}
                </tr>
              </tbody>
            </table>
          </div>
          <div style="background:#1565c0;color:#fff;padding:10px 16px;display:flex;justify-content:space-between;font-size:13px;font-weight:700">
            <span>Grand Total:</span>
            <span>${grandTotal > 0 ? `₹${grandTotal.toFixed(2)}` : "—"}</span>
          </div>
        </div>`;
    }

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SAHA Daily Report</title>
      <style>
        @page { size: A4 landscape; margin: 1cm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; width: 297mm; max-width: 297mm; }
        table { table-layout: fixed; width: 100%; border-collapse: collapse; font-size: 12px; }
        td, th { overflow-wrap: break-word; word-break: break-word; }
        @media print { body { background: white; } .page-break { page-break-before: always; } }
        @media screen { body { padding: 20px; background: #f3f4f6; } .content { background: white; max-width: 297mm; margin: 0 auto; padding: 20px; } }
      </style>
      </head><body>
      <div class="content"><h2 style="color:#1a237e;margin-bottom:4px">SAHA – Daily Report</h2>
      <p style="color:#666;font-size:13px;margin-bottom:16px">${periodLabel} &nbsp;|&nbsp; ${dailyDeliveries.length} deliveries</p>
      ${tablesHtml}
      <p style="color:#aaa;font-size:11px;text-align:center;margin-top:24px">SAHA Business Suite</p></div>
      </body></html>`;

    const printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 500);
    }
  }

  function handlePrintWeeklyPDF() {
    const periodLabel =
      weeklyFrom && weeklyTo
        ? `${formatDisplayDate(weeklyFrom)} – ${formatDisplayDate(weeklyTo)}`
        : weeklyFrom
          ? `From: ${formatDisplayDate(weeklyFrom)}`
          : weeklyTo
            ? `To: ${formatDisplayDate(weeklyTo)}`
            : "All Deliveries";

    // Build header cells
    const thDates = weeklyDateKeys
      .map((d) => {
        const [yyyy, mm, dd] = d.split("-");
        return `<th style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#1b5e20;color:white;border:1px solid #388e3c;padding:6px 8px;text-align:center;white-space:nowrap">${dd}/${mm}/${yyyy.slice(2)}</th>`;
      })
      .join("");
    const thead = `<thead><tr>
      <th style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#1b5e20;color:white;border:1px solid #388e3c;padding:6px 10px;text-align:left;white-space:nowrap">Name</th>
      ${thDates}
      <th style="-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#2e7d32;color:white;border:1px solid #388e3c;padding:6px 10px;text-align:right;white-space:nowrap">Total</th>
    </tr></thead>`;

    // Build body rows
    const tbodyRows = weeklyLaborNames
      .map((name, i) => {
        const bg = i % 2 === 0 ? "white" : "#f9fbe7";
        const dateCells = weeklyDateKeys
          .map((dk) => {
            const row = weeklyDateRows.find((r) => r.date === dk);
            const amt = row?.laborAmts[name] ?? 0;
            if (amt > 0) {
              return `<td style="border:1px solid #c8e6c9;padding:5px 8px;text-align:center;color:#2e7d32;font-weight:600">₹${amt.toFixed(2)}</td>`;
            }
            return `<td style="border:1px solid #c8e6c9;padding:5px 8px;text-align:center;color:#aaa">NIL</td>`;
          })
          .join("");
        const total = weeklyColTotals[name] ?? 0;
        return `<tr style="background:${bg}">
          <td style="border:1px solid #c8e6c9;padding:5px 10px;font-weight:700;white-space:nowrap">${name}</td>
          ${dateCells}
          <td style="border:1px solid #c8e6c9;padding:5px 10px;background:#e8f5e9;font-weight:800;text-align:right;color:#1b5e20;white-space:nowrap">₹${total.toFixed(2)}</td>
        </tr>`;
      })
      .join("");

    // Build footer row
    const tfoot = `<tfoot><tr style="background:#1b5e20;color:white;-webkit-print-color-adjust:exact;print-color-adjust:exact">
      <td style="border:1px solid #388e3c;padding:6px 10px;font-weight:800;white-space:nowrap">GRAND TOTAL</td>
      <td colspan="${weeklyDateKeys.length}" style="border:1px solid #388e3c;padding:6px 8px;text-align:center;color:rgba(255,255,255,0.6);font-size:10px">${weeklyDateKeys.length} days</td>
      <td style="border:1px solid #388e3c;padding:6px 10px;font-weight:800;text-align:right;white-space:nowrap">₹${weeklyGrandTotal.toFixed(2)}</td>
    </tr></tfoot>`;

    const tableHtml = `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11px;min-width:${Math.max(400, 140 + weeklyDateKeys.length * 80)}px">
      ${thead}<tbody>${tbodyRows}</tbody>${tfoot}
    </table></div>`;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SAHA Weekly Lebour Report</title>
      <style>
        @page { size: A4 landscape; margin: 1cm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; }
        @media print { * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; } body { background: white; } }
        @media screen { body { padding: 20px; background: #f3f4f6; } .content { background: white; max-width: 297mm; margin: 0 auto; padding: 20px; } }
      </style>
      </head><body>
      <div class="content">
        <h2 style="color:#1b5e20;margin-bottom:4px">SAHA – Weekly Lebour Report</h2>
        <p style="color:#555;font-size:13px;margin-bottom:16px">${periodLabel} &nbsp;|&nbsp; ${weeklyDateKeys.length} days &nbsp;|&nbsp; ${weeklyLaborNames.length} lebours</p>
        ${tableHtml}
        <p style="color:#aaa;font-size:11px;text-align:center;margin-top:24px">SAHA Business Suite</p>
      </div>
      </body></html>`;

    const printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 500);
    }
  }

  async function handleDownloadDailyPDF() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jsPDF = (window as any).jspdf?.jsPDF || (window as any).jsPDF;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pw = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 20;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 83, 45);
    doc.text("SAHA - Daily Report", margin, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(
      dailyFrom && dailyTo
        ? `${formatDisplayDate(dailyFrom)} - ${formatDisplayDate(dailyTo)}`
        : "All Dates",
      margin,
      y,
    );
    y += 4;
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(0.6);
    doc.line(margin, y, pw - margin, y);
    y += 6;

    for (const [vehicleNum, vDeliveries] of vehicleGroups.entries()) {
      const allLabors = [
        ...new Set(
          vDeliveries.flatMap((d) => {
            const m = new Map();
            for (const n of d.loadingLaborNames)
              m.set(n, (m.get(n) ?? 0) + (d.perLoadingLaborAmount ?? 0));
            for (const n of d.unloadingLaborNames)
              m.set(n, (m.get(n) ?? 0) + (d.perUnloadingLaborAmount ?? 0));
            return [...m.keys()];
          }),
        ),
      ];
      const cardH = 14 + vDeliveries.length * 8 + 10 + 8;
      if (y + cardH > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(200, 230, 201);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin, y, pw - margin * 2, cardH, 3, 3, "FD");
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 83, 45);
      doc.text(`Vehicle: ${vehicleNum}`, margin + 3, y + 7);
      y += 12;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(80, 80, 80);
      doc.text("Customer", margin + 3, y);
      doc.text("Qty", margin + 55, y);
      doc.text("Rate", margin + 72, y);
      allLabors.forEach((name, li) => {
        doc.text(name.substring(0, 8), margin + 90 + li * 22, y);
      });
      y += 5;
      doc.setDrawColor(200, 230, 201);
      doc.line(margin + 2, y, pw - margin - 2, y);
      y += 3;
      for (const d of vDeliveries) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(8);
        doc.text(d.customerName.substring(0, 14), margin + 3, y);
        doc.text(String(d.totalBricks), margin + 55, y);
        doc.text(
          d.totalAmount ? d.totalAmount.toFixed(0) : "0",
          margin + 72,
          y,
        );
        const laborMap = new Map();
        for (const n of d.loadingLaborNames)
          laborMap.set(
            n,
            (laborMap.get(n) ?? 0) + (d.perLoadingLaborAmount ?? 0),
          );
        for (const n of d.unloadingLaborNames)
          laborMap.set(
            n,
            (laborMap.get(n) ?? 0) + (d.perUnloadingLaborAmount ?? 0),
          );
        allLabors.forEach((name, li) => {
          const amt = laborMap.get(name) ?? 0;
          doc.text(amt > 0 ? amt.toFixed(0) : "-", margin + 90 + li * 22, y);
        });
        y += 7;
      }
      const grandTotal = vDeliveries.reduce(
        (s, d) => s + (d.totalAmount ?? 0),
        0,
      );
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 83, 45);
      doc.text(`Grand Total: ${grandTotal.toFixed(2)}`, margin + 3, y + 2);
      y += 10;
    }
    doc.save("saha-daily-report.pdf");
  }

  async function handleDownloadWeeklyPDF() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jsPDF = (window as any).jspdf?.jsPDF || (window as any).jsPDF;
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });
    const pw = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 20;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 83, 45);
    doc.text("SAHA - Weekly Lebour Report", margin, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(
      weeklyFrom && weeklyTo
        ? `${formatDisplayDate(weeklyFrom)} - ${formatDisplayDate(weeklyTo)}`
        : "All Dates",
      margin,
      y,
    );
    y += 5;
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pw - margin, y);
    y += 8;

    // Build table data for autoTable if available
    const colWidth = Math.min(
      28,
      (pw - margin * 2 - 40) / Math.max(weeklyDateKeys.length, 1),
    );
    const nameColW = 40;
    const totalColW = 28;
    const tableW = nameColW + weeklyDateKeys.length * colWidth + totalColW;
    const startX = margin;

    // Header row
    const headerH = 8;
    doc.setFillColor(27, 94, 32);
    doc.rect(startX, y, tableW, headerH, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Name", startX + 2, y + 5.5);
    let cx = startX + nameColW;
    for (const dk of weeklyDateKeys) {
      const [, mm, dd] = dk.split("-");
      doc.text(`${dd}/${mm}`, cx + colWidth / 2, y + 5.5, { align: "center" });
      cx += colWidth;
    }
    doc.text("Total", startX + tableW - 2, y + 5.5, { align: "right" });
    y += headerH;

    // Draw borders for header
    doc.setDrawColor(56, 142, 60);
    doc.setLineWidth(0.3);
    doc.rect(startX, y - headerH, tableW, headerH);
    cx = startX + nameColW;
    for (let i = 0; i < weeklyDateKeys.length; i++) {
      doc.line(cx, y - headerH, cx, y);
      cx += colWidth;
    }
    doc.line(cx, y - headerH, cx, y);

    // Body rows
    const rowH = 7;
    for (let ri = 0; ri < weeklyLaborNames.length; ri++) {
      if (y + rowH > 190) {
        doc.addPage();
        y = 20;
      }
      const name = weeklyLaborNames[ri];
      const bg = ri % 2 === 0 ? [255, 255, 255] : [249, 251, 231];
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.rect(startX, y, tableW, rowH, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(27, 94, 32);
      doc.text(name.substring(0, 18), startX + 2, y + 4.8);
      cx = startX + nameColW;
      for (const dk of weeklyDateKeys) {
        const row = weeklyDateRows.find((r) => r.date === dk);
        const amt = row?.laborAmts[name] ?? 0;
        if (amt > 0) {
          doc.setTextColor(46, 125, 50);
          doc.setFont("helvetica", "bold");
          doc.text(`₹${amt.toFixed(2)}`, cx + colWidth / 2, y + 4.8, {
            align: "center",
          });
        } else {
          doc.setTextColor(180, 180, 180);
          doc.setFont("helvetica", "normal");
          doc.text("NIL", cx + colWidth / 2, y + 4.8, { align: "center" });
        }
        cx += colWidth;
      }
      const total = weeklyColTotals[name] ?? 0;
      doc.setFillColor(232, 245, 233);
      doc.rect(cx, y, totalColW, rowH, "F");
      doc.setTextColor(27, 94, 32);
      doc.setFont("helvetica", "bold");
      doc.text(`₹${total.toFixed(2)}`, startX + tableW - 2, y + 4.8, {
        align: "right",
      });
      // borders
      doc.setDrawColor(200, 230, 201);
      doc.setLineWidth(0.2);
      doc.rect(startX, y, tableW, rowH);
      let bx = startX + nameColW;
      for (let i = 0; i < weeklyDateKeys.length; i++) {
        doc.line(bx, y, bx, y + rowH);
        bx += colWidth;
      }
      doc.line(bx, y, bx, y + rowH);
      y += rowH;
    }

    // Footer / Grand Total row
    if (y + 9 > 190) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(27, 94, 32);
    doc.rect(startX, y, tableW, 9, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("GRAND TOTAL", startX + 2, y + 6);
    cx = startX + nameColW;
    for (const dk of weeklyDateKeys) {
      const row = weeklyDateRows.find((r) => r.date === dk);
      const dayTotal = row
        ? Object.values(row.laborAmts).reduce((s, v) => s + v, 0)
        : 0;
      doc.text(`₹${dayTotal.toFixed(2)}`, cx + colWidth / 2, y + 6, {
        align: "center",
      });
      cx += colWidth;
    }
    doc.text(`₹${weeklyGrandTotal.toFixed(2)}`, startX + tableW - 2, y + 6, {
      align: "right",
    });
    doc.setDrawColor(56, 142, 60);
    doc.setLineWidth(0.3);
    doc.rect(startX, y, tableW, 9);

    doc.save("saha-weekly-report.pdf");
  }

  async function handleShareWeeklyReport() {
    const text = buildWeeklyShareText();
    if (navigator.share) {
      try {
        await navigator.share({ title: "SAHA Weekly Lebour Report", text });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text).catch(() => {});
      alert("Report copied to clipboard!");
    }
  }

  function buildWeeklyShareText(): string {
    const lines = ["SAHA Weekly Lebour Report"];
    if (weeklyFrom && weeklyTo)
      lines.push(
        `${formatDisplayDate(weeklyFrom)} – ${formatDisplayDate(weeklyTo)}`,
      );
    lines.push("");
    const header = [
      "Name",
      ...weeklyDateKeys.map((d) => formatDisplayDate(d)),
      "Total",
    ];
    lines.push(header.join(" | "));
    for (const name of weeklyLaborNames) {
      const cells = [name];
      for (const dateKey of weeklyDateKeys) {
        const row = weeklyDateRows.find((r) => r.date === dateKey);
        const amt = row?.laborAmts[name] ?? 0;
        cells.push(amt > 0 ? `₹${amt.toFixed(2)}` : "NIL");
      }
      cells.push(`₹${(weeklyColTotals[name] ?? 0).toFixed(2)}`);
      lines.push(cells.join(" | "));
    }
    lines.push("");
    lines.push(`Grand Total: ₹${weeklyGrandTotal.toFixed(2)}`);
    return lines.join("\n");
  }

  // Group daily deliveries by vehicle
  const vehicleGroups = groupByVehicle(dailyLaborDeliveries);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "oklch(97% 0.012 145)" }}
    >
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 pt-10 pb-4 bg-white shadow-sm"
        style={{ borderBottom: "1.5px solid oklch(90% 0.04 145)" }}
      >
        <button
          type="button"
          data-ocid="report.back.button"
          onClick={onBack}
          className="h-9 w-9 flex items-center justify-center rounded-full transition-colors"
          style={{ background: "oklch(93% 0.06 145)" }}
        >
          <ChevronLeft size={20} style={{ color: "oklch(40% 0.18 145)" }} />
        </button>
        <div className="flex items-center gap-2.5 flex-1">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center"
            style={{ background: "oklch(90% 0.12 145)" }}
          >
            <BarChart3 size={18} style={{ color: "oklch(40% 0.18 145)" }} />
          </div>
          <div>
            <h2
              className="text-lg font-extrabold font-display leading-tight"
              style={{ color: "oklch(28% 0.06 145)" }}
            >
              Report
            </h2>
            <p
              className="text-[10px] font-medium leading-tight"
              style={{ color: "oklch(58% 0.08 145)" }}
            >
              {period === "daily" ? "Daily Report" : "Weekly Lebour Account"}
            </p>
          </div>
        </div>
        {period === "daily" && (
          <div className="flex gap-2">
            <button
              type="button"
              data-ocid="report.daily.secondary_button"
              onClick={handlePrintDailyPDF}
              className="h-9 px-3 flex items-center gap-1.5 rounded-xl text-xs font-bold transition-colors"
              style={{
                background: "oklch(94% 0.04 145)",
                color: "oklch(38% 0.14 145)",
                border: "1.5px solid oklch(82% 0.08 145)",
              }}
            >
              <Printer size={13} />
              Print
            </button>
            <button
              type="button"
              data-ocid="report.daily.primary_button"
              onClick={handleDownloadDailyPDF}
              className="h-9 px-3 flex items-center gap-1.5 rounded-xl text-xs font-bold transition-colors"
              style={{ background: "oklch(48% 0.18 145)", color: "white" }}
            >
              <Download size={13} />
              PDF
            </button>
          </div>
        )}
        {period === "weekly" && (
          <div className="flex gap-2">
            <button
              type="button"
              data-ocid="report.weekly.secondary_button"
              onClick={handlePrintWeeklyPDF}
              className="h-9 px-3 flex items-center gap-1.5 rounded-xl text-xs font-bold transition-colors"
              style={{
                background: "oklch(94% 0.04 145)",
                color: "oklch(38% 0.14 145)",
                border: "1.5px solid oklch(82% 0.08 145)",
              }}
            >
              <Printer size={13} />
              Print
            </button>
            <button
              type="button"
              data-ocid="report.weekly.share_button"
              onClick={handleShareWeeklyReport}
              className="h-9 px-3 flex items-center gap-1.5 rounded-xl text-xs font-bold transition-colors"
              style={{
                background: "oklch(94% 0.04 145)",
                color: "oklch(38% 0.14 145)",
                border: "1.5px solid oklch(82% 0.08 145)",
              }}
            >
              <Share2 size={13} />
              Share
            </button>
            <button
              type="button"
              data-ocid="report.weekly.primary_button"
              onClick={handleDownloadWeeklyPDF}
              className="h-9 px-3 flex items-center gap-1.5 rounded-xl text-xs font-bold transition-colors"
              style={{ background: "oklch(38% 0.16 145)", color: "white" }}
            >
              <Download size={13} />
              PDF
            </button>
          </div>
        )}
      </header>

      {/* Period Toggle */}
      <div
        className="px-4 py-4 bg-white"
        style={{ borderBottom: "1px solid oklch(92% 0.04 145)" }}
      >
        <div
          className="flex gap-2 p-1 rounded-2xl"
          style={{ background: "oklch(94% 0.06 145)" }}
        >
          <button
            type="button"
            data-ocid="report.daily.tab"
            onClick={() => setPeriod("daily")}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
            style={{
              background:
                period === "daily" ? "oklch(48% 0.18 145)" : "transparent",
              color: period === "daily" ? "white" : "oklch(45% 0.12 145)",
              boxShadow:
                period === "daily"
                  ? "0 2px 8px oklch(48% 0.18 145 / 0.35)"
                  : "none",
            }}
          >
            Daily
          </button>
          <button
            type="button"
            data-ocid="report.weekly.tab"
            onClick={() => setPeriod("weekly")}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
            style={{
              background:
                period === "weekly" ? "oklch(48% 0.18 145)" : "transparent",
              color: period === "weekly" ? "white" : "oklch(45% 0.12 145)",
              boxShadow:
                period === "weekly"
                  ? "0 2px 8px oklch(48% 0.18 145 / 0.35)"
                  : "none",
            }}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* ── DAILY TAB ── */}
      {period === "daily" && (
        <>
          {/* Date Range Filter */}
          <div
            className="px-4 py-3 bg-white"
            style={{ borderBottom: "1px solid oklch(92% 0.04 145)" }}
          >
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar size={11} style={{ color: "oklch(55% 0.1 145)" }} />
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: "oklch(55% 0.1 145)" }}
                  >
                    From
                  </span>
                </div>
                <input
                  type="date"
                  data-ocid="report.daily.input"
                  value={dailyFrom}
                  onChange={(e) => setDailyFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{
                    background: "oklch(96% 0.03 145)",
                    border: "1.5px solid oklch(85% 0.07 145)",
                    color: "oklch(28% 0.06 145)",
                  }}
                />
              </div>
              <div
                className="w-4 h-[1.5px] rounded flex-shrink-0 mt-4"
                style={{ background: "oklch(75% 0.08 145)" }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar size={11} style={{ color: "oklch(55% 0.1 145)" }} />
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: "oklch(55% 0.1 145)" }}
                  >
                    To
                  </span>
                </div>
                <input
                  type="date"
                  data-ocid="report.daily.input"
                  value={dailyTo}
                  onChange={(e) => setDailyTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{
                    background: "oklch(96% 0.03 145)",
                    border: "1.5px solid oklch(85% 0.07 145)",
                    color: "oklch(28% 0.06 145)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Vehicle Statement Cards */}
          <main className="flex-1 px-4 py-5 pb-16 space-y-4">
            {dailyDeliveries.length === 0 ? (
              <motion.div
                data-ocid="report.daily.empty_state"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 gap-4"
              >
                <div
                  className="h-20 w-20 rounded-3xl flex items-center justify-center"
                  style={{ background: "oklch(92% 0.07 145)" }}
                >
                  <PackageX
                    size={36}
                    style={{ color: "oklch(55% 0.14 145)" }}
                  />
                </div>
                <div className="text-center">
                  <p
                    className="text-base font-bold"
                    style={{ color: "oklch(38% 0.08 145)" }}
                  >
                    No deliveries found
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "oklch(62% 0.06 145)" }}
                  >
                    No deliveries found for this period
                  </p>
                </div>
              </motion.div>
            ) : (
              Array.from(vehicleGroups.entries()).map(
                ([vehicleNumber, group], groupIdx) => {
                  const laborNames = collectLaborNames(group);
                  const dates = [...new Set(group.map((d) => d.date))];
                  const dateLabel =
                    dates.length === 1
                      ? formatLongDate(dates[0])
                      : "Multiple Dates";

                  let totalQty = 0;
                  const laborTotals: Record<string, number> = {};
                  for (const n of laborNames) laborTotals[n] = 0;

                  const grandTotal = group.reduce(
                    (s, d) => s + (d.totalAmount ?? 0),
                    0,
                  );

                  return (
                    <motion.div
                      key={vehicleNumber}
                      data-ocid={`report.daily.item.${groupIdx + 1}`}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: groupIdx * 0.06 }}
                      className="rounded-2xl bg-white shadow-sm overflow-hidden"
                      style={{
                        border: "1.5px solid oklch(85% 0.08 240)",
                      }}
                    >
                      {/* Card Header */}
                      <div
                        className="px-4 pt-4 pb-3"
                        style={{
                          background: "oklch(97% 0.04 240)",
                          borderBottom: "1px solid oklch(88% 0.08 240)",
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div
                            className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: "oklch(30% 0.18 240)" }}
                          >
                            <Truck size={14} className="text-white" />
                          </div>
                          <p
                            className="text-base font-extrabold"
                            style={{ color: "oklch(20% 0.08 240)" }}
                          >
                            Vehicle Statement
                          </p>
                        </div>
                        <div className="flex flex-col gap-0.5 pl-9">
                          <div className="flex items-center gap-1.5">
                            <Calendar
                              size={10}
                              style={{ color: "oklch(38% 0.16 240)" }}
                            />
                            <p
                              className="text-[11px] font-semibold"
                              style={{ color: "oklch(38% 0.16 240)" }}
                            >
                              {dateLabel}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{
                                background: "oklch(88% 0.1 240)",
                                color: "oklch(28% 0.16 240)",
                              }}
                            >
                              {vehicleNumber}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          {/* Table Header */}
                          <thead>
                            <tr>
                              <th
                                className="px-3 py-2.5 text-left font-bold text-white whitespace-nowrap"
                                style={{ background: "#1565c0" }}
                              >
                                Customer
                              </th>
                              <th
                                className="px-3 py-2.5 text-left font-bold text-white whitespace-nowrap"
                                style={{ background: "#1565c0" }}
                              >
                                Address
                              </th>
                              <th
                                className="px-3 py-2.5 text-right font-bold text-white whitespace-nowrap"
                                style={{ background: "#1565c0" }}
                              >
                                Qty
                              </th>
                              <th
                                className="px-3 py-2.5 text-right font-bold text-white whitespace-nowrap"
                                style={{ background: "#1565c0" }}
                              >
                                Trip Rate
                              </th>
                              {laborNames.map((name) => (
                                <th
                                  key={name}
                                  className="px-3 py-2.5 text-right font-bold text-white whitespace-nowrap"
                                  style={{ background: "#1565c0" }}
                                >
                                  {name}
                                </th>
                              ))}
                            </tr>
                          </thead>

                          {/* Data Rows */}
                          <tbody>
                            {group.map((d, rowIdx) => {
                              totalQty += d.totalBricks;
                              const mergedMap = new Map(
                                buildMergedLabors(d).map((l) => [
                                  l.name,
                                  l.amount,
                                ]),
                              );
                              for (const n of laborNames) {
                                laborTotals[n] += mergedMap.get(n) ?? 0;
                              }
                              const rowBg =
                                rowIdx % 2 === 0 ? "#ffffff" : "#f5f9ff";
                              return (
                                <tr key={d.id}>
                                  <td
                                    className="px-3 py-2 font-medium"
                                    style={{
                                      background: rowBg,
                                      color: "oklch(22% 0.06 240)",
                                    }}
                                  >
                                    {d.customerName}
                                  </td>
                                  <td
                                    className="px-3 py-2 text-xs"
                                    style={{
                                      background: rowBg,
                                      color: "oklch(45% 0.06 240)",
                                    }}
                                  >
                                    {d.address}
                                  </td>
                                  <td
                                    className="px-3 py-2 text-right"
                                    style={{
                                      background: rowBg,
                                      color: "oklch(30% 0.08 240)",
                                    }}
                                  >
                                    {d.totalBricks}
                                  </td>
                                  <td
                                    className="px-3 py-2 text-right"
                                    style={{
                                      background: rowBg,
                                      color: "oklch(30% 0.08 240)",
                                    }}
                                  >
                                    {d.totalAmount !== undefined &&
                                    d.totalAmount > 0
                                      ? `₹${d.totalAmount.toFixed(2)}`
                                      : "—"}
                                  </td>
                                  {laborNames.map((name) => {
                                    const amt = mergedMap.get(name) ?? 0;
                                    return (
                                      <td
                                        key={name}
                                        className="px-3 py-2 text-right"
                                        style={{
                                          background: rowBg,
                                          color:
                                            amt > 0
                                              ? "oklch(30% 0.18 145)"
                                              : "oklch(65% 0.04 240)",
                                        }}
                                      >
                                        {amt > 0 ? `₹${amt.toFixed(2)}` : "—"}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}

                            {/* Total Row */}
                            <tr
                              style={{
                                background: "oklch(93% 0.05 240)",
                                borderTop: "1.5px solid oklch(82% 0.1 240)",
                              }}
                            >
                              <td
                                colSpan={2}
                                className="px-3 py-2.5 font-extrabold"
                                style={{ color: "oklch(22% 0.08 240)" }}
                              >
                                Total:
                              </td>
                              <td
                                className="px-3 py-2.5 text-right font-extrabold"
                                style={{ color: "oklch(22% 0.08 240)" }}
                              >
                                {totalQty}
                              </td>
                              {/* Trip Rate total – intentionally blank */}
                              <td className="px-3 py-2.5" />
                              {laborNames.map((name) => (
                                <td
                                  key={name}
                                  className="px-3 py-2.5 text-right font-extrabold"
                                  style={{ color: "#1565c0" }}
                                >
                                  {laborTotals[name] > 0
                                    ? `₹${laborTotals[name].toFixed(2)}`
                                    : "—"}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Grand Total Banner */}
                      <div
                        className="flex items-center justify-between px-4 py-3"
                        style={{ background: "#1565c0" }}
                      >
                        <span className="text-sm font-extrabold text-white">
                          Grand Total:
                        </span>
                        <span className="text-sm font-extrabold text-white">
                          {grandTotal > 0 ? `₹${grandTotal.toFixed(2)}` : "—"}
                        </span>
                      </div>
                    </motion.div>
                  );
                },
              )
            )}
          </main>
        </>
      )}

      {/* ── WEEKLY TAB ── */}
      {period === "weekly" && (
        <>
          {/* Weekly Date Range Filter */}
          <div
            className="px-4 py-3 bg-white"
            style={{ borderBottom: "1px solid oklch(92% 0.04 145)" }}
          >
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar
                    size={11}
                    style={{ color: "oklch(45% 0.14 145)" }}
                  />
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: "oklch(45% 0.14 145)" }}
                  >
                    From
                  </span>
                </div>
                <input
                  type="date"
                  data-ocid="report.weekly.from_input"
                  value={weeklyFrom}
                  onChange={(e) => setWeeklyFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{
                    background: "oklch(96% 0.03 145)",
                    border: "1.5px solid oklch(85% 0.07 145)",
                    color: "oklch(28% 0.06 145)",
                  }}
                />
              </div>
              <div
                className="w-4 h-[1.5px] rounded flex-shrink-0 mt-4"
                style={{ background: "oklch(75% 0.08 145)" }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar
                    size={11}
                    style={{ color: "oklch(45% 0.14 145)" }}
                  />
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: "oklch(45% 0.14 145)" }}
                  >
                    To
                  </span>
                </div>
                <input
                  type="date"
                  data-ocid="report.weekly.to_input"
                  value={weeklyTo}
                  onChange={(e) => setWeeklyTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{
                    background: "oklch(96% 0.03 145)",
                    border: "1.5px solid oklch(85% 0.07 145)",
                    color: "oklch(28% 0.06 145)",
                  }}
                />
              </div>
            </div>
          </div>

          <main className="flex-1 px-4 py-5 pb-20">
            {weeklyCompleteDeliveries.length === 0 ? (
              <motion.div
                data-ocid="report.weekly.empty_state"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 gap-4"
              >
                <div
                  className="h-20 w-20 rounded-3xl flex items-center justify-center"
                  style={{ background: "oklch(92% 0.07 145)" }}
                >
                  <PackageX
                    size={36}
                    style={{ color: "oklch(55% 0.14 145)" }}
                  />
                </div>
                <div className="text-center">
                  <p
                    className="text-base font-bold"
                    style={{ color: "oklch(38% 0.08 145)" }}
                  >
                    No deliveries found for this period
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "oklch(62% 0.06 145)" }}
                  >
                    No deliveries found for this period
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Section Title */}
                <div className="flex items-center gap-2">
                  <Users size={14} style={{ color: "oklch(38% 0.16 145)" }} />
                  <p
                    className="text-[11px] font-extrabold uppercase tracking-widest"
                    style={{ color: "oklch(38% 0.16 145)" }}
                  >
                    Lebour Account (By Date)
                  </p>
                </div>

                {/* Ledger Table */}
                <div
                  data-ocid="report.weekly.table"
                  className="overflow-x-auto rounded-xl shadow-sm"
                  style={{ border: "1.5px solid #c8e6c9" }}
                >
                  <table
                    style={{
                      borderCollapse: "collapse",
                      width: "100%",
                      minWidth: `${Math.max(400, 120 + weeklyDateKeys.length * 90)}px`,
                      fontSize: "12px",
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            background: "#1b5e20",
                            color: "white",
                            border: "1px solid #388e3c",
                            padding: "8px 12px",
                            textAlign: "left",
                            whiteSpace: "nowrap",
                            fontWeight: 800,
                            position: "sticky",
                            left: 0,
                            zIndex: 2,
                          }}
                        >
                          Name
                        </th>
                        {weeklyDateKeys.map((dk) => {
                          const [yyyy, mm, dd] = dk.split("-");
                          return (
                            <th
                              key={dk}
                              style={{
                                background: "#1b5e20",
                                color: "white",
                                border: "1px solid #388e3c",
                                padding: "8px 10px",
                                textAlign: "center",
                                whiteSpace: "nowrap",
                                fontWeight: 700,
                              }}
                            >
                              {dd}/{mm}/{yyyy.slice(2)}
                            </th>
                          );
                        })}
                        <th
                          style={{
                            background: "#2e7d32",
                            color: "white",
                            border: "1px solid #388e3c",
                            padding: "8px 12px",
                            textAlign: "right",
                            whiteSpace: "nowrap",
                            fontWeight: 800,
                          }}
                        >
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyLaborNames.map((name, ri) => (
                        <tr
                          key={name}
                          style={{
                            background: ri % 2 === 0 ? "white" : "#f9fbe7",
                          }}
                        >
                          <td
                            style={{
                              border: "1px solid #c8e6c9",
                              padding: "7px 12px",
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                              color: "#1b5e20",
                              position: "sticky",
                              left: 0,
                              background: ri % 2 === 0 ? "white" : "#f9fbe7",
                              zIndex: 1,
                            }}
                          >
                            {name}
                          </td>
                          {weeklyDateKeys.map((dk) => {
                            const row = weeklyDateRows.find(
                              (r) => r.date === dk,
                            );
                            const amt = row?.laborAmts[name] ?? 0;
                            return (
                              <td
                                key={dk}
                                style={{
                                  border: "1px solid #c8e6c9",
                                  padding: "7px 10px",
                                  textAlign: "center",
                                  color: amt > 0 ? "#2e7d32" : "#bbb",
                                  fontWeight: amt > 0 ? 600 : 400,
                                }}
                              >
                                {amt > 0 ? `₹${amt.toFixed(2)}` : "NIL"}
                              </td>
                            );
                          })}
                          <td
                            style={{
                              border: "1px solid #c8e6c9",
                              padding: "7px 12px",
                              background: "#e8f5e9",
                              fontWeight: 800,
                              textAlign: "right",
                              color: "#1b5e20",
                              whiteSpace: "nowrap",
                            }}
                          >
                            ₹{(weeklyColTotals[name] ?? 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: "#1b5e20", color: "white" }}>
                        <td
                          style={{
                            border: "1px solid #388e3c",
                            padding: "8px 12px",
                            fontWeight: 800,
                            whiteSpace: "nowrap",
                            position: "sticky",
                            left: 0,
                            background: "#1b5e20",
                            zIndex: 1,
                          }}
                        >
                          GRAND TOTAL
                        </td>
                        <td
                          colSpan={weeklyDateKeys.length}
                          style={{
                            border: "1px solid #388e3c",
                            padding: "8px 10px",
                            textAlign: "center",
                            color: "rgba(255,255,255,0.6)",
                            fontSize: "11px",
                          }}
                        >
                          {weeklyDateKeys.length} days
                        </td>
                        <td
                          style={{
                            border: "1px solid #388e3c",
                            padding: "8px 12px",
                            fontWeight: 800,
                            textAlign: "right",
                            color: "white",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ₹{weeklyGrandTotal.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Stat strip */}
                <div className="grid grid-cols-3 gap-2">
                  <div
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: "white",
                      border: "1.5px solid oklch(88% 0.07 145)",
                    }}
                  >
                    <p
                      className="text-lg font-extrabold"
                      style={{ color: "oklch(28% 0.1 145)" }}
                    >
                      {weeklyCompleteDeliveries.length}
                    </p>
                    <p
                      className="text-[9px] font-bold uppercase tracking-wide mt-0.5"
                      style={{ color: "oklch(52% 0.1 145)" }}
                    >
                      Deliveries
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: "white",
                      border: "1.5px solid oklch(88% 0.07 145)",
                    }}
                  >
                    <p
                      className="text-lg font-extrabold"
                      style={{ color: "oklch(28% 0.1 145)" }}
                    >
                      {weeklyDateRows.length}
                    </p>
                    <p
                      className="text-[9px] font-bold uppercase tracking-wide mt-0.5"
                      style={{ color: "oklch(52% 0.1 145)" }}
                    >
                      Days
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: "white",
                      border: "1.5px solid oklch(88% 0.07 145)",
                    }}
                  >
                    <p
                      className="text-lg font-extrabold"
                      style={{ color: "oklch(28% 0.1 145)" }}
                    >
                      {weeklyLaborNames.length}
                    </p>
                    <p
                      className="text-[9px] font-bold uppercase tracking-wide mt-0.5"
                      style={{ color: "oklch(52% 0.1 145)" }}
                    >
                      Lebours
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </main>
        </>
      )}
    </div>
  );
}
