import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useEvaluationStore, useSessionStore } from "./store/evaluationStore";
import { WelcomeSplash } from "./components/WelcomeSplash";
import { TabShell } from "./components/TabShell";
import { AdminPanel } from "./components/AdminPanel";
import { applyTheme, watchSystemTheme } from "./utils/theme";

export function App() {
  const hasEntered = useSessionStore((s) => s.hasEnteredApp);
  const theme = useEvaluationStore((s) => s.config.theme ?? "system");

  useEffect(() => {
    applyTheme(theme);
    if (theme === "system") {
      return watchSystemTheme(() => applyTheme("system"));
    }
  }, [theme]);

  return (
    <>
      <AnimatePresence mode="wait">
        {hasEntered ? (
          <motion.div
            key="shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <TabShell />
          </motion.div>
        ) : (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <WelcomeSplash />
          </motion.div>
        )}
      </AnimatePresence>
      <AdminPanel />
    </>
  );
}
