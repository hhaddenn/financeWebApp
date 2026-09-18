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

const chartConfig = {
	expenses: {
		label: 'Expenses',
	},
};

// Generate a different color for each category.
const getCategoryColor = (index, total) => {
	const hue = (index * 360) / total;

	return `hsl(${hue}, 70%, 50%)`;
};

export function ChartPieDonutText() {
	const [transactions, setTransactions] = React.useState([]);
	const [loading, setLoading] = React.useState(true);

	// Year and month we want to show.
	// Janeiro = 0.
	const selectedYear = 2026;
	const selectedMonth = 8;

	React.useEffect(() => {
		const loadTransactions = async () => {
			try {
				const data = await getTransactions();

				setTransactions(data);
			} catch (error) {
				console.error('Failed to load transactions:', error);
			} finally {
				setLoading(false);
			}
		};

		loadTransactions();
	}, []);

	const chartData = React.useMemo(() => {
		const categories = {};

		transactions.forEach((transaction) => {
			// Only Expenses
			if (transaction.transaction_type !== 'expense') {
				return;
			}

			const date = new Date(transaction.date);

			// Only the selected month
			if (
				date.getFullYear() !== selectedYear ||
				date.getMonth() !== selectedMonth
			) {
				return;
			}

			const categoryName = transaction.subcategory?.name || 'Other';

			const amount = Number(transaction.amount);

			if (!categories[categoryName]) {
				categories[categoryName] = 0;
			}

			categories[categoryName] += amount;
		});

		// Transform in array and order from higher to lower
		const entries = Object.entries(categories).sort(
			([, amountA], [, amountB]) => amountB - amountA,
		);

		const total = entries.length;

		return entries.map(([category, expenses], index) => ({
			category,
			expenses,
			fill: getCategoryColor(index, total),
		}));
	}, [transactions, selectedYear, selectedMonth]);

	const totalExpenses = React.useMemo(() => {
		return chartData.reduce((total, item) => total + item.expenses, 0);
	}, [chartData]);

	const monthName = new Date(selectedYear, selectedMonth).toLocaleDateString(
		'pt-PT',
		{
			month: 'long',
			year: 'numeric',
		},
	);

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Category expenses</CardTitle>

					<CardDescription>{monthName}</CardDescription>
				</CardHeader>

				<CardContent>
					<div className="flex h-62.5 items-center justify-center text-sm text-muted-foreground">
						Loading...
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="flex flex-col">
			<CardHeader className="items-center pb-0">
				<CardTitle>Category expenses</CardTitle>

				<CardDescription className="capitalize">{monthName}</CardDescription>
			</CardHeader>

			<CardContent className="flex-1 pb-0">
				{chartData.length === 0 ? (
					<div className="flex h-62.5 items-center justify-center text-sm text-muted-foreground">
						No expenses this month.
					</div>
				) : (
					<ChartContainer
						config={chartConfig}
						className="mx-auto aspect-square max-h-62.5">
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
														y={viewBox.cy}
														className="fill-foreground text-3xl font-bold">
														€
														{totalExpenses.toLocaleString('pt-PT', {
															minimumFractionDigits: 2,
															maximumFractionDigits: 2,
														})}
													</tspan>

													<tspan
														x={viewBox.cx}
														y={(viewBox.cy || 0) + 24}
														className="fill-muted-foreground">
														Expenses
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
									key={item.category}
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
										{item.expenses.toLocaleString('pt-PT', {
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
						Showing total spending this month by category
					</div>
				</CardFooter>
			)}
		</Card>
	);
}
