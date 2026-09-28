import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export const metadata: Metadata = {
  title: "Meal Prep Ledger",
  description: "Log meals, recipes, costs and nutrients on your own or with roommates, and split costs fairly.",
};

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/meals", label: "Meals" },
  { href: "/recipes", label: "Recipes" },
  { href: "/insights", label: "Insights" },
  { href: "/households", label: "Households" },
];

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-border bg-surface">
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
            <Link href={signedIn ? "/dashboard" : "/"} className="font-semibold">
              🥗 Meal Prep Ledger
            </Link>
            {signedIn ? (
              <>
                <div className="flex flex-wrap gap-4 text-sm">
                  {NAV.map((item) => (
                    <Link key={item.href} href={item.href} className="text-muted hover:text-foreground">
                      {item.label}
                    </Link>
                  ))}
                </div>
                <form action={signOut} className="ml-auto">
                  <button className="text-sm text-muted hover:text-foreground">Sign out</button>
                </form>
              </>
            ) : (
              <Link href="/login" className="ml-auto text-sm text-muted hover:text-foreground">
                Sign in
              </Link>
            )}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
