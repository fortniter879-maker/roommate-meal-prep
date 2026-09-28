import { Card, PageHeader } from "@/components/ui";
import { getMyHouseholds } from "@/lib/data";
import { requireUser } from "@/lib/supabase/server";
import type { Recipe } from "@/lib/types";
import { MealForm } from "../meal-form";

export default async function NewMealPage({ searchParams }: PageProps<"/meals/new">) {
  const params = await searchParams;
  const { supabase, userId } = await requireUser();
  const [households, { data: recipes }] = await Promise.all([
    getMyHouseholds(supabase),
    supabase.from("recipes").select("*").order("name"),
  ]);
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

  return (
    <div>
      <PageHeader title="Log a meal" />
      <Card>
        <MealForm
          userId={userId}
          households={households}
          recipes={(recipes ?? []) as Recipe[]}
          initialRecipeId={typeof params.recipe === "string" ? params.recipe : undefined}
          initialHouseholdId={typeof params.household === "string" ? params.household : undefined}
          today={today}
        />
      </Card>
    </div>
  );
}
