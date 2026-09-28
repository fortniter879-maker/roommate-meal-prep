"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, ErrorNote, Field, Input } from "@/components/ui";
import { signIn, signUp } from "./actions";

export function LoginForm({ mode, next }: { mode: "signin" | "signup"; next?: string }) {
  const [state, action, pending] = useActionState(mode === "signup" ? signUp : signIn, undefined);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      {mode === "signup" && (
        <Field label="Your name" hint="Shown to your roommates.">
          <Input name="display_name" required maxLength={60} autoComplete="name" />
        </Field>
      )}
      <Field label="Email">
        <Input name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="Password">
        <Input
          name="password"
          type="password"
          required
          minLength={mode === "signup" ? 8 : undefined}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
      </Field>
      <ErrorNote message={state?.error} />
      {state?.message && <p className="text-sm text-accent">{state.message}</p>}
      <Button className="w-full" disabled={pending}>
        {pending ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted">
        {mode === "signup" ? (
          <>Already have an account? <Link className="text-accent" href="/login">Sign in</Link></>
        ) : (
          <>New here? <Link className="text-accent" href="/login?mode=signup">Create an account</Link></>
        )}
      </p>
    </form>
  );
}
