import type { ReactNode } from "react";
import { CONTACT_EMAIL, LEGAL_UPDATED } from "@/lib/site";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-2xl space-y-4 text-sm leading-relaxed [&_h2]:pt-4 [&_h2]:text-base [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted">Last updated {LEGAL_UPDATED}</p>
      {children}
    </article>
  );
}

export function Contact() {
  return CONTACT_EMAIL ? (
    <a className="text-accent" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
  ) : (
    <>the email address listed on this site</>
  );
}
