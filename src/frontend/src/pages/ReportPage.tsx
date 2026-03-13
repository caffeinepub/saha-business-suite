import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  Download,
  PackageX,
  Printer,
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
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
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

    const dateCardsHtml = weeklyDateRows
      .map((row) => {
        const activeLabours = weeklyLaborNames.filter(
          (n) => (row.laborAmts[n] ?? 0) > 0,
        );
        const dayTotal = Object.values(row.laborAmts).reduce(
          (s, v) => s + v,
          0,
        );
        const rows = activeLabours
          .map(
            (n) =>
              `<div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid #e8f5e9">
          <span style="color:#1b5e20;font-size:13px">${n}</span>
          <span style="font-weight:700;color:#2e7d32;font-size:13px">₹${(row.laborAmts[n] ?? 0).toFixed(2)}</span>
        </div>`,
          )
          .join("");
        return `<div style="border:1.5px solid #c8e6c9;border-radius:12px;overflow:hidden;margin-bottom:12px;break-inside:avoid">
        <div style="background:#2e7d32;color:#fff;padding:9px 14px;font-weight:800;font-size:13px;-webkit-print-color-adjust:exact;print-color-adjust:exact">📅 ${formatDisplayDate(row.date)}</div>
        ${rows}
        <div style="display:flex;justify-content:space-between;padding:7px 14px;background:#e8f5e9;font-weight:800;-webkit-print-color-adjust:exact;print-color-adjust:exact">
          <span style="color:#1b5e20">Day Total</span>
          <span style="color:#1b5e20">₹${dayTotal.toFixed(2)}</span>
        </div>
      </div>`;
      })
      .join("");

    const summaryRows = weeklyLaborNames
      .map(
        (n) =>
          `<div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid #e8f5e9">
        <span style="color:#1b5e20;font-weight:700;font-size:13px">${n}</span>
        <span style="font-weight:800;color:#2e7d32;font-size:13px">₹${(weeklyColTotals[n] ?? 0).toFixed(2)}</span>
      </div>`,
      )
      .join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SAHA Weekly Lebour Report</title>
      <style>
        @page { size: A4 portrait; margin: 1cm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; }
        @media print { body { background: white; } }
        @media screen { body { padding: 20px; background: #f3f4f6; } .content { background: white; max-width: 210mm; margin: 0 auto; padding: 20px; } }
      </style>
      </head><body>
      <div class="content">
        <h2 style="color:#1b5e20;margin-bottom:4px">SAHA – Weekly Lebour Report</h2>
        <p style="color:#555;font-size:13px;margin-bottom:16px">${periodLabel} &nbsp;|&nbsp; ${weeklyDateRows.length} days &nbsp;|&nbsp; ${weeklyCompleteDeliveries.length} deliveries</p>
        ${dateCardsHtml}
        <div style="background:#2e7d32;color:#fff;padding:12px 20px;border-radius:10px;margin-top:8px;display:flex;justify-content:space-between;font-size:15px;font-weight:800;-webkit-print-color-adjust:exact;print-color-adjust:exact">
          <span>Grand Total (Lebour)</span>
          <span>${weeklyGrandTotal > 0 ? `₹${weeklyGrandTotal.toFixed(2)}` : "—"}</span>
        </div>
        <div style="border:1.5px solid #c8e6c9;border-radius:12px;overflow:hidden;margin-top:16px">
          <div style="background:#1b5e20;color:#fff;padding:9px 14px;font-weight:800;font-size:13px;-webkit-print-color-adjust:exact;print-color-adjust:exact">Lebour Summary</div>
          ${summaryRows}
        </div>
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
    y += 4;
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(0.6);
    doc.line(margin, y, pw - margin, y);
    y += 8;

    for (const row of weeklyDateRows) {
      const activeLabours = weeklyLaborNames.filter(
        (n) => (row.laborAmts[n] ?? 0) > 0,
      );
      const dayTotal = activeLabours.reduce(
        (s, n) => s + (row.laborAmts[n] ?? 0),
        0,
      );
      const cardH = 10 + activeLabours.length * 8 + 10;
      if (y + cardH > 270) {
        doc.addPage();
        y = 20;
      }

      // Date header (dark green)
      doc.setFillColor(46, 125, 50);
      doc.roundedRect(margin, y, pw - margin * 2, 9, 2, 2, "F");
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(`${formatDisplayDate(row.date)}`, margin + 3, y + 6);
      y += 9;

      // Lebour rows
      for (const name of activeLabours) {
        const amt = row.laborAmts[name] ?? 0;
        doc.setFillColor(255, 255, 255);
        doc.rect(margin, y, pw - margin * 2, 7, "F");
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(27, 94, 32);
        doc.text(name, margin + 3, y + 5);
        doc.setFont("helvetica", "bold");
        doc.text(`Rs.${amt.toFixed(2)}`, pw - margin - 3, y + 5, {
          align: "right",
        });
        y += 7;
      }

      // Day Total row
      doc.setFillColor(232, 245, 233);
      doc.rect(margin, y, pw - margin * 2, 8, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(27, 94, 32);
      doc.text("Day Total", margin + 3, y + 5.5);
      doc.text(`Rs.${dayTotal.toFixed(2)}`, pw - margin - 3, y + 5.5, {
        align: "right",
      });
      y += 10;
    }

    // Grand Total banner
    if (y + 12 > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(46, 125, 50);
    doc.roundedRect(margin, y, pw - margin * 2, 10, 2, 2, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Grand Total (Lebour)", margin + 3, y + 7);
    doc.text(
      weeklyGrandTotal > 0 ? `Rs.${weeklyGrandTotal.toFixed(2)}` : "0.00",
      pw - margin - 3,
      y + 7,
      { align: "right" },
    );
    y += 14;

    // Lebour Summary
    if (y + 12 + weeklyLaborNames.length * 7 > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(27, 94, 32);
    doc.roundedRect(margin, y, pw - margin * 2, 9, 2, 2, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Lebour Summary", margin + 3, y + 6);
    y += 9;
    for (const name of weeklyLaborNames) {
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, y, pw - margin * 2, 7, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(27, 94, 32);
      doc.text(name, margin + 3, y + 5);
      doc.text(
        `Rs.${(weeklyColTotals[name] ?? 0).toFixed(2)}`,
        pw - margin - 3,
        y + 5,
        { align: "right" },
      );
      y += 7;
    }

    doc.save("saha-weekly-report.pdf");
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

                {/* Vertical Date Cards */}
                <div data-ocid="report.weekly.table" className="space-y-3">
                  {weeklyDateRows.map((row, ri) => {
                    const activeLabours = weeklyLaborNames.filter(
                      (n) => (row.laborAmts[n] ?? 0) > 0,
                    );
                    const dayTotal = activeLabours.reduce(
                      (s, n) => s + (row.laborAmts[n] ?? 0),
                      0,
                    );
                    return (
                      <div
                        key={row.date}
                        data-ocid={`report.weekly.date_card.${ri + 1}`}
                        className="rounded-2xl overflow-hidden shadow-sm"
                        style={{ border: "1.5px solid oklch(82% 0.1 145)" }}
                      >
                        {/* Date Header */}
                        <div
                          className="px-4 py-2.5 flex items-center gap-2"
                          style={{ background: "oklch(35% 0.1 145)" }}
                        >
                          <Calendar
                            size={13}
                            className="text-white opacity-80"
                          />
                          <span className="text-sm font-extrabold text-white">
                            {formatDisplayDate(row.date)}
                          </span>
                        </div>
                        {/* Lebour rows */}
                        <div
                          className="bg-white divide-y"
                          style={{ borderColor: "oklch(92% 0.05 145)" }}
                        >
                          {activeLabours.length === 0 ? (
                            <p
                              className="px-4 py-3 text-xs"
                              style={{ color: "oklch(60% 0.06 145)" }}
                            >
                              No lebour records
                            </p>
                          ) : (
                            activeLabours.map((name) => (
                              <div
                                key={name}
                                className="flex items-center justify-between px-4 py-2.5"
                              >
                                <span
                                  className="text-sm font-semibold"
                                  style={{ color: "oklch(28% 0.1 145)" }}
                                >
                                  {name}
                                </span>
                                <span
                                  className="text-sm font-bold"
                                  style={{ color: "oklch(35% 0.16 145)" }}
                                >
                                  ₹{(row.laborAmts[name] ?? 0).toFixed(2)}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                        {/* Day Total */}
                        <div
                          className="flex items-center justify-between px-4 py-2.5"
                          style={{
                            background: "oklch(93% 0.07 145)",
                            borderTop: "1.5px solid oklch(82% 0.1 145)",
                          }}
                        >
                          <span
                            className="text-xs font-extrabold uppercase tracking-wide"
                            style={{ color: "oklch(28% 0.1 145)" }}
                          >
                            Day Total
                          </span>
                          <span
                            className="text-sm font-extrabold"
                            style={{ color: "oklch(28% 0.12 145)" }}
                          >
                            ₹{dayTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Grand Total Banner */}
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-2xl"
                  style={{ background: "oklch(35% 0.1 145)" }}
                >
                  <span className="text-sm font-extrabold text-white">
                    Grand Total (Lebour)
                  </span>
                  <span className="text-lg font-extrabold text-white">
                    {weeklyGrandTotal > 0
                      ? `₹${weeklyGrandTotal.toFixed(2)}`
                      : "—"}
                  </span>
                </div>

                {/* Lebour Summary */}
                <div
                  className="rounded-2xl overflow-hidden shadow-sm"
                  style={{ border: "1.5px solid oklch(82% 0.1 145)" }}
                >
                  <div
                    className="px-4 py-2.5"
                    style={{ background: "oklch(28% 0.1 145)" }}
                  >
                    <span className="text-sm font-extrabold text-white">
                      Lebour Summary
                    </span>
                  </div>
                  <div
                    className="bg-white divide-y"
                    style={{ borderColor: "oklch(92% 0.05 145)" }}
                  >
                    {weeklyLaborNames.map((name) => (
                      <div
                        key={name}
                        className="flex items-center justify-between px-4 py-2.5"
                      >
                        <span
                          className="text-sm font-bold"
                          style={{ color: "oklch(28% 0.1 145)" }}
                        >
                          {name}
                        </span>
                        <span
                          className="text-sm font-extrabold"
                          style={{ color: "oklch(35% 0.16 145)" }}
                        >
                          ₹{(weeklyColTotals[name] ?? 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
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
