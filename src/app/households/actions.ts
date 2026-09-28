"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toCents } from "@/lib/format";
import { requireUser } from "@/lib/supabase/server";

export type FormState = { error?: string } | undefined;

export async function createHousehold(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give your household a name." };

  const { data, error } = await supabase.from("households").insert({ name }).select("id").single();
  if (error) return { error: error.message };
  revalidatePath("/households");
  redirect(`/households/${data.id}`);
}

export async function joinHousehold(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "Enter the invite code a roommate shared with you." };

  const { data, error } = await supabase.rpc("join_household", { code });
  if (error) return { error: error.message.includes("invalid") ? "That invite code didn't match a household." : error.message };
  revalidatePath("/households");
  redirect(`/households/${data}`);
}

export async function leaveHousehold(formData: FormData) {
  const { supabase, userId } = await requireUser();
  const householdId = String(formData.get("household_id"));
  await supabase.from("household_members").delete().match({ household_id: householdId, user_id: userId });
  revalidatePath("/households");
  redirect("/households");
}

export async function recordSettlement(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, userId } = await requireUser();
  const householdId = String(formData.get("household_id"));
  const otherId = String(formData.get("other_user") ?? "");
  const direction = String(formData.get("direction"));
  const amount = toCents(formData.get("amount"));
  if (!otherId) return { error: "Pick a roommate." };
  if (!amount) return { error: "Enter an amount greater than zero." };

  const [from_user, to_user] = direction === "received" ? [otherId, userId] : [userId, otherId];
  const { error } = await supabase.from("settlements").insert({
    household_id: householdId,
    from_user,
    to_user,
    amount_cents: amount,
    note: String(formData.get("note") ?? "").trim(),
  });
  if (error) return { error: error.message };
  revalidatePath(`/households/${householdId}`);
  return undefined;
}
