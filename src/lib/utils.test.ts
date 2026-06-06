import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values (conditional classes)", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("merges conflicting tailwind utilities (last wins)", () => {
    // tailwind-merge keeps the later padding utility only.
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("supports conditional object syntax via clsx", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });
});
