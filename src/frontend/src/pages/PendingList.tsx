import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  ChevronLeft,
  Layers,
  MapPin,
  PackageX,
  Pencil,
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
}

export default function PendingList({
  deliveries,
  vehicles,
  rates,
  onBack,
  onDelete,
  onComplete,
}: Props) {
  const [completingDelivery, setCompletingDelivery] =
    useState<PendingDelivery | null>(null);

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
            {deliveries.length} টি পেন্ডিং ডেলিভারি
          </p>
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
                কোনো পেন্ডিং ডেলিভারি নেই
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

              {/* Address */}
              <div className="flex items-start gap-2 mb-3">
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
    </div>
  );
}
