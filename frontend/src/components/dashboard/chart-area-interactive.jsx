"use client";

import { useEffect, useMemo, useState } from "react";

import { TrendingUp } from "lucide-react";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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

import { getDashboardSummary } from "@/api/dashboard";
import { getSettings } from "@/api/settings";
import { usePreferences } from "@/context/PreferencesContext";

export function ChartBarMultiple() {
	const { language, t } = usePreferences();

	const [chartData, setChartData] = useState([]);
	const [incomeColor, setIncomeColor] = useState("#22c55e");
	const [expenseColor, setExpenseColor] = useState("#ef4444");
	const [loading, setLoading] = useState(true);
	const [period, setPeriod] = useState("year");
	const [settingsLoaded, setSettingsLoaded] = useState(false);

	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(max-width: 640px)");

		const updateMobile = () => {
			setIsMobile(mediaQuery.matches);
		};

		updateMobile();

		mediaQuery.addEventListener("change", updateMobile);

		return () => {
			mediaQuery.removeEventListener("change", updateMobile);
		};
	}, []);

	const currentYear = new Date().getFullYear();
	const currentMonths = useMemo(() => {
		const locale = language === "pt" ? "pt-PT" : "en-GB";

		return Array.from({ length: 12 }, (_, index) => {
			const date = new Date(2025, index, 1);

			return new Intl.DateTimeFormat(locale, {
				month: "long",
			}).format(date);
		});
	}, [language]);

	useEffect(() => {
		const loadSettings = async () => {
			try {
				const settings = await getSettings();

				setIncomeColor(settings.income_color || "#22c55e");
				setExpenseColor(settings.expense_color || "#ef4444");
				setPeriod(settings.dashboard_bar_period);
			} catch (error) {
				console.error("Failed to fetch dashboard settings:", error);
			} finally {
				setSettingsLoaded(true);
			}
		};
		loadSettings();
	}, []);

	const weekLabel = t("dashboard.week");

	useEffect(() => {
		if (!settingsLoaded) return;
		const fetchData = async () => {
			try {
				setLoading(true);

				const summary = await getDashboardSummary(period);

				let data = [];

				if (period === "year") {
					data = summary.months.map((item) => ({
						label: currentMonths[item.month - 1],
						income: Number(item.income),
						expense: Number(item.expense),
					}));
				} else if (period === "month") {
					data = summary.weeks.map((item) => ({
						label: `${weekLabel} ${item.week}`,
						income: Number(item.income),
						expense: Number(item.expense),
					}));
				} else if (period === "week") {
					const locale = language === "pt" ? "pt-PT" : "en-GB";

					data = summary.days.map((item) => ({
						label: new Intl.DateTimeFormat(locale, {
							weekday: "short",
						}).format(new Date(`${item.date}T12:00:00`)),
						income: Number(item.income),
						expense: Number(item.expense),
					}));
				}

				setChartData(data);
			} catch (error) {
				console.error("Failed to fetch dashboard data:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [
		currentYear,
		language,
		currentMonths,
		period,
		settingsLoaded,
		weekLabel,
	]);

	const chartConfig = {
		expense: {
			label: t("dashboard.expenses"),
			color: expenseColor,
		},
		income: {
			label: t("dashboard.income"),
			color: incomeColor,
		},
	};

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between gap-4">
						<CardTitle>{t("dashboard.incomeExpenses")}</CardTitle>

						<select
							value={period}
							onChange={(event) => setPeriod(event.target.value)}
							className="shrink-0 rounded-md border bg-background px-3 py-2 text-sm"
						>
							<option value="year">{t("dashboard.year")}</option>
							<option value="month">
								{t("dashboard.month")}
							</option>
							<option value="week">{t("dashboard.week")}</option>
						</select>
					</div>

					<CardDescription>
						{period === "year"
							? `${currentMonths[0]} - ${currentMonths[11]} ${currentYear}`
							: period === "month"
								? `${currentMonths[new Date().getMonth()]} ${currentYear}`
								: t("dashboard.week")}
					</CardDescription>
				</CardHeader>

				<CardContent>
					<div className="flex h-75 items-center justify-center text-sm text-muted-foreground">
						{t("common.loading")}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between gap-4">
					<CardTitle>{t("dashboard.incomeExpenses")}</CardTitle>

					<select
						value={period}
						onChange={(event) => setPeriod(event.target.value)}
						className="shrink-0 rounded-md border bg-background px-3 py-2 text-sm"
					>
						<option value="year">{t("dashboard.year")}</option>
						<option value="month">{t("dashboard.month")}</option>
						<option value="week">{t("dashboard.week")}</option>
					</select>
				</div>

				<CardDescription>
					{period === "year"
						? `${currentMonths[0]} - ${currentMonths[11]} ${currentYear}`
						: period === "month"
							? `${currentMonths[new Date().getMonth()]} ${currentYear}`
							: t("dashboard.week")}
				</CardDescription>
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
							dataKey="label"
							tickLine={false}
							tickMargin={10}
							axisLine={false}
							interval={0}
							tick={{
								fontSize: isMobile
									? period === "year"
										? 9
										: 10
									: 12,
							}}
							tickFormatter={(value) => {
								if (!isMobile) {
									return period === "year"
										? value.slice(0, 3)
										: value;
								}

								if (period === "year") {
									return value.slice(0, 3);
								}

								if (period === "month") {
									const weekNumber = value.match(/\d+$/)?.[0];

									return `${language === "pt" ? "S" : "W"}${weekNumber ?? ""}`;
								}

								return value.slice(0, 3);
							}}
						/>

						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent indicator="dashed" />}
						/>

						<Bar
							dataKey="expense"
							fill="var(--color-expense)"
							radius={4}
						/>

						<Bar
							dataKey="income"
							fill="var(--color-income)"
							radius={4}
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>

			<CardFooter className="flex-col items-start gap-2 text-sm">
				<div className="flex gap-2 leading-none font-medium">
					{period === "year"
						? t("dashboard.monthlyTotals")
						: period === "month"
							? t("dashboard.weeklyTotals")
							: t("dashboard.dailyTotals")}

					<TrendingUp className="h-4 w-4" />
				</div>

				<div className="leading-none text-muted-foreground">
					{period === "year"
						? t("dashboard.monthlyTotals")
						: period === "month"
							? t("dashboard.weeklyTotals")
							: t("dashboard.dailyTotals")}
				</div>
			</CardFooter>
		</Card>
	);
}
