import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { BrickSelection, PendingDelivery } from "../types/delivery";

const BRICK_TYPES = [
  "1 No Bricks",
  "2 No Bricks",
  "3 No Bricks",
  "1 No Picket",
  "2 No Picket",
  "Crack",
  "Goria",
  "Bats",
];

function todayString() {
  return new Date().toISOString().split("T")[0];
}

interface Props {
  onSave: (delivery: PendingDelivery) => void;
  onBack: () => void;
}

export default function AddPendingDelivery({ onSave, onBack }: Props) {
  const [date, setDate] = useState(todayString());
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [dueAmount, setDueAmount] = useState("");
  const [selectedBricks, setSelectedBricks] = useState<Record<string, number>>(
    {},
  );
  const [safetyQuantity, setSafetyQuantity] = useState("");
  const [locationType, setLocationType] = useState<"Local" | "Outside" | null>(
    null,
  );
  const [error, setError] = useState("");

  const batsSelected = "Bats" in selectedBricks;

  const totalBricks = Object.values(selectedBricks).reduce(
    (sum, q) => sum + (q || 0),
    0,
  );

  function toggleBrick(type: string) {
    setSelectedBricks((prev) => {
      const next = { ...prev };
      if (type in next) {
        delete next[type];
      } else {
        next[type] = 0;
      }
      return next;
    });
  }

  function setBrickQty(type: string, val: string) {
    const n = Number.parseInt(val, 10);
    setSelectedBricks((prev) => ({ ...prev, [type]: Number.isNaN(n) ? 0 : n }));
  }

  function handleSave() {
    setError("");
    if (!date) return setError("তারিখ দিন।");
    if (!customerName.trim()) return setError("গ্রাহকের নাম দিন।");
    if (!address.trim()) return setError("ঠিকানা দিন।");
    if (!locationType) return setError("লোকেশন টাইপ বেছে নিন।");

    const bricks: BrickSelection[] = Object.entries(selectedBricks).map(
      ([type, quantity]) => ({
        type,
        quantity,
      }),
    );

    const delivery: PendingDelivery = {
      id: `${Date.now()}`,
      date,
      customerName: customerName.trim(),
      address: address.trim(),
      dueAmount: dueAmount ? Number.parseFloat(dueAmount) : undefined,
      bricks,
      totalBricks,
      safetyQuantity:
        batsSelected && safetyQuantity
          ? Number.parseFloat(safetyQuantity)
          : undefined,
      locationType,
    };

    onSave(delivery);
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
          data-ocid="add-pending.button"
          onClick={onBack}
          className="h-9 w-9 flex items-center justify-center rounded-full transition-colors"
          style={{ background: "oklch(93% 0.06 145)" }}
        >
          <ChevronLeft size={20} style={{ color: "oklch(40% 0.18 145)" }} />
        </button>
        <div>
          <h2
            className="text-lg font-extrabold font-display leading-tight"
            style={{ color: "oklch(28% 0.06 145)" }}
          >
            Add Pending Delivery
          </h2>
          <p
            className="text-[11px] font-medium"
            style={{ color: "oklch(58% 0.08 145)" }}
          >
            নতুন পেন্ডিং ডেলিভারি
          </p>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 px-4 py-5 pb-32 space-y-6">
        {/* Basic Info */}
        <section>
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{ color: "oklch(55% 0.1 145)" }}
          >
            Basic Information
          </p>
          <div className="space-y-3">
            <div>
              <Label
                className="text-xs font-semibold"
                style={{ color: "oklch(40% 0.08 145)" }}
              >
                Date
              </Label>
              <Input
                data-ocid="add-pending.input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 h-11 rounded-xl border-2 text-sm font-medium"
                style={{ borderColor: "oklch(88% 0.06 145)" }}
              />
            </div>
            <div>
              <Label
                className="text-xs font-semibold"
                style={{ color: "oklch(40% 0.08 145)" }}
              >
                Customer Name
              </Label>
              <Input
                data-ocid="add-pending.input"
                type="text"
                placeholder="গ্রাহকের নাম লিখুন"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1 h-11 rounded-xl border-2 text-sm"
                style={{ borderColor: "oklch(88% 0.06 145)" }}
              />
            </div>
            <div>
              <Label
                className="text-xs font-semibold"
                style={{ color: "oklch(40% 0.08 145)" }}
              >
                Address
              </Label>
              <Input
                data-ocid="add-pending.input"
                type="text"
                placeholder="ঠিকানা লিখুন"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 h-11 rounded-xl border-2 text-sm"
                style={{ borderColor: "oklch(88% 0.06 145)" }}
              />
            </div>
            <div>
              <Label
                className="text-xs font-semibold"
                style={{ color: "oklch(40% 0.08 145)" }}
              >
                Due Amount{" "}
                <span
                  className="font-normal"
                  style={{ color: "oklch(65% 0.06 145)" }}
                >
                  (optional)
                </span>
              </Label>
              <Input
                data-ocid="add-pending.input"
                type="number"
                placeholder="০"
                value={dueAmount}
                onChange={(e) => setDueAmount(e.target.value)}
                className="mt-1 h-11 rounded-xl border-2 text-sm"
                style={{ borderColor: "oklch(88% 0.06 145)" }}
              />
            </div>
          </div>
        </section>

        {/* Brick Type Selection */}
        <section>
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{ color: "oklch(55% 0.1 145)" }}
          >
            Brick Types
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {BRICK_TYPES.map((type) => {
              const isSelected = type in selectedBricks;
              return (
                <motion.div
                  key={type}
                  layout
                  className="rounded-2xl overflow-hidden cursor-pointer"
                  style={{
                    border: `2px solid ${isSelected ? "oklch(50% 0.18 145)" : "oklch(88% 0.05 145)"}`,
                    background: isSelected ? "oklch(93% 0.09 145)" : "white",
                  }}
                  onClick={() => toggleBrick(type)}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="flex items-center justify-between px-3 py-3">
                    <span
                      className="text-sm font-bold"
                      style={{
                        color: isSelected
                          ? "oklch(35% 0.18 145)"
                          : "oklch(38% 0.05 145)",
                      }}
                    >
                      {type}
                    </span>
                    {isSelected && (
                      <CheckCircle2
                        size={16}
                        style={{ color: "oklch(50% 0.18 145)" }}
                      />
                    )}
                  </div>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="px-3 pb-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Input
                          data-ocid="add-pending.input"
                          type="number"
                          placeholder="Qty"
                          value={selectedBricks[type] || ""}
                          onChange={(e) => setBrickQty(type, e.target.value)}
                          className="h-8 text-sm rounded-lg border text-center"
                          style={{
                            borderColor: "oklch(70% 0.12 145)",
                            background: "white",
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Total Bricks */}
          <div
            className="mt-4 flex items-center justify-between px-4 py-3 rounded-2xl"
            style={{
              background: "oklch(88% 0.1 145)",
              border: "2px solid oklch(75% 0.14 145)",
            }}
          >
            <span
              className="text-sm font-bold"
              style={{ color: "oklch(32% 0.12 145)" }}
            >
              Total Bricks
            </span>
            <span
              className="text-2xl font-extrabold font-display"
              style={{ color: "oklch(35% 0.18 145)" }}
            >
              {totalBricks}
            </span>
          </div>
        </section>

        {/* Bats Rule — Safety Quantity */}
        <AnimatePresence>
          {batsSelected && (
            <motion.section
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-3"
                style={{ color: "oklch(55% 0.1 145)" }}
              >
                Bats — Safety
              </p>
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "oklch(95% 0.06 55)",
                  border: "2px solid oklch(80% 0.12 55)",
                }}
              >
                <Label
                  className="text-xs font-semibold"
                  style={{ color: "oklch(42% 0.1 55)" }}
                >
                  Safety Quantity
                </Label>
                <Input
                  data-ocid="add-pending.input"
                  type="number"
                  placeholder="0"
                  value={safetyQuantity}
                  onChange={(e) => setSafetyQuantity(e.target.value)}
                  className="mt-2 h-11 rounded-xl border-2 text-sm"
                  style={{ borderColor: "oklch(75% 0.14 55)" }}
                />
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Location Type */}
        <section>
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{ color: "oklch(55% 0.1 145)" }}
          >
            Location Type
          </p>
          <div className="flex gap-3">
            {(["Local", "Outside"] as const).map((type) => {
              const isActive = locationType === type;
              return (
                <button
                  key={type}
                  type="button"
                  data-ocid={`add-pending.${type.toLowerCase()}.toggle`}
                  onClick={() => setLocationType(type)}
                  className="flex-1 h-12 rounded-2xl text-sm font-bold transition-all"
                  style={{
                    background: isActive ? "oklch(50% 0.18 145)" : "white",
                    color: isActive ? "white" : "oklch(45% 0.08 145)",
                    border: `2px solid ${isActive ? "oklch(50% 0.18 145)" : "oklch(85% 0.06 145)"}`,
                    boxShadow: isActive
                      ? "0 4px 14px oklch(50% 0.18 145 / 0.25)"
                      : "none",
                  }}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </section>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              data-ocid="add-pending.error_state"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl px-4 py-3 text-sm font-semibold"
              style={{
                background: "oklch(95% 0.08 25)",
                color: "oklch(40% 0.18 25)",
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Save Button */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-8 pt-3"
        style={{
          background:
            "linear-gradient(to top, oklch(97% 0.012 145) 60%, transparent)",
        }}
      >
        <Button
          data-ocid="add-pending.submit_button"
          onClick={handleSave}
          className="w-full h-14 rounded-2xl text-base font-extrabold tracking-wide shadow-lg"
          style={{
            background: "oklch(50% 0.18 145)",
            color: "white",
            boxShadow: "0 6px 20px oklch(50% 0.18 145 / 0.35)",
          }}
        >
          সেভ করুন — Save
        </Button>
      </div>
    </div>
  );
}
