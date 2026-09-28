"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { splitEvenly, toCents, toNumber } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";
import { NUTRIENT_FIELDS } from "@/lib/types";

export type FormState = { error?: string } | undefined;

export async function createMeal(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, userId } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give the meal a name." };

  const householdId = String(formData.get("household_id") ?? "") || null;
  const costCents = toCents(formData.get("cost"));
  const participants = householdId
    ? [...new Set(formData.getAll("participants").map(String))].sort()
    : [userId];
  if (householdId && participants.length === 0) return { error: "Pick at least one person who ate this." };

  const row: Record<string, unknown> = {
    name,
    household_id: householdId,
    recipe_id: String(formData.get("recipe_id") ?? "") || null,
    eaten_on: String(formData.get("eaten_on") ?? "") || undefined,
    servings: toNumber(formData.get("servings"), 1) || 1,
    cost_cents: costCents,
    paid_by: householdId ? String(formData.get("paid_by") ?? "") || userId : userId,
    notes: String(formData.get("notes") ?? "").trim(),
  };
  for (const f of NUTRIENT_FIELDS) row[f.key] = toNumber(formData.get(f.key));

  const { data: meal, error } = await supabase.from("meals").insert(row).select("id").single();
  if (error) return { error: error.message };

  const shares = splitEvenly(costCents, participants.length).map((share_cents, i) => ({
    meal_id: meal.id,
    user_id: participants[i],
    share_cents,
  }));
  const { error: shareError } = await supabase.from("meal_shares").insert(shares);
  if (shareError) {
    await supabase.from("meals").delete().eq("id", meal.id);
    return { error: shareError.message };
  }

  revalidatePath("/meals");
  revalidatePath("/dashboard");
  if (householdId) revalidatePath(`/households/${householdId}`);
  redirect(`/meals/${meal.id}`);
}

export async function deleteMeal(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  await supabase.from("meals").delete().eq("id", id);
  revalidatePath("/meals");
  revalidatePath("/dashboard");
  redirect("/meals");
}
