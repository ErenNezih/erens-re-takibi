import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="max-w-lg mx-auto px-4 py-4">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
