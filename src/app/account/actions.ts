"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";

export type DeleteState = { error?: string } | undefined;

export async function deleteAccount(_prev: DeleteState, formData: FormData): Promise<DeleteState> {
  const { supabase } = await requireUser();
  if (String(formData.get("confirm") ?? "").trim().toLowerCase() !== "delete") {
    return { error: 'Type "delete" to confirm.' };
  }

  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { error: error.message };
  // The user no longer exists; clear the local session cookie.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/?deleted=1");
}
