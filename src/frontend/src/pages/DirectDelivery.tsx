import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ChevronLeft, Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type {
  BrickSelection,
  CompleteDelivery,
  RatesConfig,
  VehicleConfig,
} from "../types/delivery";

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
  vehicles: VehicleConfig[];
  rates: RatesConfig;
  onSave: (delivery: CompleteDelivery) => void;
  onBack: () => void;
}

function LaborSection({
  title,
  subtitle,
  laborNames,
  onAdd,
  onRemove,
  color,
}: {
  title: string;
  subtitle: string;
  laborNames: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
  color: string;
}) {
  const [newLabor, setNewLabor] = useState("");

  function handleAdd() {
    const trimmed = newLabor.trim();
    if (trimmed) {
      onAdd(trimmed);
      setNewLabor("");
    }
  }

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: "white",
        border: `1.5px solid ${color === "blue" ? "oklch(85% 0.06 240)" : "oklch(88% 0.05 145)"}`,
      }}
    >
      <div>
        <p
          className="text-[11px] font-extrabold uppercase tracking-wider"
          style={{
            color:
              color === "blue" ? "oklch(42% 0.14 240)" : "oklch(42% 0.14 145)",
          }}
        >
          {title}
        </p>
        <p
          className="text-[10px] mt-0.5"
          style={{ color: "oklch(62% 0.05 145)" }}
        >
          {subtitle}
        </p>
      </div>

      {laborNames.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {laborNames.map((name, i) => (
            <motion.div
              key={name}
              data-ocid={`direct-delivery.item.${i + 1}`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{
                background:
                  color === "blue"
                    ? "oklch(92% 0.08 240)"
                    : "oklch(92% 0.09 145)",
                color:
                  color === "blue"
                    ? "oklch(35% 0.14 240)"
                    : "oklch(35% 0.14 145)",
              }}
            >
              {name}
              <button
                type="button"
                data-ocid={`direct-delivery.delete_button.${i + 1}`}
                onClick={() => onRemove(name)}
                className="ml-0.5 rounded-full hover:opacity-70 transition-opacity"
              >
                <X
                  size={11}
                  style={{
                    color:
                      color === "blue"
                        ? "oklch(42% 0.16 240)"
                        : "oklch(42% 0.16 145)",
                  }}
                />
              </button>
            </motion.div>
          ))}
        </div>
      )}
      {laborNames.length === 0 && (
        <p className="text-xs" style={{ color: "oklch(65% 0.06 145)" }}>
          কোনো লেবার যোগ করা হয়নি।
        </p>
      )}

      <div className="flex gap-2">
        <Input
          data-ocid="direct-delivery.input"
          type="text"
          placeholder="Labor name"
          value={newLabor}
          onChange={(e) => setNewLabor(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="flex-1 h-10 rounded-xl border-2 text-sm"
          style={{
            borderColor:
              color === "blue" ? "oklch(85% 0.08 240)" : "oklch(88% 0.06 145)",
          }}
        />
        <button
          type="button"
          data-ocid="direct-delivery.primary_button"
          onClick={handleAdd}
          className="h-10 w-10 flex items-center justify-center rounded-xl flex-shrink-0 transition-opacity hover:opacity-80"
          style={{
            background:
              color === "blue" ? "oklch(48% 0.16 240)" : "oklch(50% 0.18 145)",
          }}
        >
          <Plus size={18} className="text-white" />
        </button>
      </div>
    </div>
  );
}

