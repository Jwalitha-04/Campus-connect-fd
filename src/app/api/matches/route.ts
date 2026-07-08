import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const STOP_WORDS = new Set([
  "a", "an", "the", "my", "lost", "found", "in", "on", "at", "for", "with",
  "and", "or", "of", "to", "is", "was", "i", "me", "you", "he", "she", "it",
  "we", "they", "this", "that", "these", "those"
]);

function getKeywords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

export async function GET() {
  const supabase = await createClient();

  // Fetch all active lost and found items
  const { data: items, error } = await supabase
    .from("lost_found_items")
    .select("id, title, type, category, date_lost_found, location")
    .eq("status", "active");

  if (error || !items) {
    return NextResponse.json({ error: error?.message || "Failed to fetch items" }, { status: 500 });
  }

  const lostItems = items.filter((item) => item.type === "lost");
  const foundItems = items.filter((item) => item.type === "found");

  const matches: { lostId: string; foundId: string }[] = [];

  for (const lost of lostItems) {
    const lostKeywords = getKeywords(lost.title);
    if (lostKeywords.length === 0) continue;

    for (const found of foundItems) {
      // 1. Same category
      if (lost.category !== found.category) continue;

      // 2. Same location
      if (lost.location !== found.location) continue;

      // 3. Date proximity (<= 3 days)
      const lostDate = new Date(lost.date_lost_found).getTime();
      const foundDate = new Date(found.date_lost_found).getTime();
      const dateDiffDays = Math.abs(lostDate - foundDate) / (1000 * 60 * 60 * 24);
      if (dateDiffDays > 3) continue;

      // 4. Title similarity keyword match
      const foundKeywords = getKeywords(found.title);
      const hasKeywordMatch = lostKeywords.some((kw) => foundKeywords.includes(kw));

      if (hasKeywordMatch) {
        matches.push({
          lostId: lost.id,
          foundId: found.id,
        });
      }
    }
  }

  return NextResponse.json({ matches });
}
