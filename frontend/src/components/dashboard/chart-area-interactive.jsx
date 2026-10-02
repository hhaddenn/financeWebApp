"use client";

import { useEffect, useState } from "react";

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

import { getTransactions } from "@/api/transactions";
import { getSettings } from "@/api/settings";
import { usePreferences } from "@/context/PreferencesContext";

const months = {
  pt: [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
};

export function ChartBarMultiple() {
  const { language, t } = usePreferences();

  const [chartData, setChartData] = useState([]);
  const [incomeColor, setIncomeColor] = useState("#22c55e");
  const [expenseColor, setExpenseColor] = useState("#ef4444");
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const currentMonths = months[language] ?? months.pt;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [transactionsResponse, settings] = await Promise.all([
          getTransactions(),
          getSettings(),
        ]);

        const transactions =
          transactionsResponse.results ?? transactionsResponse;

        setIncomeColor(settings.income_color || "#22c55e");
        setExpenseColor(settings.expense_color || "#ef4444");

        const monthlyData = currentMonths.map((month) => ({
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

          if (transaction.transaction_type === "expense") {
            monthlyData[monthIndex].expense += amount;
          }

          if (transaction.transaction_type === "income") {
            monthlyData[monthIndex].income += amount;
          }
        });

        setChartData(monthlyData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentYear, language, currentMonths]);

  const chartConfig = {
    expense: {
      label: t("settings.expenseColor"),
      color: expenseColor,
    },
    income: {
      label: t("settings.incomeColor"),
      color: incomeColor,
    },
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {language === "pt" ? "Receitas e despesas" : "Income and expenses"}
          </CardTitle>

          <CardDescription>
            {currentMonths[0]} - {currentMonths[11]} {currentYear}
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
        <CardTitle>
          {language === "pt" ? "Receitas e despesas" : "Income and expenses"}
        </CardTitle>

        <CardDescription>
          {currentMonths[0]} - {currentMonths[11]} {currentYear}
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
          {language === "pt"
            ? `Receitas e despesas de ${currentYear}`
            : `Income and expenses for ${currentYear}`}

          <TrendingUp className="h-4 w-4" />
        </div>

        <div className="leading-none text-muted-foreground">
          {language === "pt"
            ? "Totais mensais das transações"
            : "Showing monthly transaction totals"}
        </div>
      </CardFooter>
    </Card>
  );
}
