'use client';

import * as React from 'react';

import { Pie, PieChart, Label } from 'recharts';

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart';

import { getTransactions } from '@/api/transactions';
import { getCategoryPreferences } from '@/api/settings';
import { usePreferences } from '@/context/PreferencesContext';

const chartConfig = {
	expenses: {
		label: 'Expenses',
	},
};

export function ChartPieDonutText() {
	const { language, t, translateCategory } = usePreferences();

	const [transactions, setTransactions] = React.useState([]);
	const [categoryPreferences, setCategoryPreferences] = React.useState([]);
	const [loading, setLoading] = React.useState(true);

	// Janeiro = 0
	const selectedYear = 2026;
	const selectedMonth = 8;

	const locale = language === 'pt' ? 'pt-PT' : 'en-US';

	React.useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true);

				const [transactionsResponse, categoryPreferencesData] =
					await Promise.all([getTransactions(), getCategoryPreferences()]);

				const transactionsData =
					transactionsResponse.results ?? transactionsResponse;

				setTransactions(transactionsData);
				setCategoryPreferences(categoryPreferencesData);
			} catch (error) {
				console.error('Failed to load chart data:', error);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, []);

	const categoryPreferencesMap = React.useMemo(() => {
		return categoryPreferences.reduce((map, preference) => {
			map[preference.category.id] = preference;
			return map;
		}, {});
	}, [categoryPreferences]);

	const chartData = React.useMemo(() => {
		const categories = {};

		transactions.forEach((transaction) => {
			// Apenas despesas
			if (transaction.transaction_type !== 'expense') {
				return;
			}

			const date = new Date(transaction.date);

			// Apenas o mês selecionado
			if (
				date.getFullYear() !== selectedYear ||
				date.getMonth() !== selectedMonth
			) {
				return;
			}

			const category = transaction.subcategory?.category;

			if (!category) {
				return;
			}

			const preference = categoryPreferencesMap[category.id];

			// Categoria escondida nas definições
			if (preference?.hidden) {
				return;
			}

			const amount = Number(transaction.amount);

			if (!categories[category.id]) {
				categories[category.id] = {
					categoryId: category.id,

					// Nome original para referência
					categoryName: category.name,

					// Nome traduzido apenas para apresentação
					category: translateCategory(category.name),

					expenses: 0,

					fill: preference?.color || '#64748b',
				};
			}

			categories[category.id].expenses += amount;
		});

		// Maior para menor
		return Object.values(categories).sort(
			(itemA, itemB) => itemB.expenses - itemA.expenses,
		);
	}, [
		transactions,
		categoryPreferencesMap,
		selectedYear,
		selectedMonth,
		translateCategory,
	]);

	const totalExpenses = React.useMemo(() => {
		return chartData.reduce((total, item) => total + item.expenses, 0);
	}, [chartData]);

	const monthName = new Date(selectedYear, selectedMonth).toLocaleDateString(
		locale,
		{
			month: 'long',
			year: 'numeric',
		},
	);

	const formattedTotal = totalExpenses.toLocaleString(locale, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{t('dashboard.categoryExpenses')}</CardTitle>

					<CardDescription>{monthName}</CardDescription>
				</CardHeader>

				<CardContent>
					<div className="flex h-62.5 items-center justify-center text-sm text-muted-foreground">
						{t('common.loading')}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="flex flex-col">
			<CardHeader className="items-center pb-0">
				<CardTitle>{t('dashboard.categoryExpenses')}</CardTitle>

				<CardDescription className="capitalize">{monthName}</CardDescription>
			</CardHeader>

			<CardContent className="flex-1 pb-0">
				{chartData.length === 0 ? (
					<div className="flex h-62.5 items-center justify-center text-sm text-muted-foreground">
						{t('dashboard.noExpensesThisMonth')}
					</div>
				) : (
					<ChartContainer
						config={chartConfig}
						className="mx-auto w-full max-w-70 aspect-square">
						<PieChart>
							<ChartTooltip
								cursor={false}
								content={<ChartTooltipContent hideLabel />}
							/>

							<Pie
								data={chartData}
								dataKey="expenses"
								nameKey="category"
								innerRadius={60}
								strokeWidth={5}>
								<Label
									content={({ viewBox }) => {
										if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
											return (
												<text
													x={viewBox.cx}
													y={viewBox.cy}
													textAnchor="middle"
													dominantBaseline="middle">
													<tspan
														x={viewBox.cx}
														y={viewBox.cy - 4}
														className="fill-foreground text-2xl font-bold">
														€{formattedTotal}
													</tspan>

													<tspan
														x={viewBox.cx}
														y={(viewBox.cy || 0) + 20}
														className="fill-muted-foreground text-[11px]">
														{t('dashboard.expenses')}
													</tspan>
												</text>
											);
										}

										return null;
									}}
								/>
							</Pie>
						</PieChart>
					</ChartContainer>
				)}
			</CardContent>

			{chartData.length > 0 && (
				<CardFooter className="flex flex-col gap-3">
					<div className="grid w-full grid-cols-2 gap-3">
						{chartData.map((item) => {
							const percentage =
								totalExpenses > 0
									? ((item.expenses / totalExpenses) * 100).toFixed(0)
									: 0;

							return (
								<div
									key={item.categoryId}
									className="flex items-center justify-between gap-2">
									<div className="flex min-w-0 items-center gap-2">
										<div
											className="h-3 w-3 shrink-0 rounded-sm"
											style={{
												backgroundColor: item.fill,
											}}
										/>

										<span className="truncate text-sm capitalize">
											{item.category}
										</span>
									</div>

									<div className="shrink-0 text-sm text-muted-foreground">
										€
										{item.expenses.toLocaleString(locale, {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}{' '}
										({percentage}%)
									</div>
								</div>
							);
						})}
					</div>

					<div className="text-xs text-muted-foreground">
						{t('dashboard.monthlyCategoryTotals')}
					</div>
				</CardFooter>
			)}
		</Card>
	);
}
