import { useDraggable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";

interface Props {
  filename: string;
  onRemove: (filename: string) => void;
}

const CARD_CLASS =
  "flex items-center justify-between gap-2 rounded-lg border bg-card p-2 shadow-sm";

export function FileCard({ filename, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: filename });
  // With <DragOverlay> handling the moving clone, the source must NOT be
  // transformed (that's what got clipped by the bucket's `overflow-hidden`).
  // We only dim it in place while its overlay clone follows the cursor.
  const style = isDragging ? { opacity: 0.4 } : undefined;
  return (
    <div ref={setNodeRef} style={style} className={CARD_CLASS}>
      <button {...listeners} {...attributes} className="cursor-grab truncate text-sm" aria-label={`Move ${filename}`}>
        {filename}
      </button>
      <Button variant="ghost" size="sm" onClick={() => onRemove(filename)} aria-label={`Remove ${filename}`}>✕</Button>
    </div>
  );
}

/** Non-interactive visual clone rendered inside `<DragOverlay>`. Lives in a
 *  portal above the layout, so it is never clipped by an ancestor's
 *  `overflow-hidden` and stays visible under the cursor across day buckets. */
export function FileCardOverlay({ filename }: { filename: string }) {
  return (
    <div data-testid="file-card-overlay" className={`${CARD_CLASS} cursor-grabbing ring-2 ring-primary shadow-lg`}>
      <span className="truncate text-sm">{filename}</span>
      <span aria-hidden="true" className="px-2 text-muted-foreground">✕</span>
    </div>
  );
}
