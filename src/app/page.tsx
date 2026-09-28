import { redirect } from "next/navigation";
import { ButtonLink, Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

const FEATURES = [
  { title: "Log every meal", body: "Record what you ate, when, how much it cost and its calories, protein, carbs, fat and fiber." },
  { title: "Keep your recipes", body: "Save recipes with cost and per-serving nutrition, then log a meal from one in a couple of taps." },
  { title: "Cook together", body: "Create a household, invite your roommates with a code, and log shared meals everyone can see." },
  { title: "Split costs fairly", body: "Shared meals are split between whoever ate, and running balances show who owes whom." },
];

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.sub) redirect("/dashboard");

  return (
    <div className="space-y-10">
      <section className="space-y-4 py-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Meal prep, costs and nutrition in one place</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted">
          Track meals on your own or with your roommates. Log recipes, see what you spend and eat, and split
          grocery costs without the spreadsheet.
        </p>
        <div className="flex justify-center gap-3">
          <ButtonLink href="/login?mode=signup">Get started free</ButtonLink>
          <ButtonLink href="/login" variant="secondary">Sign in</ButtonLink>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <h2 className="mb-1 font-semibold">{f.title}</h2>
            <p className="text-sm text-muted">{f.body}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
