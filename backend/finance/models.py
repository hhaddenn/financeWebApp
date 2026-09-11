from django.core.validators import MinValueValidator
from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

class User(AbstractUser):
    email = models.EmailField(unique=True)

class CategoryType(models.TextChoices):
    INCOME = "income", "Income"
    EXPENSE = "expense", "Expense"
    TRANSFER = "transfer", "Transfer"


class Category(models.Model):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=100)
    icon = models.CharField(max_length=200)
    category_type = models.CharField(max_length=8, choices=CategoryType.choices)

    def __str__(self):
        return self.name


class Subcategory(models.Model):
    name = models.CharField(max_length=50)
    icon = models.CharField(max_length=200)
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="subcategories"
    )

    class Meta:
        constraints = (
            models.UniqueConstraint(
                fields=["category", "name"], name="unique_subcategory_name_per_category"
            ),
        )

    def __str__(self):
        return self.name


class Account(models.Model):
    name = models.CharField(max_length=50)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="accounts")
    initial_balance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )
    balance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )
    icon = models.CharField(max_length=200)

    class Meta:
        constraints = (
            models.UniqueConstraint(
                fields=["user", "name"], name="unique_account_name_per_user"
            ),
        )

    def __str__(self):
        return self.name


class TransactionType(models.TextChoices):
    INCOME = "income", "Income"
    EXPENSE = "expense", "Expense"
    TRANSFER = "transfer", "Transfer"


class Transaction(models.Model):
    name = models.CharField(max_length=50, blank=True)
    description = models.CharField(max_length=100, blank=True)
    transaction_type = models.CharField(max_length=10, choices=TransactionType.choices)
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0, "Value must positive")],
    )
    amount_to_receive = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0, "Value must positive")],
    )
    date = models.DateTimeField()
    # Main/source account
    account = models.ForeignKey(
        Account,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions",
    )

    # Destination account (used for transfers)
    transfer_account = models.ForeignKey(
        Account,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="incoming_transfers",
    )
    subcategory = models.ForeignKey(
        Subcategory, on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        constraints = (
            models.CheckConstraint(
                condition=models.Q(amount_to_receive__lte=models.F("amount")),
                name="amount_to_receive_lte_amount",
            ),
        )

    def __str__(self):
        return self.name
