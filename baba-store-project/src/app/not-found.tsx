import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 text-center">
      <ShieldCheck className="h-12 w-12 text-primary mb-4" />
      <h1 className="text-5xl font-bold text-black mb-2">404</h1>
      <p className="text-muted-foreground mb-6">
        The page you&apos;re looking for doesn&apos;t exist or you don&apos;t
        have access.
      </p>
      <Button asChild>
        <Link href="/dashboard">Go to Dashboard</Link>
      </Button>
    </div>
  );
}
