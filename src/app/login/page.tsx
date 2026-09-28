import { Card } from "@/components/ui";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const mode = params.mode === "signup" ? "signup" : "signin";
  const next = typeof params.next === "string" ? params.next : undefined;

  return (
    <div className="mx-auto max-w-sm">
      <Card>
        <h1 className="mb-4 text-xl font-semibold">{mode === "signup" ? "Create your account" : "Sign in"}</h1>
        {params.error === "confirm" && (
          <p className="mb-4 text-sm text-danger">That confirmation link is invalid or expired.</p>
        )}
        <LoginForm key={mode} mode={mode} next={next} />
      </Card>
    </div>
  );
}
