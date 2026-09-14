from django.db import transaction as db_transaction
from rest_framework import generics, serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenRefreshSerializer,
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Account, Category, Subcategory, Transaction
from .serializers import (
    AccountSerializer,
    CategorySerializer,
    LogoutSerializer,
    RegisterSerializer,
    SubcategorySerializer,
    TransactionSerializer,
    UserSerializer,
)
from .services import apply_transaction, reverse_transaction


# Create your views here.
class CookieTokenObtainPairSerializer(TokenObtainPairSerializer):
    pass


class CookieTokenObtainPairView(TokenObtainPairView):
    serializer_class = TokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        refresh_token = response.data.get("refresh")

        if refresh_token:
            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=False,
                samesite="Lax",
                path="/",
            )

            response.data.pop("refresh", None)

        return response


class CookieTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        request = self.context["request"]

        print("COOKIES:", request.COOKIES)

        refresh_token = request.COOKIES.get("refresh_token")

        print(
            "REFRESH TOKEN FOUND:",
            bool(refresh_token),
        )

        if not refresh_token:
            raise serializers.ValidationError(
                {"refresh": ["Refresh token cookie not found."]}
            )

        attrs["refresh"] = refresh_token

        return super().validate(attrs)


class CookieTokenRefreshView(TokenRefreshView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get("refresh_token")

        print("COOKIES:", request.COOKIES)
        print("REFRESH TOKEN FOUND:", bool(refresh_token))

        if not refresh_token:
            return Response(
                {"refresh": ["Refresh token cookie not found."]},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = TokenRefreshSerializer(
            data={"refresh": refresh_token},
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)

        return Response(serializer.validated_data)


# Auth
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = (AllowAny,)


class LogoutView(generics.GenericAPIView):
    serializer_class = LogoutSerializer
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"detail": "Successfully logged out."},
            status=status.HTTP_205_RESET_CONTENT,
        )


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user


# Categories
class CategoriesList(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


# Subcategories
class SubcategoriesList(generics.ListAPIView):
    queryset = Subcategory.objects.all()
    serializer_class = SubcategorySerializer


# Accounts
class AccountsList(generics.ListAPIView):
    serializer_class = AccountSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)


class AccountCreate(generics.CreateAPIView):
    serializer_class = AccountSerializer
    permission_classes = (IsAuthenticated,)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AccountDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AccountSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)


# Transactions
class TransactionsList(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Transaction.objects.filter(account__user=self.request.user)


class TransactionCreate(generics.CreateAPIView):
    serializer_class = TransactionSerializer
    permission_classes = (IsAuthenticated,)

    @db_transaction.atomic
    def perform_create(self, serializer):
        transaction = serializer.save()
        apply_transaction(transaction)


class TransactionDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TransactionSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Transaction.objects.filter(account__user=self.request.user)

    @db_transaction.atomic
    def perform_update(self, serializer):
        old_transaction = self.get_object()

        reverse_transaction(old_transaction)

        new_transaction = serializer.save()

        apply_transaction(new_transaction)

    @db_transaction.atomic
    def perform_destroy(self, instance):
        reverse_transaction(instance)

        instance.delete()
