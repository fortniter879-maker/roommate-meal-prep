"use client";

import { useActionState } from "react";
import { Button, ErrorNote, Field, Input, Select, Textarea } from "@/components/ui";
import type { Household } from "@/lib/types";
import { NUTRIENT_FIELDS } from "@/lib/types";
import { createRecipe } from "./actions";

export function RecipeForm({ households }: { households: Pick<Household, "id" | "name">[] }) {
  const [state, action, pending] = useActionState(createRecipe, undefined);

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <Input name="name" required maxLength={120} placeholder="Chicken burrito bowls" />
        </Field>
        <Field label="Visible to">
          <Select name="household_id" defaultValue="">
            <option value="">Just me</option>
            {households.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Servings it makes">
          <Input name="servings" type="number" min="0.25" step="0.25" defaultValue="4" required />
        </Field>
        <Field label="Total ingredient cost ($)">
          <Input name="cost" inputMode="decimal" placeholder="0.00" />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Nutrition per serving</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {NUTRIENT_FIELDS.map((f) => (
            <Field key={f.key} label={`${f.label} (${f.unit})`}>
              <Input name={f.key} type="number" min="0" step="any" placeholder="0" />
            </Field>
          ))}
        </div>
      </fieldset>

      <Field label="Ingredients" hint="One per line.">
        <Textarea name="ingredients" rows={6} />
      </Field>
      <Field label="Instructions">
        <Textarea name="instructions" rows={6} />
      </Field>

      <ErrorNote message={state?.error} />
      <Button disabled={pending}>Save recipe</Button>
    </form>
  );
}
