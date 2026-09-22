from django.db import transaction as db_transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, pagination
from rest_framework.permissions import IsAuthenticated

from ..models import Transaction
from ..serializers import TransactionSerializer
from ..services import apply_transaction, reverse_transaction


class TransactionPagination(pagination.PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class TransactionsList(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = (IsAuthenticated,)
    pagination_class = TransactionPagination

    def get_queryset(self):
        queryset = Transaction.objects.filter(
            account__user=self.request.user
        ).select_related(
            "account",
            "transfer_account",
            "subcategory",
            "subcategory__category",
        )

        account = self.request.query_params.get("account")
        category = self.request.query_params.get("category")
        subcategory = self.request.query_params.get("subcategory")
        tx_type = self.request.query_params.get("type")
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        search = self.request.query_params.get("search")
        checked = self.request.query_params.get("checked")

        if account:
            queryset = queryset.filter(
                Q(account_id=account) | Q(transfer_account_id=account)
            )

        if category:
            queryset = queryset.filter(subcategory__category_id=category)

        if subcategory:
            queryset = queryset.filter(subcategory_id=subcategory)

        if tx_type:
            queryset = queryset.filter(transaction_type=tx_type)

        if start_date:
            queryset = queryset.filter(date__gte=start_date)

        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(counterparty__icontains=search)
            )

        if checked in {"true", "false"}:
            queryset = queryset.filter(checked=checked == "true")

        return queryset.order_by("-date", "-id")


class TransactionCreate(generics.CreateAPIView):
    serializer_class = TransactionSerializer
    permission_classes = (IsAuthenticated,)

    @db_transaction.atomic
    def perform_create(self, serializer):
        transaction = serializer.save()

        if transaction.checked and transaction.date <= timezone.localdate():
            apply_transaction(transaction)

            transaction.applied = True
            transaction.save(update_fields=["applied"])


class TransactionDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TransactionSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Transaction.objects.filter(
            account__user=self.request.user
        ).select_related(
            "account",
            "transfer_account",
            "subcategory",
            "subcategory__category",
        )

    @db_transaction.atomic
    def perform_update(self, serializer):
        old_transaction = self.get_object()

        # Remove the old financial effect if it was already applied.
        if old_transaction.applied:
            reverse_transaction(old_transaction)

        # Save the user's changes, including checked.
        new_transaction = serializer.save()

        # Apply the new transaction only when:
        # 1. The user marked it as paid.
        # 2. Its date has arrived.
        if new_transaction.checked and new_transaction.date <= timezone.localdate():
            apply_transaction(new_transaction)

            new_transaction.applied = True
            new_transaction.save(update_fields=["applied"])
        else:
            # The transaction should not affect the balance.
            new_transaction.applied = False
            new_transaction.save(update_fields=["applied"])

    @db_transaction.atomic
    def perform_destroy(self, instance):
        if instance.applied:
            reverse_transaction(instance)

        instance.delete()
