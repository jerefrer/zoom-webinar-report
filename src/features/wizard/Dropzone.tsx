import { useRef, useState } from "react";
import { strings } from "@/constants/strings";

interface Props {
  onFiles: (files: File[]) => void;
}

function UploadGlyph({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={[
        "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors",
        active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
      ].join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <path d="M12 16V4" />
        <path d="m6 10 6-6 6 6" />
        <path d="M4 20h16" />
      </svg>
    </div>
  );
}

export function Dropzone({ onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const pick = (list: FileList | null) => {
    if (!list) return;
    onFiles(Array.from(list).filter((f) => f.name.toLowerCase().endsWith(".csv")));
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files); }}
      className={[
        "group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-all",
        over
          ? "border-primary bg-primary/5"
          : "border-border bg-muted/40 hover:border-primary/60 hover:bg-primary/3",
      ].join(" ")}
    >
      <UploadGlyph active={over} />
      <p className="text-lg font-medium text-foreground">{strings.upload.prompt}</p>
      <p className="mt-1 text-sm text-muted-foreground">{strings.upload.browse}</p>
      <input
        ref={inputRef}
        data-testid="file-input"
        type="file"
        accept=".csv"
        multiple
        className="hidden"
        onChange={(e) => pick(e.target.files)}
      />
    </div>
  );
}
