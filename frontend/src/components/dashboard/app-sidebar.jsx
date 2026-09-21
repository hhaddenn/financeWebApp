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
import { getUser } from '@/api/auth';
import { useState, useEffect } from 'react';
import { FeedbackDialog } from '@/components/FeedbackDialog';

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
	],
};

export function AppSidebar({ ...props }) {
	const [user, setUser] = useState([]);
	const [loading, setLoading] = useState(true);
	const [feedbackType, setFeedbackType] = useState(null);

	const loadUser = async () => {
		try {
			setLoading(true);

			const data = await getUser();

			setUser(data);
		} catch (error) {
			showError(error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadUser();
	}, []);

	return (
		<>
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
								onClick={() => setFeedbackType('bug')}>
								<BugIcon />
								<span>Report a bug</span>
							</SidebarMenuButton>
						</SidebarMenuItem>

						<SidebarMenuItem>
							<SidebarMenuButton
								tooltip="Suggestions"
								onClick={() => setFeedbackType('suggestion')}>
								<LightbulbIcon />
								<span>Suggestions</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>

					{/* User */}
					<NavUser
						user={{
							name: user.username,
							email: user.email,
							avatar: '',
						}}
					/>
				</SidebarFooter>
			</Sidebar>

			{/* Feedback Dialog */}
			{feedbackType && (
				<FeedbackDialog
					open={feedbackType !== null}
					onOpenChange={(open) => {
						if (!open) {
							setFeedbackType(null);
						}
					}}
					type={feedbackType}
				/>
			)}
		</>
	);
}
