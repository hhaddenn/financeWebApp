import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/AppSidebar';
import { SiteHeader } from '@/components/navigation/SiteHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getNews, markNewsAsRead } from '@/api/news';
import { usePreferences } from '@/context/PreferencesContext';

export default function News() {
	const { t, language } = usePreferences();
	const navigate = useNavigate();
	const [news, setNews] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		const loadNews = async () => {
			try {
				setNews(await getNews());
			} catch (loadError) {
				console.error('Failed to load news:', loadError);
				setError(true);
			} finally {
				setLoading(false);
			}
		};

		loadNews();
	}, []);

	const openNews = async (item) => {
		if (item.is_read) {
			navigate(`/news/${item.id}`);
			return;
		}

		try {
			await markNewsAsRead(item.id);
			window.dispatchEvent(new Event('news-read'));
			navigate(`/news/${item.id}`);
		} catch (markError) {
			console.error('Failed to mark news as read:', markError);
		}
	};

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset className="min-h-svh bg-background">
				<SiteHeader
					title={t('news.title')}
					description={t('news.description')}
				/>
				<main className="min-h-[calc(100svh-3.5rem)] flex-1 bg-background">
					<div className="mx-auto w-full max-w-[900px] space-y-6 p-4 md:p-6 lg:p-8">
						{error && (
							<Alert variant="destructive">
								<AlertTitle>{t('common.error')}</AlertTitle>
								<AlertDescription>{t('news.loadError')}</AlertDescription>
							</Alert>
						)}

						{loading ? (
							<Card><CardContent className="py-12 text-center text-sm text-muted-foreground">{t('common.loading')}</CardContent></Card>
						) : news.length === 0 ? (
							<Card><CardContent className="py-12 text-center text-sm text-muted-foreground">{t('news.empty')}</CardContent></Card>
						) : (
							<div className="space-y-4">
								{news.map((item) => (
									<Card key={item.id} className={item.is_read ? 'opacity-75' : 'ring-primary/30'}>
										{item.image_url && (
											<img
												src={item.image_url}
												alt=""
												className="h-28 w-full object-cover sm:h-36"
											/>
										)}
										<CardHeader>
											<div className="flex items-start justify-between gap-4">
												<div>
													<CardTitle>{item.title}</CardTitle>
													<CardDescription>
														{new Date(item.created_at).toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US')}
													</CardDescription>
												</div>
												{!item.is_read && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label={t('news.unread')} />}
											</div>
										</CardHeader>
										<CardContent className="whitespace-pre-line text-muted-foreground">
											{item.description.length > 240
												? `${item.description.slice(0, 240).trimEnd()}...`
												: item.description}
											<div className="mt-3">
												<Button variant="link" className="h-auto px-0 hover:cursor-pointer" onClick={() => openNews(item)}>
													{t('news.readMore')}
												</Button>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						)}
					</div>
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}