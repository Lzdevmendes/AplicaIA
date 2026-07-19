import { Rail } from "@/components/ui/rail";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Rail />
      <main className="vp-scroll flex-1 min-w-0 h-screen overflow-y-auto pb-[72px] md:pb-0">
        {children}
      </main>
    </div>
  );
}
