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
        read_only_fields = ("user",)


# ---------------------------------------------------------------------------
# Global categories
# ---------------------------------------------------------------------------


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class SubcategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Subcategory
        fields = "__all__"


# ---------------------------------------------------------------------------
# Transaction
# ---------------------------------------------------------------------------


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = "__all__"

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
        # Transfer validation
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
                    {"transfer_account": "You do not own this account."}
                )

            if subcategory is not None:
                raise serializers.ValidationError(
                    {"subcategory": ("Transfers cannot have a subcategory.")}
                )

        # ---------------------------------------------------------------
        # Non-transfer validation
        # ---------------------------------------------------------------

        else:
            if transfer_account is not None:
                raise serializers.ValidationError(
                    {
                        "transfer_account": (
                            "Only transfers can have a destination account."
                        )
                    }
                )

        # ---------------------------------------------------------------
        # Subcategory validation
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

        return attrs


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
