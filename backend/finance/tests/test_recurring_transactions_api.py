from datetime import date
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.urls import reverse
from rest_framework.test import APITestCase

from finance.models import (
    Account,
    Category,
    RecurringTransaction,
    Subcategory,
    Transaction,
)
from finance.services import (
    calculate_next_run_at,
    create_transaction_from_recurring,
    process_due_recurring_transactions,
    process_recurring_transaction,
)

User = get_user_model()


class RecurringTransactionAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="active",
            email="active@example.com",
            password="StrongPassword1!",
        )

        self.account = Account.objects.create(
            user=self.user,
            name="Main",
            initial_balance=Decimal("100.00"),
            balance=Decimal("100.00"),
            icon="landmark",
        )

        self.another_user = User.objects.create_user(
            username="another_active",
            email="another_active@example.com",
            password="another_StrongPassword1!",
        )

        self.another_account = Account.objects.create(
            user=self.another_user,
            name="Main",
            initial_balance=Decimal("200.00"),
            balance=Decimal("200.00"),
            icon="landmark",
        )

        self.client.force_authenticate(user=self.user)

    def test_user_cannot_update_another_users_recurring_transaction(self):
        recurring_transaction = RecurringTransaction.objects.create(
            user=self.another_user,
            account=self.another_account,
            name="Netflix",
            transaction_type="expense",
            frequency="monthly",
            day_of_month=10,
            amount=Decimal("20.00"),
        )

        url = reverse(
            "recurring-transaction-detail-view",
            args=[recurring_transaction.id],
        )

        response = self.client.patch(
            url,
            {"amount": "40.00"},
            format="json",
        )

        self.assertEqual(response.status_code, 404)

        recurring_transaction.refresh_from_db()
        self.assertEqual(recurring_transaction.amount, Decimal("20.00"))

    def test_user_cannot_delete_another_users_recurring_transaction(self):
        recurring_transaction = RecurringTransaction.objects.create(
            user=self.another_user,
            account=self.another_account,
            name="Netflix",
            transaction_type="expense",
            frequency="monthly",
            day_of_month=10,
            amount=Decimal("20.00"),
        )

        url = reverse(
            "recurring-transaction-detail-view",
            args=[recurring_transaction.id],
        )

        response = self.client.delete(url)

        self.assertEqual(response.status_code, 404)
        self.assertTrue(
            RecurringTransaction.objects.filter(id=recurring_transaction.id).exists()
        )

    def test_user_can_create_recurring_transaction(self):
        url = reverse("recurring-transaction-create-view")

        response = self.client.post(
            url,
            {
                "account": self.account.id,
                "name": "Netflix",
                "transaction_type": "expense",
                "frequency": "monthly",
                "day_of_month": 10,
                "amount": "12.99",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        recurring_transaction = RecurringTransaction.objects.get(id=response.data["id"])

        self.assertEqual(recurring_transaction.user, self.user)
        self.assertEqual(recurring_transaction.account, self.account)
        self.assertEqual(recurring_transaction.name, "Netflix")
        self.assertEqual(recurring_transaction.amount, Decimal("12.99"))
        self.assertEqual(recurring_transaction.transaction_type, "expense")
        self.assertEqual(recurring_transaction.frequency, "monthly")
        self.assertEqual(recurring_transaction.day_of_month, 10)
        self.assertTrue(recurring_transaction.active)

        self.assertIsNotNone(recurring_transaction.next_run_at)
        self.assertEqual(
            recurring_transaction.next_run_at,
            date(2026, 10, 10),
        )

        self.assertIsNotNone(recurring_transaction.next_run_at)

    def test_calculate_next_monthly_run_in_current_month(self):
        recurring_transaction = RecurringTransaction.objects.create(
            user=self.another_user,
            account=self.another_account,
            name="Netflix",
            transaction_type="expense",
            frequency="monthly",
            day_of_month=10,
            amount=Decimal("20.00"),
        )

        result = calculate_next_run_at(
            recurring_transaction,
            reference_date=date(2026, 10, 6),
        )

        self.assertEqual(result, date(2026, 10, 10))

    def test_calculate_next_monthly_run_in_next_month(self):
        recurring_transaction = RecurringTransaction.objects.create(
            user=self.another_user,
            account=self.another_account,
            name="Netflix",
            transaction_type="expense",
            frequency="monthly",
            day_of_month=10,
            amount=Decimal("20.00"),
        )

        result = calculate_next_run_at(
            recurring_transaction,
            reference_date=date(2026, 10, 15),
        )

        self.assertEqual(result, date(2026, 11, 10))

    def test_calculate_next_monthly_run_wraps_to_next_year(self):
        recurring_transaction = RecurringTransaction.objects.create(
            user=self.another_user,
            account=self.another_account,
            name="Netflix",
            transaction_type="expense",
            frequency="monthly",
            day_of_month=10,
            amount=Decimal("20.00"),
        )

        result = calculate_next_run_at(
            recurring_transaction,
            reference_date=date(2026, 12, 20),
        )

        self.assertEqual(result, date(2027, 1, 10))

    def test_calculate_next_weekly_run(self):
        recurring_transaction = RecurringTransaction.objects.create(
            user=self.another_user,
            account=self.another_account,
            name="Netflix",
            transaction_type="expense",
            frequency="weekly",
            day_of_week=4,
            amount=Decimal("20.00"),
        )

        result = calculate_next_run_at(
            recurring_transaction,
            reference_date=date(2026, 10, 6),
        )

        self.assertEqual(result, date(2026, 10, 9))

    def test_calculate_next_yearly_run_in_current_year(self):
        recurring_transaction = RecurringTransaction.objects.create(
            user=self.another_user,
            account=self.another_account,
            name="Netflix",
            transaction_type="expense",
            frequency="yearly",
            month=12,
            day_of_month=25,
            amount=Decimal("20.00"),
        )

        result = calculate_next_run_at(
            recurring_transaction,
            reference_date=date(2026, 10, 6),
        )

        self.assertEqual(result, date(2026, 12, 25))

    def test_calculate_next_yearly_run_in_next_year(self):
        recurring_transaction = RecurringTransaction.objects.create(
            user=self.another_user,
            account=self.another_account,
            name="Netflix",
            transaction_type="expense",
            frequency="yearly",
            month=12,
            day_of_month=25,
            amount=Decimal("20.00"),
        )

        result = calculate_next_run_at(
            recurring_transaction,
            reference_date=date(2026, 12, 30),
        )

        self.assertEqual(result, date(2027, 12, 25))

    def test_updating_schedule_recalculates_next_run_at(self):
        recurring_transaction = RecurringTransaction.objects.create(
            user=self.user,
            account=self.account,
            name="Netflix",
            transaction_type="expense",
            frequency="monthly",
            day_of_month=10,
            amount=Decimal("20.00"),
        )

        url = reverse(
            "recurring-transaction-detail-view",
            args=[recurring_transaction.id],
        )

        with patch(
            "finance.services.timezone.localdate",
            return_value=date(2026, 10, 6),
        ):
            response = self.client.patch(
                url,
                {"day_of_month": 20},
                format="json",
            )

        self.assertEqual(response.status_code, 200)

        recurring_transaction.refresh_from_db()

        self.assertEqual(recurring_transaction.next_run_at, date(2026, 10, 20))

    def test_updating_non_schedule_field_does_not_recalculate_next_run_at(self):
        recurring_transaction = RecurringTransaction.objects.create(
            user=self.user,
            account=self.account,
            name="Netflix",
            transaction_type="expense",
            frequency="monthly",
            day_of_month=10,
            amount=Decimal("20.00"),
            next_run_at=date(2026, 10, 10),
        )

        url = reverse(
            "recurring-transaction-detail-view",
            args=[recurring_transaction.id],
        )

        with patch(
            "finance.services.timezone.localdate",
            return_value=date(2026, 11, 1),
        ):
            response = self.client.patch(
                url,
                {"name": "Netflix Premium"},
                format="json",
            )

        self.assertEqual(response.status_code, 200)

        recurring_transaction.refresh_from_db()

        self.assertEqual(recurring_transaction.next_run_at, date(2026, 10, 10))

    def test_calculate_next_monthly_run_handles_shorter_month(self):
        recurring_transaction = RecurringTransaction.objects.create(
            user=self.user,
            account=self.account,
            name="Netflix",
            transaction_type="expense",
            frequency="monthly",
            day_of_month=31,
            amount=Decimal("20.00"),
        )

        result = calculate_next_run_at(
            recurring_transaction,
            reference_date=date(2026, 2, 1),
        )

        self.assertEqual(
            result,
            date(2026, 2, 28),
        )

    def test_monthly_recurring_transaction_requires_day_of_month(self):
        url = reverse("recurring-transaction-create-view")

        response = self.client.post(
            url,
            {
                "account": self.account.id,
                "name": "Netflix",
                "transaction_type": "expense",
                "frequency": "monthly",
                "amount": "12.99",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_yearly_recurring_transaction_requires_day_of_month(self):
        url = reverse("recurring-transaction-create-view")

        response = self.client.post(
            url,
            {
                "account": self.account.id,
                "name": "Insurance",
                "transaction_type": "expense",
                "frequency": "yearly",
                "month": 3,
                "amount": "120.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_calculate_next_yearly_run_handles_non_leap_year(self):
        recurring_transaction = RecurringTransaction.objects.create(
            user=self.user,
            account=self.account,
            name="Netflix",
            transaction_type="expense",
            frequency="yearly",
            month=2,
            day_of_month=29,
            amount=Decimal("20.00"),
        )

        result = calculate_next_run_at(
            recurring_transaction,
            reference_date=date(2026, 1, 1),
        )

        self.assertEqual(
            result,
            date(2026, 2, 28),
        )

    def test_calculate_next_yearly_run_handles_non_leap_next_year(self):
        recurring_transaction = RecurringTransaction.objects.create(
            user=self.user,
            account=self.account,
            name="Netflix",
            transaction_type="expense",
            frequency="yearly",
            month=2,
            day_of_month=29,
            amount=Decimal("20.00"),
        )

        result = calculate_next_run_at(
            recurring_transaction,
            reference_date=date(2026, 3, 1),
        )

        self.assertEqual(
            result,
            date(2027, 2, 28),
        )

    def test_calculate_next_yearly_run_keeps_leap_day_in_leap_year(self):
        recurring_transaction = RecurringTransaction.objects.create(
            user=self.user,
            account=self.account,
            name="Netflix",
            transaction_type="expense",
            frequency="yearly",
            month=2,
            day_of_month=29,
            amount=Decimal("20.00"),
        )

        result = calculate_next_run_at(
            recurring_transaction,
            reference_date=date(2028, 1, 1),
        )

        self.assertEqual(
            result,
            date(2028, 2, 29),
        )

    def test_user_cannot_create_recurring_transaction_with_another_users_account(self):
        url = reverse("recurring-transaction-create-view")

        response = self.client.post(
            url,
            {
                "account": self.another_account.id,
                "name": "Netflix",
                "transaction_type": "expense",
                "frequency": "monthly",
                "day_of_month": 10,
                "amount": "12.99",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(
            RecurringTransaction.objects.filter(
                user=self.user,
                account=self.another_account,
            ).exists()
        )

    def test_list_returns_only_authenticated_users_recurring_transactions(self):
        own_recurring = RecurringTransaction.objects.create(
            user=self.user,
            account=self.account,
            name="Netflix",
            transaction_type="expense",
            frequency="monthly",
            day_of_month=10,
            amount=Decimal("12.99"),
        )

        RecurringTransaction.objects.create(
            user=self.another_user,
            account=self.another_account,
            name="Spotify",
            transaction_type="expense",
            frequency="monthly",
            day_of_month=15,
            amount=Decimal("9.99"),
        )

        url = reverse("recurring-transactions-view")
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["id"],
            own_recurring.id,
        )

    def test_create_transaction_from_recurring_transaction(self):
        category = Category.objects.create(
            name="Entertainment",
            icon="tv",
            category_type="expense",
        )

        subcategory = Subcategory.objects.create(
            name="Streaming",
            icon="play",
            category=category,
        )

        recurring_transaction = RecurringTransaction.objects.create(
            user=self.user,
            account=self.account,
            name="Netflix",
            transaction_type="expense",
            subcategory=subcategory,
            frequency="monthly",
            day_of_month=10,
            amount=Decimal("20.00"),
            next_run_at=date(2026, 10, 10),
        )

        transaction = create_transaction_from_recurring(recurring_transaction)

        self.assertEqual(transaction.name, recurring_transaction.name)
        self.assertEqual(transaction.date, recurring_transaction.next_run_at)
        self.assertEqual(
            transaction.amount,
            recurring_transaction.amount,
        )
        self.assertEqual(
            transaction.transaction_type,
            recurring_transaction.transaction_type,
        )
        self.assertEqual(
            transaction.account,
            recurring_transaction.account,
        )
        self.assertEqual(
            transaction.counterparty,
            recurring_transaction.counterparty,
        )
        self.assertEqual(
            transaction.subcategory,
            recurring_transaction.subcategory,
        )
        self.assertFalse(transaction.applied)
        self.assertFalse(transaction.checked)
        self.assertTrue(Transaction.objects.filter(id=transaction.id).exists())
        self.assertEqual(
            transaction.subcategory,
            recurring_transaction.subcategory,
        )

    def test_processing_recurring_transaction_advances_next_run_date(self):
        recurring_transaction = RecurringTransaction.objects.create(
            user=self.user,
            account=self.account,
            name="Netflix",
            transaction_type="expense",
            frequency="monthly",
            day_of_month=10,
            amount=Decimal("20.00"),
            next_run_at=date(2026, 10, 10),
        )

        transaction = process_recurring_transaction(recurring_transaction)

        recurring_transaction.refresh_from_db()

        self.assertEqual(
            transaction.date,
            date(2026, 10, 10),
        )

        self.assertEqual(
            recurring_transaction.next_run_at,
            date(2026, 11, 10),
        )

    def test_process_due_recurring_transactions_only_processes_due_active_rules(self):
        due_recurring = RecurringTransaction.objects.create(
            user=self.user,
            account=self.account,
            name="Netflix",
            transaction_type="expense",
            frequency="monthly",
            day_of_month=10,
            amount=Decimal("20.00"),
            next_run_at=date(2026, 10, 10),
            active=True,
        )

        RecurringTransaction.objects.create(
            user=self.user,
            account=self.account,
            name="Spotify",
            transaction_type="expense",
            frequency="monthly",
            day_of_month=15,
            amount=Decimal("10.00"),
            next_run_at=date(2026, 10, 15),
            active=True,
        )

        RecurringTransaction.objects.create(
            user=self.user,
            account=self.account,
            name="Inactive subscription",
            transaction_type="expense",
            frequency="monthly",
            day_of_month=10,
            amount=Decimal("5.00"),
            next_run_at=date(2026, 10, 10),
            active=False,
        )

        transactions = process_due_recurring_transactions(
            reference_date=date(2026, 10, 10),
        )

        self.assertEqual(len(transactions), 1)
        self.assertEqual(transactions[0].name, "Netflix")

        self.assertEqual(Transaction.objects.count(), 1)

        due_recurring.refresh_from_db()

        self.assertEqual(
            due_recurring.next_run_at,
            date(2026, 11, 10),
        )

    def test_process_due_recurring_transactions_catches_up_missed_occurrences(self):
        recurring_transaction = RecurringTransaction.objects.create(
            user=self.user,
            account=self.account,
            name="Netflix",
            transaction_type="expense",
            frequency="monthly",
            day_of_month=10,
            amount=Decimal("20.00"),
            next_run_at=date(2026, 8, 10),
            active=True,
        )

        transactions = process_due_recurring_transactions(
            reference_date=date(2026, 10, 20),
        )

        self.assertEqual(len(transactions), 3)

        transaction_dates = list(
            Transaction.objects.order_by("date").values_list("date", flat=True)
        )

        self.assertEqual(
            transaction_dates,
            [
                date(2026, 8, 10),
                date(2026, 9, 10),
                date(2026, 10, 10),
            ],
        )

        recurring_transaction.refresh_from_db()

        self.assertEqual(
            recurring_transaction.next_run_at,
            date(2026, 11, 10),
        )

    def test_management_command_processes_due_recurring_transactions(self):
        recurring_transaction = RecurringTransaction.objects.create(
            user=self.user,
            account=self.account,
            name="Netflix",
            transaction_type="expense",
            frequency="monthly",
            day_of_month=10,
            amount=Decimal("20.00"),
            next_run_at=date(2026, 10, 10),
            active=True,
        )

        with patch(
            "finance.services.timezone.localdate",
            return_value=date(2026, 10, 10),
        ):
            call_command("process_recurring_transactions")

        recurring_transaction.refresh_from_db()

        self.assertEqual(
            recurring_transaction.next_run_at,
            date(2026, 11, 10),
        )

        self.assertEqual(Transaction.objects.count(), 1)
