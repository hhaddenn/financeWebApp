import {
	LayoutDashboardIcon,
	ArrowLeftRightIcon,
	WalletIcon,
	Settings2Icon,
	BugIcon,
	LightbulbIcon,
} from 'lucide-react';

import { NavMain } from '@/components/dashboard/nav-main';
import { NavUser } from '@/components/dashboard/nav-user';

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';

const data = {
	navMain: [
		{
			title: 'Dashboard',
			url: '/dashboard',
			icon: <LayoutDashboardIcon />,
		},
		{
			title: 'Transactions',
			url: '/transactions',
			icon: <ArrowLeftRightIcon />,
		},
		{
			title: 'Budgets',
			url: '/budgets',
			icon: <WalletIcon />,
		},
		{
			title: 'Settings',
			url: '/settings',
			icon: <Settings2Icon />,
		},
	],
};

export function AppSidebar({ ...props }) {
	return (
		<Sidebar collapsible="offcanvas" className="bg-background" {...props}>
			<SidebarHeader className="bg-background p-4">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							className="h-10 px-2"
							render={<a href="/dashboard" />}>
							<WalletIcon className="size-5" />
							<span className="text-base font-semibold">FinanceApp</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent className="bg-background">
				<NavMain items={data.navMain} />
			</SidebarContent>

			<SidebarFooter className="bg-background p-4">
				{/* Feedback / Support */}
				<SidebarMenu className="mb-2">
					<SidebarMenuItem>
						<SidebarMenuButton
							tooltip="Report a bug"
							render={<a href="/report-bug" />}>
							<BugIcon />
							<span>Report a bug</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton
							tooltip="Suggestions"
							render={<a href="/suggestions" />}>
							<LightbulbIcon />
							<span>Suggestions</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>

				{/* User */}
				<NavUser
					user={{
						name: 'Username',
						email: 'usermail@mail.com',
						avatar: '',
					}}
				/>
			</SidebarFooter>
		</Sidebar>
	);
}
