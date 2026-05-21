import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { useEvaluationStore, useSessionStore } from "../store/evaluationStore";
import { primeAudio, sfx } from "../utils/sounds";

export function WelcomeSplash() {
  const title = useEvaluationStore((s) => s.config.welcomeTitle);
  const subtitle = useEvaluationStore((s) => s.config.welcomeSubtitle);
  const tracks = useEvaluationStore((s) => s.tracks);
  const enter = useSessionStore((s) => s.setHasEnteredApp);
  const openAdmin = useSessionStore((s) => s.setAdminOpen);

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-fuchsia-600 via-pink-500 to-orange-400 text-white">
      <button
        onClick={() => openAdmin(true)}
        aria-label="Open admin settings"
        className="absolute top-4 right-4 z-20 rounded-full bg-white/15 hover:bg-white/30 transition p-3 backdrop-blur"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Animated blobs */}
      <motion.div
        aria-hidden
        className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-yellow-300/40 blur-3xl"
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute top-1/3 -right-20 w-[28rem] h-[28rem] rounded-full bg-cyan-300/30 blur-3xl"
        animate={{ x: [0, -80, 0], y: [0, 60, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-20 left-1/3 w-[32rem] h-[32rem] rounded-full bg-violet-400/30 blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, -40, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl md:text-7xl font-extrabold drop-shadow-2xl tracking-tight"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="mt-4 text-xl md:text-2xl opacity-95 max-w-2xl"
        >
          {subtitle}
        </motion.p>

        {tracks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-3 justify-center"
          >
            {tracks.map((t) => (
              <span
                key={t.id}
                className="rounded-full bg-white/15 backdrop-blur px-4 py-2 text-sm font-semibold"
              >
                {t.name}
              </span>
            ))}
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            primeAudio();
            sfx.click();
            enter(true);
          }}
          className="mt-12 px-10 py-4 rounded-full bg-white text-fuchsia-700 text-xl font-bold shadow-2xl hover:shadow-white/30 transition"
        >
          Let's Begin
        </motion.button>
      </div>
    </div>
  );
}
