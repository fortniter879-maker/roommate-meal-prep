import type { Metadata } from "next";
import Link from "next/link";
import { Contact, LegalPage } from "@/components/legal";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use">
      <p>By creating an account or using {SITE_NAME}, you agree to these terms.</p>

      <h2>Using the app</h2>
      <ul>
        <li>You must be at least 13 years old.</li>
        <li>Keep your password safe. You&apos;re responsible for what happens in your account.</li>
        <li>Don&apos;t use the app to break the law, harass anyone, or try to access data that isn&apos;t yours or
          disrupt the service.</li>
        <li>What you log is yours. You let us store and display it so the app can work, as described in the{" "}
          <Link href="/privacy" className="text-accent">privacy policy</Link>.</li>
      </ul>

      <h2>Nutrition and cost figures</h2>
      <p>
        Nutrition values come from what you enter and from USDA FoodData Central, and cost splits are simple
        arithmetic on what you log. They are estimates for personal tracking, not medical, dietary or financial
        advice. Talk to a professional before making health decisions.
      </p>

      <h2>No warranty</h2>
      <p>
        {SITE_NAME} is a free project provided &quot;as is&quot;, without warranties of any kind. It may change, have
        downtime, or shut down, and we can&apos;t guarantee your data will never be lost, so keep your own records of
        anything important. To the extent the law allows, we aren&apos;t liable for any loss arising from using it.
      </p>

      <h2>Ending your account</h2>
      <p>
        You can delete your account at any time from the <Link href="/account" className="text-accent">Account</Link>{" "}
        page. We may suspend accounts that break these terms.
      </p>

      <h2>Changes and contact</h2>
      <p>We may update these terms and will change the date above when we do. Questions: <Contact />.</p>
    </LegalPage>
  );
}
