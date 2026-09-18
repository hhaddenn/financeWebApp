from django.db import transaction as db_transaction

from .models import Account, Transaction, TransactionType


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
        Account.objects.select_for_update().filter(id__in=account_ids).order_by("id")
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
