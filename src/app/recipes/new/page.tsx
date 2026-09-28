import { Card, PageHeader } from "@/components/ui";
import { getMyHouseholds } from "@/lib/data";
import { requireUser } from "@/lib/supabase/server";
import { RecipeForm } from "../recipe-form";

export default async function NewRecipePage() {
  const { supabase } = await requireUser();
  const households = await getMyHouseholds(supabase);
  return (
    <div>
      <PageHeader title="New recipe" />
      <Card>
        <RecipeForm households={households} />
      </Card>
    </div>
  );
}
