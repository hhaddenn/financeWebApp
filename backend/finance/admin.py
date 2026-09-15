from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import (
    Account,
    Budget,
    Category,
    RecurringTransaction,
    Subcategory,
    Transaction,
    User,
)

# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "username",
        "email",
        "is_active",
        "is_staff",
        "date_joined",
    )

    list_filter = (
        "is_active",
        "is_staff",
        "is_superuser",
        "date_joined",
    )

    search_fields = (
        "username",
        "email",
    )

    ordering = ("username",)

    readonly_fields = (
        "last_login",
        "date_joined",
    )


# ---------------------------------------------------------------------------
# Account
# ---------------------------------------------------------------------------


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "user",
        "balance",
        "initial_balance",
        "icon",
    )

    list_filter = (
        "user",
    )

    search_fields = (
        "name",
        "user__username",
        "user__email",
    )

    ordering = (
        "user",
        "name",
    )


# ---------------------------------------------------------------------------
# Category
# ---------------------------------------------------------------------------


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category_type",
        "description",
        "icon",
    )

    list_filter = (
        "category_type",
    )

    search_fields = (
        "name",
        "description",
    )

    ordering = (
        "category_type",
        "name",
    )


# ---------------------------------------------------------------------------
# Subcategory
# ---------------------------------------------------------------------------


@admin.register(Subcategory)
class SubcategoryAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "get_category_type",
    )

    list_filter = (
        "category",
        "category__category_type",
    )

    search_fields = (
        "name",
        "category__name",
    )

    ordering = (
        "category",
        "name",
    )

    @admin.display(description="Type")
    def get_category_type(self, obj):
        return obj.category.category_type


# ---------------------------------------------------------------------------
# Transaction
# ---------------------------------------------------------------------------


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "transaction_type",
        "amount",
        "amount_to_receive",
        "account",
        "transfer_account",
        "subcategory",
        "date",
    )

    list_filter = (
        "transaction_type",
        "account",
        "subcategory",
        "date",
    )

    search_fields = (
        "name",
        "counterparty",
        "description",
        "account__name",
        "account__user__username",
        "account__user__email",
    )

    date_hierarchy = "date"

    ordering = (
        "-date",
    )

    autocomplete_fields = (
        "account",
        "transfer_account",
        "subcategory",
    )


# ---------------------------------------------------------------------------
# Budget
# ---------------------------------------------------------------------------


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "user",
        "budget_type",
        "amount",
        "category",
        "subcategory",
        "start_date",
        "end_date",
    )

    list_filter = (
        "budget_type",
        "start_date",
        "end_date",
    )

    search_fields = (
        "name",
        "user__username",
        "user__email",
        "category__name",
        "subcategory__name",
    )

    ordering = (
        "-start_date",
    )

    autocomplete_fields = (
        "user",
        "category",
        "subcategory",
    )


# ---------------------------------------------------------------------------
# Recurring transactions
# ---------------------------------------------------------------------------


@admin.register(RecurringTransaction)
class RecurringTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "user",
        "transaction_type",
        "amount",
        "account",
        "frequency",
        "next_run_at",
        "active",
    )

    list_filter = (
        "transaction_type",
        "frequency",
        "active",
        "account",
    )

    search_fields = (
        "name",
        "counterparty",
        "user__username",
        "user__email",
        "account__name",
        "subcategory__name",
    )

    ordering = (
        "next_run_at",
    )

    autocomplete_fields = (
        "user",
        "account",
        "subcategory",
    )
