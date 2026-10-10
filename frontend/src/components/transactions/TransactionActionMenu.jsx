"use client";

import { useState } from "react";

import { ArrowLeftRight, Minus, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { TransactionDialog } from "@/components/transactions/TransactionDialog";

import { usePreferences } from "@/context/PreferencesContext";

export function TransactionActionMenu({ variant = "floating" }) {
    const { t } = usePreferences();

    const [open, setOpen] = useState(false);
    const [transactionType, setTransactionType] = useState(null);

    const handleIncome = () => {
        setOpen(false);
        setTransactionType("income");
    };

    const handleExpense = () => {
        setOpen(false);
        setTransactionType("expense");
    };

    const handleTransfer = () => {
        setOpen(false);
        setTransactionType("transfer");
    };

    const handleDialogClose = (isOpen) => {
        if (!isOpen) {
            setTransactionType(null);
        }
    };

    return (
        <>
            <div
                className={
                    variant === "responsive"
                        ? "relative ml-auto flex w-fit flex-row items-center gap-3 lg:fixed lg:bottom-6 lg:right-6 lg:z-50 lg:flex-col"
                        : variant === "floating"
                          ? "fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3"
                          : "relative ml-auto flex w-fit flex-row items-center gap-3"
                }
            >
                {open && (
                    <div
                        className={
                            variant === "inline"
                                ? "flex flex-row items-center gap-3"
                                : variant === "responsive"
                                  ? "flex flex-row items-center gap-3 lg:flex-col"
                                  : "flex flex-col items-center gap-3"
                        }
                    >
                        {/* Income */}
                        <button
                            type="button"
                            onClick={handleIncome}
                            aria-label={t("transactions.income")}
                            className="
								flex h-12 w-12 items-center justify-center
								cursor-pointer rounded-full
								bg-emerald-600 text-white
								shadow-lg ring-1 ring-black/10
								transition-transform
								hover:scale-105
								hover:bg-emerald-700
								active:scale-95
							"
                        >
                            <Plus className="h-5 w-5" />

                            <span className="sr-only">
                                {t("transactions.income")}
                            </span>
                        </button>

                        {/* Expense */}
                        <button
                            type="button"
                            onClick={handleExpense}
                            aria-label={t("transactions.expense")}
                            className="
								flex h-12 w-12 items-center justify-center
								cursor-pointer rounded-full
								bg-red-600 text-white
								shadow-lg ring-1 ring-black/10
								transition-transform
								hover:scale-105
								hover:bg-red-700
								active:scale-95
							"
                        >
                            <Minus className="h-5 w-5" />

                            <span className="sr-only">
                                {t("transactions.expense")}
                            </span>
                        </button>

                        {/* Transfer */}
                        <button
                            type="button"
                            onClick={handleTransfer}
                            aria-label={t("transactions.transfer")}
                            className="
								flex h-12 w-12 items-center justify-center
								cursor-pointer rounded-full
								bg-foreground text-background
								shadow-lg ring-1 ring-border
								transition-transform
								hover:scale-105
								hover:bg-foreground/90
								active:scale-95
							"
                        >
                            <ArrowLeftRight className="h-5 w-5" />

                            <span className="sr-only">
                                {t("transactions.transfer")}
                            </span>
                        </button>
                    </div>
                )}

                {/* Main action button */}
                <Button
                    type="button"
                    size="icon"
                    onClick={() => setOpen((current) => !current)}
                    aria-label={
                        open
                            ? t("transactions.closeActions")
                            : t("transactions.openActions")
                    }
                    className="
						h-14 w-14 rounded-full
						bg-foreground text-background
						border border-border
						shadow-xl
						transition-transform
						hover:scale-105
						hover:bg-foreground/90
						active:scale-95
						focus-visible:ring-2
						focus-visible:ring-ring
						focus-visible:ring-offset-2
						focus-visible:ring-offset-background
						cursor-pointer
					"
                >
                    {open ? (
                        <X className="h-6 w-6" />
                    ) : (
                        <Plus className="h-6 w-6" />
                    )}

                    <span className="sr-only">
                        {open
                            ? t("transactions.closeActions")
                            : t("transactions.openActions")}
                    </span>
                </Button>
            </div>

            <TransactionDialog
                type={transactionType}
                transaction={null}
                open={transactionType !== null}
                onOpenChange={handleDialogClose}
                onCreated={() => {
                    window.location.reload();
                }}
            />
        </>
    );
}
