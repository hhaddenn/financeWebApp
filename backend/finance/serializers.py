from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Account,
    Budget,
    Category,
    RecurringTransaction,
    Subcategory,
    Transaction,
    TransactionType,
)


User = get_user_model()


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
class LoginSerializer(TokenObtainPairSerializer):
    default_error_messages = {"no_active_account": "Invalid username or password."}


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
    )

    class Meta:
        model = User
        fields = ("username", "email", "password")

    def validate_username(self, value):
        value = value.strip()

        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(
                "Username already in use.",
                code="username_taken",
            )

        return value

    def validate_email(self, value):
        value = value.strip().lower()

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already exists.")

        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError(
                "Password must be at least 8 characters long."
            )

        if not any(char.isupper() for char in value):
            raise serializers.ValidationError(
                "Password must contain at least one uppercase letter."
            )

        if not any(char.islower() for char in value):
            raise serializers.ValidationError(
                "Password must contain at least one lowercase letter."
            )

        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError(
                "Password must contain at least one number."
            )

        if not any(not char.isalnum() for char in value):
            raise serializers.ValidationError(
                "Password must contain at least one special character."
            )

        return value

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email")


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, attrs):
        self.token = RefreshToken(attrs["refresh"])
        return attrs

    def save(self, **kwargs):
        self.token.blacklist()


# ---------------------------------------------------------------------------
# Account
# ---------------------------------------------------------------------------


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = "__all__"
        read_only_fields = ("user", "balance")

    def create(self, validated_data):
        validated_data["balance"] = validated_data["initial_balance"]
        validated_data["user"] = self.context["request"].user

        return Account.objects.create(**validated_data)

    def update(self, instance, validated_data):
        initial_balance = validated_data.get("initial_balance")

        if initial_balance is not None:
            validated_data["balance"] = initial_balance

        return super().update(instance, validated_data)


# ---------------------------------------------------------------------------
# Global categories
# ---------------------------------------------------------------------------


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class SubcategorySerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Subcategory
        fields = "__all__"


# ---------------------------------------------------------------------------
# Transaction
# ---------------------------------------------------------------------------


