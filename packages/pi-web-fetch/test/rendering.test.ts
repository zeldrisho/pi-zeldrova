import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { describe, expect, it, vi } from "vite-plus/test";
import registerWebFetch from "../src/index";

vi.mock("@earendil-works/pi-coding-agent", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@earendil-works/pi-coding-agent")>();
  return { ...actual, keyHint: () => "Ctrl+O to expand" };
});

interface RenderedComponent {
  render(width: number): string[];
}

interface RenderTheme {
  fg(color: string, text: string): string;
  bold(text: string): string;
}

const renderTheme: RenderTheme = {
  fg: (_color, text) => text,
  bold: (text) => text,
};

describe("web_fetch rendering", () => {
  it("shows a Pi-style preview until tool output is expanded", () => {
    let registered: unknown;
    registerWebFetch({
      registerTool(tool: unknown) {
        registered = tool;
      },
    } as unknown as ExtensionAPI);

    const tool = registered as {
      renderResult(
        result: {
          content: Array<{ type: "text"; text: string }>;
          details: {
            extractor: "defuddle";
            cached: boolean;
            truncated: boolean;
            characterCount: number;
          };
        },
        options: { expanded: boolean; isPartial: boolean },
        theme: RenderTheme,
      ): RenderedComponent;
    };
    const output = Array.from({ length: 12 }, (_, index) => `Fetched line ${index + 1}`).join("\n");
    const result = {
      content: [{ type: "text" as const, text: output }],
      details: {
        extractor: "defuddle" as const,
        cached: false,
        truncated: false,
        characterCount: output.length,
      },
    };

    const collapsed = tool
      .renderResult(result, { expanded: false, isPartial: false }, renderTheme)
      .render(200)
      .join("\n");
    const expanded = tool
      .renderResult(result, { expanded: true, isPartial: false }, renderTheme)
      .render(200)
      .join("\n");

    expect(collapsed).toContain("Fetched line 1");
    expect(collapsed).toContain("2 more lines, 12 total, Ctrl+O to expand");
    expect(collapsed).not.toContain("Fetched line 11");
    expect(expanded).toContain("Fetched line 12");
    expect(expanded).not.toContain("more lines");
  });
});
