export type RadarCategory = "ai_research" | "cybersecurity" | "tech_radar" | "custom";

export type RadarItem = {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
  category: RadarCategory;
  badge: string;
};

function cleanText(raw?: string | null): string {
  if (!raw) return "";
  return raw
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseFeedXml(xml: string, sourceName: string, category: RadarCategory, badge: string): RadarItem[] {
  const items: RadarItem[] = [];

  // 1. Atom feed format (e.g. arXiv)
  if (xml.includes("<entry>")) {
    const entryBlocks = xml.split("<entry>").slice(1);
    for (const block of entryBlocks) {
      const entryXml = block.split("</entry>")[0] || "";
      const titleMatch = entryXml.match(/<title>([\s\S]*?)<\/title>/);
      const summaryMatch = entryXml.match(/<summary>([\s\S]*?)<\/summary>/);
      const idMatch = entryXml.match(/<id>([\s\S]*?)<\/id>/);
      const linkMatch = entryXml.match(/<link[^>]+href=["']([^"']+)["']/);
      const pubMatch = entryXml.match(/<published>([\s\S]*?)<\/published>/);

      const title = titleMatch ? cleanText(titleMatch[1]) : "";
      const summary = summaryMatch ? cleanText(summaryMatch[1]).slice(0, 450) + "…" : "";
      const url = linkMatch ? linkMatch[1] : idMatch ? cleanText(idMatch[1]) : "";
      const publishedAt = pubMatch ? cleanText(pubMatch[1]) : new Date().toISOString();

      if (title && url) {
        items.push({
          id: url,
          title,
          summary,
          url,
          publishedAt,
          source: sourceName,
          category,
          badge,
        });
      }
    }
  }

  // 2. RSS 2.0 format (e.g. Hacker News, Substack, Tech Blogs)
  if (xml.includes("<item>")) {
    const itemBlocks = xml.split("<item>").slice(1);
    for (const block of itemBlocks) {
      const itemXml = block.split("</item>")[0] || "";
      const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
      const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/);
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
      const pubMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

      const title = titleMatch ? cleanText(titleMatch[1]) : "";
      const summary = descMatch ? cleanText(descMatch[1]).slice(0, 400) + "…" : "Development overview from external source.";
      const url = linkMatch ? cleanText(linkMatch[1]) : "";
      const publishedAt = pubMatch ? cleanText(pubMatch[1]) : new Date().toISOString();

      if (title && url) {
        items.push({
          id: url,
          title,
          summary,
          url,
          publishedAt,
          source: sourceName,
          category,
          badge,
        });
      }
    }
  }

  return items;
}

export async function fetchRadarItems(): Promise<RadarItem[]> {
  const feeds = [
    {
      url: "https://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.LG&sortBy=submittedDate&sortOrder=descending&max_results=8",
      sourceName: "arXiv Preprints",
      category: "ai_research" as RadarCategory,
      badge: "🔬 arXiv AI Research",
    },
    {
      url: "https://export.arxiv.org/api/query?search_query=cat:cs.CR&sortBy=submittedDate&sortOrder=descending&max_results=6",
      sourceName: "arXiv Security",
      category: "cybersecurity" as RadarCategory,
      badge: "🚨 Systems & Cryptography",
    },
    {
      url: "https://news.ycombinator.com/rss",
      sourceName: "Hacker News",
      category: "tech_radar" as RadarCategory,
      badge: "📡 Tech Radar",
    },
  ];

  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      const res = await fetch(feed.url, {
        next: { revalidate: 3600 }, // Cache for 1 hour on server
        headers: {
          "User-Agent": "SignalOS-Radar/1.0 (Personal Research Engine)",
        },
      });
      if (!res.ok) throw new Error(`Failed to fetch ${feed.url}: ${res.status}`);
      const xml = await res.text();
      return parseFeedXml(xml, feed.sourceName, feed.category, feed.badge);
    }),
  );

  const allItems: RadarItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      allItems.push(...r.value);
    } else {
      console.warn("[Radar] Error fetching feed:", r.reason);
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const deduped: RadarItem[] = [];
  for (const item of allItems) {
    if (!seen.has(item.url)) {
      seen.add(item.url);
      deduped.push(item);
    }
  }

  return deduped;
}

function validateRadarUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL format");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs are permitted");
  }

  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".lan") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    host.startsWith("169.254.") || // AWS/GCP/Azure instance metadata
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) // 172.16.0.0 - 172.31.255.255
  ) {
    throw new Error("Access to local and private network addresses is forbidden");
  }

  return parsed;
}

export async function fetchCustomFeed(feedUrl: string, customName?: string): Promise<RadarItem[]> {
  const validated = validateRadarUrl(feedUrl);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(validated.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "SignalOS-Radar/1.0 (Personal Research Engine)",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },
    });

    if (!res.ok) throw new Error(`Failed to fetch feed: HTTP ${res.status}`);

    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 2 * 1024 * 1024) {
      throw new Error("Feed payload exceeds maximum allowed size (2MB)");
    }

    const xml = await res.text();
    if (xml.length > 2 * 1024 * 1024) {
      throw new Error("Feed payload exceeds maximum allowed size (2MB)");
    }

    const sourceName = customName || validated.hostname.replace("www.", "");
    return parseFeedXml(xml, sourceName, "custom", `🌐 ${sourceName}`);
  } finally {
    clearTimeout(timeoutId);
  }
}
