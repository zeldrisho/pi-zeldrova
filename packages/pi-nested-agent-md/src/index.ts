import { readFile, realpath } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
  isReadToolResult,
} from "@earendil-works/pi-coding-agent";

const AGENTS_FILE = "AGENTS.md";
const MAX_FILE_BYTES = 32 * 1024;
const encoder = new TextEncoder();

function byteLength(value: string): number {
  return encoder.encode(value).byteLength;
}

function lineCount(value: string): number {
  if (value.length === 0) return 0;
  return value.split("\n").length;
}

function truncateUtf8(value: string, maxBytes: number): { text: string; truncated: boolean } {
  const bytes = encoder.encode(value);
  if (bytes.byteLength <= maxBytes) return { text: value, truncated: false };

  const decoder = new TextDecoder("utf-8");
  let text = decoder.decode(bytes.subarray(0, Math.max(0, maxBytes)));
  while (text.endsWith("\uFFFD")) text = text.slice(0, -1);
  return { text, truncated: true };
}

function truncateLines(value: string, maxLines: number): { text: string; truncated: boolean } {
  const lines = value.split("\n");
  if (lines.length <= maxLines) return { text: value, truncated: false };
  return { text: lines.slice(0, Math.max(0, maxLines)).join("\n"), truncated: true };
}

function isContained(root: string, target: string): boolean {
  const fromRoot = relative(root, target);
  return (
    fromRoot !== "" &&
    fromRoot !== ".." &&
    !fromRoot.startsWith(`..${sep}`) &&
    !isAbsolute(fromRoot)
  );
}

async function containedTarget(
  root: string,
  inputPath: string,
): Promise<{ root: string; target: string } | undefined> {
  try {
    const canonicalRoot = await realpath(root);
    const requested = isAbsolute(inputPath) ? inputPath : resolve(root, inputPath);
    const canonicalTarget = await realpath(requested);
    if (!isContained(canonicalRoot, canonicalTarget)) return undefined;
    return { root: canonicalRoot, target: canonicalTarget };
  } catch {
    return undefined;
  }
}

/** Find nested AGENTS.md files from the project root toward the target. */
export async function findNestedAgentsFiles(root: string, inputPath: string): Promise<string[]> {
  const contained = await containedTarget(root, inputPath);
  if (!contained) return [];

  const found: string[] = [];
  let directory = dirname(contained.target);
  while (directory !== contained.root) {
    const candidate = join(directory, AGENTS_FILE);
    try {
      const canonicalCandidate = await realpath(candidate);
      if (
        canonicalCandidate !== contained.target &&
        isContained(contained.root, canonicalCandidate)
      ) {
        found.push(canonicalCandidate);
      }
    } catch {
      // The directory has no readable AGENTS.md.
    }

    const parent = dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  return found.reverse();
}

function safePathText(value: string): string {
  return value
    .split("")
    .map((character) => {
      const codeUnit = character.charCodeAt(0);
      return codeUnit <= 0x1f || (codeUnit >= 0x7f && codeUnit <= 0x9f) ? "\uFFFD" : character;
    })
    .join("");
}

function escapeXmlAttribute(value: string): string {
  return safePathText(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function originalText(content: readonly { type: string; text?: string }[]): string {
  return content
    .filter(
      (block): block is { type: "text"; text: string } =>
        block.type === "text" && typeof block.text === "string",
    )
    .map((block) => block.text)
    .join("\n");
}

function formatContext(root: string, path: string, content: string, truncated: boolean): string {
  const displayPath = safePathText(relative(root, path) || basename(path));
  const scope = safePathText(relative(root, dirname(path)) || ".");
  const note = truncated ? "\n[AGENTS.md truncated to fit Pi's tool-output limits.]" : "";
  return (
    `\n\n<nested_agents_context path="${escapeXmlAttribute(displayPath)}" scope="${escapeXmlAttribute(scope)}">\n` +
    `The following instructions apply to files under ${scope}/.\n\n${content}${note}\n</nested_agents_context>`
  );
}

export default function nestedAgents(pi: ExtensionAPI): void {
  const injected = new Set<string>();

  pi.on("session_start", () => {
    injected.clear();
  });

  pi.on("tool_result", async (event, ctx) => {
    if (event.isError || !isReadToolResult(event)) return;
    const inputPath = event.input.path;
    if (typeof inputPath !== "string" || !event.content.some((block) => block.type === "text"))
      return;

    // A successful direct read already put this file's instructions in context.
    // Reserve it before awaiting so a concurrent sibling read cannot append it again.
    const requestedPath = isAbsolute(inputPath) ? inputPath : resolve(ctx.cwd, inputPath);
    if (basename(requestedPath) === AGENTS_FILE) {
      injected.add(requestedPath);
      const contained = await containedTarget(ctx.cwd, inputPath);
      if (contained) injected.add(contained.target);
    }

    const paths = (await findNestedAgentsFiles(ctx.cwd, inputPath)).filter(
      (path) => !injected.has(path),
    );
    if (paths.length === 0) return;

    const existing = originalText(event.content);
    let bytesLeft = Math.max(0, DEFAULT_MAX_BYTES - byteLength(existing));
    let linesLeft = Math.max(0, DEFAULT_MAX_LINES - lineCount(existing));
    let addition = "";

    for (const path of paths) {
      if (injected.has(path)) continue;
      const reservedWrapper = formatContext(ctx.cwd, path, "", true);
      const contentByteBudget = Math.min(MAX_FILE_BYTES, bytesLeft - byteLength(reservedWrapper));
      const contentLineBudget = linesLeft - lineCount(reservedWrapper) + 1;
      if (contentByteBudget <= 0 || contentLineBudget <= 0) break;

      // Reserve before awaiting so concurrent read results cannot inject the same file.
      injected.add(path);
      let fileContent: string;
      try {
        fileContent = await readFile(path, "utf8");
      } catch {
        injected.delete(path);
        continue;
      }

      const byteLimited = truncateUtf8(fileContent, contentByteBudget);
      const lineLimited = truncateLines(byteLimited.text, contentLineBudget);
      const section = formatContext(
        ctx.cwd,
        path,
        lineLimited.text,
        byteLimited.truncated || lineLimited.truncated,
      );
      if (byteLength(section) > bytesLeft || lineCount(section) > linesLeft) {
        injected.delete(path);
        break;
      }

      addition += section;
      bytesLeft -= byteLength(section);
      linesLeft -= lineCount(section);
    }

    if (!addition) return;
    return { content: [...event.content, { type: "text" as const, text: addition }] };
  });

  pi.on("session_compact", () => {
    injected.clear();
  });

  pi.on("session_shutdown", () => {
    injected.clear();
  });
}
