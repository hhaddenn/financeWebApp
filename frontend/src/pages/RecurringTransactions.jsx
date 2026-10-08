import { useCallback, useEffect, useState } from "react";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { AppSidebar } from "@/components/navigation/AppSidebar";
import { SiteHeader } from "@/components/navigation/SiteHeader";

import RecurringTransactionCard from "@/components/recurring-transactions/RecurringTransactionCard";
import RecurringTransactionDialog from "@/components/recurring-transactions/RecurringTransactionDialog";

import {
    deleteRecurringTransaction,
    getRecurringTransactions,
    updateRecurringTransaction,
} from "@/api/recurringTransactions";

import { getAccounts } from "@/api/accounts";
import { getSubcategories } from "@/api/categories";

import { usePreferences } from "@/context/PreferencesContext";

export default function RecurringTransactions() {
    const { t } = usePreferences();

    const [recurringTransactions, setRecurringTransactions] = useState([]);
    const [loading, setLoading] = useState(false);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    const [transactionToDelete, setTransactionToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const loadRecurringTransactions = useCallback(async () => {
        setLoading(true);

        try {
            const [recurringResponse, accountsData, subcategoriesData] =
                await Promise.all([
                    getRecurringTransactions(),
                    getAccounts(),
                    getSubcategories(),
                ]);

            const recurringData =
                recurringResponse.results ?? recurringResponse;

            const transactionsWithDetails = recurringData.map((transaction) => {
                const accountId =
                    typeof transaction.account === "object"
                        ? transaction.account?.id
                        : transaction.account;

                const subcategoryId =
                    typeof transaction.subcategory === "object"
                        ? transaction.subcategory?.id
                        : transaction.subcategory;

                return {
                    ...transaction,

                    account:
                        typeof transaction.account === "object"
                            ? transaction.account
                            : (accountsData.find(
                                  (account) =>
                                      String(account.id) === String(accountId),
                              ) ?? null),

                    subcategory:
                        typeof transaction.subcategory === "object"
                            ? transaction.subcategory
                            : (subcategoriesData.find(
                                  (subcategory) =>
                                      String(subcategory.id) ===
                                      String(subcategoryId),
                              ) ?? null),
                };
            });

            setRecurringTransactions(transactionsWithDetails);
        } catch (error) {
            console.error("Failed to load recurring transactions:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    /* oxlint-disable react/set-state-in-effect */
    useEffect(() => {
        loadRecurringTransactions();
    }, [loadRecurringTransactions]);
    /* oxlint-enable react/set-state-in-effect */

    const handleAdd = () => {
        setEditingTransaction(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (transaction) => {
        setEditingTransaction(transaction);
        setIsDialogOpen(true);
    };

    const handleDialogOpenChange = (open) => {
        setIsDialogOpen(open);

        if (!open) {
            setEditingTransaction(null);
        }
    };

    const handleDelete = (transaction) => {
        setTransactionToDelete(transaction);
    };

    const handleConfirmDelete = async () => {
        if (!transactionToDelete) {
            return;
        }

        try {
            setDeleting(true);

            await deleteRecurringTransaction(transactionToDelete.id);
            await loadRecurringTransactions();

            setTransactionToDelete(null);
        } catch (error) {
            console.error("Failed to delete recurring transaction:", error);
        } finally {
            setDeleting(false);
        }
    };

    const handleToggleActive = async (transaction, active) => {
        try {
            await updateRecurringTransaction(transaction.id, {
                active,
            });

            setRecurringTransactions((current) =>
                current.map((item) =>
                    item.id === transaction.id ? { ...item, active } : item,
                ),
            );
        } catch (error) {
            console.error("Failed to update recurring transaction:", error);
        }
    };

    return (
        <SidebarProvider>
            <AppSidebar />

            <SidebarInset className="min-h-svh bg-background">
                <SiteHeader
                    title={t("navigation.recurringTransactions")}
                    description={t("recurringTransactions.description")}
                />

                <main className="flex-1 bg-background">
                    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 md:p-6 lg:p-8">
                        <div className="flex justify-end">
                            <Button onClick={handleAdd}>
                                {t("recurringTransactions.add")}
                            </Button>
                        </div>

                        {loading ? (
                            <p>{t("common.loading")}</p>
                        ) : recurringTransactions.length === 0 ? (
                            <p className="text-muted-foreground">
                                {t("recurringTransactions.empty")}
                            </p>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {recurringTransactions.map((transaction) => (
                                    <RecurringTransactionCard
                                        key={transaction.id}
                                        transaction={transaction}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onToggleActive={handleToggleActive}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                <RecurringTransactionDialog
                    open={isDialogOpen}
                    onOpenChange={handleDialogOpenChange}
                    transaction={editingTransaction}
                    onSaved={loadRecurringTransactions}
                />
                <AlertDialog
                    open={Boolean(transactionToDelete)}
                    onOpenChange={(open) => {
                        if (!open && !deleting) {
                            setTransactionToDelete(null);
                        }
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {t("recurringTransactions.deleteTitle")}
                            </AlertDialogTitle>

                            <AlertDialogDescription asChild>
                                <div className="space-y-2">
                                    <p>
                                        {t(
                                            "recurringTransactions.deleteDescription",
                                        )}{" "}
                                        <strong>
                                            {transactionToDelete?.name ||
                                                t(
                                                    "recurringTransactions.unnamed",
                                                )}
                                        </strong>
                                        ?
                                    </p>

                                    <p>
                                        {t(
                                            "recurringTransactions.deleteWarning",
                                        )}
                                    </p>
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={deleting}>
                                {t("common.cancel")}
                            </AlertDialogCancel>

                            <AlertDialogAction
                                disabled={deleting}
                                onClick={handleConfirmDelete}
                            >
                                {deleting
                                    ? t("recurringTransactions.deleting")
                                    : t("common.delete")}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </SidebarInset>
        </SidebarProvider>
    );
}
