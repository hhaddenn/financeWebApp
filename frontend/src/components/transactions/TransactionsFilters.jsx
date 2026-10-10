"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import { Search, X } from "lucide-react";
import { format } from "date-fns";
import { enUS, pt } from "date-fns/locale";

import { usePreferences } from "@/context/PreferencesContext";

export function TransactionsFilters({
    filters,
    onFiltersChange,
    accounts = [],
    categories = [],
    subcategories = [],
}) {
    const { language, t, translateCategory, translateSubcategory } =
        usePreferences();

    const dateLocale = language === "pt" ? pt : enUS;

    const updateFilter = (key, value) => {
        onFiltersChange((current) => ({
            ...current,
            [key]: value,
            ...(key === "category" ? { subcategory: "" } : {}),
        }));
    };

    const clearFilters = () => {
        onFiltersChange({
            search: "",
            type: "",
            account: "",
            category: "",
            subcategory: "",
            checked: "",
            start_date: "",
            end_date: "",
        });
    };

    const hasFilters = Object.values(filters).some(Boolean);

    const visibleSubcategories = filters.category
        ? subcategories.filter(
              (subcategory) =>
                  String(subcategory.category?.id) === String(filters.category),
          )
        : subcategories;

    const sortedVisibleSubcategories = [...visibleSubcategories].sort((a, b) =>
        translateSubcategory(a.name).localeCompare(
            translateSubcategory(b.name),
            language === "pt" ? "pt-PT" : "en-US",
            { sensitivity: "base" },
        ),
    );

    const sortedCategories = [...categories].sort((a, b) =>
        translateCategory(a.name).localeCompare(
            translateCategory(b.name),
            language === "pt" ? "pt-PT" : "en-US",
            { sensitivity: "base" },
        ),
    );

    const sortedAccounts = [...accounts].sort((a, b) =>
        a.name.localeCompare(b.name, language === "pt" ? "pt-PT" : "en-US", {
            sensitivity: "base",
        }),
    );

    const startDate = filters.start_date
        ? new Date(`${filters.start_date}T00:00:00`)
        : undefined;

    const endDate = filters.end_date
        ? new Date(`${filters.end_date}T00:00:00`)
        : undefined;

    // Texto apresentado no filtro de tipo.
    // O valor interno continua a ser "income", "expense" ou "transfer".
    const selectedTypeLabel =
        filters.type === "income"
            ? t("transactions.income")
            : filters.type === "expense"
              ? t("transactions.expense")
              : filters.type === "transfer"
                ? t("transactions.transfer")
                : t("transactions.allTypes");

    // Texto apresentado no filtro de estado.
    // O valor interno continua a ser "true" ou "false".
    const selectedStatusLabel =
        filters.checked === "true"
            ? t("transactions.paid")
            : filters.checked === "false"
              ? t("transactions.notPaid")
              : t("transactions.allStatuses");

    // Conta selecionada.
    const selectedAccount = accounts.find(
        (account) => String(account.id) === String(filters.account),
    );

    // Categoria selecionada.
    const selectedCategory = categories.find(
        (category) => String(category.id) === String(filters.category),
    );

    // Subcategoria selecionada.
    const selectedSubcategory = subcategories.find(
        (subcategory) => String(subcategory.id) === String(filters.subcategory),
    );

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-base">
                            {t("transactions.filters")}
                        </CardTitle>

                        <p className="mt-1 text-sm text-muted-foreground">
                            {t("transactions.filterDescription")}
                        </p>
                    </div>

                    {hasFilters && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="gap-2"
                        >
                            <X className="h-4 w-4" />
                            {t("transactions.clearFilters")}
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Search + main filters */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
                    {/* Search */}
                    <div className="space-y-2">
                        <Label htmlFor="transaction-search">
                            {t("transactions.search")}
                        </Label>

                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                            <Input
                                id="transaction-search"
                                value={filters.search}
                                onChange={(event) =>
                                    updateFilter("search", event.target.value)
                                }
                                placeholder={t(
                                    "transactions.searchPlaceholder",
                                )}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {/* Type */}
                    <div className="space-y-2">
                        <Label>{t("transactions.type")}</Label>

                        <Select
                            value={filters.type || "all"}
                            onValueChange={(value) =>
                                updateFilter(
                                    "type",
                                    value === "all" ? "" : value,
                                )
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue>{selectedTypeLabel}</SelectValue>
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="all">
                                    {t("transactions.allTypes")}
                                </SelectItem>

                                <SelectItem value="income">
                                    {t("transactions.income")}
                                </SelectItem>

                                <SelectItem value="expense">
                                    {t("transactions.expense")}
                                </SelectItem>

                                <SelectItem value="transfer">
                                    {t("transactions.transfer")}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <Label>{t("transactions.status")}</Label>

                        <Select
                            value={filters.checked || "all"}
                            onValueChange={(value) =>
                                updateFilter(
                                    "checked",
                                    value === "all" ? "" : value,
                                )
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue>{selectedStatusLabel}</SelectValue>
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="all">
                                    {t("transactions.allStatuses")}
                                </SelectItem>

                                <SelectItem value="true">
                                    {t("transactions.paid")}
                                </SelectItem>

                                <SelectItem value="false">
                                    {t("transactions.notPaid")}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Separator />

                {/* Account / category filters */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {/* Account */}
                    <div className="space-y-2">
                        <Label>{t("transactions.account")}</Label>

                        <Select
                            value={filters.account || "all"}
                            onValueChange={(value) =>
                                updateFilter(
                                    "account",
                                    value === "all" ? "" : value,
                                )
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue>
                                    {selectedAccount?.name ||
                                        t("transactions.allAccounts")}
                                </SelectValue>
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="all">
                                    {t("transactions.allAccounts")}
                                </SelectItem>

                                {sortedAccounts.map((account) => (
                                    <SelectItem
                                        key={account.id}
                                        value={String(account.id)}
                                    >
                                        {account.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label>{t("transactions.category")}</Label>

                        <Select
                            value={filters.category || "all"}
                            onValueChange={(value) =>
                                updateFilter(
                                    "category",
                                    value === "all" ? "" : value,
                                )
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue>
                                    {selectedCategory
                                        ? translateCategory(
                                              selectedCategory.name,
                                          )
                                        : t("transactions.allCategories")}
                                </SelectValue>
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="all">
                                    {t("transactions.allCategories")}
                                </SelectItem>

                                {sortedCategories.map((category) => (
                                    <SelectItem
                                        key={category.id}
                                        value={String(category.id)}
                                    >
                                        {translateCategory(category.name)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Subcategory */}
                    <div className="space-y-2">
                        <Label>{t("transactions.subcategory")}</Label>

                        <Select
                            value={filters.subcategory || "all"}
                            onValueChange={(value) =>
                                updateFilter(
                                    "subcategory",
                                    value === "all" ? "" : value,
                                )
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue>
                                    {selectedSubcategory
                                        ? translateSubcategory(
                                              selectedSubcategory.name,
                                          )
                                        : t("transactions.allSubcategories")}
                                </SelectValue>
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="all">
                                    {t("transactions.allSubcategories")}
                                </SelectItem>

                                {sortedVisibleSubcategories.map(
                                    (subcategory) => (
                                        <SelectItem
                                            key={subcategory.id}
                                            value={String(subcategory.id)}
                                        >
                                            {translateSubcategory(
                                                subcategory.name,
                                            )}
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Separator />

                {/* Date range */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Start date */}
                    <div className="grid gap-2">
                        <Label htmlFor="transaction-start-date">
                            {t("transactions.startDate")}
                        </Label>

                        <Popover>
                            <PopoverTrigger
                                render={
                                    <Button
                                        type="button"
                                        variant="outline"
                                        id="transaction-start-date"
                                        className="justify-start font-normal"
                                    >
                                        {startDate
                                            ? format(startDate, "PPP", {
                                                  locale: dateLocale,
                                              })
                                            : t("transactions.selectStartDate")}
                                    </Button>
                                }
                            />

                            <PopoverContent
                                className="w-auto p-0"
                                align="start"
                            >
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={(date) => {
                                        updateFilter(
                                            "start_date",
                                            date
                                                ? format(date, "yyyy-MM-dd")
                                                : "",
                                        );
                                    }}
                                    defaultMonth={startDate}
                                    locale={dateLocale}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* End date */}
                    <div className="grid gap-2">
                        <Label htmlFor="transaction-end-date">
                            {t("transactions.endDate")}
                        </Label>

                        <Popover>
                            <PopoverTrigger
                                render={
                                    <Button
                                        type="button"
                                        variant="outline"
                                        id="transaction-end-date"
                                        className="justify-start font-normal"
                                    >
                                        {endDate
                                            ? format(endDate, "PPP", {
                                                  locale: dateLocale,
                                              })
                                            : t("transactions.selectEndDate")}
                                    </Button>
                                }
                            />

                            <PopoverContent
                                className="w-auto p-0"
                                align="start"
                            >
                                <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={(date) => {
                                        updateFilter(
                                            "end_date",
                                            date
                                                ? format(date, "yyyy-MM-dd")
                                                : "",
                                        );
                                    }}
                                    defaultMonth={endDate}
                                    locale={dateLocale}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Mobile clear button */}
                {hasFilters && (
                    <div className="flex justify-end md:hidden">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={clearFilters}
                            className="gap-2"
                        >
                            <X className="h-4 w-4" />
                            {t("transactions.clearFilters")}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
