import Link from "next/link";
import { ButtonLink, Card, Empty, PageHeader } from "@/components/ui";
import { formatMoney, formatNumber } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";
import type { Recipe } from "@/lib/types";

export default async function RecipesPage() {
  const { supabase, userId } = await requireUser();
  const { data } = await supabase.from("recipes").select("*").order("name");
  const recipes = (data ?? []) as Recipe[];

  return (
    <div>
      <PageHeader title="Recipes" action={<ButtonLink href="/recipes/new">New recipe</ButtonLink>} />
      {recipes.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => (
            <Link key={r.id} href={`/recipes/${r.id}`}>
              <Card className="h-full hover:border-accent">
                <h2 className="font-semibold">{r.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {formatNumber(r.calories)} kcal · {formatNumber(r.protein_g)} g protein per serving
                </p>
                <p className="text-sm text-muted">
                  {formatMoney(Math.round(r.cost_cents / r.servings))} per serving
                  {r.owner_id !== userId && " · shared"}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Empty>No recipes yet. Save one to log meals from it quickly.</Empty>
      )}
    </div>
  );
}
