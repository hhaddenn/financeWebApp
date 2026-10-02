import { useEffect, useState } from 'react';

import { usePreferences } from '@/context/PreferencesContext';

import AccountSecurity from '@/components/settings/AccountSecurity';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

import { AppSidebar } from '@/components/navigation/AppSidebar';

import { SiteHeader } from '@/components/navigation/SiteHeader';

import { iconMap } from '@/lib/icons';

import { Button } from '@/components/ui/button';

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { Switch } from '@/components/ui/switch';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';

import {
	getSettings,
	updateSettings,
	getCategoryPreferences,
	updateCategoryPreference,
	getSubcategoryPreferences,
	updateSubcategoryPreference,
} from '@/api/settings';

function CategoryIcon({ name, className }) {
	const Icon = iconMap[name];

	if (!Icon) {
		return null;
	}

	return <Icon className={className} />;
}

export default function Settings() {
	const {
		language,
		theme,
		setLanguage,
		setTheme,
		t,
		translateCategory,
		translateSubcategory,
	} = usePreferences();

	const [incomeColor, setIncomeColor] = useState('');
	const [expenseColor, setExpenseColor] = useState('');
	const [categories, setCategories] = useState([]);
	const [subcategories, setSubcategories] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		const loadSettings = async () => {
			try {
				setLoading(true);
				setError(null);

				const [settingsData, categoryPreferences, subcategoryPreferences] =
					await Promise.all([
						getSettings(),
						getCategoryPreferences(),
						getSubcategoryPreferences(),
					]);

				setIncomeColor(settingsData.income_color);
				setExpenseColor(settingsData.expense_color);
				setCategories(categoryPreferences);
				setSubcategories(subcategoryPreferences);
			} catch (error) {
				console.error('Failed to load settings:', error);
				console.error('Backend response:', error.response?.data);

				setError(t('settings.saveError'));
			} finally {
				setLoading(false);
			}
		};

		loadSettings();
	}, [t]);

	const updateCategory = (id, changes) => {
		setCategories((current) =>
			current.map((category) =>
				category.id === id ? { ...category, ...changes } : category,
			),
		);

		setSuccess(false);
	};

	const updateSubcategory = (id, changes) => {
		setSubcategories((current) =>
			current.map((subcategory) =>
				subcategory.id === id ? { ...subcategory, ...changes } : subcategory,
			),
		);

		setSuccess(false);
	};

	const handleSave = async () => {
		try {
			setSaving(true);
			setError(null);
			setSuccess(false);

			await updateSettings({
				income_color: incomeColor,
				expense_color: expenseColor,
			});

			await Promise.all([
				...categories.map((category) =>
					updateCategoryPreference(category.id, {
						color: category.color,
						hidden: category.hidden,
					}),
				),

				...subcategories.map((subcategory) =>
					updateSubcategoryPreference(subcategory.id, {
						hidden: subcategory.hidden,
					}),
				),
			]);

			setSuccess(true);
		} catch (error) {
			console.error('Failed to save settings:', error);
			console.error('Backend response:', error.response?.data);

			setError(t('settings.saveError'));
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<SidebarProvider>
				<AppSidebar />

				<SidebarInset className="min-h-svh bg-background">
					<SiteHeader
						title={t('settings.title')}
						description={t('settings.description')}
					/>

					<main className="min-h-[calc(100svh-3.5rem)] flex-1 bg-background">
						<div className="mx-auto w-full max-w-[1200px] p-4 md:p-6 lg:p-8">
							<Card>
								<CardContent className="flex items-center justify-center py-12">
									<p className="text-sm text-muted-foreground">
										{t('common.loading')}
									</p>
								</CardContent>
							</Card>
						</div>
					</main>
				</SidebarInset>
			</SidebarProvider>
		);
	}

	return (
		<SidebarProvider>
			<AppSidebar />

			<SidebarInset className="min-h-svh bg-background">
				<SiteHeader
					title={t('settings.title')}
					description={t('settings.description')}
				/>

				<main className="min-h-[calc(100svh-3.5rem)] flex-1 bg-background">
					<div className="mx-auto w-full max-w-[1200px] space-y-6 p-4 md:p-6 lg:p-8">
						{error && (
							<Alert variant="destructive">
								<AlertTitle>{t('common.error')}</AlertTitle>

								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						{success && (
							<Alert>
								<AlertTitle>{t('settings.saveSuccess')}</AlertTitle>

								<AlertDescription>{t('settings.saveSuccess')}</AlertDescription>
							</Alert>
						)}

						<Tabs defaultValue="general" className="space-y-6">
							<TabsList>
								<TabsTrigger value="general">
									{t('settings.general')}
								</TabsTrigger>

								<TabsTrigger value="categories">
									{t('settings.categories')}
								</TabsTrigger>

								<TabsTrigger value="subcategories">
									{t('settings.subcategories')}
								</TabsTrigger>

								<TabsTrigger value="account">
									{t('settings.account')}
								</TabsTrigger>
							</TabsList>

							{/* GENERAL */}

							<TabsContent value="general" className="space-y-6">
								{/* Language */}

								<Card>
									<CardHeader>
										<CardTitle>{t('settings.language')}</CardTitle>

										<CardDescription>
											{t('settings.languageDescription')}
										</CardDescription>
									</CardHeader>

									<CardContent>
										<div className="flex flex-wrap gap-3">
											<Button
												variant={language === 'pt' ? 'default' : 'outline'}
												onClick={() => setLanguage('pt')}>
												🇵🇹 Português
											</Button>

											<Button
												variant={language === 'en' ? 'default' : 'outline'}
												onClick={() => setLanguage('en')}>
												🇬🇧 English
											</Button>
										</div>
									</CardContent>
								</Card>

								{/* Appearance */}

								<Card>
									<CardHeader>
										<CardTitle>{t('settings.appearance')}</CardTitle>

										<CardDescription>
											{t('settings.appearanceDescription')}
										</CardDescription>
									</CardHeader>

									<CardContent>
										<div className="flex flex-wrap gap-3">
											<Button
												variant={theme === 'light' ? 'default' : 'outline'}
												onClick={() => setTheme('light')}>
												☀️ {t('settings.light')}
											</Button>

											<Button
												variant={theme === 'dark' ? 'default' : 'outline'}
												onClick={() => setTheme('dark')}>
												🌙 {t('settings.dark')}
											</Button>

											<Button
												variant={theme === 'system' ? 'default' : 'outline'}
												onClick={() => setTheme('system')}>
												💻 {t('settings.system')}
											</Button>
										</div>
									</CardContent>
								</Card>

								{/* Transaction colors */}

								<Card>
									<CardHeader>
										<CardTitle>{t('settings.transactionColors')}</CardTitle>

										<CardDescription>
											{t('settings.transactionColorsDescription')}
										</CardDescription>
									</CardHeader>

									<CardContent>
										<div className="grid gap-6 sm:grid-cols-2">
											{/* Income */}

											<div className="space-y-2">
												<Label htmlFor="income-color">
													{t('settings.incomeColor')}
												</Label>

												<div className="flex items-center gap-3">
													<Input
														id="income-color"
														type="color"
														value={incomeColor}
														onChange={(event) => {
															setIncomeColor(event.target.value);
															setSuccess(false);
														}}
														className="h-10 w-14 cursor-pointer p-1"
													/>

													<Input
														value={incomeColor}
														onChange={(event) => {
															setIncomeColor(event.target.value);
															setSuccess(false);
														}}
														className="font-mono"
													/>
												</div>
											</div>

											{/* Expense */}

											<div className="space-y-2">
												<Label htmlFor="expense-color">
													{t('settings.expenseColor')}
												</Label>

												<div className="flex items-center gap-3">
													<Input
														id="expense-color"
														type="color"
														value={expenseColor}
														onChange={(event) => {
															setExpenseColor(event.target.value);
															setSuccess(false);
														}}
														className="h-10 w-14 cursor-pointer p-1"
													/>

													<Input
														value={expenseColor}
														onChange={(event) => {
															setExpenseColor(event.target.value);
															setSuccess(false);
														}}
														className="font-mono"
													/>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="account">
								<AccountSecurity />
							</TabsContent>

							{/* CATEGORIES */}

							<TabsContent value="categories" className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle>{t('settings.categories')}</CardTitle>

										<CardDescription>
											{t('settings.categoryVisibility')}
										</CardDescription>
									</CardHeader>

									<CardContent>
										<div className="space-y-2">
											{categories.map((category) => (
												<div
													key={category.id}
													className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
													{/* Category information */}

													<div className="flex items-center gap-3">
														<div
															className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
															style={{
																backgroundColor: `${category.color}15`,
																color: category.color,
															}}>
															<CategoryIcon
																name={category.category.icon}
																className="h-5 w-5"
															/>
														</div>

														<div className="space-y-1">
															<p className="font-medium">
																{translateCategory(category.category.name)}
															</p>

															<p className="text-sm text-muted-foreground">
																{category.category.description ||
																	t('settings.categoryVisibility')}
															</p>
														</div>
													</div>

													{/* Category controls */}

													<div className="flex items-center gap-4">
														<Input
															type="color"
															value={category.color}
															onChange={(event) =>
																updateCategory(category.id, {
																	color: event.target.value,
																})
															}
															className="h-10 w-14 cursor-pointer p-1"
														/>

														<Switch
															checked={!category.hidden}
															onCheckedChange={(visible) =>
																updateCategory(category.id, {
																	hidden: !visible,
																})
															}
														/>

														<span className="w-16 text-sm text-muted-foreground">
															{category.hidden
																? t('common.hidden')
																: t('common.visible')}
														</span>
													</div>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							{/* SUBCATEGORIES */}

							<TabsContent value="subcategories" className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle>{t('settings.subcategories')}</CardTitle>

										<CardDescription>
											{t('settings.subcategoryVisibility')}
										</CardDescription>
									</CardHeader>

									<CardContent>
										<Accordion type="multiple" className="w-full">
											{categories.map((category) => {
												const categorySubcategories = subcategories.filter(
													(subcategory) =>
														subcategory.subcategory.category?.id ===
														category.category.id,
												);

												if (categorySubcategories.length === 0) {
													return null;
												}

												return (
													<AccordionItem
														key={category.id}
														value={`category-${category.id}`}>
														<AccordionTrigger className="hover:no-underline">
															<div className="flex items-center gap-3">
																<div
																	className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
																	style={{
																		backgroundColor: `${category.color}15`,
																		color: category.color,
																	}}>
																	<CategoryIcon
																		name={category.category.icon}
																		className="h-4 w-4"
																	/>
																</div>

																<span className="font-medium">
																	{translateCategory(category.category.name)}
																</span>

																<span className="text-sm text-muted-foreground">
																	({categorySubcategories.length})
																</span>
															</div>
														</AccordionTrigger>

														<AccordionContent>
															<div className="space-y-1">
																{categorySubcategories.map(
																	(subcategory, index) => {
																		const effectivelyHidden =
																			category.hidden || subcategory.hidden;

																		return (
																			<div key={subcategory.id}>
																				<div className="flex items-center justify-between gap-4 py-3 pl-6">
																					{/* Subcategory information */}

																					<div className="flex items-center gap-3">
																						<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
																							<CategoryIcon
																								name={
																									subcategory.subcategory.icon
																								}
																								className="h-4 w-4 text-muted-foreground"
																							/>
																						</div>

																						<div className="space-y-1">
																							<p className="text-sm font-medium">
																								{translateSubcategory(
																									subcategory.subcategory.name,
																								)}
																							</p>

																							{category.hidden && (
																								<p className="text-xs text-muted-foreground">
																									{t(
																										'settings.categoryVisibility',
																									)}
																								</p>
																							)}
																						</div>
																					</div>

																					{/* Subcategory controls */}

																					<div className="flex items-center gap-4">
																						<Switch
																							checked={!subcategory.hidden}
																							disabled={category.hidden}
																							onCheckedChange={(visible) =>
																								updateSubcategory(
																									subcategory.id,
																									{
																										hidden: !visible,
																									},
																								)
																							}
																						/>

																						<span className="w-16 text-sm text-muted-foreground">
																							{effectivelyHidden
																								? t('common.hidden')
																								: t('common.visible')}
																						</span>
																					</div>
																				</div>

																				{index <
																					categorySubcategories.length - 1 && (
																					<div className="border-b" />
																				)}
																			</div>
																		);
																	},
																)}
															</div>
														</AccordionContent>
													</AccordionItem>
												);
											})}
										</Accordion>
									</CardContent>
								</Card>
							</TabsContent>
						</Tabs>

						{/* Save */}

						<div className="flex justify-end">
							<Button onClick={handleSave} disabled={saving}>
								{saving ? t('settings.saving') : t('settings.saveChanges')}
							</Button>
						</div>
					</div>
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
