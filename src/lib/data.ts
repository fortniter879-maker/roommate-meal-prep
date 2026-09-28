import type { SupabaseClient } from "@supabase/supabase-js";
import type { Household, Profile } from "./types";

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

export { myPortion, type MealWithShares } from "./insights";
