from calendar import monthrange
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.db import transaction as db_transaction
from django.utils import timezone

from .models import (
    Account,
    Category,
    RecurringTransaction,
    Subcategory,
    Transaction,
    TransactionType,
    UserCategoryPreference,
    UserSubcategoryPreference,
)

DEFAULT_CATEGORY_COLORS = [
    "#EF4444",
    "#F97316",
    "#EAB308",
    "#22C55E",
    "#14B8A6",
    "#3B82F6",
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
    "#64748B",
]


def _get_locked_accounts(transaction):
    """
    Lock all accounts affected by this transaction.

    Accounts are locked in ID order so concurrent transfers
    involving the same accounts are less likely to deadlock.
    """
    account_ids = {transaction.account_id}

    if transaction.transaction_type == TransactionType.TRANSFER:
        if transaction.transfer_account_id is None:
            raise ValueError("Transfer destination account is required.")

        account_ids.add(transaction.transfer_account_id)

    account_ids.discard(None)

    accounts = (
        Account.objects
        .select_for_update()
        .filter(id__in=account_ids)
        .order_by("id")
    )

    accounts = {account.id: account for account in accounts}

    if transaction.account_id not in accounts:
        raise ValueError("Transaction source account does not exist.")

    if (
        transaction.transaction_type == TransactionType.TRANSFER
        and transaction.transfer_account_id not in accounts
    ):
        raise ValueError("Transaction destination account does not exist.")

    return accounts


def calculate_next_run_at(recurring_transaction, reference_date=None):
    if reference_date is None:
        reference_date = timezone.localdate()

    if recurring_transaction.frequency == "weekly":
        current_weekday = reference_date.weekday()
        target_weekday = recurring_transaction.day_of_week

        days_ahead = target_weekday - current_weekday
        if days_ahead < 0:
            days_ahead += 7

        next_date = reference_date + timedelta(days=days_ahead)
        return next_date

    if recurring_transaction.frequency == "monthly":
        day = recurring_transaction.day_of_month

        year = reference_date.year
        month = reference_date.month

        if reference_date.day > day:
            if month == 12:
                month = 1
                year += 1
            else:
                month += 1
        last_day = monthrange(year, month)[1]
        effective_day = min(day, last_day)

        next_date = date(year, month, effective_day)
        return next_date

    if recurring_transaction.frequency == "yearly":
        month = recurring_transaction.month
        day = recurring_transaction.day_of_month

        year = reference_date.year

        last_day = monthrange(year, month)[1]
        effective_day = min(day, last_day)

        next_date = date(
            year,
            month,
            effective_day,
        )

        if next_date < reference_date:
            year += 1

            last_day = monthrange(year, month)[1]
            effective_day = min(day, last_day)

            next_date = date(
                year,
                month,
                effective_day,
            )

        return next_date

    raise ValueError("Unsupported recurrence frequency.")


def create_transaction_from_recurring(recurring_transaction):
    return Transaction.objects.create(
        name=recurring_transaction.name,
        amount=recurring_transaction.amount,
        subcategory=recurring_transaction.subcategory,
        transaction_type=recurring_transaction.transaction_type,
        date=recurring_transaction.next_run_at,
        account=recurring_transaction.account,
        counterparty=recurring_transaction.counterparty,
        applied=False,
        checked=False,
    )

@db_transaction.atomic
def process_recurring_transaction(recurring_transaction):
    if recurring_transaction.next_run_at is None:
        raise ValueError("Recurring transaction has no next run date.")

    transaction = create_transaction_from_recurring(
        recurring_transaction
    )

    reference_date = (
        recurring_transaction.next_run_at
        + timedelta(days=1)
    )

    recurring_transaction.next_run_at = calculate_next_run_at(
        recurring_transaction,
        reference_date=reference_date,
    )

    recurring_transaction.save(
        update_fields=["next_run_at"]
    )

    return transaction

@db_transaction.atomic
def process_due_recurring_transactions(reference_date=None):
    if reference_date is None:
        reference_date = timezone.localdate()

    recurring_transactions = RecurringTransaction.objects.select_for_update().filter(
        active=True,
        next_run_at__lte=reference_date,
    )

    transactions = []

    for recurring_transaction in recurring_transactions:
        while (
            recurring_transaction.next_run_at is not None
            and recurring_transaction.next_run_at <= reference_date
        ):
            transaction = process_recurring_transaction(
                recurring_transaction
            )
            transactions.append(transaction)

    return transactions

