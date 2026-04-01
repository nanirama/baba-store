import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign In | Baba.ge",
  description: "Sign in to your Baba.ge account",
};

// Do NOT cache auth pages
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#ff5100]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
