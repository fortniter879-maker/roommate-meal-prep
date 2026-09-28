import Link from "next/link";
import { Card, Empty, PageHeader } from "@/components/ui";
import { getMyHouseholds } from "@/lib/data";
import { requireUser } from "@/lib/supabase/server";
import { CreateHouseholdForm, JoinHouseholdForm } from "./forms";

export default async function HouseholdsPage() {
  const { supabase } = await requireUser();
  const households = await getMyHouseholds(supabase);

  return (
    <div className="space-y-8">
      <PageHeader title="Households" />
      {households.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {households.map((h) => (
            <Link key={h.id} href={`/households/${h.id}`}>
              <Card className="hover:border-accent">
                <h2 className="font-semibold">{h.name}</h2>
                <p className="text-sm text-muted">{h.members.map((m) => m.display_name).join(", ")}</p>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Empty>You&apos;re not in a household yet. Create one for your place, or join a roommate&apos;s with their code.</Empty>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Create a household</h2>
          <CreateHouseholdForm />
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Join with an invite code</h2>
          <JoinHouseholdForm />
        </Card>
      </div>
    </div>
  );
}
