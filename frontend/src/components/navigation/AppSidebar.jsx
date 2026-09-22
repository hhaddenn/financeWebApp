import {
	LayoutDashboardIcon,
	ArrowLeftRightIcon,
	WalletIcon,
	BugIcon,
	LightbulbIcon,
} from 'lucide-react';

import { NavMain } from '@/components/navigation/NavMain';
import { NavUser } from '@/components/navigation/NavUser';

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';

import { getUser } from '@/features/auth/api';

import { useState, useEffect } from 'react';

import { FeedbackDialog } from '@/components/FeedbackDialog';

import { usePreferences } from '@/context/PreferencesContext';

export function AppSidebar({ ...props }) {
	const { t } = usePreferences();

	const [user, setUser] = useState([]);
	const [loading, setLoading] = useState(true);
	const [feedbackType, setFeedbackType] = useState(null);

	const data = {
		navMain: [
			{
				title: t('navigation.dashboard'),
				url: '/dashboard',
				icon: <LayoutDashboardIcon />,
			},
			{
				title: t('navigation.transactions'),
				url: '/transactions',
				icon: <ArrowLeftRightIcon />,
			},
		],
	};

	const loadUser = async () => {
		try {
			setLoading(true);

			const data = await getUser();
			setUser(data);
		} catch (error) {
			console.error('Failed to load user:', error);
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
								tooltip={t('feedback.reportBug')}
								onClick={() => setFeedbackType('bug')}>
								<BugIcon />

								<span>{t('feedback.reportBug')}</span>
							</SidebarMenuButton>
						</SidebarMenuItem>

						<SidebarMenuItem>
							<SidebarMenuButton
								tooltip={t('feedback.suggestions')}
								onClick={() => setFeedbackType('suggestion')}>
								<LightbulbIcon />

								<span>{t('feedback.suggestions')}</span>
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
