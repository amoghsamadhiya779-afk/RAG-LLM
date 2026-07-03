import { useCallback, useRef, useState, type DragEvent } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPT = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB (audit G1)

// Magic-byte sniff — extension/MIME alone is trivially spoofed.
// PDF starts with %PDF, DOCX (zip) starts with PK\x03\x04.
async function sniff(file: File): Promise<"pdf" | "docx" | "text" | "unknown"> {
  const buf = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return "pdf";
  if (buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04) return "docx";
  if (/\.txt$/i.test(file.name) || file.type === "text/plain") return "text";
  // Legacy .doc (OLE) — magic D0 CF 11 E0
  if (buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0) return "docx";
  return "unknown";
}

interface DropzoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function Dropzone({ onFile, disabled }: DropzoneProps) {
  const [hover, setHover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      if (file.size > MAX_BYTES) {
        setError("File is larger than 5 MB.");
        return;
      }
      if (!ACCEPT.includes(file.type) && !/\.(pdf|docx?|txt)$/i.test(file.name)) {
        setError("Only PDF, DOC, DOCX or TXT files are supported.");
        return;
      }
      const kind = await sniff(file);
      if (kind === "unknown") {
        setError("This file doesn't look like a real PDF/DOC/DOCX/TXT.");
        return;
      }
      setError(null);
      onFile(file);
    },
    [onFile],
  );

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setHover(false);
    if (disabled) return;
    void handle(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="space-y-2">
      <motion.label
        htmlFor="resume-input"
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setHover(true);
        }}
        onDragLeave={() => setHover(false)}
        onDrop={onDrop}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center transition-colors",
          hover && "border-primary/40 bg-primary/20/[0.04]",
          disabled && "pointer-events-none opacity-50",
        )}
        whileHover={{ scale: disabled ? 1 : 1.005 }}
      >
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-primary via-primary/70 to-primary blur-2xl opacity-60 group-hover:opacity-90 transition-opacity" />
          <div className="grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur">
            <UploadCloud className="size-6 text-zinc-200" />
          </div>
        </div>
        <div>
          <p className="text-sm text-zinc-200">
            Drop your resume here, or <span className="text-primary underline underline-offset-4">browse</span>
          </p>
          <p className="mt-1 text-xs text-zinc-500 font-mono">PDF · DOC · DOCX · TXT — max 5 MB</p>
        </div>
        <input
          ref={inputRef}
          id="resume-input"
          type="file"
          className="sr-only"
          accept=".pdf,.doc,.docx,.txt"
          disabled={disabled}
          onChange={(e) => void handle(e.target.files?.[0] ?? undefined)}
        />
      </motion.label>
      {error && (
        <p className="flex items-center gap-2 text-xs text-red-400">
          <FileText className="size-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}
