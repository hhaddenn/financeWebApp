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
        queryset = Transaction.objects.filter(account__user=self.request.user)

        account = self.request.query_params.get("account")
        category = self.request.query_params.get("category")
        subcategory = self.request.query_params.get("subcategory")
        tx_type = self.request.query_params.get("type")
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")

        if account:
            queryset = queryset.filter(account_id=account)

        if category:
            queryset = queryset.filter(category_id=category)

        if subcategory:
            queryset = queryset.filter(subcategory_id=subcategory)

        if tx_type:
            queryset = queryset.filter(type=tx_type)

        if start_date:
            queryset = queryset.filter(date__gte=start_date)

        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        return queryset.order_by("-date")


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
