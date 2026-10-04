from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from finance.models import Account, Transaction, TransactionType
from finance.scheduled import process_due_transactions
from finance.services import apply_transaction, reverse_transaction

User = get_user_model()

class TransactionServiceTests(TestCase):
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
        
        self.transfer_account = Account.objects.create(
            name="Transfer Account",
            user=self.user,
            initial_balance=Decimal("50.00"),
            balance=Decimal("50.00"),
            icon="wallet",
        )
    
    def test_apply_income_increases_account_balance(self):
        transaction = Transaction.objects.create(
            transaction_type=TransactionType.INCOME,
            amount=Decimal("25.00"),
            date=date(2026, 1, 15),
            account=self.account,
        )
        
        apply_transaction(transaction)
    
    def test_unchecked_due_transaction_is_not_applied(self):
        transaction = Transaction.objects.create(
            transaction_type=TransactionType.EXPENSE,
            amount=Decimal("25.00"),
            date=timezone.localdate(),
            account=self.account,
            checked=False,
        )
        
        process_due_transactions()
        
        self.account.refresh_from_db()
        transaction.refresh_from_db()
        
        self.assertEqual(self.account.initial_balance, self.account.balance)
        self.assertFalse(transaction.applied)
        
    def test_future_transaction_is_not_applied(self):
        transaction = Transaction.objects.create(
            transaction_type=TransactionType.EXPENSE,
            amount=Decimal("25.00"),
            date=timezone.localdate() + timedelta(days=2),
            account=self.account,
            checked=False,
        )
        
        process_due_transactions()
        
        self.account.refresh_from_db()
        transaction.refresh_from_db()
        
        self.assertEqual(self.account.initial_balance, self.account.balance)
        self.assertFalse(transaction.applied)
        
    def test_due_checked_transaction_is_applied(self):
        transaction = Transaction.objects.create(
            transaction_type=TransactionType.EXPENSE,
            amount=Decimal("25.00"),
            date=timezone.localdate(),
            account=self.account,
            checked=True,
        )
        
        process_due_transactions()
        
        self.account.refresh_from_db()
        transaction.refresh_from_db()
        
        self.assertEqual(self.account.balance, Decimal("75.00"))
        self.assertTrue(transaction.applied)
    
    def test_already_applied_transaction_is_not_applied_again(self):
        transaction = Transaction.objects.create(
            transaction_type=TransactionType.EXPENSE,
            amount=Decimal("25.00"),
            date=timezone.localdate(),
            account=self.account,
            checked=True,
            applied=True,
        )
        
        process_due_transactions()
        
        self.account.refresh_from_db()
        transaction.refresh_from_db()
        
        self.assertEqual(self.account.balance, Decimal("100.00"))
        self.assertTrue(transaction.applied)
        
    def test_transfer_moves_balance_between_accounts(self):
        transaction = Transaction.objects.create(
            transaction_type=TransactionType.TRANSFER,
            amount=Decimal("25.00"),
            date=timezone.localdate(),
            account=self.account,
            transfer_account=self.transfer_account,
            checked=True,
        )

        apply_transaction(transaction)
        
        self.account.refresh_from_db()
        self.transfer_account.refresh_from_db()
        
        self.assertEqual(self.account.balance, self.account.initial_balance-25)
        self.assertEqual(self.transfer_account.balance, self.transfer_account.initial_balance+25)
        
    def test_transfer_to_same_account_is_rejected(self):
        transaction = Transaction.objects.create(
            transaction_type=TransactionType.TRANSFER,
            amount=Decimal("25.00"),
            date=timezone.localdate(),
            account=self.account,
            transfer_account=self.account,
            checked=True,
        )
        
        with self.assertRaises(ValueError):
            apply_transaction(transaction)
            
        self.account.refresh_from_db()
        self.transfer_account.refresh_from_db()
            
        self.assertEqual(self.account.balance, Decimal("100.00"))
    
    def test_reverse_income_restores_original_balance(self):
        transaction = Transaction.objects.create(
            transaction_type=TransactionType.INCOME,
            amount=Decimal("25.00"),
            date=timezone.localdate(),
            account=self.account,
        )
        
        apply_transaction(transaction)
        reverse_transaction(transaction)
        self.account.refresh_from_db()
        
        self.assertEqual(self.account.balance, Decimal("100.00"))
    
    def test_reverse_expense_restores_original_balance(self):
            transaction = Transaction.objects.create(
                transaction_type=TransactionType.EXPENSE,
                amount=Decimal("25.00"),
                date=timezone.localdate(),
                account=self.account,
            )
            
            apply_transaction(transaction)
            reverse_transaction(transaction)
            self.account.refresh_from_db()
            
            self.assertEqual(self.account.balance, Decimal("100.00"))
    
    def test_reverse_transfer_restores_original_balance(self):
        transaction = Transaction.objects.create(
            transaction_type=TransactionType.TRANSFER,
            amount=Decimal("25.00"),
            date=timezone.localdate(),
            account=self.account,
            transfer_account=self.transfer_account,
        )
                
        apply_transaction(transaction)
        reverse_transaction(transaction)
        
        self.account.refresh_from_db()
        self.transfer_account.refresh_from_db()
                
        self.assertEqual(self.account.balance, Decimal("100.00"))
        self.assertEqual(self.transfer_account.balance, Decimal("50.00"))
        
    def test_expense_with_amount_to_receive_only_deducts_net_amount(self):
        transaction = Transaction.objects.create(
            transaction_type=TransactionType.EXPENSE,
            amount=Decimal("100.00"),
            amount_to_receive=Decimal("90.00"),
            date=timezone.localdate(),
            account=self.account,
        )
        
        apply_transaction(transaction)
        
        self.account.refresh_from_db()
        transaction.refresh_from_db()
        
        self.assertEqual(self.account.balance, Decimal("90.00"))
        
    def test_reverse_expense_with_amount_to_receive_restores_original_balance(self):
        transaction = Transaction.objects.create(
            transaction_type=TransactionType.EXPENSE,
            amount=Decimal("100.00"),
            amount_to_receive=Decimal("90.00"),
            date=timezone.localdate(),
            account=self.account,
        )

        apply_transaction(transaction)
        reverse_transaction(transaction)

        self.account.refresh_from_db()

        self.assertEqual(self.account.balance, Decimal("100.00"))