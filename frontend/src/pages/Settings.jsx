import { useEffect, useState } from 'react';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { SiteHeader } from '@/components/dashboard/site-header';

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

	if (!Icon) return null;

	return <Icon className={className} />;
}

export default function Settings() {
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

				setError('Failed to load settings.');
			} finally {
				setLoading(false);
			}
		};

		loadSettings();
	}, []);

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

			setError('Failed to save settings.');
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<SidebarProvider>
				<AppSidebar />

				<SidebarInset>
					<SiteHeader
						title="Settings"
						description="Customize your finance preferences"
					/>

					<main className="flex-1">
						<div className="mx-auto w-full max-w-[1200px] p-4 md:p-6 lg:p-8">
							<Card>
								<CardContent className="flex items-center justify-center py-12">
									<p className="text-sm text-muted-foreground">
										Loading settings...
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

			<SidebarInset>
				<SiteHeader
					title="Settings"
					description="Customize your finance preferences"
				/>

				<main className="flex-1">
					<div className="mx-auto w-full max-w-[1200px] space-y-6 p-4 md:p-6 lg:p-8">
						{/* Header */}
						<div>
							<h2 className="text-2xl font-semibold tracking-tight">
								Settings
							</h2>

							<p className="text-sm text-muted-foreground">
								Manage how your finances are displayed and organized.
							</p>
						</div>

						{/* Messages */}
						{error && (
							<Alert variant="destructive">
								<AlertTitle>Error</AlertTitle>

								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						{success && (
							<Alert>
								<AlertTitle>Settings saved</AlertTitle>

								<AlertDescription>
									Your preferences have been updated successfully.
								</AlertDescription>
							</Alert>
						)}

						<Tabs defaultValue="general" className="space-y-6">
							<TabsList>
								<TabsTrigger value="general">General</TabsTrigger>

								<TabsTrigger value="categories">Categories</TabsTrigger>

								<TabsTrigger value="subcategories">Subcategories</TabsTrigger>
							</TabsList>

							{/* GENERAL */}
							<TabsContent value="general" className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle>Transaction colors</CardTitle>

										<CardDescription>
											Choose the colors used to represent income and expenses.
										</CardDescription>
									</CardHeader>

									<CardContent>
										<div className="grid gap-6 sm:grid-cols-2">
											{/* Income */}
											<div className="space-y-2">
												<Label htmlFor="income-color">Income color</Label>

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
												<Label htmlFor="expense-color">Expense color</Label>

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

							{/* CATEGORIES */}
							<TabsContent value="categories" className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle>Categories</CardTitle>

										<CardDescription>
											Customize category colors and choose which categories
											should be visible.
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
																{category.category.name}
															</p>

															<p className="text-sm text-muted-foreground">
																{category.category.description ||
																	'Customize this category.'}
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
															{category.hidden ? 'Hidden' : 'Visible'}
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
										<CardTitle>Subcategories</CardTitle>

										<CardDescription>
											Choose which subcategories should be visible. Open a
											category to manage its subcategories.
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
																{/* Category icon */}
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
																	{category.category.name}
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
																								{subcategory.subcategory.name}
																							</p>

																							{category.hidden && (
																								<p className="text-xs text-muted-foreground">
																									Hidden because its category is
																									hidden.
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
																								? 'Hidden'
																								: 'Visible'}
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
								{saving ? 'Saving...' : 'Save changes'}
							</Button>
						</div>
					</div>
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
