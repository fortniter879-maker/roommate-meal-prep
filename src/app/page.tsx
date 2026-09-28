import { redirect } from "next/navigation";
import { ButtonLink, Card, Stat } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

const FEATURES = [
  { title: "Log every meal", body: "Record what you ate, when, how much it cost and its calories, protein, carbs, fat and fiber." },
  { title: "Keep your recipes", body: "Save recipes with cost and per-serving nutrition, then log a meal from one in a couple of taps." },
  { title: "Look up nutrition", body: "Search the USDA food database, add ingredients by weight, and the nutrition fills itself in." },
  { title: "Cook together", body: "Create a household, invite your roommates with a code, and log shared meals everyone can see." },
  { title: "Split costs fairly", body: "Shared meals are split between whoever ate, and running balances show who owes whom." },
  { title: "See the trends", body: "Charts of spending and calories over time, your best-value meals, and who ate and paid what." },
];

const STEPS = [
  { title: "Sign up", body: "Free, with just an email and password." },
  { title: "Invite your roommates", body: "Create a household and share its code, or skip this and track solo." },
  { title: "Log as you cook", body: "Add a recipe once, then log each meal and who ate it. The math is done for you." },
];

const SAMPLE_BALANCES = [
  { name: "Sam", amount: "+$18.40", tone: "text-accent" },
  { name: "Priya", amount: "−$6.15", tone: "text-danger" },
  { name: "Alex", amount: "−$12.25", tone: "text-danger" },
];

export default async function Home({ searchParams }: PageProps<"/">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.sub) redirect("/dashboard");
  const { deleted } = await searchParams;

  return (
    <div className="space-y-16">
      {deleted && (
        <p className="rounded-lg border border-border bg-surface px-4 py-3 text-sm">
          Your account and data have been deleted.
        </p>
      )}

      <section className="grid items-center gap-10 py-6 md:grid-cols-2">
        <div className="space-y-5">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Meal prep, costs and nutrition in one place</h1>
          <p className="text-lg text-muted">
            Track meals on your own or with your roommates. Log recipes, see what you spend and eat, and split
            grocery costs without the spreadsheet.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/login?mode=signup">Get started free</ButtonLink>
            <ButtonLink href="/login" variant="secondary">Sign in</ButtonLink>
          </div>
          <p className="text-sm text-muted">No ads, no tracking, and you can delete your data any time.</p>
        </div>

        <Card aria-label="Example of a household dashboard" className="space-y-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">42 Elm St · last 7 days</span>
            <span className="text-muted">Example</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Your spend" value="$31.80" />
            <Stat label="Calories/day" value="2,140" />
            <Stat label="Protein/day" value="118 g" />
          </div>
          <div className="space-y-2 border-t border-border pt-4 text-sm">
            <div className="text-xs uppercase tracking-wide text-muted">Balances</div>
            {SAMPLE_BALANCES.map((b) => (
              <div key={b.name} className="flex justify-between">
                <span>{b.name}</span>
                <span className={`font-medium ${b.tone}`}>{b.amount}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="space-y-6">
        <h2 className="text-center text-2xl font-semibold">Everything a shared kitchen needs</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <h3 className="mb-1 font-semibold">{f.title}</h3>
              <p className="text-sm text-muted">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-center text-2xl font-semibold">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="space-y-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-contrast">
                {i + 1}
              </span>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-surface px-6 py-10 text-center">
        <h2 className="text-2xl font-semibold">Stop guessing who owes what</h2>
        <p className="mx-auto max-w-xl text-muted">Set up a household in a minute and start logging tonight&apos;s dinner.</p>
        <ButtonLink href="/login?mode=signup">Create your free account</ButtonLink>
      </section>
    </div>
  );
}
