import { animate, motion, useMotionValue } from "framer-motion";
import { useRef } from "react";
import { contrastText } from "../utils/colors";
import { sfx } from "../utils/sounds";

export type WheelSlice = {
  id: string;
  label: string;
  color: string;
};

export function Wheel({
  slices,
  spinning,
  onSpinStart,
  onSpinEnd,
  spinButtonRef,
}: {
  slices: WheelSlice[];
  spinning: boolean;
  onSpinStart: () => void;
  onSpinEnd: (id: string) => void;
  spinButtonRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  const rotation = useMotionValue(0);
  const cumulativeRef = useRef(0);

  const n = slices.length;
  const sliceAngle = n > 0 ? 360 / n : 0;
  const radius = 95;

  const handleSpin = () => {
    if (spinning || n === 0) return;
    onSpinStart();
    const pickedIdx = Math.floor(Math.random() * n);
    const sliceCenter = (pickedIdx + 0.5) * sliceAngle;
    const jitter = (Math.random() - 0.5) * sliceAngle * 0.7;
    const targetMod = ((360 - sliceCenter + jitter) % 360 + 360) % 360;
    const currentMod = ((cumulativeRef.current % 360) + 360) % 360;
    const delta = ((targetMod - currentMod) % 360 + 360) % 360;
    const spins = 5 + Math.floor(Math.random() * 3);
    const newRotation = cumulativeRef.current + spins * 360 + delta;
    cumulativeRef.current = newRotation;
    sfx.spinSequence();
    animate(rotation, newRotation, {
      duration: 4.5,
      ease: [0.16, 1, 0.3, 1],
      onComplete: () => {
        sfx.ding();
        onSpinEnd(slices[pickedIdx].id);
      },
    });
  };

  if (n === 0) {
    return (
      <div className="text-center text-slate-500 py-10">
        No evaluators left to spin.
      </div>
    );
  }

  return (
    <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] mx-auto">
      {/* Pointer */}
      <svg
        viewBox="-10 -10 20 20"
        className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 w-10 h-10 drop-shadow-lg"
        aria-hidden
      >
        <polygon points="0,9 -8,-7 8,-7" fill="#0f172a" />
        <polygon points="0,6 -5,-5 5,-5" fill="#facc15" />
      </svg>

      {/* Wheel SVG */}
      <svg
        viewBox="-105 -105 210 210"
        className="w-full h-full drop-shadow-2xl"
      >
        <circle r={radius + 5} fill="#0f172a" />
        <motion.g style={{ rotate: rotation, transformOrigin: "0px 0px" }}>
          {slices.map((s, i) => {
            const startAngle = i * sliceAngle - 90;
            const endAngle = (i + 1) * sliceAngle - 90;
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            const x1 = radius * Math.cos(startRad);
            const y1 = radius * Math.sin(startRad);
            const x2 = radius * Math.cos(endRad);
            const y2 = radius * Math.sin(endRad);
            const largeArc = sliceAngle > 180 ? 1 : 0;
            const path = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
            const midAngle = (startAngle + endAngle) / 2;
            const midRad = (midAngle * Math.PI) / 180;
            const labelX = radius * 0.65 * Math.cos(midRad);
            const labelY = radius * 0.65 * Math.sin(midRad);
            let textRotation = midAngle + 90;
            const normalized = ((textRotation + 540) % 360) - 180;
            if (normalized > 90 || normalized < -90) textRotation += 180;
            return (
              <g key={s.id}>
                <path
                  d={path}
                  fill={s.color}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
                <text
                  x={labelX}
                  y={labelY}
                  fill={contrastText(s.color)}
                  fontSize="11"
                  fontWeight="800"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${textRotation}, ${labelX}, ${labelY})`}
                  style={{ pointerEvents: "none" }}
                >
                  {s.label}
                </text>
              </g>
            );
          })}
        </motion.g>
        <circle
          r={radius * 0.2}
          fill="#0f172a"
          stroke="#facc15"
          strokeWidth={2}
        />
      </svg>

      {/* Center spin button */}
      <button
        ref={spinButtonRef}
        onClick={handleSpin}
        disabled={spinning}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-20 h-20 rounded-full bg-white text-slate-900 font-extrabold text-base shadow-2xl border-4 border-slate-900 hover:scale-110 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {spinning ? "..." : "SPIN"}
      </button>
    </div>
  );
}
