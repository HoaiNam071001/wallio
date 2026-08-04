import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { QuickAddFab } from "@/components/layout/quick-add-fab";
import { Topbar } from "@/components/layout/topbar";
import { PinGate } from "@/components/auth/pin-gate";
import { PinReminderModal } from "@/components/auth/pin-reminder-modal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PinGate>
      <div className="flex min-h-screen flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          {/* pb lớn trên mobile để nội dung không bị bottom nav + FAB che */}
          <main className="mx-auto w-full max-w-4xl flex-1 overflow-x-hidden p-4 pb-32 md:p-6 md:pb-10">
            {children}
          </main>
        </div>
        <BottomNav />
        <QuickAddFab />
      </div>
      <PinReminderModal />
    </PinGate>
  );
}
