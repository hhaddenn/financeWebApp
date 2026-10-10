/* oxlint-disable react/set-state-in-effect */
import { useCallback, useEffect, useState } from "react";

import {
    Banknote,
    ChartNoAxesCombined,
    CreditCard,
    EllipsisVerticalIcon,
    Landmark,
    PiggyBank,
    Plus,
    Wallet,
} from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

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

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    getAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
} from "@/api/accounts";

import { usePreferences } from "@/context/PreferencesContext";
import { buildAccountPayload } from "@/utils/accountPayload";

const MAX_ACCOUNT_NAME_LENGTH = 50;
const MIN_BALANCE = -999999999;
const MAX_BALANCE = 999999999;

const accountIcons = {
    landmark: Landmark,
    wallet: Wallet,
    credit_card: CreditCard,
    piggy_bank: PiggyBank,
    banknote: Banknote,
    investment: ChartNoAxesCombined,
};

const iconOptions = [
    {
        value: "landmark",
        label: "bank",
        icon: Landmark,
    },
    {
        value: "wallet",
        label: "wallet",
        icon: Wallet,
    },
    {
        value: "credit_card",
        label: "creditCard",
        icon: CreditCard,
    },
    {
        value: "piggy_bank",
        label: "piggyBank",
        icon: PiggyBank,
    },
    {
        value: "banknote",
        label: "money",
        icon: Banknote,
    },
    {
        value: "investment",
        label: "investment",
        icon: ChartNoAxesCombined,
    },
];

const DEFAULT_FORM = {
    name: "",
    balance: "",
    icon: "landmark",
};

