import { load } from "cheerio";
import { createHash } from "node:crypto";
import type { gmail_v1 } from "googleapis";

function decodeBase64Url(data: string): string {
  const padded = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64").toString("utf8");
}

function walkParts(part: gmail_v1.Schema$MessagePart | undefined, acc: { html?: string; text?: string }) {
  if (!part) return acc;
  const mime = part.mimeType ?? "";
  const body = part.body?.data ? decodeBase64Url(part.body.data) : "";

  if (mime === "text/html" && body && !acc.html) acc.html = body;
  if (mime === "text/plain" && body && !acc.text) acc.text = body;

  for (const child of part.parts ?? []) {
    walkParts(child, acc);
  }
  return acc;
}

export function headerMap(message: gmail_v1.Schema$Message) {
  const headers = new Map<string, string>();
  for (const header of message.payload?.headers ?? []) {
    if (header.name && header.value) headers.set(header.name.toLowerCase(), header.value);
  }
  return headers;
}

export function decodeMessageBodies(message: gmail_v1.Schema$Message) {
  const bodies = walkParts(message.payload, {});
  return {
    html: bodies.html ?? "",
    text: bodies.text ?? htmlToText(bodies.html ?? ""),
  };
}

export function htmlToText(html: string): string {
  if (!html) return "";
  const $ = load(html);
  $("script, style, img, noscript").remove();
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    const label = $(el).text().trim();
    if (href && label) $(el).text(`${label} (${href})`);
  });
  return $("body").text().replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function extractArticlesFromHtml(html: string, fallbackText: string) {
  const $ = load(html || "<p></p>");
  const seen = new Set<string>();
  const articles: Array<{
    title: string;
    canonicalUrl?: string;
    contentText: string;
    contentHash: string;
  }> = [];

  $("a[href]").each((_, el) => {
    const href = normalizeUrl($(el).attr("href") ?? "");
    const title = $(el).text().replace(/\s+/g, " ").trim();
    if (!href || !title || title.length < 12 || seen.has(href)) return;
    if (isBoilerplateLink(href, title)) return;
    seen.add(href);
    const contentText = title;
    articles.push({
      title: title.slice(0, 180),
      canonicalUrl: href,
      contentText,
      contentHash: hashContent(`${href}\n${title}`),
    });
  });

  if (articles.length === 0 && fallbackText) {
    const title = fallbackText.split("\n").find((line) => line.trim().length > 8)?.slice(0, 180) ?? "Untitled item";
    articles.push({
      title,
      contentText: fallbackText.slice(0, 8000),
      contentHash: hashContent(fallbackText),
    });
  }

  return articles.slice(0, 20);
}

export function normalizeUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return undefined;
    [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "utm_id",
      "mc_cid",
      "mc_eid",
    ].forEach((param) => parsed.searchParams.delete(param));
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function isBoilerplateLink(href: string, title: string) {
  const haystack = `${href} ${title}`.toLowerCase();
  return [
    "unsubscribe",
    "manage preferences",
    "view in browser",
    "privacy policy",
    "update your preferences",
    "mailto:",
  ].some((token) => haystack.includes(token));
}

export function hashContent(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
