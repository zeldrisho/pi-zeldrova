import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export const VITE_PLUS_GUIDANCE = `## Vite+

Vite+ is a unified web toolchain exposed through the \`vp\` CLI.

- Prefer \`vp\` when available. Preserve the project's package-manager metadata and lockfiles; Vite+ detects and delegates to the configured package manager.
- Use \`vp migrate\` when migrating an existing project to Vite+.
- Use \`vp install\`, \`vp add\`, \`vp remove\`, and \`vp update\` for dependency workflows.
- Prefer built-in commands such as \`vp dev\`, \`vp check\`, \`vp test\`, \`vp build\`, and \`vp pack\`. Use \`vp run <task>\` (or \`vpr <task>\`) for configured tasks and package scripts.
- Use \`vp exec <binary>\` for local binaries, \`vp dlx <package>\` for one-off packages, and \`vp node <script>\` for Node.js scripts.
- After changes, run relevant checks, tests, and project-specific validation tasks.
- Use \`vp env doctor\` for environment or package-manager problems.
- When no normalized Vite+ command exists, use \`vp pm <command>\`. Invoke the underlying package manager directly only when Vite+ is unavailable or incompatible, and state why.`;

/** Prefer Vite+ for development workflows when shell commands are available. */
export default function vitePlus(pi: ExtensionAPI): void {
  pi.on("before_agent_start", (event) => {
    if (!event.systemPromptOptions.selectedTools?.includes("bash")) return;

    return {
      systemPrompt: `${event.systemPrompt}\n\n${VITE_PLUS_GUIDANCE}`,
    };
  });
}
