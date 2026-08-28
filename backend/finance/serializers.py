from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Account, Category, Subcategory, Transaction, TransactionType


# User
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    class Meta:
        model = User
        fields = ("username", "email", "password")

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
                    {
                        "transfer_account": (
                            "Transfers require a destination account."
                        )
                    }
                )
    
            if account == transfer_account:
                raise serializers.ValidationError(
                    {
                        "transfer_account": (
                            "You cannot transfer to the same account."
                        )
                    }
                )
    
            if transfer_account.user != user:
                raise serializers.ValidationError(
                    {"transfer_account": "You do not own this account."}
                )
    
        elif transfer_account is not None:
            raise serializers.ValidationError(
                {
                    "transfer_account": (
                        "Only transfers can have a destination account."
                    )
                }
            )
    
        return attrs
    
    
    