import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Card, PageHeader, Stat } from "@/components/ui";
import { getProfilesById, type MealWithShares } from "@/lib/data";
import { formatMoney, formatNumber } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";
import { NUTRIENT_FIELDS } from "@/lib/types";
import { deleteMeal } from "../actions";

export default async function MealPage({ params }: PageProps<"/meals/[id]">) {
  const { id } = await params;
  const { supabase, userId } = await requireUser();
  const { data } = await supabase
    .from("meals")
    .select("*, meal_shares(user_id, share_cents), households(name), recipes(id, name)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const meal = data as MealWithShares & { households: { name: string } | null; recipes: { id: string; name: string } | null };

  const profiles = await getProfilesById(supabase, [meal.paid_by ?? "", ...meal.meal_shares.map((s) => s.user_id)]);
  const name = (uid: string | null) => (uid && profiles.get(uid)?.display_name) || "Someone";

  return (
    <div className="space-y-6">
      <PageHeader title={meal.name} />
      <p className="-mt-4 text-sm text-muted">
        {meal.eaten_on} · {meal.households ? `Shared with ${meal.households.name}` : "Personal"}
        {meal.recipes && (
          <> · from <Link href={`/recipes/${meal.recipes.id}`} className="text-accent">{meal.recipes.name}</Link></>
        )}
      </p>

      <Card className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Cost" value={formatMoney(meal.cost_cents)} />
        <Stat label="Servings" value={formatNumber(meal.servings, 2)} />
        {meal.household_id && <Stat label="Paid by" value={name(meal.paid_by)} />}
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">Nutrition (whole meal)</h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {NUTRIENT_FIELDS.map((f) => (
            <div key={f.key}>
              <dt className="text-xs text-muted">{f.label}</dt>
              <dd className="font-medium">{formatNumber(meal[f.key], 1)} {f.unit}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {meal.household_id && (
        <Card>
          <h2 className="mb-3 font-semibold">Split</h2>
          <ul className="divide-y divide-border text-sm">
            {meal.meal_shares.map((s) => (
              <li key={s.user_id} className="flex justify-between py-2">
                <span>{name(s.user_id)}</span>
                <span>{formatMoney(s.share_cents)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {meal.notes && (
        <Card>
          <h2 className="mb-2 font-semibold">Notes</h2>
          <p className="whitespace-pre-wrap text-sm">{meal.notes}</p>
        </Card>
      )}

      {meal.created_by === userId && (
        <form action={deleteMeal}>
          <input type="hidden" name="id" value={meal.id} />
          <Button variant="danger">Delete meal</Button>
        </form>
      )}
    </div>
  );
}
