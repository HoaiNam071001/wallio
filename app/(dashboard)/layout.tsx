import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { QuickAddFab } from "@/components/layout/quick-add-fab";
import { Topbar } from "@/components/layout/topbar";
import { PinGate } from "@/components/auth/pin-gate";
import { PinReminderModal } from "@/components/auth/pin-reminder-modal";
import { NewTransactionModal } from "@/components/transactions/new-transaction-modal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PinGate>
      <div className="flex min-h-screen flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          {/* pb đủ lớn để nội dung không bị bottom nav + nút (+) nổi che — FAB nằm ở
              bottom-24 (mobile) / bottom-6 (desktop), cao 56px, nên padding phải vượt qua mép trên của nó. */}
          <main className="mx-auto w-full max-w-4xl flex-1 overflow-x-hidden p-4 pb-44 md:p-6 md:pb-28">
            {children}
          </main>
        </div>
        <BottomNav />
        <QuickAddFab />
      </div>
      <PinReminderModal />
      <NewTransactionModal />
    </PinGate>
  );
}
