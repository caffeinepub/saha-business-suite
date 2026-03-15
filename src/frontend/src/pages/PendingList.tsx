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
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const currentDate = `${dd}/${mm}/${yyyy}`;

  const CARDS_PER_PAGE = 14;
  const totalPages = Math.max(1, Math.ceil(deliveries.length / CARDS_PER_PAGE));

  function buildHeaderHtml(pageNum: number): string {
    return `
      <div class="page-header header" style="
        background:#166534;
        -webkit-print-color-adjust:exact;
        print-color-adjust:exact;
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding:10px 16px;
        margin-bottom:8px;
        border-radius:6px;
      ">
        <div style="display:flex;flex-direction:column;">
          <span style="font-size:18px;font-weight:900;color:#ffffff;letter-spacing:-0.3px;line-height:1.1;">SAHA</span>
          <span style="font-size:10px;font-weight:500;color:#86efac;margin-top:1px;letter-spacing:0.3px;">Pending Delivery List</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="
            background:#14532d;
            -webkit-print-color-adjust:exact;
            print-color-adjust:exact;
            color:#ffffff;
            font-size:9px;
            font-weight:700;
            padding:3px 9px;
            border-radius:999px;
          ">Total Pending: ${deliveries.length}</span>
          <span style="font-size:9px;color:#bbf7d0;font-weight:500;">${currentDate}</span>
          <span style="font-size:9px;color:#bbf7d0;font-weight:500;">Page ${pageNum} of ${totalPages}</span>
        </div>
      </div>
      <div style="height:1px;background:#d1fae5;margin-bottom:6px;"></div>
    `;
  }

  function buildCardHtml(d: PendingDelivery, serial: number): string {
    const locationColor = d.locationType === "Local" ? "#166534" : "#92400e";
    const locationBg = d.locationType === "Local" ? "#dcfce7" : "#fef3c7";

    const bricksText =
      d.bricks && d.bricks.length > 0
        ? d.bricks.map((b) => `${b.type} - ${b.quantity}`).join(", ")
        : `${d.totalBricks} bricks`;

    const invoiceHtml = d.invoiceNumber
      ? `<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
          <span style="font-size:8px;font-weight:800;color:#7c3aed;background:#ede9fe;padding:1px 5px;border-radius:3px;">INV#</span>
          <span style="font-size:9px;color:#4c1d95;font-weight:600;">${d.invoiceNumber}</span>
        </div>`
      : "";

    const phoneHtml = d.phoneNumber
      ? `<div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;">
          <span style="font-size:9px;">📞</span>
          <span style="font-size:9px;color:#374151;">${d.phoneNumber}</span>
        </div>`
      : "";

    const dueHtml =
      d.dueAmount !== undefined && d.dueAmount > 0
        ? `<div style="margin-top:4px;">
            <span style="font-size:11px;font-weight:800;color:#c2410c;">Due: ৳${d.dueAmount.toLocaleString()}</span>
          </div>`
        : "";

    return `
      <div class="pending-card" style="
        background:#f0fdf4;
        -webkit-print-color-adjust:exact;
        print-color-adjust:exact;
        border:1px solid #bbf7d0;
        border-radius:8px;
        padding:7px 10px;
        margin-bottom:4px;
        page-break-inside:avoid;
        display:flex;
        align-items:stretch;
        gap:8px;
      ">
        <!-- Serial number -->
        <div style="display:flex;align-items:flex-start;padding-top:1px;flex-shrink:0;">
          <span style="font-size:8px;color:#9ca3af;font-weight:600;width:14px;">#${serial}</span>
        </div>
        <!-- Left content -->
        <div style="flex:1;min-width:0;">
          <!-- Row 1: Name + Date -->
          <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:3px;">
            <span style="font-size:12px;font-weight:800;color:#14532d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60%;">${d.customerName}</span>
            <span style="font-size:9px;color:#6b7280;flex-shrink:0;">${d.date}</span>
          </div>
          <!-- Row 2: Invoice -->
          ${invoiceHtml}
          <!-- Row 3: Address -->
          <div style="display:flex;align-items:flex-start;gap:4px;margin-bottom:3px;">
            <span style="font-size:9px;flex-shrink:0;">📍</span>
            <span style="font-size:9px;color:#374151;line-height:1.3;">${d.address}</span>
          </div>
          <!-- Row 4: Phone -->
          ${phoneHtml}
          <!-- Row 5: Bricks -->
          <div style="display:flex;align-items:center;gap:4px;">
            <span style="font-size:9px;">🧱</span>
            <span style="font-size:9px;font-weight:700;color:#166534;">${bricksText}</span>
          </div>
        </div>
        <!-- Right column -->
        <div style="flex-shrink:0;width:68px;display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;">
          <span style="
            background:${locationBg};
            -webkit-print-color-adjust:exact;
            print-color-adjust:exact;
            color:${locationColor};
            font-size:8px;
            font-weight:700;
            padding:2px 7px;
            border-radius:999px;
            white-space:nowrap;
          ">${d.locationType}</span>
          ${dueHtml}
        </div>
      </div>
    `;
  }

  function buildPageHtml(
    pageCards: PendingDelivery[],
    pageNum: number,
    startSerial: number,
  ): string {
    const cardsHtml = pageCards
      .map((d, i) => buildCardHtml(d, startSerial + i))
      .join("");
    return `
      <div class="page-wrapper" style="width:186mm;padding:10mm 12mm;box-sizing:border-box;">
        ${buildHeaderHtml(pageNum)}
        <div class="cards-container pending-container">
          ${cardsHtml}
        </div>
        <div style="margin-top:6px;text-align:center;">
          <span style="font-size:8px;color:#d1d5db;">SAHA Business Suite &middot; Confidential</span>
        </div>
      </div>
    `;
  }

  let pagesHtml = "";
  if (deliveries.length === 0) {
    pagesHtml = `
      <div style="width:186mm;padding:10mm 12mm;box-sizing:border-box;">
        ${buildHeaderHtml(1)}
        <div style="text-align:center;padding:30px 0;color:#9ca3af;font-size:11px;">No pending deliveries</div>
        <div style="text-align:center;margin-top:6px;">
          <span style="font-size:8px;color:#d1d5db;">SAHA Business Suite &middot; Confidential</span>
        </div>
      </div>
    `;
  } else {
    for (let p = 0; p < totalPages; p++) {
      const slice = deliveries.slice(
        p * CARDS_PER_PAGE,
        (p + 1) * CARDS_PER_PAGE,
      );
      const startSerial = p * CARDS_PER_PAGE + 1;
      if (p > 0) {
        pagesHtml += `<div style="page-break-before:always;"></div>`;
      }
      pagesHtml += buildPageHtml(slice, p + 1, startSerial);
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SAHA - Pending Delivery List</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #111827;
      background: #f9fafb;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
      @page {
        size: A4;
        margin: 10mm;
      }
      body { background: white; margin: 0; }
      .no-print { display: none !important; }
      .page-wrapper { page-break-after: auto; }
      .header {
        margin-bottom: 10px;
        page-break-after: avoid;
      }
      .pending-container {
        display: flex;
        flex-direction: column;
      }
      .pending-card {
        height: 70px;
        padding: 6px 10px;
        margin-bottom: 6px;
        page-break-inside: avoid;
      }
    }
    @media screen {
      body { padding: 20px; }
      .page-wrapper {
        background: white;
        max-width: 210mm;
        margin: 0 auto 24px;
        box-shadow: 0 2px 16px rgba(0,0,0,0.10);
        border-radius: 8px;
      }
    }
  </style>
</head>
<body>
  ${pagesHtml}
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
      doc.text(
        `Bricks: ${d.bricks && d.bricks.length > 0 ? d.bricks.map((b) => `${b.type}: ${b.quantity}`).join(", ") : d.totalBricks}`,
        margin + 3,
        lineY,
      );
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
      <main className="flex-1 px-4 py-5 pb-16 flex flex-col gap-3">
        {deliveries.length === 0 ? (
          <motion.div
            data-ocid="pending-list.empty_state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-2 flex flex-col items-center justify-center py-20 gap-4"
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
              className="rounded-2xl bg-white p-3 shadow-card"
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
                    {d.bricks && d.bricks.length > 0
                      ? d.bricks
                          .map((b) => `${b.type} - ${b.quantity}`)
                          .join(", ")
                      : `${d.totalBricks} bricks`}
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
              <div className="flex flex-col gap-1.5 pt-3">
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
                        border: `1.5px solid ${
                          editDelivery.locationType === lt
                            ? "oklch(42% 0.18 145)"
                            : "oklch(85% 0.07 145)"
                        }`,
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