export function SectionCards({ onAccountDeleted }) {
    const { language, t } = usePreferences();

    const locale = language === "pt" ? "pt-PT" : "en-US";

    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Create / Edit
    const [dialogOpen, setDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);

    // Delete
    const [accountToDelete, setAccountToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Error
    const [errorDialogOpen, setErrorDialogOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Form
    const [form, setForm] = useState(DEFAULT_FORM);

    const showError = useCallback(
        (error) => {
            // Não mostrar error.message ao utilizador.
            // Pode conter detalhes técnicos do backend.
            console.error(error);

            const status = error?.response?.status;
            const data = error?.response?.data;

            let message = t("accounts.unexpectedError");

            // Apenas tratar respostas de erro esperadas da API.
            if (status >= 400 && status < 500 && data) {
                if (typeof data.detail === "string") {
                    message = data.detail;
                } else if (typeof data === "object") {
                    const messages = Object.values(data)
                        .flat()
                        .filter((value) => typeof value === "string");

                    if (messages.length > 0) {
                        message = messages.join("\n");
                    }
                }
            }

            setErrorMessage(message);
            setErrorDialogOpen(true);
        },
        [t],
    );

    const loadAccounts = useCallback(async () => {
        try {
            setLoading(true);

            const data = await getAccounts();

            // Garantir que o estado recebe sempre um array.
            setAccounts(Array.isArray(data) ? data : []);
        } catch (error) {
            showError(error);
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

    const resetForm = () => {
        setForm({ ...DEFAULT_FORM });
        setEditingAccount(null);
    };

    const handleOpenCreate = () => {
        resetForm();
        setDialogOpen(true);
    };

    const handleOpenEdit = (account) => {
        setEditingAccount(account);

        setForm({
            name: account.name ?? "",
            balance: account.balance ?? "",
            icon: accountIcons[account.icon] ? account.icon : DEFAULT_FORM.icon,
        });

        setDialogOpen(true);
    };

    const handleDialogChange = (open) => {
        if (saving) {
            return;
        }

        setDialogOpen(open);

        if (!open) {
            resetForm();
        }
    };

    const validateForm = () => {
        const name = form.name.trim();
        const balanceText = String(form.balance).trim();

        if (!name) {
            return t("accounts.nameRequired");
        }

        if (name.length > MAX_ACCOUNT_NAME_LENGTH) {
            return t("accounts.nameTooLong");
        }

        // Campo vazio significa 0.
        const balance = balanceText === "" ? 0 : Number(balanceText);

        if (!Number.isFinite(balance)) {
            return t("accounts.invalidBalance");
        }

        if (balance < MIN_BALANCE || balance > MAX_BALANCE) {
            return t("accounts.invalidBalance");
        }

        if (!Object.prototype.hasOwnProperty.call(accountIcons, form.icon)) {
            return t("accounts.invalidIcon");
        }

        return null;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (saving) {
            return;
        }

        const validationError = validateForm();

        if (validationError) {
            setErrorMessage(validationError);
            setErrorDialogOpen(true);
            return;
        }

        try {
            setSaving(true);

            const payload = buildAccountPayload(form);

            if (editingAccount) {
                await updateAccount(editingAccount.id, payload);
            } else {
                await createAccount(payload);
            }

            resetForm();
            setDialogOpen(false);

            await loadAccounts();
        } catch (error) {
            showError(error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRequest = (account) => {
        if (deleting) {
            return;
        }

        setAccountToDelete(account);
    };

    const handleDeleteConfirm = async () => {
        if (!accountToDelete || deleting) {
            return;
        }

        try {
            setDeleting(true);

            await deleteAccount(accountToDelete.id);

            setAccountToDelete(null);

            await loadAccounts();

            onAccountDeleted?.();
        } catch (error) {
            showError(error);
        } finally {
            setDeleting(false);
        }
    };

    const formattedCurrency = new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EUR",
    });

    if (loading) {
        return <p>{t("accounts.loading")}</p>;
    }

    const sortedAccounts = [...accounts].sort((a, b) =>
        a.name.localeCompare(b.name, language === "pt" ? "pt-PT" : "en-US", {
            sensitivity: "base",
        }),
    );

    return (
        <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {sortedAccounts.map((account) => {
                    const Icon = accountIcons[account.icon] || Landmark;

                    return (
                        <Card key={account.id} className="shadow-none">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                                            <Icon
                                                className="size-5 text-muted-foreground"
                                                aria-hidden="true"
                                            />
                                        </div>

                                        <p
                                            className="truncate text-sm text-muted-foreground"
                                            title={account.name}
                                        >
                                            {account.name}
                                        </p>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger
                                            render={
                                                <Button
                                                    variant="ghost"
                                                    className="size-8 shrink-0 text-muted-foreground"
                                                    size="icon"
                                                >
                                                    <EllipsisVerticalIcon aria-hidden="true" />

                                                    <span className="sr-only">
                                                        {t("accounts.openMenu")}
                                                    </span>
                                                </Button>
                                            }
                                        />

                                        <DropdownMenuContent
                                            align="end"
                                            className="w-32"
                                        >
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    handleOpenEdit(account)
                                                }
                                                disabled={deleting || saving}
                                            >
                                                {t("common.edit")}
                                            </DropdownMenuItem>

                                            <DropdownMenuSeparator />

                                            <DropdownMenuItem
                                                variant="destructive"
                                                disabled={deleting || saving}
                                                onClick={() =>
                                                    handleDeleteRequest(account)
                                                }
                                            >
                                                {t("common.delete")}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>

                            <CardContent>
                                <p className="text-2xl font-semibold tracking-tight tabular-nums">
                                    {formattedCurrency.format(
                                        Number(account.balance) || 0,
                                    )}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}

                <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="
            flex min-h-37.5 cursor-pointer flex-col
            items-center justify-center rounded-xl
            border border-dashed bg-transparent
            transition-colors hover:bg-muted/50
          "
                >
                    <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted">
                        <Plus
                            className="size-5 text-muted-foreground"
                            aria-hidden="true"
                        />
                    </div>

                    <span className="text-sm font-medium">
                        {t("accounts.addAccount")}
                    </span>

                    <span className="mt-1 text-center text-xs text-muted-foreground">
                        {t("accounts.createDescription")}
                    </span>
                </button>
            </div>

            {/* Create / Edit */}
            <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
                <DialogContent className="sm:max-w-106.25">
                    <form onSubmit={handleSubmit} noValidate>
                        <DialogHeader>
                            <DialogTitle>
                                {editingAccount
                                    ? t("accounts.editAccount")
                                    : t("accounts.newAccount")}
                            </DialogTitle>

                            <DialogDescription>
                                {editingAccount
                                    ? t("accounts.editDescription")
                                    : t("accounts.newDescription")}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-5 py-6">
                            {/* Name */}
                            <div className="grid gap-2">
                                <Label htmlFor="account-name">
                                    {t("accounts.name")}
                                </Label>

                                <Input
                                    id="account-name"
                                    name="account-name"
                                    placeholder={t("accounts.namePlaceholder")}
                                    value={form.name}
                                    maxLength={MAX_ACCOUNT_NAME_LENGTH}
                                    disabled={saving}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            name: event.target.value,
                                        }))
                                    }
                                    required
                                />

                                <p className="text-xs text-muted-foreground">
                                    {form.name.length}/{MAX_ACCOUNT_NAME_LENGTH}
                                </p>
                            </div>

                            {/* Balance */}
                            <div className="grid gap-2">
                                <Label htmlFor="account-balance">
                                    {editingAccount
                                        ? t("accounts.currentBalance")
                                        : t("accounts.initialBalance")}
                                </Label>

                                <Input
                                    id="account-balance"
                                    name="account-balance"
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    min={MIN_BALANCE}
                                    max={MAX_BALANCE}
                                    placeholder="0.00"
                                    value={form.balance}
                                    disabled={saving}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            balance: event.target.value,
                                        }))
                                    }
                                />
                            </div>

                            {/* Icon */}
                            <div className="grid gap-2">
                                <Label>{t("accounts.icon")}</Label>

                                <div
                                    className="grid grid-cols-3 gap-2 sm:grid-cols-6"
                                    role="radiogroup"
                                    aria-label={t("accounts.icon")}
                                >
                                    {iconOptions.map((option) => {
                                        const Icon = option.icon;
                                        const selected =
                                            form.icon === option.value;

                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                title={t(
                                                    `accounts.icons.${option.label}`,
                                                )}
                                                aria-label={t(
                                                    `accounts.icons.${option.label}`,
                                                )}
                                                aria-checked={selected}
                                                role="radio"
                                                disabled={saving}
                                                onClick={() =>
                                                    setForm((current) => ({
                                                        ...current,
                                                        icon: option.value,
                                                    }))
                                                }
                                                className={`
                          flex size-12 items-center justify-center
                          rounded-md border transition-colors
                          disabled:pointer-events-none disabled:opacity-50
                          ${
                              selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "hover:bg-muted"
                          }
                        `}
                                            >
                                                <Icon
                                                    className="size-5"
                                                    aria-hidden="true"
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleDialogChange(false)}
                                disabled={saving}
                            >
                                {t("common.cancel")}
                            </Button>

                            <Button type="submit" disabled={saving}>
                                {saving
                                    ? t("accounts.saving")
                                    : editingAccount
                                      ? t("accounts.saveChanges")
                                      : t("accounts.createAccount")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <AlertDialog
                open={accountToDelete !== null}
                onOpenChange={(open) => {
                    if (!open && !deleting) {
                        setAccountToDelete(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t("accounts.deleteTitle")}
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            {t("accounts.deleteDescription")}{" "}
                            <span className="font-medium text-foreground">
                                "{accountToDelete?.name}"
                            </span>
                            ?
                            <br />
                            <br />
                            {t("accounts.deleteWarning")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>
                            {t("common.cancel")}
                        </AlertDialogCancel>

                        <AlertDialogAction
                            variant="destructive"
                            disabled={deleting}
                            onClick={handleDeleteConfirm}
                        >
                            {deleting
                                ? t("accounts.deleting")
                                : t("common.delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Error */}
            <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
                <DialogContent className="sm:max-w-106.25">
                    <DialogHeader>
                        <DialogTitle>{t("accounts.errorTitle")}</DialogTitle>

                        <DialogDescription
                            className="whitespace-pre-line"
                            role="alert"
                        >
                            {errorMessage}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            type="button"
                            onClick={() => setErrorDialogOpen(false)}
                        >
                            OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
