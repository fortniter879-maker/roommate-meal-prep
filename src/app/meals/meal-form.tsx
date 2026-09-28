"use client";

import { useActionState, useMemo, useState } from "react";
import { FoodLookup } from "@/components/food-lookup";
import { Button, ErrorNote, Field, Input, Select, Textarea } from "@/components/ui";
import type { HouseholdWithMembers } from "@/lib/data";
import { formatMoney, splitEvenly } from "@/lib/format";
import type { Nutrients, Recipe } from "@/lib/types";
import { NUTRIENT_FIELDS } from "@/lib/types";
import { createMeal } from "./actions";

type Props = {
  userId: string;
  households: HouseholdWithMembers[];
  recipes: Recipe[];
  initialRecipeId?: string;
  initialHouseholdId?: string;
  today: string;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

function fromRecipe(recipe: Recipe | undefined, servings: number) {
  const nutrients = Object.fromEntries(NUTRIENT_FIELDS.map((f) => [f.key, ""])) as Record<keyof Nutrients, string>;
  if (!recipe) return { nutrients, cost: "" };
  for (const f of NUTRIENT_FIELDS) nutrients[f.key] = String(round1(recipe[f.key] * servings));
  const cost = ((recipe.cost_cents / recipe.servings) * servings) / 100;
  return { nutrients, cost: cost ? cost.toFixed(2) : "" };
}

export function MealForm({ userId, households, recipes, initialRecipeId, initialHouseholdId, today }: Props) {
  const [state, action, pending] = useActionState(createMeal, undefined);

  const initialRecipe = recipes.find((r) => r.id === initialRecipeId);
  const [recipeId, setRecipeId] = useState(initialRecipe?.id ?? "");
  const [name, setName] = useState(initialRecipe?.name ?? "");
  const [servings, setServings] = useState("1");
  const [cost, setCost] = useState(() => fromRecipe(initialRecipe, 1).cost);
  const [nutrients, setNutrients] = useState(() => fromRecipe(initialRecipe, 1).nutrients);
  const [householdId, setHouseholdId] = useState(
    households.some((h) => h.id === initialHouseholdId) ? initialHouseholdId! : "",
  );
  const household = households.find((h) => h.id === householdId);
  const [participants, setParticipants] = useState<string[]>(household?.members.map((m) => m.id) ?? []);

  function applyRecipe(id: string, nextServings: string) {
    const recipe = recipes.find((r) => r.id === id);
    if (!recipe) return;
    const filled = fromRecipe(recipe, Number(nextServings) || 1);
    setNutrients(filled.nutrients);
    setCost(filled.cost);
  }

  const preview = useMemo(() => {
    const cents = Math.round((Number(cost) || 0) * 100);
    if (!household || !participants.length || !cents) return null;
    const shares = splitEvenly(cents, participants.length);
    return `${formatMoney(Math.max(...shares))} each for ${participants.length} ${participants.length === 1 ? "person" : "people"}`;
  }, [cost, household, participants]);

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="From a recipe (optional)" hint="Fills in cost and nutrition from the recipe.">
          <Select
            name="recipe_id"
            value={recipeId}
            onChange={(e) => {
              const id = e.target.value;
              setRecipeId(id);
              const recipe = recipes.find((r) => r.id === id);
              if (recipe) setName(recipe.name);
              applyRecipe(id, servings);
            }}
          >
            <option value="">None</option>
            {recipes.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Meal name">
          <Input name="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
        </Field>
        <Field label="Date">
          <Input name="eaten_on" type="date" defaultValue={today} required />
        </Field>
        <Field label="Servings" hint={recipeId ? "Changing this rescales the recipe values." : undefined}>
          <Input
            name="servings"
            type="number"
            min="0.25"
            step="0.25"
            value={servings}
            onChange={(e) => {
              setServings(e.target.value);
              applyRecipe(recipeId, e.target.value);
            }}
            required
          />
        </Field>
        <Field label="Cost ($)">
          <Input name="cost" inputMode="decimal" placeholder="0.00" value={cost} onChange={(e) => setCost(e.target.value)} />
        </Field>
        <Field label="Who's this for?">
          <Select
            name="household_id"
            value={householdId}
            onChange={(e) => {
              setHouseholdId(e.target.value);
              const h = households.find((x) => x.id === e.target.value);
              setParticipants(h?.members.map((m) => m.id) ?? []);
            }}
          >
            <option value="">Just me</option>
            {households.map((h) => (
              <option key={h.id} value={h.id}>Shared with {h.name}</option>
            ))}
          </Select>
        </Field>
      </div>

      {household && (
        <div className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-2">
          <Field label="Paid by">
            <Select name="paid_by" defaultValue={userId} key={household.id}>
              {household.members.map((m) => (
                <option key={m.id} value={m.id}>{m.id === userId ? `${m.display_name} (you)` : m.display_name}</option>
              ))}
            </Select>
          </Field>
          <fieldset>
            <legend className="mb-1 text-sm font-medium">Split between</legend>
            <div className="space-y-1">
              {household.members.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="participants"
                    value={m.id}
                    checked={participants.includes(m.id)}
                    onChange={(e) =>
                      setParticipants((prev) => (e.target.checked ? [...prev, m.id] : prev.filter((p) => p !== m.id)))
                    }
                  />
                  {m.display_name}
                </label>
              ))}
            </div>
            {preview && <p className="mt-2 text-xs text-muted">{preview}</p>}
          </fieldset>
        </div>
      )}

      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-medium">Nutrition for the whole meal</legend>
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
        {!recipeId && (
          <FoodLookup
            onApply={(totals) =>
              setNutrients(
                Object.fromEntries(NUTRIENT_FIELDS.map((f) => [f.key, String(round1(totals[f.key]))])) as Record<
                  keyof Nutrients,
                  string
                >,
              )
            }
            applyLabel="Use these totals"
            intro="Add everything that went into this meal, for everyone eating it."
          />
        )}
      </fieldset>

      <Field label="Notes">
        <Textarea name="notes" rows={2} maxLength={500} />
      </Field>

      <ErrorNote message={state?.error} />
      <Button disabled={pending}>Save meal</Button>
    </form>
  );
}
