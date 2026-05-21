import * as Tabs from "@radix-ui/react-tabs";
import { Settings } from "lucide-react";
import { useEvaluationStore, useSessionStore } from "../store/evaluationStore";
import type { TabId } from "../types";
import { ItemsTab } from "./ItemsTab";
import { SpinTab } from "./SpinTab";
import { RaceTab } from "./RaceTab";
import { ResultsTab } from "./ResultsTab";
import { SoundToggle } from "./SoundToggle";
import { useShortcut } from "../utils/useShortcut";
import { primeAudio, sfx } from "../utils/sounds";

const TAB_LIST: { id: TabId; label: string }[] = [
  { id: "items", label: "Items" },
  { id: "spin", label: "Spin" },
  { id: "race", label: "Race" },
  { id: "results", label: "Results" },
];

export function TabShell() {
  const title = useEvaluationStore((s) => s.config.welcomeTitle);
  const soundEnabled = useEvaluationStore((s) => s.config.soundEnabled ?? true);
  const updateConfig = useEvaluationStore((s) => s.updateConfig);
  const activeTab = useSessionStore((s) => s.activeTab);
  const setActiveTab = useSessionStore((s) => s.setActiveTab);
  const openAdmin = useSessionStore((s) => s.setAdminOpen);

  useShortcut("m", () => {
    const next = !soundEnabled;
    updateConfig({ soundEnabled: next });
    if (next) {
      primeAudio();
      sfx.click();
    }
  });
  useShortcut("M", () => {
    const next = !soundEnabled;
    updateConfig({ soundEnabled: next });
    if (next) {
      primeAudio();
      sfx.click();
    }
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-pink-50 to-amber-50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200/70 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <h1 className="text-lg sm:text-xl font-extrabold bg-linear-to-r from-fuchsia-600 to-orange-500 bg-clip-text text-transparent">
            {title}
          </h1>

          <Tabs.Root
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabId)}
            className="flex-1"
          >
            <Tabs.List
              aria-label="Sections"
              className="flex justify-center gap-1 sm:gap-2"
            >
              {TAB_LIST.map((t) => (
                <Tabs.Trigger
                  key={t.id}
                  value={t.id}
                  className="px-4 py-2 rounded-full text-sm font-semibold text-slate-600 data-[state=active]:text-white data-[state=active]:bg-linear-to-r data-[state=active]:from-fuchsia-600 data-[state=active]:to-orange-500 data-[state=active]:shadow-md hover:bg-slate-100 data-[state=active]:hover:opacity-95 transition"
                >
                  {t.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </Tabs.Root>

          <SoundToggle />
          <button
            onClick={() => openAdmin(true)}
            aria-label="Open admin settings"
            className="rounded-full bg-slate-100 hover:bg-slate-200 transition p-2.5"
          >
            <Settings className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === "items" && <ItemsTab />}
        {activeTab === "spin" && <SpinTab />}
        {activeTab === "race" && <RaceTab />}
        {activeTab === "results" && <ResultsTab />}
      </main>
    </div>
  );
}
