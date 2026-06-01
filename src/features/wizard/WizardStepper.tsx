import { strings } from "@/constants/strings";
import type { WizardStep } from "@/types/report";

const ORDER: WizardStep[] = ["upload", "grouping", "options", "results"];
const LABEL: Record<WizardStep, string> = {
  upload: strings.steps.upload,
  grouping: strings.steps.grouping,
  options: strings.steps.options,
  results: strings.steps.done,
};

export function WizardStepper({ step }: { step: WizardStep }) {
  const activeIndex = ORDER.indexOf(step);
  return (
    <ol className="mb-10 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 sm:gap-x-3">
      {ORDER.map((s, i) => {
        const isDone = i < activeIndex;
        const isActive = i === activeIndex;
        return (
          <li key={s} className="flex items-center gap-2 sm:gap-3">
            <span
              className={[
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                isDone && "bg-primary text-primary-foreground",
                isActive && "bg-primary text-primary-foreground ring-4 ring-primary/15",
                !isDone && !isActive && "border border-border bg-background text-muted-foreground",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {isDone ? "✓" : i + 1}
            </span>
            <span
              className={[
                "text-sm",
                isActive ? "font-medium text-foreground" : "text-muted-foreground",
              ].join(" ")}
            >
              {LABEL[s]}
            </span>
            {i < ORDER.length - 1 && (
              <span
                className={[
                  "ml-1 hidden h-px w-8 sm:block",
                  i < activeIndex ? "bg-primary/60" : "bg-border",
                ].join(" ")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
