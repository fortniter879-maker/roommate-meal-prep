import { notFound } from "next/navigation";
import { Button, ButtonLink, Card, PageHeader, Stat } from "@/components/ui";
import { formatMoney, formatNumber } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";
import type { Recipe } from "@/lib/types";
import { NUTRIENT_FIELDS } from "@/lib/types";
import { deleteRecipe } from "../actions";

export default async function RecipePage({ params }: PageProps<"/recipes/[id]">) {
  const { id } = await params;
  const { supabase, userId } = await requireUser();
  const { data: recipe } = await supabase.from("recipes").select("*").eq("id", id).maybeSingle<Recipe>();
  if (!recipe) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={recipe.name}
        action={<ButtonLink href={`/meals/new?recipe=${recipe.id}`}>Log a meal from this</ButtonLink>}
      />
      <Card className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Servings" value={formatNumber(recipe.servings, 2)} />
        <Stat label="Total cost" value={formatMoney(recipe.cost_cents)} />
        <Stat label="Per serving" value={formatMoney(Math.round(recipe.cost_cents / recipe.servings))} />
        <Stat label="Calories / serving" value={formatNumber(recipe.calories)} />
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold">Nutrition per serving</h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {NUTRIENT_FIELDS.map((f) => (
            <div key={f.key}>
              <dt className="text-xs text-muted">{f.label}</dt>
              <dd className="font-medium">{formatNumber(recipe[f.key], 1)} {f.unit}</dd>
            </div>
          ))}
        </dl>
      </Card>
      {recipe.ingredients && (
        <Card>
          <h2 className="mb-2 font-semibold">Ingredients</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {recipe.ingredients.split("\n").filter(Boolean).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </Card>
      )}
      {recipe.instructions && (
        <Card>
          <h2 className="mb-2 font-semibold">Instructions</h2>
          <p className="whitespace-pre-wrap text-sm">{recipe.instructions}</p>
        </Card>
      )}
      {recipe.owner_id === userId && (
        <form action={deleteRecipe}>
          <input type="hidden" name="id" value={recipe.id} />
          <Button variant="danger">Delete recipe</Button>
        </form>
      )}
    </div>
  );
}
