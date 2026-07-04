import { motion } from "framer-motion"

const spineVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.7, ease: "easeInOut" },
  },
}

const nodeVariants = {
  hidden: { scale: 0, opacity: 0 },
  show: {
    scale: 1,
    opacity: 1,
    transition: { delay: 0.6, duration: 0.35, type: "spring", bounce: 0.45 },
  },
}

export function AnimatedJobionMark(props: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={props.className} aria-hidden="true">
      <motion.path
        d="M38 16v20c0 6.6-5.4 12-12 12-4.9 0-9.1-2.9-11-7"
        stroke="#E6E8EB"
        strokeWidth={6}
        strokeLinecap="round"
        variants={spineVariants}
        initial="hidden"
        animate="show"
      />
      <motion.circle
        cx={44}
        cy={44}
        r={6}
        fill="#2E6FFF"
        variants={nodeVariants}
        initial="hidden"
        animate="show"
      />
    </svg>
  )
}
