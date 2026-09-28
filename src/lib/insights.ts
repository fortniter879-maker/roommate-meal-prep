import type { Meal, Nutrients } from "./types";

export type MealWithShares = Meal & { meal_shares: { user_id: string; share_cents: number }[] };

/** Cost in cents plus nutrients: what one person (or a whole household) spent and ate. */
export type Portion = Nutrients & { cost_cents: number };

export const ZERO_PORTION: Portion = { cost_cents: 0, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };

export function addPortions(a: Portion, b: Portion): Portion {
  return {
    cost_cents: a.cost_cents + b.cost_cents,
    calories: a.calories + b.calories,
    protein_g: a.protein_g + b.protein_g,
    carbs_g: a.carbs_g + b.carbs_g,
    fat_g: a.fat_g + b.fat_g,
    fiber_g: a.fiber_g + b.fiber_g,
  };
}

/** What one person spent and ate from a meal: their cost share and an even slice of the nutrients. */
export function myPortion(meal: MealWithShares, userId: string): Portion {
  const mine = meal.meal_shares.find((s) => s.user_id === userId);
  if (!mine) return ZERO_PORTION;
  const fraction = 1 / meal.meal_shares.length;
  return {
    cost_cents: mine.share_cents,
    calories: Number(meal.calories) * fraction,
    protein_g: Number(meal.protein_g) * fraction,
    carbs_g: Number(meal.carbs_g) * fraction,
    fat_g: Number(meal.fat_g) * fraction,
    fiber_g: Number(meal.fiber_g) * fraction,
  };
}

/** The whole meal: full cost and nutrients, regardless of who ate it. */
export function wholeMeal(meal: Meal): Portion {
  return {
    cost_cents: meal.cost_cents,
    calories: Number(meal.calories),
    protein_g: Number(meal.protein_g),
    carbs_g: Number(meal.carbs_g),
    fat_g: Number(meal.fat_g),
    fiber_g: Number(meal.fiber_g),
  };
}

/** The `count` calendar days ending on `today` (YYYY-MM-DD), oldest first. */
export function lastDays(count: number, today: string): string[] {
  const end = new Date(`${today}T00:00:00Z`);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(end);
    d.setUTCDate(end.getUTCDate() - (count - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

/** Sums portions per day, including zero days so charts show gaps. */
export function totalsByDay<M extends Meal>(meals: M[], days: string[], portionOf: (meal: M) => Portion) {
  const byDate = new Map(days.map((d) => [d, ZERO_PORTION]));
  for (const meal of meals) {
    const current = byDate.get(meal.eaten_on);
    if (current) byDate.set(meal.eaten_on, addPortions(current, portionOf(meal)));
  }
  return days.map((date) => ({ date, ...byDate.get(date)! }));
}

export function sumPortions<M>(meals: M[], portionOf: (meal: M) => Portion): Portion {
  return meals.reduce((acc, m) => addPortions(acc, portionOf(m)), ZERO_PORTION);
}

/** Share of calories from protein, carbs and fat (4/4/9 kcal per gram), as fractions that sum to 1. */
export function macroSplit(n: Nutrients) {
  const protein = n.protein_g * 4;
  const carbs = n.carbs_g * 4;
  const fat = n.fat_g * 9;
  const total = protein + carbs + fat;
  if (!total) return null;
  return { protein: protein / total, carbs: carbs / total, fat: fat / total };
}

export type PersonTotals = Portion & { userId: string; meals: number; paid_cents: number };

/** Each member's share of a household's meals, plus how much they paid up front. */
export function perPerson(meals: MealWithShares[], memberIds: string[]): PersonTotals[] {
  return memberIds.map((userId) => {
    const eaten = meals.filter((m) => m.meal_shares.some((s) => s.user_id === userId));
    return {
      userId,
      ...sumPortions(eaten, (m) => myPortion(m, userId)),
      meals: eaten.length,
      paid_cents: meals.filter((m) => m.paid_by === userId).reduce((sum, m) => sum + m.cost_cents, 0),
    };
  });
}

/** Meals ranked by cost per 100 kcal, cheapest first, merged by name. Meals without calories are skipped. */
export function cheapestMeals(meals: Meal[], limit = 5) {
  const byName = new Map<string, { name: string; cost_cents: number; calories: number; protein_g: number; count: number }>();
  for (const m of meals) {
    if (!Number(m.calories) || !m.cost_cents) continue;
    const key = m.name.trim().toLowerCase();
    const entry = byName.get(key) ?? { name: m.name.trim(), cost_cents: 0, calories: 0, protein_g: 0, count: 0 };
    entry.cost_cents += m.cost_cents;
    entry.calories += Number(m.calories);
    entry.protein_g += Number(m.protein_g);
    entry.count += 1;
    byName.set(key, entry);
  }
  return [...byName.values()]
    .map((e) => ({
      name: e.name,
      count: e.count,
      centsPer100kcal: (e.cost_cents / e.calories) * 100,
      centsPer10gProtein: e.protein_g ? (e.cost_cents / e.protein_g) * 10 : null,
    }))
    .sort((a, b) => a.centsPer100kcal - b.centsPer100kcal)
    .slice(0, limit);
}
