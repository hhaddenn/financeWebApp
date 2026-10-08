from django.core.management.base import BaseCommand

from finance.services import process_due_recurring_transactions


class Command(BaseCommand):
    help = "Process due recurring transactions"

    def handle(self, *args, **kwargs):
      transactions = process_due_recurring_transactions()

      self.stdout.write(
         self.style.SUCCESS(
               f"Processed {len(transactions)} recurring transaction(s)."
         )
      )