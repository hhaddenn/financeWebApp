import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';

import { getNewsById, markNewsAsRead } from '@/api/news';
import { AppSidebar } from '@/components/navigation/AppSidebar';
import { SiteHeader } from '@/components/navigation/SiteHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { usePreferences } from '@/context/PreferencesContext';

export default function NewsDetail() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { t, language } = usePreferences();
	const [news, setNews] = useState(null);
	const [loading, setLoading] = useState(true);
	const [imageExpanded, setImageExpanded] = useState(false);

	useEffect(() => {
		const loadNews = async () => {
			try {
				const item = await getNewsById(id);
				setNews(item);
				if (!item.is_read) {
					await markNewsAsRead(item.id);
					window.dispatchEvent(new Event('news-read'));
				}
			} catch (error) {
				console.error('Failed to load news detail:', error);
			} finally {
				setLoading(false);
			}
		};

		loadNews();
	}, [id]);

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset className="min-h-svh bg-background">
				<SiteHeader title={t('news.title')} description={t('news.description')} />
				<main className="min-h-[calc(100svh-3.5rem)] flex-1 bg-background">
					<div className="mx-auto w-full max-w-[900px] space-y-6 p-4 md:p-6 lg:p-8">
						<Button variant="ghost" onClick={() => navigate('/news')}>
							<ArrowLeftIcon />
							{t('news.backToNews')}
						</Button>

						{loading ? (
							<Card><CardContent className="py-12 text-center text-sm text-muted-foreground">{t('common.loading')}</CardContent></Card>
						) : news ? (
							<Card>
												{news.image_url && (
									<button
										type="button"
										className="block w-full cursor-zoom-in bg-muted"
										aria-label={t('news.expandImage')}
										onClick={() => setImageExpanded(true)}>
										<img
											src={news.image_url}
										alt={news.title}
										className="max-h-[560px] w-full object-contain"
										/>
									</button>
												)}
								<CardHeader>
									<CardTitle className="text-xl">{news.title}</CardTitle>
									<CardDescription>
										{new Date(news.created_at).toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US')}
									</CardDescription>
								</CardHeader>
								<CardContent className="whitespace-pre-line leading-7 text-muted-foreground">
									{news.description}
									{news.action_url && news.action_label && (
										<div className="mt-6">
											<Button onClick={() => navigate(news.action_url)}>
												{news.action_label}
											</Button>
										</div>
									)}
								</CardContent>
							</Card>
						) : null}
					</div>
				</main>
			</SidebarInset>

			<Dialog open={imageExpanded} onOpenChange={setImageExpanded}>
				<DialogContent className="max-w-[95vw] border-0 bg-background/95 p-2 sm:max-w-[95vw]">
					<img
						src={news?.image_url}
						alt={news?.title ?? ''}
						className="max-h-[90vh] w-full object-contain"
					/>
				</DialogContent>
			</Dialog>
		</SidebarProvider>
	);
}