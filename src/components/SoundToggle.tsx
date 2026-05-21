import { Volume2, VolumeX } from "lucide-react";
import { useEvaluationStore } from "../store/evaluationStore";
import { primeAudio, sfx } from "../utils/sounds";

export function SoundToggle() {
  const enabled = useEvaluationStore((s) => s.config.soundEnabled ?? true);
  const updateConfig = useEvaluationStore((s) => s.updateConfig);

  return (
    <button
      onClick={() => {
        const next = !enabled;
        updateConfig({ soundEnabled: next });
        if (next) {
          primeAudio();
          sfx.click();
        }
      }}
      className="rounded-full bg-slate-100 hover:bg-slate-200 transition p-2.5"
      aria-label={enabled ? "Disable sound" : "Enable sound"}
      title={`Sound: ${enabled ? "on" : "off"} (press M)`}
    >
      {enabled ? (
        <Volume2 className="w-5 h-5 text-slate-700" />
      ) : (
        <VolumeX className="w-5 h-5 text-slate-400" />
      )}
    </button>
  );
}
