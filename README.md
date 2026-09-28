# Meal Prep Ledger

Log meals, recipes, costs and nutrients on your own or with roommates, and split shared costs.

- **Accounts**: email and password sign-up (Supabase Auth).
- **Households**: create one, share its invite code, roommates join with the code.
- **Recipes**: servings, total cost, per-serving calories, protein, carbs, fat and fiber; private or shared with a household.
- **Meals**: log personally or for a household, optionally from a recipe (cost and nutrition fill in and scale with servings).
- **Cost splitting**: a shared meal is split evenly between whoever ate; running balances and "settle up" payments per household.
- **Nutrition lookup**: search USDA FoodData Central, add ingredients by weight, and fill a recipe's per-serving
  nutrition (or a meal's totals) automatically.
- **Dashboard**: your share of spending, calories and protein over 7 and 30 days.
- **Insights**: charts of spending and calories per day, where calories come from, best-value meals, and for a
  household each person's share, what they paid and what they ate, over 7, 30 or 90 days.

Stack: Next.js 16 (App Router, server actions), Tailwind CSS 4, Supabase (Postgres with row level security, Auth).

## Setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the Supabase SQL editor, run each file in `supabase/migrations/` in order
   (or `npx supabase link` then `npx supabase db push`).
3. In Supabase, under Authentication > URL Configuration, set the Site URL to your site and add
   `http://localhost:3000/**` and your production URL `/**` to the redirect URLs.
4. Copy `.env.example` to `.env.local` and fill in the project URL and publishable (anon) key from
   Project Settings > API. Optionally add a free `USDA_API_KEY` from
   [fdc.nal.usda.gov/api-key-signup](https://fdc.nal.usda.gov/api-key-signup); without one the shared `DEMO_KEY`
   is used, which only allows a few dozen food searches per hour.
5. Run it:

   ```bash
   npm install
   npm run dev
   ```

Run the unit tests with `npm test`.

## Deploying

1. Import the repository into [Vercel](https://vercel.com/new); it detects Next.js automatically.
2. Add the environment variables from `.env.example`, with `NEXT_PUBLIC_SITE_URL` set to the production URL
   (for example `https://your-app.vercel.app`, or your custom domain).
3. In Supabase, set Authentication > URL Configuration > Site URL to the production URL and add
   `<production URL>/**` to the redirect URLs.
4. For a custom domain, add it under the Vercel project's Settings > Domains, then update
   `NEXT_PUBLIC_SITE_URL` and the Supabase URLs to match and redeploy.

Users can read the privacy policy at `/privacy` and the terms at `/terms`, and delete their account and data
from `/account`.

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
