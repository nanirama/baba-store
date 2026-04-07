import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { UpdatePasswordForm } from "./_update-form";

export const metadata = {
  title: "Update Password | Baba.ge",
};

export const dynamic = "force-dynamic";

export default function UpdatePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#ff5100]" />
        </div>
      }
    >
      <UpdatePasswordForm />
    </Suspense>
  );
}
