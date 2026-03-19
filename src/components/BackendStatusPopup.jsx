import React from "react";
import { BrainCircuit, Cpu, Wifi, WifiOff, X } from "lucide-react";

const statusConfig = {
  ready: {
    label: "Ready",
    pill: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    dot: "bg-emerald-400",
  },
  warming: {
    label: "Waking",
    pill: "bg-amber-500/15 text-amber-200 border-amber-400/30",
    dot: "bg-amber-300",
  },
  offline: {
    label: "Offline",
    pill: "bg-red-500/15 text-red-200 border-red-400/30",
    dot: "bg-red-400",
  },
  idle: {
    label: "Idle",
    pill: "bg-coffee-500/15 text-coffee-200 border-coffee-400/20",
    dot: "bg-coffee-300",
  },
};

const BackendStatusRow = ({ icon: Icon, title, description, state }) => {
  const config = statusConfig[state] || statusConfig.idle;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-coffee-700/60 bg-coffee-900/60 p-3">
      <div className="mt-0.5 rounded-lg border border-coffee-700 bg-coffee-800/80 p-2 text-coffee-100">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${config.dot}`} />
          <div className="text-sm font-bold text-coffee-50">{title}</div>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${config.pill}`}>
            {config.label}
          </span>
        </div>
        <p className="mt-1 text-xs leading-snug text-coffee-300">{description}</p>
      </div>
    </div>
  );
};

export const BackendStatusButton = ({ mlState, rlState, onOpen, className = "" }) => {
  const allReady = mlState === "ready" && rlState === "ready";

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex items-center gap-2 rounded-full border border-coffee-700 bg-coffee-800/80 px-3 py-1.5 text-xs font-bold shadow-md transition-colors hover:bg-coffee-700 ${className}`}
    >
      {allReady ? <Wifi className="h-3.5 w-3.5 text-emerald-400" /> : <WifiOff className="h-3.5 w-3.5 text-amber-300" />}
      <span className="text-coffee-50">Server Status</span>
    </button>
  );
};

const BackendStatusPopup = ({ mlState, rlState, onDismiss, onOpen, phase }) => {
  const allReady = mlState === "ready" && rlState === "ready";
  const isPhase2Intro = phase === "pre-simulation";

  const summaryText = allReady
    ? "ML and RL services are awake and ready."
    : isPhase2Intro
      ? "We are waking the ML advisor and RL benchmark now so they can join you as Phase 2 begins."
      : "The app is waking the assistant services in the background.";

  if (!onOpen) {
    return (
      <div className="fixed bottom-5 left-5 z-50 w-[min(92vw,360px)] rounded-2xl border border-coffee-700/70 bg-coffee-950/92 p-4 shadow-2xl backdrop-blur">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-amber-400">
              {allReady ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              Server Status
            </div>
            <p className="mt-1 text-xs text-coffee-300">{summaryText}</p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full border border-coffee-700 bg-coffee-900 p-1.5 text-coffee-300 transition-colors hover:text-coffee-50"
            aria-label="Close backend status"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <BackendStatusRow
            icon={Cpu}
            title="ML Advisor"
            description="Used for price suggestions and week-by-week guidance."
            state={mlState}
          />
          <BackendStatusRow
            icon={BrainCircuit}
            title="RL Agent"
            description="Used for the RL benchmark opponent and policy suggestions."
            state={rlState}
          />
        </div>
      </div>
    );
  }

  return null;
};

export default BackendStatusPopup;
