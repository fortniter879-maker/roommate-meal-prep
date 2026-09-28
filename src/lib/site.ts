export const SITE_NAME = "Meal Prep Ledger";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Shown on the privacy and terms pages. Set NEXT_PUBLIC_CONTACT_EMAIL in production.
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";

export const LEGAL_UPDATED = "September 28, 2026";
