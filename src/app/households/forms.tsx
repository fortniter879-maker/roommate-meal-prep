"use client";

import { useActionState, useState } from "react";
import { Button, ErrorNote, Field, Input, Select } from "@/components/ui";
import type { Profile } from "@/lib/types";
import { createHousehold, joinHousehold, recordSettlement } from "./actions";

export function CreateHouseholdForm() {
  const [state, action, pending] = useActionState(createHousehold, undefined);
  return (
    <form action={action} className="space-y-3">
      <Field label="Household name">
        <Input name="name" placeholder="e.g. 42 Elm St" required maxLength={80} />
      </Field>
      <ErrorNote message={state?.error} />
      <Button disabled={pending}>Create household</Button>
    </form>
  );
}

export function JoinHouseholdForm() {
  const [state, action, pending] = useActionState(joinHousehold, undefined);
  return (
    <form action={action} className="space-y-3">
      <Field label="Invite code">
        <Input name="code" placeholder="12 characters" required autoComplete="off" />
      </Field>
      <ErrorNote message={state?.error} />
      <Button variant="secondary" disabled={pending}>Join household</Button>
    </form>
  );
}

export function SettleUpForm({ householdId, others }: { householdId: string; others: Profile[] }) {
  const [state, action, pending] = useActionState(recordSettlement, undefined);
  const [formKey, setFormKey] = useState(0);
  if (!others.length) return <p className="text-sm text-muted">Invite a roommate to start settling up.</p>;

  return (
    <form
      key={formKey}
      action={async (fd) => {
        await action(fd);
        setFormKey((k) => k + 1);
      }}
      className="grid gap-3 sm:grid-cols-2"
    >
      <input type="hidden" name="household_id" value={householdId} />
      <Field label="I…">
        <Select name="direction" defaultValue="paid">
          <option value="paid">paid back</option>
          <option value="received">got paid back by</option>
        </Select>
      </Field>
      <Field label="Roommate">
        <Select name="other_user" required>
          {others.map((p) => (
            <option key={p.id} value={p.id}>{p.display_name}</option>
          ))}
        </Select>
      </Field>
      <Field label="Amount ($)">
        <Input name="amount" inputMode="decimal" placeholder="0.00" required />
      </Field>
      <Field label="Note (optional)">
        <Input name="note" maxLength={120} placeholder="e-Transfer" />
      </Field>
      <div className="sm:col-span-2 space-y-2">
        <ErrorNote message={state?.error} />
        <Button disabled={pending}>Record payment</Button>
      </div>
    </form>
  );
}
