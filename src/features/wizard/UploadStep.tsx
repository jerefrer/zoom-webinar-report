import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { strings } from "@/constants/strings";
import { compareRoomFilenames } from "@/lib/grouping";
import type { InspectResult } from "@/types/report";
import { Dropzone } from "./Dropzone";

interface Props {
  files: File[];
  results: InspectResult[];
  isInspecting: boolean;
  onFiles: (files: File[]) => void;
  onNext: () => void;
}

export function UploadStep({ files: _files, results, isInspecting, onFiles, onNext }: Props) {
  const hasValid = results.some((r) => r.status === "ok");
  const sortedResults = useMemo(
    () => [...results].sort((a, b) => compareRoomFilenames(a.filename, b.filename)),
    [results],
  );
  return (
    <div className="space-y-6">
      <Dropzone onFiles={onFiles} />
      {isInspecting && <p className="text-sm text-muted-foreground">{strings.upload.inspecting}</p>}
      {sortedResults.length > 0 && (
        <ul className="space-y-2">
          {sortedResults.map((r) => (
            <li key={r.filename} className="flex items-center justify-between rounded-lg border p-3">
              <span className="truncate">{r.filename}</span>
              {r.status === "ok" ? (
                <Badge variant="secondary">
                  {r.detected_date ?? strings.upload.noDate} · {r.attendee_count} {strings.upload.attendees}
                </Badge>
              ) : (
                <Badge variant="destructive">{strings.upload.invalidFile}</Badge>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!hasValid || isInspecting}>{strings.upload.next}</Button>
      </div>
    </div>
  );
}
