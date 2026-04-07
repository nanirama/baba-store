"use client";

import { useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { updatePasswordAction } from "@/lib/actions/password";
import { authCardClassName, authInputClassName, authPrimaryButtonClassName } from "@/components/auth/auth-classes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const updateSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Must contain uppercase, lowercase and a number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type UpdateInput = z.infer<typeof updateSchema>;

export function UpdatePasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("code") ?? "";

  const [isPending, startTransition] = useTransition();
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateInput>({ resolver: zodResolver(updateSchema) });

  if (!token) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <Image
              src="/images/logo.webp"
              alt="Baba.ge logo"
              width={180}
              height={56}
              priority
              className="h-14 w-auto"
            />
          </div>
          <Card className={authCardClassName}>
            <CardHeader>
              <CardTitle className="text-center text-xl font-semibold text-slate-900">Invalid link</CardTitle>
              <CardDescription className="text-center text-slate-500">
                This reset link is invalid or has expired.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>
                  Please{" "}
                  <Link href="/auth/reset-password" className="font-medium underline underline-offset-2">
                    request a new reset link
                  </Link>
                  .
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const onSubmit = (data: UpdateInput) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("password", data.password);
      formData.set("confirmPassword", data.confirmPassword);
      formData.set("token", token);

      const res = await updatePasswordAction(formData);
      setResult(res);

      if (res.success) {
        setTimeout(() => router.push("/auth/login"), 2500);
      }
    });
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Image
            src="/images/logo.webp"
            alt="Baba.ge logo"
            width={180}
            height={56}
            priority
            className="h-14 w-auto"
          />
        </div>

        <Card className={authCardClassName}>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-center text-xl font-semibold tracking-tight text-slate-900">
              Set new password
            </CardTitle>
            <CardDescription className="text-center text-slate-500">
              Choose a strong password for your account
            </CardDescription>
          </CardHeader>

          <CardContent>
            {result && (
              <Alert variant={result.success ? "success" : "destructive"} className="mb-4">
                <AlertDescription>
                  {result.message}
                  {result.success && (
                    <span className="mt-1 block text-xs opacity-75">Redirecting to sign in…</span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {!result?.success && (
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-slate-700">
                    New password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type={showPw ? "text" : "password"}
                      placeholder="Min. 8 chars, upper + lower + number"
                      autoComplete="new-password"
                      className={`pl-10 pr-10 ${authInputClassName}`}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-slate-700">
                    Confirm password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repeat your new password"
                      autoComplete="new-password"
                      className={`pl-10 pr-10 ${authInputClassName}`}
                      {...register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" className={authPrimaryButtonClassName} disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating password…
                    </>
                  ) : (
                    "Update password"
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex justify-center border-t border-slate-100 pt-4">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-slate-600 transition hover:text-[#ff5100]"
            >
              Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