export default function DirectDelivery({
  vehicles,
  rates,
  onSave,
  onBack,
}: Props) {
  const [date, setDate] = useState(todayString());
  const [customerName, setCustomerName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dueAmount, setDueAmount] = useState("");
  const [selectedBricks, setSelectedBricks] = useState<Record<string, number>>(
    {},
  );
  const [safetyQuantity, setSafetyQuantity] = useState("");
  const [locationType, setLocationType] = useState<"Local" | "Outside" | null>(
    null,
  );
  const [vehicleType, setVehicleType] = useState<"Tractor" | "12 Wheel" | null>(
    null,
  );
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [loadingLabors, setLoadingLabors] = useState<string[]>([]);
  const [unloadingLabors, setUnloadingLabors] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [paidMoney, setPaidMoney] = useState(false);

  const batsSelected = "Bats" in selectedBricks;
  const conversionInput = Number(rates.batsConversionInput) || 100;
  const conversionOutput = Number(rates.batsConversionOutput) || 120;
  const totalBricks = Object.entries(selectedBricks).reduce(
    (sum, [type, qty]) => {
      if (type === "Bats") {
        return sum + Math.round((qty * conversionOutput) / conversionInput);
      }
      return sum + (qty || 0);
    },
    0,
  );

  // Auto rate calculation
  const autoRate = (() => {
    if (!vehicleType || !locationType) return 0;
    if (vehicleType === "Tractor") {
      return locationType === "Local"
        ? Number(rates.tractorLocalRate) || 0
        : Number(rates.tractorOutsideRate) || 0;
    }
    // 12 Wheel
    return locationType === "Local"
      ? Number(rates.wheelLocalRate) || 0
      : Number(rates.wheelOutsideRate) || 0;
  })();
  const safeBatsRate =
    vehicleType === "Tractor"
      ? Number(rates.tractorSafeBatsRate) || 0
      : Number(rates.wheelSafeBatsRate) || 0;
  const totalAmount =
    totalBricks > 0 && autoRate > 0 ? (totalBricks * autoRate) / 1000 : 0;
  const loadingShare = totalAmount / 2;
  const unloadingShare = totalAmount / 2;
  const safetyBatsAmount =
    batsSelected && safetyQuantity
      ? (Number(safetyQuantity) * safeBatsRate) / 100
      : 0;
  const perLoadingLaborAmount =
    loadingLabors.length > 0 && loadingShare > 0
      ? loadingShare / loadingLabors.length
      : 0;
  const perUnloadingLaborAmount =
    unloadingLabors.length > 0 && unloadingShare > 0
      ? unloadingShare / unloadingLabors.length
      : 0;

  const filteredVehicles = vehicleType
    ? vehicles.filter((v) => v.vehicleType === vehicleType)
    : [];

  function toggleBrick(type: string) {
    setSelectedBricks((prev) => {
      const next = { ...prev };
      if (type in next) delete next[type];
      else next[type] = 0;
      return next;
    });
  }

  function setBrickQty(type: string, val: string) {
    const n = Number.parseInt(val, 10);
    setSelectedBricks((prev) => ({ ...prev, [type]: Number.isNaN(n) ? 0 : n }));
  }

  function selectVehicleNumber(num: string) {
    setVehicleNumber(num);
    const found = vehicles.find((v) => v.vehicleNumber === num);
    if (found) {
      setLoadingLabors([...found.loadingLabors]);
      setUnloadingLabors([...found.unloadingLabors]);
    } else {
      setLoadingLabors([]);
      setUnloadingLabors([]);
    }
  }

  function handleSave() {
    setError("");
    if (!date) return setError("তারিখ দিন।");
    if (!customerName.trim()) return setError("গ্রাহকের নাম দিন।");
    if (!address.trim()) return setError("ঠিকানা দিন।");
    if (!locationType) return setError("লোকেশন টাইপ বেছে নিন।");
    if (!vehicleType) return setError("ভেহিকেল টাইপ বেছে নিন।");
    if (!vehicleNumber) return setError("ভেহিকেল নম্বর বেছে নিন।");

    const bricks: BrickSelection[] = Object.entries(selectedBricks).map(
      ([type, quantity]) => ({ type, quantity }),
    );

    const delivery: CompleteDelivery = {
      id: `${Date.now()}`,
      date,
      customerName: customerName.trim(),
      invoiceNumber: invoiceNumber.trim() || undefined,
      address: address.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      dueAmount: dueAmount ? Number.parseFloat(dueAmount) : undefined,
      bricks,
      totalBricks,
      safetyQuantity:
        batsSelected && safetyQuantity
          ? Number.parseFloat(safetyQuantity)
          : undefined,
      locationType,
      vehicleType,
      vehicleNumber,
      loadingLaborNames: loadingLabors,
      unloadingLaborNames: unloadingLabors,
      totalAmount: totalAmount || undefined,
      perLoadingLaborAmount: perLoadingLaborAmount || undefined,
      perUnloadingLaborAmount: perUnloadingLaborAmount || undefined,
      safetyBatsAmount: safetyBatsAmount || undefined,
      paidMoney: paidMoney || undefined,
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
          data-ocid="direct-delivery.button"
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
            Direct Delivery
          </h2>
          <p
            className="text-[11px] font-medium"
            style={{ color: "oklch(58% 0.08 145)" }}
          >
            সরাসরি ডেলিভারি
          </p>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 px-4 py-5 pb-44 space-y-6">
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
                data-ocid="direct-delivery.input"
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
                data-ocid="direct-delivery.input"
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
                Invoice Number{" "}
                <span
                  className="font-normal"
                  style={{ color: "oklch(65% 0.06 145)" }}
                >
                  (optional)
                </span>
              </Label>
              <Input
                data-ocid="direct-delivery.input"
                type="text"
                placeholder="ইনভোয়েস নম্বর লিখুন"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
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
                data-ocid="direct-delivery.input"
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
                Phone Number{" "}
                <span
                  className="font-normal"
                  style={{ color: "oklch(65% 0.06 145)" }}
                >
                  (optional)
                </span>
              </Label>
              <Input
                data-ocid="direct-delivery.input"
                type="tel"
                placeholder="ফোন নম্বর লিখুন"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
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
                data-ocid="direct-delivery.input"
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
                          data-ocid="direct-delivery.input"
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

        {/* Bats Safety */}
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
                  data-ocid="direct-delivery.input"
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
                  data-ocid={`direct-delivery.${type.toLowerCase()}.toggle`}
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

        {/* Vehicle Type */}
        <section>
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{ color: "oklch(55% 0.1 145)" }}
          >
            Vehicle Type
          </p>
          <div className="flex gap-3">
            {(["Tractor", "12 Wheel"] as const).map((type) => {
              const isActive = vehicleType === type;
              return (
                <button
                  key={type}
                  type="button"
                  data-ocid={`direct-delivery.${type.replace(" ", "-").toLowerCase()}.toggle`}
                  onClick={() => {
                    setVehicleType(type);
                    setVehicleNumber("");
                    setLoadingLabors([]);
                    setUnloadingLabors([]);
                  }}
                  className="flex-1 h-12 rounded-2xl text-sm font-bold transition-all"
                  style={{
                    background: isActive ? "oklch(45% 0.16 240)" : "white",
                    color: isActive ? "white" : "oklch(38% 0.08 240)",
                    border: `2px solid ${isActive ? "oklch(45% 0.16 240)" : "oklch(85% 0.06 240)"}`,
                    boxShadow: isActive
                      ? "0 4px 14px oklch(45% 0.16 240 / 0.25)"
                      : "none",
                  }}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </section>

        {/* Vehicle Number */}
        <AnimatePresence>
          {vehicleType && (
            <motion.section
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-3"
                style={{ color: "oklch(55% 0.1 145)" }}
              >
                Vehicle Number
              </p>
              {filteredVehicles.length === 0 ? (
                <div
                  className="rounded-2xl p-4 text-center"
                  style={{
                    background: "oklch(95% 0.03 240)",
                    border: "1.5px solid oklch(88% 0.06 240)",
                  }}
                >
                  <p
                    className="text-xs font-medium"
                    style={{ color: "oklch(55% 0.08 240)" }}
                  >
                    No {vehicleType} vehicles in settings.
                  </p>
                  <p
                    className="text-[11px] mt-0.5"
                    style={{ color: "oklch(65% 0.05 240)" }}
                  >
                    Add vehicles in the Settings tab.
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {filteredVehicles.map((v) => {
                    const isActive = vehicleNumber === v.vehicleNumber;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        data-ocid="direct-delivery.secondary_button"
                        onClick={() => selectVehicleNumber(v.vehicleNumber)}
                        className="px-4 h-11 rounded-2xl text-sm font-bold transition-all"
                        style={{
                          background: isActive
                            ? "oklch(45% 0.16 240)"
                            : "white",
                          color: isActive ? "white" : "oklch(38% 0.08 240)",
                          border: `2px solid ${isActive ? "oklch(45% 0.16 240)" : "oklch(85% 0.06 240)"}`,
                        }}
                      >
                        {v.vehicleNumber}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Labor Sections */}
        <AnimatePresence>
          {vehicleNumber && (
            <motion.section
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <p
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "oklch(55% 0.1 145)" }}
              >
                Labor
              </p>

              <LaborSection
                title="Loading Labor"
                subtitle="লোডিং লেবার"
                laborNames={loadingLabors}
                onAdd={(name) => {
                  if (!loadingLabors.includes(name))
                    setLoadingLabors((prev) => [...prev, name]);
                }}
                onRemove={(name) =>
                  setLoadingLabors((prev) => prev.filter((l) => l !== name))
                }
                color="green"
              />

              <LaborSection
                title="Unloading Labor"
                subtitle="আনলোডিং লেবার"
                laborNames={unloadingLabors}
                onAdd={(name) => {
                  if (!unloadingLabors.includes(name))
                    setUnloadingLabors((prev) => [...prev, name]);
                }}
                onRemove={(name) =>
                  setUnloadingLabors((prev) => prev.filter((l) => l !== name))
                }
                color="blue"
              />
            </motion.section>
          )}
        </AnimatePresence>

        {/* Amount Summary */}
        {autoRate > 0 && totalBricks > 0 && (
          <motion.section
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl p-4 space-y-3"
            style={{
              background: "oklch(94% 0.08 270)",
              border: "2px solid oklch(82% 0.1 270)",
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "oklch(42% 0.14 270)" }}
            >
              Auto Calculated Amounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl p-3 bg-white text-center">
                <p
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: "oklch(58% 0.08 270)" }}
                >
                  Rate (per 1000)
                </p>
                <p
                  className="text-lg font-extrabold font-display mt-0.5"
                  style={{ color: "oklch(35% 0.16 270)" }}
                >
                  ৳{autoRate.toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl p-3 bg-white text-center">
                <p
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: "oklch(58% 0.08 270)" }}
                >
                  Total Amount
                </p>
                <p
                  className="text-lg font-extrabold font-display mt-0.5"
                  style={{ color: "oklch(35% 0.16 270)" }}
                >
                  ৳{totalAmount.toFixed(2)}
                </p>
              </div>
              {loadingShare > 0 && (
                <div className="rounded-xl p-3 bg-white text-center">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: "oklch(58% 0.08 145)" }}
                  >
                    Loading Share
                  </p>
                  <p
                    className="text-lg font-extrabold font-display mt-0.5"
                    style={{ color: "oklch(35% 0.16 145)" }}
                  >
                    ৳{loadingShare.toFixed(2)}
                  </p>
                </div>
              )}
              {unloadingShare > 0 && (
                <div className="rounded-xl p-3 bg-white text-center">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: "oklch(58% 0.08 240)" }}
                  >
                    Unloading Share
                  </p>
                  <p
                    className="text-lg font-extrabold font-display mt-0.5"
                    style={{ color: "oklch(35% 0.16 240)" }}
                  >
                    ৳{unloadingShare.toFixed(2)}
                  </p>
                </div>
              )}
              {perLoadingLaborAmount > 0 && (
                <div className="rounded-xl p-3 bg-white text-center">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: "oklch(58% 0.08 145)" }}
                  >
                    Per Loading Labor
                  </p>
                  <p
                    className="text-lg font-extrabold font-display mt-0.5"
                    style={{ color: "oklch(35% 0.16 145)" }}
                  >
                    ৳{perLoadingLaborAmount.toFixed(2)}
                  </p>
                </div>
              )}
              {perUnloadingLaborAmount > 0 && (
                <div className="rounded-xl p-3 bg-white text-center">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: "oklch(58% 0.08 240)" }}
                  >
                    Per Unloading Labor
                  </p>
                  <p
                    className="text-lg font-extrabold font-display mt-0.5"
                    style={{ color: "oklch(35% 0.16 240)" }}
                  >
                    ৳{perUnloadingLaborAmount.toFixed(2)}
                  </p>
                </div>
              )}
              {safetyBatsAmount > 0 && (
                <div className="rounded-xl p-3 bg-white text-center col-span-2">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: "oklch(58% 0.08 55)" }}
                  >
                    Safety Bats Amount
                  </p>
                  <p
                    className="text-lg font-extrabold font-display mt-0.5"
                    style={{ color: "oklch(42% 0.14 55)" }}
                  >
                    ৳{safetyBatsAmount.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              data-ocid="direct-delivery.error_state"
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

        {/* Payment Status */}
        <div className="px-4 pb-2">
          <p
            className="text-xs font-bold mb-2"
            style={{ color: "oklch(42% 0.08 145)" }}
          >
            Payment Status
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              data-ocid="direct-delivery.not-paid.toggle"
              onClick={() => setPaidMoney(false)}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
              style={{
                background: !paidMoney ? "oklch(92% 0.04 145)" : "white",
                color: !paidMoney
                  ? "oklch(32% 0.08 145)"
                  : "oklch(60% 0.04 145)",
                border: !paidMoney
                  ? "2px solid oklch(75% 0.08 145)"
                  : "2px solid oklch(88% 0.04 145)",
              }}
            >
              Not Paid
            </button>
            <button
              type="button"
              data-ocid="direct-delivery.paid-money.toggle"
              onClick={() => setPaidMoney(true)}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
              style={{
                background: paidMoney ? "oklch(48% 0.18 145)" : "white",
                color: paidMoney ? "white" : "oklch(60% 0.04 145)",
                border: paidMoney
                  ? "2px solid oklch(48% 0.18 145)"
                  : "2px solid oklch(88% 0.04 145)",
              }}
            >
              ✓ Paid Money
            </button>
          </div>
        </div>
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
          data-ocid="direct-delivery.submit_button"
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
