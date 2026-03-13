import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  FileText,
  Home,
  IndianRupee,
  Layers,
  LogIn,
  Package,
  PlusCircle,
  Settings,
  Truck,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useUserProfile } from "./hooks/useQueries";
import AddPendingDelivery from "./pages/AddPendingDelivery";
import CompleteList from "./pages/CompleteList";
import DirectDelivery from "./pages/DirectDelivery";
import PendingList from "./pages/PendingList";
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
  wheelStandardRate: "",
  wheelSafeBatsRate: "",
};

export default function App() {
  const now = useClock();
  const { login, loginStatus, identity, isInitializing } =
    useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [subView, setSubView] = useState<SubView>(null);
  const [pendingDeliveries, setPendingDeliveries] = useState<PendingDelivery[]>(
    [],
  );
  const [completeDeliveries, setCompleteDeliveries] = useState<
    CompleteDelivery[]
  >([]);
  const [vehicles, setVehicles] = useState<VehicleConfig[]>([]);
  const [rates, setRates] = useState<RatesConfig>(DEFAULT_RATES);

  const isLoggedIn = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const displayName =
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

  function handleSavePending(delivery: PendingDelivery) {
    setPendingDeliveries((prev) => [...prev, delivery]);
    setActiveTab("home");
  }

  function handleSaveDirect(delivery: CompleteDelivery) {
    setCompleteDeliveries((prev) => [...prev, delivery]);
    setActiveTab("home");
  }

  if (activeTab === "add") {
    return (
      <div className={WRAPPER}>
        <div className={INNER}>
          <AddPendingDelivery
            onSave={handleSavePending}
            onBack={() => setActiveTab("home")}
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
            onSave={handleSaveDirect}
            onBack={() => setActiveTab("home")}
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
              <div className="flex items-center gap-2.5">
                <div className="text-right">
                  <p
                    className="text-[11px]"
                    style={{ color: "oklch(60% 0.04 145)" }}
                  >
                    Welcome back,
                  </p>
                  {profileLoading ? (
                    <Skeleton className="h-4 w-24 mt-0.5" />
                  ) : (
                    <p
                      className="text-sm font-bold"
                      style={{ color: "oklch(28% 0.06 145)" }}
                    >
                      {displayName}
                    </p>
                  )}
                </div>
                <Avatar
                  className="h-10 w-10 border-2"
                  style={{ borderColor: "oklch(70% 0.15 145)" }}
                >
                  <AvatarFallback
                    className="text-sm font-bold text-white"
                    style={{ background: "oklch(50% 0.18 145)" }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
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
                className="text-[32px] font-extrabold leading-none font-display"
                style={{ color: "oklch(28% 0.06 160)" }}
              >
                —
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
      </div>
    </div>
  );
}
