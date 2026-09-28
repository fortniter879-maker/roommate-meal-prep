"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { addNutrients, scaleFood, ZERO_NUTRIENTS, type FoodMatch } from "@/lib/foods";
import { formatNumber } from "@/lib/format";
import type { Nutrients } from "@/lib/types";

type Item = { food: FoodMatch; grams: string };

type Props = {
  /** Receives the nutrient totals for everything added, plus one "200 g Chicken breast" line per ingredient. */
  onApply: (totals: Nutrients, lines: string[]) => void;
  applyLabel: string;
  intro: string;
};

/** Search the USDA food database, add ingredients by weight, and fill a form's nutrition fields from the total. */
export function FoodLookup({ onApply, applyLabel, intro }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [branded, setBranded] = useState(false);
  const [results, setResults] = useState<FoodMatch[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  async function search() {
    if (query.trim().length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q: query.trim() });
      if (branded) params.set("branded", "1");
      const res = await fetch(`/api/foods?${params}`);
      const body = await res.json().catch(() => null);
      if (!res.ok || !body) throw new Error(body?.error ?? "Food search is unavailable right now.");
      setResults(body.foods);
    } catch (e) {
      setResults(null);
      setError(e instanceof Error ? e.message : "Food search is unavailable right now.");
    } finally {
      setLoading(false);
    }
  }

  function add(food: FoodMatch) {
    setItems((prev) => [...prev, { food, grams: String(food.servingGrams ?? 100) }]);
    setResults(null);
    setQuery("");
  }

  const scaled = items.map((item) => scaleFood(item.food.per100g, Number(item.grams) || 0));
  const totals = scaled.reduce(addNutrients, ZERO_NUTRIENTS);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-accent hover:underline">
        Look up nutrition from ingredients
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{intro}</p>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted hover:text-foreground">
          Close
        </button>
      </div>

      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // don't submit the surrounding form
              search();
            }
          }}
          placeholder="Search a food, e.g. chicken breast"
          aria-label="Search foods"
        />
        <Button type="button" variant="secondary" onClick={search} disabled={loading}>
          {loading ? "Searching" : "Search"}
        </Button>
      </div>
      <label className="flex items-center gap-2 text-xs text-muted">
        <input type="checkbox" checked={branded} onChange={(e) => setBranded(e.target.checked)} />
        Search brand-name products instead of basic foods
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}
      {results && (
        results.length ? (
          <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border text-sm">
            {results.map((food) => (
              <li key={food.id}>
                <button
                  type="button"
                  onClick={() => add(food)}
                  className="flex w-full justify-between gap-3 px-3 py-2 text-left hover:bg-background"
                >
                  <span>
                    {food.name}
                    {food.brand && <span className="text-muted"> · {food.brand}</span>}
                  </span>
                  <span className="shrink-0 text-muted">{formatNumber(food.per100g.calories)} kcal / 100 g</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No matches. Try a simpler name.</p>
        )
      )}

      {items.length > 0 && (
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted">
            <tr>
              <th className="py-1 font-normal">Ingredient</th>
              <th className="w-24 py-1 font-normal">Grams</th>
              <th className="py-1 text-right font-normal">kcal</th>
              <th className="py-1 text-right font-normal">Protein</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item, i) => (
              <tr key={i}>
                <td className="py-1 pr-2">{item.food.name}</td>
                <td className="py-1">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={item.grams}
                    aria-label={`Grams of ${item.food.name}`}
                    onChange={(e) =>
                      setItems((prev) => prev.map((x, j) => (j === i ? { ...x, grams: e.target.value } : x)))
                    }
                  />
                </td>
                <td className="py-1 text-right">{formatNumber(scaled[i].calories)}</td>
                <td className="py-1 text-right">{formatNumber(scaled[i].protein_g, 1)} g</td>
                <td className="py-1 text-right">
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
                    className="text-muted hover:text-danger"
                    aria-label={`Remove ${item.food.name}`}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="font-medium">
            <tr>
              <td className="py-1">Total</td>
              <td />
              <td className="py-1 text-right">{formatNumber(totals.calories)}</td>
              <td className="py-1 text-right">{formatNumber(totals.protein_g, 1)} g</td>
              <td />
            </tr>
          </tfoot>
        </table>
      )}

      {items.length > 0 && (
        <Button
          type="button"
          onClick={() =>
            onApply(
              totals,
              items.map((item) => `${formatNumber(Number(item.grams) || 0)} g ${item.food.name}`),
            )
          }
        >
          {applyLabel}
        </Button>
      )}
      <p className="text-xs text-muted">Nutrition data from USDA FoodData Central.</p>
    </div>
  );
}
