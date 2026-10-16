"use client";

import * as React from "react";

import { Pie, PieChart, Label } from "recharts";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

import { getCategoryPreferences } from "@/api/settings";
import { getDashboardCategorySummary } from "@/api/dashboard";
import { usePreferences } from "@/context/PreferencesContext";

const chartConfig = {
	total: {
		label: "Total",
	},
};

export function ChartPieDonutText() {
	const { language, t, translateCategory } = usePreferences();

	const [categoryPreferences, setCategoryPreferences] = React.useState([]);
	const [loading, setLoading] = React.useState(true);
	const [transactionType, setTransactionType] = React.useState("expense");
	const [period, setPeriod] = React.useState("month");
	const [categoryTotals, setCategoryTotals] = React.useState([]);

	const currentDate = new Date();

	const selectedYear = currentDate.getFullYear();
	const selectedMonth = currentDate.getMonth();

	const locale = language === "pt" ? "pt-PT" : "en-US";

	React.useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true);

				const [summary, categoryPreferencesData] = await Promise.all([
					getDashboardCategorySummary(transactionType, period),
					getCategoryPreferences(),
				]);

				setCategoryTotals(summary.categories);
				setCategoryPreferences(categoryPreferencesData);
			} catch (error) {
				console.error("Failed to load chart data:", error);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [transactionType, period]);

	const categoryPreferencesMap = React.useMemo(() => {
		return categoryPreferences.reduce((map, preference) => {
			map[preference.category.id] = preference;
			return map;
		}, {});
	}, [categoryPreferences]);

	const chartData = React.useMemo(() => {
		return categoryTotals
			.filter((item) => !categoryPreferencesMap[item.category_id]?.hidden)
			.map((item) => ({
				categoryId: item.category_id,
				categoryName: item.category_name,
				category: translateCategory(item.category_name),
				total: Number(item.total),
				fill:
					categoryPreferencesMap[item.category_id]?.color ||
					"#64748b",
			}))
			.sort((itemA, itemB) =>
				itemA.category.localeCompare(itemB.category, locale),
			);
	}, [categoryTotals, categoryPreferencesMap, translateCategory, locale]);

	const totalAmount = React.useMemo(() => {
		return chartData.reduce((total, item) => total + item.total, 0);
	}, [chartData]);

	const monthName = new Date(selectedYear, selectedMonth).toLocaleDateString(
		locale,
		{
			month: "long",
			year: "numeric",
		},
	);

	const monday = new Date(selectedYear, selectedMonth, currentDate.getDate());

	const daysSinceMonday = (monday.getDay() + 6) % 7;

	monday.setDate(monday.getDate() - daysSinceMonday);

	const sunday = new Date(monday);

	sunday.setDate(sunday.getDate() + 6);

	const weekDescription = `${monday.toLocaleDateString(locale)} – ${sunday.toLocaleDateString(locale)}`;

	const periodDescription =
		period === "year"
			? String(selectedYear)
			: period === "month"
				? monthName
				: weekDescription;

	const formattedTotal = totalAmount.toLocaleString(locale, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

	if (loading) {
		return (
			<Card>
				<CardHeader className="pb-0">
					<div className="flex items-center justify-between gap-3">
						<CardTitle>
							{transactionType === "expense"
								? t("dashboard.categoryExpenses")
								: t("dashboard.categoryIncome")}
						</CardTitle>
					</div>
					<div className="flex items-center gap-2">
						<select
							value={transactionType}
							onChange={(event) =>
								setTransactionType(event.target.value)
							}
							className="rounded-md border bg-background px-3 py-2 text-sm"
						>
							<option value="expense">
								{t("dashboard.expenses")}
							</option>
							<option value="income">
								{t("dashboard.income")}
							</option>
						</select>
						<select
							value={period}
							onChange={(event) => setPeriod(event.target.value)}
							className="rounded-md border bg-background px-3 py-2 text-sm"
						>
							<option value="year">{t("dashboard.year")}</option>
							<option value="month">
								{t("dashboard.month")}
							</option>
							<option value="week">{t("dashboard.week")}</option>
						</select>
					</div>

					<CardDescription className="capitalize">
						{periodDescription}
					</CardDescription>
				</CardHeader>

				<CardContent>
					<div className="flex h-62.5 items-center justify-center text-sm text-muted-foreground">
						{t("common.loading")}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="flex flex-col">
			<CardHeader className="pb-0">
				<div className="flex items-center justify-between gap-3">
					<CardTitle>
						{transactionType === "expense"
							? t("dashboard.categoryExpenses")
							: t("dashboard.categoryIncome")}
					</CardTitle>
				</div>
				<div className="flex items-center gap-2">
					<select
						value={transactionType}
						onChange={(event) =>
							setTransactionType(event.target.value)
						}
						className="rounded-md border bg-background px-3 py-2 text-sm"
					>
						<option value="expense">
							{t("dashboard.expenses")}
						</option>
						<option value="income">{t("dashboard.income")}</option>
					</select>
					<select
						value={period}
						onChange={(event) => setPeriod(event.target.value)}
						className="rounded-md border bg-background px-3 py-2 text-sm"
					>
						<option value="year">{t("dashboard.year")}</option>
						<option value="month">{t("dashboard.month")}</option>
						<option value="week">{t("dashboard.week")}</option>
					</select>
				</div>

				<CardDescription className="capitalize">
					{periodDescription}
				</CardDescription>
			</CardHeader>

			<CardContent className="flex-1 pb-0">
				{chartData.length === 0 ? (
					<div className="flex h-62.5 items-center justify-center text-sm text-muted-foreground">
						{t("dashboard.noCategoryData")}
					</div>
				) : (
					<ChartContainer
						config={chartConfig}
						className="mx-auto w-full max-w-70 aspect-square"
					>
						<PieChart>
							<ChartTooltip
								cursor={false}
								content={<ChartTooltipContent hideLabel />}
							/>

							<Pie
								data={chartData}
								dataKey="total"
								nameKey="category"
								innerRadius={60}
								strokeWidth={5}
							>
								<Label
									content={({ viewBox }) => {
										if (
											viewBox &&
											"cx" in viewBox &&
											"cy" in viewBox
										) {
											return (
												<text
													x={viewBox.cx}
													y={viewBox.cy}
													textAnchor="middle"
													dominantBaseline="middle"
												>
													<tspan
														x={viewBox.cx}
														y={viewBox.cy - 4}
														className="fill-foreground text-2xl font-bold"
													>
														€{formattedTotal}
													</tspan>

													<tspan
														x={viewBox.cx}
														y={
															(viewBox.cy || 0) +
															20
														}
														className="fill-muted-foreground text-[11px]"
													>
														{transactionType ===
														"expense"
															? t(
																	"dashboard.expenses",
																)
															: t(
																	"dashboard.income",
																)}
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
								totalAmount > 0
									? (
											(item.total / totalAmount) *
											100
										).toFixed(0)
									: 0;

							return (
								<div
									key={item.categoryId}
									className="flex items-center justify-between gap-2"
								>
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
										{item.total.toLocaleString(locale, {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}{" "}
										({percentage}%)
									</div>
								</div>
							);
						})}
					</div>

					<div className="text-xs text-muted-foreground">
						{period === "year"
							? t("dashboard.yearlyCategoryTotals")
							: period === "month"
								? t("dashboard.monthlyCategoryTotals")
								: t("dashboard.weeklyCategoryTotals")}
					</div>
				</CardFooter>
			)}
		</Card>
	);
}
