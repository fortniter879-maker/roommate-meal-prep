import Link from "next/link";
import { BarList, DailyBars, MacroBar } from "@/components/charts";
import { ButtonLink, Card, Empty, PageHeader, Stat } from "@/components/ui";
import { getMyHouseholds } from "@/lib/data";
import { formatMoney, formatNumber } from "@/lib/format";
import {
  cheapestMeals,
  lastDays,
  macroSplit,
  myPortion,
  perPerson,
  sumPortions,
  totalsByDay,
  wholeMeal,
  type MealWithShares,
  type Portion,
} from "@/lib/insights";
import { requireUser } from "@/lib/supabase/server";

const RANGES = [7, 30, 90];

function Pill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full border px-3 py-1 text-sm ${
        active ? "border-accent bg-accent text-accent-contrast" : "border-border bg-surface text-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

function Summary({ total, loggedDays, mealCount }: { total: Portion; loggedDays: number; mealCount: number }) {
  const perDay = (n: number) => (loggedDays ? n / loggedDays : 0);
  return (
    <Card className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      <Stat label="Spent" value={formatMoney(total.cost_cents)} />
      <Stat label="Meals" value={formatNumber(mealCount)} />
      <Stat label="Spent / day" value={formatMoney(Math.round(perDay(total.cost_cents)))} />
      <Stat label="Calories / day" value={formatNumber(perDay(total.calories))} />
      <Stat label="Protein / day" value={`${formatNumber(perDay(total.protein_g))} g`} />
      <p className="col-span-2 text-xs text-muted sm:col-span-5">
        Daily averages cover the {loggedDays} {loggedDays === 1 ? "day" : "days"} with at least one meal logged.
        {total.calories > 0 && total.cost_cents > 0 && (
          <> Food cost works out to {formatMoney(Math.round((total.cost_cents / total.calories) * 1000))} per 1,000 kcal.</>
        )}
      </p>
    </Card>
  );
}

function Cheapest({ meals }: { meals: ReturnType<typeof cheapestMeals> }) {
  if (!meals.length) return null;
  return (
    <Card>
      <h2 className="mb-1 font-semibold">Best value meals</h2>
      <p className="mb-3 text-sm text-muted">Cheapest per 100 kcal, among meals with both cost and calories logged.</p>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted">
          <tr>
            <th className="py-1 font-normal">Meal</th>
            <th className="py-1 text-right font-normal">Per 100 kcal</th>
            <th className="py-1 text-right font-normal">Per 10 g protein</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {meals.map((m) => (
            <tr key={m.name}>
              <td className="py-1.5">
                {m.name}
                {m.count > 1 && <span className="text-muted"> ×{m.count}</span>}
              </td>
              <td className="py-1.5 text-right">{formatMoney(Math.round(m.centsPer100kcal))}</td>
              <td className="py-1.5 text-right">
                {m.centsPer10gProtein === null ? "–" : formatMoney(Math.round(m.centsPer10gProtein))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function Trends({ daily }: { daily: ({ date: string } & Portion)[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <h2 className="mb-3 font-semibold">Spending per day</h2>
        <DailyBars
          label="Spending"
          data={daily.map((d) => ({ date: d.date, value: d.cost_cents }))}
          format={(v) => formatMoney(v)}
        />
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold">Calories per day</h2>
        <DailyBars
          label="Calories"
          data={daily.map((d) => ({ date: d.date, value: d.calories }))}
          format={(v) => `${formatNumber(v)} kcal`}
        />
      </Card>
    </div>
  );
}

export default async function InsightsPage({ searchParams }: PageProps<"/insights">) {
  const params = await searchParams;
  const { supabase, userId } = await requireUser();
  const range = RANGES.includes(Number(params.range)) ? Number(params.range) : 30;
  const households = await getMyHouseholds(supabase);
  const household = households.find((h) => h.id === params.household);

  const today = new Date().toLocaleDateString("en-CA");
  const days = lastDays(range, today);

  let query = supabase
    .from("meals")
    .select("*, meal_shares(user_id, share_cents)")
    .gte("eaten_on", days[0])
    .lte("eaten_on", today)
    .order("eaten_on", { ascending: true });
  if (household) query = query.eq("household_id", household.id);
  const { data } = await query;
  const all = (data ?? []) as MealWithShares[];

  // "Just me" counts every meal I ate a share of; a household view counts the household's shared meals.
  const meals = household ? all : all.filter((m) => m.meal_shares.some((s) => s.user_id === userId));
  const portionOf = household ? wholeMeal : (m: MealWithShares) => myPortion(m, userId);
  const total = sumPortions(meals, portionOf);
  const daily = totalsByDay(meals, days, portionOf);
  const loggedDays = new Set(meals.map((m) => m.eaten_on)).size;
  const split = macroSplit(total);

  const href = (next: { range?: number; household?: string | null }) => {
    const q = new URLSearchParams();
    const r = next.range ?? range;
    const h = next.household === undefined ? household?.id : next.household;
    if (r !== 30) q.set("range", String(r));
    if (h) q.set("household", h);
    const s = q.toString();
    return s ? `/insights?${s}` : "/insights";
  };

  const people = household ? perPerson(meals, household.members.map((m) => m.id)) : [];
  const nameOf = (id: string) => household?.members.find((m) => m.id === id)?.display_name ?? "Someone";

  return (
    <div className="space-y-6">
      <PageHeader title="Insights" action={<ButtonLink href="/meals/new">Log a meal</ButtonLink>} />

      <div className="flex flex-wrap items-center gap-2">
        <Pill href={href({ household: null })} active={!household}>Just me</Pill>
        {households.map((h) => (
          <Pill key={h.id} href={href({ household: h.id })} active={household?.id === h.id}>
            {h.name}
          </Pill>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
        {RANGES.map((r) => (
          <Pill key={r} href={href({ range: r })} active={r === range}>
            {r} days
          </Pill>
        ))}
      </div>

      {meals.length === 0 ? (
        <Empty>
          No {household ? `shared meals in ${household.name}` : "meals"} in the last {range} days.{" "}
          <Link href="/meals/new" className="text-accent">Log one</Link> to see insights.
        </Empty>
      ) : (
        <>
          <p className="-mt-2 text-sm text-muted">
            {household
              ? `All shared meals in ${household.name}, whole-meal totals.`
              : "Your share of every meal you ate, personal and shared."}
          </p>
          <Summary total={total} loggedDays={loggedDays} mealCount={meals.length} />
          <Trends daily={daily} />

          {household && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <h2 className="mb-3 font-semibold">Each person&rsquo;s share of the cost</h2>
                <BarList
                  rows={people.map((p) => ({
                    key: p.userId,
                    label: (
                      <>
                        {nameOf(p.userId)}
                        {p.userId === userId && <span className="text-muted"> (you)</span>}
                      </>
                    ),
                    value: p.cost_cents,
                    display: formatMoney(p.cost_cents),
                  }))}
                />
              </Card>
              <Card>
                <h2 className="mb-3 font-semibold">Per person</h2>
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted">
                    <tr>
                      <th className="py-1 font-normal">Name</th>
                      <th className="py-1 text-right font-normal">Meals</th>
                      <th className="py-1 text-right font-normal">Paid</th>
                      <th className="py-1 text-right font-normal">kcal</th>
                      <th className="py-1 text-right font-normal">Protein</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {people.map((p) => (
                      <tr key={p.userId}>
                        <td className="py-1.5">{nameOf(p.userId)}</td>
                        <td className="py-1.5 text-right">{p.meals}</td>
                        <td className="py-1.5 text-right">{formatMoney(p.paid_cents)}</td>
                        <td className="py-1.5 text-right">{formatNumber(p.calories)}</td>
                        <td className="py-1.5 text-right">{formatNumber(p.protein_g)} g</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-muted">
                  Nutrients are split evenly between whoever ate each meal. Balances are on the{" "}
                  <Link href={`/households/${household.id}`} className="text-accent">household page</Link>.
                </p>
              </Card>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <h2 className="mb-3 font-semibold">Where calories come from</h2>
              {split ? (
                <MacroBar split={split} />
              ) : (
                <p className="text-sm text-muted">Log protein, carbs and fat to see the breakdown.</p>
              )}
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                {(
                  [
                    ["Protein", total.protein_g],
                    ["Carbs", total.carbs_g],
                    ["Fat", total.fat_g],
                    ["Fiber", total.fiber_g],
                  ] as const
                ).map(([label, grams]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted">{label}</dt>
                    <dd className="font-medium">{formatNumber(grams)} g</dd>
                  </div>
                ))}
              </dl>
            </Card>
            <Cheapest meals={cheapestMeals(meals)} />
          </div>
        </>
      )}
    </div>
  );
}
