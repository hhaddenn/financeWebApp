from django.db import transaction as db_transaction
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from ..models import Transaction
from ..serializers import TransactionSerializer
from ..services import apply_transaction, reverse_transaction


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
