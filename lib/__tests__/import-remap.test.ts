import { describe, it, expect } from "vitest";
import { remapForeignKey } from "../export";

describe("import ID remap", () => {
  it("remaps plan ids for day tasks", () => {
    const planIdMap = new Map([
      ["old-plan-1", "new-plan-1"],
      ["old-plan-2", "new-plan-2"],
    ]);

    expect(remapForeignKey("old-plan-1", planIdMap)).toBe("new-plan-1");
    expect(remapForeignKey("old-plan-2", planIdMap)).toBe("new-plan-2");
    expect(remapForeignKey("missing", planIdMap)).toBeNull();
    expect(remapForeignKey(null, planIdMap)).toBeNull();
  });

  it("remaps session ids for set logs", () => {
    const sessionIdMap = new Map([
      ["old-session-a", "new-session-a"],
    ]);

    const newSessionId = remapForeignKey("old-session-a", sessionIdMap);
    expect(newSessionId).toBe("new-session-a");

    const orphan = remapForeignKey("old-session-b", sessionIdMap);
    expect(orphan).toBeNull();
  });

  it("builds template remap chain", () => {
    const templateIdMap = new Map([["tpl-old", "tpl-new"]]);
    const sessionOldTemplateId = "tpl-old";
    const remapped = remapForeignKey(sessionOldTemplateId, templateIdMap);
    expect(remapped).toBe("tpl-new");
  });
});
