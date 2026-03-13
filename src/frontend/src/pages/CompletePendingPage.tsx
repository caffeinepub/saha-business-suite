import { CheckCircle2, ChevronLeft, Plus, Truck, User, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type {
  CompleteDelivery,
  PendingDelivery,
  RatesConfig,
  VehicleConfig,
} from "../types/delivery";

interface Props {
  delivery: PendingDelivery;
  vehicles: VehicleConfig[];
  rates: RatesConfig;
  onBack: () => void;
  onComplete: (completed: CompleteDelivery) => void;
}

export default function CompletePendingPage({
  delivery,
  vehicles,
  rates,
  onBack,
  onComplete,
}: Props) {
  const [selectedType, setSelectedType] = useState<
    "Tractor" | "12 Wheel" | null
  >(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null,
  );
  const [loadingLabors, setLoadingLabors] = useState<string[]>([]);
  const [unloadingLabors, setUnloadingLabors] = useState<string[]>([]);
  const [loadingInput, setLoadingInput] = useState("");
  const [unloadingInput, setUnloadingInput] = useState("");
  const [paidMoney, setPaidMoney] = useState(false);

  const filteredVehicles = vehicles.filter(
    (v) => v.vehicleType === selectedType,
  );
  const selectedVehicle =
    vehicles.find((v) => v.id === selectedVehicleId) || null;

  useEffect(() => {
    const v = vehicles.find((veh) => veh.id === selectedVehicleId) || null;
    if (v) {
      setLoadingLabors([...v.loadingLabors]);
      setUnloadingLabors([...v.unloadingLabors]);
    } else {
      setLoadingLabors([]);
      setUnloadingLabors([]);
    }
  }, [selectedVehicleId, vehicles]);

  function handleTypeSelect(type: "Tractor" | "12 Wheel") {
    setSelectedType(type);
    setSelectedVehicleId(null);
  }

  function addLoadingLabor() {
    const name = loadingInput.trim();
    if (!name) return;
    setLoadingLabors((prev) => [...prev, name]);
    setLoadingInput("");
  }

  function removeLoadingLabor(idx: number) {
    setLoadingLabors((prev) => prev.filter((_, i) => i !== idx));
  }

  function addUnloadingLabor() {
    const name = unloadingInput.trim();
    if (!name) return;
    setUnloadingLabors((prev) => [...prev, name]);
    setUnloadingInput("");
  }

  function removeUnloadingLabor(idx: number) {
    setUnloadingLabors((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSave() {
    if (!selectedVehicle) return;

    const autoRate = (() => {
      if (!selectedType) return 0;
      if (selectedType === "Tractor") {
        return delivery.locationType === "Local"
          ? Number(rates.tractorLocalRate) || 0
          : Number(rates.tractorOutsideRate) || 0;
      }
      // 12 Wheel
      return delivery.locationType === "Local"
        ? Number(rates.wheelLocalRate) || 0
        : Number(rates.wheelOutsideRate) || 0;
    })();
    const safeBatsRate =
      selectedType === "Tractor"
        ? Number(rates.tractorSafeBatsRate) || 0
        : Number(rates.wheelSafeBatsRate) || 0;
    const totalBricks = delivery.totalBricks || 0;
    const totalAmount =
      totalBricks > 0 && autoRate > 0 ? (totalBricks * autoRate) / 1000 : 0;
    const safetyBatsAmount =
      delivery.safetyQuantity && safeBatsRate > 0
        ? (delivery.safetyQuantity * safeBatsRate) / 100
        : 0;
    const loadingShare = totalAmount / 2;
    const unloadingShare = totalAmount / 2;
    const perLoadingLaborAmount =
      loadingLabors.length > 0 && loadingShare > 0
        ? loadingShare / loadingLabors.length
        : 0;
    const perUnloadingLaborAmount =
      unloadingLabors.length > 0 && unloadingShare > 0
        ? unloadingShare / unloadingLabors.length
        : 0;

    const completed: CompleteDelivery = {
      ...delivery,
      vehicleType: selectedVehicle.vehicleType,
      vehicleNumber: selectedVehicle.vehicleNumber,
      loadingLaborNames: loadingLabors,
      unloadingLaborNames: unloadingLabors,
      totalAmount: totalAmount || undefined,
      perLoadingLaborAmount: perLoadingLaborAmount || undefined,
      perUnloadingLaborAmount: perUnloadingLaborAmount || undefined,
      safetyBatsAmount: safetyBatsAmount || undefined,
      paidMoney: paidMoney || undefined,
    };
    onComplete(completed);
  }

  const canSave = !!selectedVehicle;

  // Auto rate calculation for display
  const autoRate = (() => {
    if (!selectedType) return 0;
    if (selectedType === "Tractor") {
      return delivery.locationType === "Local"
        ? Number(rates.tractorLocalRate) || 0
        : Number(rates.tractorOutsideRate) || 0;
    }
    // 12 Wheel
    return delivery.locationType === "Local"
      ? Number(rates.wheelLocalRate) || 0
      : Number(rates.wheelOutsideRate) || 0;
  })();
  const safeBatsRate =
    selectedType === "Tractor"
      ? Number(rates.tractorSafeBatsRate) || 0
      : Number(rates.wheelSafeBatsRate) || 0;
  const totalBricks = delivery.totalBricks || 0;
  const totalAmount =
    totalBricks > 0 && autoRate > 0 ? (totalBricks * autoRate) / 1000 : 0;
  const loadingShare = totalAmount / 2;
  const unloadingShare = totalAmount / 2;
  const safeBatsAmount =
    delivery.safetyQuantity && safeBatsRate > 0
      ? (delivery.safetyQuantity * safeBatsRate) / 100
      : 0;
  const perLoadingLabor =
    loadingLabors.length > 0 && loadingShare > 0
      ? loadingShare / loadingLabors.length
      : 0;
  const perUnloadingLabor =
    unloadingLabors.length > 0 && unloadingShare > 0
      ? unloadingShare / unloadingLabors.length
      : 0;

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
          data-ocid="complete-pending.button"
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
            Complete Delivery
          </h2>
          <p
            className="text-[11px] font-medium"
            style={{ color: "oklch(58% 0.08 145)" }}
          >
            Vehicle assign করুন
          </p>
        </div>
        <div
          className="h-8 w-8 rounded-xl flex items-center justify-center"
          style={{ background: "oklch(88% 0.12 145)" }}
        >
          <CheckCircle2 size={16} style={{ color: "oklch(42% 0.18 145)" }} />
        </div>
      </header>

      <main className="flex-1 px-4 py-5 pb-44 space-y-5">
        {/* Customer Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white p-4 shadow-sm"
          style={{ border: "1.5px solid oklch(90% 0.05 145)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: "oklch(93% 0.08 145)" }}
            >
              <User size={18} style={{ color: "oklch(45% 0.16 145)" }} />
            </div>
            <div>
              <p
                className="text-sm font-extrabold"
                style={{ color: "oklch(25% 0.05 145)" }}
              >
                {delivery.customerName}
              </p>
              <p
                className="text-[11px]"
                style={{ color: "oklch(58% 0.07 145)" }}
              >
                {delivery.address}
              </p>
            </div>
          </div>
          <div
            className="mt-3 pt-3 flex gap-4 text-xs"
            style={{ borderTop: "1px solid oklch(92% 0.04 145)" }}
          >
            <span style={{ color: "oklch(45% 0.1 145)" }}>
              <span
                className="font-bold"
                style={{ color: "oklch(28% 0.08 145)" }}
              >
                {delivery.totalBricks}
              </span>{" "}
              bricks
            </span>
            <span style={{ color: "oklch(45% 0.1 145)" }}>
              {delivery.locationType}
            </span>
            <span style={{ color: "oklch(45% 0.1 145)" }}>{delivery.date}</span>
          </div>
        </motion.div>

        {/* Vehicle Type */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-white p-4 shadow-sm"
          style={{ border: "1.5px solid oklch(90% 0.05 145)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Truck size={15} style={{ color: "oklch(48% 0.16 145)" }} />
            <p
              className="text-xs font-extrabold uppercase tracking-wide"
              style={{ color: "oklch(38% 0.1 145)" }}
            >
              Vehicle Type
            </p>
          </div>
          <div className="flex gap-3">
            {(["Tractor", "12 Wheel"] as const).map((type) => (
              <button
                key={type}
                type="button"
                data-ocid="complete-pending.toggle"
                onClick={() => handleTypeSelect(type)}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  background:
                    selectedType === type
                      ? "oklch(48% 0.18 145)"
                      : "oklch(94% 0.06 145)",
                  color:
                    selectedType === type ? "white" : "oklch(38% 0.12 145)",
                  border:
                    selectedType === type
                      ? "1.5px solid oklch(42% 0.18 145)"
                      : "1.5px solid oklch(88% 0.06 145)",
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Vehicle Number */}
        {selectedType && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white p-4 shadow-sm"
            style={{ border: "1.5px solid oklch(90% 0.05 145)" }}
          >
            <p
              className="text-xs font-extrabold uppercase tracking-wide mb-3"
              style={{ color: "oklch(38% 0.1 145)" }}
            >
              Vehicle Number
            </p>
            {filteredVehicles.length === 0 ? (
              <p
                className="text-xs text-center py-3"
                style={{ color: "oklch(62% 0.06 145)" }}
              >
                কোনো {selectedType} গাড়ি সেটিংসে যোগ করা হয়নি
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filteredVehicles.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    data-ocid="complete-pending.toggle"
                    onClick={() => setSelectedVehicleId(v.id)}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background:
                        selectedVehicleId === v.id
                          ? "oklch(48% 0.18 145)"
                          : "oklch(94% 0.06 145)",
                      color:
                        selectedVehicleId === v.id
                          ? "white"
                          : "oklch(38% 0.12 145)",
                      border:
                        selectedVehicleId === v.id
                          ? "1.5px solid oklch(42% 0.18 145)"
                          : "1.5px solid oklch(88% 0.06 145)",
                    }}
                  >
                    {v.vehicleNumber}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Labor Section */}
        {selectedVehicle && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white p-4 shadow-sm space-y-5"
            style={{ border: "1.5px solid oklch(90% 0.05 145)" }}
          >
            {/* Loading Labor */}
            <div>
              <p
                className="text-xs font-extrabold uppercase tracking-wide mb-3"
                style={{ color: "oklch(38% 0.1 145)" }}
              >
                Loading Labor
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {loadingLabors.map((name, idx) => (
                  <span
                    // biome-ignore lint/suspicious/noArrayIndexKey: labor names may duplicate
                    key={`ll-${name}-${idx}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{
                      background: "oklch(93% 0.08 145)",
                      color: "oklch(35% 0.14 145)",
                    }}
                  >
                    {name}
                    <button
                      type="button"
                      data-ocid="complete-pending.delete_button"
                      onClick={() => removeLoadingLabor(idx)}
                      className="ml-0.5 rounded-full p-0.5 transition-colors"
                      style={{ color: "oklch(45% 0.18 20)" }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
                {loadingLabors.length === 0 && (
                  <p
                    className="text-xs"
                    style={{ color: "oklch(65% 0.05 145)" }}
                  >
                    কোনো লেবার নেই
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  data-ocid="complete-pending.input"
                  value={loadingInput}
                  onChange={(e) => setLoadingInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addLoadingLabor()}
                  placeholder="লেবারের নাম লিখুন"
                  className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                  style={{
                    background: "oklch(96% 0.02 145)",
                    border: "1.5px solid oklch(88% 0.06 145)",
                    color: "oklch(28% 0.06 145)",
                  }}
                />
                <button
                  type="button"
                  data-ocid="complete-pending.button"
                  onClick={addLoadingLabor}
                  className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors"
                  style={{ background: "oklch(48% 0.18 145)", color: "white" }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Unloading Labor */}
            <div
              style={{
                borderTop: "1px solid oklch(92% 0.04 145)",
                paddingTop: "16px",
              }}
            >
              <p
                className="text-xs font-extrabold uppercase tracking-wide mb-3"
                style={{ color: "oklch(38% 0.1 55)" }}
              >
                Unloading Labor
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {unloadingLabors.map((name, idx) => (
                  <span
                    // biome-ignore lint/suspicious/noArrayIndexKey: labor names may duplicate
                    key={`ul-${name}-${idx}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{
                      background: "oklch(93% 0.08 55)",
                      color: "oklch(35% 0.14 55)",
                    }}
                  >
                    {name}
                    <button
                      type="button"
                      data-ocid="complete-pending.delete_button"
                      onClick={() => removeUnloadingLabor(idx)}
                      className="ml-0.5 rounded-full p-0.5 transition-colors"
                      style={{ color: "oklch(45% 0.18 20)" }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
                {unloadingLabors.length === 0 && (
                  <p
                    className="text-xs"
                    style={{ color: "oklch(65% 0.05 145)" }}
                  >
                    কোনো লেবার নেই
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  data-ocid="complete-pending.input"
                  value={unloadingInput}
                  onChange={(e) => setUnloadingInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addUnloadingLabor()}
                  placeholder="লেবারের নাম লিখুন"
                  className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                  style={{
                    background: "oklch(96% 0.02 55)",
                    border: "1.5px solid oklch(88% 0.06 55)",
                    color: "oklch(28% 0.06 145)",
                  }}
                />
                <button
                  type="button"
                  data-ocid="complete-pending.button"
                  onClick={addUnloadingLabor}
                  className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors"
                  style={{ background: "oklch(55% 0.16 55)", color: "white" }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Amount Summary */}
        {autoRate > 0 && totalBricks > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 shadow-sm space-y-3"
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
              {perLoadingLabor > 0 && (
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
                    ৳{perLoadingLabor.toFixed(2)}
                  </p>
                </div>
              )}
              {perUnloadingLabor > 0 && (
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
                    ৳{perUnloadingLabor.toFixed(2)}
                  </p>
                </div>
              )}
              {safeBatsAmount > 0 && (
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
                    ৳{safeBatsAmount.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
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
              data-ocid="complete-pending.not-paid.toggle"
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
              data-ocid="complete-pending.paid-money.toggle"
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
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 py-4 bg-white"
        style={{ borderTop: "1.5px solid oklch(90% 0.04 145)" }}
      >
        <button
          type="button"
          data-ocid="complete-pending.primary_button"
          onClick={handleSave}
          disabled={!canSave}
          className="w-full py-4 rounded-2xl text-sm font-extrabold tracking-wide transition-all"
          style={{
            background: canSave ? "oklch(48% 0.18 145)" : "oklch(88% 0.04 145)",
            color: canSave ? "white" : "oklch(62% 0.04 145)",
            cursor: canSave ? "pointer" : "not-allowed",
          }}
        >
          ✓ Save as Complete
        </button>
      </div>
    </div>
  );
}
