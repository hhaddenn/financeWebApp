from django.db import transaction as db_transaction

from .models import Transaction, TransactionType


def apply_transaction(transaction):
    if transaction.transaction_type == TransactionType.INCOME:
        transaction.account.balance += transaction.amount
        transaction.account.save(update_fields=["balance"])

    elif transaction.transaction_type == TransactionType.EXPENSE:
        transaction.account.balance -= transaction.amount
        transaction.account.save(update_fields=["balance"])

    elif transaction.transaction_type == TransactionType.TRANSFER:
        transaction.account.balance -= transaction.amount
        transaction.account.save(update_fields=["balance"])

        transaction.transfer_account.balance += transaction.amount_to_receive
        transaction.transfer_account.save(update_fields=["balance"])


def reverse_transaction(transaction):
    if transaction.transaction_type == TransactionType.INCOME:
        transaction.account.balance -= transaction.amount
        transaction.account.save(update_fields=["balance"])

    elif transaction.transaction_type == TransactionType.EXPENSE:
        transaction.account.balance += transaction.amount
        transaction.account.save(update_fields=["balance"])

    elif transaction.transaction_type == TransactionType.TRANSFER:
        transaction.account.balance += transaction.amount
        transaction.account.save(update_fields=["balance"])

        transaction.transfer_account.balance -= transaction.amount_to_receive
        transaction.transfer_account.save(update_fields=["balance"])