@db_transaction.atomic
def apply_transaction(transaction):
    accounts = _get_locked_accounts(transaction)
    account = accounts[transaction.account_id]

    if transaction.transaction_type == TransactionType.INCOME:
        account.balance += transaction.amount
        account.save(update_fields=["balance"])

    elif transaction.transaction_type == TransactionType.EXPENSE:
        net_amount = transaction.amount - transaction.amount_to_receive
        account.balance -= net_amount
        account.save(update_fields=["balance"])

    elif transaction.transaction_type == TransactionType.TRANSFER:
        transfer_account = accounts[transaction.transfer_account_id]

        if account.id == transfer_account.id:
            raise ValueError("Cannot transfer to the same account.")

        # Remove from source
        account.balance -= transaction.amount

        # Add the exact same amount to destination
        transfer_account.balance += transaction.amount

        account.save(update_fields=["balance"])
        transfer_account.save(update_fields=["balance"])

    return transaction


@db_transaction.atomic
def reverse_transaction(transaction):
    accounts = _get_locked_accounts(transaction)
    account = accounts[transaction.account_id]

    if transaction.transaction_type == TransactionType.INCOME:
        account.balance -= transaction.amount
        account.save(update_fields=["balance"])

    elif transaction.transaction_type == TransactionType.EXPENSE:
        net_amount = transaction.amount - transaction.amount_to_receive
        account.balance += net_amount
        account.save(update_fields=["balance"])

    elif transaction.transaction_type == TransactionType.TRANSFER:
        transfer_account = accounts[transaction.transfer_account_id]

        if account.id == transfer_account.id:
            raise ValueError("Cannot transfer to the same account.")

        # Put the amount back into source
        account.balance += transaction.amount

        # Remove the same amount from destination
        transfer_account.balance -= transaction.amount

        account.save(update_fields=["balance"])
        transfer_account.save(update_fields=["balance"])

    return transaction


@db_transaction.atomic
def sync_user_preferences(user):
    """
    Ensure that a user has preferences for every global
    category and subcategory.
    """

    existing_category_ids = set(
        UserCategoryPreference.objects
        .filter(user=user)
        .values_list("category_id", flat=True)
    )

    categories = (
        Category.objects
        .exclude(id__in=existing_category_ids)
        .order_by("id")
    )

    UserCategoryPreference.objects.bulk_create(
        [
            UserCategoryPreference(
                user=user,
                category=category,
                color=DEFAULT_CATEGORY_COLORS[
                    index % len(DEFAULT_CATEGORY_COLORS)
                ],
            )
            for index, category in enumerate(categories)
        ],
        ignore_conflicts=True,
    )

    existing_subcategory_ids = set(
        UserSubcategoryPreference.objects
        .filter(user=user)
        .values_list("subcategory_id", flat=True)
    )

    subcategories = (
        Subcategory.objects
        .exclude(id__in=existing_subcategory_ids)
        .order_by("id")
    )

    UserSubcategoryPreference.objects.bulk_create(
        [
            UserSubcategoryPreference(
                user=user,
                subcategory=subcategory,
            )
            for subcategory in subcategories
        ],
        ignore_conflicts=True,
    )


@db_transaction.atomic
def sync_category_preferences(category):
    """
    Create the preference for a newly created global category
    for all existing users.
    """
    User = get_user_model()

    users = User.objects.all()

    existing_user_ids = set(
        UserCategoryPreference.objects
        .filter(category=category)
        .values_list("user_id", flat=True)
    )

    users = users.exclude(id__in=existing_user_ids)

    UserCategoryPreference.objects.bulk_create(
        [
            UserCategoryPreference(
                user=user,
                category=category,
                color=DEFAULT_CATEGORY_COLORS[
                    index % len(DEFAULT_CATEGORY_COLORS)
                ],
            )
            for index, user in enumerate(users)
        ],
        ignore_conflicts=True,
    )


@db_transaction.atomic
def sync_subcategory_preferences(subcategory):
    """
    Create the preference for a newly created global subcategory
    for all existing users.
    """
    User = get_user_model()

    users = User.objects.all()

    existing_user_ids = set(
        UserSubcategoryPreference.objects
        .filter(subcategory=subcategory)
        .values_list("user_id", flat=True)
    )

    users = users.exclude(id__in=existing_user_ids)

    UserSubcategoryPreference.objects.bulk_create(
        [
            UserSubcategoryPreference(
                user=user,
                subcategory=subcategory,
            )
            for user in users
        ],
        ignore_conflicts=True,
    )