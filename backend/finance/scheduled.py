from django.utils import timezone

from .models import Transaction
from .services import apply_transaction


def process_due_transactions():
    transactions = Transaction.objects.filter(
        date__lte=timezone.localdate(),
        applied=False,
        checked=True
    )

    for transaction in transactions:
        apply_transaction(transaction)

        transaction.applied = True
        transaction.save(update_fields=["applied"])