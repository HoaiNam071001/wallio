"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { OverviewTab } from "@/components/dashboard/overview-tab";
import { ReportsTab } from "@/components/dashboard/reports-tab";
import { useTranslation } from "@/lib/i18n/use-translation";

type Section = "overview" | "reports";

export default function DashboardPage() {
  const { t } = useTranslation();
  const [section, setSection] = useState<Section>("overview");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t.dashboard.page.title}
        subtitle={section === "overview" ? t.dashboard.page.subtitle : t.reports.page.subtitle}
        amountScope={section === "overview" ? "dashboard" : "reports"}
      />

      <Tabs value={section} onValueChange={(v) => setSection(v as Section)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">{t.dashboard.tabs.overview}</TabsTrigger>
          <TabsTrigger value="reports">{t.dashboard.tabs.reports}</TabsTrigger>
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
