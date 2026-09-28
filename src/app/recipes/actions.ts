"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toCents, toNumber } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";
import { NUTRIENT_FIELDS } from "@/lib/types";

export type FormState = { error?: string } | undefined;

export async function createRecipe(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give the recipe a name." };

  const householdId = String(formData.get("household_id") ?? "");
  const row: Record<string, unknown> = {
    name,
    household_id: householdId || null,
    servings: toNumber(formData.get("servings"), 1) || 1,
    cost_cents: toCents(formData.get("cost")),
    ingredients: String(formData.get("ingredients") ?? "").trim(),
    instructions: String(formData.get("instructions") ?? "").trim(),
  };
  for (const f of NUTRIENT_FIELDS) row[f.key] = toNumber(formData.get(f.key));

  const { data, error } = await supabase.from("recipes").insert(row).select("id").single();
  if (error) return { error: error.message };
  revalidatePath("/recipes");
  redirect(`/recipes/${data.id}`);
}

export async function deleteRecipe(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("recipes").delete().eq("id", String(formData.get("id")));
  revalidatePath("/recipes");
  redirect("/recipes");
}
