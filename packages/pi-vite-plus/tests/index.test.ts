import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { describe, expect, it } from "vite-plus/test";
import registerVitePlus, { VITE_PLUS_GUIDANCE } from "../src/index";

type BeforeAgentStartHandler = (event: {
  systemPrompt: string;
  systemPromptOptions: { selectedTools?: string[] };
}) => object | undefined;

function registerHandler(): BeforeAgentStartHandler {
  let handler: BeforeAgentStartHandler | undefined;
  registerVitePlus({
    on(name: string, registeredHandler: BeforeAgentStartHandler) {
      if (name === "before_agent_start") handler = registeredHandler;
    },
  } as unknown as ExtensionAPI);
  return handler!;
}

describe("Vite+ guidance", () => {
  it("tells the agent to prefer vp when bash is active", () => {
    const result = registerHandler()({
      systemPrompt: "base prompt",
      systemPromptOptions: { selectedTools: ["read", "bash"] },
    }) as { systemPrompt: string };

    expect(result.systemPrompt).toBe(`base prompt\n\n${VITE_PLUS_GUIDANCE}`);
    expect(result.systemPrompt).toContain("a unified web toolchain");
    expect(result.systemPrompt).toContain("Prefer `vp` when available");
    expect(result.systemPrompt).toContain("`vp migrate` when migrating an existing project");
    expect(result.systemPrompt).toContain("`vp install`, `vp add`, `vp remove`, and `vp update`");
    expect(result.systemPrompt).toContain("built-in commands");
    expect(result.systemPrompt).toContain("`vp run <task>` (or `vpr <task>`)");
    expect(result.systemPrompt).toContain("`vp exec <binary>`");
    expect(result.systemPrompt).toContain("project-specific validation tasks");
    expect(result.systemPrompt).toContain("`vp env doctor`");
    expect(result.systemPrompt).toContain("use `vp pm <command>`");
    expect(result.systemPrompt).toContain("Invoke the underlying package manager directly only");
  });

  it("does not add command guidance when bash is inactive", () => {
    expect(
      registerHandler()({
        systemPrompt: "base prompt",
        systemPromptOptions: { selectedTools: ["read"] },
      }),
    ).toBeUndefined();
  });
});
