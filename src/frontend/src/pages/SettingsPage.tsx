import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  Copy,
  Pencil,
  Plus,
  Save,
  Settings,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { RatesConfig, VehicleConfig } from "../types/delivery";

interface Props {
  vehicles: VehicleConfig[];
  rates: RatesConfig;
  onSave: (vehicles: VehicleConfig[]) => void;
  onSaveRates: (rates: RatesConfig) => void;
  onBack: () => void;
}

const DEFAULT_RATES: RatesConfig = {
  tractorLocalRate: "",
  tractorOutsideRate: "",
  tractorSafeBatsRate: "",
  wheelLocalRate: "",
  wheelOutsideRate: "",
  wheelSafeBatsRate: "",
  batsConversionInput: "100",
  batsConversionOutput: "120",
};

function emptyForm() {
  return {
    type: null as "Tractor" | "12 Wheel" | null,
    number: "",
    loadingInput: "",
    loadingLabors: [] as string[],
    unloadingInput: "",
    unloadingLabors: [] as string[],
  };
}

export default function SettingsPage({
  vehicles,
  rates,
  onSave,
  onSaveRates,
  onBack,
}: Props) {
  const [activeTab, setActiveTab] = useState<"vehicles" | "rates">("vehicles");

  // Vehicles state
  const [list, setList] = useState<VehicleConfig[]>(vehicles);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [loadingCopied, setLoadingCopied] = useState(false);

  // Rates state
  const [localRates, setLocalRates] = useState<RatesConfig>(
    rates || DEFAULT_RATES,
  );
  const [ratesSaved, setRatesSaved] = useState(false);

  function addLabor(type: "loading" | "unloading") {
    if (type === "loading") {
      const t = form.loadingInput.trim();
      if (!t) return;
      const newList = form.loadingLabors.includes(t)
        ? form.loadingLabors
        : [...form.loadingLabors, t];
      const newUnloading = form.unloadingLabors.includes(t)
        ? form.unloadingLabors
        : [...form.unloadingLabors, t];
      setForm((f) => ({
        ...f,
        loadingInput: "",
        loadingLabors: newList,
        unloadingLabors: newUnloading,
      }));
    } else {
      const t = form.unloadingInput.trim();
      if (t && !form.unloadingLabors.includes(t))
        setForm((f) => ({
          ...f,
          unloadingInput: "",
          unloadingLabors: [...f.unloadingLabors, t],
        }));
      else setForm((f) => ({ ...f, unloadingInput: "" }));
    }
  }

  function removeLoadingLabor(name: string) {
    setForm((f) => ({
      ...f,
      loadingLabors: f.loadingLabors.filter((x) => x !== name),
    }));
  }

  function syncLoadingToUnloading() {
    const merged = [...form.unloadingLabors];
    for (const name of form.loadingLabors) {
      if (!merged.includes(name)) merged.push(name);
    }
    setForm((f) => ({ ...f, unloadingLabors: merged }));
    setLoadingCopied(true);
    setTimeout(() => setLoadingCopied(false), 2000);
  }

  function startEdit(v: VehicleConfig) {
    setEditingId(v.id);
    setFormError("");
    setForm({
      type: v.vehicleType,
      number: v.vehicleNumber,
      loadingInput: "",
      loadingLabors: [...(v.loadingLabors ?? [])],
      unloadingInput: "",
      unloadingLabors: [...(v.unloadingLabors ?? [])],
    });
    // Scroll form into view
    setTimeout(() => {
      document
        .getElementById("vehicle-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm());
    setFormError("");
  }

  function saveVehicle() {
    setFormError("");
    if (!form.type) return setFormError("Vehicle type বেছে নিন।");
    if (!form.number.trim()) return setFormError("Vehicle number দিন।");

    if (editingId) {
      // Update existing
      const updated = list.map((v) =>
        v.id === editingId
          ? {
              ...v,
              vehicleType: form.type!,
              vehicleNumber: form.number.trim(),
              defaultLabors: [...form.loadingLabors, ...form.unloadingLabors],
              loadingLabors: [...form.loadingLabors],
              unloadingLabors: [...form.unloadingLabors],
            }
          : v,
      );
      setList(updated);
      onSave(updated);
      setEditingId(null);
    } else {
      // Add new
      const vehicle: VehicleConfig = {
        id: `${Date.now()}`,
        vehicleType: form.type!,
        vehicleNumber: form.number.trim(),
        defaultLabors: [...form.loadingLabors, ...form.unloadingLabors],
        loadingLabors: [...form.loadingLabors],
        unloadingLabors: [...form.unloadingLabors],
      };
      const updated = [...list, vehicle];
      setList(updated);
      onSave(updated);
    }
    setForm(emptyForm());
  }

  function deleteVehicle(id: string) {
    const updated = list.filter((v) => v.id !== id);
    setList(updated);
    onSave(updated);
    if (editingId === id) cancelEdit();
  }

  function saveRates() {
    onSaveRates(localRates);
    setRatesSaved(true);
    setTimeout(() => setRatesSaved(false), 2000);
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
          data-ocid="settings.button"
          onClick={onBack}
          className="h-9 w-9 flex items-center justify-center rounded-full transition-colors"
          style={{ background: "oklch(93% 0.06 145)" }}
        >
          <ChevronLeft size={20} style={{ color: "oklch(40% 0.18 145)" }} />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Settings size={18} style={{ color: "oklch(48% 0.14 145)" }} />
          <h2
            className="text-lg font-extrabold font-display leading-tight"
            style={{ color: "oklch(28% 0.06 145)" }}
          >
            Settings
          </h2>
        </div>
      </header>

      {/* Tab Toggle */}
      <div className="px-4 pt-4">
        <div
          className="flex rounded-full p-1"
          style={{ background: "oklch(90% 0.05 145)" }}
        >
          {(["vehicles", "rates"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                data-ocid={`settings.${tab}.tab`}
                onClick={() => setActiveTab(tab)}
                className="flex-1 h-11 rounded-full text-sm font-bold transition-all"
                style={{
                  background: isActive ? "white" : "transparent",
                  color: isActive
                    ? "oklch(38% 0.18 145)"
                    : "oklch(55% 0.06 145)",
                  boxShadow: isActive
                    ? "0 2px 8px oklch(0% 0 0 / 10%)"
                    : "none",
                }}
              >
                {tab === "vehicles" ? "Vehicles" : "Rates"}
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 px-4 py-5 pb-16 space-y-5">
        {/* ===== VEHICLES TAB ===== */}
        {activeTab === "vehicles" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {/* Add / Edit Vehicle Form */}
            <div
              id="vehicle-form"
              className="rounded-2xl bg-white p-5 space-y-4"
              style={{
                border: editingId
                  ? "2px solid oklch(55% 0.18 145)"
                  : "1.5px solid oklch(88% 0.05 145)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck size={18} style={{ color: "oklch(48% 0.18 145)" }} />
                  <p
                    className="text-sm font-extrabold"
                    style={{ color: "oklch(28% 0.06 145)" }}
                  >
                    {editingId ? "Edit Vehicle" : "Add New Vehicle"}
                  </p>
                </div>
                {editingId && (
                  <button
                    type="button"
                    data-ocid="settings.cancel_button"
                    onClick={cancelEdit}
                    className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{
                      background: "oklch(93% 0.04 25)",
                      color: "oklch(45% 0.12 25)",
                    }}
                  >
                    <X size={12} /> Cancel
                  </button>
                )}
              </div>

              {/* Vehicle Type */}
              <div>
                <Label
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "oklch(55% 0.06 145)" }}
                >
                  Vehicle Type
                </Label>
                <div className="flex gap-3 mt-2">
                  {(["Tractor", "12 Wheel"] as const).map((type) => {
                    const isActive = form.type === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        data-ocid={`settings.${type.replace(" ", "-").toLowerCase()}.toggle`}
                        onClick={() => setForm((f) => ({ ...f, type }))}
                        className="flex-1 h-11 rounded-xl text-sm font-bold transition-all"
                        style={{
                          background: isActive
                            ? "oklch(92% 0.12 145)"
                            : "white",
                          color: isActive
                            ? "oklch(38% 0.18 145)"
                            : "oklch(50% 0.04 145)",
                          border: `2px solid ${isActive ? "oklch(55% 0.18 145)" : "oklch(85% 0.04 145)"}`,
                        }}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vehicle Number */}
              <div>
                <Label
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "oklch(55% 0.06 145)" }}
                >
                  Vehicle Number
                </Label>
                <Input
                  data-ocid="settings.input"
                  type="text"
                  placeholder="e.g. WB 52 1234"
                  value={form.number}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, number: e.target.value }))
                  }
                  className="mt-2 h-11 rounded-xl border-2 text-sm"
                  style={{ borderColor: "oklch(85% 0.04 145)" }}
                />
              </div>

              {/* Loading Labors */}
              <div>
                <Label
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "oklch(55% 0.06 145)" }}
                >
                  Loading Labors
                </Label>
                {form.loadingLabors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
                    {form.loadingLabors.map((l) => (
                      <div
                        key={l}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: "oklch(90% 0.10 145)",
                          color: "oklch(35% 0.14 145)",
                        }}
                      >
                        {l}
                        <button
                          type="button"
                          onClick={() => removeLoadingLabor(l)}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <Input
                    data-ocid="settings.loading_labor.input"
                    type="text"
                    placeholder="Add labor name"
                    value={form.loadingInput}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, loadingInput: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && addLabor("loading")}
                    className="flex-1 h-11 rounded-xl border-2 text-sm"
                    style={{ borderColor: "oklch(85% 0.04 145)" }}
                  />
                  <button
                    type="button"
                    data-ocid="settings.loading_labor.secondary_button"
                    onClick={() => addLabor("loading")}
                    className="h-11 w-11 flex items-center justify-center rounded-xl flex-shrink-0"
                    style={{ background: "oklch(50% 0.18 145)" }}
                  >
                    <Plus size={18} className="text-white" />
                  </button>
                </div>
                {form.loadingLabors.length > 0 && (
                  <p
                    className="text-[10px] mt-1.5 font-medium"
                    style={{ color: "oklch(52% 0.10 145)" }}
                  >
                    নতুন নাম যোগ করলে Unloading-এ স্বয়ংক্রিয়ভাবে কপি হবে।
                  </p>
                )}
              </div>

              {/* Unloading Labors */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "oklch(55% 0.06 145)" }}
                  >
                    Unloading Labors
                  </Label>
                  {form.loadingLabors.length > 0 && (
                    <button
                      type="button"
                      data-ocid="settings.sync_labor.button"
                      onClick={syncLoadingToUnloading}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all"
                      style={{
                        background: loadingCopied
                          ? "oklch(88% 0.12 160)"
                          : "oklch(88% 0.10 240)",
                        color: loadingCopied
                          ? "oklch(35% 0.14 160)"
                          : "oklch(35% 0.14 240)",
                      }}
                    >
                      <Copy size={10} />
                      {loadingCopied ? "Copied!" : "Sync from Loading"}
                    </button>
                  )}
                </div>
                {form.unloadingLabors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
                    {form.unloadingLabors.map((l) => (
                      <div
                        key={l}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: "oklch(88% 0.10 240)",
                          color: "oklch(35% 0.14 240)",
                        }}
                      >
                        {l}
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              unloadingLabors: f.unloadingLabors.filter(
                                (x) => x !== l,
                              ),
                            }))
                          }
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <Input
                    data-ocid="settings.unloading_labor.input"
                    type="text"
                    placeholder="Add labor name"
                    value={form.unloadingInput}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, unloadingInput: e.target.value }))
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" && addLabor("unloading")
                    }
                    className="flex-1 h-11 rounded-xl border-2 text-sm"
                    style={{ borderColor: "oklch(85% 0.04 145)" }}
                  />
                  <button
                    type="button"
                    data-ocid="settings.unloading_labor.secondary_button"
                    onClick={() => addLabor("unloading")}
                    className="h-11 w-11 flex items-center justify-center rounded-xl flex-shrink-0"
                    style={{ background: "oklch(50% 0.18 145)" }}
                  >
                    <Plus size={18} className="text-white" />
                  </button>
                </div>
              </div>

              {formError && (
                <p
                  className="text-xs font-semibold"
                  style={{ color: "oklch(42% 0.18 25)" }}
                >
                  {formError}
                </p>
              )}

              <Button
                data-ocid="settings.save_button"
                onClick={saveVehicle}
                className="w-full h-12 rounded-2xl text-sm font-extrabold flex items-center gap-2"
                style={{ background: "oklch(50% 0.18 145)", color: "white" }}
              >
                <Save size={16} />
                {editingId ? "Update Vehicle" : "Save Vehicle"}
              </Button>
            </div>

            <AnimatePresence>
              {list.length === 0 ? (
                <motion.div
                  data-ocid="settings.empty_state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-6 rounded-2xl mb-4"
                  style={{
                    background: "oklch(95% 0.04 145)",
                    border: "1.5px dashed oklch(82% 0.07 145)",
                  }}
                >
                  <p
                    className="text-xs font-medium"
                    style={{ color: "oklch(60% 0.07 145)" }}
                  >
                    কোনো গাড়ি যোগ করা হয়নি।
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-2 mb-4">
                  {list.map((v, idx) => (
                    <motion.div
                      key={v.id}
                      data-ocid={`settings.item.${idx + 1}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-2xl bg-white p-4"
                      style={{
                        border:
                          editingId === v.id
                            ? "2px solid oklch(55% 0.18 145)"
                            : "1.5px solid oklch(88% 0.05 145)",
                      }}
                    >
                      {/* Top row: vehicle info + action buttons */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div>
                            <p
                              className="text-sm font-extrabold leading-tight"
                              style={{ color: "oklch(28% 0.06 145)" }}
                            >
                              {v.vehicleNumber}
                            </p>
                            <Badge
                              className="rounded-full text-[10px] font-bold px-2 py-0 mt-1"
                              style={{
                                background:
                                  v.vehicleType === "Tractor"
                                    ? "oklch(88% 0.12 145)"
                                    : "oklch(88% 0.12 240)",
                                color:
                                  v.vehicleType === "Tractor"
                                    ? "oklch(35% 0.14 145)"
                                    : "oklch(35% 0.14 240)",
                              }}
                            >
                              {v.vehicleType}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            data-ocid={`settings.edit_button.${idx + 1}`}
                            onClick={() => startEdit(v)}
                            className="h-9 w-9 flex items-center justify-center rounded-xl"
                            style={{ background: "oklch(92% 0.10 240)" }}
                          >
                            <Pencil
                              size={14}
                              style={{ color: "oklch(40% 0.16 240)" }}
                            />
                          </button>
                          <button
                            type="button"
                            data-ocid={`settings.delete_button.${idx + 1}`}
                            onClick={() => deleteVehicle(v.id)}
                            className="h-9 w-9 flex items-center justify-center rounded-xl"
                            style={{ background: "oklch(94% 0.08 25)" }}
                          >
                            <Trash2
                              size={14}
                              style={{ color: "oklch(48% 0.18 25)" }}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Labor names below vehicle info */}
                      {((v.loadingLabors && v.loadingLabors.length > 0) ||
                        (v.unloadingLabors &&
                          v.unloadingLabors.length > 0)) && (
                        <div className="mt-3 space-y-2">
                          {v.loadingLabors && v.loadingLabors.length > 0 && (
                            <div>
                              <p
                                className="text-[10px] font-bold uppercase tracking-widest mb-1"
                                style={{ color: "oklch(45% 0.12 145)" }}
                              >
                                Loading:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {v.loadingLabors.map((name) => (
                                  <span
                                    key={name}
                                    className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                                    style={{
                                      background: "oklch(90% 0.10 145)",
                                      color: "oklch(32% 0.14 145)",
                                    }}
                                  >
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {v.unloadingLabors &&
                            v.unloadingLabors.length > 0 && (
                              <div>
                                <p
                                  className="text-[10px] font-bold uppercase tracking-widest mb-1"
                                  style={{ color: "oklch(40% 0.12 240)" }}
                                >
                                  Unloading:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {v.unloadingLabors.map((name) => (
                                    <span
                                      key={name}
                                      className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                                      style={{
                                        background: "oklch(88% 0.10 240)",
                                        color: "oklch(32% 0.14 240)",
                                      }}
                                    >
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ===== RATES TAB ===== */}
        {activeTab === "rates" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Tractor Rates */}
            <div
              className="rounded-2xl bg-white p-5 space-y-4"
              style={{ border: "1.5px solid oklch(88% 0.05 145)" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: "oklch(55% 0.20 145)" }}
                />
                <p
                  className="text-sm font-extrabold"
                  style={{ color: "oklch(28% 0.06 145)" }}
                >
                  Tractor Rates (per 1000)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "oklch(55% 0.06 145)" }}
                  >
                    Local Rate
                  </Label>
                  <div className="relative mt-2">
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-base"
                      style={{ color: "oklch(60% 0.06 145)" }}
                    >
                      ₹
                    </span>
                    <Input
                      data-ocid="settings.input"
                      type="number"
                      placeholder="0"
                      value={localRates.tractorLocalRate}
                      onChange={(e) =>
                        setLocalRates((r) => ({
                          ...r,
                          tractorLocalRate: e.target.value,
                        }))
                      }
                      className="h-12 rounded-xl border-2 text-sm pl-8"
                      style={{ borderColor: "oklch(85% 0.04 145)" }}
                    />
                  </div>
                </div>
                <div>
                  <Label
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "oklch(55% 0.06 145)" }}
                  >
                    Outside Rate
                  </Label>
                  <div className="relative mt-2">
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-base"
                      style={{ color: "oklch(60% 0.06 145)" }}
                    >
                      ₹
                    </span>
                    <Input
                      data-ocid="settings.input"
                      type="number"
                      placeholder="0"
                      value={localRates.tractorOutsideRate}
                      onChange={(e) =>
                        setLocalRates((r) => ({
                          ...r,
                          tractorOutsideRate: e.target.value,
                        }))
                      }
                      className="h-12 rounded-xl border-2 text-sm pl-8"
                      style={{ borderColor: "oklch(85% 0.04 145)" }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "oklch(55% 0.06 145)" }}
                >
                  100 Safety Bats Rate
                </Label>
                <div className="relative mt-2">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-base"
                    style={{ color: "oklch(60% 0.06 145)" }}
                  >
                    ₹
                  </span>
                  <Input
                    data-ocid="settings.input"
                    type="number"
                    placeholder="0"
                    value={localRates.tractorSafeBatsRate}
                    onChange={(e) =>
                      setLocalRates((r) => ({
                        ...r,
                        tractorSafeBatsRate: e.target.value,
                      }))
                    }
                    className="h-12 rounded-xl border-2 text-sm pl-8"
                    style={{ borderColor: "oklch(85% 0.04 145)" }}
                  />
                </div>
              </div>
            </div>

            {/* 12 Wheel Rates */}
            <div
              className="rounded-2xl bg-white p-5 space-y-4"
              style={{ border: "1.5px solid oklch(88% 0.05 145)" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: "oklch(55% 0.18 240)" }}
                />
                <p
                  className="text-sm font-extrabold"
                  style={{ color: "oklch(28% 0.06 145)" }}
                >
                  12 Wheel Rates (per 1000)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "oklch(55% 0.06 145)" }}
                  >
                    Local Rate
                  </Label>
                  <div className="relative mt-2">
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-base"
                      style={{ color: "oklch(60% 0.06 145)" }}
                    >
                      ₹
                    </span>
                    <Input
                      data-ocid="settings.input"
                      type="number"
                      placeholder="0"
                      value={localRates.wheelLocalRate}
                      onChange={(e) =>
                        setLocalRates((r) => ({
                          ...r,
                          wheelLocalRate: e.target.value,
                        }))
                      }
                      className="h-12 rounded-xl border-2 text-sm pl-8"
                      style={{ borderColor: "oklch(85% 0.04 145)" }}
                    />
                  </div>
                </div>
                <div>
                  <Label
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "oklch(55% 0.06 145)" }}
                  >
                    Outside Rate
                  </Label>
                  <div className="relative mt-2">
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-base"
                      style={{ color: "oklch(60% 0.06 145)" }}
                    >
                      ₹
                    </span>
                    <Input
                      data-ocid="settings.input"
                      type="number"
                      placeholder="0"
                      value={localRates.wheelOutsideRate}
                      onChange={(e) =>
                        setLocalRates((r) => ({
                          ...r,
                          wheelOutsideRate: e.target.value,
                        }))
                      }
                      className="h-12 rounded-xl border-2 text-sm pl-8"
                      style={{ borderColor: "oklch(85% 0.04 145)" }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "oklch(55% 0.06 145)" }}
                >
                  100 Safety Bats Rate
                </Label>
                <div className="relative mt-2">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-base"
                    style={{ color: "oklch(60% 0.06 145)" }}
                  >
                    ₹
                  </span>
                  <Input
                    data-ocid="settings.input"
                    type="number"
                    placeholder="0"
                    value={localRates.wheelSafeBatsRate}
                    onChange={(e) =>
                      setLocalRates((r) => ({
                        ...r,
                        wheelSafeBatsRate: e.target.value,
                      }))
                    }
                    className="h-12 rounded-xl border-2 text-sm pl-8"
                    style={{ borderColor: "oklch(85% 0.04 145)" }}
                  />
                </div>
              </div>
            </div>

            {/* Sefery Bats Conversion */}
            <div
              className="rounded-2xl bg-white p-5 space-y-4"
              style={{ border: "1.5px solid oklch(88% 0.05 55)" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: "oklch(60% 0.18 55)" }}
                />
                <p
                  className="text-sm font-extrabold"
                  style={{ color: "oklch(28% 0.06 145)" }}
                >
                  Sefery Bats Conversion
                </p>
              </div>
              <p
                className="text-[11px]"
                style={{ color: "oklch(50% 0.06 145)" }}
              >
                How many bricks equal a given number of Sefery Bats
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "oklch(55% 0.06 145)" }}
                  >
                    Sefery Bats
                  </Label>
                  <Input
                    data-ocid="settings.input"
                    type="number"
                    placeholder="100"
                    value={localRates.batsConversionInput}
                    onChange={(e) =>
                      setLocalRates((r) => ({
                        ...r,
                        batsConversionInput: e.target.value,
                      }))
                    }
                    className="h-12 rounded-xl border-2 text-sm mt-2"
                    style={{ borderColor: "oklch(85% 0.04 55)" }}
                  />
                </div>
                <span
                  className="text-lg font-bold mt-6"
                  style={{ color: "oklch(55% 0.06 145)" }}
                >
                  =
                </span>
                <div className="flex-1">
                  <Label
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "oklch(55% 0.06 145)" }}
                  >
                    Bricks
                  </Label>
                  <Input
                    data-ocid="settings.input"
                    type="number"
                    placeholder="120"
                    value={localRates.batsConversionOutput}
                    onChange={(e) =>
                      setLocalRates((r) => ({
                        ...r,
                        batsConversionOutput: e.target.value,
                      }))
                    }
                    className="h-12 rounded-xl border-2 text-sm mt-2"
                    style={{ borderColor: "oklch(85% 0.04 55)" }}
                  />
                </div>
              </div>
              <p
                className="text-xs font-semibold text-center py-2 rounded-xl"
                style={{
                  background: "oklch(94% 0.06 55)",
                  color: "oklch(42% 0.14 55)",
                }}
              >
                {localRates.batsConversionInput || "100"} Sefery Bats ={" "}
                {localRates.batsConversionOutput || "120"} Bricks
              </p>
            </div>

            <Button
              data-ocid="settings.save_button"
              onClick={saveRates}
              className="w-full h-12 rounded-2xl text-sm font-extrabold flex items-center gap-2"
              style={{
                background: ratesSaved
                  ? "oklch(48% 0.16 160)"
                  : "oklch(50% 0.18 145)",
                color: "white",
                transition: "background 0.3s",
              }}
            >
              <Save size={16} />
              {ratesSaved ? "Saved!" : "Save Rates"}
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
