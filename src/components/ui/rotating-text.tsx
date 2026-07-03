import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { AnimatePresence, motion, type Transition, type TargetAndTransition } from "framer-motion";
import "./rotating-text.css";
import { cn } from "@/lib/utils";

export interface RotatingTextProps {
  texts: string[];
  rotationInterval?: number;
  staggerDuration?: number;
  staggerFrom?: "first" | "last" | "center" | number;
  splitBy?: "characters" | "words";
  transition?: Transition;
  initial?: TargetAndTransition;
  animate?: TargetAndTransition;
  exit?: TargetAndTransition;
  mainClassName?: string;
  elementLevelClassName?: string;
  splitLevelClassName?: string;
  auto?: boolean;
  loop?: boolean;
  style?: CSSProperties;
}

const splitText = (text: string, mode: "characters" | "words") => {
  if (mode === "words") return text.split(" ").map((w) => [w]);
  return text.split(" ").map((word) => Array.from(word));
};

export function RotatingText({
  texts,
  rotationInterval = 2200,
  staggerDuration = 0.025,
  staggerFrom = "first",
  splitBy = "characters",
  transition = { type: "spring", damping: 30, stiffness: 400 },
  initial = { y: "100%", opacity: 0 },
  animate = { y: 0, opacity: 1 },
  exit = { y: "-120%", opacity: 0 },
  mainClassName,
  elementLevelClassName,
  splitLevelClassName,
  auto = true,
  loop = true,
  style,
}: RotatingTextProps) {
  const [index, setIndex] = useState(0);

  const words = useMemo(() => splitText(texts[index] ?? "", splitBy), [texts, index, splitBy]);

  const totalChars = useMemo(
    () => words.reduce((n, w) => n + w.length, 0),
    [words],
  );

  const getDelay = useCallback(
    (globalIdx: number) => {
      if (staggerFrom === "first") return globalIdx * staggerDuration;
      if (staggerFrom === "last") return (totalChars - 1 - globalIdx) * staggerDuration;
      if (staggerFrom === "center") {
        const c = (totalChars - 1) / 2;
        return Math.abs(c - globalIdx) * staggerDuration;
      }
      if (typeof staggerFrom === "number") {
        return Math.abs(staggerFrom - globalIdx) * staggerDuration;
      }
      return globalIdx * staggerDuration;
    },
    [staggerFrom, staggerDuration, totalChars],
  );

  useEffect(() => {
    if (!auto || texts.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => {
        const next = i + 1;
        if (next >= texts.length) return loop ? 0 : i;
        return next;
      });
    }, rotationInterval);
    return () => clearInterval(id);
  }, [auto, loop, rotationInterval, texts.length]);

  let running = 0;

  return (
    <span className={cn("rotating-text", mainClassName)} style={style}>
      <span className="rotating-text__sr">{texts[index]}</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={index}
          aria-hidden
          className={cn("rotating-text__inner", elementLevelClassName)}
          style={{ display: "inline-flex", whiteSpace: "nowrap" }}
        >
          {words.map((chars, wi) => (
            <span
              key={wi}
              className={cn("rotating-text__word", splitLevelClassName)}
            >
              {chars.map((ch, ci) => {
                const delay = getDelay(running++);
                return (
                  <motion.span
                    key={ci}
                    className="rotating-text__char"
                    initial={initial}
                    animate={animate}
                    exit={exit}
                    transition={{ ...transition, delay }}
                  >
                    {ch}
                  </motion.span>
                );
              })}
              {wi < words.length - 1 && (
                <span className="rotating-text__char">&nbsp;</span>
              )}
            </span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default RotatingText;
