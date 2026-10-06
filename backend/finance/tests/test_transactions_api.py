from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from finance.models import Account, Transaction, TransactionType
from finance.services import apply_transaction

User = get_user_model()

class TransactionAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="active",
            email="active@example.com",
            password="StrongPassword1!",
        )
        
        self.account = Account.objects.create(
            name="Account Test",
            user=self.user,
            initial_balance=Decimal("100.00"),
            balance=Decimal("100.00"),
            icon="landmark"
        )
        
        self.client.force_authenticate(user=self.user)
        
    def create_applied_expense(self):
        transaction = Transaction.objects.create(
            transaction_type=TransactionType.EXPENSE,
            amount=Decimal("25.00"),
            date=timezone.localdate(),
            account=self.account,
            checked=True,
        )

        apply_transaction(transaction)

        transaction.applied = True
        transaction.save(update_fields=("applied",))

        self.account.refresh_from_db()

        return transaction
    
    def test_updating_applied_transaction_recalculates_balance(self):
        transaction = self.create_applied_expense()
        
        url = reverse(
            "transaction-retrieve-update-destroy-view",
            args=[transaction.id],
        )
        
        response = self.client.patch(
            url,
            {"amount": "40.00"},
            format="json",
        )
        
        self.account.refresh_from_db()
        transaction.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.account.balance, Decimal("60.00"))
        self.assertEqual(transaction.amount, Decimal("40.00"))
        self.assertTrue(transaction.applied) 
        self.assertEqual(
            response.data["account"]["balance"],
            "60.00",
        )
    
    def test_deleting_applied_transaction_restores_balance(self):
        transaction = self.create_applied_expense()
        
        url = reverse(
            "transaction-retrieve-update-destroy-view",
            args=[transaction.id],
        )
        
        response = self.client.delete(url)
        
        self.account.refresh_from_db()
        
        self.assertEqual(response.status_code, 204)
        self.assertEqual(self.account.balance, Decimal("100.00"))
        self.assertFalse(Transaction.objects.filter(id=transaction.id).exists())
        
    def test_unchecking_applied_transaction_restores_balance(self):
        transaction = self.create_applied_expense()
        
        url = reverse(
            "transaction-retrieve-update-destroy-view",
            args=[transaction.id],
        )
        
        response = self.client.patch(
            url,
            {"checked": False},
            format="json",
        )
        
        self.account.refresh_from_db()
        transaction.refresh_from_db()
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.account.balance, Decimal("100.00"))
        self.assertFalse(transaction.applied)
        
    def test_moving_applied_transaction_to_future_restores_balance(self):
        transaction = self.create_applied_expense()
        
        url = reverse(
            "transaction-retrieve-update-destroy-view",
            args=[transaction.id],
        )
        
        response = self.client.patch(
            url,
            {"date": timezone.localdate() + timedelta(days=2)},
            format="json",
        )
        
        self.account.refresh_from_db()
        transaction.refresh_from_db()
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.account.balance, Decimal("100.00"))
        self.assertFalse(transaction.applied)
    
    def test_user_cannot_update_another_users_transaction(self):
        other_user = User.objects.create_user(
            username="other",
            email="other@example.com",
            password="StrongPassword1!",
        )

        other_account = Account.objects.create(
            name="Other Account",
            user=other_user,
            initial_balance=Decimal("200.00"),
            balance=Decimal("200.00"),
            icon="landmark",
        )

        other_transaction = Transaction.objects.create(
            transaction_type=TransactionType.EXPENSE,
            amount=Decimal("50.00"),
            date=timezone.localdate(),
            account=other_account,
        )
        
        url = reverse(
            "transaction-retrieve-update-destroy-view",
            args=[other_transaction.id],
        )
        
        response = self.client.patch(
            url,
            {"amount": "99.00"},
            format="json",
        )
        
        self.assertEqual(response.status_code, 404)

        other_transaction.refresh_from_db()
        self.assertEqual(other_transaction.amount, Decimal("50.00"))
    
    def test_user_cannot_move_transaction_to_another_users_account(self):
        transaction = self.create_applied_expense()
        
        other_user = User.objects.create_user(
            username="other",
            email="other@example.com",
            password="StrongPassword1!",
        )
        
        other_account = Account.objects.create(
            name="Other Account",
            user=other_user,
            initial_balance=Decimal("200.00"),
            balance=Decimal("200.00"),
            icon="landmark",
        )
        
        url = reverse(
            "transaction-retrieve-update-destroy-view",
            args=[transaction.id],
        )
        
        response = self.client.patch(
            url,
            {"account_id": other_account.id},
            format="json",
        )
        
        self.assertEqual(response.status_code, 400)

        transaction.refresh_from_db()
        self.assertEqual(transaction.account, self.account)
        
    def test_creating_due_checked_expense_updates_balance(self):
        url = reverse("transaction-create-view")

        response = self.client.post(
            url,
            {
                "transaction_type": TransactionType.EXPENSE,
                "amount": "25.00",
                "date": timezone.localdate().isoformat(),
                "account_id": self.account.id,
                "checked": True,
            },
            format="json",
        )
        
        self.account.refresh_from_db()
        
        self.assertEqual(response.status_code, 201)
        self.assertEqual(self.account.balance, Decimal("75.00"))
        self.assertTrue(response.data["applied"])
        
        self.assertEqual(
            response.data["account"]["balance"],
            "75.00",
        )

    def test_creating_expense_with_amount_to_receive_uses_net_amount(self):
        url = reverse("transaction-create-view")
        
        response = self.client.post(
            url,
            {
                "transaction_type": TransactionType.EXPENSE,
                "amount": "100.00",
                "amount_to_receive": "90.00",
                "date": timezone.localdate().isoformat(),
                "account_id": self.account.id,
                "checked": True,
            },
            format="json",
        )
        
        self.account.refresh_from_db()
        
        self.assertEqual(response.status_code, 201)
        self.assertEqual(self.account.balance, Decimal("90.00"))
        self.assertTrue(response.data["applied"])
        
    def test_expense_rejects_amount_to_receive_greater_than_amount(self):
        url = reverse("transaction-create-view")
        
        response = self.client.post(
            url,
            {
                "transaction_type": TransactionType.EXPENSE,
                "amount": "100.00",
                "amount_to_receive": "120.00",
                "date": timezone.localdate().isoformat(),
                "account_id": self.account.id,
                "checked": True,
            },
            format="json",
        )
        
        self.assertEqual(response.status_code, 400)
        
        self.account.refresh_from_db()
        self.assertEqual(self.account.balance, Decimal("100.00"))
        self.assertIn("amount_to_receive", response.data)
        self.assertEqual(
            response.data["amount_to_receive"][0],
            "Amount to receive cannot be greater than the expense amount.",
        )

    def test_creating_income_preserves_counterparty(self):
        url = reverse("transaction-create-view")

        response = self.client.post(
            url,
            {
                "transaction_type": TransactionType.INCOME,
                "amount": "50.00",
                "date": timezone.localdate().isoformat(),
                "account_id": self.account.id,
                "checked": True,
                "counterparty": "Employer",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        transaction = Transaction.objects.get(id=response.data["id"])

        self.assertEqual(transaction.counterparty, "Employer")
        self.assertEqual(response.data["counterparty"], "Employer")

    def test_updating_income_preserves_counterparty(self):
        transaction = Transaction.objects.create(
            transaction_type=TransactionType.INCOME,
            amount=Decimal("50.00"),
            date=timezone.localdate(),
            account=self.account,
            counterparty="Old Employer",
            checked=True,
        )

        url = reverse(
            "transaction-retrieve-update-destroy-view",
            args=[transaction.id],
        )

        response = self.client.patch(
            url,
            {"counterparty": "New Employer"},
            format="json",
        )

        transaction.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(transaction.counterparty, "New Employer")
        self.assertEqual(response.data["counterparty"], "New Employer")
