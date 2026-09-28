import type { Nutrients } from "./types";

/** A food from the USDA FoodData Central database, with nutrients per 100 g (or 100 ml). */
export type FoodMatch = {
  id: number;
  name: string;
  brand: string | null;
  per100g: Nutrients;
  /** Grams in one labelled serving, when the database lists one. */
  servingGrams: number | null;
  servingLabel: string | null;
};

type UsdaNutrient = { nutrientId?: number; nutrientNumber?: string; unitName?: string; value?: number };
type UsdaFood = {
  fdcId: number;
  description?: string;
  dataType?: string;
  brandOwner?: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients?: UsdaNutrient[];
};

// FoodData Central nutrient ids. Energy is 1008 on most foods; Foundation foods often only carry the
// Atwater energy values (2047 general, 2048 specific) instead.
const ENERGY_IDS = [1008, 2048, 2047];
const IDS = { protein_g: 1003, fat_g: 1004, carbs_g: 1005, fiber_g: 1079 } as const;

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Title-cases the SHOUTING descriptions branded foods tend to have. */
function tidyName(description: string) {
  if (description !== description.toUpperCase()) return description;
  return description.toLowerCase().replace(/(^|[\s,(/-])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());
}

export function parseUsdaFood(food: UsdaFood): FoodMatch | null {
  const values = new Map<number, number>();
  for (const n of food.foodNutrients ?? []) {
    if (typeof n.nutrientId !== "number" || typeof n.value !== "number") continue;
    // Energy is also listed in kJ under the same ids on some foods; keep kcal only.
    if (ENERGY_IDS.includes(n.nutrientId) && n.unitName && n.unitName.toUpperCase() !== "KCAL") continue;
    if (!values.has(n.nutrientId)) values.set(n.nutrientId, n.value);
  }

  const protein = values.get(IDS.protein_g) ?? 0;
  const fat = values.get(IDS.fat_g) ?? 0;
  const carbs = values.get(IDS.carbs_g) ?? 0;
  const energyId = ENERGY_IDS.find((id) => values.has(id));
  const calories = energyId !== undefined ? values.get(energyId)! : protein * 4 + carbs * 4 + fat * 9;
  if (!calories && !protein && !fat && !carbs) return null;

  const unit = food.servingSizeUnit?.toLowerCase();
  const servingGrams =
    food.servingSize && (unit === "g" || unit === "grm" || unit === "ml" || unit === "mlt") ? food.servingSize : null;

  return {
    id: food.fdcId,
    name: tidyName(food.description?.trim() || "Unnamed food"),
    brand: food.brandName || food.brandOwner || null,
    per100g: {
      calories: round1(calories),
      protein_g: round1(protein),
      carbs_g: round1(carbs),
      fat_g: round1(fat),
      fiber_g: round1(values.get(IDS.fiber_g) ?? 0),
    },
    servingGrams,
    servingLabel: servingGrams ? food.householdServingFullText || null : null,
  };
}

export function parseUsdaSearch(body: unknown): FoodMatch[] {
  const foods = (body as { foods?: UsdaFood[] } | null)?.foods ?? [];
  const seen = new Set<string>();
  const results: FoodMatch[] = [];
  for (const food of foods) {
    const match = parseUsdaFood(food);
    if (!match) continue;
    const key = `${match.name.toLowerCase()}|${match.brand ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(match);
  }
  return results;
}

/** Nutrients for a given weight of a food. */
export function scaleFood(per100g: Nutrients, grams: number): Nutrients {
  const f = grams / 100;
  return {
    calories: per100g.calories * f,
    protein_g: per100g.protein_g * f,
    carbs_g: per100g.carbs_g * f,
    fat_g: per100g.fat_g * f,
    fiber_g: per100g.fiber_g * f,
  };
}

export function addNutrients(a: Nutrients, b: Nutrients): Nutrients {
  return {
    calories: a.calories + b.calories,
    protein_g: a.protein_g + b.protein_g,
    carbs_g: a.carbs_g + b.carbs_g,
    fat_g: a.fat_g + b.fat_g,
    fiber_g: a.fiber_g + b.fiber_g,
  };
}

export const ZERO_NUTRIENTS: Nutrients = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
