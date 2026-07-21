import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { describe, expect, it } from "vite-plus/test";
import registerFileRemove, { containsRmInvocation, FILE_REMOVE_GUIDANCE } from "../src/index";

type BeforeAgentStartHandler = (event: {
  systemPrompt: string;
  systemPromptOptions: { selectedTools?: string[] };
}) => object | undefined;

type ToolCallHandler = (
  event: { toolName: string; input: { command: string } },
  ctx: {
    hasUI: boolean;
    ui: { confirm(title: string, message: string): Promise<boolean> };
  },
) => Promise<{ block: true; reason: string } | undefined>;

function registerHandlers(): {
  beforeAgentStart: BeforeAgentStartHandler;
  toolCall: ToolCallHandler;
} {
  let beforeAgentStart: BeforeAgentStartHandler | undefined;
  let toolCall: ToolCallHandler | undefined;

  registerFileRemove({
    on(name: string, handler: BeforeAgentStartHandler | ToolCallHandler) {
      if (name === "before_agent_start") {
        beforeAgentStart = handler as BeforeAgentStartHandler;
      } else if (name === "tool_call") {
        toolCall = handler as ToolCallHandler;
      }
    },
  } as unknown as ExtensionAPI);

  return { beforeAgentStart: beforeAgentStart!, toolCall: toolCall! };
}

describe("file removal guidance", () => {
  it("tells the agent to prefer gomi when bash is active", () => {
    const result = registerHandlers().beforeAgentStart({
      systemPrompt: "base prompt",
      systemPromptOptions: { selectedTools: ["read", "bash"] },
    }) as { systemPrompt: string };

    expect(result.systemPrompt).toBe(`base prompt\n\n${FILE_REMOVE_GUIDANCE}`);
    expect(result.systemPrompt).toContain("Use `gomi`");
    expect(result.systemPrompt).toContain("instead of `rm`");
    expect(result.systemPrompt).toContain("never silently fall back to `rm`");
    expect(result.systemPrompt).toContain("user-approved permanent deletion");
  });

  it("does not add shell guidance when bash is inactive", () => {
    expect(
      registerHandlers().beforeAgentStart({
        systemPrompt: "base prompt",
        systemPromptOptions: { selectedTools: ["read"] },
      }),
    ).toBeUndefined();
  });
});

describe("rm invocation detection", () => {
  it.each([
    "rm file.txt",
    "rm -rf directory",
    "echo done && rm file.txt",
    "command rm file.txt",
    "sudo rm file.txt",
    "/bin/rm file.txt",
    "/usr/bin/rm file.txt",
    "rm \\\n      file.txt",
  ])("detects %j", (command) => {
    expect(containsRmInvocation(command)).toBe(true);
  });

  it.each(["gomi file.txt", "echo rm file.txt", "printf 'rm file.txt'", "rmdir directory"])(
    "ignores %j",
    (command) => {
      expect(containsRmInvocation(command)).toBe(false);
    },
  );
});

describe("permanent deletion gate", () => {
  it("blocks rm when user confirmation is unavailable", async () => {
    const result = await registerHandlers().toolCall(
      { toolName: "bash", input: { command: "rm file.txt" } },
      { hasUI: false, ui: { confirm: async () => true } },
    );

    expect(result).toEqual({
      block: true,
      reason: "Permanent deletion blocked without user confirmation. Use gomi instead.",
    });
  });

  it("blocks rm when the user declines", async () => {
    const result = await registerHandlers().toolCall(
      { toolName: "bash", input: { command: "rm file.txt" } },
      { hasUI: true, ui: { confirm: async () => false } },
    );

    expect(result).toEqual({
      block: true,
      reason: "Permanent deletion was not approved.",
    });
  });

  it("allows rm when the user approves", async () => {
    const result = await registerHandlers().toolCall(
      { toolName: "bash", input: { command: "rm file.txt" } },
      { hasUI: true, ui: { confirm: async () => true } },
    );

    expect(result).toBeUndefined();
  });

  it("does not gate other commands", async () => {
    const result = await registerHandlers().toolCall(
      { toolName: "bash", input: { command: "gomi file.txt" } },
      { hasUI: false, ui: { confirm: async () => false } },
    );

    expect(result).toBeUndefined();
  });
});
