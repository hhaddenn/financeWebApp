import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import { usePreferences } from "@/context/PreferencesContext";

function formatDate(value, language) {
    if (!value) {
        return "—";
    }

    const date = new Date(`${value}T00:00:00`);

    return new Intl.DateTimeFormat(
        language === "pt" ? "pt-PT" : "en-US",
    ).format(date);
}

function getSchedule(transaction, t) {
    const weekdays = [
        t("recurringTransactions.monday"),
        t("recurringTransactions.tuesday"),
        t("recurringTransactions.wednesday"),
        t("recurringTransactions.thursday"),
        t("recurringTransactions.friday"),
        t("recurringTransactions.saturday"),
        t("recurringTransactions.sunday"),
    ];

    const months = [
        t("recurringTransactions.january"),
        t("recurringTransactions.february"),
        t("recurringTransactions.march"),
        t("recurringTransactions.april"),
        t("recurringTransactions.may"),
        t("recurringTransactions.june"),
        t("recurringTransactions.july"),
        t("recurringTransactions.august"),
        t("recurringTransactions.september"),
        t("recurringTransactions.october"),
        t("recurringTransactions.november"),
        t("recurringTransactions.december"),
    ];

    if (transaction.frequency === "weekly") {
        return `${t("recurringTransactions.weekly")} · ${
            weekdays[transaction.day_of_week]
        }`;
    }

    if (transaction.frequency === "monthly") {
        return `${t("recurringTransactions.monthly")} · ${t(
            "recurringTransactions.day",
        )} ${transaction.day_of_month}`;
    }

    if (transaction.frequency === "yearly") {
        return `${t("recurringTransactions.yearly")} · ${
            transaction.day_of_month
        } ${months[transaction.month - 1]}`;
    }

    return transaction.frequency;
}

export default function RecurringTransactionCard({
    transaction,
    onEdit,
    onDelete,
    onToggleActive,
}) {
    const { t, language, translateCategory, translateSubcategory } =
        usePreferences();

    const isIncome = transaction.transaction_type === "income";

    const category = transaction.subcategory?.category;
    const subcategory = transaction.subcategory;

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                    <CardTitle className="truncate">
                        {transaction.name || t("recurringTransactions.unnamed")}
                    </CardTitle>

                    <p className="text-muted-foreground text-sm">
                        {isIncome
                            ? t("recurringTransactions.income")
                            : t("recurringTransactions.expense")}
                    </p>
                </div>

                <Switch
                    checked={transaction.active}
                    aria-label={
                        transaction.active
                            ? t("recurringTransactions.active")
                            : t("recurringTransactions.inactive")
                    }
                    onCheckedChange={(checked) =>
                        onToggleActive(transaction, checked)
                    }
                />
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="space-y-1">
                    <p className="text-2xl font-semibold">
                        {transaction.amount}
                    </p>

                    <p className="text-muted-foreground text-sm">
                        {getSchedule(transaction, t)}
                    </p>
                </div>

                {transaction.account?.name && (
                    <p className="text-sm">
                        <span className="text-muted-foreground">
                            {t("recurringTransactions.account")}:
                        </span>{" "}
                        {transaction.account.name}
                    </p>
                )}

                {subcategory && (
                    <p className="text-sm">
                        <span className="text-muted-foreground">
                            {t("recurringTransactions.category")}:
                        </span>{" "}
                        {category
                            ? `${translateCategory(category.name)} / `
                            : ""}
                        {translateSubcategory(subcategory.name)}
                    </p>
                )}

                {transaction.counterparty && (
                    <p className="text-sm">
                        <span className="text-muted-foreground">
                            {isIncome
                                ? t("recurringTransactions.from")
                                : t("recurringTransactions.to")}
                            :
                        </span>{" "}
                        {transaction.counterparty}
                    </p>
                )}

                <p className="text-sm">
                    <span className="text-muted-foreground">
                        {t("recurringTransactions.next")}:
                    </span>{" "}
                    {formatDate(transaction.next_run_at, language)}
                </p>

                <div className="flex gap-2 pt-1">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(transaction)}
                    >
                        {t("recurringTransactions.edit")}
                    </Button>

                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(transaction)}
                    >
                        {t("recurringTransactions.delete")}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
