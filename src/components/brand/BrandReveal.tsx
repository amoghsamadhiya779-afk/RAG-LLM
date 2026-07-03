import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"
import { introWillPlay, INTRO_TOTAL_MS } from "@/lib/intro"

// Phase 1 - BUILD: construction guides appear, the mark assembles ON them.
// Phase 2 - REVEAL: scaffolding dissolves, wordmark focus-pulls in.
// Industry discipline: GPU-only properties (opacity / transform / filter /
// pathLength), zero bounce, continuous slow zoom across the whole sequence.
const EASE_OUT = [0.16, 1, 0.3, 1]

// Guides fade in, hold while the mark builds, then dissolve (keyframes).
const guideVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: [0, 0.22, 0.22, 0],
    transition: { delay: 0.2, duration: 1.45, times: [0, 0.24, 0.72, 1] },
  },
}

const spineVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { delay: 0.45, duration: 0.8, ease: "easeInOut" },
  },
}

// Node assembles in two steps: the ring traces its orbit, then the fill lands.
const nodeTraceVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { delay: 1.15, duration: 0.3, ease: "easeInOut" },
  },
}

const nodeFillVariants = {
  hidden: { scale: 0.6, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { delay: 1.35, duration: 0.35, ease: EASE_OUT },
  },
}

const glowVariants = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: {
    opacity: 0.45,
    scale: 1,
    transition: { delay: 1.35, duration: 0.9, ease: "easeOut" },
  },
}

// Focus pull: blur -> sharp. Never animate letter-spacing (layout jank).
const wordmarkVariants = {
  hidden: { opacity: 0, y: 14, scale: 1.02, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { delay: 1.45, duration: 0.7, ease: EASE_OUT },
  },
}

// The console tell: an ultra-slow zoom across the entire sequence.
const lockupVariants = {
  hidden: { scale: 0.96 },
  visible: {
    scale: 1,
    transition: { duration: 2.6, ease: "linear" },
  },
}

const OVERLAY_EXIT = {
  opacity: 0,
  transition: { duration: 0.6, ease: "easeInOut" },
}

const LOCKUP_EXIT = {
  scale: 1.04,
  opacity: 0,
  filter: "blur(6px)",
  transition: { duration: 0.55, ease: "easeInOut" },
}

export function BrandReveal() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    // If it shouldn't play (already seen), hide it immediately after hydration
    if (!introWillPlay()) {
      setShow(false)
      return
    }
    const t = setTimeout(() => setShow(false), INTRO_TOTAL_MS)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="brand-reveal"
          id="brand-reveal-overlay"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B0C0E]"
          exit={OVERLAY_EXIT}
          aria-hidden="true"
        >
          <motion.div
            className="relative flex flex-col items-center gap-6 will-change-transform"
            variants={lockupVariants}
            initial="hidden"
            animate="visible"
            exit={LOCKUP_EXIT}
          >
            <motion.div
              className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2E6FFF]/15 blur-3xl"
              variants={glowVariants}
              initial="hidden"
              animate="visible"
            />
            <motion.svg
              viewBox="0 0 64 64"
              fill="none"
              className="relative h-24 w-24 md:h-28 md:w-28"
              initial="hidden"
              animate="visible"
            >
              <defs>
                <linearGradient
                  id="jobion-volt-reveal"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="0" stopColor="#2E6FFF" />
                  <stop offset="1" stopColor="#6AA2FF" />
                </linearGradient>
              </defs>
              <motion.g
                stroke="#E6E8EB"
                strokeWidth={0.75}
                variants={guideVariants}
              >
                <line x1={38} y1={4} x2={38} y2={60} />
                <line x1={4} y1={44} x2={60} y2={44} />
                <circle cx={44} cy={44} r={10} strokeDasharray="2 3" />
              </motion.g>
              <motion.path
                d="M38 16v20c0 6.6-5.4 12-12 12-4.9 0-9.1-2.9-11-7"
                stroke="#E6E8EB"
                strokeWidth={6}
                strokeLinecap="round"
                variants={spineVariants}
              />
              <motion.circle
                cx={44}
                cy={44}
                r={6}
                stroke="url(#jobion-volt-reveal)"
                strokeWidth={1.5}
                variants={nodeTraceVariants}
              />
              <motion.circle
                cx={44}
                cy={44}
                r={6}
                fill="url(#jobion-volt-reveal)"
                variants={nodeFillVariants}
              />
            </motion.svg>
            <motion.span
              className="relative text-3xl font-bold tracking-tight text-[#E6E8EB] md:text-4xl"
              variants={wordmarkVariants}
              initial="hidden"
              animate="visible"
            >
              jOBiON
            </motion.span>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default BrandReveal
