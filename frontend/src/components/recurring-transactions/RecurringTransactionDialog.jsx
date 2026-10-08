/* oxlint-disable react/set-state-in-effect */

import { useEffect, useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { getAccounts } from "@/api/accounts";
import { getCategories, getSubcategories } from "@/api/categories";

import {
    createRecurringTransaction,
    updateRecurringTransaction,
} from "@/api/recurringTransactions";

import { iconMap } from "@/lib/icons";
import { usePreferences } from "@/context/PreferencesContext";

const getDefaultForm = () => ({
    name: "",
    amount: 0,
    transaction_type: "expense",
    account_id: "",
    subcategory_id: "",
    counterparty: "",
    frequency: "monthly",
    day_of_week: "",
    day_of_month: "1",
    month: "",
    active: true,
});

const getValueId = (value) => {
    if (value && typeof value === "object") {
        return value.id;
    }

    return value;
};

function CategoryIcon({ name, className }) {
    const Icon = name ? iconMap[name] : null;

    if (!Icon) {
        return null;
    }

    return <Icon className={className} aria-hidden="true" />;
}

export default function RecurringTransactionDialog({
    open,
    onOpenChange,
    transaction = null,
    onSaved,
}) {
    const { t, translateCategory, translateSubcategory } = usePreferences();

    const isEditing = Boolean(transaction);

    const [form, setForm] = useState(getDefaultForm);

    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);

    const [accountOpen, setAccountOpen] = useState(false);
    const [categoryOpen, setCategoryOpen] = useState(false);

    const [selectedCategoryId, setSelectedCategoryId] = useState(null);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    /*
     * Populate form when opening/editing.
     */
    useEffect(() => {
        if (!open) {
            return;
        }

        setError("");

        if (transaction) {
            setForm({
                name: transaction.name ?? "",

                amount:
                    transaction.amount !== null &&
                    transaction.amount !== undefined
                        ? String(transaction.amount)
                        : "",

                transaction_type: transaction.transaction_type ?? "expense",

                account_id: String(getValueId(transaction.account) ?? ""),

                subcategory_id: String(
                    getValueId(transaction.subcategory) ?? "",
                ),

                counterparty: transaction.counterparty ?? "",
                frequency: transaction.frequency ?? "monthly",

                day_of_week:
                    transaction.day_of_week !== null &&
                    transaction.day_of_week !== undefined
                        ? String(transaction.day_of_week)
                        : "",

                day_of_month:
                    transaction.day_of_month !== null &&
                    transaction.day_of_month !== undefined
                        ? String(transaction.day_of_month)
                        : "",

                month:
                    transaction.month !== null &&
                    transaction.month !== undefined
                        ? String(transaction.month)
                        : "",

                active: transaction.active ?? true,
            });

            if (transaction.subcategory?.category?.id) {
                setSelectedCategoryId(
                    String(transaction.subcategory.category.id),
                );
            } else {
                setSelectedCategoryId(null);
            }

            return;
        }

        setForm(getDefaultForm());
        setSelectedCategoryId(null);
    }, [open, transaction]);

    /*
     * Load accounts.
     */
    useEffect(() => {
        if (!open) {
            return;
        }

        let cancelled = false;

        const loadAccounts = async () => {
            try {
                const accountsData = await getAccounts();

                if (cancelled) {
                    return;
                }

                setAccounts(Array.isArray(accountsData) ? accountsData : []);
            } catch (requestError) {
                if (cancelled) {
                    return;
                }

                console.error("Failed to load accounts", requestError);

                setError("Could not load accounts.");
            }
        };

        loadAccounts();

        return () => {
            cancelled = true;
        };
    }, [open]);

    /*
     * Load categories for the selected transaction type,
     * plus all subcategories.
     */
    useEffect(() => {
        if (!open) {
            return;
        }

        let cancelled = false;

        const loadCategories = async () => {
            try {
                const [categoriesData, subcategoriesData] = await Promise.all([
                    getCategories(form.transaction_type),
                    getSubcategories(),
                ]);

                if (cancelled) {
                    return;
                }

                setCategories(
                    Array.isArray(categoriesData) ? categoriesData : [],
                );

                setSubcategories(
                    Array.isArray(subcategoriesData) ? subcategoriesData : [],
                );
            } catch (requestError) {
                if (cancelled) {
                    return;
                }

                console.error("Failed to load categories", requestError);

                setError("Could not load categories.");
            }
        };

        loadCategories();

        return () => {
            cancelled = true;
        };
    }, [open, form.transaction_type]);

    /*
     * When editing, recurring API may return subcategory as only an ID.
     * Once subcategories are loaded, find its parent category.
     */
    useEffect(() => {
        if (!open || !form.subcategory_id || selectedCategoryId !== null) {
            return;
        }

        const selected = subcategories.find(
            (subcategory) =>
                String(subcategory.id) === String(form.subcategory_id),
        );

        if (selected?.category?.id) {
            setSelectedCategoryId(String(selected.category.id));
        }
    }, [open, form.subcategory_id, subcategories, selectedCategoryId]);

    const updateField = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const selectedAccount = accounts.find(
        (account) => String(account.id) === String(form.account_id),
    );

    const selectedCategory = categories.find(
        (category) => String(category.id) === String(selectedCategoryId),
    );

    const selectedSubcategory = subcategories.find(
        (subcategory) => String(subcategory.id) === String(form.subcategory_id),
    );

    const filteredSubcategories = subcategories.filter(
        (subcategory) =>
            String(subcategory.category?.id) === String(selectedCategoryId),
    );

    const handleTransactionTypeChange = (type) => {
        setForm((current) => ({
            ...current,
            transaction_type: type,
            subcategory_id: "",
        }));

        setSelectedCategoryId(null);
    };

    const handleAccountSelect = (account) => {
        setForm((current) => ({
            ...current,
            account_id: String(account.id),
        }));

        setAccountOpen(false);
    };

    const handleCategorySelect = (category) => {
        setSelectedCategoryId(String(category.id));

        setForm((current) => ({
            ...current,
            subcategory_id: "",
        }));
    };

    const handleSubcategorySelect = (subcategory) => {
        setForm((current) => ({
            ...current,
            subcategory_id: String(subcategory.id),
        }));

        setCategoryOpen(false);
    };

    const resetCategoryMenu = () => {
        setSelectedCategoryId(null);

        setForm((current) => ({
            ...current,
            subcategory_id: "",
        }));
    };

    const buildSchedulePayload = () => {
        if (form.frequency === "weekly") {
            return {
                frequency: "weekly",
                day_of_week: Number(form.day_of_week),
                day_of_month: null,
                month: null,
            };
        }

        if (form.frequency === "monthly") {
            return {
                frequency: "monthly",
                day_of_week: null,
                day_of_month: Number(form.day_of_month),
                month: null,
            };
        }

        return {
            frequency: "yearly",
            day_of_week: null,
            day_of_month: Number(form.day_of_month),
            month: Number(form.month),
        };
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        const amount = Number(form.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            setError("Enter a valid amount.");
            return;
        }

        if (!form.account_id) {
            setError("Choose an account.");
            return;
        }

        if (form.frequency === "weekly") {
            if (form.day_of_week === "") {
                setError("Choose a weekday.");
                return;
            }
        }

        if (
            (form.frequency === "monthly" || form.frequency === "yearly") &&
            form.day_of_month === ""
        ) {
            setError("Choose a day of the month.");
            return;
        }

        if (form.frequency === "yearly" && form.month === "") {
            setError("Choose a month.");
            return;
        }

        const payload = {
            name: form.name.trim(),
            amount,
            transaction_type: form.transaction_type,

            account: Number(form.account_id),

            subcategory: form.subcategory_id
                ? Number(form.subcategory_id)
                : null,

            counterparty: form.counterparty.trim(),
            active: form.active,

            ...buildSchedulePayload(),
        };

        try {
            setSaving(true);

            if (isEditing) {
                await updateRecurringTransaction(transaction.id, payload);
            } else {
                await createRecurringTransaction(payload);
            }

            onOpenChange(false);
            await onSaved?.();
        } catch (saveError) {
            console.error("Failed to save recurring transaction:", saveError);

            const responseData = saveError?.response?.data;

            if (responseData) {
                const firstError = Object.values(responseData)
                    .flat()
                    .find(Boolean);

                if (typeof firstError === "string") {
                    setError(firstError);
                } else {
                    setError("Could not save recurring transaction.");
                }
            } else {
                setError("Could not save recurring transaction.");
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <form onSubmit={handleSubmit} noValidate>
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing
                                ? t("recurringTransactions.dialog.editTitle")
                                : t("recurringTransactions.dialog.addTitle")}
                        </DialogTitle>

                        <DialogDescription>
                            {t("recurringTransactions.dialog.description")}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-5 py-6">
                        {/* NAME */}
                        <div className="grid gap-2">
                            <Label htmlFor="recurring-name">
                                {t("recurringTransactions.dialog.name")}
                            </Label>

                            <Input
                                id="recurring-name"
                                placeholder={t(
                                    "recurringTransactions.dialog.namePlaceholder",
                                )}
                                value={form.name}
                                disabled={saving}
                                onChange={(event) =>
                                    updateField("name", event.target.value)
                                }
                            />
                        </div>

                        {/* AMOUNT */}
                        <div className="grid gap-2">
                            <Label htmlFor="recurring-amount">
                                {t("recurringTransactions.dialog.amount")}
                            </Label>

                            <Input
                                id="recurring-amount"
                                type="number"
                                placeholder={t(
                                    "recurringTransactions.dialog.amountPlaceholder",
                                )}
                                min="0"
                                step="0.01"
                                value={form.amount}
                                disabled={saving}
                                onChange={(event) =>
                                    updateField("amount", event.target.value)
                                }
                            />
                        </div>

                        {/* TYPE */}
                        <div className="grid gap-2">
                            <Label htmlFor="recurring-type">
                                {t("recurringTransactions.dialog.type")}
                            </Label>

                            <select
                                id="recurring-type"
                                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                                value={form.transaction_type}
                                disabled={saving}
                                onChange={(event) =>
                                    handleTransactionTypeChange(
                                        event.target.value,
                                    )
                                }
                            >
                                <option value="expense">
                                    {t("recurringTransactions.expense")}
                                </option>

                                <option value="income">
                                    {t("recurringTransactions.income")}
                                </option>
                            </select>
                        </div>

                        {/* ACCOUNT */}
                        <div className="grid gap-2">
                            <Label>
                                {t("recurringTransactions.dialog.account")}
                            </Label>

                            <Popover
                                open={accountOpen}
                                onOpenChange={setAccountOpen}
                            >
                                <PopoverTrigger
                                    render={
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="justify-start font-normal"
                                            disabled={saving}
                                        >
                                            {selectedAccount ? (
                                                <>
                                                    <CategoryIcon
                                                        name={
                                                            selectedAccount.icon
                                                        }
                                                        className="mr-2 size-4"
                                                    />

                                                    <span className="truncate">
                                                        {selectedAccount.name}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    {t(
                                                        "recurringTransactions.dialog.selectAccount",
                                                    )}
                                                </span>
                                            )}
                                        </Button>
                                    }
                                />

                                <PopoverContent
                                    className="w-64 p-2"
                                    align="start"
                                >
                                    <div className="grid max-h-60 gap-1 overflow-y-auto">
                                        {accounts.map((account) => (
                                            <Button
                                                key={account.id}
                                                type="button"
                                                variant="ghost"
                                                className="w-full justify-start"
                                                onClick={() =>
                                                    handleAccountSelect(account)
                                                }
                                            >
                                                <CategoryIcon
                                                    name={account.icon}
                                                    className="mr-3 size-5"
                                                />

                                                <span className="flex-1 truncate text-left">
                                                    {account.name}
                                                </span>
                                            </Button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* CATEGORY / SUBCATEGORY */}
                        <div className="grid gap-2">
                            <Label>
                                {t("recurringTransactions.dialog.category")}
                            </Label>

                            <Popover
                                open={categoryOpen}
                                onOpenChange={setCategoryOpen}
                            >
                                <PopoverTrigger
                                    render={
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="justify-start font-normal"
                                            disabled={saving}
                                        >
                                            {selectedSubcategory ? (
                                                <>
                                                    <CategoryIcon
                                                        name={
                                                            selectedCategory?.icon
                                                        }
                                                        className="mr-2 size-4"
                                                    />

                                                    <span className="truncate">
                                                        {selectedCategory
                                                            ? translateCategory(
                                                                  selectedCategory.name,
                                                              )
                                                            : null}
                                                    </span>

                                                    <span className="mx-2 text-muted-foreground">
                                                        /
                                                    </span>

                                                    <CategoryIcon
                                                        name={
                                                            selectedSubcategory.icon
                                                        }
                                                        className="mr-2 size-4"
                                                    />

                                                    <span className="truncate">
                                                        {translateSubcategory(
                                                            selectedSubcategory.name,
                                                        )}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    {t(
                                                        "recurringTransactions.dialog.selectCategory",
                                                    )}
                                                </span>
                                            )}
                                        </Button>
                                    }
                                />

                                <PopoverContent
                                    className="w-64 p-2"
                                    align="start"
                                >
                                    {selectedCategoryId === null ? (
                                        <div className="grid max-h-60 gap-1 overflow-y-auto">
                                            {categories.map((category) => (
                                                <Button
                                                    key={category.id}
                                                    type="button"
                                                    variant="ghost"
                                                    className="w-full justify-start"
                                                    onClick={() =>
                                                        handleCategorySelect(
                                                            category,
                                                        )
                                                    }
                                                >
                                                    <CategoryIcon
                                                        name={category.icon}
                                                        className="mr-3 size-5"
                                                    />

                                                    <span className="flex-1 truncate text-left">
                                                        {translateCategory(
                                                            category.name,
                                                        )}
                                                    </span>
                                                </Button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid max-h-60 gap-1 overflow-y-auto">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="mb-1 justify-start rounded-none border-b"
                                                onClick={resetCategoryMenu}
                                            >
                                                <CategoryIcon
                                                    name={
                                                        selectedCategory?.icon
                                                    }
                                                    className="mr-2 size-4"
                                                />

                                                {selectedCategory
                                                    ? translateCategory(
                                                          selectedCategory.name,
                                                      )
                                                    : null}
                                            </Button>

                                            {filteredSubcategories.map(
                                                (subcategory) => (
                                                    <Button
                                                        key={subcategory.id}
                                                        type="button"
                                                        variant="ghost"
                                                        className="w-full justify-start"
                                                        onClick={() =>
                                                            handleSubcategorySelect(
                                                                subcategory,
                                                            )
                                                        }
                                                    >
                                                        <CategoryIcon
                                                            name={
                                                                subcategory.icon
                                                            }
                                                            className="mr-3 size-5"
                                                        />

                                                        <span className="truncate">
                                                            {translateSubcategory(
                                                                subcategory.name,
                                                            )}
                                                        </span>
                                                    </Button>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* COUNTERPARTY */}
                        <div className="grid gap-2">
                            <Label htmlFor="recurring-counterparty">
                                {form.transaction_type === "income"
                                    ? t("recurringTransactions.from")
                                    : t("recurringTransactions.to")}
                            </Label>

                            <Input
                                id="recurring-counterparty"
                                placeholder={
                                    form.transaction_type === "income"
                                        ? t(
                                              "recurringTransactions.dialog.incomeCounterpartyPlaceholder",
                                          )
                                        : t(
                                              "recurringTransactions.dialog.expenseCounterpartyPlaceholder",
                                          )
                                }
                                value={form.counterparty}
                                disabled={saving}
                                onChange={(event) =>
                                    updateField(
                                        "counterparty",
                                        event.target.value,
                                    )
                                }
                            />
                        </div>

                        {/* FREQUENCY */}
                        <div className="grid gap-2">
                            <Label htmlFor="recurring-frequency">
                                {t("recurringTransactions.dialog.frequency")}
                            </Label>

                            <select
                                id="recurring-frequency"
                                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                                value={form.frequency}
                                disabled={saving}
                                onChange={(event) =>
                                    updateField("frequency", event.target.value)
                                }
                            >
                                <option value="weekly">
                                    {t("recurringTransactions.weekly")}
                                </option>

                                <option value="monthly">
                                    {t("recurringTransactions.monthly")}
                                </option>

                                <option value="yearly">
                                    {t("recurringTransactions.yearly")}
                                </option>
                            </select>
                        </div>

                        {/* WEEKLY */}
                        {form.frequency === "weekly" && (
                            <div className="grid gap-2">
                                <Label htmlFor="recurring-weekday">
                                    {t("recurringTransactions.dialog.weekday")}
                                </Label>

                                <select
                                    id="recurring-weekday"
                                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                                    value={form.day_of_week}
                                    disabled={saving}
                                    onChange={(event) =>
                                        updateField(
                                            "day_of_week",
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value="">
                                        {t(
                                            "recurringTransactions.dialog.selectWeekday",
                                        )}
                                    </option>
                                    <option value="0">
                                        {t("recurringTransactions.monday")}
                                    </option>
                                    <option value="1">
                                        {t("recurringTransactions.tuesday")}
                                    </option>
                                    <option value="2">
                                        {t("recurringTransactions.wednesday")}
                                    </option>
                                    <option value="3">
                                        {t("recurringTransactions.thursday")}
                                    </option>
                                    <option value="4">
                                        {t("recurringTransactions.friday")}
                                    </option>
                                    <option value="5">
                                        {t("recurringTransactions.saturday")}
                                    </option>
                                    <option value="6">
                                        {t("recurringTransactions.sunday")}
                                    </option>
                                </select>
                            </div>
                        )}

                        {/* MONTHLY / YEARLY DAY */}
                        {(form.frequency === "monthly" ||
                            form.frequency === "yearly") && (
                            <div className="grid gap-2">
                                <Label htmlFor="recurring-day">
                                    {t(
                                        "recurringTransactions.dialog.dayOfMonth",
                                    )}
                                </Label>

                                <Input
                                    id="recurring-day"
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={form.day_of_month}
                                    disabled={saving}
                                    onChange={(event) =>
                                        updateField(
                                            "day_of_month",
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>
                        )}

                        {/* YEARLY MONTH */}
                        {form.frequency === "yearly" && (
                            <div className="grid gap-2">
                                <Label htmlFor="recurring-month">
                                    {t("recurringTransactions.dialog.month")}
                                </Label>

                                <select
                                    id="recurring-month"
                                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                                    value={form.month}
                                    disabled={saving}
                                    onChange={(event) =>
                                        updateField("month", event.target.value)
                                    }
                                >
                                    <option value="">
                                        {t(
                                            "recurringTransactions.dialog.selectMonth",
                                        )}
                                    </option>

                                    <option value="1">
                                        {t("recurringTransactions.january")}
                                    </option>
                                    <option value="2">
                                        {t("recurringTransactions.february")}
                                    </option>
                                    <option value="3">
                                        {t("recurringTransactions.march")}
                                    </option>
                                    <option value="4">
                                        {t("recurringTransactions.april")}
                                    </option>
                                    <option value="5">
                                        {t("recurringTransactions.may")}
                                    </option>
                                    <option value="6">
                                        {t("recurringTransactions.june")}
                                    </option>
                                    <option value="7">
                                        {t("recurringTransactions.july")}
                                    </option>
                                    <option value="8">
                                        {t("recurringTransactions.august")}
                                    </option>
                                    <option value="9">
                                        {t("recurringTransactions.september")}
                                    </option>
                                    <option value="10">
                                        {t("recurringTransactions.october")}
                                    </option>
                                    <option value="11">
                                        {t("recurringTransactions.november")}
                                    </option>
                                    <option value="12">
                                        {t("recurringTransactions.december")}
                                    </option>
                                </select>
                            </div>
                        )}

                        {/* ERROR */}
                        {error && (
                            <div
                                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                                role="alert"
                            >
                                {error}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={saving}
                        >
                            {t("common.cancel")}
                        </Button>

                        <Button
                            type="submit"
                            disabled={saving || !form.account_id}
                        >
                            {saving
                                ? t("recurringTransactions.dialog.saving")
                                : isEditing
                                  ? t(
                                        "recurringTransactions.dialog.saveChanges",
                                    )
                                  : t("recurringTransactions.dialog.create")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
