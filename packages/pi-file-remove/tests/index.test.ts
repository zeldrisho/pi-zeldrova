import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { describe, expect, it } from "vite-plus/test";
import registerFileRemove, { FILE_REMOVE_GUIDANCE } from "../src/index";

type BeforeAgentStartHandler = (event: {
  systemPrompt: string;
  systemPromptOptions: { selectedTools?: string[] };
}) => object | undefined;

function registerHandler(): BeforeAgentStartHandler {
  let handler: BeforeAgentStartHandler | undefined;
  registerFileRemove({
    on(name: string, registeredHandler: BeforeAgentStartHandler) {
      if (name === "before_agent_start") handler = registeredHandler;
    },
  } as unknown as ExtensionAPI);
  return handler!;
}

describe("file removal guidance", () => {
  it("tells the agent to prefer gomi when bash is active", () => {
    const result = registerHandler()({
      systemPrompt: "base prompt",
      systemPromptOptions: { selectedTools: ["read", "bash"] },
    }) as { systemPrompt: string };

    expect(result.systemPrompt).toBe(`base prompt\n\n${FILE_REMOVE_GUIDANCE}`);
    expect(result.systemPrompt).toContain("Use `gomi`");
    expect(result.systemPrompt).toContain("instead of `rm`");
    expect(result.systemPrompt).toContain("rather than silently falling back to `rm`");
    expect(result.systemPrompt).toContain("explicitly requires permanent deletion");
  });

  it("does not add shell guidance when bash is inactive", () => {
    expect(
      registerHandler()({
        systemPrompt: "base prompt",
        systemPromptOptions: { selectedTools: ["read"] },
      }),
    ).toBeUndefined();
  });
});
