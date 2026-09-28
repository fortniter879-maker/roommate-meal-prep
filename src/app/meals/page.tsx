import Link from "next/link";
import { ButtonLink, Card, Empty, PageHeader } from "@/components/ui";
import { getMyHouseholds, myPortion, type MealWithShares } from "@/lib/data";
import { formatMoney, formatNumber } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";

export default async function MealsPage() {
  const { supabase, userId } = await requireUser();
  const [{ data }, households] = await Promise.all([
    supabase
      .from("meals")
      .select("*, meal_shares(user_id, share_cents)")
      .order("eaten_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100),
    getMyHouseholds(supabase),
  ]);
  const meals = (data ?? []) as MealWithShares[];
  const householdName = new Map(households.map((h) => [h.id, h.name]));

  return (
    <div>
      <PageHeader title="Meals" action={<ButtonLink href="/meals/new">Log a meal</ButtonLink>} />
      {meals.length ? (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Meal</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Your share</th>
                  <th className="px-4 py-3 text-right">Your kcal</th>
                  <th className="px-4 py-3 text-right">Your protein</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {meals.map((m) => {
                  const mine = myPortion(m, userId);
                  return (
                    <tr key={m.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{m.eaten_on}</td>
                      <td className="px-4 py-3">
                        <Link href={`/meals/${m.id}`} className="hover:text-accent">{m.name}</Link>
                        {m.household_id && (
                          <span className="ml-2 rounded bg-background px-1.5 py-0.5 text-xs text-muted">
                            {householdName.get(m.household_id) ?? "shared"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{formatMoney(m.cost_cents)}</td>
                      <td className="px-4 py-3 text-right">{formatMoney(mine.cost_cents)}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(mine.calories)}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(mine.protein_g)} g</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Empty>No meals logged yet.</Empty>
      )}
    </div>
  );
}
