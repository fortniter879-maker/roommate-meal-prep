import Link from "next/link";
import { ButtonLink, Card, Empty, PageHeader, Stat } from "@/components/ui";
import { getMyHouseholds, myPortion, type MealWithShares } from "@/lib/data";
import { formatMoney, formatNumber } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString("en-CA");
}

export default async function DashboardPage() {
  const { supabase, userId } = await requireUser();
  const since = daysAgo(6);

  const [{ data: profile }, { data }, households, { data: balances }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", userId).single(),
    supabase
      .from("meals")
      .select("*, meal_shares(user_id, share_cents)")
      .gte("eaten_on", daysAgo(29))
      .order("eaten_on", { ascending: false }),
    getMyHouseholds(supabase),
    supabase.from("household_balances").select("household_id, balance_cents").eq("user_id", userId),
  ]);
  const meals = (data ?? []) as MealWithShares[];

  const total = (list: MealWithShares[]) =>
    list.reduce(
      (acc, m) => {
        const p = myPortion(m, userId);
        acc.cost += p.cost_cents;
        acc.calories += p.calories;
        acc.protein += p.protein_g;
        return acc;
      },
      { cost: 0, calories: 0, protein: 0 },
    );
  const week = total(meals.filter((m) => m.eaten_on >= since));
  const month = total(meals);
  const balanceBy = new Map((balances ?? []).map((b) => [b.household_id, b.balance_cents as number]));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hi ${profile?.display_name ?? "there"}`}
        action={<ButtonLink href="/meals/new">Log a meal</ButtonLink>}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="grid grid-cols-3 gap-4">
          <div className="col-span-3 text-sm font-medium">Last 7 days (your share)</div>
          <Stat label="Spent" value={formatMoney(week.cost)} />
          <Stat label="Calories" value={formatNumber(week.calories)} />
          <Stat label="Protein" value={`${formatNumber(week.protein)} g`} />
        </Card>
        <Card className="grid grid-cols-3 gap-4">
          <div className="col-span-3 text-sm font-medium">Last 30 days (your share)</div>
          <Stat label="Spent" value={formatMoney(month.cost)} />
          <Stat label="Calories" value={formatNumber(month.calories)} />
          <Stat label="Protein" value={`${formatNumber(month.protein)} g`} />
        </Card>
      </div>
      <p className="-mt-2 text-sm">
        <Link href="/insights" className="text-accent hover:underline">See charts and household totals</Link>
      </p>

      <Card>
        <h2 className="mb-3 font-semibold">Households</h2>
        {households.length ? (
          <ul className="divide-y divide-border text-sm">
            {households.map((h) => {
              const bal = balanceBy.get(h.id) ?? 0;
              return (
                <li key={h.id} className="flex justify-between py-2">
                  <Link href={`/households/${h.id}`} className="hover:text-accent">{h.name}</Link>
                  <span className={bal < 0 ? "text-danger" : bal > 0 ? "text-accent" : "text-muted"}>
                    {bal === 0 ? "all settled" : bal > 0 ? `you're owed ${formatMoney(bal)}` : `you owe ${formatMoney(-bal)}`}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>
            Cooking with roommates? <Link href="/households" className="text-accent">Create or join a household</Link>.
          </Empty>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">Recent meals</h2>
        {meals.length ? (
          <ul className="divide-y divide-border text-sm">
            {meals.slice(0, 8).map((m) => (
              <li key={m.id} className="flex justify-between py-2">
                <Link href={`/meals/${m.id}`} className="hover:text-accent">
                  {m.name} <span className="text-muted">· {m.eaten_on}</span>
                </Link>
                <span className="text-muted">{formatMoney(myPortion(m, userId).cost_cents)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Nothing logged in the last 30 days.</Empty>
        )}
      </Card>
    </div>
  );
}
