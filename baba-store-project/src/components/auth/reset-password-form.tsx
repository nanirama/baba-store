"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { requestPasswordResetAction } from "@/lib/actions/password";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/utils/validation";
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

export function ResetPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = (data: ResetPasswordInput) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", data.email);
      const res = await requestPasswordResetAction(formData);
      setResult(res);
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
              Reset your password
            </CardTitle>
            <CardDescription className="text-center text-slate-500">
              Enter your email and we&apos;ll send you a reset link
            </CardDescription>
          </CardHeader>

          <CardContent>
            {result && (
              <Alert variant={result.success ? "success" : "destructive"} className="mb-4">
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}

            {!result?.success && (
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-slate-700">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={`pl-10 ${authInputClassName}`}
                      {...register("email")}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <Button type="submit" className={authPrimaryButtonClassName} disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending link…
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex justify-center border-t border-slate-100 pt-4">
            <Link
              href="/auth/login"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-[#ff5100]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
