import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import type { EmploymentType, Seniority } from "@/lib/api/types";

export interface JobFilterValue {
  remote?: boolean;
  tags: string[];
  salary_min: number;
}

const TAGS = ["Engineering", "IT", "Finance", "Marketing", "Management", "Design", "Product"];

interface JobFiltersProps {
  value: JobFilterValue;
  onChange: (next: Partial<JobFilterValue>) => void;
  onReset: () => void;
}

export function JobFilters({ value, onChange, onReset }: JobFiltersProps) {
  const toggle = <T extends string>(list: T[], item: T): T[] =>
    list.includes(item) ? list.filter((v) => v !== item) : [...list, item];

  const [localSalary, setLocalSalary] = useState(value.salary_min);
  useEffect(() => setLocalSalary(value.salary_min), [value.salary_min]);

  return (
    <aside className="sticky top-20 space-y-8 rounded-2xl border border-border/70 bg-card/40 p-6 backdrop-blur">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Filters</h2>
        <Button variant="ghost" size="sm" onClick={onReset} className="h-7 text-xs text-muted-foreground">
          Reset
        </Button>
      </div>

      <section className="flex items-center justify-between">
        <Label htmlFor="remote" className="text-sm">Remote only</Label>
        <Switch
          id="remote"
          checked={value.remote === true}
          onCheckedChange={(v) => onChange({ remote: v ? true : undefined })}
        />
      </section>



      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Min salary</h3>
          <span className="text-xs text-muted-foreground">${(localSalary / 1000).toFixed(0)}k+</span>
        </div>
        <Slider
          value={[localSalary]}
          min={0}
          max={300_000}
          step={10_000}
          onValueChange={([v]) => setLocalSalary(v)}
          onValueCommit={([v]) => onChange({ salary_min: v })}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tags</h3>
        <div className="flex flex-wrap gap-1.5">
          {TAGS.map((t) => {
            const active = value.tags.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => onChange({ tags: toggle(value.tags, t) })}
                className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                  active
                    ? "border-transparent bg-foreground text-background"
                    : "border-border/60 bg-background/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
