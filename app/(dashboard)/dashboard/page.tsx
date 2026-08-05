"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { OverviewTab } from "@/components/dashboard/overview-tab";
import { ReportsTab } from "@/components/dashboard/reports-tab";
import { OfflineUnavailable } from "@/components/shared/offline-unavailable";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useT } from "@/lib/i18n/use-t";

type Section = "overview" | "reports";

export default function DashboardPage() {
  const { t } = useT();
  const [section, setSection] = useState<Section>("overview");
  const online = useOnlineStatus();

  if (!online) {
    return (
      <div className="flex flex-col gap-4">
        <OfflineUnavailable />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t("dashboard.page.title")}
        subtitle={section === "overview" ? t("dashboard.page.subtitle") : t("reports.page.subtitle")}
        amountScope={section === "overview" ? "dashboard" : "reports"}
      />

      <Tabs value={section} onValueChange={(v) => setSection(v as Section)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">{t("dashboard.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="reports">{t("dashboard.tabs.reports")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="reports">
          <ReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
