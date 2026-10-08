import {
	LayoutDashboardIcon,
	ArrowLeftRightIcon,
	WalletIcon,
	BugIcon,
	LightbulbIcon,
	NewspaperIcon,
	Repeat2Icon,
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
import { useNavigate } from 'react-router-dom';
import { FeedbackDialog } from '@/components/FeedbackDialog';
import { usePreferences } from '@/context/PreferencesContext';
import { getNews } from '@/api/news';

export function AppSidebar({ ...props }) {
	const { t } = usePreferences();
	const navigate = useNavigate();
	const [user, setUser] = useState([]);
	const [feedbackType, setFeedbackType] = useState(null);
	const [unreadNewsCount, setUnreadNewsCount] = useState(0);

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
			{
				title: t('navigation.recurringTransactions'),
				url: '/recurring-transactions',
				icon: <Repeat2Icon />,
			},
		],
	};

	useEffect(() => {
		const loadUser = async () => {
			try {
				setUser(await getUser());
			} catch (error) {
				console.error('Failed to load user:', error);
			}
		};

		loadUser();
		getNews()
			.then((news) => setUnreadNewsCount(news.filter((item) => !item.is_read).length))
			.catch((error) => console.error('Failed to load news count:', error));

		const handleNewsRead = () => setUnreadNewsCount((count) => Math.max(0, count - 1));
		window.addEventListener('news-read', handleNewsRead);

		return () => window.removeEventListener('news-read', handleNewsRead);
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

					<SidebarMenu className="mb-2">
						<SidebarMenuItem>
							<SidebarMenuButton
								tooltip={t('navigation.news')}
								onClick={() => navigate('/news')}>
								<NewspaperIcon />
								<span>{t('navigation.news')}</span>
								{unreadNewsCount > 0 && (
									<span className="ml-auto flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
										{unreadNewsCount}
									</span>
								)}
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>

					<NavUser
						user={{
							name: user.username,
							email: user.email,
							avatar: '',
						}}
					/>
				</SidebarFooter>
			</Sidebar>

			{feedbackType && (
				<FeedbackDialog
					open={feedbackType !== null}
					onOpenChange={(open) => {
						if (!open) setFeedbackType(null);
					}}
					type={feedbackType}
				/>
			)}
		</>
	);
}
