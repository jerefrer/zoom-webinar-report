import { useDroppable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { FileCard } from "./FileCard";

interface Props {
  id: string;
  label: string;
  files: string[];
  onRemoveFile: (filename: string) => void;
}

export function DayBucket({ id, label, files, onRemoveFile }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef}>
      <Card
        className={[
          "flex min-h-32 flex-col gap-2 p-3 transition-colors",
          isOver ? "ring-2 ring-primary" : "",
        ].join(" ")}
      >
        {label && <p className="text-sm font-semibold">{label}</p>}
        {files.map((f) => (
          <FileCard key={f} filename={f} onRemove={onRemoveFile} />
        ))}
      </Card>
    </div>
  );
}
