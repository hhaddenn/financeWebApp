import { EllipsisVerticalIcon, Eye, EyeOff } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { iconMap } from "@/lib/icons";

import { useState } from "react";

export default function AccountCard({
    account,
    balanceText,
    onEdit,
    onDelete,
    actionsDisabled,
    t,
}) {
    const Icon = iconMap[account.icon] || iconMap.landmark;

    const [showBalance, setShowBalance] = useState(false);

    return (
        <Card className="shadow-none">
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

                        <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem
                                onClick={onEdit}
                                disabled={actionsDisabled}
                            >
                                {t("common.edit")}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                variant="destructive"
                                disabled={actionsDisabled}
                                onClick={onDelete}
                            >
                                {t("common.delete")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent>
                <div className="flex items-center justify-between gap-2">
                    <p className="text-2xl font-semibold tracking-tight tabular-nums">
                        {showBalance ? balanceText : "**********"}
                    </p>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowBalance((previous) => !previous)}
                        aria-label={
                            showBalance
                                ? t("accounts.hideBalance")
                                : t("accounts.showBalance")
                        }
                    >
                        {showBalance ? <EyeOff /> : <Eye />}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
