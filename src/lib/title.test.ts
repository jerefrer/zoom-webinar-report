import { describe, expect, it } from "vitest";
import { stripChineseSuffix } from "./title";

describe("stripChineseSuffix", () => {
  it("strips the trailing Chinese segment after an en-dash", () => {
    const input =
      "Long Life Empowerment from the lineage of Thangtong Gyalpo – HH 41st Sakya Trizin – May 26th 2026 – 5月26日灌顶将另外提供中文翻译。";
    expect(stripChineseSuffix(input)).toBe(
      "Long Life Empowerment from the lineage of Thangtong Gyalpo – HH 41st Sakya Trizin – May 26th 2026",
    );
  });

  it("leaves a fully English title unchanged", () => {
    const input = "Spring Webinar 2026 – Welcome Session";
    expect(stripChineseSuffix(input)).toBe(input);
  });

  it("leaves a title with no separator untouched even if it contains Chinese", () => {
    const input = "Title with 中文 inside";
    expect(stripChineseSuffix(input)).toBe(input);
  });

  it("returns the original string when the result would be empty (all Chinese)", () => {
    const input = "灌顶 – 翻译";
    expect(stripChineseSuffix(input)).toBe(input);
  });

  it("does not strip a non-Chinese trailing segment", () => {
    const input = "灌顶 – English Trailer";
    expect(stripChineseSuffix(input)).toBe(input);
  });

  it("handles different separators: hyphen, em-dash, pipe", () => {
    expect(stripChineseSuffix("Event 2026 - 中文翻译")).toBe("Event 2026");
    expect(stripChineseSuffix("Event 2026 — 灌顶将另外提供")).toBe("Event 2026");
    expect(stripChineseSuffix("Event 2026 | 中文版本")).toBe("Event 2026");
  });

  it("trims trailing whitespace from the surviving English part", () => {
    expect(stripChineseSuffix("Event 2026   –   中文")).toBe("Event 2026");
  });
});
