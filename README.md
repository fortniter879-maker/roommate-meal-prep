# Meal Prep Ledger

Log meals, recipes, costs and nutrients on your own or with roommates, and split shared costs.

- **Accounts**: email and password sign-up (Supabase Auth).
- **Households**: create one, share its invite code, roommates join with the code.
- **Recipes**: servings, total cost, per-serving calories, protein, carbs, fat and fiber; private or shared with a household.
- **Meals**: log personally or for a household, optionally from a recipe (cost and nutrition fill in and scale with servings).
- **Cost splitting**: a shared meal is split evenly between whoever ate; running balances and "settle up" payments per household.
- **Dashboard**: your share of spending, calories and protein over 7 and 30 days.

Stack: Next.js 16 (App Router, server actions), Tailwind CSS 4, Supabase (Postgres with row level security, Auth).

## Setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the Supabase SQL editor, run `supabase/migrations/20260928000000_init.sql`
   (or `npx supabase link` then `npx supabase db push`).
3. In Supabase, under Authentication > URL Configuration, set the Site URL to your site and add
   `http://localhost:3000/**` and your production URL `/**` to the redirect URLs.
4. Copy `.env.example` to `.env.local` and fill in the project URL and publishable (anon) key from
   Project Settings > API.
5. Run it:

   ```bash
   npm install
   npm run dev
   ```

## Data model

| Table | Purpose |
| --- | --- |
| `profiles` | Display name per user, created automatically on sign-up |
| `households`, `household_members` | Shared groups; the creator becomes owner, others join via `join_household(code)` |
| `recipes` | Per-serving nutrition and total cost; `household_id` null means private |
| `meals` | Totals for one meal; `household_id` null means personal |
| `meal_shares` | Each eater's share of a meal's cost (personal meals have one share) |
| `settlements` | Payments between roommates |
| `household_balances` (view) | Paid minus owed, adjusted for settlements; positive means the member is owed |

Money is stored in integer cents. All access is enforced with row level security: you can see your own data
plus anything in households you belong to.
