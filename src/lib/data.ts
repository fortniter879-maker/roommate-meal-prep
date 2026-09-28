import type { SupabaseClient } from "@supabase/supabase-js";
import type { Household, Meal, Profile } from "./types";

export type HouseholdWithMembers = Household & { members: Profile[] };

/** Households the current user belongs to, each with its members' profiles. */
export async function getMyHouseholds(supabase: SupabaseClient): Promise<HouseholdWithMembers[]> {
  const { data: households } = await supabase
    .from("households")
    .select("*")
    .order("created_at", { ascending: true });
  if (!households?.length) return [];

  const { data: memberships } = await supabase
    .from("household_members")
    .select("household_id, user_id, profiles(id, display_name)")
    .in("household_id", households.map((h) => h.id));

  return households.map((h) => ({
    ...(h as Household),
    members: (memberships ?? [])
      .filter((m) => m.household_id === h.id)
      .map((m) => m.profiles as unknown as Profile)
      .filter(Boolean)
      .sort((a, b) => a.display_name.localeCompare(b.display_name)),
  }));
}

export async function getProfilesById(supabase: SupabaseClient, ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return new Map<string, Profile>();
  const { data } = await supabase.from("profiles").select("id, display_name").in("id", unique);
  return new Map((data ?? []).map((p) => [p.id, p as Profile]));
}

export type MealWithShares = Meal & { meal_shares: { user_id: string; share_cents: number }[] };

/** What one person spent and ate from a meal: their cost share and an even slice of the nutrients. */
export function myPortion(meal: MealWithShares, userId: string) {
  const mine = meal.meal_shares.find((s) => s.user_id === userId);
  const empty = { cost_cents: 0, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
  if (!mine) return empty;
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
