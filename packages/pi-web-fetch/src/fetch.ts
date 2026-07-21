import type { IncomingMessage } from "node:http";
import { sliceCompleteDocument, type CompleteDocument, type FetchResult } from "./content";
import { extractHtmlToMarkdown } from "./extract";
import {
  decodeResponse,
  FETCH_MAX_BYTES,
  readResponseBytes,
  requestPinned,
  responseHeader,
  validateRemoteUrl,
  type ValidatedTarget,
} from "./network";

const REQUEST_TIMEOUT_MS = 20_000;
const FETCH_MAX_REDIRECTS = 5;

export interface FetchRemoteDependencies {
  validateUrl?: (value: string | URL) => Promise<ValidatedTarget>;
  request?: (target: ValidatedTarget, signal: AbortSignal) => Promise<IncomingMessage>;
  extractHtml?: typeof extractHtmlToMarkdown;
  timeoutMs?: number;
}

function awaitWithAbort<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void): void => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", abort);
      callback();
    };
    const abort = (): void => {
      const error = new Error("Operation aborted.");
      error.name = "AbortError";
      finish(() => reject(error));
    };

    operation.then(
      (value) => finish(() => resolve(value)),
      (error: unknown) => finish(() => reject(error)),
    );
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
  });
}

export async function fetchCompleteDocument(
  rawUrl: string,
  signal: AbortSignal | undefined,
  dependencies: FetchRemoteDependencies,
): Promise<CompleteDocument> {
  const controller = new AbortController();
  const timeoutMs = dependencies.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const validateUrl = dependencies.validateUrl ?? validateRemoteUrl;
  const request = dependencies.request ?? requestPinned;
  const extractHtml = dependencies.extractHtml ?? extractHtmlToMarkdown;
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const cancel = () => controller.abort();
  signal?.addEventListener("abort", cancel, { once: true });

  try {
    let target = await awaitWithAbort(validateUrl(rawUrl), controller.signal);
    for (let redirects = 0; redirects <= FETCH_MAX_REDIRECTS; redirects += 1) {
      const response = await request(target, controller.signal);
      const status = response.statusCode ?? 0;
      if ([301, 302, 303, 307, 308].includes(status)) {
        const location = responseHeader(response, "location");
        if (!location) throw new Error("web_fetch received a redirect without a Location header.");
        if (redirects === FETCH_MAX_REDIRECTS)
          throw new Error("web_fetch followed too many redirects.");
        response.resume();
        target = await awaitWithAbort(
          validateUrl(new URL(location, target.url)),
          controller.signal,
        );
        continue;
      }
      if (status < 200 || status >= 300) {
        response.resume();
        throw new Error(`web_fetch returned HTTP ${status}.`);
      }

      const contentTypeHeader = responseHeader(response, "content-type") ?? "text/plain";
      const contentType = contentTypeHeader.split(";", 1)[0].trim().toLowerCase();
      const allowed =
        contentType.startsWith("text/") ||
        [
          "application/json",
          "application/markdown",
          "application/x-markdown",
          "application/xml",
          "application/xhtml+xml",
        ].includes(contentType);
      if (!allowed) {
        response.destroy();
        throw new Error(`web_fetch does not support ${contentType || "this content type"}.`);
      }

      const raw = decodeResponse(
        await readResponseBytes(response, FETCH_MAX_BYTES),
        contentTypeHeader,
      );
      let markdown: string;
      let title: string | undefined;
      let extractor: CompleteDocument["extractor"] = "raw";
      if (contentType === "text/html" || contentType === "application/xhtml+xml") {
        const extracted = await awaitWithAbort(extractHtml(raw, target.url), controller.signal);
        markdown = extracted.markdown;
        title = extracted.title;
        extractor = extracted.extractor;
      } else if (contentType === "application/json") {
        try {
          markdown = `\`\`\`json\n${JSON.stringify(JSON.parse(raw), null, 2)}\n\`\`\``;
        } catch {
          markdown = raw;
        }
      } else markdown = raw.trim();

      return {
        url: target.url.toString(),
        contentType,
        markdown: markdown.replace(/<\/untrusted_web_content>/gi, "&lt;/untrusted_web_content&gt;"),
        title,
        extractor,
      };
    }
    throw new Error("web_fetch followed too many redirects.");
  } catch (error) {
    if (timedOut) throw new Error(`web_fetch timed out after ${timeoutMs / 1000} seconds.`);
    if (signal?.aborted) throw new Error("web_fetch was cancelled.");
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", cancel);
  }
}

export async function fetchRemoteContent(
  rawUrl: string,
  offset: number,
  maxCharacters: number,
  signal: AbortSignal | undefined,
  dependencies: FetchRemoteDependencies = {},
): Promise<FetchResult> {
  return sliceCompleteDocument(
    await fetchCompleteDocument(rawUrl, signal, dependencies),
    offset,
    maxCharacters,
  );
}
