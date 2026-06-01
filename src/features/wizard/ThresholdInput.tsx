import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { strings } from "@/constants/strings";

interface Props {
  thresholds: number[];
  onAdd: (n: number) => void;
  onRemove: (n: number) => void;
}

export function ThresholdInput({ thresholds, onAdd, onRemove }: Props) {
  const [value, setValue] = useState("");
  const commit = () => {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) onAdd(Math.floor(n));
    setValue("");
  };
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          id="thresholds"
          aria-label={strings.options.thresholds}
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), commit())}
          placeholder="90"
        />
        <Button type="button" variant="secondary" onClick={commit}>{strings.options.addThreshold}</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {thresholds.map((t) => (
          <Badge key={t} variant="secondary" className="cursor-pointer gap-1">
            <span>{t} {strings.options.minuteUnit}</span>
            <button
              type="button"
              onClick={() => onRemove(t)}
              aria-label={`Remove ${t} min threshold`}
              className="ml-0.5 leading-none"
            >
              ✕
            </button>
          </Badge>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{strings.options.thresholdsHint}</p>
    </div>
  );
}
