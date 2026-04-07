import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authCardClassName } from "@/components/auth/auth-classes";

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to access this resource.",
  Verification: "The verification link may have expired or already been used.",
  Default: "An authentication error occurred. Please try again.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorParam } = await searchParams;
  const error = errorParam ?? "Default";
  const message = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default;

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-6">
      <Card className={`w-full max-w-md ${authCardClassName}`}>
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-50 p-3 ring-1 ring-inset ring-red-100">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">Authentication error</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-slate-600">{message}</p>
          {error !== "Default" && (
            <p className="mt-2 rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
              Error code: {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t border-slate-100 pt-4">
          <Button asChild className="bg-[#ff5100] font-medium text-white shadow-sm hover:bg-[#ff5100]/90">
            <Link href="/auth/login">Back to sign in</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
