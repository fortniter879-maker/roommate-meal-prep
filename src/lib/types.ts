export type Nutrients = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
};

export const NUTRIENT_FIELDS: { key: keyof Nutrients; label: string; unit: string }[] = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "protein_g", label: "Protein", unit: "g" },
  { key: "carbs_g", label: "Carbs", unit: "g" },
  { key: "fat_g", label: "Fat", unit: "g" },
  { key: "fiber_g", label: "Fiber", unit: "g" },
];

export type Recipe = Nutrients & {
  id: string;
  owner_id: string;
  household_id: string | null;
  name: string;
  ingredients: string;
  instructions: string;
  servings: number;
  cost_cents: number;
  created_at: string;
};

export type Meal = Nutrients & {
  id: string;
  created_by: string;
  household_id: string | null;
  recipe_id: string | null;
  name: string;
  eaten_on: string;
  servings: number;
  cost_cents: number;
  paid_by: string | null;
  notes: string;
  created_at: string;
};

export type Household = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
};

export type Profile = { id: string; display_name: string };
