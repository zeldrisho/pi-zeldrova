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
    expect(result.systemPrompt).toContain("<!--VITE PLUS START-->");
    expect(result.systemPrompt).toContain("# Using Vite+, the Unified Toolchain for the Web");
    expect(result.systemPrompt).toContain("a single global CLI called `vp`");
    expect(result.systemPrompt).toContain("`vp help`");
    expect(result.systemPrompt).toContain("https://viteplus.dev/guide/");
    expect(result.systemPrompt).toContain("## Review Checklist");
    expect(result.systemPrompt).toContain("Run `vp install` after pulling remote changes");
    expect(result.systemPrompt).toContain("Run `vp check` and `vp test`");
    expect(result.systemPrompt).toContain("run via `vp run <script>`");
    expect(result.systemPrompt).toContain("run `vp env doctor`");
    expect(result.systemPrompt).toContain("<!--VITE PLUS END-->");
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
