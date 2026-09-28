import assert from "node:assert/strict";
import { test } from "node:test";
import { parseUsdaFood, parseUsdaSearch, scaleFood } from "./foods.ts";

// Trimmed shapes of real FoodData Central /foods/search results.
const srLegacyChicken = {
  fdcId: 171077,
  description: "Chicken, broilers or fryers, breast, meat only, raw",
  dataType: "SR Legacy",
  foodNutrients: [
    { nutrientId: 1003, nutrientName: "Protein", unitName: "G", value: 22.5 },
    { nutrientId: 1004, nutrientName: "Total lipid (fat)", unitName: "G", value: 2.62 },
    { nutrientId: 1005, nutrientName: "Carbohydrate, by difference", unitName: "G", value: 0 },
    { nutrientId: 1008, nutrientName: "Energy", unitName: "KCAL", value: 120 },
    { nutrientId: 1062, nutrientName: "Energy", unitName: "kJ", value: 502 },
  ],
};

const foundationOats = {
  fdcId: 2346396,
  description: "Oats, whole grain, rolled, old fashioned",
  dataType: "Foundation",
  foodNutrients: [
    { nutrientId: 1003, unitName: "G", value: 13.5 },
    { nutrientId: 1004, unitName: "G", value: 5.89 },
    { nutrientId: 1005, unitName: "G", value: 68.7 },
    { nutrientId: 1079, unitName: "G", value: 10.1 },
    { nutrientId: 2047, unitName: "KCAL", value: 382 },
    { nutrientId: 2048, unitName: "KCAL", value: 379 },
  ],
};

const brandedBeans = {
  fdcId: 999,
  description: "BLACK BEANS, LOW SODIUM",
  dataType: "Branded",
  brandOwner: "Example Foods Inc.",
  servingSize: 130,
  servingSizeUnit: "g",
  householdServingFullText: "1/2 cup",
  foodNutrients: [
    { nutrientId: 1003, unitName: "G", value: 6.15 },
    { nutrientId: 1004, unitName: "G", value: 0 },
    { nutrientId: 1005, unitName: "G", value: 16.9 },
    { nutrientId: 1079, unitName: "G", value: 6.2 },
    { nutrientId: 1008, unitName: "KCAL", value: 92 },
  ],
};

test("reads per-100 g nutrients from an SR Legacy food", () => {
  const food = parseUsdaFood(srLegacyChicken)!;
  assert.equal(food.name, "Chicken, broilers or fryers, breast, meat only, raw");
  assert.deepEqual(food.per100g, { calories: 120, protein_g: 22.5, carbs_g: 0, fat_g: 2.6, fiber_g: 0 });
  assert.equal(food.servingGrams, null);
});

test("falls back to Atwater energy on Foundation foods", () => {
  assert.equal(parseUsdaFood(foundationOats)!.per100g.calories, 379);
});

test("computes calories from macros when no energy value is listed", () => {
  const food = parseUsdaFood({ fdcId: 1, description: "Mystery", foodNutrients: [
    { nutrientId: 1003, value: 10 }, { nutrientId: 1005, value: 20 }, { nutrientId: 1004, value: 5 },
  ] })!;
  assert.equal(food.per100g.calories, 165);
});

test("tidies branded names and keeps the serving size", () => {
  const food = parseUsdaFood(brandedBeans)!;
  assert.equal(food.name, "Black Beans, Low Sodium");
  assert.equal(food.brand, "Example Foods Inc.");
  assert.equal(food.servingGrams, 130);
  assert.equal(food.servingLabel, "1/2 cup");
});

test("skips foods with no nutrients and duplicate names", () => {
  const results = parseUsdaSearch({
    foods: [srLegacyChicken, { ...srLegacyChicken, fdcId: 2 }, { fdcId: 3, description: "Water", foodNutrients: [] }],
  });
  assert.equal(results.length, 1);
  assert.deepEqual(parseUsdaSearch(null), []);
});

test("scales nutrients by weight", () => {
  const scaled = scaleFood(parseUsdaFood(srLegacyChicken)!.per100g, 250);
  assert.equal(scaled.calories, 300);
  assert.equal(scaled.protein_g, 56.25);
});
