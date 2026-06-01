import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { strings } from "@/constants/strings";
import { ThresholdInput } from "./ThresholdInput";

interface Props {
  topic: string;
  thresholds: number[];
  onTopic: (v: string) => void;
  onAddThreshold: (n: number) => void;
  onRemoveThreshold: (n: number) => void;
  onBack: () => void;
  onGenerate: () => void;
}

export function OptionsStep({ topic, thresholds, onTopic, onAddThreshold, onRemoveThreshold, onBack, onGenerate }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">{strings.options.title}</h2>

      <div className="space-y-2">
        <label htmlFor="event-title" className="text-sm font-medium">{strings.options.eventTitle}</label>
        <Input
          id="event-title"
          aria-label={strings.options.eventTitle}
          value={topic}
          onChange={(e) => onTopic(e.target.value)}
          placeholder={strings.options.eventTitlePlaceholder}
        />
      </div>

      <ThresholdInput thresholds={thresholds} onAdd={onAddThreshold} onRemove={onRemoveThreshold} />

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>{strings.options.back}</Button>
        <Button onClick={onGenerate}>{strings.options.generate}</Button>
      </div>
    </div>
  );
}
