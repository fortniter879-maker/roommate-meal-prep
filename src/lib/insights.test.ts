import assert from "node:assert/strict";
import { test } from "node:test";
import { cheapestMeals, lastDays, macroSplit, perPerson, totalsByDay, wholeMeal, type MealWithShares } from "./insights.ts";

function meal(over: Partial<MealWithShares>): MealWithShares {
  return {
    id: crypto.randomUUID(), created_by: "a", household_id: "h", recipe_id: null, name: "Chili",
    eaten_on: "2026-09-28", servings: 3, cost_cents: 900, paid_by: "a", notes: "", created_at: "",
    calories: 1800, protein_g: 90, carbs_g: 150, fat_g: 60, fiber_g: 30,
    meal_shares: [{ user_id: "a", share_cents: 300 }, { user_id: "b", share_cents: 300 }, { user_id: "c", share_cents: 300 }],
    ...over,
  };
}

test("lastDays spans month boundaries, oldest first", () => {
  assert.deepEqual(lastDays(3, "2026-10-01"), ["2026-09-29", "2026-09-30", "2026-10-01"]);
});

test("totalsByDay fills empty days and ignores meals outside the range", () => {
  const days = lastDays(3, "2026-09-28");
  const daily = totalsByDay([meal({}), meal({ eaten_on: "2026-09-28" }), meal({ eaten_on: "2026-08-01" })], days, wholeMeal);
  assert.deepEqual(daily.map((d) => d.cost_cents), [0, 0, 1800]);
});

test("perPerson splits nutrients evenly and credits the payer", () => {
  const meals = [meal({}), meal({ paid_by: "b", cost_cents: 400, meal_shares: [
    { user_id: "a", share_cents: 200 }, { user_id: "b", share_cents: 200 },
  ] })];
  const [a, b, c] = perPerson(meals, ["a", "b", "c"]);
  assert.equal(a.cost_cents, 500);
  assert.equal(a.meals, 2);
  assert.equal(a.paid_cents, 900);
  assert.equal(b.paid_cents, 400);
  assert.equal(c.meals, 1);
  assert.equal(c.calories, 600);
  assert.equal(a.calories, 600 + 900);
});

test("macroSplit uses 4/4/9 kcal per gram", () => {
  const split = macroSplit({ calories: 0, protein_g: 25, carbs_g: 50, fat_g: 0, fiber_g: 0 })!;
  assert.ok(Math.abs(split.protein - 1 / 3) < 1e-9);
  assert.equal(macroSplit({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }), null);
});

test("cheapestMeals merges by name and ranks by cost per 100 kcal", () => {
  const ranked = cheapestMeals([
    meal({ name: "Steak", cost_cents: 2000, calories: 800 }),
    meal({ name: "chili " }),
    meal({ name: "Chili" }),
    meal({ name: "Water", calories: 0 }),
  ]);
  assert.deepEqual(ranked.map((r) => [r.name, r.count]), [["chili", 2], ["Steak", 1]]);
  assert.equal(ranked[0].centsPer100kcal, 50);
});
