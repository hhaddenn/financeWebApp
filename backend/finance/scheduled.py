from django.db import transaction as db_transaction
from django.utils import timezone

from .models import Transaction
from .services import apply_transaction


def process_due_transactions():
	due_transaction_ids = Transaction.objects.filter(
		date__lte=timezone.localdate(),
		applied=False,
		checked=True,
	).values_list("pk", flat=True)

	for transaction_id in due_transaction_ids:
		with db_transaction.atomic():
			transaction = (
				Transaction.objects.select_for_update()
				.filter(
					pk=transaction_id,
					date__lte=timezone.localdate(),
					applied=False,
					checked=True,
				)
				.first()
			)

			if transaction is None:
				continue

			apply_transaction(transaction)

			transaction.applied = True
			transaction.save(update_fields=["applied"])
