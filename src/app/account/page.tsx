import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/supabase/server";
import { DeleteAccountForm } from "./delete-form";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const { supabase, userId } = await requireUser();
  const [{ data: claims }, { data: profile }] = await Promise.all([
    supabase.auth.getClaims(),
    supabase.from("profiles").select("display_name").eq("id", userId).single(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Account" />
      <Card className="space-y-1 text-sm">
        <p><span className="text-muted">Name:</span> {profile?.display_name}</p>
        <p><span className="text-muted">Email:</span> {String(claims?.claims?.email ?? "")}</p>
      </Card>
      <Card className="space-y-4">
        <div className="space-y-2">
          <h2 className="font-semibold">Delete account</h2>
          <p className="text-sm text-muted">
            This permanently deletes your account, your recipes, and every meal and payment you logged, including
            shared meals, so your roommates&apos; balances will change. Households you created are handed to another
            member; if you are the only member, the household is deleted too. This can&apos;t be undone. See the{" "}
            <Link href="/privacy" className="text-accent">privacy policy</Link> for details.
          </p>
        </div>
        <DeleteAccountForm />
      </Card>
    </div>
  );
}
