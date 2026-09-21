from celery import shared_task

from .scheduled import process_due_transactions


@shared_task
def process_due_transactions_task():
    process_due_transactions()