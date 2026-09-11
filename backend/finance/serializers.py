from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Account, Category, Subcategory, Transaction, TransactionType


User = get_user_model()

# User
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
    )

    class Meta:
        model = User
        fields = ("username", "email", "password")

    def validate_email(self, value):
        value = value.strip().lower()

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")

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

        validate_password(value)

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


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = "__all__"
        read_only_fields = ("user",)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class SubcategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Subcategory
        fields = "__all__"


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

        if account is not None and account.user != user:
            raise serializers.ValidationError(
                {"account": "You do not own this account."}
            )

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

        elif transfer_account is not None:
            raise serializers.ValidationError(
                {"transfer_account": ("Only transfers can have a destination account.")}
            )

        return attrs
