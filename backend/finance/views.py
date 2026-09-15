import logging

from django.db import transaction as db_transaction
from rest_framework import generics, serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Account, Category, Subcategory, Transaction
from .serializers import (
    AccountSerializer,
    CategorySerializer,
    RegisterSerializer,
    SubcategorySerializer,
    TransactionSerializer,
    UserSerializer,
    LoginSerializer,
)
from .services import apply_transaction, reverse_transaction

logger = logging.getLogger(__name__)


# Create your views here.


class CookieTokenObtainPairView(TokenObtainPairView):
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        refresh_token = response.data.get("refresh")

        if refresh_token:
            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=False,  # True in production with HTTPS
                samesite="Lax",
                path="/",
            )

            response.data.pop("refresh", None)

        return response


class CookieTokenRefreshView(TokenRefreshView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get("refresh_token")

        if not refresh_token:
            return Response(
                {"refresh": ["Refresh token cookie not found."]},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = self.get_serializer(data={"refresh": refresh_token})

        serializer.is_valid(raise_exception=True)

        return Response(serializer.validated_data)


class LogoutView(generics.GenericAPIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                logger.warning("Invalid refresh token during logout", exc_info=True)

        response = Response(
            {"detail": "Successfully logged out."},
            status=status.HTTP_205_RESET_CONTENT,
        )

        response.delete_cookie(
            "refresh_token",
            path="/",
        )

        return response


# Auth
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = (AllowAny,)


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
