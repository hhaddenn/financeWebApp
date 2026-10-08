import uuid

from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from django.db import models

# Create your models here.


class User(AbstractUser):
    email = models.EmailField(unique=True)


class LoginChallenge(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="login_challenges"
    )
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    remember_me = models.BooleanField(default=False)
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class EmailChangeRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="email_changes")
    new_email = models.EmailField()
    token_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class News(models.Model):
    title = models.CharField(max_length=120)
    description = models.TextField()
    image = models.FileField(upload_to="news/", blank=True)
    action_label = models.CharField(max_length=80, blank=True)
    action_url = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = "news item"
        verbose_name_plural = "news items"

    def __str__(self):
        return self.title


class NewsRead(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="read_news")
    news = models.ForeignKey(News, on_delete=models.CASCADE, related_name="reads")
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = (
            models.UniqueConstraint(
                fields=["user", "news"], name="unique_user_news_read"
            ),
        )


class CategoryType(models.TextChoices):
    INCOME = "income", "Income"
    EXPENSE = "expense", "Expense"
    TRANSFER = "transfer", "Transfer"


class Category(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.CharField(max_length=100, blank=True)
    icon = models.CharField(max_length=200)
    category_type = models.CharField(max_length=8, choices=CategoryType.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Subcategory(models.Model):
    name = models.CharField(max_length=50)
    icon = models.CharField(max_length=200)
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="subcategories"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
    counterparty = models.CharField(max_length=255, blank=True, null=True)
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
        default=0,
        validators=[MinValueValidator(0, "Value must positive")],
    )
    date = models.DateField()
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
    applied = models.BooleanField(default=False)
    checked = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = (
            models.CheckConstraint(
                condition=models.Q(amount_to_receive__lte=models.F("amount")),
                name="amount_to_receive_lte_amount",
            ),
        )

    def __str__(self):
        return self.name


class Budget(models.Model):
    class BudgetType(models.TextChoices):
        TOTAL = "total", "Total"
        CATEGORY = "category", "Category"
        SUBCATEGORY = "subcategory", "Subcategory"

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="budgets",
    )

    name = models.CharField(max_length=100)

    budget_type = models.CharField(
        max_length=20,
        choices=BudgetType.choices,
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )

    start_date = models.DateField()
    end_date = models.DateField()

    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="budgets",
    )

    subcategory = models.ForeignKey(
        Subcategory,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="budgets",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class RecurrenceFrequency(models.TextChoices):
    WEEKLY = "weekly", "Weekly"
    MONTHLY = "monthly", "Monthly"
    YEARLY = "yearly", "Yearly"


class RecurringTransaction(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="recurring_transactions",
    )

    name = models.CharField(max_length=50, blank=True)

    counterparty = models.CharField(
        max_length=255,
        blank=True,
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )

    transaction_type = models.CharField(
        max_length=10,
        choices=TransactionType.choices,
    )

    account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name="recurring_transactions",
    )

    subcategory = models.ForeignKey(
        Subcategory,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="recurring_transactions",
    )

    frequency = models.CharField(
        max_length=10,
        choices=RecurrenceFrequency.choices,
    )

    # Weekly: Monday, Tuesday, etc.
    day_of_week = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
    )

    # Monthly / yearly: 1-31
    day_of_month = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
    )

    # Yearly: 1-12
    month = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
    )

    # Next occurrence to be processed
    next_run_at = models.DateField(
        null=True,
        blank=True,
    )

    active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class UserSettings(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="settings",
    )

    income_color = models.CharField(
        max_length=20,
        default="#22c55e",
    )

    expense_color = models.CharField(
        max_length=20,
        default="#ef4444",
    )
    language = models.CharField(
        max_length=2,
        choices=[
            ("pt", "Português"),
            ("en", "English"),
        ],
        default="pt",
    )

    theme = models.CharField(
        max_length=10,
        choices=[
            ("light", "Light"),
            ("dark", "Dark"),
            ("system", "System"),
        ],
        default="light",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class UserCategoryPreference(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="category_preferences",
    )

    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="user_preferences",
    )

    color = models.CharField(
        max_length=20,
        default="#64748b",
    )

    hidden = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = (
            models.UniqueConstraint(
                fields=["user", "category"],
                name="unique_user_category_preference",
            ),
        )


class UserSubcategoryPreference(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="subcategory_preferences",
    )

    subcategory = models.ForeignKey(
        Subcategory,
        on_delete=models.CASCADE,
        related_name="user_preferences",
    )

    hidden = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = (
            models.UniqueConstraint(
                fields=["user", "subcategory"],
                name="unique_user_subcategory_preference",
            ),
        )