class TransactionSerializer(serializers.ModelSerializer):
    account = AccountSerializer(read_only=True)
    transfer_account = AccountSerializer(read_only=True)
    subcategory = SubcategorySerializer(read_only=True)

    counterparty = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    amount_to_receive = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        default=0,
    )

    account_id = serializers.PrimaryKeyRelatedField(
        source="account",
        queryset=Account.objects.all(),
        write_only=True,
    )

    transfer_account_id = serializers.PrimaryKeyRelatedField(
        source="transfer_account",
        queryset=Account.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )

    subcategory_id = serializers.PrimaryKeyRelatedField(
        source="subcategory",
        queryset=Subcategory.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Transaction
        fields = [
            "id",
            "date",
            "name",
            "amount",
            "amount_to_receive",
            "transaction_type",
            "counterparty",
            "account",
            "account_id",
            "transfer_account",
            "transfer_account_id",
            "subcategory",
            "subcategory_id",
            "applied",
            "checked"
        ]
        read_only_fields = [
            "applied",
        ]

    def validate(self, attrs):
        user = self.context["request"].user

        transaction_type = attrs.get(
            "transaction_type",
            getattr(self.instance, "transaction_type", None),
        )

        account = attrs.get(
            "account",
            getattr(self.instance, "account", None),
        )

        transfer_account = attrs.get(
            "transfer_account",
            getattr(self.instance, "transfer_account", None),
        )

        subcategory = attrs.get(
            "subcategory",
            getattr(self.instance, "subcategory", None),
        )

        # ---------------------------------------------------------------
        # Account ownership
        # ---------------------------------------------------------------

        if account is None:
            raise serializers.ValidationError(
                {"account": "A transaction must have an account."}
            )

        if account.user != user:
            raise serializers.ValidationError(
                {"account": "You do not own this account."}
            )

        # ---------------------------------------------------------------
        # Transfer
        # ---------------------------------------------------------------

        if transaction_type == TransactionType.TRANSFER:
            if transfer_account is None:
                raise serializers.ValidationError(
                    {"transfer_account": ("Transfers require a destination account.")}
                )

            if account == transfer_account:
                raise serializers.ValidationError(
                    {"transfer_account": ("You cannot transfer to the same account.")}
                )

            if transfer_account.user != user:
                raise serializers.ValidationError(
                    {"transfer_account": ("You do not own this account.")}
                )

            attrs.pop("subcategory", None)

            attrs["amount_to_receive"] = 0
            attrs["counterparty"] = None

        # ---------------------------------------------------------------
        # Income
        # ---------------------------------------------------------------

        elif transaction_type == TransactionType.INCOME:
            if transfer_account is not None:
                raise serializers.ValidationError(
                    {
                        "transfer_account": (
                            "Only transfers can have a destination account."
                        )
                    }
                )

            attrs["amount_to_receive"] = 0
            attrs["counterparty"] = None

            if subcategory is not None:
                if subcategory.category.category_type != transaction_type:
                    raise serializers.ValidationError(
                        {
                            "subcategory": (
                                "The subcategory does not match the transaction type."
                            )
                        }
                    )

        # ---------------------------------------------------------------
        # Expense
        # ---------------------------------------------------------------

        elif transaction_type == TransactionType.EXPENSE:
            if transfer_account is not None:
                raise serializers.ValidationError(
                    {
                        "transfer_account": (
                            "Only transfers can have a destination account."
                        )
                    }
                )

            if subcategory is not None:
                if subcategory.category.category_type != transaction_type:
                    raise serializers.ValidationError(
                        {
                            "subcategory": (
                                "The subcategory does not match the transaction type."
                            )
                        }
                    )

        return attrs

    def _get_internal_transfer_subcategory(self):
        try:
            return Subcategory.objects.get(name__iexact="Internal Transfer")
        except Subcategory.DoesNotExist:
            raise serializers.ValidationError(
                {"subcategory": ("Internal Transfer subcategory does not exist.")}
            )

    def create(self, validated_data):

        transaction_type = validated_data.get("transaction_type")

        if transaction_type == TransactionType.TRANSFER:
            validated_data["subcategory"] = self._get_internal_transfer_subcategory()
            validated_data["amount_to_receive"] = 0
            validated_data["counterparty"] = None

        elif transaction_type == TransactionType.INCOME:
            validated_data["amount_to_receive"] = 0
            validated_data["counterparty"] = None

        return super().create(validated_data)

    def update(self, instance, validated_data):

        transaction_type = validated_data.get(
            "transaction_type",
            instance.transaction_type,
        )

        if transaction_type == TransactionType.TRANSFER:
            validated_data["subcategory"] = self._get_internal_transfer_subcategory()
            validated_data["amount_to_receive"] = 0
            validated_data["counterparty"] = None

        elif transaction_type == TransactionType.INCOME:
            validated_data["amount_to_receive"] = 0
            validated_data["counterparty"] = None

        return super().update(instance, validated_data)


# ---------------------------------------------------------------------------
# Budget
# ---------------------------------------------------------------------------


class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = "__all__"
        read_only_fields = ("user",)

    def validate(self, attrs):
        budget_type = attrs.get(
            "budget_type",
            getattr(self.instance, "budget_type", None),
        )

        category = attrs.get(
            "category",
            getattr(self.instance, "category", None),
        )

        subcategory = attrs.get(
            "subcategory",
            getattr(self.instance, "subcategory", None),
        )

        start_date = attrs.get(
            "start_date",
            getattr(self.instance, "start_date", None),
        )

        end_date = attrs.get(
            "end_date",
            getattr(self.instance, "end_date", None),
        )

        # ---------------------------------------------------------------
        # Date validation
        # ---------------------------------------------------------------

        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError(
                {"end_date": ("The end date must be after or equal to the start date.")}
            )

        # ---------------------------------------------------------------
        # Budget type validation
        # ---------------------------------------------------------------

        if budget_type == Budget.BudgetType.TOTAL:
            if category is not None or subcategory is not None:
                raise serializers.ValidationError(
                    {
                        "category": (
                            "A total budget cannot have a category or subcategory."
                        ),
                        "subcategory": (
                            "A total budget cannot have a category or subcategory."
                        ),
                    }
                )

        elif budget_type == Budget.BudgetType.CATEGORY:
            if category is None:
                raise serializers.ValidationError(
                    {"category": "A category budget requires a category."}
                )

            if subcategory is not None:
                raise serializers.ValidationError(
                    {"subcategory": ("A category budget cannot have a subcategory.")}
                )

        elif budget_type == Budget.BudgetType.SUBCATEGORY:
            if subcategory is None:
                raise serializers.ValidationError(
                    {"subcategory": ("A subcategory budget requires a subcategory.")}
                )

            if category is not None and subcategory.category_id != category.id:
                raise serializers.ValidationError(
                    {
                        "subcategory": (
                            "The subcategory must belong to the selected category."
                        )
                    }
                )

        return attrs


# ---------------------------------------------------------------------------
# Recurring transactions
# ---------------------------------------------------------------------------


class RecurringTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecurringTransaction
        fields = "__all__"
        read_only_fields = ("user", "next_run_at")

    def validate(self, attrs):
        user = self.context["request"].user

        frequency = attrs.get(
            "frequency",
            getattr(self.instance, "frequency", None),
        )

        transaction_type = attrs.get(
            "transaction_type",
            getattr(self.instance, "transaction_type", None),
        )

        account = attrs.get(
            "account",
            getattr(self.instance, "account", None),
        )

        subcategory = attrs.get(
            "subcategory",
            getattr(self.instance, "subcategory", None),
        )

        time = attrs.get(
            "time",
            getattr(self.instance, "time", None),
        )

        day_of_week = attrs.get(
            "day_of_week",
            getattr(self.instance, "day_of_week", None),
        )

        day_of_month = attrs.get(
            "day_of_month",
            getattr(self.instance, "day_of_month", None),
        )

        month = attrs.get(
            "month",
            getattr(self.instance, "month", None),
        )

        # ---------------------------------------------------------------
        # Account ownership
        # ---------------------------------------------------------------

        if account is None:
            raise serializers.ValidationError(
                {"account": "A recurring transaction must have an account."}
            )

        if account.user != user:
            raise serializers.ValidationError(
                {"account": "You do not own this account."}
            )

        # ---------------------------------------------------------------
        # Transaction type
        # ---------------------------------------------------------------

        # Your current RecurringTransaction model does not have a
        # transfer_account, so transfers cannot safely be recurring.
        if transaction_type == TransactionType.TRANSFER:
            raise serializers.ValidationError(
                {"transaction_type": ("Recurring transfers are not supported.")}
            )

        # ---------------------------------------------------------------
        # Subcategory
        # ---------------------------------------------------------------

        if subcategory is not None:
            if subcategory.category.category_type != transaction_type:
                raise serializers.ValidationError(
                    {
                        "subcategory": (
                            "The subcategory does not match the transaction type."
                        )
                    }
                )

        # ---------------------------------------------------------------
        # Frequency rules
        # ---------------------------------------------------------------

        if frequency == "daily":
            if day_of_week is not None:
                raise serializers.ValidationError(
                    {"day_of_week": "Daily recurrence cannot have a day of week."}
                )

            if day_of_month is not None:
                raise serializers.ValidationError(
                    {"day_of_month": "Daily recurrence cannot have a day of month."}
                )

            if month is not None:
                raise serializers.ValidationError(
                    {"month": "Daily recurrence cannot have a month."}
                )

        elif frequency == "weekly":
            if day_of_week is None:
                raise serializers.ValidationError(
                    {"day_of_week": "Weekly recurrence requires a day of week."}
                )

            if not 0 <= day_of_week <= 6:
                raise serializers.ValidationError(
                    {"day_of_week": "Day of week must be between 0 and 6."}
                )

            if day_of_month is not None:
                raise serializers.ValidationError(
                    {"day_of_month": "Weekly recurrence cannot have a day of month."}
                )

            if month is not None:
                raise serializers.ValidationError(
                    {"month": "Weekly recurrence cannot have a month."}
                )

        elif frequency == "monthly":
            if day_of_month is None:
                # This also allows your "unknown day" idea if you
                # decide monthly-without-day should be supported.
                pass
            elif not 1 <= day_of_month <= 31:
                raise serializers.ValidationError(
                    {"day_of_month": "Day of month must be between 1 and 31."}
                )

            if day_of_week is not None:
                raise serializers.ValidationError(
                    {"day_of_week": "Monthly recurrence cannot have a day of week."}
                )

            if month is not None:
                raise serializers.ValidationError(
                    {"month": "Monthly recurrence cannot have a month."}
                )

        elif frequency == "yearly":
            if month is None:
                raise serializers.ValidationError(
                    {"month": "Yearly recurrence requires a month."}
                )

            if not 1 <= month <= 12:
                raise serializers.ValidationError(
                    {"month": "Month must be between 1 and 12."}
                )

            if day_of_month is not None and not 1 <= day_of_month <= 31:
                raise serializers.ValidationError(
                    {"day_of_month": "Day of month must be between 1 and 31."}
                )

            if day_of_week is not None:
                raise serializers.ValidationError(
                    {"day_of_week": "Yearly recurrence cannot have a day of week."}
                )

        # ---------------------------------------------------------------
        # Time
        # ---------------------------------------------------------------

        # If you want every recurring transaction to have a time,
        # uncomment this:
        #
        # if time is None:
        #     raise serializers.ValidationError(
        #         {"time": "A recurrence requires a time."}
        #     )

        return attrs
