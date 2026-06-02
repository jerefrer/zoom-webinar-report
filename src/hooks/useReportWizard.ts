import { useCallback, useMemo, useState } from "react";
import { addDay as addDayFn, groupByDate, moveFile, toGenerateDays } from "@/lib/grouping";
import type { Bucket } from "@/lib/grouping";
import { stripChineseSuffix } from "@/lib/title";
import { extractFullDate } from "@/lib/dates";
import type { Grouping, InspectResult, WizardStep } from "@/types/report";
import { parseZoomCsvBuffer } from "@/core/parser";

/** Shape passed to the XLSX builder — kept local since it's internal to the wizard flow. */
interface GenerateConfig {
  topic: string;
  thresholds: number[];
  days: { filenames: string[] }[];
}

const EMPTY: Grouping = { days: [], unassigned: [] };
const DEFAULT_THRESHOLDS: number[] = [40, 60];

function pickTopicFromInspection(res: InspectResult[]): string | null {
  // Prefer the "main" file (matching the desktop convention); fall back to any ok file.
  const main = res.find((r) => r.status === "ok" && r.topic && r.filename.toLowerCase().includes("main"));
  const raw = main?.topic ?? res.find((r) => r.status === "ok" && r.topic)?.topic;
  return raw ? stripChineseSuffix(raw) : null;
}

export function useReportWizard() {
  const [step, setStep] = useState<WizardStep>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<InspectResult[]>([]);
  const [grouping, setGrouping] = useState<Grouping>(EMPTY);
  const [topic, setTopic] = useState("");
  const [thresholds, setThresholds] = useState<number[]>(DEFAULT_THRESHOLDS);

  const fileMap = useMemo(() => new Map(files.map((f) => [f.name, f])), [files]);

  const applyInspection = useCallback((res: InspectResult[]) => {
    setResults(res);
    setGrouping(groupByDate(res));
    // Pre-fill the event title from the main file's Topic, but only if the user
    // hasn't typed anything yet — never clobber user input.
    setTopic((current) => {
      if (current.trim()) return current;
      return pickTopicFromInspection(res) ?? current;
    });
  }, []);

  const move = useCallback((filename: string, to: Bucket) => {
    setGrouping((g) => moveFile(g, filename, to));
  }, []);

  const addDay = useCallback(() => setGrouping((g) => addDayFn(g)), []);

  const removeFile = useCallback((filename: string) => {
    setFiles((fs) => fs.filter((f) => f.name !== filename));
    setResults((rs) => rs.filter((r) => r.filename !== filename));
    setGrouping((g) => ({
      days: g.days.map((d) => d.filter((f) => f !== filename)),
      unassigned: g.unassigned.filter((f) => f !== filename),
    }));
  }, []);

  const addThreshold = useCallback((n: number) => {
    setThresholds((t) => (n > 0 && !t.includes(n) ? [...t, n].sort((a, b) => a - b) : t));
  }, []);
  const removeThreshold = useCallback((n: number) => {
    setThresholds((t) => t.filter((x) => x !== n));
  }, []);

  const canLeaveGrouping = useMemo(
    () => grouping.unassigned.length === 0 && grouping.days.some((d) => d.length > 0),
    [grouping],
  );

  const buildConfig = useCallback(
    (): GenerateConfig => ({
      topic: topic.trim() || "Zoom Webinar",
      thresholds,
      days: toGenerateDays(grouping),
    }),
    [topic, thresholds, grouping],
  );

  const filesForConfig = useCallback((): File[] => {
    const wanted = new Set(grouping.days.flat());
    return files.filter((f) => wanted.has(f.name));
  }, [files, grouping]);

  return {
    step, setStep,
    goToUpload: () => setStep("upload"),
    goToGrouping: () => setStep("grouping"),
    goToOptions: () => setStep("options"),
    goToResults: () => setStep("results"),
    files, setFiles, fileMap,
    results, applyInspection,
    grouping, move, addDay, removeFile,
    options: { topic, thresholds },
    setTopic, addThreshold, removeThreshold,
    canLeaveGrouping, buildConfig, filesForConfig,
    reset: () => {
      setStep("upload"); setFiles([]); setResults([]); setGrouping(EMPTY);
      setTopic(""); setThresholds(DEFAULT_THRESHOLDS);
    },
  };
}

/**
 * In-browser equivalent of v1's POST /api/inspect — reads each File, parses
 * its metadata, returns an InspectResult per file. No network.
 */
export async function inspectFilesLocal(files: File[]): Promise<InspectResult[]> {
  const results: InspectResult[] = [];
  for (const f of files) {
    try {
      const buf = await f.arrayBuffer();
      const parsed = parseZoomCsvBuffer(buf);
      const date = parsed.meta.actualStartTime;
      const detected = date ? extractFullDate(date) : null;
      const topic = parsed.meta.topic || null;
      if (!topic && parsed.attendees.length === 0) throw new Error("Not a Zoom report");
      results.push({
        filename: f.name,
        status: "ok",
        detected_date: detected,
        topic,
        webinar_id: parsed.meta.webinarId || null,
        attendee_count: parsed.attendees.length,
        error: null,
      });
    } catch {
      results.push({
        filename: f.name,
        status: "invalid",
        detected_date: null,
        topic: null,
        webinar_id: null,
        attendee_count: 0,
        error: "Not a recognized Zoom attendee report.",
      });
    }
  }
  return results;
}

