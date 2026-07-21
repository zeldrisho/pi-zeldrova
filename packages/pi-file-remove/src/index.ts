import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export const FILE_REMOVE_GUIDANCE = `## File removal

- Use \`gomi\` via the \`bash\` tool instead of \`rm\` when removing files or directories.
- \`gomi\` moves removed items to trash so they can be restored; pass file and directory paths as you would to \`rm\`.
- If \`gomi\` is unavailable, stop and tell the user how to install it rather than silently falling back to \`rm\`.
- Use \`rm\` only when the user explicitly requires permanent deletion, and state why \`gomi\` is unsuitable first.`;

/** Prefer recoverable file removal with gomi when shell commands are available. */
export default function fileRemove(pi: ExtensionAPI): void {
  pi.on("before_agent_start", (event) => {
    if (!event.systemPromptOptions.selectedTools?.includes("bash")) return;

    return {
      systemPrompt: `${event.systemPrompt}\n\n${FILE_REMOVE_GUIDANCE}`,
    };
  });
}
