from django.db import transaction as db_transaction
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Account, Category, Subcategory, Transaction
from .serializers import (
    AccountSerializer,
    CategorySerializer,
    SubcategorySerializer,
    TransactionSerializer,
)
from .services import apply_transaction, reverse_transaction

# Create your views here.


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
        return Transaction.objects.filter(
            account__user=self.request.user
        )


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
        return Transaction.objects.filter(
            account__user=self.request.user
        )

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
