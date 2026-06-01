import { useDraggable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";

interface Props {
  filename: string;
  onRemove: (filename: string) => void;
}

export function FileCard({ filename, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: filename });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.5 : 1 }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between gap-2 rounded-lg border bg-card p-2 shadow-sm"
    >
      <button {...listeners} {...attributes} className="cursor-grab truncate text-sm" aria-label={`Move ${filename}`}>
        {filename}
      </button>
      <Button variant="ghost" size="sm" onClick={() => onRemove(filename)} aria-label={`Remove ${filename}`}>✕</Button>
    </div>
  );
}
