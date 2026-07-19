import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export const FILE_SEARCH_GUIDANCE = `## File search

- Use \`fd\` via the \`bash\` tool for file and directory searches instead of \`find\` by default.
- Fall back to \`find\` only when \`fd\` is unavailable or cannot express the required search.`;

/** Prefer fd for filesystem searches when the shell tool is available. */
export default function fileSearch(pi: ExtensionAPI): void {
  pi.on("before_agent_start", (event) => {
    if (!event.systemPromptOptions.selectedTools?.includes("bash")) return;

    return {
      systemPrompt: `${event.systemPrompt}\n\n${FILE_SEARCH_GUIDANCE}`,
    };
  });
}
