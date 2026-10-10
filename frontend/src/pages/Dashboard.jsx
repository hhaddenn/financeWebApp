import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/navigation/AppSidebar";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { SectionCards } from "@/components/dashboard/section-cards";
import { ChartBarMultiple } from "@/components/dashboard/chart-area-interactive";
import { DataTable } from "@/components/dashboard/data-table";
import { ChartPieDonutText } from "@/components/dashboard/chart-pie-donut-text";
import { TransactionActionMenu } from "@/components/transactions/TransactionActionMenu";

import { usePreferences } from "@/context/PreferencesContext";

export default function Dashboard() {
    const { t } = usePreferences();

    return (
        <SidebarProvider>
            <AppSidebar />

            <SidebarInset>
                <SiteHeader
                    title={t("navigation.dashboard")}
                    description={t("dashboard.description")}
                />

                <main className="flex-1">
                    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 md:p-6 lg:p-8">
                        <TransactionActionMenu variant="responsive" />

                        <SectionCards />

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-2">
                                <ChartBarMultiple />
                            </div>

                            <div className="lg:col-span-1">
                                <ChartPieDonutText />
                            </div>
                        </div>

                        <DataTable />
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
