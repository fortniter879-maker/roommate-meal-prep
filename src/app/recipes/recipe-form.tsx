"use client";

import { useActionState, useState } from "react";
import { FoodLookup } from "@/components/food-lookup";
import { Button, ErrorNote, Field, Input, Select, Textarea } from "@/components/ui";
import type { Household, Nutrients } from "@/lib/types";
import { NUTRIENT_FIELDS } from "@/lib/types";

const round1 = (n: number) => Math.round(n * 10) / 10;
const emptyNutrients = () => Object.fromEntries(NUTRIENT_FIELDS.map((f) => [f.key, ""])) as Record<keyof Nutrients, string>;
import { createRecipe } from "./actions";

export function RecipeForm({ households }: { households: Pick<Household, "id" | "name">[] }) {
  const [state, action, pending] = useActionState(createRecipe, undefined);
  const [servings, setServings] = useState("4");
  const [nutrients, setNutrients] = useState(emptyNutrients);
  const [ingredients, setIngredients] = useState("");

  function applyLookup(totals: Nutrients, lines: string[]) {
    const perServing = Number(servings) || 1;
    setNutrients(
      Object.fromEntries(NUTRIENT_FIELDS.map((f) => [f.key, String(round1(totals[f.key] / perServing))])) as Record<
        keyof Nutrients,
        string
      >,
    );
    setIngredients((prev) => {
      const existing = prev.split("\n").map((l) => l.trim()).filter(Boolean);
      return [...existing, ...lines.filter((l) => !existing.includes(l))].join("\n");
    });
  }

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
          <Input
            name="servings"
            type="number"
            min="0.25"
            step="0.25"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            required
          />
        </Field>
        <Field label="Total ingredient cost ($)">
          <Input name="cost" inputMode="decimal" placeholder="0.00" />
        </Field>
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-medium">Nutrition per serving</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {NUTRIENT_FIELDS.map((f) => (
            <Field key={f.key} label={`${f.label} (${f.unit})`}>
              <Input
                name={f.key}
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={nutrients[f.key]}
                onChange={(e) => setNutrients((prev) => ({ ...prev, [f.key]: e.target.value }))}
              />
            </Field>
          ))}
        </div>
        <FoodLookup
          onApply={applyLookup}
          applyLabel="Use for this recipe"
          intro="Add every ingredient in the whole recipe. The total is divided by the servings above and the ingredients are added to the list below."
        />
      </fieldset>

      <Field label="Ingredients" hint="One per line.">
        <Textarea name="ingredients" rows={6} value={ingredients} onChange={(e) => setIngredients(e.target.value)} />
      </Field>
      <Field label="Instructions">
        <Textarea name="instructions" rows={6} />
      </Field>

      <ErrorNote message={state?.error} />
      <Button disabled={pending}>Save recipe</Button>
    </form>
  );
}
