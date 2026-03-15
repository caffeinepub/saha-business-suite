import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Camera,
  CheckCircle2,
  FileText,
  Home,
  IndianRupee,
  Layers,
  LogIn,
  LogOut,
  Package,
  PlusCircle,
  Settings,
  Truck,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useUserProfile } from "./hooks/useQueries";
import AddPendingDelivery from "./pages/AddPendingDelivery";
import CompleteList from "./pages/CompleteList";
import DirectDelivery from "./pages/DirectDelivery";
import PendingList from "./pages/PendingList";
import ReportPage from "./pages/ReportPage";
import SettingsPage from "./pages/SettingsPage";
import type {
  CompleteDelivery,
  PendingDelivery,
  RatesConfig,
  VehicleConfig,
} from "./types/delivery";

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatDate(d: Date) {
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(d: Date) {
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

type NavTab = "home" | "add" | "direct" | "reports" | "settings";
type SubView = "pending-list" | "complete-list" | null;

const NAV_ITEMS: { id: NavTab; icon: React.ReactNode; label: string }[] = [
  { id: "home", icon: <Home size={22} />, label: "Home" },
  { id: "add", icon: <PlusCircle size={22} />, label: "Add Pending" },
  { id: "direct", icon: <Truck size={22} />, label: "Direct" },
  { id: "reports", icon: <FileText size={22} />, label: "Reports" },
  { id: "settings", icon: <Settings size={22} />, label: "Settings" },
];

const WRAPPER =
  "min-h-screen bg-gradient-to-b from-[oklch(96%_0.015_145)] to-[oklch(93%_0.02_145)] flex items-start justify-center";
const INNER = "w-full max-w-[430px] min-h-screen";

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

export default function App() {
  const now = useClock();
  const { login, clear, loginStatus, identity, isInitializing } =
    useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [subView, setSubView] = useState<SubView>(null);
  const [pendingDeliveries, setPendingDeliveries] = useLocalStorage<
    PendingDelivery[]
  >("saha_pending", []);
  const [completeDeliveries, setCompleteDeliveries] = useLocalStorage<
    CompleteDelivery[]
  >("saha_complete", []);
  const [vehicles, setVehicles] = useLocalStorage<VehicleConfig[]>(
    "saha_vehicles",
    [],
  );
  const [rates, setRates] = useLocalStorage<RatesConfig>(
    "saha_rates",
    DEFAULT_RATES,
  );
  const [savedName, setSavedName] = useLocalStorage<string>(
    "saha_display_name",
    "",
  );
  const [userPhoto, setUserPhoto] = useLocalStorage<string>(
    "saha_profile_photo",
    "",
  );

  // Edit state
  const [editingPending, setEditingPending] = useState<PendingDelivery | null>(
    null,
  );
  const [editingComplete, setEditingComplete] =
    useState<CompleteDelivery | null>(null);

  // Profile sheet state
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoggedIn = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const displayName =
    (savedName && savedName.trim() !== "" ? savedName.trim() : null) ||
    profile?.displayName ||
    (identity ? `${identity.getPrincipal().toString().slice(0, 8)}...` : null);

  const initials = displayName
    ? displayName
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  // Total Revenue from completed deliveries
  const totalRevenue = completeDeliveries.reduce(
    (sum, d) => sum + (d.totalAmount ?? 0),
    0,
  );

  function openProfileSheet() {
    setEditName(displayName ?? "");
    setProfileSheetOpen(true);
  }

  function handleSaveProfile() {
    if (editName.trim()) {
      setSavedName(editName.trim());
    }
    setProfileSheetOpen(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") {
        setUserPhoto(result);
      }
    };
    reader.readAsDataURL(file);
  }

  if (activeTab === "add") {
    return (
      <div className={WRAPPER}>
        <div className={INNER}>
          <AddPendingDelivery
            editData={editingPending ?? undefined}
            onSave={(delivery) => {
              if (editingPending) {
                setPendingDeliveries((prev) =>
                  prev.map((d) => (d.id === delivery.id ? delivery : d)),
                );
                setEditingPending(null);
              } else {
                setPendingDeliveries((prev) => [...prev, delivery]);
              }
              setActiveTab("home");
            }}
            onBack={() => {
              setEditingPending(null);
              setActiveTab("home");
            }}
          />
        </div>
      </div>
    );
  }

  if (activeTab === "direct") {
    return (
      <div className={WRAPPER}>
        <div className={INNER}>
          <DirectDelivery
            vehicles={vehicles}
            rates={rates}
            editData={editingComplete ?? undefined}
            onSave={(delivery) => {
              if (editingComplete) {
                setCompleteDeliveries((prev) =>
                  prev.map((d) => (d.id === delivery.id ? delivery : d)),
                );
                setEditingComplete(null);
              } else {
                setCompleteDeliveries((prev) => [...prev, delivery]);
              }
              setActiveTab("home");
            }}
            onBack={() => {
              setEditingComplete(null);
              setActiveTab("home");
            }}
          />
        </div>
      </div>
    );
  }

  if (activeTab === "settings") {
    return (
      <div className={WRAPPER}>
        <div className={INNER}>
          <SettingsPage
            vehicles={vehicles}
            rates={rates}
            onSave={setVehicles}
            onSaveRates={setRates}
            onBack={() => setActiveTab("home")}
          />
        </div>
      </div>
    );
  }

  if (activeTab === "reports") {
    return (
      <div className={WRAPPER}>
        <div className={INNER}>
          <ReportPage
            pendingDeliveries={pendingDeliveries}
            completeDeliveries={completeDeliveries}
            onBack={() => setActiveTab("home")}
          />
        </div>
      </div>
    );
  }

  if (subView === "pending-list") {
    return (
      <div className={WRAPPER}>
        <div className={INNER}>
          <PendingList
            deliveries={pendingDeliveries}
            vehicles={vehicles}
            rates={rates}
            onBack={() => setSubView(null)}
            onDelete={(id) =>
              setPendingDeliveries((prev) => prev.filter((d) => d.id !== id))
            }
            onEdit={(delivery) => {
              setEditingPending(delivery);
              setSubView(null);
              setActiveTab("add");
            }}
            onComplete={(completed) => {
              setCompleteDeliveries((prev) => [...prev, completed]);
              setPendingDeliveries((prev) =>
                prev.filter((d) => d.id !== completed.id),
              );
              setSubView(null);
            }}
          />
        </div>
      </div>
    );
  }

  if (subView === "complete-list") {
    return (
      <div className={WRAPPER}>
        <div className={INNER}>
          <CompleteList
            deliveries={completeDeliveries}
            onBack={() => setSubView(null)}
            onDelete={(id) =>
              setCompleteDeliveries((prev) => prev.filter((d) => d.id !== id))
            }
            onEdit={(delivery) => {
              setEditingComplete(delivery);
              setSubView(null);
              setActiveTab("direct");
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={WRAPPER}>
      <div className="w-full max-w-[430px] min-h-screen flex flex-col relative">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="bg-white/90 backdrop-blur-sm px-5 pt-8 pb-5 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <h1
                className="font-display text-4xl font-extrabold tracking-tight leading-none"
                style={{ color: "oklch(45% 0.18 145)" }}
              >
                SAHA
              </h1>
              <p
                className="text-xs font-semibold tracking-widest uppercase mt-0.5"
                style={{ color: "oklch(55% 0.12 145)" }}
              >
                SB &amp; CO
              </p>
              <p
                className="text-[11px] mt-1.5 font-medium"
                style={{ color: "oklch(60% 0.04 145)" }}
              >
                {formatDate(now)} &nbsp;·&nbsp; {formatTime(now)}
              </p>
            </div>

            {isInitializing ? (
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-9 w-28 rounded-lg" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            ) : isLoggedIn ? (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p
                    className="text-[11px]"
                    style={{ color: "oklch(60% 0.04 145)" }}
                  >
                    Welcome Back
                  </p>
                  {profileLoading && !savedName ? (
                    <Skeleton className="h-4 w-24 mt-0.5" />
                  ) : (
                    <p
                      className="text-sm font-bold whitespace-nowrap"
                      style={{ color: "oklch(28% 0.06 145)" }}
                    >
                      {displayName}
                    </p>
                  )}
                </div>

                {/* Logout button */}
                <button
                  type="button"
                  data-ocid="dashboard.logout_button"
                  onClick={clear}
                  title="Logout"
                  className="flex items-center justify-center h-7 w-7 rounded-full transition-colors hover:bg-red-50 active:bg-red-100"
                  style={{ color: "oklch(55% 0.18 25)" }}
                >
                  <LogOut size={16} />
                </button>

                {/* Avatar — click to edit profile */}
                <button
                  type="button"
                  onClick={openProfileSheet}
                  className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  style={
                    {
                      "--tw-ring-color": "oklch(50% 0.18 145)",
                    } as React.CSSProperties
                  }
                  title="Edit profile"
                >
                  <Avatar
                    className="h-10 w-10 border-2"
                    style={{ borderColor: "oklch(70% 0.15 145)" }}
                  >
                    {userPhoto && <AvatarImage src={userPhoto} alt="profile" />}
                    <AvatarFallback
                      className="text-sm font-bold text-white"
                      style={{ background: "oklch(50% 0.18 145)" }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </div>
            ) : (
              <Button
                data-ocid="dashboard.primary_button"
                size="sm"
                onClick={login}
                disabled={isLoggingIn}
                className="flex items-center gap-1.5 text-xs font-semibold"
                style={{ background: "oklch(50% 0.18 145)", color: "white" }}
              >
                <LogIn size={14} />
                {isLoggingIn ? "Signing in..." : "Login"}
              </Button>
            )}
          </div>
        </motion.header>

        {/* Main content */}
        <main className="flex-1 px-4 pt-5 pb-28">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="text-xs font-bold uppercase tracking-widest mb-3 px-1"
            style={{ color: "oklch(58% 0.08 145)" }}
          >
            Dashboard Overview
          </motion.p>

          <div className="grid grid-cols-2 gap-3">
            <motion.div
              data-ocid="dashboard.card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.4 }}
              onClick={() => setSubView("pending-list")}
              className="card-orange rounded-2xl p-4 shadow-card cursor-pointer active:scale-95 transition-transform"
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="h-9 w-9 rounded-xl flex items-center justify-center"
                  style={{ background: "oklch(78% 0.14 55)" }}
                >
                  <Package size={18} style={{ color: "oklch(40% 0.18 55)" }} />
                </div>
              </div>
              <p
                className="text-[32px] font-extrabold leading-none font-display"
                style={{ color: "oklch(28% 0.06 55)" }}
              >
                {pendingDeliveries.length > 0 ? pendingDeliveries.length : "—"}
              </p>
              <p
                className="text-[10px] font-bold uppercase tracking-wide mt-1"
                style={{ color: "oklch(40% 0.10 55)" }}
              >
                PENDING ORDERS
              </p>
            </motion.div>

            <motion.div
              data-ocid="dashboard.card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.4 }}
              onClick={() => setSubView("complete-list")}
              className="card-green rounded-2xl p-4 shadow-card cursor-pointer active:scale-95 transition-transform"
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center"
                  style={{ background: "oklch(55% 0.18 145)" }}
                >
                  <CheckCircle2 size={18} className="text-white" />
                </div>
              </div>
              <p
                className="text-[32px] font-extrabold leading-none font-display"
                style={{ color: "oklch(28% 0.06 145)" }}
              >
                {completeDeliveries.length > 0
                  ? completeDeliveries.length
                  : "—"}
              </p>
              <p
                className="text-[10px] font-bold uppercase tracking-wide mt-1"
                style={{ color: "oklch(40% 0.12 145)" }}
              >
                COMPLETED ORDERS
              </p>
            </motion.div>

            <motion.div
              data-ocid="dashboard.card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="card-blue rounded-2xl p-4 shadow-card"
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="h-9 w-9 rounded-xl flex items-center justify-center"
                  style={{ background: "oklch(75% 0.12 240)" }}
                >
                  <Layers size={18} style={{ color: "oklch(38% 0.16 240)" }} />
                </div>
              </div>
              <p
                className="text-[28px] font-extrabold leading-none font-display"
                style={{ color: "oklch(28% 0.06 240)" }}
              >
                {pendingDeliveries.reduce((s, d) => s + d.totalBricks, 0) +
                  completeDeliveries.reduce((s, d) => s + d.totalBricks, 0) ||
                  "—"}
              </p>
              <p
                className="text-[10px] font-bold uppercase tracking-wide mt-1"
                style={{ color: "oklch(40% 0.12 240)" }}
              >
                TOTAL BRICKS
              </p>
            </motion.div>

            <motion.div
              data-ocid="dashboard.card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36, duration: 0.4 }}
              className="card-sage rounded-2xl p-4 shadow-card"
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center"
                  style={{ background: "oklch(38% 0.14 160)" }}
                >
                  <IndianRupee size={18} className="text-white" />
                </div>
              </div>
              <p
                className="text-[26px] font-extrabold leading-none font-display"
                style={{ color: "oklch(28% 0.06 160)" }}
              >
                {totalRevenue > 0
                  ? `₹${Math.round(totalRevenue).toLocaleString()}`
                  : "—"}
              </p>
              <p
                className="text-[10px] font-bold uppercase tracking-wide mt-1"
                style={{ color: "oklch(40% 0.12 160)" }}
              >
                TOTAL REVENUE
              </p>
            </motion.div>
          </div>
        </main>

        <div className="fixed bottom-[68px] left-1/2 -translate-x-1/2 w-full max-w-[430px] text-center pb-1 pointer-events-none">
          <p
            className="text-[10px] italic"
            style={{ color: "oklch(65% 0.05 145)" }}
          >
            SAHA Business Suite v1.5
          </p>
        </div>

        <nav
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t shadow-lg pb-safe"
          style={{ borderColor: "oklch(88% 0.04 145)" }}
        >
          <div className="flex items-center justify-around h-[62px] px-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  data-ocid={`nav.${item.id}.tab`}
                  onClick={() => setActiveTab(item.id)}
                  className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-xl transition-colors"
                  style={{
                    color: isActive
                      ? "oklch(45% 0.18 145)"
                      : "oklch(65% 0.04 145)",
                  }}
                >
                  <span
                    className={isActive ? "scale-110" : "scale-100"}
                    style={{ transition: "transform 0.15s" }}
                  >
                    {item.icon}
                  </span>
                  <span className="text-[9px] font-bold tracking-wide leading-none">
                    {item.label}
                  </span>
                  {isActive && (
                    <span
                      className="absolute bottom-[62px] h-0.5 w-8 rounded-full"
                      style={{ background: "oklch(50% 0.18 145)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Profile Edit Sheet */}
        <Sheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen}>
          <SheetContent
            data-ocid="profile.sheet"
            side="bottom"
            className="rounded-t-2xl px-6 pb-10 pt-6 max-w-[430px] mx-auto"
          >
            <SheetHeader className="mb-6">
              <SheetTitle
                className="text-center text-lg font-bold"
                style={{ color: "oklch(28% 0.06 145)" }}
              >
                Edit Profile
              </SheetTitle>
            </SheetHeader>

            {/* Photo preview */}
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="relative">
                <Avatar
                  className="h-20 w-20 border-4"
                  style={{ borderColor: "oklch(70% 0.15 145)" }}
                >
                  {userPhoto && <AvatarImage src={userPhoto} alt="profile" />}
                  <AvatarFallback
                    className="text-2xl font-bold text-white"
                    style={{ background: "oklch(50% 0.18 145)" }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  data-ocid="profile.upload_button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full flex items-center justify-center shadow-md"
                  style={{ background: "oklch(50% 0.18 145)", color: "white" }}
                  title="Change photo"
                >
                  <Camera size={13} />
                </button>
              </div>
              <p className="text-xs" style={{ color: "oklch(60% 0.04 145)" }}>
                Tap camera icon to change photo
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Name input */}
            <div className="mb-6">
              <label
                htmlFor="profile-display-name"
                className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                style={{ color: "oklch(55% 0.08 145)" }}
              >
                Display Name
              </label>
              <Input
                id="profile-display-name"
                data-ocid="profile.input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter your name (e.g. PRABIR SAHA)"
                className="text-sm font-medium"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                data-ocid="profile.cancel_button"
                variant="outline"
                className="flex-1"
                onClick={() => setProfileSheetOpen(false)}
              >
                Cancel
              </Button>
              <Button
                data-ocid="profile.save_button"
                className="flex-1 font-semibold"
                style={{ background: "oklch(50% 0.18 145)", color: "white" }}
                onClick={handleSaveProfile}
              >
                Save
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
