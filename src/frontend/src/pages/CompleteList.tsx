import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  ChevronLeft,
  Download,
  Layers,
  MapPin,
  PackageX,
  Pencil,
  Phone,
  Printer,
  Trash2,
  Truck,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { CompleteDelivery } from "../types/delivery";

interface Props {
  deliveries: CompleteDelivery[];
  onBack: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (delivery: CompleteDelivery) => void;
}

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

type MergedLabor = { name: string; amount: number };

/** Merge loading + unloading: same person's amounts are summed */
export function buildMergedLabors(d: CompleteDelivery): MergedLabor[] {
  const map = new Map<string, number>();
  for (const name of d.loadingLaborNames) {
    map.set(name, (map.get(name) ?? 0) + (d.perLoadingLaborAmount ?? 0));
  }
  for (const name of d.unloadingLaborNames) {
    map.set(name, (map.get(name) ?? 0) + (d.perUnloadingLaborAmount ?? 0));
  }
  return Array.from(map.entries()).map(([name, amount]) => ({ name, amount }));
}

export default function CompleteList({
  deliveries,
  onBack,
  onDelete,
  onEdit,
}: Props) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editDelivery, setEditDelivery] = useState<CompleteDelivery | null>(
    null,
  );

  const filtered = deliveries.filter((d) => {
    if (fromDate && d.date < fromDate) return false;
    if (toDate && d.date > toDate) return false;
    return true;
  });

  function handleDeleteConfirm(id: string) {
    onDelete?.(id);
    setDeleteConfirmId(null);
  }

  function handleEditSave() {
    if (!editDelivery) return;
    onEdit?.(editDelivery);
    setEditDelivery(null);
  }

  const periodLabel =
    fromDate && toDate
      ? `Period: ${formatDisplayDate(fromDate)} - ${formatDisplayDate(toDate)}`
      : fromDate
        ? `From: ${formatDisplayDate(fromDate)}`
        : toDate
          ? `To: ${formatDisplayDate(toDate)}`
          : "All Deliveries";

  function buildCompleteHtml(): string {
    const rows = filtered
      .map((d) => {
        const labors = buildMergedLabors(d);
        const laborHtml = labors
          .map(
            (l) =>
              `<div style="display:inline-block;width:48%;margin:1%;padding:4px 8px;background:#f0faf0;border:1px solid #c8e6c9;border-radius:6px;font-size:11px">
                <span>${l.name}</span>
                <span style="float:right;color:#2e7d32;font-weight:700">${l.amount > 0 ? `৳${l.amount.toFixed(2)}` : "\u2014"}</span>
              </div>`,
          )
          .join("");
        const invoiceHtml = d.invoiceNumber
          ? `<span style="font-size:10px;font-weight:700;color:#6b21a8;background:#f3e8ff;padding:1px 6px;border-radius:4px;margin-left:6px">INV# ${d.invoiceNumber}</span>`
          : "";
        const phoneHtml = d.phoneNumber
          ? `<div style="font-size:11px;color:#555;margin:3px 0">☎️ ${d.phoneNumber}</div>`
          : "";
        return `
          <div style="background:#fff;border:1.5px solid #c8e6c9;border-radius:12px;padding:14px;margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div><strong style="font-size:14px;color:#1b5e20">${d.customerName}</strong>${invoiceHtml}</div>
              ${d.totalAmount && d.totalAmount > 0 ? `<span style="background:#e8f5e9;color:#2e7d32;font-weight:700;padding:3px 10px;border-radius:20px">৳${d.totalAmount.toFixed(2)}</span>` : ""}
            </div>
            <div style="font-size:11px;color:#666;margin:4px 0">${d.date} &nbsp;|&nbsp; ${d.vehicleNumber} &nbsp;|&nbsp; ${d.totalBricks} Bricks &nbsp;|&nbsp; ${d.locationType}</div>
            ${phoneHtml}
            <div style="font-size:11px;color:#888;margin-bottom:8px">${d.address}</div>
            ${labors.length > 0 ? `<div style="border-top:1px solid #e8f5e9;padding-top:8px">${laborHtml}</div>` : ""}
          </div>`;
      })
      .join("");
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SAHA Complete Deliveries</title>
      <style>body{font-family:sans-serif;margin:20px;color:#222}@media print{body{margin:0}}</style>
      </head><body>
      <h2 style="color:#1b5e20;margin-bottom:4px">SAHA - Complete Delivery List</h2>
      <p style="color:#666;font-size:13px;margin-bottom:16px">${periodLabel} &nbsp;|&nbsp; Total: ${filtered.length} deliveries</p>
      ${rows}
      <p style="color:#aaa;font-size:11px;text-align:center;margin-top:24px">SAHA Business Suite</p>
      </body></html>`;
  }

  function handlePrint() {
    const html = buildCompleteHtml();
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  }

  async function handleDownloadPDF() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jsPDF = (window as any).jspdf?.jsPDF || (window as any).jsPDF;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    doc.setFontSize(18);
    doc.setTextColor(27, 94, 32);
    doc.setFont("helvetica", "bold");
    doc.text("SAHA - Complete Delivery List", margin, y);
    y += 7;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text(`${periodLabel} | Total: ${filtered.length}`, margin, y);
    y += 3;
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(0.6);
    doc.line(margin, y + 1, pageWidth - margin, y + 1);
    y += 7;

    for (const d of filtered) {
      const labors = buildMergedLabors(d);
      const cardH =
        30 +
        (d.phoneNumber ? 5 : 0) +
        (d.invoiceNumber ? 5 : 0) +
        (labors.length > 0 ? Math.ceil(labors.length / 2) * 7 + 5 : 0);
      if (y + cardH > 270) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(200, 230, 201);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin, y, pageWidth - margin * 2, cardH, 3, 3, "FD");

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(27, 94, 32);
      doc.text(d.customerName, margin + 3, y + 7);
      if (d.totalAmount && d.totalAmount > 0) {
        doc.setTextColor(46, 125, 50);
        doc.text(
          `\u09f3${d.totalAmount.toFixed(2)}`,
          pageWidth - margin - 3,
          y + 7,
          { align: "right" },
        );
      }

      let ly = y + 13;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(
        `${d.date}  |  ${d.vehicleNumber}  |  ${d.totalBricks} Bricks  |  ${d.locationType}`,
        margin + 3,
        ly,
      );
      ly += 5;

      if (d.invoiceNumber) {
        doc.setTextColor(107, 33, 168);
        doc.setFont("helvetica", "bold");
        doc.text(`INV# ${d.invoiceNumber}`, margin + 3, ly);
        ly += 5;
      }
      if (d.phoneNumber) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        doc.text(`Ph: ${d.phoneNumber}`, margin + 3, ly);
        ly += 5;
      }
      doc.setTextColor(120, 120, 120);
      doc.text(d.address, margin + 3, ly);
      ly += 5;

      if (labors.length > 0) {
        doc.setDrawColor(220, 240, 220);
        doc.line(margin + 3, ly, pageWidth - margin - 3, ly);
        ly += 4;
        labors.forEach((l, li) => {
          const col = li % 2;
          const xPos = margin + 3 + col * ((pageWidth - margin * 2 - 6) / 2);
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(50, 50, 50);
          doc.text(l.name, xPos, ly);
          if (l.amount > 0) {
            doc.setTextColor(46, 125, 50);
            doc.setFont("helvetica", "bold");
            doc.text(
              `\u09f3${l.amount.toFixed(2)}`,
              xPos + (pageWidth - margin * 2 - 6) / 2 - 2,
              ly,
              { align: "right" },
            );
          }
          if (col === 1) ly += 6;
        });
        if (labors.length % 2 === 1) ly += 6;
      }

      y += cardH + 4;
    }

    doc.save("saha-complete-deliveries.pdf");
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
        <div className="flex gap-2">
          <button
            type="button"
            data-ocid="complete-list.secondary_button"
            onClick={handlePrint}
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
            data-ocid="complete-list.primary_button"
            onClick={handleDownloadPDF}
            className="h-9 px-3 flex items-center gap-1.5 rounded-xl text-xs font-bold transition-colors"
            style={{ background: "oklch(48% 0.18 145)", color: "white" }}
          >
            <Download size={13} />
            PDF
          </button>
        </div>
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
                কোনো সম্পন্ন ড৅লিভারি নেই
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
            const mergedLabors = buildMergedLabors(d);

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
                  <div className="min-w-0 flex-1">
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
                          ৳{d.totalAmount.toFixed(2)}
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
                  <div className="flex flex-col items-end gap-1.5">
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
                    {/* Edit / Delete buttons */}
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        data-ocid={`complete-list.edit_button.${idx + 1}`}
                        onClick={() => setEditDelivery({ ...d })}
                        className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors"
                        style={{
                          background: "oklch(94% 0.06 220)",
                          color: "oklch(40% 0.18 220)",
                        }}
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        data-ocid={`complete-list.delete_button.${idx + 1}`}
                        onClick={() => setDeleteConfirmId(d.id)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors"
                        style={{
                          background: "oklch(94% 0.06 25)",
                          color: "oklch(42% 0.18 25)",
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Invoice Number */}
                {d.invoiceNumber && (
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-[10px] font-extrabold uppercase tracking-wide rounded px-1.5 py-0.5"
                      style={{
                        background: "oklch(94% 0.08 270)",
                        color: "oklch(40% 0.18 270)",
                      }}
                    >
                      INV#
                    </span>
                    <p
                      className="text-xs font-bold"
                      style={{ color: "oklch(35% 0.06 270)" }}
                    >
                      {d.invoiceNumber}
                    </p>
                  </div>
                )}

                {/* Phone */}
                {d.phoneNumber && (
                  <div className="flex items-center gap-2 mb-2">
                    <Phone size={12} style={{ color: "oklch(55% 0.1 145)" }} />
                    <p
                      className="text-xs font-medium"
                      style={{ color: "oklch(45% 0.06 145)" }}
                    >
                      {d.phoneNumber}
                    </p>
                  </div>
                )}

                {/* Labor Details - merged, no duplicates */}
                {mergedLabors.length > 0 && (
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
                      {mergedLabors.map((labor, li) => (
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
                              ? `৳${labor.amount.toFixed(2)}`
                              : "\u2014"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div
                  className="flex items-center pt-2.5 mt-2"
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
                </div>
              </motion.div>
            );
          })
        )}
      </main>

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <motion.div
            data-ocid="complete-list.dialog"
            initial={{ scale: 0.93, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 mx-5 shadow-xl w-full max-w-[340px]"
          >
            <h3
              className="text-base font-extrabold mb-1"
              style={{ color: "oklch(28% 0.06 145)" }}
            >
              ডিলিট করবেন?
            </h3>
            <p
              className="text-sm mb-5"
              style={{ color: "oklch(55% 0.05 145)" }}
            >
              এই ডেলিভারি রেকর্ড স্থায়ীভাবে মুছে যাবে।
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                data-ocid="complete-list.cancel_button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{
                  background: "oklch(94% 0.04 145)",
                  color: "oklch(40% 0.1 145)",
                }}
              >
                বাতিল
              </button>
              <button
                type="button"
                data-ocid="complete-list.confirm_button"
                onClick={() => handleDeleteConfirm(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: "oklch(42% 0.18 25)" }}
              >
                ডিলিট
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {editDelivery && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <motion.div
            data-ocid="complete-list.modal"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-t-3xl px-5 pt-5 pb-8 w-full max-w-[430px] shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-base font-extrabold"
                style={{ color: "oklch(28% 0.06 145)" }}
              >
                ড৅লিভারি এডিট করুন
              </h3>
              <button
                type="button"
                data-ocid="complete-list.close_button"
                onClick={() => setEditDelivery(null)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg"
                style={{
                  background: "oklch(93% 0.05 145)",
                  color: "oklch(45% 0.12 145)",
                }}
              >
                বাতিল
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="edit-date"
                  className="text-[11px] font-bold uppercase tracking-wide block mb-1"
                  style={{ color: "oklch(50% 0.1 145)" }}
                >
                  তারিখ
                </label>
                <input
                  type="date"
                  id="edit-date"
                  data-ocid="complete-list.input"
                  value={editDelivery.date}
                  onChange={(e) =>
                    setEditDelivery({ ...editDelivery, date: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: "oklch(96% 0.03 145)",
                    border: "1.5px solid oklch(85% 0.07 145)",
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="edit-customer"
                  className="text-[11px] font-bold uppercase tracking-wide block mb-1"
                  style={{ color: "oklch(50% 0.1 145)" }}
                >
                  গ্রাহকের নাম
                </label>
                <input
                  type="text"
                  id="edit-customer"
                  data-ocid="complete-list.input"
                  value={editDelivery.customerName}
                  onChange={(e) =>
                    setEditDelivery({
                      ...editDelivery,
                      customerName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: "oklch(96% 0.03 145)",
                    border: "1.5px solid oklch(85% 0.07 145)",
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="edit-address"
                  className="text-[11px] font-bold uppercase tracking-wide block mb-1"
                  style={{ color: "oklch(50% 0.1 145)" }}
                >
                  ঠিকানা
                </label>
                <input
                  type="text"
                  id="edit-address"
                  data-ocid="complete-list.input"
                  value={editDelivery.address}
                  onChange={(e) =>
                    setEditDelivery({
                      ...editDelivery,
                      address: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: "oklch(96% 0.03 145)",
                    border: "1.5px solid oklch(85% 0.07 145)",
                  }}
                />
              </div>
            </div>
            <button
              type="button"
              data-ocid="complete-list.save_button"
              onClick={handleEditSave}
              className="w-full mt-5 py-3 rounded-xl font-bold text-white text-sm"
              style={{ background: "oklch(48% 0.18 145)" }}
            >
              সেভ করুন
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
