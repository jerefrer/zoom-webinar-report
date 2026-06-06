import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { strings } from "@/constants/strings";
import type { Bucket } from "@/lib/grouping";
import type { Grouping } from "@/types/report";
import { DayBucket } from "./DayBucket";
import { FileCardOverlay } from "./FileCard";

interface Props {
  grouping: Grouping;
  onMove: (filename: string, to: Bucket) => void;
  onAddDay: () => void;
  onRemoveFile: (filename: string) => void;
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
}

function bucketFromId(id: string): Bucket {
  if (id === "unassigned") return { kind: "unassigned" };
  return { kind: "day", index: Number(id.replace("day-", "")) };
}

export function GroupingStep({ grouping, onMove, onAddDay, onRemoveFile, onBack, onNext, canNext }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (!e.over) return;
    onMove(String(e.active.id), bucketFromId(String(e.over.id)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{strings.grouping.title}</h2>
        <p className="text-sm text-muted-foreground">{strings.grouping.hint}</p>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        {/* One day bucket per row so dragging between days is a natural
            top-to-bottom motion (was a 3-up grid). */}
        <div className="grid grid-cols-1 gap-4">
          {grouping.days.map((files, i) => (
            <DayBucket
              key={`day-${i}`}
              id={`day-${i}`}
              label={`${strings.grouping.day} ${i + 1}`}
              files={files}
              onRemoveFile={onRemoveFile}
            />
          ))}
        </div>

        {grouping.unassigned.length > 0 && (
          <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
            <p className="mb-2 text-sm font-medium text-destructive">{strings.grouping.unassigned}</p>
            <DayBucket id="unassigned" label="" files={grouping.unassigned} onRemoveFile={onRemoveFile} />
          </div>
        )}

        <DragOverlay>{activeId ? <FileCardOverlay filename={activeId} /> : null}</DragOverlay>
      </DndContext>

      <Button variant="outline" onClick={onAddDay}>{strings.grouping.addDay}</Button>

      {!canNext && <p className="text-sm text-destructive">{strings.grouping.resolveUnassigned}</p>}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>{strings.grouping.back}</Button>
        <Button onClick={onNext} disabled={!canNext}>{strings.grouping.next}</Button>
      </div>
    </div>
  );
}
