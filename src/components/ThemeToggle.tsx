import { Monitor, Moon, Sun } from "lucide-react";
import { useEvaluationStore } from "../store/evaluationStore";
import { nextThemeMode, type ThemeMode } from "../utils/theme";

const ICONS: Record<ThemeMode, React.ComponentType<{ className?: string }>> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

const LABELS: Record<ThemeMode, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

export function ThemeToggle() {
  const theme = useEvaluationStore((s) => s.config.theme ?? "system");
  const updateConfig = useEvaluationStore((s) => s.updateConfig);
  const Icon = ICONS[theme];

  return (
    <button
      onClick={() => updateConfig({ theme: nextThemeMode(theme) })}
      className="rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition p-2.5"
      aria-label={`Theme: ${LABELS[theme]} (press T to cycle)`}
      title={`Theme: ${LABELS[theme]} (T)`}
    >
      <Icon className="w-5 h-5 text-slate-700 dark:text-slate-200" />
    </button>
  );
}
