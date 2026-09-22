from django.contrib.auth import get_user_model
from django.db import transaction as db_transaction

from .models import (
    Account,
    Category,
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


@db_transaction.atomic
def apply_transaction(transaction):
    accounts = _get_locked_accounts(transaction)
    account = accounts[transaction.account_id]

    if transaction.transaction_type == TransactionType.INCOME:
        account.balance += transaction.amount
        account.save(update_fields=["balance"])

    elif transaction.transaction_type == TransactionType.EXPENSE:
        account.balance -= transaction.amount
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
        account.balance += transaction.amount
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