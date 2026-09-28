import type { NextRequest } from "next/server";
import { parseUsdaSearch } from "@/lib/foods";
import { createClient } from "@/lib/supabase/server";

const USDA_SEARCH = "https://api.nal.usda.gov/fdc/v1/foods/search";
// Whole foods and ingredients; brand-name packaged products are opt-in because they crowd out the basics.
const GENERIC_TYPES = "Foundation,SR Legacy,Survey (FNDDS)";

/** Searches USDA FoodData Central. Signed-in users only, so the shared API key's quota isn't open to anyone. */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return Response.json({ error: "Sign in to search foods." }, { status: 401 });

  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 100);
  if (!query || query.length < 2) return Response.json({ foods: [] });
  const branded = request.nextUrl.searchParams.get("branded") === "1";

  const url = new URL(USDA_SEARCH);
  url.searchParams.set("api_key", process.env.USDA_API_KEY || "DEMO_KEY");
  url.searchParams.set("query", query);
  url.searchParams.set("pageSize", "20");
  url.searchParams.set("dataType", branded ? "Branded" : GENERIC_TYPES);

  try {
    // Nutrient data changes rarely, so identical searches are cached for a day.
    const res = await fetch(url, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) });
    if (res.status === 429) {
      return Response.json({ error: "The food database is busy. Try again in a bit." }, { status: 503 });
    }
    if (!res.ok) return Response.json({ error: "Food search is unavailable right now." }, { status: 502 });
    return Response.json({ foods: parseUsdaSearch(await res.json()).slice(0, 12) });
  } catch {
    return Response.json({ error: "Food search is unavailable right now." }, { status: 502 });
  }
}
