import Parser from "rss-parser";
import type { RawArticle } from "./types";

const LOBSTERS_RSS = "https://lobste.rs/rss";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; DailyBriefBot/1.0; +https://github.com/)",
  },
  customFields: { item: ["score"] },
});

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export async function fetchLobsters(
  sourceId: string,
  limit = 30,
): Promise<RawArticle[]> {
  const feed = await parser.parseURL(LOBSTERS_RSS);
  const articles = (feed.items ?? []).slice(0, limit).map((item) => {
    const rawScore =
      typeof (item as Record<string, unknown>).score === "string"
        ? parseInt((item as Record<string, unknown>).score as string, 10)
        : undefined;
    return {
      sourceId,
      title: (item.title ?? "").trim(),
      url: (item.link ?? "").trim(),
      excerpt: stripHtml(item.contentSnippet ?? item.content ?? "").slice(
        0,
        300,
      ),
      publishedAt: item.isoDate ? new Date(item.isoDate) : undefined,
      category: "tech" as const,
      score: rawScore != null && Number.isFinite(rawScore) ? rawScore : undefined,
    };
  });
  articles.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return articles.filter((a) => a.title && a.url);
}
