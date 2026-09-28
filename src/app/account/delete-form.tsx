"use client";

import { useActionState } from "react";
import { Button, ErrorNote, Field, Input } from "@/components/ui";
import { deleteAccount } from "./actions";

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccount, undefined);
  return (
    <form action={action} className="space-y-3">
      <Field label='Type "delete" to confirm'>
        <Input name="confirm" required autoComplete="off" />
      </Field>
      <ErrorNote message={state?.error} />
      <Button variant="danger" disabled={pending}>
        {pending ? "Deleting…" : "Delete my account"}
      </Button>
    </form>
  );
}
