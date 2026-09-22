'use client';

import { useEffect, useState } from 'react';

import { TrendingUp } from 'lucide-react';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

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
import { getSettings } from '@/api/settings';

const months = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
];

export function ChartBarMultiple() {
	const [chartData, setChartData] = useState(
		months.map((month) => ({
			month,
			expense: 0,
			income: 0,
		})),
	);

	const [incomeColor, setIncomeColor] = useState('#22c55e');
	const [expenseColor, setExpenseColor] = useState('#ef4444');

	const [loading, setLoading] = useState(true);

	const currentYear = new Date().getFullYear();

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);

				const [transactions, settings] = await Promise.all([
					getTransactions(),
					getSettings(),
				]);

				setIncomeColor(settings.income_color);
				setExpenseColor(settings.expense_color);

				const monthlyData = months.map((month) => ({
					month,
					expense: 0,
					income: 0,
				}));

				transactions.forEach((transaction) => {
					const date = new Date(transaction.date);

					// Only process transactions from the current year
					if (date.getFullYear() !== currentYear) {
						return;
					}

					const monthIndex = date.getMonth();
					const amount = Number(transaction.amount);

					if (transaction.transaction_type === 'expense') {
						monthlyData[monthIndex].expense += amount;
					}

					if (transaction.transaction_type === 'income') {
						monthlyData[monthIndex].income += amount;
					}
				});

				setChartData(monthlyData);
			} catch (error) {
				console.error('Failed to fetch dashboard data:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [currentYear]);

	const chartConfig = {
		expense: {
			label: 'Expense',
			color: expenseColor,
		},
		income: {
			label: 'Income',
			color: incomeColor,
		},
	};

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Balance</CardTitle>

					<CardDescription>January - December {currentYear}</CardDescription>
				</CardHeader>

				<CardContent>
					<div className="flex h-75 items-center justify-center text-sm text-muted-foreground">
						Loading...
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Balance</CardTitle>

				<CardDescription>January - December {currentYear}</CardDescription>
			</CardHeader>

			<CardContent>
				<ChartContainer config={chartConfig}>
					<BarChart accessibilityLayer data={chartData}>
						<CartesianGrid vertical={false} />

						<YAxis
							tickLine={false}
							axisLine={false}
							tickMargin={10}
							tickFormatter={(value) => `€${value}`}
						/>

						<XAxis
							dataKey="month"
							tickLine={false}
							tickMargin={10}
							axisLine={false}
							tickFormatter={(value) => value.slice(0, 3)}
						/>

						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent indicator="dashed" />}
						/>

						<Bar dataKey="expense" fill="var(--color-expense)" radius={4} />

						<Bar dataKey="income" fill="var(--color-income)" radius={4} />
					</BarChart>
				</ChartContainer>
			</CardContent>

			<CardFooter className="flex-col items-start gap-2 text-sm">
				<div className="flex gap-2 leading-none font-medium">
					Income and expenses for {currentYear}
					<TrendingUp className="h-4 w-4" />
				</div>

				<div className="leading-none text-muted-foreground">
					Showing monthly transaction totals
				</div>
			</CardFooter>
		</Card>
	);
}
