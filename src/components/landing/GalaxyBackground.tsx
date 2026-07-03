import { lazy, Suspense, useEffect, useState } from "react"
import { useReducedMotion } from "framer-motion"

const Galaxy = lazy(() => import("@/components/landing/Galaxy"))

// Module-level constant: stable references so the WebGL effect never re-inits
const GALAXY_PROPS = {
  focal: [0.5, 0.35] as [number, number],
  starSpeed: 0.3,
  density: 2.5,
  hueShift: 230,        // electric-blue tint
  saturation: 0,        // no color, pure white/silver stars
  glowIntensity: 1.8,
  twinkleIntensity: 0.8,
  rotationSpeed: 0.05,
  mouseInteraction: true,
  mouseRepulsion: true,
  repulsionStrength: 1.5,
  transparent: true,    // graphite #0B0C0E page bg shows through
}

function canRunGalaxy() {
  if (typeof window === "undefined") return false
  const finePointer = window.matchMedia("(pointer: fine)").matches
  const wideEnough = window.matchMedia("(min-width: 768px)").matches
  const cores = navigator.hardwareConcurrency ?? 4
  return finePointer && wideEnough && cores >= 4
}

export function GalaxyBackground() {
  const reduce = useReducedMotion()
  const [enabled, setEnabled] = useState(false)
  const [tabVisible, setTabVisible] = useState(true)

  useEffect(() => {
    setEnabled(canRunGalaxy())
    const onVis = () => setTabVisible(document.visibilityState === "visible")
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [])

  if (reduce || !enabled) return null // vignette placeholder stays - by design

  return (
    <div className="fixed inset-0 -z-[50]" aria-hidden="true">
      {tabVisible ? (
        <Suspense fallback={null}>
          <Galaxy {...GALAXY_PROPS} />
        </Suspense>
      ) : null}
    </div>
  )
}

export default GalaxyBackground
