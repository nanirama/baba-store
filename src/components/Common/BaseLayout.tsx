import { Footer } from "@/components/Common/Footer";
import { Header } from "@/components/Common/Header";

type BaseLayoutProps = {
  children: React.ReactNode;
};

export async function BaseLayout({ children }: BaseLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-muted/40">
      <Header />
      <main id="main-content" className="flex flex-1 flex-col outline-none" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
