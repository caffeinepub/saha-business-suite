import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Download,
  IndianRupee,
  Layers,
  Package,
  PackageX,
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

function inWeek(dateStr: string): boolean {
  const { start, end } = getWeekRange();
  return dateStr >= start && dateStr <= end;
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

  const dailyDeliveries = completeDeliveries.filter((d) => {
    if (dailyFrom && d.date < dailyFrom) return false;
    if (dailyTo && d.date > dailyTo) return false;
    return true;
  });

  const weeklyCompleteDeliveries = completeDeliveries.filter((d) =>
    inWeek(d.date),
  );
  const weeklyPendingDeliveries = pendingDeliveries.filter((d) =>
    inWeek(d.date),
  );

  const weeklyTotalBricks =
    weeklyPendingDeliveries.reduce((s, d) => s + d.totalBricks, 0) +
    weeklyCompleteDeliveries.reduce((s, d) => s + d.totalBricks, 0);

  const weeklyTotalAmount = weeklyCompleteDeliveries.reduce(
    (s, d) => s + (d.totalAmount ?? 0),
    0,
  );

  const weeklyAggregatedLabors = (() => {
    const map = new Map<string, number>();
    for (const d of weeklyCompleteDeliveries) {
      for (const { name, amount } of buildMergedLabors(d)) {
        map.set(name, (map.get(name) ?? 0) + amount);
      }
    }
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  })();

  function handleDownloadDailyPDF() {
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

    const grouped = groupByVehicle(dailyDeliveries);
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
      <style>body{font-family:sans-serif;margin:20px;color:#222}</style>
      </head><body>
      <h2 style="color:#1a237e;margin-bottom:4px">SAHA – Daily Report</h2>
      <p style="color:#666;font-size:13px;margin-bottom:16px">${periodLabel} &nbsp;|&nbsp; ${dailyDeliveries.length} deliveries</p>
      ${tablesHtml}
      <p style="color:#aaa;font-size:11px;text-align:center;margin-top:24px">SAHA Business Suite</p>
      </body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "saha-daily-report.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const weeklyHasData =
    weeklyPendingDeliveries.length > 0 || weeklyCompleteDeliveries.length > 0;

  // Group daily deliveries by vehicle
  const vehicleGroups = groupByVehicle(dailyDeliveries);

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
              {period === "daily"
                ? "Daily Report"
                : `${week.start} – ${week.end}`}
            </p>
          </div>
        </div>
        {period === "daily" && (
          <button
            type="button"
            data-ocid="report.daily.primary_button"
            onClick={handleDownloadDailyPDF}
            className="h-9 px-3 flex items-center gap-1.5 rounded-xl text-xs font-bold transition-colors"
            style={{ background: "oklch(48% 0.18 145)", color: "white" }}
          >
            <Download size={14} />
            PDF
          </button>
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
                    কোনো ডেলিভারি নেই
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "oklch(62% 0.06 145)" }}
                  >
                    No deliveries found for this date range
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
        <main className="flex-1 px-4 py-5 pb-20 space-y-5">
          {!weeklyHasData ? (
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
                <PackageX size={36} style={{ color: "oklch(55% 0.14 145)" }} />
              </div>
              <div className="text-center">
                <p
                  className="text-base font-bold"
                  style={{ color: "oklch(38% 0.08 145)" }}
                >
                  এই সপ্তাহে কোনো ডেলিভারি নেই
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: "oklch(62% 0.06 145)" }}
                >
                  No deliveries found for this week
                </p>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Summary Cards */}
              <div>
                <p
                  className="text-[10px] font-extrabold uppercase tracking-widest mb-3 px-0.5"
                  style={{ color: "oklch(55% 0.1 145)" }}
                >
                  Summary
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <motion.div
                    data-ocid="report.weekly.card"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="rounded-2xl p-4 shadow-sm"
                    style={{
                      background: "oklch(96% 0.08 55)",
                      border: "1.5px solid oklch(88% 0.1 55)",
                    }}
                  >
                    <div
                      className="h-8 w-8 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: "oklch(80% 0.12 55)" }}
                    >
                      <Package
                        size={16}
                        style={{ color: "oklch(40% 0.18 55)" }}
                      />
                    </div>
                    <p
                      className="text-[28px] font-extrabold leading-none font-display"
                      style={{ color: "oklch(28% 0.06 55)" }}
                    >
                      {weeklyPendingDeliveries.length || "—"}
                    </p>
                    <p
                      className="text-[9px] font-bold uppercase tracking-wide mt-1"
                      style={{ color: "oklch(42% 0.12 55)" }}
                    >
                      PENDING
                    </p>
                  </motion.div>

                  <motion.div
                    data-ocid="report.weekly.card"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-2xl p-4 shadow-sm"
                    style={{
                      background: "oklch(95% 0.08 145)",
                      border: "1.5px solid oklch(86% 0.1 145)",
                    }}
                  >
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center mb-3"
                      style={{ background: "oklch(58% 0.18 145)" }}
                    >
                      <CheckCircle2 size={16} className="text-white" />
                    </div>
                    <p
                      className="text-[28px] font-extrabold leading-none font-display"
                      style={{ color: "oklch(28% 0.06 145)" }}
                    >
                      {weeklyCompleteDeliveries.length || "—"}
                    </p>
                    <p
                      className="text-[9px] font-bold uppercase tracking-wide mt-1"
                      style={{ color: "oklch(40% 0.12 145)" }}
                    >
                      COMPLETED
                    </p>
                  </motion.div>

                  <motion.div
                    data-ocid="report.weekly.card"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="rounded-2xl p-4 shadow-sm"
                    style={{
                      background: "oklch(94% 0.07 240)",
                      border: "1.5px solid oklch(85% 0.09 240)",
                    }}
                  >
                    <div
                      className="h-8 w-8 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: "oklch(76% 0.12 240)" }}
                    >
                      <Layers
                        size={16}
                        style={{ color: "oklch(38% 0.16 240)" }}
                      />
                    </div>
                    <p
                      className="text-[24px] font-extrabold leading-none font-display"
                      style={{ color: "oklch(28% 0.06 240)" }}
                    >
                      {weeklyTotalBricks > 0
                        ? weeklyTotalBricks.toLocaleString()
                        : "—"}
                    </p>
                    <p
                      className="text-[9px] font-bold uppercase tracking-wide mt-1"
                      style={{ color: "oklch(40% 0.12 240)" }}
                    >
                      TOTAL BRICKS
                    </p>
                  </motion.div>

                  <motion.div
                    data-ocid="report.weekly.card"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-2xl p-4 shadow-sm"
                    style={{
                      background: "oklch(95% 0.08 160)",
                      border: "1.5px solid oklch(85% 0.09 160)",
                    }}
                  >
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center mb-3"
                      style={{ background: "oklch(40% 0.14 160)" }}
                    >
                      <IndianRupee size={16} className="text-white" />
                    </div>
                    <p
                      className="text-[22px] font-extrabold leading-none font-display"
                      style={{ color: "oklch(28% 0.06 160)" }}
                    >
                      {weeklyTotalAmount > 0
                        ? `৳${Math.round(weeklyTotalAmount).toLocaleString()}`
                        : "—"}
                    </p>
                    <p
                      className="text-[9px] font-bold uppercase tracking-wide mt-1"
                      style={{ color: "oklch(40% 0.12 160)" }}
                    >
                      TOTAL AMOUNT
                    </p>
                  </motion.div>
                </div>
              </div>

              {/* Labor Payment Summary */}
              {weeklyAggregatedLabors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={13} style={{ color: "oklch(48% 0.14 145)" }} />
                    <p
                      className="text-[10px] font-extrabold uppercase tracking-widest"
                      style={{ color: "oklch(48% 0.14 145)" }}
                    >
                      Labor Payment Summary
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {weeklyAggregatedLabors.map((labor, idx) => (
                      <motion.div
                        // biome-ignore lint/suspicious/noArrayIndexKey: stable index
                        key={`labor-${idx}`}
                        data-ocid={`report.weekly.item.${idx + 1}`}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.28 + idx * 0.04 }}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                        style={{
                          background: "white",
                          border: "1.5px solid oklch(90% 0.05 145)",
                        }}
                      >
                        <span
                          className="text-xs font-semibold truncate mr-1"
                          style={{ color: "oklch(35% 0.06 145)" }}
                        >
                          {labor.name}
                        </span>
                        <span
                          className="text-xs font-extrabold flex-shrink-0"
                          style={{ color: "oklch(32% 0.16 145)" }}
                        >
                          {labor.amount > 0
                            ? `৳${labor.amount.toFixed(2)}`
                            : "—"}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </main>
      )}
    </div>
  );
}
