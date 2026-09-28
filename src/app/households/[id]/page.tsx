import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, ButtonLink, Card, Empty, PageHeader } from "@/components/ui";
import { getProfilesById } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";
import type { Household, Meal, Profile } from "@/lib/types";
import { leaveHousehold } from "../actions";
import { SettleUpForm } from "../forms";

export default async function HouseholdPage({ params }: PageProps<"/households/[id]">) {
  const { id } = await params;
  const { supabase, userId } = await requireUser();

  const { data: household } = await supabase.from("households").select("*").eq("id", id).maybeSingle<Household>();
  if (!household) notFound();

  const [{ data: balances }, { data: meals }, { data: settlements }] = await Promise.all([
    supabase.from("household_balances").select("user_id, balance_cents").eq("household_id", id),
    supabase.from("meals").select("*").eq("household_id", id).order("eaten_on", { ascending: false }).limit(10),
    supabase.from("settlements").select("*").eq("household_id", id).order("created_at", { ascending: false }).limit(10),
  ]);

  const profiles = await getProfilesById(supabase, [
    ...(balances ?? []).map((b) => b.user_id),
    ...(settlements ?? []).flatMap((s) => [s.from_user, s.to_user]),
    ...(meals ?? []).map((m) => m.paid_by),
  ]);
  const name = (uid: string | null) => (uid && profiles.get(uid)?.display_name) || "Someone";
  const others: Profile[] = (balances ?? [])
    .filter((b) => b.user_id !== userId)
    .map((b) => profiles.get(b.user_id))
    .filter((p): p is Profile => Boolean(p));

  return (
    <div className="space-y-6">
      <PageHeader
        title={household.name}
        action={<ButtonLink href={`/meals/new?household=${id}`}>Log a shared meal</ButtonLink>}
      />

      <Card>
        <h2 className="mb-1 font-semibold">Invite roommates</h2>
        <p className="text-sm text-muted">
          Share this code. They sign up, open Households, and enter it under &ldquo;Join with an invite code&rdquo;.
        </p>
        <p className="mt-2 inline-block rounded-lg bg-background px-3 py-2 font-mono text-lg tracking-widest">
          {household.invite_code}
        </p>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Balances</h2>
          <ul className="divide-y divide-border">
            {(balances ?? []).map((b) => (
              <li key={b.user_id} className="flex justify-between py-2 text-sm">
                <span>
                  {name(b.user_id)}
                  {b.user_id === userId && <span className="text-muted"> (you)</span>}
                </span>
                <span className={b.balance_cents < 0 ? "text-danger" : b.balance_cents > 0 ? "text-accent" : "text-muted"}>
                  {b.balance_cents === 0
                    ? "settled"
                    : b.balance_cents > 0
                      ? `is owed ${formatMoney(b.balance_cents)}`
                      : `owes ${formatMoney(-b.balance_cents)}`}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Settle up</h2>
          <SettleUpForm householdId={id} others={others} />
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 font-semibold">Recent shared meals</h2>
        {meals?.length ? (
          <ul className="divide-y divide-border">
            {(meals as Meal[]).map((m) => (
              <li key={m.id} className="flex justify-between gap-4 py-2 text-sm">
                <Link href={`/meals/${m.id}`} className="hover:text-accent">
                  {m.name} <span className="text-muted">· {m.eaten_on}</span>
                </Link>
                <span className="text-muted">
                  {formatMoney(m.cost_cents)}
                  {m.paid_by && ` paid by ${name(m.paid_by)}`}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No shared meals yet.</Empty>
        )}
      </Card>

      {!!settlements?.length && (
        <Card>
          <h2 className="mb-3 font-semibold">Payments</h2>
          <ul className="divide-y divide-border text-sm">
            {settlements.map((s) => (
              <li key={s.id} className="flex justify-between py-2">
                <span>
                  {name(s.from_user)} paid {name(s.to_user)}
                  {s.note && <span className="text-muted"> · {s.note}</span>}
                </span>
                <span>{formatMoney(s.amount_cents)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <form action={leaveHousehold}>
        <input type="hidden" name="household_id" value={id} />
        <Button variant="danger">Leave household</Button>
      </form>
    </div>
  );
}
