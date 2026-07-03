import { motion } from "framer-motion";

const columns = [
  { title: "Applied", count: 124, items: ["Alex C.", "Priya R.", "Marcus L."] },
  { title: "Reviewing", count: 38, items: ["Yuki S.", "Jordan P."] },
  { title: "Interview", count: 9, items: ["Sam D."] },
];

export function PipelineVisual() {
  return (
    <div className="overflow-hidden rounded-md bg-muted p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-micro text-secondary">Senior Full-Stack Engineer</div>
          <div className="text-small font-heading">Applicant pipeline</div>
        </div>
        <span className="rounded-full bg-gradient-accent px-2.5 py-1 text-[10px] font-heading uppercase tracking-wider text-white">
          Featured
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {columns.map((col, ci) => (
          <motion.div
            key={col.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: ci * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-lg border border-border bg-card p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-micro font-ui">{col.title}</span>
              <span className="text-[10px] text-secondary">{col.count}</span>
            </div>
            <div className="space-y-1.5">
              {col.items.map((name, i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: -6 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: ci * 0.12 + 0.3 + i * 0.08, duration: 0.35 }}
                  className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-[11px]"
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-muted text-[9px] font-heading">
                    {name.split(" ").map((s) => s[0]).join("")}
                  </span>
                  <span className="truncate">{name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
