import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  ChevronLeft,
  Download,
  Layers,
  MapPin,
  PackageX,
  Pencil,
  Phone,
  Printer,
  Trash2,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type {
  CompleteDelivery,
  PendingDelivery,
  RatesConfig,
  VehicleConfig,
} from "../types/delivery";
import CompletePendingPage from "./CompletePendingPage";

interface Props {
  deliveries: PendingDelivery[];
  vehicles: VehicleConfig[];
  rates: RatesConfig;
  onBack: () => void;
  onDelete: (id: string) => void;
  onComplete: (completed: CompleteDelivery) => void;
  onEdit?: (delivery: PendingDelivery) => void;
}

function buildPendingHtml(deliveries: PendingDelivery[]): string {
  const cards = deliveries
    .map((d, idx) => {
      const bg = idx % 2 === 0 ? "#ffffff" : "#f0fdf4";
      const locationColor = d.locationType === "Local" ? "#166534" : "#92400e";
      const locationBg = d.locationType === "Local" ? "#dcfce7" : "#fef3c7";

      const phoneRow = d.phoneNumber
        ? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
            <span style="font-size:12px">☎️</span>
            <span style="font-size:12px;color:#374151">${d.phoneNumber}</span>
          </div>`
        : "";

      const invoiceRow = d.invoiceNumber
        ? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
            <span style="font-size:11px;font-weight:700;color:#6b21a8">INV#</span>
            <span style="font-size:12px;color:#374151">${d.invoiceNumber}</span>
          </div>`
        : "";

      const dueHtml =
        d.dueAmount !== undefined && d.dueAmount > 0
          ? `<span style="font-size:12px;font-weight:700;color:#b45309">Due: ৳${d.dueAmount.toLocaleString()}</span>`
          : "";

      return `
        <div style="background:${bg};border:1.5px solid #d1fae5;border-radius:12px;padding:14px 16px;margin-bottom:12px;page-break-inside:avoid">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:4px">
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:32px;height:32px;background:#dcfce7;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <span style="font-size:15px">👤</span>
              </div>
              <div>
                <div style="font-size:14px;font-weight:800;color:#14532d">${d.customerName}</div>
                <div style="font-size:11px;color:#6b7280;margin-top:1px">${d.date}</div>
              </div>
            </div>
            <span style="background:${locationBg};color:${locationColor};border-radius:999px;padding:2px 10px;font-size:10px;font-weight:700;flex-shrink:0">${d.locationType}</span>
          </div>
          ${invoiceRow}
          <div style="display:flex;align-items:flex-start;gap:6px;margin-top:8px;margin-bottom:6px">
            <span style="font-size:12px;margin-top:1px">📍</span>
            <span style="font-size:12px;color:#374151;line-height:1.4">${d.address}</span>
          </div>
          ${phoneRow}
          <div style="display:flex;align-items:center;justify-content:space-between;padding-top:8px;margin-top:4px;border-top:1px solid #d1fae5">
            <div style="display:flex;align-items:center;gap:6px">
              <span style="font-size:12px">🧱</span>
              <span style="font-size:12px;font-weight:700;color:#166534">${d.totalBricks} bricks</span>
            </div>
            ${dueHtml}
          </div>
        </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SAHA Pending List</title>
  <style>
    @page { size: A4 portrait; margin: 1.5cm 1cm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; width: 210mm; max-width: 210mm; }
    @media print { body { background: white; } .page-break { page-break-before: always; } }
    @media screen { body { padding: 20px; background: #f3f4f6; } .content { background: white; max-width: 210mm; margin: 0 auto; padding: 20px; } }
  </style>
</head>
<body>
  <div class="content">
    <div style="margin-bottom:20px">
      <h1 style="font-size:20px;font-weight:900;color:#14532d;letter-spacing:-0.5px">SAHA</h1>
      <h2 style="font-size:15px;font-weight:700;color:#166534;margin-top:2px">Pending Delivery List</h2>
      <p style="font-size:12px;color:#6b7280;margin-top:6px">Total Pending: <strong>${deliveries.length}</strong></p>
      <div style="height:2px;background:linear-gradient(to right,#16a34a,#86efac);border-radius:99px;margin-top:10px"></div>
    </div>
    ${cards || "<p style='color:#9ca3af;text-align:center;padding:40px 0'>No pending deliveries</p>"}
    <div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb">
      <p style="font-size:11px;color:#9ca3af">SAHA Business Suite</p>
    </div>
  </div>
</body>
</html>`;
}

function AddBrickRow({
  onAdd,
}: { onAdd: (type: string, qty: number) => void }) {
  const [type, setType] = useState("");
  const [qty, setQty] = useState("");
  return (
    <div className="flex gap-2 items-center">
      <input
        type="text"
        placeholder="Brick type"
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
        style={{
          background: "oklch(96% 0.03 145)",
          border: "1.5px solid oklch(85% 0.07 145)",
        }}
      />
      <input
        type="number"
        placeholder="Quantity"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        className="w-20 px-2 py-2 rounded-xl text-xs outline-none text-right"
        style={{
          background: "oklch(96% 0.03 145)",
          border: "1.5px solid oklch(85% 0.07 145)",
        }}
      />
      <button
        type="button"
        onClick={() => {
          if (type && qty) {
            onAdd(type, Number(qty));
            setType("");
            setQty("");
          }
        }}
        className="px-3 py-2 rounded-xl text-xs font-bold text-white"
        style={{ background: "oklch(48% 0.18 145)" }}
      >
        +
      </button>
    </div>
  );
}

export default function PendingList({
  deliveries,
  vehicles,
  rates,
  onBack,
  onDelete,
  onComplete,
  onEdit,
}: Props) {
  const [completingDelivery, setCompletingDelivery] =
    useState<PendingDelivery | null>(null);
  const [editDelivery, setEditDelivery] = useState<PendingDelivery | null>(
    null,
  );

  function handlePrint() {
    const html = buildPendingHtml(deliveries);
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

    // Header
    doc.setFontSize(20);
    doc.setTextColor(20, 83, 45);
    doc.setFont("helvetica", "bold");
    doc.text("SAHA", margin, y);
    y += 8;
    doc.setFontSize(13);
    doc.text("Pending Delivery List", margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.setFont("helvetica", "normal");
    doc.text(`Total: ${deliveries.length} pending`, margin, y);
    y += 3;
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(0.8);
    doc.line(margin, y + 1, pageWidth - margin, y + 1);
    y += 6;

    for (const d of deliveries) {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      // Card background
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(209, 250, 229);
      doc.setLineWidth(0.4);
      const cardHeight =
        28 + (d.phoneNumber ? 6 : 0) + (d.invoiceNumber ? 6 : 0);
      doc.roundedRect(
        margin,
        y,
        pageWidth - margin * 2,
        cardHeight,
        3,
        3,
        "FD",
      );

      // Name + Date
      doc.setFontSize(11);
      doc.setTextColor(20, 83, 45);
      doc.setFont("helvetica", "bold");
      doc.text(d.customerName, margin + 3, y + 7);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      doc.text(d.date, margin + 3, y + 13);

      // Location badge (right)
      const locLabel = d.locationType;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(
        d.locationType === "Local" ? 22 : 146,
        d.locationType === "Local" ? 101 : 64,
        d.locationType === "Local" ? 52 : 14,
      );
      doc.text(locLabel, pageWidth - margin - 3, y + 7, { align: "right" });

      let lineY = y + 17;

      // Invoice
      if (d.invoiceNumber) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(107, 33, 168);
        doc.text(`INV# ${d.invoiceNumber}`, margin + 3, lineY);
        lineY += 6;
      }

      // Address
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(55, 65, 81);
      doc.text(`${d.address}`, margin + 3, lineY);
      lineY += 6;

      // Phone
      if (d.phoneNumber) {
        doc.setTextColor(75, 85, 99);
        doc.text(`Ph: ${d.phoneNumber}`, margin + 3, lineY);
        lineY += 6;
      }

      // Bricks + Due
      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 101, 52);
      doc.text(`Bricks: ${d.totalBricks}`, margin + 3, lineY);
      if (d.dueAmount !== undefined && d.dueAmount > 0) {
        doc.setTextColor(180, 83, 9);
        doc.text(
          `Due: ${d.dueAmount.toLocaleString()}`,
          pageWidth - margin - 3,
          lineY,
          { align: "right" },
        );
      }

      y += cardHeight + 4;
    }

    doc.save("saha-pending-list.pdf");
  }

  if (completingDelivery) {
    return (
      <CompletePendingPage
        delivery={completingDelivery}
        vehicles={vehicles}
        rates={rates}
        onBack={() => setCompletingDelivery(null)}
        onComplete={(completed) => {
          onComplete(completed);
          setCompletingDelivery(null);
        }}
      />
    );
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
          data-ocid="pending-list.button"
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
            Pending List
          </h2>
          <p
            className="text-[11px] font-medium"
            style={{ color: "oklch(58% 0.08 145)" }}
          >
            {deliveries.length} Pending Deliveries
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            data-ocid="pending-list.secondary_button"
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
            data-ocid="pending-list.primary_button"
            onClick={handleDownloadPDF}
            className="h-9 px-3 flex items-center gap-1.5 rounded-xl text-xs font-bold transition-colors"
            style={{ background: "oklch(48% 0.18 145)", color: "white" }}
          >
            <Download size={13} />
            PDF
          </button>
        </div>
        <Badge
          className="rounded-full text-xs font-bold px-3 py-1"
          style={{
            background: "oklch(93% 0.09 145)",
            color: "oklch(38% 0.16 145)",
          }}
        >
          {deliveries.length}
        </Badge>
      </header>

      {/* List */}
      <main className="flex-1 px-4 py-5 pb-16 space-y-3">
        {deliveries.length === 0 ? (
          <motion.div
            data-ocid="pending-list.empty_state"
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
                No pending deliveries
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "oklch(62% 0.06 145)" }}
              >
                No pending deliveries yet
              </p>
            </div>
          </motion.div>
        ) : (
          deliveries.map((d, idx) => (
            <motion.div
              key={d.id}
              data-ocid={`pending-list.item.${idx + 1}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="rounded-2xl bg-white p-4 shadow-card"
              style={{ border: "1.5px solid oklch(90% 0.05 145)" }}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "oklch(93% 0.08 145)" }}
                  >
                    <User size={15} style={{ color: "oklch(45% 0.16 145)" }} />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-sm font-extrabold truncate"
                      style={{ color: "oklch(25% 0.05 145)" }}
                    >
                      {d.customerName}
                    </p>
                    <p
                      className="text-[11px] font-medium truncate"
                      style={{ color: "oklch(60% 0.06 145)" }}
                    >
                      {d.date}
                    </p>
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

              {/* Address */}
              <div className="flex items-start gap-2 mb-2">
                <MapPin
                  size={13}
                  className="mt-0.5 flex-shrink-0"
                  style={{ color: "oklch(62% 0.08 145)" }}
                />
                <p
                  className="text-xs font-medium leading-snug"
                  style={{ color: "oklch(45% 0.06 145)" }}
                >
                  {d.address}
                </p>
              </div>

              {/* Phone Number */}
              {d.phoneNumber && (
                <div className="flex items-center gap-2 mb-3">
                  <Phone
                    size={13}
                    className="flex-shrink-0"
                    style={{ color: "oklch(55% 0.12 145)" }}
                  />
                  <a
                    href={`tel:${d.phoneNumber}`}
                    className="text-xs font-medium underline"
                    style={{ color: "oklch(35% 0.18 210)" }}
                  >
                    {d.phoneNumber}
                  </a>
                </div>
              )}

              {/* Bricks row */}
              <div
                className="flex items-center justify-between pb-3"
                style={{ borderBottom: "1px solid oklch(92% 0.04 145)" }}
              >
                <div className="flex items-center gap-1.5">
                  <Layers size={13} style={{ color: "oklch(55% 0.12 145)" }} />
                  <span
                    className="text-xs font-bold"
                    style={{ color: "oklch(38% 0.1 145)" }}
                  >
                    {d.totalBricks} bricks
                  </span>
                </div>
                {d.dueAmount !== undefined && (
                  <span
                    className="text-xs font-bold"
                    style={{ color: "oklch(42% 0.14 55)" }}
                  >
                    ৳{d.dueAmount.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  data-ocid={`pending-list.edit_button.${idx + 1}`}
                  onClick={() => setEditDelivery({ ...d })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                  style={{
                    background: "oklch(94% 0.02 145)",
                    color: "oklch(45% 0.06 145)",
                    border: "1.5px solid oklch(88% 0.04 145)",
                  }}
                >
                  <Pencil size={12} />
                  Edit
                </button>
                <button
                  type="button"
                  data-ocid={`pending-list.delete_button.${idx + 1}`}
                  onClick={() => onDelete(d.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                  style={{
                    background: "oklch(96% 0.04 15)",
                    color: "oklch(45% 0.2 15)",
                    border: "1.5px solid oklch(88% 0.08 15)",
                  }}
                >
                  <Trash2 size={12} />
                  Delete
                </button>
                <button
                  type="button"
                  data-ocid={`pending-list.primary_button.${idx + 1}`}
                  onClick={() => setCompletingDelivery(d)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                  style={{
                    background: "oklch(48% 0.18 145)",
                    color: "white",
                    border: "1.5px solid oklch(42% 0.18 145)",
                  }}
                >
                  <CheckCircle2 size={12} />
                  Complete
                </button>
              </div>
            </motion.div>
          ))
        )}
      </main>

      {/* Edit Pending Delivery Modal */}
      {editDelivery && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div
            data-ocid="pending-list.modal"
            className="bg-white rounded-t-3xl px-5 pt-5 pb-8 w-full max-w-[430px] shadow-xl overflow-y-auto"
            style={{ maxHeight: "85vh" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-base font-extrabold"
                style={{ color: "oklch(28% 0.06 145)" }}
              >
                Edit Pending
              </h3>
              <button
                type="button"
                data-ocid="pending-list.close_button"
                onClick={() => setEditDelivery(null)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg"
                style={{
                  background: "oklch(93% 0.05 145)",
                  color: "oklch(45% 0.12 145)",
                }}
              >
                Cancel
              </button>
            </div>
            <div className="space-y-3">
              {/* Date */}
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-wide block mb-1"
                  style={{ color: "oklch(50% 0.1 145)" }}
                >
                  Date
                </p>
                <input
                  type="date"
                  data-ocid="pending-list.input"
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
              {/* Customer Name */}
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-wide block mb-1"
                  style={{ color: "oklch(50% 0.1 145)" }}
                >
                  Customer Name
                </p>
                <input
                  type="text"
                  data-ocid="pending-list.input"
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
              {/* Invoice Number */}
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-wide block mb-1"
                  style={{ color: "oklch(50% 0.1 145)" }}
                >
                  Invoice Number (Optional)
                </p>
                <input
                  type="text"
                  data-ocid="pending-list.input"
                  value={editDelivery.invoiceNumber ?? ""}
                  onChange={(e) =>
                    setEditDelivery({
                      ...editDelivery,
                      invoiceNumber: e.target.value || undefined,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: "oklch(96% 0.03 145)",
                    border: "1.5px solid oklch(85% 0.07 145)",
                  }}
                />
              </div>
              {/* Address */}
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-wide block mb-1"
                  style={{ color: "oklch(50% 0.1 145)" }}
                >
                  Address
                </p>
                <input
                  type="text"
                  data-ocid="pending-list.input"
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
              {/* Phone */}
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-wide block mb-1"
                  style={{ color: "oklch(50% 0.1 145)" }}
                >
                  Phone Number (Optional)
                </p>
                <input
                  type="text"
                  data-ocid="pending-list.input"
                  value={editDelivery.phoneNumber ?? ""}
                  onChange={(e) =>
                    setEditDelivery({
                      ...editDelivery,
                      phoneNumber: e.target.value || undefined,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: "oklch(96% 0.03 145)",
                    border: "1.5px solid oklch(85% 0.07 145)",
                  }}
                />
              </div>
              {/* Due Amount */}
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-wide block mb-1"
                  style={{ color: "oklch(50% 0.1 145)" }}
                >
                  Due Amount (Optional)
                </p>
                <input
                  type="number"
                  data-ocid="pending-list.input"
                  value={editDelivery.dueAmount ?? ""}
                  onChange={(e) =>
                    setEditDelivery({
                      ...editDelivery,
                      dueAmount: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: "oklch(96% 0.03 145)",
                    border: "1.5px solid oklch(85% 0.07 145)",
                  }}
                />
              </div>
              {/* Location Type */}
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-wide block mb-1"
                  style={{ color: "oklch(50% 0.1 145)" }}
                >
                  Location Type
                </p>
                <div className="flex gap-2">
                  {(["Local", "Outside"] as const).map((lt) => (
                    <button
                      key={lt}
                      type="button"
                      data-ocid="pending-list.toggle"
                      onClick={() =>
                        setEditDelivery({ ...editDelivery, locationType: lt })
                      }
                      className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                      style={{
                        background:
                          editDelivery.locationType === lt
                            ? "oklch(48% 0.18 145)"
                            : "oklch(96% 0.03 145)",
                        color:
                          editDelivery.locationType === lt
                            ? "white"
                            : "oklch(45% 0.1 145)",
                        border: `1.5px solid ${editDelivery.locationType === lt ? "oklch(42% 0.18 145)" : "oklch(85% 0.07 145)"}`,
                      }}
                    >
                      {lt}
                    </button>
                  ))}
                </div>
              </div>
              {/* Bricks */}
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-wide block mb-1"
                  style={{ color: "oklch(50% 0.1 145)" }}
                >
                  Brick Quantity
                </p>
                <div className="space-y-2">
                  {editDelivery.bricks.map((b, bi) => (
                    <div
                      key={`${b.type}-${bi}`}
                      className="flex gap-2 items-center"
                    >
                      <span
                        className="text-xs font-semibold flex-1 px-3 py-2 rounded-xl"
                        style={{
                          background: "oklch(96% 0.03 145)",
                          color: "oklch(38% 0.1 145)",
                          border: "1.5px solid oklch(85% 0.07 145)",
                        }}
                      >
                        {b.type}
                      </span>
                      <input
                        type="number"
                        value={b.quantity}
                        data-ocid="pending-list.input"
                        onChange={(e) => {
                          const newBricks = editDelivery.bricks.map((br, i) =>
                            i === bi
                              ? { ...br, quantity: Number(e.target.value) }
                              : br,
                          );
                          const totalBricks = newBricks.reduce(
                            (s, br) => s + br.quantity,
                            0,
                          );
                          setEditDelivery({
                            ...editDelivery,
                            bricks: newBricks,
                            totalBricks,
                          });
                        }}
                        className="w-24 px-3 py-2 rounded-xl text-sm outline-none text-right"
                        style={{
                          background: "oklch(96% 0.03 145)",
                          border: "1.5px solid oklch(85% 0.07 145)",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newBricks = editDelivery.bricks.filter(
                            (_, i) => i !== bi,
                          );
                          setEditDelivery({
                            ...editDelivery,
                            bricks: newBricks,
                            totalBricks: newBricks.reduce(
                              (s, br) => s + br.quantity,
                              0,
                            ),
                          });
                        }}
                        className="text-red-400 font-bold px-2 py-1 rounded-lg text-xs"
                        style={{ background: "oklch(96% 0.04 15)" }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {/* Add new brick row */}
                  <AddBrickRow
                    onAdd={(type, qty) => {
                      const newBricks = [
                        ...editDelivery.bricks,
                        { type, quantity: qty },
                      ];
                      setEditDelivery({
                        ...editDelivery,
                        bricks: newBricks,
                        totalBricks: newBricks.reduce(
                          (s, b) => s + b.quantity,
                          0,
                        ),
                      });
                    }}
                  />
                </div>
                <div
                  className="mt-2 text-xs font-bold"
                  style={{ color: "oklch(38% 0.1 145)" }}
                >
                  Total Bricks: {editDelivery.totalBricks}
                </div>
              </div>
              {/* Safety Quantity */}
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-wide block mb-1"
                  style={{ color: "oklch(50% 0.1 145)" }}
                >
                  Safety Bats Quantity (Optional)
                </p>
                <input
                  type="number"
                  data-ocid="pending-list.input"
                  value={editDelivery.safetyQuantity ?? ""}
                  onChange={(e) =>
                    setEditDelivery({
                      ...editDelivery,
                      safetyQuantity: e.target.value
                        ? Number(e.target.value)
                        : undefined,
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
              data-ocid="pending-list.save_button"
              onClick={() => {
                onEdit?.(editDelivery);
                setEditDelivery(null);
              }}
              className="w-full mt-5 py-3 rounded-xl font-bold text-white text-sm"
              style={{ background: "oklch(48% 0.18 145)" }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
