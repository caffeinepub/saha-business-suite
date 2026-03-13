import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  ChevronLeft,
  Download,
  Layers,
  MapPin,
  PackageX,
  Truck,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { CompleteDelivery } from "../types/delivery";

interface Props {
  deliveries: CompleteDelivery[];
  onBack: () => void;
}

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

type LaborEntry = { name: string; amount: number };

export default function CompleteList({ deliveries, onBack }: Props) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filtered = deliveries.filter((d) => {
    if (fromDate && d.date < fromDate) return false;
    if (toDate && d.date > toDate) return false;
    return true;
  });

  function buildLabors(d: CompleteDelivery): LaborEntry[] {
    return [
      ...d.loadingLaborNames.map((name) => ({
        name,
        amount: d.perLoadingLaborAmount || 0,
      })),
      ...d.unloadingLaborNames.map((name) => ({
        name,
        amount: d.perUnloadingLaborAmount || 0,
      })),
    ];
  }

  function handleDownloadPDF() {
    const periodLabel =
      fromDate && toDate
        ? `Period: ${formatDisplayDate(fromDate)} – ${formatDisplayDate(toDate)}`
        : fromDate
          ? `From: ${formatDisplayDate(fromDate)}`
          : toDate
            ? `To: ${formatDisplayDate(toDate)}`
            : "All Deliveries";

    const cardsHtml = filtered
      .map((d) => {
        const labors = buildLabors(d);
        const laborHtml =
          labors.length > 0
            ? `<div class="labor-section">
    <div class="labor-title">Labor Details</div>
    <div class="labor-grid">
      ${labors
        .map(
          (l) =>
            `<div class="labor-item"><span class="labor-name">${l.name}</span><span class="labor-amount">${l.amount > 0 ? `\u09f3${l.amount.toLocaleString()}` : "\u2014"}</span></div>`,
        )
        .join("")}
    </div>
  </div>`
            : "";
        const amountBadge =
          d.totalAmount && d.totalAmount > 0
            ? `<span class="amount-badge">\u09f3${Math.round(d.totalAmount).toLocaleString()}</span>`
            : "";
        return `<div class="card">
  <div class="card-header"><span class="customer">${d.customerName}</span>${amountBadge}</div>
  <div class="meta"><span>Date: ${d.date}</span><span>Vehicle: ${d.vehicleNumber}</span><span>${d.totalBricks} Bricks</span><span>${d.locationType}</span></div>
  ${laborHtml}
  <div class="footer-row"><span>Address: ${d.address}</span><span>Type: ${d.locationType}</span></div>
</div>`;
      })
      .join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Complete Delivery List \u2014 SAHA</title>
<style>
  body { font-family: Arial, sans-serif; padding: 20px; color: #222; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .subtitle { font-size: 12px; color: #666; margin-bottom: 16px; }
  .card { border: 1.5px solid #ddd; border-radius: 10px; padding: 14px; margin-bottom: 14px; page-break-inside: avoid; }
  .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .customer { font-size: 16px; font-weight: bold; }
  .amount-badge { background: #e6f4ea; color: #1a7a38; font-weight: bold; padding: 3px 10px; border-radius: 20px; font-size: 13px; }
  .meta { font-size: 11px; color: #555; margin-bottom: 8px; display: flex; gap: 10px; flex-wrap: wrap; }
  .labor-section { margin-top: 8px; }
  .labor-title { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #555; margin-bottom: 6px; }
  .labor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .labor-item { border: 1px solid #ddd; border-radius: 6px; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
  .labor-name { font-weight: 500; }
  .labor-amount { font-weight: bold; color: #1a7a38; }
  .footer-row { display: flex; justify-content: space-between; font-size: 11px; color: #666; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; }
  @media print { body { padding: 10px; } }
</style></head><body>
<h1>SAHA \u2014 Complete Delivery List</h1>
<div class="subtitle">${periodLabel} &nbsp;|&nbsp; Total: ${filtered.length} deliveries</div>
${cardsHtml}
</body></html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  }

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
          data-ocid="complete-list.button"
          onClick={onBack}
          className="h-9 w-9 flex items-center justify-center rounded-full transition-colors"
          style={{ background: "oklch(93% 0.06 145)" }}
        >
          <ChevronLeft size={20} style={{ color: "oklch(40% 0.18 145)" }} />
        </button>
        <div className="flex-1">
          <h2
            className="text-lg font-extrabold font-display leading-tight"
            style={{ color: "oklch(28% 0.06 145)" }}
          >
            Complete List
          </h2>
          <p
            className="text-[11px] font-medium"
            style={{ color: "oklch(58% 0.08 145)" }}
          >
            {filtered.length} টি সম্পন্ন ডেলিভারি
          </p>
        </div>
        <button
          type="button"
          data-ocid="complete-list.primary_button"
          onClick={handleDownloadPDF}
          className="h-9 px-3 flex items-center gap-1.5 rounded-xl text-xs font-bold transition-colors"
          style={{ background: "oklch(48% 0.18 145)", color: "white" }}
        >
          <Download size={14} />
          PDF
        </button>
      </header>

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
              data-ocid="complete-list.input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
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
              data-ocid="complete-list.input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
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

      {/* List */}
      <main className="flex-1 px-4 py-5 pb-16 space-y-3">
        {filtered.length === 0 ? (
          <motion.div
            data-ocid="complete-list.empty_state"
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
                কোনো সম্পন্ন ডেলিভারি নেই
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "oklch(62% 0.06 145)" }}
              >
                No completed deliveries yet
              </p>
            </div>
          </motion.div>
        ) : (
          filtered.map((d, idx) => {
            const allLabors = buildLabors(d);

            return (
              <motion.div
                key={d.id}
                data-ocid={`complete-list.item.${idx + 1}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-2xl bg-white p-4 shadow-sm"
                style={{ border: "1.5px solid oklch(90% 0.05 145)" }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className="text-base font-extrabold"
                        style={{ color: "oklch(22% 0.05 145)" }}
                      >
                        {d.customerName}
                      </p>
                      {d.totalAmount !== undefined && d.totalAmount > 0 && (
                        <span
                          className="text-sm font-extrabold px-2.5 py-0.5 rounded-full"
                          style={{
                            background: "oklch(90% 0.12 145)",
                            color: "oklch(32% 0.18 145)",
                          }}
                        >
                          ৳{Math.round(d.totalAmount).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span
                        className="flex items-center gap-1 text-[11px]"
                        style={{ color: "oklch(55% 0.06 145)" }}
                      >
                        <Calendar size={10} />
                        {d.date}
                      </span>
                      <span
                        className="flex items-center gap-1 text-[11px]"
                        style={{ color: "oklch(55% 0.06 145)" }}
                      >
                        <Truck size={10} />
                        {d.vehicleNumber}
                      </span>
                      <span
                        className="flex items-center gap-1 text-[11px]"
                        style={{ color: "oklch(55% 0.06 145)" }}
                      >
                        <Layers size={10} />
                        {d.totalBricks} Bricks
                      </span>
                    </div>
                  </div>
                  <Badge
                    className="rounded-full text-[10px] font-bold px-2.5 py-0.5 flex-shrink-0"
                    style={{
                      background:
                        d.locationType === "Local"
                          ? "oklch(92% 0.1 145)"
                          : "oklch(91% 0.08 55)",
                      color:
                        d.locationType === "Local"
                          ? "oklch(38% 0.18 145)"
                          : "oklch(40% 0.16 55)",
                    }}
                  >
                    {d.locationType}
                  </Badge>
                </div>

                {/* Labor Details */}
                {allLabors.length > 0 && (
                  <div
                    className="mt-3 pt-3"
                    style={{ borderTop: "1px solid oklch(93% 0.04 145)" }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users
                        size={11}
                        style={{ color: "oklch(50% 0.12 145)" }}
                      />
                      <p
                        className="text-[10px] font-extrabold uppercase tracking-widest"
                        style={{ color: "oklch(50% 0.12 145)" }}
                      >
                        Labor Details
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {allLabors.map((labor, li) => (
                        <div
                          // biome-ignore lint/suspicious/noArrayIndexKey: stable index
                          key={`labor-${li}`}
                          className="flex items-center justify-between px-3 py-2 rounded-xl"
                          style={{
                            border: "1px solid oklch(90% 0.05 145)",
                            background: "oklch(98% 0.01 145)",
                          }}
                        >
                          <span
                            className="text-xs font-medium"
                            style={{ color: "oklch(35% 0.06 145)" }}
                          >
                            {labor.name}
                          </span>
                          <span
                            className="text-xs font-extrabold"
                            style={{ color: "oklch(32% 0.16 145)" }}
                          >
                            {labor.amount > 0
                              ? `৳${labor.amount.toLocaleString()}`
                              : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div
                  className="flex items-center justify-between pt-2.5 mt-2 flex-wrap gap-1"
                  style={{ borderTop: "1px solid oklch(93% 0.04 145)" }}
                >
                  <div className="flex items-center gap-1">
                    <MapPin
                      size={10}
                      style={{ color: "oklch(60% 0.06 145)" }}
                    />
                    <span
                      className="text-[11px] italic"
                      style={{ color: "oklch(55% 0.06 145)" }}
                    >
                      {d.address}
                    </span>
                  </div>
                  {d.dueAmount !== undefined && (
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: "oklch(42% 0.14 25)" }}
                    >
                      Due: ৳{d.dueAmount.toLocaleString()}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </main>
    </div>
  );
}
