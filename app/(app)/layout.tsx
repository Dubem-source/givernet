import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import Header from "@/components/Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-grain">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <main className="px-5 md:px-10 py-8 md:py-10 pb-24 md:pb-10 max-w-6xl mx-auto">
          <Header />
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
