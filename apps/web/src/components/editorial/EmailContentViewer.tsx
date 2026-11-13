"use client";

import { useEffect, useRef, useState } from "react";

export interface EmailContentViewerProps {
  bodyHtml?: string | null;
  bodyText?: string | null;
  directGmailUrl?: string;
}

export function EmailContentViewer({
  bodyHtml,
  bodyText,
  directGmailUrl,
}: EmailContentViewerProps) {
  const hasHtml = Boolean(bodyHtml && bodyHtml.trim().length > 0);
  const hasText = Boolean(bodyText && bodyText.trim().length > 0);

  const [mode, setMode] = useState<"html" | "text">(hasHtml ? "html" : "text");
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(650);

  useEffect(() => {
    if (mode !== "html" || !iframeRef.current) return;

    const handleIframeLoad = () => {
      try {
        const doc = iframeRef.current?.contentDocument;
        if (doc?.body) {
          // Adjust all links inside the iframe to open in a new tab
          const links = doc.querySelectorAll("a");
          links.forEach((a) => {
            a.setAttribute("target", "_blank");
            a.setAttribute("rel", "noopener noreferrer");
          });

          const height = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, 500);
          setIframeHeight(height + 40);
        }
      } catch {
        // Sandboxed security fallback
        setIframeHeight(750);
      }
    };

    const frame = iframeRef.current;
    frame.addEventListener("load", handleIframeLoad);
    return () => frame.removeEventListener("load", handleIframeLoad);
  }, [mode, bodyHtml]);

  const handleCopy = async () => {
    if (!bodyText) return;
    try {
      await navigator.clipboard.writeText(bodyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-xl border border-rule bg-paper overflow-hidden shadow-sm">
      {/* Top Viewer Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule bg-paper/90 px-4 py-2.5 text-xs">
        {/* Mode Toggle Buttons */}
        <div className="flex items-center gap-1 rounded-lg border border-rule/80 bg-paper p-0.5">
          {hasHtml && (
            <button
              onClick={() => setMode("html")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-serif text-xs font-medium transition ${
                mode === "html"
                  ? "bg-ink text-paper shadow-sm"
                  : "text-mute hover:text-ink"
              }`}
            >
              <span>🖼️</span>
              <span>Rendered Newsletter</span>
            </button>
          )}

          {hasText && (
            <button
              onClick={() => setMode("text")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-serif text-xs font-medium transition ${
                mode === "text"
                  ? "bg-ink text-paper shadow-sm"
                  : "text-mute hover:text-ink"
              }`}
            >
              <span>📄</span>
              <span>Clean Text Mode</span>
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {hasText && (
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-xs text-mute hover:text-ink transition px-2 py-1 rounded border border-transparent hover:border-rule"
              title="Copy original plain text content"
            >
              <span>{copied ? "✓ Copied" : "📋 Copy Text"}</span>
            </button>
          )}

          {directGmailUrl && (
            <a
              href={directGmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-serif text-crimson hover:underline"
            >
              Open in Gmail ↗
            </a>
          )}
        </div>
      </div>

      {/* Content Rendering View */}
      <div className="p-4 sm:p-6 bg-paper min-h-[400px]">
        {mode === "html" && hasHtml ? (
          <div className="w-full overflow-hidden rounded-lg border border-rule/50 bg-white">
            <iframe
              ref={iframeRef}
              srcDoc={bodyHtml ?? ""}
              sandbox="allow-same-origin allow-popups"
              className="w-full border-0 transition-all duration-300"
              style={{ height: `${iframeHeight}px`, minHeight: "600px" }}
              title="Original Newsletter Render"
            />
          </div>
        ) : hasText ? (
          <div className="max-w-prose mx-auto py-4">
            <pre className="whitespace-pre-wrap font-serif text-[15px] sm:text-base leading-relaxed text-ink/90 select-text">
              {bodyText}
            </pre>
          </div>
        ) : (
          <div className="py-16 text-center text-mute font-serif">
            <p>No raw email body text or HTML is available for this record.</p>
            {directGmailUrl && (
              <a
                href={directGmailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block font-sans text-xs text-crimson underline"
              >
                Open directly in Gmail to view original dispatch →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

