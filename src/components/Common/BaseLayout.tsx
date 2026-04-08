import { Suspense } from "react";

import { Footer } from "@/components/Common/Footer";
import { Header } from "@/components/Common/Header";

type BaseLayoutProps = {
  children?: React.ReactNode;
};

function FooterFallback() {
  return (
    <div
      className="mt-auto min-h-[280px] w-full shrink-0 bg-[#2d3748]"
      aria-busy="true"
      aria-label="Footer იტვირთება"
    />
  );
}

export function BaseLayout({ children }: BaseLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-muted/40">
      <Header />
      <main id="main-content" className="flex flex-1 flex-col outline-none" tabIndex={-1}>
        {children}
      </main>
      <Suspense fallback={<FooterFallback />}>
        <Footer />
      </Suspense>
    </div>
  );
}
