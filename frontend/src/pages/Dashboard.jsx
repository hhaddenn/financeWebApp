import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { SiteHeader } from '@/components/dashboard/site-header';
import { SectionCards } from '@/components/dashboard/section-cards';
import { ChartAreaInteractive } from '@/components/dashboard/chart-area-interactive';
import { DataTable } from '@/components/dashboard/data-table';
import { ChartPieDonutText } from '@/components/dashboard/chart-pie-donut-text';

const data = [
	{
		id: 1,
		header: 'Checking Account',
		type: 'Account',
		status: 'Active',
		target: '$2,500',
		limit: '$5,000',
		reviewer: 'Assign reviewer',
	},
	{
		id: 2,
		header: 'Savings Account',
		type: 'Account',
		status: 'Active',
		target: '$10,000',
		limit: '$20,000',
		reviewer: 'Eddie Lake',
	},
	{
		id: 3,
		header: 'Credit Card',
		type: 'Credit',
		status: 'Active',
		target: '$1,200',
		limit: '$3,000',
		reviewer: 'Emily Whalen',
	},
	{
		id: 4,
		header: 'Monthly Expenses',
		type: 'Expense',
		status: 'Done',
		target: '$1,500',
		limit: '$2,000',
		reviewer: 'Jamik Tashpulatov',
	},
	{
		id: 5,
		header: 'Groceries',
		type: 'Category',
		status: 'In Progress',
		target: '$400',
		limit: '$500',
		reviewer: 'Assign reviewer',
	},
];

export default function Dashboard() {
	return (
		<SidebarProvider>
			<AppSidebar />

			<SidebarInset>
				<SiteHeader />

				<main className="flex-1">
					<div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 md:p-6 lg:p-8">
						<SectionCards />
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
							<div className="lg:col-span-2">
								<ChartAreaInteractive />
							</div>

							<div className="lg:col-span-1">
								<ChartPieDonutText />
							</div>
						</div>
						<DataTable data={data} />
					</div>
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
