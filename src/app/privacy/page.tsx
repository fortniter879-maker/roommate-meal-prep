import type { Metadata } from "next";
import Link from "next/link";
import { Contact, LegalPage } from "@/components/legal";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <p>
        {SITE_NAME} is a small, free app for logging meals, recipes, costs and nutrition on your own or with
        roommates. This page explains what we store, who can see it, and how to delete it. The short version: we
        store only what you type in, we don&apos;t show ads, we don&apos;t sell or share your data, and you can
        delete everything at any time.
      </p>

      <h2>What we store</h2>
      <ul>
        <li>Your email address and display name, and a securely hashed password.</li>
        <li>What you log: meals, recipes, ingredients, costs, nutrition, households you create or join, and payments
          you record between roommates.</li>
        <li>A sign-in cookie that keeps you logged in. We don&apos;t use advertising or analytics cookies, and we
          don&apos;t track you across other sites.</li>
      </ul>
      <p>Our hosting providers keep standard technical logs (such as IP addresses and request times) for security and
        reliability.</p>

      <h2>Who can see your data</h2>
      <ul>
        <li>Personal meals and private recipes are visible only to you.</li>
        <li>When you join a household, its other members can see your display name, the shared meals and recipes in
          that household, who paid, each person&apos;s share, and the household balances. Anyone with a household&apos;s
          invite code can join it, so only share the code with people you trust.</li>
        <li>These rules are enforced in the database itself, not just in the app.</li>
      </ul>

      <h2>Services we use</h2>
      <ul>
        <li><strong>Supabase</strong> stores the database and handles sign-in and confirmation emails.</li>
        <li><strong>Vercel</strong> hosts the website.</li>
        <li><strong>USDA FoodData Central</strong> answers nutrition lookups. Only the food name you search for is
          sent, from our server, never your account details.</li>
      </ul>
      <p>These providers process data on our behalf and may store it outside your country, including in the United
        States.</p>

      <h2>How long we keep it</h2>
      <p>
        We keep your data while your account exists. You can delete your account from the{" "}
        <Link href="/account" className="text-accent">Account</Link> page. That permanently removes your profile,
        your recipes, and every meal and payment you logged or were part of, including shared ones, which changes
        your roommates&apos; balances. Households you created pass to another member, or are deleted if you were
        the only one. Backups held by our providers are overwritten on their normal schedule.
      </p>

      <h2>Your choices</h2>
      <p>
        You can view and edit everything you&apos;ve logged in the app, and delete it or your whole account at any
        time. To ask a question, get a copy of your data, or make a privacy request, contact <Contact />.
      </p>

      <h2>Children</h2>
      <p>{SITE_NAME} is not intended for children under 13, and we don&apos;t knowingly collect their data.</p>

      <h2>Changes</h2>
      <p>If we change this policy we&apos;ll update the date at the top, and for significant changes we&apos;ll let
        you know in the app or by email.</p>
    </LegalPage>
  );
}
